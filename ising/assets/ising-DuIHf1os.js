(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function t(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=t(s);fetch(s.href,n)}})();async function Xe(){try{if(!navigator.gpu)return null;const p=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!p)return null;const e=await p.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(p){return console.error("WebGPU initialization failed.",p),null}}const Fe=`struct SimParams {
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
  map_strength: f32,
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

struct RegionParams {
  coarse: vec2<u32>,
  _pad: vec2<u32>,
}

@group(0) @binding(16) var<uniform> region_params: RegionParams;
@group(0) @binding(17) var<storage, read_write> region_cells: array<i32>;

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

fn orange_isolines(value: f32) -> f32 {
  let gradient = max(length(vec2<f32>(dpdx(value), dpdy(value))), 0.000001);
  let spacing = 0.28;
  let level = round(value / spacing) * spacing;
  let distance_in_pixels = abs(value - level) / gradient;
  let index_line = abs(level - 0.56) < 0.02;
  let half_width = select(0.48, 0.86, index_line);
  let mask = 1.0 - smoothstep(half_width - 0.28, half_width + 0.42, distance_in_pixels);
  let on_land = select(0.0, 1.0, value > 0.05 && level > spacing * 0.5);
  return mask * on_land * select(0.68, 1.0, index_line);
}

@compute @workgroup_size(8, 8)
fn sample_regions(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= region_params.coarse.x || gid.y >= region_params.coarse.y) { return; }
  let origin = vec2<f32>(gid.xy) / vec2<f32>(region_params.coarse);
  let cell = vec2<f32>(1.0) / vec2<f32>(region_params.coarse);
  let value = (
    textureSampleLevel(observed_field, field_sampler, origin + cell * vec2<f32>(0.25, 0.25), 0.0).r
    + textureSampleLevel(observed_field, field_sampler, origin + cell * vec2<f32>(0.75, 0.25), 0.0).r
    + textureSampleLevel(observed_field, field_sampler, origin + cell * vec2<f32>(0.25, 0.75), 0.0).r
    + textureSampleLevel(observed_field, field_sampler, origin + cell * vec2<f32>(0.75, 0.75), 0.0).r
  ) * 0.25;
  region_cells[gid.y * region_params.coarse.x + gid.x] = select(-1, 1, value >= 0.0);
}

@fragment
fn field_fragment(input: VertexOutput) -> @location(0) vec4<f32> {
  let uv = input.uv;
  let value = observed_value(uv);
  let cell = min(vec2<u32>(uv * render_params.grid), vec2<u32>(render_params.grid) - vec2<u32>(1u));
  let microscopic = textureLoad(sampled_field, vec2<i32>(cell), 0).r * 2.0 - 1.0;
  var color = mix(palette(value), palette(microscopic), render_params.micro_opacity);
  if (render_params.map_strength > 0.004) {
    let relief = orange_isolines(value);
    color = mix(color, vec3<f32>(0.29, 0.1, 0.045), relief * render_params.map_strength * 0.82);
  }

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
`,S=(p,e)=>Math.ceil(p/e),Z=112,Q=128,We=(p,e)=>p>=e?{width:Z,height:Math.max(1,Math.round(Z*e/p))}:{width:Math.max(1,Math.round(Z*p/e)),height:Z};class Ve{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,i){this.device=e,this.format=t,this.canvas=i;const s=i.getContext("webgpu");if(!s)throw new Error("Could not create a WebGPU canvas context.");this.context=s,this.context.configure({device:e,format:t,alphaMode:"opaque"});const n=e.createShaderModule({label:"Ising shaders",code:Fe});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:n,entryPoint:"fullscreen_vertex"},fragment:{module:n,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:Q*Q*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:Q*Q*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,i,s=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=i;return}const n=this.width,r=this.height,o=this.spinBuffers,u=this.fieldTexture,f=this.blurTextures,c=this.statsOutput,a=this.statsReadback,l=o?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=i,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),s&&l){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,n,r);const d=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),m=this.device.createCommandEncoder({label:"Resize Ising grid"}),g=m.beginComputePass();g.setPipeline(this.pipelines.resize),g.setBindGroup(0,d),g.dispatchWorkgroups(S(e,8),S(t,8)),g.end(),this.device.queue.submit([m.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...c?[c]:[]],readback:a??void 0,textures:[u,...f??[]].filter(d=>!!d)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(S(this.width,8),S(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(S(this.width,8),S(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let i=0;i<t;i+=1){const s=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,s);const n=this.device.createCommandEncoder({label:"Advance Ising state"}),r=n.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(S(this.width,8),S(this.height,8)),r.end(),this.device.queue.submit([n.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,i,s,n,r,o){const u=Math.floor(Math.min(e,i)-n),f=Math.floor(Math.min(t,s)-n),c=Math.ceil(Math.max(e,i)+n),a=Math.ceil(Math.max(t,s)+n),l=c-u+1,d=a-f+1;this.writeBrushParams(u,f,l,d,e,t,i,s,n,o);const m=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const b=m.beginComputePass();b.setPipeline(this.pipelines.select),b.setBindGroup(0,this.selectGroups[this.currentIndex]),b.dispatchWorkgroups(1),b.end()}const g=m.beginComputePass();g.setPipeline(this.pipelines.paint),g.setBindGroup(0,this.paintGroups[this.currentIndex]),g.dispatchWorkgroups(S(l,8),S(d,8)),g.end(),this.device.queue.submit([m.finish()]),this.fieldDirty=!0}draw(e,t,i,s,n){if(!this.renderGroup||!this.blurPrimaryVerticalGroup||!this.blurSecondaryHorizontalGroup||!this.blurSecondaryVerticalGroup)return;const r=e>1?Math.max(1,Math.round(t*.45)):0,o=this.fieldDirty||t!==this.lastBlurRadius||r!==this.lastSecondaryRadius,u=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const c=u.beginComputePass();c.setPipeline(this.pipelines.field),c.setBindGroup(0,this.fieldGroups[this.currentIndex]),c.dispatchWorkgroups(S(this.width,8),S(this.height,8)),c.end(),this.fieldDirty=!1}if(o){this.writeBlurParams(this.blurUniforms[0],t),this.writeBlurParams(this.blurUniforms[1],r);const c=u.beginComputePass({label:"Horizontal Ising observation blur"});c.setPipeline(this.pipelines.blurSpinsHorizontal),c.setBindGroup(0,this.blurPrimaryHorizontalGroups[this.currentIndex]),c.dispatchWorkgroups(S(this.height,64)),c.end();const a=u.beginComputePass({label:"Vertical Ising observation blur"});if(a.setPipeline(this.pipelines.blurTextureVertical),a.setBindGroup(0,this.blurPrimaryVerticalGroup),a.dispatchWorkgroups(S(this.width,64)),a.end(),r>0){const l=u.beginComputePass({label:"Secondary horizontal Ising blur"});l.setPipeline(this.pipelines.blurTextureHorizontal),l.setBindGroup(0,this.blurSecondaryHorizontalGroup),l.dispatchWorkgroups(S(this.height,64)),l.end();const d=u.beginComputePass({label:"Secondary vertical Ising blur"});d.setPipeline(this.pipelines.blurTextureVertical),d.setBindGroup(0,this.blurSecondaryVerticalGroup),d.dispatchWorkgroups(S(this.width,64)),d.end()}this.lastBlurRadius=t,this.lastSecondaryRadius=r}this.writeRenderParams(e,t,i,s,n);const f=u.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});f.setPipeline(this.pipelines.render),f.setBindGroup(0,this.renderGroup),f.draw(3),f.end(),this.device.queue.submit([u.finish()])}async readRegionSample(){const e=this.regionGroup;if(!e||this.regionReadback.mapState!=="unmapped")return null;const t=We(this.width,this.height),i=t.width*t.height;if(i*4>this.regionStorage.size)return null;this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([t.width,t.height,0,0]));const s=this.device.createCommandEncoder({label:"Read Ising regions"}),n=s.beginComputePass();n.setPipeline(this.pipelines.regions),n.setBindGroup(0,e),n.dispatchWorkgroups(S(t.width,8),S(t.height,8)),n.end(),s.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,i*4),this.device.queue.submit([s.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const r=new Int32Array(this.regionReadback.getMappedRange(),0,i),o=new Int8Array(i);for(let u=0;u<i;u+=1)o[u]=r[u]<0?-1:1;return{width:t.width,height:t.height,signs:o}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,i=this.statsGroups[this.currentIndex];if(!e||!t||!i)return{energy:0,magnetization:0,signedMagnetization:0};const s=S(this.width,16),n=S(this.height,16),r=new Uint32Array([this.width,this.height,s,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(e);const u=o.beginComputePass();u.setPipeline(this.pipelines.stats),u.setBindGroup(0,i),u.dispatchWorkgroups(s,n),u.end(),o.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([o.finish()]),await t.mapAsync(GPUMapMode.READ);const f=new Int32Array(t.getMappedRange()),c=f[0],a=f[1];t.unmap();const l=this.width*this.height;return{magnetization:Math.abs(c/l),signedMagnetization:c/l,energy:a/l}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}}]})}writeSimParams(e,t,i,s,n=0,r=0){const o=new ArrayBuffer(32),u=new DataView(o);u.setUint32(0,this.width,!0),u.setUint32(4,this.height,!0),u.setUint32(8,e,!0),u.setUint32(12,t,!0),u.setFloat32(16,i,!0),u.setUint32(20,s,!0),u.setUint32(24,n,!0),u.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(e,t,i,s,n,r,o,u,f,c){const a=new ArrayBuffer(64),l=new DataView(a);l.setUint32(0,this.width,!0),l.setUint32(4,this.height,!0),l.setInt32(8,e,!0),l.setInt32(12,t,!0),l.setUint32(16,i,!0),l.setUint32(20,s,!0),l.setUint32(24,c?1:0,!0),l.setFloat32(32,n,!0),l.setFloat32(36,r,!0),l.setFloat32(40,o,!0),l.setFloat32(44,u,!0),l.setFloat32(48,f,!0),this.device.queue.writeBuffer(this.brushUniform,0,a)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,i,s,n){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=t,r[5]=e,r[6]=i,r[7]=n.active?1:0,r[8]=n.x*this.density,r[9]=n.y*this.density,r[10]=n.radius*this.density,r[11]=n.painting?1:0,r[12]=n.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),r[14]=s,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const i of e.buffers)i.destroy();for(const i of e.textures??[])i.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const ze="aeiou",Ie="bcdfghklmnprstvw",Be=(p,e)=>e[Math.floor(p()*e.length)]??"a",He=(p,e)=>{for(let i=0;i<32;i+=1){const s=p()<.62?5:3;let n="";for(let r=0;r<s;r+=1)n+=Be(p,r%2===0?Ie:ze);if(!e?.has(n))return n}let t="";for(let i=0;i<7;i+=1)t+=Be(p,i%2===0?Ie:ze);return t},Me=(p,e)=>{const t=`${e.charAt(0).toUpperCase()}${e.slice(1)}`;return p==="continent"?`${t}ia`:p==="sea"?`Sea of ${t}`:p==="lake"?`Lake ${t}`:`${t} island`},qe=15,$e=.0035,je=.055,Ke=.058,Je=.042,Ze=.45,Qe=.3,Ge=2.5,ke=.75,et=3.2,Ue=.18,tt=.42,it=42,Ae=14,D=1.35,nt=30,ee=70,st=.55,rt=72,ot=[-70,-48,-28,-12,0,12,28,48,70],at=1.05,lt=.45,ut=.22,Ee=48,ct='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',Ce=p=>p==="continent"||p==="island",dt=p=>p==="continent"||p==="sea",L=(p,e,t)=>Math.min(t,Math.max(e,p)),ht=(p,e,t,i,s)=>{if(s)return e;const n=1-Math.exp(-t/i);return p+(e-p)*n},Le=(p,e,t)=>{if(e<$e)return null;const s=(t?dt(t):!1)?e>=Je:e>=(t?Ke:je);return p>0?s?"continent":"island":s?"sea":"lake"},ft=(p,e,t)=>{const i=p%e,s=Math.floor(p/e);return[(i+1)%e+s*e,(i-1+e)%e+s*e,i+(s+1)%t*e,i+(s-1+t)%t*e]},pt=(p,e,t)=>{const i=p%e,s=Math.floor(p/e),n=[];return i>0&&n.push(p-1),i+1<e&&n.push(p+1),s>0&&n.push(p-e),s+1<t&&n.push(p+e),n},gt=(p,e,t,i,s)=>{const n=new Int32Array(e),r=new Int32Array(e+1),o={any:null,wide:null,tall:null,anyArea:0,wideArea:0,tallArea:0},u=a=>{const l=a.w*a.h;l>o.anyArea&&(o.anyArea=l,o.any=a),a.w>=a.h*1.35&&l>o.wideArea&&(o.wideArea=l,o.wide=a),a.h>=a.w*1.35&&l>o.tallArea&&(o.tallArea=l,o.tall=a)};for(let a=0;a<t;a+=1){for(let d=0;d<e;d+=1)n[d]=p[d+a*e]===1?n[d]+1:0;let l=0;r[0]=-1;for(let d=0;d<=e;d+=1){const m=d===e?0:n[d];for(;l>0&&n[r[l]]>m;){const g=n[r[l]];l-=1;const b=d-r[l]-1;b>=i&&g>=s&&u({x:r[l]+1,y:a-g+1,w:b,h:g})}l+=1,r[l]=d}}const f=[],c=(a,l)=>a.x===l.x&&a.y===l.y&&a.w===l.w&&a.h===l.h;return o.any&&f.push(o.any),o.wide&&f.every(a=>!c(a,o.wide))&&f.push(o.wide),o.tall&&f.every(a=>!c(a,o.tall))&&f.push(o.tall),f},mt=(p,e,t)=>{const i=e*t;if(p.length!==i||i===0)return[];const s=new Uint8Array(i),n=[];for(let r=0;r<i;r+=1){if(s[r]!==0)continue;const o=p[r]<0?-1:1,u=[],f=[r];for(s[r]=1;f.length>0;){const l=f.pop();u.push(l);for(const d of ft(l,e,t))s[d]===0&&(p[d]<0?-1:1)===o&&(s[d]=1,f.push(d))}const c=u.length/i,a=Le(o,c,null);a&&n.push({sign:o,area:u.length,fraction:c,kind:a,cells:u})}return n.sort((r,o)=>o.area-r.area),n.length>Ee&&(n.length=Ee),n},ue=p=>p==="continent"?{min:16,max:38}:p==="sea"?{min:15,max:30}:{min:13,max:22},xt=p=>[{x:p.x,y:p.y}];class bt{measure;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextId=1;nextPlacementId=1;clock=0;synced=!1;lastIngest=-1;viewport={width:1,height:1};sampleWidth=0;sampleHeight=0;constructor(){if(typeof document>"u"){this.measure=null;return}this.measure=document.createElement("canvas").getContext("2d")}reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.synced=!1,this.lastIngest=-1,this.sampleWidth=0,this.sampleHeight=0}advance(e,t,i){this.viewport=i;const s=L(e,0,.5);this.clock+=s;const n=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;t!=="map"&&(this.synced=!1);for(const o of this.tracks.values()){t!=="map"&&(o.confirmed=!1),t==="map"&&o.confirmed&&o.missing<.001&&(o.age+=s);const u=o.placements.some(c=>c.locked),f=t==="map"&&this.synced&&o.confirmed&&o.age>=qe&&o.missing<(u?2:ke);for(const c of o.placements){c.alive&&c.locked&&this.glide(o,c,s),f&&c.alive&&(c.locked=!0);const a=f&&c.alive?1:0,l=t==="chaos"?ut:a?at:lt;c.opacity=L(ht(c.opacity,a,s,l,n),0,1)}o.placements=o.placements.filter(c=>c.alive||c.opacity>.02)}const r=this.collect();return t==="chaos"&&r.length===0&&this.reset(),r}ingest(e){if(e.signs.length!==e.width*e.height||e.width<2||e.height<2)return;const t=performance.now()/1e3,i=this.lastIngest<0?0:Math.min(2,t-this.lastIngest);this.lastIngest=t,(e.width!==this.sampleWidth||e.height!==this.sampleHeight)&&(this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.nextId=1,this.sampleWidth=e.width,this.sampleHeight=e.height);const s=mt(e.signs,e.width,e.height),n=new Map,r=[];for(let a=0;a<s.length;a+=1){n.clear();for(const l of s[a].cells){const d=this.owners[l]??0;d!==0&&n.set(d,(n.get(d)??0)+1)}for(const[l,d]of n)r.push({regionIndex:a,trackId:l,overlap:d})}r.sort((a,l)=>l.overlap-a.overlap);const o=new Map,u=new Set;for(const a of r){if(o.has(a.regionIndex)||u.has(a.trackId))continue;const l=this.tracks.get(a.trackId),d=s[a.regionIndex];if(!l||Ce(l.kind)!==Ce(d.kind)||a.overlap<Ze*d.area||a.overlap<Qe*l.area)continue;const m=d.area/l.area;m>Ge||m<1/Ge||(o.set(a.regionIndex,l),u.add(l.id))}for(const[a,l]of o){const d=s[a],m=Le(d.sign,d.fraction,l.kind)??d.kind;l.kind=m,l.text=Me(m,l.stem),l.area=d.area,l.missing=0,l.confirmed=!0,this.place(l,d)}for(const a of this.tracks.values())u.has(a.id)||(a.missing+=i,a.missing>=ke&&!a.placements.some(l=>l.locked)&&(a.age=0));for(const a of[...this.tracks.values()])a.missing<=et||(this.tracks.delete(a.id),this.usedStems.delete(a.stem));const f=[];for(let a=0;a<s.length;a+=1){if(o.has(a))continue;const l=s[a],d=He(Math.random,this.usedStems);this.usedStems.add(d);const m={id:this.nextId,stem:d,kind:l.kind,text:Me(l.kind,d),area:l.area,age:0,missing:0,confirmed:!0,placements:[],lastRelocate:-1,lastX:.5,lastY:.5};this.place(m,l),this.tracks.set(m.id,m),f.push({region:l,track:m}),this.nextId+=1,this.nextId>=65535&&(this.nextId=1)}const c=new Uint16Array(e.signs.length);if(this.owners.length===c.length)for(let a=0;a<c.length;a+=1){const l=this.owners[a];l!==0&&this.tracks.has(l)&&!u.has(l)&&(c[a]=l)}for(const[a,l]of o)for(const d of s[a].cells)c[d]=l.id;for(const a of f)for(const l of a.region.cells)c[l]=a.track.id;this.owners=c,this.synced=!0}place(e,t){const i=this.layouts(e,t.cells),s=new Set,n=[...e.placements].sort((r,o)=>o.opacity-r.opacity);for(const r of n){if(!r.alive)continue;let o=-1;const u=this.cellIndex(r.displayX,r.displayY);if(u>=0&&(o=i.findIndex((f,c)=>!s.has(c)&&f.mask[u]===1)),o<0){let f=Number.POSITIVE_INFINITY;for(let c=0;c<i.length;c+=1){if(s.has(c))continue;const a=i[c],l=this.planar(r.displayX,r.displayY,a.x,a.y);l<f&&(f=l,o=c)}}o<0||(s.add(o),this.adopt(e,r,i[o]))}for(let r=0;r<i.length;r+=1){if(s.has(r))continue;if(e.placements.filter(c=>c.alive).length>=2)break;const o=i[r],u=e.placements.some(c=>c.alive);u&&o.area<i[0].area*st||!this.mayAppear(e,o.x,o.y,u)||(this.spawn(e,o),s.add(r))}}layouts(e,t){const i=this.sampleWidth,s=this.sampleHeight,n=this.viewport.width,r=this.viewport.height;if(i<2||s<2||n<2||r<2||t.length===0)return[];const o=ue(e.kind),u=n/i,f=r/s,c=o.min*D+6,a=c/u,l=c/f,d=new Uint8Array(i*s);for(const g of t)d[g]=1;const m=[];for(const g of this.screenPieces(d,i,s)){const b=this.readInterior(g.mask);if(!b)continue;const x=[],B=Math.max(1,Math.floor(b.max*.45));for(let w=0;w<g.mask.length;w+=1)g.mask[w]===1&&b.dist[w]>=B&&x.push(w);const U=this.preferredAngle(x.length>=4?x:b.cells),M=new Uint8Array(g.mask.length),z=Math.max(1,Math.floor(b.max*.35));if(z>1)for(let w=0;w<M.length;w+=1)g.mask[w]===1&&b.dist[w]>=z&&(M[w]=1);let y=null;for(const w of z>1?[M,g.mask]:[g.mask]){for(const R of gt(w,i,s,a,l)){const T=this.chooseFit(e.text,e.kind,R,U);if(!T)continue;(!y||T.fontSize>y.fit.fontSize+1||Math.abs(T.fontSize-y.fit.fontSize)<=1&&R.w*R.h>y.rect.w*y.rect.h)&&(y={rect:R,fit:T})}if(y)break}if(!y)continue;const N=b.x/n,Y=b.y/r,k=this.limitsFor(y.rect,e.text,y.fit.fontSize,y.fit.letterSpacing,y.fit.angle);m.push({mask:g.mask,area:g.area,rect:y.rect,x:k?L(N,k.l,k.r):N,y:k?L(Y,k.t,k.b):Y,fontSize:y.fit.fontSize,letterSpacing:y.fit.letterSpacing,angle:y.fit.angle})}return m.sort((g,b)=>b.area-g.area),m}preferredAngle(e){const t=this.sampleWidth;if(e.length<4)return 0;let i=0,s=0;for(const m of e)i+=m%t+.5,s+=Math.floor(m/t)+.5;i/=e.length,s/=e.length;let n=0,r=0,o=0;for(const m of e){const g=m%t+.5-i,b=Math.floor(m/t)+.5-s;n+=g*g,r+=b*b,o+=g*b}const u=n+r,f=n*r-o*o,c=Math.sqrt(Math.max(0,u*u*.25-f)),a=u*.5-c,l=u*.5+c;if(a<=1||l/a<1.45)return 0;let d=Math.atan2(2*o,n-r)*.5*180/Math.PI;return d>90&&(d-=180),d<-90&&(d+=180),L(d,-ee,ee)}chooseFit(e,t,i,s){const n=[L(s,-ee,ee),...ot];let r=null;for(const o of n){const u=this.fitInside(e,t,i,o);if(!u)continue;const f=r!==null&&Math.abs(o-s)<Math.abs(r.angle-s)-.1;(r===null||u.fontSize>r.fontSize+1||Math.abs(u.fontSize-r.fontSize)<=1&&f)&&(r={fontSize:u.fontSize,letterSpacing:u.letterSpacing,angle:o})}return r}fitInside(e,t,i,s){const n=this.viewport.width/this.sampleWidth,r=this.viewport.height/this.sampleHeight,o=i.w*n-6,u=i.h*r-6,f=ue(t);if(o<8||u<f.min*D*.45)return null;const c=s*Math.PI/180,a=Math.abs(Math.cos(c)),l=Math.abs(Math.sin(c));for(let d=f.max;d>=f.min;d-=1){const m=d*D,g=d*Ue,b=this.boxWidth(e,d,g),x=this.extents(b,m,a,l);if(x.w>o||x.h>u)continue;let B=d*tt;const U=this.extents(this.boxWidth(e,d,B),m,a,l);return(U.w>o||U.h>u)&&(B=g),{fontSize:d,letterSpacing:B}}return null}extents(e,t,i,s){return{w:e*i+t*s,h:e*s+t*i}}readInterior(e){const t=this.sampleWidth,i=this.sampleHeight,s=t*i;if(e.length!==s||s===0)return null;const n=new Int16Array(s),r=new Int32Array(s);let o=0,u=0,f=!1;for(let x=0;x<s;x+=1){if(e[x]===1){n[x]=-1,f=!0;continue}n[x]=0,r[u]=x,u+=1}if(!f)return null;const c=[];for(let x=0;x<s;x+=1)e[x]===1&&c.push(x);const a=this.viewport.width/t,l=this.viewport.height/i;if(u===0){const x=Math.min(t,i);let B=0,U=0;for(const M of c)n[M]=x,B+=M%t+.5,U+=Math.floor(M/t)+.5;return{dist:n,max:x,x:B/c.length*a,y:U/c.length*l,cells:c}}for(;o<u;){const x=r[o];o+=1;const B=n[x]+1,U=x%t,M=Math.floor(x/t),z=[U>0?x-1:-1,U+1<t?x+1:-1,M>0?x-t:-1,M+1<i?x+t:-1];for(const y of z)y<0||n[y]!==-1||(n[y]=B,r[u]=y,u+=1)}let d=0,m=0,g=0,b=0;for(const x of c){const B=n[x]<0?0:n[x];n[x]=B,B>d&&(d=B)}for(let x=0;x<s;x+=1)e[x]!==1||n[x]<d||(m+=x%t+.5,g+=Math.floor(x/t)+.5,b+=1);return b===0?null:{dist:n,max:d,x:m/b*a,y:g/b*l,cells:c}}remember(e,t,i){if(e.homeScore<=0){e.homeX=t,e.homeY=i,e.homeScore=1,e.rivalX=t,e.rivalY=i,e.rivalScore=0;return}if(this.planar(e.homeX,e.homeY,t,i)<=64){e.homeX+=(t-e.homeX)*.3,e.homeY+=(i-e.homeY)*.3,e.homeScore+=1;return}if(e.rivalScore<=0||this.planar(e.rivalX,e.rivalY,t,i)>64){e.rivalX=t,e.rivalY=i,e.rivalScore=1;return}if(e.rivalX+=(t-e.rivalX)*.3,e.rivalY+=(i-e.rivalY)*.3,e.rivalScore+=1,e.rivalScore<=e.homeScore)return;const s=e.homeX,n=e.homeY,r=e.homeScore;e.homeX=e.rivalX,e.homeY=e.rivalY,e.homeScore=e.rivalScore,e.rivalX=s,e.rivalY=n,e.rivalScore=r}adopt(e,t,i){if(t.alive=!0,t.mask=i.mask,t.rectX=i.rect.x,t.rectY=i.rect.y,t.rectW=i.rect.w,t.rectH=i.rect.h,!t.locked){this.remember(t,i.x,i.y),t.displayX=t.homeX,t.displayY=t.homeY,t.idealX=t.homeX,t.idealY=t.homeY,t.angle=i.angle,t.idealAngle=i.angle,t.fontSize=i.fontSize,t.idealFont=i.fontSize,t.letterSpacing=i.letterSpacing,t.idealTracking=i.letterSpacing,t.avoiding=!1;return}if(this.remember(t,i.x,i.y),t.avoiding=!this.sitsInside(e,t),t.avoiding){t.homeX=i.x,t.homeY=i.y,t.idealX=i.x,t.idealY=i.y;return}t.idealX=t.homeX,t.idealY=t.homeY}spawn(e,t){e.placements.push({id:this.nextPlacementId,alive:!0,displayX:t.x,displayY:t.y,idealX:t.x,idealY:t.y,angle:t.angle,idealAngle:t.angle,fontSize:t.fontSize,idealFont:t.fontSize,letterSpacing:t.letterSpacing,idealTracking:t.letterSpacing,opacity:0,rectX:t.rect.x,rectY:t.rect.y,rectW:t.rect.w,rectH:t.rect.h,mask:t.mask,homeX:t.x,homeY:t.y,homeScore:1,rivalX:t.x,rivalY:t.y,rivalScore:0,locked:!1,avoiding:!1}),this.nextPlacementId+=1,this.nextPlacementId>=1e6&&(this.nextPlacementId=1)}retire(e,t){t.alive&&t.opacity>.15&&(e.lastRelocate=this.clock,e.lastX=t.displayX,e.lastY=t.displayY),t.alive=!1}mayAppear(e,t,i,s){return s||e.lastRelocate<0||this.clock-e.lastRelocate>=nt?!0:this.planar(e.lastX,e.lastY,t,i)<=rt}glide(e,t,i){if(t.avoiding){const u=t.fontSize*Ue,f=ue(e.kind);t.letterSpacing>u+.2?t.letterSpacing=Math.max(u,t.letterSpacing-10*i):t.fontSize>f.min&&(t.fontSize=Math.max(f.min,t.fontSize-6*i))}const s=(t.idealX-t.displayX)*this.viewport.width,n=(t.idealY-t.displayY)*this.viewport.height,r=Math.hypot(s,n);if(r<Ae)return;const o=Math.min(r-(Ae-2),it*i);o<=0||(t.displayX+=s/r*o/this.viewport.width,t.displayY+=n/r*o/this.viewport.height)}sitsInside(e,t){if(!t.mask||this.sampleWidth<2||this.sampleHeight<2)return!0;const i=this.viewport.width,s=this.viewport.height,n=i/this.sampleWidth,r=s/this.sampleHeight;for(const o of this.labelSamples(e,t)){if(o.x<1||o.y<1||o.x>i-1||o.y>s-1)return!1;const u=Math.floor(o.x/n),f=Math.floor(o.y/r);if(u<0||f<0||u>=this.sampleWidth||f>=this.sampleHeight||t.mask[u+f*this.sampleWidth]!==1)return!1}return!0}labelSamples(e,t){const i=t.displayX*this.viewport.width,s=t.displayY*this.viewport.height,n=Math.max(1,this.boxWidth(e.text,t.fontSize,t.letterSpacing)/2-2),r=Math.max(1,t.fontSize*D/2-2),o=t.angle*Math.PI/180,u=Math.cos(o),f=Math.sin(o),c=[];for(const a of[-n,0,n])for(const l of[-r,0,r])a===0&&l===0||c.push({x:i+a*u-l*f,y:s+a*f+l*u});return c}limitsFor(e,t,i,s,n){if(i<1||this.sampleWidth<2||this.sampleHeight<2)return null;const r=this.viewport.width,o=this.viewport.height,u=n*Math.PI/180,f=this.extents(this.boxWidth(t,i,s),i*D,Math.abs(Math.cos(u)),Math.abs(Math.sin(u))),c=r/this.sampleWidth,a=o/this.sampleHeight,l=3;let d=e.x*c+f.w/2+l,m=(e.x+e.w)*c-f.w/2-l,g=e.y*a+f.h/2+l,b=(e.y+e.h)*a-f.h/2-l;if(d=Math.max(d,f.w/2),m=Math.min(m,r-f.w/2),g=Math.max(g,f.h/2),b=Math.min(b,o-f.h/2),m<d){if(d-m>1)return null;const x=(d+m)/2;d=x,m=x}if(b<g){if(g-b>1)return null;const x=(g+b)/2;g=x,b=x}return{l:d/r,t:g/o,r:m/r,b:b/o}}cellIndex(e,t){const i=this.sampleWidth,s=this.sampleHeight;if(i<1||s<1)return-1;const n=Math.floor(L(e,0,.999999)*i),r=Math.floor(L(t,0,.999999)*s);return n+r*i}planar(e,t,i,s){return Math.hypot((e-i)*this.viewport.width,(t-s)*this.viewport.height)}boxWidth(e,t,i){return this.textWidth(e,t,i)*1.06+2}textWidth(e,t,i){const s=Math.max(0,e.length-1);return this.measure?(this.measure.font=`500 ${t}px ${ct}`,this.measure.fontKerning="none",this.measure.measureText(e).width+i*s):t*.56*e.length+i*s}screenPieces(e,t,i){const s=new Uint8Array(e.length),n=[];for(let r=0;r<e.length;r+=1){if(e[r]!==1||s[r]!==0)continue;const o=new Uint8Array(e.length),u=[r];s[r]=1;let f=0;for(;u.length>0;){const c=u.pop();o[c]=1,f+=1;for(const a of pt(c,t,i))s[a]!==0||e[a]!==1||(s[a]=1,u.push(a))}n.push({mask:o,area:f})}return n}collect(){const e=[],{width:t,height:i}=this.viewport;for(const s of this.tracks.values())for(const n of s.placements)n.opacity<=.015||n.fontSize<1||e.push({id:n.id,kind:s.kind,text:s.text,x:n.displayX*t,y:n.displayY*i,width:this.boxWidth(s.text,n.fontSize,n.letterSpacing),height:n.fontSize*D,opacity:n.opacity,fontSize:n.fontSize,letterSpacing:n.letterSpacing,angle:n.angle});return e}}const Re=2/Math.log(1+Math.sqrt(2)),_t=30,ce=40,P=p=>{const e=document.getElementById(p);if(!e)throw new Error(`Missing #${p}`);return e},C=P("field"),te=P("scale"),de=P("temperature"),he=P("time-speed"),ie=P("brush-size"),vt=P("scale-value"),yt=P("temperature-value"),wt=P("time-speed-value"),St=P("brush-size-value"),Pt=P("explanation"),fe=P("settings-toggle"),Te=P("settings-panel"),ne=P("pause"),zt=P("restart"),It=P("clear-blue"),pe=P("phase"),ge=P("magnetization"),me=P("energy"),se=P("fatal-error"),Bt=P("place-labels"),Mt=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function Gt(){const p=await Xe();if(!p){se.hidden=!1,se.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new Ve(p.device,p.format,C);let t=Number(de.value),i=Number(te.value),s=i,n=Number(he.value),r=Number(ie.value),o=!1,u=!0,f=!1,c=!1,a=!1,l=0,d=0,m=null,g=!0,b=0,x=performance.now(),B=0,U=!1,M=0;const z=new Map;let y=!1,N=0,Y=i,k=!1,w=!1,R=0,T=0,H=!1,xe=0;const re=new bt,q=new Map,be=Re+.2,Oe=()=>{const h=Math.max(1,window.innerWidth),_=Math.max(1,window.innerHeight),v=h<=720?Math.min(window.devicePixelRatio||1,2):1,I=Math.min(p.device.limits.maxTextureDimension2D/h,p.device.limits.maxTextureDimension2D/_),G=Math.sqrt(Number(p.device.limits.maxStorageBufferBindingSize)/4/(h*_)),A=Math.max(.25,Math.min(v,I,G)),E=Math.max(1,Math.round(h*A)),O=Math.max(1,Math.round(_*A));return{density:E/h,width:E,height:O}},X=()=>Math.max(0,Math.round((2**i-1)*(Math.min(e.width,e.height)/65.64)))*2+1,$=()=>{const h=X();te.value=i.toFixed(2),vt.textContent=h===1?"1 spin":`${h} × ${h}`,Pt.textContent=Mt[Math.min(3,Math.floor(i+.25))],document.documentElement.style.setProperty("--noise-opacity",(.12*(1-i/3)**2).toFixed(3))},_e=()=>{yt.textContent=`T = ${t.toFixed(2)}`;const h=t-Re;h<-.2?pe.textContent="ordered":h>.2?pe.textContent="disordered":pe.textContent="critical"},ve=()=>{const h=Number.isInteger(n)?0:1;wt.textContent=`${n.toFixed(h)}×`},oe=()=>{ie.value=String(r),St.textContent=`${r} px`},Ne=()=>({active:a&&!y&&!w,painting:f,forceHot:c,x:l,y:d,radius:r/2}),F=()=>{const h=X(),_=(h-1)/2,v=h===1?0:.14*(1-i/3)**2;e.draw(i,_,v,R,Ne()),g=!1},ae=()=>{T+=1,re.reset(),ye([])},ye=h=>{const _=new Set;for(const v of h){_.add(v.id);const I=xt(v);let G=q.get(v.id);for(G||(G=[],q.set(v.id,G));G.length<I.length;){const A=document.createElement("span");A.className="place-label",Bt.append(A),G.push(A)}for(;G.length>I.length;)G.pop()?.remove();for(let A=0;A<I.length;A+=1){const E=G[A],O=I[A];E.dataset.kind!==v.kind&&(E.dataset.kind=v.kind),E.textContent!==v.text&&(E.textContent=v.text),E.style.opacity=v.opacity.toFixed(3),E.style.fontSize=`${v.fontSize.toFixed(2)}px`,E.style.letterSpacing=`${v.letterSpacing.toFixed(2)}px`,E.style.transform=`translate(${O.x.toFixed(2)}px, ${O.y.toFixed(2)}px) rotate(${v.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[v,I]of q)if(!_.has(v)){for(const G of I)G.remove();q.delete(v)}},we=(h=!0)=>{const _=Oe();e.resize(_.width,_.height,_.density,h),$(),g=!0,F(),M+=1,ae()},j=h=>{const _=C.getBoundingClientRect(),v=(h.clientX-_.left)/_.width,I=(h.clientY-_.top)/_.height;return v<0||v>=1||I<0||I>=1?null:(l=h.clientX-_.left,d=h.clientY-_.top,{x:v*e.width,y:I*e.height})},K=(h,_)=>{const v=j(h);if(!v){m=null;return}const I=m??v;e.paintSegment(I.x,I.y,v.x,v.y,r*e.density/2,_,c),m=v,g=!0},le=h=>{f=!0,m=null,K(h,!0),c=!1},Se=()=>{const h=[...z.values()];return h.length<2?0:Math.hypot(h[1].x-h[0].x,h[1].y-h[0].y)},W=()=>{if(U)return;U=!0;const h=M;e.readStats().then(_=>{if(h!==M)return;ge.textContent=_.magnetization.toFixed(3),me.textContent=_.energy.toFixed(3);const v=_.signedMagnetization===-1;!f&&c!==v&&(c=v,g=!0)}).catch(_=>{console.warn("Could not read Ising statistics.",_)}).finally(()=>{U=!1})};te.addEventListener("input",()=>{i=Number(te.value),s=i,$(),g=!0}),de.addEventListener("input",()=>{t=Number(de.value),_e()}),he.addEventListener("input",()=>{n=Number(he.value),ve()}),ie.addEventListener("input",()=>{r=Number(ie.value),oe(),g=!0}),window.addEventListener("keydown",h=>{h.code!=="BracketLeft"&&h.code!=="BracketRight"||(h.preventDefault(),r=Math.max(4,Math.min(100,r+(h.code==="BracketLeft"?-4:4))),oe(),g=!0)}),fe.addEventListener("click",()=>{u=!u,Te.classList.toggle("is-closed",!u),Te.setAttribute("aria-hidden",String(!u)),fe.setAttribute("aria-expanded",String(u)),fe.setAttribute("aria-label",u?"Close settings":"Open settings")}),ne.addEventListener("click",()=>{o=!o;const h=o?"Resume simulation":"Pause simulation";ne.setAttribute("aria-pressed",String(o)),ne.setAttribute("aria-label",h),ne.title=h,b=0}),zt.addEventListener("click",()=>{e.randomize(),c=!1,b=0,M+=1,ae(),ge.textContent="0.000",me.textContent="0.000",g=!0,F(),W()}),It.addEventListener("click",()=>{e.clearBlue(),c=!0,b=0,M+=1,ae(),ge.textContent="1.000",me.textContent="-2.000",g=!0,F(),W()}),C.addEventListener("pointerdown",h=>{if(j(h)){if(C.setPointerCapture(h.pointerId),a=!0,h.pointerType==="touch"){z.set(h.pointerId,{x:h.clientX,y:h.clientY}),z.size===1?(k=!0,w=!1):z.size===2&&(f=!1,m=null,k=!1,w=!0,y=!0,N=Se(),Y=s),g=!0;return}le(h)}}),C.addEventListener("pointermove",h=>{if(j(h),a=!0,g=!0,h.pointerType==="touch"){if(!z.has(h.pointerId))return;if(z.set(h.pointerId,{x:h.clientX,y:h.clientY}),y&&z.size>=2){const _=Se();N>0&&_>0&&(s=Math.max(0,Math.min(3,Y-Math.log2(_/N)*.9)));return}if(z.size===1&&!w){if(k)le(h),k=!1;else if(f)for(const _ of h.getCoalescedEvents())K(_,!1)}return}if(f){const _=h.getCoalescedEvents();if(_.length===0)K(h,!1);else for(const v of _)K(v,!1)}});const De=h=>{h.pointerType==="touch"&&(k&&!w&&le(h),z.delete(h.pointerId),z.size<2&&(y=!1),z.size===0&&(k=!1,w=!1,a=!1)),f=!1,m=null,C.hasPointerCapture(h.pointerId)&&C.releasePointerCapture(h.pointerId),g=!0,W()};C.addEventListener("pointerup",De),C.addEventListener("pointercancel",h=>{z.delete(h.pointerId),f=!1,a=!1,m=null,k=!1,y=!1,g=!0}),C.addEventListener("pointerenter",()=>{a=!0,g=!0}),C.addEventListener("pointerleave",()=>{f||(a=!1,g=!0)}),C.addEventListener("wheel",h=>{h.preventDefault();const _=Math.max(-120,Math.min(120,h.deltaY));s=Math.max(0,Math.min(3,s+_*.00125)),j(h),a=!0},{passive:!1}),window.addEventListener("blur",()=>{f=!1,a=!1,m=null,z.clear(),y=!1,k=!1,g=!0}),window.addEventListener("resize",()=>we(!0)),we(!1),e.step(t,40),_e(),ve(),oe(),g=!0,F(),W();const Pe=h=>{const _=Math.max(0,(h-x)/1e3),v=Math.min(.1,_);x=h;const I=s-i;if(Math.abs(I)>5e-4?(i+=I*(1-Math.exp(-v*10)),$(),g=!0):i!==s&&(i=s,$(),g=!0),!o){b+=v*_t*n;const V=Math.min(8,Math.floor(b));V>0&&(b-=V,e.step(t,V),g=!0)}const G=X()>=ce?1:0,A=G-R;Math.abs(A)>.001?(R+=A*(1-Math.exp(-v*7)),g=!0):R!==G&&(R=G,g=!0);const E=t>be?"chaos":X()>=ce?"map":"hidden",O=C.getBoundingClientRect(),Ye=re.advance(Math.min(.5,_),E,{width:O.width,height:O.height});if(ye(Ye),g&&F(),!H&&E==="map"&&h-xe>280){xe=h,H=!0;const V=T;e.readRegionSample().then(J=>{V!==T||!J||t>be||X()<ce||re.ingest(J)}).catch(J=>{console.warn("Could not read Ising regions.",J)}).finally(()=>{H=!1})}h-B>750&&(B=h,W()),requestAnimationFrame(Pe)};requestAnimationFrame(Pe)}Gt().catch(p=>{console.error(p),se.hidden=!1,se.textContent=p instanceof Error?p.message:"Could not start the WebGPU simulation."});
