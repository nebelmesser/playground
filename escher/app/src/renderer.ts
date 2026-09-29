import {
  homographyFromUnitSquare,
  fractionalMat3,
  invertMat3,
  multiplyMat3,
  projectiveFixedPoint,
  recursionScaleFactor,
  toWebGlMatrix,
  polygonCentroid,
  type Mat3,
  type Point,
} from './math';

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
out vec2 vUv;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uImage;
uniform mat3 uOuterToInner;
uniform mat3 uInnerToOuter;
uniform mat3 uSeamCorrection;
uniform mat3 uPhaseTransform;
uniform vec2 uInnerQuad[4];
uniform vec2 uOuterQuad[4];
uniform vec2 uFixedPoint;
uniform vec2 uResolution;
uniform vec4 uOutputCrop;
uniform float uAspect;
uniform float uTanBeta;

vec2 project(mat3 transform, vec2 point) {
  vec3 projected = transform * vec3(point, 1.0);
  return projected.xy / max(abs(projected.z), 0.000001) * sign(projected.z);
}

float cross2d(vec2 a, vec2 b) {
  return a.x * b.y - a.y * b.x;
}

vec2 toMetric(vec2 point) {
  return vec2((point.x - uFixedPoint.x) * uAspect, point.y - uFixedPoint.y);
}

vec2 fromMetric(vec2 point) {
  return uFixedPoint + point / vec2(uAspect, 1.0);
}

bool insideInner(vec2 point) {
  for (int index = 0; index < 4; index += 1) {
    vec2 a = uInnerQuad[index];
    vec2 b = uInnerQuad[(index + 1) % 4];
    if (cross2d(b - a, point - a) < -0.00001) return false;
  }
  return true;
}

bool insideOuter(vec2 point) {
  for (int index = 0; index < 4; index += 1) {
    vec2 a = uOuterQuad[index];
    vec2 b = uOuterQuad[(index + 1) % 4];
    if (cross2d(b - a, point - a) < -0.00001) return false;
  }
  return true;
}

vec2 conformalSpiral(vec2 point) {
  vec2 metric = toMetric(point);
  float radius = max(length(metric), 0.0000001);
  float angle = atan(metric.y, metric.x);
  float logRadius = log(radius);

  // exp(gamma * log(z)), gamma = 1 + i*tan(beta). This map is continuous;
  // there is deliberately no modulo here, so faces and frame edges cannot be
  // cut by artificial logarithmic bands.
  float warpedLogRadius = logRadius - angle * uTanBeta;
  float warpedAngle = angle + logRadius * uTanBeta;
  float warpedRadius = exp(warpedLogRadius);
  vec2 warped = fromMetric(warpedRadius * vec2(cos(warpedAngle), sin(warpedAngle)));

  // atan() necessarily jumps at the negative real axis. A scalar Droste can
  // hide that jump with one radial scale, but an arbitrary perspective frame
  // cannot: its next level is a homography, not a uniform scale. Distribute
  // the missing projective part over the complete turn. At the two sides of
  // the branch the coordinates then differ by exactly uOuterToInner, which
  // foldToSourceFrame identifies. smoothstep has zero endpoint derivatives,
  // so the join is continuous and tangent-continuous rather than a hard cut.
  float turn = (angle + 3.141592653589793) / 6.283185307179586;
  float correction = turn * turn * (3.0 - 2.0 * turn);
  vec2 seamWarped = project(uSeamCorrection, warped);
  // The logarithm jumps in opposite directions for LEFT and RIGHT. Applying
  // the right-handed correction to LEFT compounds the projective contraction
  // on the left edge. Reverse both the correction endpoint and interpolation
  // direction so the two twists have matching geometry.
  warped = uTanBeta >= 0.0
    ? mix(warped, seamWarped, correction)
    : mix(seamWarped, warped, correction);
  // FRAME / ZOOM is a fractional step of the actual projective recursion,
  // not an unrelated radial scale. As phase approaches 1 this matrix reaches
  // uOuterToInner, which foldToSourceFrame identifies with phase 0; the CPU
  // aliases the exact 1 endpoint to 0 for bit-identical still frames.
  return project(uPhaseTransform, warped);
}

vec2 foldToSourceFrame(vec2 point) {
  // The straight Droste plane is defined projectively: INNER is one complete
  // copy of OUTER. Folding only chooses an equivalent source coordinate; it
  // does not deform the image and fills every region between recursive levels.
  for (int level = 0; level < 32; level += 1) {
    if (insideInner(point)) {
      point = project(uInnerToOuter, point);
    } else if (!insideOuter(point)) {
      point = project(uOuterToInner, point);
    } else {
      break;
    }
  }
  return point;
}

vec4 sampleDroste(vec2 uv) {
  // The result is a centered crop of OUTER. uOutputCrop is that window in
  // OUTER's own 0–1 coordinates, so a chosen aspect trims the picture without
  // moving the source frames.
  vec2 frameUv = uOutputCrop.xy + uv * uOutputCrop.zw;
  vec2 outputPoint = vec2(
    mix(uOuterQuad[0].x, uOuterQuad[1].x, frameUv.x),
    mix(uOuterQuad[0].y, uOuterQuad[3].y, frameUv.y)
  );
  vec2 sourcePoint = foldToSourceFrame(conformalSpiral(outputPoint));
  return texture(uImage, clamp(sourcePoint, vec2(0.0), vec2(1.0)));
}

void main() {
  // A rotated 2x2 subpixel grid antialiases only discontinuities between
  // recursion levels. It removes staircase pixels at spiral joins without
  // applying a blur kernel to the source texture.
  vec2 pixel = 1.0 / uResolution;
  outColor = (
    sampleDroste(clamp(vUv + vec2(-0.375, -0.125) * pixel, 0.0, 1.0))
    + sampleDroste(clamp(vUv + vec2(0.125, -0.375) * pixel, 0.0, 1.0))
    + sampleDroste(clamp(vUv + vec2(0.375, 0.125) * pixel, 0.0, 1.0))
    + sampleDroste(clamp(vUv + vec2(-0.125, 0.375) * pixel, 0.0, 1.0))
  ) * 0.25;
}
`;

export type OutputCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RenderState = {
  innerQuad: readonly Point[];
  outerQuad: readonly Point[];
  outputCrop: OutputCrop;
  phase: number;
  direction: -1 | 1;
  twistStrength: number;
  imageAspect: number;
};

type Uniforms = {
  image: WebGLUniformLocation;
  outerToInner: WebGLUniformLocation;
  innerToOuter: WebGLUniformLocation;
  seamCorrection: WebGLUniformLocation;
  phaseTransform: WebGLUniformLocation;
  innerQuad: WebGLUniformLocation;
  outerQuad: WebGLUniformLocation;
  fixedPoint: WebGLUniformLocation;
  resolution: WebGLUniformLocation;
  outputCrop: WebGLUniformLocation;
  aspect: WebGLUniformLocation;
  tanBeta: WebGLUniformLocation;
};

export class DrosteRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly maximumTextureSize: number;
  readonly maximumOutputSize: number;

  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly texture: WebGLTexture;
  private readonly uniforms: Uniforms;
  private imageWidth = 1;
  private imageHeight = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 is unavailable');
    this.gl = gl;
    this.maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    this.maximumOutputSize = Math.min(viewport[0], viewport[1], this.maximumTextureSize, 8192);
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    this.uniforms = this.findUniforms();

    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) throw new Error('Could not create a WebGL vertex buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    if (!texture) throw new Error('Could not create a WebGL texture');
    this.texture = texture;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // vUv already uses the image/canvas convention: y = 0 is the top edge.
    // Flipping during upload would therefore turn the source upside down.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.useProgram(this.program);
    gl.uniform1i(this.uniforms.image, 0);

    const anisotropy = gl.getExtension('EXT_texture_filter_anisotropic');
    if (anisotropy) {
      const maximum = gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(maximum, 8));
    }
  }

  setImage(source: TexImageSource, width: number, height: number): void {
    this.imageWidth = width;
    this.imageHeight = height;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  render(state: RenderState, forcedSize?: { width: number; height: number }): void {
    const size = forcedSize ?? this.displaySize();
    if (this.canvas.width !== size.width || this.canvas.height !== size.height) {
      this.canvas.width = size.width;
      this.canvas.height = size.height;
    }

    const outerHomography = homographyFromUnitSquare(state.outerQuad);
    const innerHomography = homographyFromUnitSquare(state.innerQuad);
    const outerToInner = multiplyMat3(innerHomography, invertMat3(outerHomography));
    const innerToOuter = invertMat3(outerToInner);
    // Keep 1.0 as an exact alias of 0.0. Fractional matrix powers retain the
    // projective perspective and, crucially, obey H^(t + 1) = H * H^t. Once
    // the fold removes that complete H step, velocity is continuous too.
    const cyclePhase = state.phase >= 1 ? 0 : Math.max(0, state.phase);
    const phaseTransform = fractionalMat3(outerToInner, cyclePhase);
    const fixedPoint = projectiveFixedPoint(outerToInner, polygonCentroid(state.innerQuad));
    const scaleFactor = recursionScaleFactor(
      state.outerQuad,
      state.innerQuad,
      state.imageAspect,
    );
    const logScale = Math.log(Math.max(scaleFactor, 1.00001));
    const tanBeta = state.direction * state.twistStrength * logScale / (Math.PI * 2);
    const branchScale = Math.exp(-Math.PI * 2 * tanBeta);
    const branchTransform: Mat3 = [
      branchScale, 0, 0,
      0, branchScale, 0,
      0, 0, 1,
    ];
    branchTransform[2] = fixedPoint.x
      - branchTransform[0] * fixedPoint.x
      - branchTransform[1] * fixedPoint.y;
    branchTransform[5] = fixedPoint.y
      - branchTransform[3] * fixedPoint.x
      - branchTransform[4] * fixedPoint.y;
    const seamCorrection = state.direction > 0
      ? multiplyMat3(outerToInner, invertMat3(branchTransform))
      : multiplyMat3(outerToInner, branchTransform);
    const innerQuad = new Float32Array(state.innerQuad.flatMap((point) => [point.x, point.y]));
    const outerQuad = new Float32Array(state.outerQuad.flatMap((point) => [point.x, point.y]));

    const gl = this.gl;
    gl.viewport(0, 0, size.width, size.height);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniformMatrix3fv(this.uniforms.outerToInner, false, toWebGlMatrix(outerToInner));
    gl.uniformMatrix3fv(this.uniforms.innerToOuter, false, toWebGlMatrix(innerToOuter));
    gl.uniformMatrix3fv(this.uniforms.seamCorrection, false, toWebGlMatrix(seamCorrection));
    gl.uniformMatrix3fv(this.uniforms.phaseTransform, false, toWebGlMatrix(phaseTransform));
    gl.uniform2fv(this.uniforms.innerQuad, innerQuad);
    gl.uniform2fv(this.uniforms.outerQuad, outerQuad);
    gl.uniform2f(this.uniforms.fixedPoint, fixedPoint.x, fixedPoint.y);
    gl.uniform2f(this.uniforms.resolution, size.width, size.height);
    gl.uniform4f(
      this.uniforms.outputCrop,
      state.outputCrop.x,
      state.outputCrop.y,
      state.outputCrop.width,
      state.outputCrop.height,
    );
    gl.uniform1f(this.uniforms.aspect, state.imageAspect);
    gl.uniform1f(this.uniforms.tanBeta, tanBeta);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  async exportPng(state: RenderState): Promise<{ blob: Blob; width: number; height: number }> {
    const fullWidth = this.imageWidth * (state.outerQuad[1].x - state.outerQuad[0].x);
    const fullHeight = this.imageHeight * (state.outerQuad[3].y - state.outerQuad[0].y);
    const cropWidth = fullWidth * state.outputCrop.width;
    const cropHeight = fullHeight * state.outputCrop.height;
    const scale = Math.min(1, this.maximumOutputSize / Math.max(cropWidth, cropHeight));
    const width = Math.max(1, Math.round(cropWidth * scale));
    const height = Math.max(1, Math.round(cropHeight * scale));
    this.render(state, { width, height });
    this.gl.finish();
    const blob = await new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('PNG encoding failed'));
      }, 'image/png');
    });
    this.render(state);
    return { blob, width, height };
  }

  finish(): void {
    this.gl.finish();
  }

  private displaySize(): { width: number; height: number } {
    const bounds = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return {
      width: Math.max(1, Math.round(bounds.width * dpr)),
      height: Math.max(1, Math.round(bounds.height * dpr)),
    };
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Could not create a WebGL shader');
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const log = this.gl.getShaderInfoLog(shader) ?? 'Unknown shader error';
      this.gl.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    const program = this.gl.createProgram();
    if (!program) throw new Error('Could not create a WebGL program');
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const log = this.gl.getProgramInfoLog(program) ?? 'Unknown WebGL program error';
      this.gl.deleteProgram(program);
      throw new Error(log);
    }
    return program;
  }

  private findUniforms(): Uniforms {
    const required = (name: string): WebGLUniformLocation => {
      const location = this.gl.getUniformLocation(this.program, name);
      if (!location) throw new Error(`Missing shader uniform: ${name}`);
      return location;
    };
    return {
      image: required('uImage'),
      outerToInner: required('uOuterToInner'),
      innerToOuter: required('uInnerToOuter'),
      seamCorrection: required('uSeamCorrection'),
      phaseTransform: required('uPhaseTransform'),
      innerQuad: required('uInnerQuad[0]'),
      outerQuad: required('uOuterQuad[0]'),
      fixedPoint: required('uFixedPoint'),
      resolution: required('uResolution'),
      outputCrop: required('uOutputCrop'),
      aspect: required('uAspect'),
      tanBeta: required('uTanBeta'),
    };
  }
}
