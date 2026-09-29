import shaderSource from './ising.wgsl?raw';

export type CursorState = {
  active: boolean;
  painting: boolean;
  forceHot: boolean;
  x: number;
  y: number;
  radius: number;
};

export type IsingStats = {
  energy: number;
  magnetization: number;
  signedMagnetization: number;
};

type Pipelines = {
  randomize: GPUComputePipeline;
  clearBlue: GPUComputePipeline;
  resize: GPUComputePipeline;
  update: GPUComputePipeline;
  field: GPUComputePipeline;
  blurSpinsHorizontal: GPUComputePipeline;
  blurTextureHorizontal: GPUComputePipeline;
  blurTextureVertical: GPUComputePipeline;
  select: GPUComputePipeline;
  paint: GPUComputePipeline;
  stats: GPUComputePipeline;
  render: GPURenderPipeline;
};

type RetiredResources = {
  buffers: GPUBuffer[];
  readback?: GPUBuffer;
  textures?: GPUTexture[];
};

const workgroups = (value: number, size: number): number => Math.ceil(value / size);

export class GpuIsing {
  readonly canvas: HTMLCanvasElement;
  readonly device: GPUDevice;

  width = 1;
  height = 1;
  density = 1;

  private readonly context: GPUCanvasContext;
  private readonly format: GPUTextureFormat;
  private readonly pipelines: Pipelines;
  private readonly simUniform: GPUBuffer;
  private readonly brushUniform: GPUBuffer;
  private readonly statsUniform: GPUBuffer;
  private readonly renderUniform: GPUBuffer;
  private readonly blurUniforms: [GPUBuffer, GPUBuffer];
  private readonly selectionBuffer: GPUBuffer;
  private readonly sampler: GPUSampler;

  private spinBuffers: [GPUBuffer, GPUBuffer] | null = null;
  private currentIndex = 0;
  private fieldTexture: GPUTexture | null = null;
  private fieldViews: GPUTextureView[] = [];
  private blurTextures: [GPUTexture, GPUTexture] | null = null;
  private blurViews: [GPUTextureView, GPUTextureView] | null = null;
  private statsOutput: GPUBuffer | null = null;
  private statsReadback: GPUBuffer | null = null;

  private randomGroups: GPUBindGroup[] = [];
  private clearGroups: GPUBindGroup[] = [];
  private updateGroups: GPUBindGroup[] = [];
  private fieldGroups: GPUBindGroup[] = [];
  private selectGroups: GPUBindGroup[] = [];
  private paintGroups: GPUBindGroup[] = [];
  private statsGroups: GPUBindGroup[] = [];
  private blurPrimaryHorizontalGroups: GPUBindGroup[] = [];
  private blurPrimaryVerticalGroup: GPUBindGroup | null = null;
  private blurSecondaryHorizontalGroup: GPUBindGroup | null = null;
  private blurSecondaryVerticalGroup: GPUBindGroup | null = null;
  private renderGroup: GPUBindGroup | null = null;

  private stepNumber = 0;
  private fieldDirty = true;
  private lastBlurRadius = -1;
  private lastSecondaryRadius = -1;

  constructor(device: GPUDevice, format: GPUTextureFormat, canvas: HTMLCanvasElement) {
    this.device = device;
    this.format = format;
    this.canvas = canvas;

    const context = canvas.getContext('webgpu');
    if (!context) throw new Error('Could not create a WebGPU canvas context.');
    this.context = context;
    this.context.configure({
      device,
      format,
      alphaMode: 'opaque',
    });

    const module = device.createShaderModule({ label: 'Ising shaders', code: shaderSource });
    this.pipelines = {
      randomize: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'randomize' } }),
      clearBlue: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'clear_blue' } }),
      resize: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'resize_grid' } }),
      update: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'metropolis' } }),
      field: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'write_field' } }),
      blurSpinsHorizontal: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'blur_spins_horizontal' } }),
      blurTextureHorizontal: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'blur_texture_horizontal' } }),
      blurTextureVertical: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'blur_texture_vertical' } }),
      select: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'select_spin' } }),
      paint: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'paint' } }),
      stats: device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'reduce_stats' } }),
      render: device.createRenderPipeline({
        layout: 'auto',
        vertex: { module, entryPoint: 'fullscreen_vertex' },
        fragment: { module, entryPoint: 'field_fragment', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      }),
    };

    this.simUniform = device.createBuffer({
      label: 'Ising simulation uniforms',
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.brushUniform = device.createBuffer({
      label: 'Ising brush uniforms',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.statsUniform = device.createBuffer({
      label: 'Ising statistics uniforms',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.renderUniform = device.createBuffer({
      label: 'Ising render uniforms',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.blurUniforms = [0, 1].map((index) => device.createBuffer({
      label: `Ising blur uniforms ${index}`,
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })) as [GPUBuffer, GPUBuffer];
    this.selectionBuffer = device.createBuffer({
      label: 'Ising selected paint spin',
      size: 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.sampler = device.createSampler({
      label: 'Ising field sampler',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    });
  }

  resize(width: number, height: number, density: number, preserve = true): void {
    if (width === this.width && height === this.height && this.spinBuffers) {
      this.density = density;
      return;
    }

    const oldWidth = this.width;
    const oldHeight = this.height;
    const oldBuffers = this.spinBuffers;
    const oldTexture = this.fieldTexture;
    const oldBlurTextures = this.blurTextures;
    const oldStatsOutput = this.statsOutput;
    const oldStatsReadback = this.statsReadback;
    const oldCurrent = oldBuffers?.[this.currentIndex] ?? null;

    this.width = width;
    this.height = height;
    this.density = density;
    this.currentIndex = 0;
    this.canvas.width = width;
    this.canvas.height = height;
    this.allocateResources();

    if (preserve && oldCurrent) {
      this.writeSimParams(this.randomSeed(), this.stepNumber, 0, 0, oldWidth, oldHeight);
      const group = this.device.createBindGroup({
        label: 'Ising resize bind group',
        layout: this.pipelines.resize.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: oldCurrent } },
          { binding: 1, resource: { buffer: this.currentBuffer } },
          { binding: 2, resource: { buffer: this.simUniform } },
        ],
      });
      const encoder = this.device.createCommandEncoder({ label: 'Resize Ising grid' });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.pipelines.resize);
      pass.setBindGroup(0, group);
      pass.dispatchWorkgroups(workgroups(width, 8), workgroups(height, 8));
      pass.end();
      this.device.queue.submit([encoder.finish()]);
    } else {
      this.randomize();
    }

    if (oldBuffers) {
      this.retire({
        buffers: [oldBuffers[0], oldBuffers[1], ...(oldStatsOutput ? [oldStatsOutput] : [])],
        readback: oldStatsReadback ?? undefined,
        textures: [oldTexture, ...(oldBlurTextures ?? [])].filter((texture): texture is GPUTexture => Boolean(texture)),
      });
    }
    this.fieldDirty = true;
    this.lastBlurRadius = -1;
    this.lastSecondaryRadius = -1;
  }

  randomize(): void {
    this.stepNumber = 0;
    this.writeSimParams(this.randomSeed(), 0, 0, 0);
    const encoder = this.device.createCommandEncoder({ label: 'Randomize Ising state' });
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipelines.randomize);
    pass.setBindGroup(0, this.randomGroups[this.currentIndex]);
    pass.dispatchWorkgroups(workgroups(this.width, 8), workgroups(this.height, 8));
    pass.end();
    this.device.queue.submit([encoder.finish()]);
    this.fieldDirty = true;
  }

  clearBlue(): void {
    this.stepNumber = 0;
    this.writeSimParams(0, 0, 0, 0);
    const encoder = this.device.createCommandEncoder({ label: 'Clear Ising state to blue' });
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipelines.clearBlue);
    pass.setBindGroup(0, this.clearGroups[this.currentIndex]);
    pass.dispatchWorkgroups(workgroups(this.width, 8), workgroups(this.height, 8));
    pass.end();
    this.device.queue.submit([encoder.finish()]);
    this.fieldDirty = true;
  }

  step(temperature: number, halfSteps: number): void {
    for (let index = 0; index < halfSteps; index += 1) {
      const phase = this.stepNumber & 1;
      this.writeSimParams(this.randomSeed(), this.stepNumber, temperature, phase);
      const encoder = this.device.createCommandEncoder({ label: 'Advance Ising state' });
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.pipelines.update);
      pass.setBindGroup(0, this.updateGroups[this.currentIndex]);
      pass.dispatchWorkgroups(workgroups(this.width, 8), workgroups(this.height, 8));
      pass.end();
      this.device.queue.submit([encoder.finish()]);
      this.currentIndex = 1 - this.currentIndex;
      this.stepNumber += 1;
    }
    if (halfSteps > 0) this.fieldDirty = true;
  }

  paintSegment(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    radius: number,
    select: boolean,
    forceHot: boolean,
  ): void {
    const minX = Math.floor(Math.min(startX, endX) - radius);
    const minY = Math.floor(Math.min(startY, endY) - radius);
    const maxX = Math.ceil(Math.max(startX, endX) + radius);
    const maxY = Math.ceil(Math.max(startY, endY) + radius);
    const extentX = maxX - minX + 1;
    const extentY = maxY - minY + 1;
    this.writeBrushParams(minX, minY, extentX, extentY, startX, startY, endX, endY, radius, forceHot);

    const encoder = this.device.createCommandEncoder({ label: 'Paint Ising spins' });
    if (select) {
      const selectionPass = encoder.beginComputePass();
      selectionPass.setPipeline(this.pipelines.select);
      selectionPass.setBindGroup(0, this.selectGroups[this.currentIndex]);
      selectionPass.dispatchWorkgroups(1);
      selectionPass.end();
    }
    const paintPass = encoder.beginComputePass();
    paintPass.setPipeline(this.pipelines.paint);
    paintPass.setBindGroup(0, this.paintGroups[this.currentIndex]);
    paintPass.dispatchWorkgroups(workgroups(extentX, 8), workgroups(extentY, 8));
    paintPass.end();
    this.device.queue.submit([encoder.finish()]);
    this.fieldDirty = true;
  }

  draw(scale: number, radius: number, microOpacity: number, cursor: CursorState): void {
    if (!this.renderGroup || !this.blurPrimaryVerticalGroup || !this.blurSecondaryHorizontalGroup || !this.blurSecondaryVerticalGroup) return;
    const secondaryRadius = scale > 1 ? Math.max(1, Math.round(radius * 0.45)) : 0;
    const rebuildObservation = this.fieldDirty
      || radius !== this.lastBlurRadius
      || secondaryRadius !== this.lastSecondaryRadius;
    const encoder = this.device.createCommandEncoder({ label: 'Render Ising field' });

    if (this.fieldDirty) {
      this.writeSimParams(0, this.stepNumber, 0, 0);
      const fieldPass = encoder.beginComputePass();
      fieldPass.setPipeline(this.pipelines.field);
      fieldPass.setBindGroup(0, this.fieldGroups[this.currentIndex]);
      fieldPass.dispatchWorkgroups(workgroups(this.width, 8), workgroups(this.height, 8));
      fieldPass.end();
      this.fieldDirty = false;
    }

    if (rebuildObservation) {
      this.writeBlurParams(this.blurUniforms[0], radius);
      this.writeBlurParams(this.blurUniforms[1], secondaryRadius);

      const horizontalPass = encoder.beginComputePass({ label: 'Horizontal Ising observation blur' });
      horizontalPass.setPipeline(this.pipelines.blurSpinsHorizontal);
      horizontalPass.setBindGroup(0, this.blurPrimaryHorizontalGroups[this.currentIndex]);
      horizontalPass.dispatchWorkgroups(workgroups(this.height, 64));
      horizontalPass.end();

      const verticalPass = encoder.beginComputePass({ label: 'Vertical Ising observation blur' });
      verticalPass.setPipeline(this.pipelines.blurTextureVertical);
      verticalPass.setBindGroup(0, this.blurPrimaryVerticalGroup);
      verticalPass.dispatchWorkgroups(workgroups(this.width, 64));
      verticalPass.end();

      if (secondaryRadius > 0) {
        const secondaryHorizontalPass = encoder.beginComputePass({ label: 'Secondary horizontal Ising blur' });
        secondaryHorizontalPass.setPipeline(this.pipelines.blurTextureHorizontal);
        secondaryHorizontalPass.setBindGroup(0, this.blurSecondaryHorizontalGroup);
        secondaryHorizontalPass.dispatchWorkgroups(workgroups(this.height, 64));
        secondaryHorizontalPass.end();

        const secondaryVerticalPass = encoder.beginComputePass({ label: 'Secondary vertical Ising blur' });
        secondaryVerticalPass.setPipeline(this.pipelines.blurTextureVertical);
        secondaryVerticalPass.setBindGroup(0, this.blurSecondaryVerticalGroup);
        secondaryVerticalPass.dispatchWorkgroups(workgroups(this.width, 64));
        secondaryVerticalPass.end();
      }

      this.lastBlurRadius = radius;
      this.lastSecondaryRadius = secondaryRadius;
    }

    this.writeRenderParams(scale, radius, microOpacity, cursor);
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0.035, g: 0.043, b: 0.063, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    renderPass.setPipeline(this.pipelines.render);
    renderPass.setBindGroup(0, this.renderGroup);
    renderPass.draw(3);
    renderPass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  async readStats(): Promise<IsingStats> {
    const output = this.statsOutput;
    const readback = this.statsReadback;
    const group = this.statsGroups[this.currentIndex];
    if (!output || !readback || !group) return { energy: 0, magnetization: 0, signedMagnetization: 0 };

    const groupsX = workgroups(this.width, 16);
    const groupsY = workgroups(this.height, 16);
    const params = new Uint32Array([this.width, this.height, groupsX, 0]);
    this.device.queue.writeBuffer(this.statsUniform, 0, params);

    const encoder = this.device.createCommandEncoder({ label: 'Read Ising statistics' });
    encoder.clearBuffer(output);
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipelines.stats);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroups(groupsX, groupsY);
    pass.end();
    encoder.copyBufferToBuffer(output, 0, readback, 0, 8);
    this.device.queue.submit([encoder.finish()]);

    await readback.mapAsync(GPUMapMode.READ);
    const values = new Int32Array(readback.getMappedRange());
    const magnetization = values[0];
    const energy = values[1];
    readback.unmap();
    const count = this.width * this.height;
    return {
      magnetization: Math.abs(magnetization / count),
      signedMagnetization: magnetization / count,
      energy: energy / count,
    };
  }

  private get currentBuffer(): GPUBuffer {
    if (!this.spinBuffers) throw new Error('Ising grid has not been allocated.');
    return this.spinBuffers[this.currentIndex];
  }

  private allocateResources(): void {
    const spinBytes = this.width * this.height * 4;
    this.spinBuffers = [0, 1].map((index) => this.device.createBuffer({
      label: `Ising spin buffer ${index}`,
      size: spinBytes,
      usage: GPUBufferUsage.STORAGE,
    })) as [GPUBuffer, GPUBuffer];

    this.fieldTexture = this.device.createTexture({
      label: 'Ising microscopic field',
      size: { width: this.width, height: this.height },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.fieldViews = [this.fieldTexture.createView()];
    this.blurTextures = [0, 1].map((index) => this.device.createTexture({
      label: `Ising full-resolution blur ${index}`,
      size: { width: this.width, height: this.height },
      format: 'rgba16float',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    })) as [GPUTexture, GPUTexture];
    this.blurViews = this.blurTextures.map((texture) => texture.createView()) as [GPUTextureView, GPUTextureView];

    this.statsOutput = this.device.createBuffer({
      label: 'Ising statistics accumulator',
      size: 8,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    this.statsReadback = this.device.createBuffer({
      label: 'Ising statistics readback',
      size: 8,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    this.createBindGroups();
  }

  private createBindGroups(): void {
    if (!this.spinBuffers || !this.fieldTexture || !this.blurViews || !this.statsOutput) return;
    const fullFieldView = this.fieldTexture.createView();

    this.randomGroups = this.spinBuffers.map((buffer) => this.device.createBindGroup({
      layout: this.pipelines.randomize.getBindGroupLayout(0),
      entries: [
        { binding: 1, resource: { buffer } },
        { binding: 2, resource: { buffer: this.simUniform } },
      ],
    }));
    this.clearGroups = this.spinBuffers.map((buffer) => this.device.createBindGroup({
      layout: this.pipelines.clearBlue.getBindGroupLayout(0),
      entries: [
        { binding: 1, resource: { buffer } },
        { binding: 2, resource: { buffer: this.simUniform } },
      ],
    }));
    this.updateGroups = [0, 1].map((input) => this.device.createBindGroup({
      layout: this.pipelines.update.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.spinBuffers![input] } },
        { binding: 1, resource: { buffer: this.spinBuffers![1 - input] } },
        { binding: 2, resource: { buffer: this.simUniform } },
      ],
    }));
    this.fieldGroups = this.spinBuffers.map((buffer) => this.device.createBindGroup({
      layout: this.pipelines.field.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer } },
        { binding: 2, resource: { buffer: this.simUniform } },
        { binding: 3, resource: this.fieldViews[0] },
      ],
    }));
    this.selectGroups = this.spinBuffers.map(() => this.device.createBindGroup({
      layout: this.pipelines.select.getBindGroupLayout(0),
      entries: [
        { binding: 4, resource: { buffer: this.selectionBuffer } },
        { binding: 5, resource: { buffer: this.brushUniform } },
        { binding: 15, resource: this.blurViews![1] },
      ],
    }));
    this.paintGroups = this.spinBuffers.map((buffer) => this.device.createBindGroup({
      layout: this.pipelines.paint.getBindGroupLayout(0),
      entries: [
        { binding: 1, resource: { buffer } },
        { binding: 4, resource: { buffer: this.selectionBuffer } },
        { binding: 5, resource: { buffer: this.brushUniform } },
      ],
    }));
    this.statsGroups = this.spinBuffers.map((buffer) => this.device.createBindGroup({
      layout: this.pipelines.stats.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer } },
        { binding: 6, resource: { buffer: this.statsOutput! } },
        { binding: 7, resource: { buffer: this.statsUniform } },
      ],
    }));
    this.blurPrimaryHorizontalGroups = this.spinBuffers.map((buffer) => this.device.createBindGroup({
      layout: this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer } },
        { binding: 13, resource: this.blurViews![0] },
        { binding: 14, resource: { buffer: this.blurUniforms[0] } },
      ],
    }));
    this.blurPrimaryVerticalGroup = this.device.createBindGroup({
      layout: this.pipelines.blurTextureVertical.getBindGroupLayout(0),
      entries: [
        { binding: 12, resource: this.blurViews[0] },
        { binding: 13, resource: this.blurViews[1] },
        { binding: 14, resource: { buffer: this.blurUniforms[0] } },
      ],
    });
    this.blurSecondaryHorizontalGroup = this.device.createBindGroup({
      layout: this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),
      entries: [
        { binding: 12, resource: this.blurViews[1] },
        { binding: 13, resource: this.blurViews[0] },
        { binding: 14, resource: { buffer: this.blurUniforms[1] } },
      ],
    });
    this.blurSecondaryVerticalGroup = this.device.createBindGroup({
      layout: this.pipelines.blurTextureVertical.getBindGroupLayout(0),
      entries: [
        { binding: 12, resource: this.blurViews[0] },
        { binding: 13, resource: this.blurViews[1] },
        { binding: 14, resource: { buffer: this.blurUniforms[1] } },
      ],
    });
    this.renderGroup = this.device.createBindGroup({
      layout: this.pipelines.render.getBindGroupLayout(0),
      entries: [
        { binding: 4, resource: { buffer: this.selectionBuffer } },
        { binding: 8, resource: fullFieldView },
        { binding: 10, resource: this.sampler },
        { binding: 11, resource: { buffer: this.renderUniform } },
        { binding: 15, resource: this.blurViews[1] },
      ],
    });
  }

  private writeSimParams(seed: number, step: number, temperature: number, phase: number, oldWidth = 0, oldHeight = 0): void {
    const bytes = new ArrayBuffer(32);
    const view = new DataView(bytes);
    view.setUint32(0, this.width, true);
    view.setUint32(4, this.height, true);
    view.setUint32(8, seed, true);
    view.setUint32(12, step, true);
    view.setFloat32(16, temperature, true);
    view.setUint32(20, phase, true);
    view.setUint32(24, oldWidth, true);
    view.setUint32(28, oldHeight, true);
    this.device.queue.writeBuffer(this.simUniform, 0, bytes);
  }

  private writeBrushParams(
    offsetX: number,
    offsetY: number,
    extentX: number,
    extentY: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    radius: number,
    forceHot: boolean,
  ): void {
    const bytes = new ArrayBuffer(64);
    const view = new DataView(bytes);
    view.setUint32(0, this.width, true);
    view.setUint32(4, this.height, true);
    view.setInt32(8, offsetX, true);
    view.setInt32(12, offsetY, true);
    view.setUint32(16, extentX, true);
    view.setUint32(20, extentY, true);
    view.setUint32(24, forceHot ? 1 : 0, true);
    view.setFloat32(32, startX, true);
    view.setFloat32(36, startY, true);
    view.setFloat32(40, endX, true);
    view.setFloat32(44, endY, true);
    view.setFloat32(48, radius, true);
    this.device.queue.writeBuffer(this.brushUniform, 0, bytes);
  }

  private writeBlurParams(buffer: GPUBuffer, radius: number): void {
    this.device.queue.writeBuffer(buffer, 0, new Uint32Array([this.width, this.height, radius, 0]));
  }

  private writeRenderParams(scale: number, radius: number, microOpacity: number, cursor: CursorState): void {
    const values = new Float32Array(16);
    values[0] = this.width;
    values[1] = this.height;
    values[2] = this.width;
    values[3] = this.height;
    values[4] = radius;
    values[5] = scale;
    values[6] = microOpacity;
    values[7] = cursor.active ? 1 : 0;
    values[8] = cursor.x * this.density;
    values[9] = cursor.y * this.density;
    values[10] = cursor.radius * this.density;
    values[11] = cursor.painting ? 1 : 0;
    values[12] = cursor.forceHot ? 1 : 0;
    values[13] = Math.max(0.5, this.density * 0.5);
    this.device.queue.writeBuffer(this.renderUniform, 0, values);
  }

  private randomSeed(): number {
    return (Math.random() * 0xffff_ffff) >>> 0;
  }

  private retire(resources: RetiredResources): void {
    const destroy = (): void => {
      for (const buffer of resources.buffers) buffer.destroy();
      for (const texture of resources.textures ?? []) texture.destroy();
      if (!resources.readback) return;
      if (resources.readback.mapState === 'unmapped') {
        resources.readback.destroy();
      } else {
        window.setTimeout(() => this.retire({ buffers: [], readback: resources.readback }), 250);
      }
    };
    void this.device.queue.onSubmittedWorkDone().then(destroy);
  }
}
