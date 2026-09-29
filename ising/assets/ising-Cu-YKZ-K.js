(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function i(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=i(n);fetch(n.href,r)}})();async function ce(){try{if(!navigator.gpu)return null;const h=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!h)return null;const e=await h.requestDevice();return e.lost.then(i=>{console.error("WebGPU device lost:",i.message)}),e.addEventListener("uncapturederror",i=>{console.error("WebGPU:",i.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(h){return console.error("WebGPU initialization failed.",h),null}}const pe=`struct SimParams {
  size: vec2<u32>,
  seed: u32,
  step: u32,
  temperature: f32,
  phase: u32,
  old_width: u32,
  old_height: u32,
}

struct BrushParams {
  size: vec2<u32>,
  offset: vec2<i32>,
  extent: vec2<u32>,
  force_hot: u32,
  _pad0: u32,
  start: vec2<f32>,
  end: vec2<f32>,
  radius: f32,
  _pad1: f32,
  _pad2: vec2<f32>,
}

struct StatsParams {
  width: u32,
  height: u32,
  groups_x: u32,
  _pad: u32,
}

struct BlurParams {
  size: vec2<u32>,
  radius: u32,
  _pad: u32,
}

struct RenderParams {
  viewport: vec2<f32>,
  grid: vec2<f32>,
  observation_radius: f32,
  scale: f32,
  micro_opacity: f32,
  cursor_active: f32,
  cursor: vec2<f32>,
  cursor_radius: f32,
  painting: f32,
  force_hot_brush: f32,
  cursor_stroke_half_width: f32,
}

struct Selection {
  value: i32,
}

struct StatsAccumulator {
  magnetization: atomic<i32>,
  energy: atomic<i32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@group(0) @binding(0) var<storage, read> spins_read: array<i32>;
@group(0) @binding(1) var<storage, read_write> spins_write: array<i32>;
@group(0) @binding(2) var<uniform> sim: SimParams;
@group(0) @binding(3) var field_level_zero: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(4) var<storage, read_write> selection: Selection;
@group(0) @binding(5) var<uniform> brush: BrushParams;
@group(0) @binding(6) var<storage, read_write> stats_output: StatsAccumulator;
@group(0) @binding(7) var<uniform> stats_params: StatsParams;
@group(0) @binding(8) var sampled_field: texture_2d<f32>;
@group(0) @binding(9) var downsampled_field: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(10) var field_sampler: sampler;
@group(0) @binding(11) var<uniform> render_params: RenderParams;
@group(0) @binding(12) var blur_source: texture_2d<f32>;
@group(0) @binding(13) var blur_target: texture_storage_2d<rgba16float, write>;
@group(0) @binding(14) var<uniform> blur: BlurParams;
@group(0) @binding(15) var observed_field: texture_2d<f32>;

var<workgroup> group_magnetization: array<i32, 256>;
var<workgroup> group_energy: array<i32, 256>;

fn hash32(value: u32) -> u32 {
  var x = value;
  x = x ^ (x >> 16u);
  x = x * 0x7feb352du;
  x = x ^ (x >> 15u);
  x = x * 0x846ca68bu;
  return x ^ (x >> 16u);
}

fn random_unit(value: u32) -> f32 {
  return f32(hash32(value)) / 4294967296.0;
}

fn wrap(value: i32, size: i32) -> u32 {
  return u32(((value % size) + size) % size);
}

@compute @workgroup_size(8, 8)
fn randomize(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= sim.size.x || gid.y >= sim.size.y) { return; }
  let index = gid.y * sim.size.x + gid.x;
  let sample = hash32(index ^ sim.seed);
  spins_write[index] = select(-1, 1, (sample & 1u) == 1u);
}

@compute @workgroup_size(8, 8)
fn clear_blue(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= sim.size.x || gid.y >= sim.size.y) { return; }
  spins_write[gid.y * sim.size.x + gid.x] = -1;
}

@compute @workgroup_size(8, 8)
fn resize_grid(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= sim.size.x || gid.y >= sim.size.y) { return; }
  let index = gid.y * sim.size.x + gid.x;
  if (gid.x < sim.old_width && gid.y < sim.old_height) {
    spins_write[index] = spins_read[gid.y * sim.old_width + gid.x];
  } else {
    let sample = hash32(index ^ sim.seed);
    spins_write[index] = select(-1, 1, (sample & 1u) == 1u);
  }
}

@compute @workgroup_size(8, 8)
fn metropolis(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= sim.size.x || gid.y >= sim.size.y) { return; }
  let width = sim.size.x;
  let height = sim.size.y;
  let index = gid.y * width + gid.x;
  let spin = spins_read[index];

  if (((gid.x + gid.y) & 1u) != sim.phase) {
    spins_write[index] = spin;
    return;
  }

  let left_x = select(gid.x - 1u, width - 1u, gid.x == 0u);
  let right_x = select(gid.x + 1u, 0u, gid.x + 1u == width);
  let up_y = select(gid.y - 1u, height - 1u, gid.y == 0u);
  let down_y = select(gid.y + 1u, 0u, gid.y + 1u == height);
  let neighbors = spins_read[gid.y * width + left_x]
    + spins_read[gid.y * width + right_x]
    + spins_read[up_y * width + gid.x]
    + spins_read[down_y * width + gid.x];
  let delta_energy = 2 * spin * neighbors;
  let random_index = index ^ sim.seed ^ (sim.step * 0x9e3779b9u);
  let should_flip = delta_energy <= 0
    || random_unit(random_index) < exp(-f32(delta_energy) / sim.temperature);
  spins_write[index] = select(spin, -spin, should_flip);
}

@compute @workgroup_size(8, 8)
fn write_field(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= sim.size.x || gid.y >= sim.size.y) { return; }
  let index = gid.y * sim.size.x + gid.x;
  let encoded = f32(spins_read[index] + 1) * 0.5;
  textureStore(field_level_zero, vec2<i32>(gid.xy), vec4<f32>(encoded, 0.0, 0.0, 1.0));
}

@compute @workgroup_size(8, 8)
fn downsample(@builtin(global_invocation_id) gid: vec3<u32>) {
  let destination_size = textureDimensions(downsampled_field);
  if (gid.x >= destination_size.x || gid.y >= destination_size.y) { return; }

  let source_size = textureDimensions(sampled_field, 0);
  let base = gid.xy * 2u;
  let p00 = min(base, source_size - vec2<u32>(1u));
  let p10 = min(base + vec2<u32>(1u, 0u), source_size - vec2<u32>(1u));
  let p01 = min(base + vec2<u32>(0u, 1u), source_size - vec2<u32>(1u));
  let p11 = min(base + vec2<u32>(1u, 1u), source_size - vec2<u32>(1u));
  let average = (
    textureLoad(sampled_field, vec2<i32>(p00), 0).r
    + textureLoad(sampled_field, vec2<i32>(p10), 0).r
    + textureLoad(sampled_field, vec2<i32>(p01), 0).r
    + textureLoad(sampled_field, vec2<i32>(p11), 0).r
  ) * 0.25;
  textureStore(downsampled_field, vec2<i32>(gid.xy), vec4<f32>(average, 0.0, 0.0, 1.0));
}

@compute @workgroup_size(64)
fn blur_spins_horizontal(@builtin(global_invocation_id) gid: vec3<u32>) {
  let y = gid.x;
  if (y >= blur.size.y) { return; }

  let radius = i32(blur.radius);
  let diameter = f32(blur.radius * 2u + 1u);
  var sum = 0.0;
  for (var offset = -radius; offset <= radius; offset += 1) {
    let x = wrap(offset, i32(blur.size.x));
    sum += f32(spins_read[y * blur.size.x + x]);
  }

  for (var x = 0u; x < blur.size.x; x += 1u) {
    textureStore(blur_target, vec2<i32>(i32(x), i32(y)), vec4<f32>(sum / diameter, 0.0, 0.0, 1.0));
    let add_x = wrap(i32(x) + radius + 1, i32(blur.size.x));
    let remove_x = wrap(i32(x) - radius, i32(blur.size.x));
    sum += f32(spins_read[y * blur.size.x + add_x] - spins_read[y * blur.size.x + remove_x]);
  }
}

@compute @workgroup_size(64)
fn blur_texture_horizontal(@builtin(global_invocation_id) gid: vec3<u32>) {
  let y = gid.x;
  if (y >= blur.size.y) { return; }

  let radius = i32(blur.radius);
  let diameter = f32(blur.radius * 2u + 1u);
  var sum = 0.0;
  for (var offset = -radius; offset <= radius; offset += 1) {
    sum += textureLoad(blur_source, vec2<i32>(i32(wrap(offset, i32(blur.size.x))), i32(y)), 0).r;
  }

  for (var x = 0u; x < blur.size.x; x += 1u) {
    textureStore(blur_target, vec2<i32>(i32(x), i32(y)), vec4<f32>(sum / diameter, 0.0, 0.0, 1.0));
    let add_x = wrap(i32(x) + radius + 1, i32(blur.size.x));
    let remove_x = wrap(i32(x) - radius, i32(blur.size.x));
    sum += textureLoad(blur_source, vec2<i32>(i32(add_x), i32(y)), 0).r
      - textureLoad(blur_source, vec2<i32>(i32(remove_x), i32(y)), 0).r;
  }
}

@compute @workgroup_size(64)
fn blur_texture_vertical(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = gid.x;
  if (x >= blur.size.x) { return; }

  let radius = i32(blur.radius);
  let diameter = f32(blur.radius * 2u + 1u);
  var sum = 0.0;
  for (var offset = -radius; offset <= radius; offset += 1) {
    sum += textureLoad(blur_source, vec2<i32>(i32(x), i32(wrap(offset, i32(blur.size.y)))), 0).r;
  }

  for (var y = 0u; y < blur.size.y; y += 1u) {
    textureStore(blur_target, vec2<i32>(i32(x), i32(y)), vec4<f32>(sum / diameter, 0.0, 0.0, 1.0));
    let add_y = wrap(i32(y) + radius + 1, i32(blur.size.y));
    let remove_y = wrap(i32(y) - radius, i32(blur.size.y));
    sum += textureLoad(blur_source, vec2<i32>(i32(x), i32(add_y)), 0).r
      - textureLoad(blur_source, vec2<i32>(i32(x), i32(remove_y)), 0).r;
  }
}

@compute @workgroup_size(1)
fn select_spin() {
  let x = min(u32(brush.start.x), brush.size.x - 1u);
  let y = min(u32(brush.start.y), brush.size.y - 1u);
  let visible_value = textureLoad(observed_field, vec2<i32>(i32(x), i32(y)), 0).r;
  selection.value = select(-1, 1, brush.force_hot == 1u || visible_value >= 0.0);
}

@compute @workgroup_size(8, 8)
fn paint(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= brush.extent.x || gid.y >= brush.extent.y) { return; }
  let point = vec2<f32>(vec2<i32>(gid.xy) + brush.offset);
  let segment = brush.end - brush.start;
  let length_squared = dot(segment, segment);
  var projection = 0.0;
  if (length_squared > 0.0) {
    projection = clamp(dot(point - brush.start, segment) / length_squared, 0.0, 1.0);
  }
  let closest = brush.start + segment * projection;
  let delta = point - closest;
  if (dot(delta, delta) > brush.radius * brush.radius) { return; }

  let x = wrap(i32(point.x), i32(brush.size.x));
  let y = wrap(i32(point.y), i32(brush.size.y));
  spins_write[y * brush.size.x + x] = selection.value;
}

@compute @workgroup_size(16, 16)
fn reduce_stats(
  @builtin(global_invocation_id) gid: vec3<u32>,
  @builtin(local_invocation_index) local_index: u32,
  @builtin(workgroup_id) group_id: vec3<u32>,
) {
  var magnetization = 0;
  var energy = 0;
  if (gid.x < stats_params.width && gid.y < stats_params.height) {
    let index = gid.y * stats_params.width + gid.x;
    let spin = spins_read[index];
    let right_x = select(gid.x + 1u, 0u, gid.x + 1u == stats_params.width);
    let down_y = select(gid.y + 1u, 0u, gid.y + 1u == stats_params.height);
    magnetization = spin;
    energy = -spin * (
      spins_read[gid.y * stats_params.width + right_x]
      + spins_read[down_y * stats_params.width + gid.x]
    );
  }

  group_magnetization[local_index] = magnetization;
  group_energy[local_index] = energy;
  workgroupBarrier();

  var stride = 128u;
  loop {
    if (local_index < stride) {
      group_magnetization[local_index] += group_magnetization[local_index + stride];
      group_energy[local_index] += group_energy[local_index + stride];
    }
    workgroupBarrier();
    if (stride == 1u) { break; }
    stride = stride / 2u;
  }

  if (local_index == 0u) {
    atomicAdd(&stats_output.magnetization, group_magnetization[0]);
    atomicAdd(&stats_output.energy, group_energy[0]);
  }
}

@vertex
fn fullscreen_vertex(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0),
  );
  var output: VertexOutput;
  output.position = vec4<f32>(positions[vertex_index], 0.0, 1.0);
  output.uv = positions[vertex_index] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
  return output;
}

fn palette(value: f32) -> vec3<f32> {
  let neutral = vec3<f32>(0.075, 0.086, 0.122);
  let cold = vec3<f32>(0.212, 0.612, 1.0);
  let hot = vec3<f32>(1.0, 0.412, 0.239);
  let target_color = select(cold, hot, value >= 0.0);
  return mix(neutral, target_color, pow(abs(value), 0.38));
}

fn observed_value(uv: vec2<f32>) -> f32 {
  return textureSampleLevel(observed_field, field_sampler, uv, 0.0).r;
}

fn rectangle_mask(delta: vec2<f32>, half_size: vec2<f32>, antialias: f32) -> f32 {
  let distance_to_edge = max(delta.x - half_size.x, delta.y - half_size.y);
  return 1.0 - smoothstep(0.0, antialias, distance_to_edge);
}

fn ring_band_mask(value: f32, center: f32, half_width: f32, antialias: f32) -> f32 {
  return 1.0 - smoothstep(half_width, half_width + antialias, abs(value - center));
}

@fragment
fn field_fragment(input: VertexOutput) -> @location(0) vec4<f32> {
  let uv = input.uv;
  let value = observed_value(uv);
  let cell = min(vec2<u32>(uv * render_params.grid), vec2<u32>(render_params.grid) - vec2<u32>(1u));
  let microscopic = textureLoad(sampled_field, vec2<i32>(cell), 0).r * 2.0 - 1.0;
  var color = mix(palette(value), palette(microscopic), render_params.micro_opacity);

  var edge = 0.0;
  if (render_params.observation_radius < 0.5) {
    let size = vec2<u32>(render_params.grid);
    let right_cell = vec2<u32>((cell.x + 1u) % size.x, cell.y);
    let down_cell = vec2<u32>(cell.x, (cell.y + 1u) % size.y);
    let right_spin = textureLoad(sampled_field, vec2<i32>(right_cell), 0).r >= 0.5;
    let down_spin = textureLoad(sampled_field, vec2<i32>(down_cell), 0).r >= 0.5;
    edge = select(0.0, 1.0, (microscopic >= 0.0) != right_spin || (microscopic >= 0.0) != down_spin);
  } else {
    let gradient = max(length(vec2<f32>(dpdx(value), dpdy(value))), 0.000001);
    let distance_in_pixels = abs(value) / gradient;
    let half_width = select(0.72, 1.0, render_params.scale >= 1.0);
    edge = 1.0 - smoothstep(half_width - 0.5, half_width + 0.5, distance_in_pixels);
  }
  let edge_alpha = (105.0 + clamp(render_params.scale / 3.0, 0.0, 1.0) * 145.0) / 255.0;
  color = mix(color, vec3<f32>(1.0, 0.976, 0.914), edge * edge_alpha);

  if (render_params.cursor_active > 0.5) {
    let radial_offset = distance(input.position.xy, render_params.cursor) - render_params.cursor_radius;
    let cursor_cell = min(
      vec2<u32>(max(render_params.cursor, vec2<f32>(0.0))),
      vec2<u32>(render_params.grid) - vec2<u32>(1u),
    );
    let hovered_value = textureLoad(observed_field, vec2<i32>(cursor_cell), 0).r;
    var cursor_spin = select(-1.0, 1.0, hovered_value >= 0.0);
    if (render_params.force_hot_brush > 0.5) {
      cursor_spin = 1.0;
    }
    if (render_params.painting > 0.5) {
      cursor_spin = f32(selection.value);
    }
    let cursor_color = select(
      vec3<f32>(0.212, 0.612, 1.0),
      vec3<f32>(1.0, 0.412, 0.239),
      cursor_spin > 0.0,
    );
    let pixel = render_params.cursor_stroke_half_width * 2.0;
    let black_frame = ring_band_mask(radial_offset, 0.0, 3.0 * pixel, 0.5 * pixel);
    let paint_ring = ring_band_mask(radial_offset, 0.0, 1.5 * pixel, 0.4 * pixel);
    color = mix(color, vec3<f32>(0.005, 0.006, 0.009), black_frame);
    color = mix(color, cursor_color, paint_ring);

    let cross_delta = abs(input.position.xy - render_params.cursor);
    let black_cross = max(
      rectangle_mask(cross_delta, vec2<f32>(1.5 * pixel, 6.5 * pixel), 0.75),
      rectangle_mask(cross_delta, vec2<f32>(6.5 * pixel, 1.5 * pixel), 0.75),
    );
    let white_cross = max(
      rectangle_mask(cross_delta, vec2<f32>(0.5 * pixel, 5.5 * pixel), 0.75),
      rectangle_mask(cross_delta, vec2<f32>(5.5 * pixel, 0.5 * pixel), 0.75),
    );
    color = mix(color, vec3<f32>(0.015, 0.018, 0.025), black_cross);
    color = mix(color, vec3<f32>(1.0), white_cross);
  }

  return vec4<f32>(color, 1.0);
}
`,x=(h,e)=>Math.ceil(h/e);class fe{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;statsOutput=null;statsReadback=null;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;renderGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,i,s){this.device=e,this.format=i,this.canvas=s;const n=s.getContext("webgpu");if(!n)throw new Error("Could not create a WebGPU canvas context.");this.context=n,this.context.configure({device:e,format:i,alphaMode:"opaque"});const r=e.createShaderModule({label:"Ising shaders",code:pe});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"reduce_stats"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:r,entryPoint:"fullscreen_vertex"},fragment:{module:r,entryPoint:"field_fragment",targets:[{format:i}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(l=>e.createBuffer({label:`Ising blur uniforms ${l}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,i,s,n=!0){if(e===this.width&&i===this.height&&this.spinBuffers){this.density=s;return}const r=this.width,l=this.height,d=this.spinBuffers,o=this.fieldTexture,c=this.blurTextures,g=this.statsOutput,f=this.statsReadback,p=d?.[this.currentIndex]??null;if(this.width=e,this.height=i,this.density=s,this.currentIndex=0,this.canvas.width=e,this.canvas.height=i,this.allocateResources(),n&&p){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,r,l);const P=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:p}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),_=this.device.createCommandEncoder({label:"Resize Ising grid"}),u=_.beginComputePass();u.setPipeline(this.pipelines.resize),u.setBindGroup(0,P),u.dispatchWorkgroups(x(e,8),x(i,8)),u.end(),this.device.queue.submit([_.finish()])}else this.randomize();d&&this.retire({buffers:[d[0],d[1],...g?[g]:[]],readback:f??void 0,textures:[o,...c??[]].filter(P=>!!P)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),i=e.beginComputePass();i.setPipeline(this.pipelines.randomize),i.setBindGroup(0,this.randomGroups[this.currentIndex]),i.dispatchWorkgroups(x(this.width,8),x(this.height,8)),i.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),i=e.beginComputePass();i.setPipeline(this.pipelines.clearBlue),i.setBindGroup(0,this.clearGroups[this.currentIndex]),i.dispatchWorkgroups(x(this.width,8),x(this.height,8)),i.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,i){for(let s=0;s<i;s+=1){const n=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,n);const r=this.device.createCommandEncoder({label:"Advance Ising state"}),l=r.beginComputePass();l.setPipeline(this.pipelines.update),l.setBindGroup(0,this.updateGroups[this.currentIndex]),l.dispatchWorkgroups(x(this.width,8),x(this.height,8)),l.end(),this.device.queue.submit([r.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}i>0&&(this.fieldDirty=!0)}paintSegment(e,i,s,n,r,l,d){const o=Math.floor(Math.min(e,s)-r),c=Math.floor(Math.min(i,n)-r),g=Math.ceil(Math.max(e,s)+r),f=Math.ceil(Math.max(i,n)+r),p=g-o+1,P=f-c+1;this.writeBrushParams(o,c,p,P,e,i,s,n,r,d);const _=this.device.createCommandEncoder({label:"Paint Ising spins"});if(l){const z=_.beginComputePass();z.setPipeline(this.pipelines.select),z.setBindGroup(0,this.selectGroups[this.currentIndex]),z.dispatchWorkgroups(1),z.end()}const u=_.beginComputePass();u.setPipeline(this.pipelines.paint),u.setBindGroup(0,this.paintGroups[this.currentIndex]),u.dispatchWorkgroups(x(p,8),x(P,8)),u.end(),this.device.queue.submit([_.finish()]),this.fieldDirty=!0}draw(e,i,s,n){if(!this.renderGroup||!this.blurPrimaryVerticalGroup||!this.blurSecondaryHorizontalGroup||!this.blurSecondaryVerticalGroup)return;const r=e>1?Math.max(1,Math.round(i*.45)):0,l=this.fieldDirty||i!==this.lastBlurRadius||r!==this.lastSecondaryRadius,d=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const c=d.beginComputePass();c.setPipeline(this.pipelines.field),c.setBindGroup(0,this.fieldGroups[this.currentIndex]),c.dispatchWorkgroups(x(this.width,8),x(this.height,8)),c.end(),this.fieldDirty=!1}if(l){this.writeBlurParams(this.blurUniforms[0],i),this.writeBlurParams(this.blurUniforms[1],r);const c=d.beginComputePass({label:"Horizontal Ising observation blur"});c.setPipeline(this.pipelines.blurSpinsHorizontal),c.setBindGroup(0,this.blurPrimaryHorizontalGroups[this.currentIndex]),c.dispatchWorkgroups(x(this.height,64)),c.end();const g=d.beginComputePass({label:"Vertical Ising observation blur"});if(g.setPipeline(this.pipelines.blurTextureVertical),g.setBindGroup(0,this.blurPrimaryVerticalGroup),g.dispatchWorkgroups(x(this.width,64)),g.end(),r>0){const f=d.beginComputePass({label:"Secondary horizontal Ising blur"});f.setPipeline(this.pipelines.blurTextureHorizontal),f.setBindGroup(0,this.blurSecondaryHorizontalGroup),f.dispatchWorkgroups(x(this.height,64)),f.end();const p=d.beginComputePass({label:"Secondary vertical Ising blur"});p.setPipeline(this.pipelines.blurTextureVertical),p.setBindGroup(0,this.blurSecondaryVerticalGroup),p.dispatchWorkgroups(x(this.width,64)),p.end()}this.lastBlurRadius=i,this.lastSecondaryRadius=r}this.writeRenderParams(e,i,s,n);const o=d.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});o.setPipeline(this.pipelines.render),o.setBindGroup(0,this.renderGroup),o.draw(3),o.end(),this.device.queue.submit([d.finish()])}async readStats(){const e=this.statsOutput,i=this.statsReadback,s=this.statsGroups[this.currentIndex];if(!e||!i||!s)return{energy:0,magnetization:0,signedMagnetization:0};const n=x(this.width,16),r=x(this.height,16),l=new Uint32Array([this.width,this.height,n,0]);this.device.queue.writeBuffer(this.statsUniform,0,l);const d=this.device.createCommandEncoder({label:"Read Ising statistics"});d.clearBuffer(e);const o=d.beginComputePass();o.setPipeline(this.pipelines.stats),o.setBindGroup(0,s),o.dispatchWorkgroups(n,r),o.end(),d.copyBufferToBuffer(e,0,i,0,8),this.device.queue.submit([d.finish()]),await i.mapAsync(GPUMapMode.READ);const c=new Int32Array(i.getMappedRange()),g=c[0],f=c[1];i.unmap();const p=this.width*this.height;return{magnetization:Math.abs(g/p),signedMagnetization:g/p,energy:f/p}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(i=>this.device.createBuffer({label:`Ising spin buffer ${i}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(i=>this.device.createTexture({label:`Ising full-resolution blur ${i}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(i=>i.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(i=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:i}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(i=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:i}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(i=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[i]}},{binding:1,resource:{buffer:this.spinBuffers[1-i]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(i=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(i=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:i}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(i=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(i=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]})}writeSimParams(e,i,s,n,r=0,l=0){const d=new ArrayBuffer(32),o=new DataView(d);o.setUint32(0,this.width,!0),o.setUint32(4,this.height,!0),o.setUint32(8,e,!0),o.setUint32(12,i,!0),o.setFloat32(16,s,!0),o.setUint32(20,n,!0),o.setUint32(24,r,!0),o.setUint32(28,l,!0),this.device.queue.writeBuffer(this.simUniform,0,d)}writeBrushParams(e,i,s,n,r,l,d,o,c,g){const f=new ArrayBuffer(64),p=new DataView(f);p.setUint32(0,this.width,!0),p.setUint32(4,this.height,!0),p.setInt32(8,e,!0),p.setInt32(12,i,!0),p.setUint32(16,s,!0),p.setUint32(20,n,!0),p.setUint32(24,g?1:0,!0),p.setFloat32(32,r,!0),p.setFloat32(36,l,!0),p.setFloat32(40,d,!0),p.setFloat32(44,o,!0),p.setFloat32(48,c,!0),this.device.queue.writeBuffer(this.brushUniform,0,f)}writeBlurParams(e,i){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,i,0]))}writeRenderParams(e,i,s,n){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=i,r[5]=e,r[6]=s,r[7]=n.active?1:0,r[8]=n.x*this.density,r[9]=n.y*this.density,r[10]=n.radius*this.density,r[11]=n.painting?1:0,r[12]=n.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const i=()=>{for(const s of e.buffers)s.destroy();for(const s of e.textures??[])s.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(i)}}const he=2/Math.log(1+Math.sqrt(2)),ge=30,b=h=>{const e=document.getElementById(h);if(!e)throw new Error(`Missing #${h}`);return e},w=b("field"),L=b("scale"),F=b("temperature"),q=b("time-speed"),E=b("brush-size"),me=b("scale-value"),be=b("temperature-value"),xe=b("time-speed-value"),_e=b("brush-size-value"),ve=b("explanation"),H=b("settings-toggle"),se=b("settings-panel"),R=b("pause"),ye=b("restart"),we=b("clear-blue"),W=b("phase"),Y=b("magnetization"),$=b("energy"),V=b("fatal-error"),ze=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour moves like one boundary although the model contains only local cells.","A large-scale observer cannot see individual flips. Islands merge into a different, slower geometry."];async function Pe(){const h=await ce();if(!h){V.hidden=!1,V.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new fe(h.device,h.format,w);let i=Number(F.value),s=Number(L.value),n=s,r=Number(q.value),l=Number(E.value),d=!1,o=!0,c=!1,g=!1,f=!1,p=0,P=0,_=null,u=!0,z=0,X=performance.now(),j=0,D=!1,S=0;const v=new Map;let G=!1,O=0,K=s,B=!1,U=!1;const ae=()=>{const t=Math.max(1,window.innerWidth),a=Math.max(1,window.innerHeight),m=t<=720?Math.min(window.devicePixelRatio||1,2):1,y=Math.min(h.device.limits.maxTextureDimension2D/t,h.device.limits.maxTextureDimension2D/a),le=Math.sqrt(Number(h.device.limits.maxStorageBufferBindingSize)/4/(t*a)),re=Math.max(.25,Math.min(m,y,le)),ne=Math.max(1,Math.round(t*re)),de=Math.max(1,Math.round(a*re));return{density:ne/t,width:ne,height:de}},J=()=>Math.max(0,Math.round((2**s-1)*(Math.min(e.width,e.height)/65.64)))*2+1,M=()=>{const t=J();L.value=s.toFixed(2),me.textContent=t===1?"1 spin":`${t} × ${t}`,ve.textContent=ze[Math.min(3,Math.floor(s+.25))],document.documentElement.style.setProperty("--noise-opacity",(.12*(1-s/3)**2).toFixed(3))},Q=()=>{be.textContent=`T = ${i.toFixed(2)}`;const t=i-he;t<-.2?W.textContent="ordered":t>.2?W.textContent="disordered":W.textContent="critical"},Z=()=>{const t=Number.isInteger(r)?0:1;xe.textContent=`${r.toFixed(t)}×`},A=()=>{E.value=String(l),_e.textContent=`${l} px`},oe=()=>({active:f&&!G&&!U,painting:c,forceHot:g,x:p,y:P,radius:l/2}),I=()=>{const t=J(),a=(t-1)/2,m=t===1?0:.14*(1-s/3)**2;e.draw(s,a,m,oe()),u=!1},ee=(t=!0)=>{const a=ae();e.resize(a.width,a.height,a.density,t),M(),u=!0,I(),S+=1},k=t=>{const a=w.getBoundingClientRect(),m=(t.clientX-a.left)/a.width,y=(t.clientY-a.top)/a.height;return m<0||m>=1||y<0||y>=1?null:(p=t.clientX-a.left,P=t.clientY-a.top,{x:m*e.width,y:y*e.height})},T=(t,a)=>{const m=k(t);if(!m){_=null;return}const y=_??m;e.paintSegment(y.x,y.y,m.x,m.y,l*e.density/2,a,g),_=m,u=!0},N=t=>{c=!0,_=null,T(t,!0),g=!1},te=()=>{const t=[...v.values()];return t.length<2?0:Math.hypot(t[1].x-t[0].x,t[1].y-t[0].y)},C=()=>{if(D)return;D=!0;const t=S;e.readStats().then(a=>{if(t!==S)return;Y.textContent=a.magnetization.toFixed(3),$.textContent=a.energy.toFixed(3);const m=a.signedMagnetization===-1;!c&&g!==m&&(g=m,u=!0)}).catch(a=>{console.warn("Could not read Ising statistics.",a)}).finally(()=>{D=!1})};L.addEventListener("input",()=>{s=Number(L.value),n=s,M(),u=!0}),F.addEventListener("input",()=>{i=Number(F.value),Q()}),q.addEventListener("input",()=>{r=Number(q.value),Z()}),E.addEventListener("input",()=>{l=Number(E.value),A(),u=!0}),window.addEventListener("keydown",t=>{t.code!=="BracketLeft"&&t.code!=="BracketRight"||(t.preventDefault(),l=Math.max(4,Math.min(100,l+(t.code==="BracketLeft"?-4:4))),A(),u=!0)}),H.addEventListener("click",()=>{o=!o,se.classList.toggle("is-closed",!o),se.setAttribute("aria-hidden",String(!o)),H.setAttribute("aria-expanded",String(o)),H.setAttribute("aria-label",o?"Close settings":"Open settings")}),R.addEventListener("click",()=>{d=!d;const t=d?"Resume simulation":"Pause simulation";R.setAttribute("aria-pressed",String(d)),R.setAttribute("aria-label",t),R.title=t,z=0}),ye.addEventListener("click",()=>{e.randomize(),g=!1,z=0,S+=1,Y.textContent="0.000",$.textContent="0.000",u=!0,I(),C()}),we.addEventListener("click",()=>{e.clearBlue(),g=!0,z=0,S+=1,Y.textContent="1.000",$.textContent="-2.000",u=!0,I(),C()}),w.addEventListener("pointerdown",t=>{if(k(t)){if(w.setPointerCapture(t.pointerId),f=!0,t.pointerType==="touch"){v.set(t.pointerId,{x:t.clientX,y:t.clientY}),v.size===1?(B=!0,U=!1):v.size===2&&(c=!1,_=null,B=!1,U=!0,G=!0,O=te(),K=n),u=!0;return}N(t)}}),w.addEventListener("pointermove",t=>{if(k(t),f=!0,u=!0,t.pointerType==="touch"){if(!v.has(t.pointerId))return;if(v.set(t.pointerId,{x:t.clientX,y:t.clientY}),G&&v.size>=2){const a=te();O>0&&a>0&&(n=Math.max(0,Math.min(3,K-Math.log2(a/O)*.9)));return}if(v.size===1&&!U){if(B)N(t),B=!1;else if(c)for(const a of t.getCoalescedEvents())T(a,!1)}return}if(c){const a=t.getCoalescedEvents();if(a.length===0)T(t,!1);else for(const m of a)T(m,!1)}});const ue=t=>{t.pointerType==="touch"&&(B&&!U&&N(t),v.delete(t.pointerId),v.size<2&&(G=!1),v.size===0&&(B=!1,U=!1,f=!1)),c=!1,_=null,w.hasPointerCapture(t.pointerId)&&w.releasePointerCapture(t.pointerId),u=!0,C()};w.addEventListener("pointerup",ue),w.addEventListener("pointercancel",t=>{v.delete(t.pointerId),c=!1,f=!1,_=null,B=!1,G=!1,u=!0}),w.addEventListener("pointerenter",()=>{f=!0,u=!0}),w.addEventListener("pointerleave",()=>{c||(f=!1,u=!0)}),w.addEventListener("wheel",t=>{t.preventDefault();const a=Math.max(-120,Math.min(120,t.deltaY));n=Math.max(0,Math.min(3,n+a*.00125)),k(t),f=!0},{passive:!1}),window.addEventListener("blur",()=>{c=!1,f=!1,_=null,v.clear(),G=!1,B=!1,u=!0}),window.addEventListener("resize",()=>ee(!0)),ee(!1),e.step(i,40),Q(),Z(),A(),u=!0,I(),C();const ie=t=>{const a=Math.min(.1,Math.max(0,(t-X)/1e3));X=t;const m=n-s;if(Math.abs(m)>5e-4?(s+=m*(1-Math.exp(-a*10)),M(),u=!0):s!==n&&(s=n,M(),u=!0),!d){z+=a*ge*r;const y=Math.min(8,Math.floor(z));y>0&&(z-=y,e.step(i,y),u=!0)}u&&I(),t-j>750&&(j=t,C()),requestAnimationFrame(ie)};requestAnimationFrame(ie)}Pe().catch(h=>{console.error(h),V.hidden=!1,V.textContent=h instanceof Error?h.message:"Could not start the WebGPU simulation."});
