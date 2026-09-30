(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function e(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=e(s);fetch(s.href,i)}})();async function ot(){try{if(!navigator.gpu)return null;const b=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!b)return null;const t=await b.requestDevice();return t.lost.then(e=>{console.error("WebGPU device lost:",e.message)}),t.addEventListener("uncapturederror",e=>{console.error("WebGPU:",e.error.message)}),{device:t,format:navigator.gpu.getPreferredCanvasFormat()}}catch(b){return console.error("WebGPU initialization failed.",b),null}}const at=`struct SimParams {
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
    color = mix(color, vec3<f32>(0.29, 0.1, 0.045), relief * render_params.map_strength * 0.42);
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
`,G=(b,t)=>Math.ceil(b/t),ne=112,se=128,lt=(b,t)=>b>=t?{width:ne,height:Math.max(1,Math.round(ne*t/b))}:{width:Math.max(1,Math.round(ne*b/t)),height:ne};class ut{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(t,e,n){this.device=t,this.format=e,this.canvas=n;const s=n.getContext("webgpu");if(!s)throw new Error("Could not create a WebGPU canvas context.");this.context=s,this.context.configure({device:t,format:e,alphaMode:"opaque"});const i=t.createShaderModule({label:"Ising shaders",code:at});this.pipelines={randomize:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"randomize"}}),clearBlue:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"clear_blue"}}),resize:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"resize_grid"}}),update:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"metropolis"}}),field:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"write_field"}}),blurSpinsHorizontal:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_vertical"}}),select:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"select_spin"}}),paint:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"paint"}}),stats:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"reduce_stats"}}),regions:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"sample_regions"}}),render:t.createRenderPipeline({layout:"auto",vertex:{module:i,entryPoint:"fullscreen_vertex"},fragment:{module:i,entryPoint:"field_fragment",targets:[{format:e}]},primitive:{topology:"triangle-list"}})},this.simUniform=t.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=t.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=t.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=t.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(r=>t.createBuffer({label:`Ising blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=t.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=t.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=t.createBuffer({label:"Ising region sample",size:se*se*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=t.createBuffer({label:"Ising region readback",size:se*se*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=t.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(t,e,n,s=!0){if(t===this.width&&e===this.height&&this.spinBuffers){this.density=n;return}const i=this.width,r=this.height,o=this.spinBuffers,l=this.fieldTexture,c=this.blurTextures,u=this.statsOutput,g=this.statsReadback,d=o?.[this.currentIndex]??null;if(this.width=t,this.height=e,this.density=n,this.currentIndex=0,this.canvas.width=t,this.canvas.height=e,this.allocateResources(),s&&d){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,i,r);const a=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),h=this.device.createCommandEncoder({label:"Resize Ising grid"}),p=h.beginComputePass();p.setPipeline(this.pipelines.resize),p.setBindGroup(0,a),p.dispatchWorkgroups(G(t,8),G(e,8)),p.end(),this.device.queue.submit([h.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...u?[u]:[]],readback:g??void 0,textures:[l,...c??[]].filter(a=>!!a)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const t=this.device.createCommandEncoder({label:"Randomize Ising state"}),e=t.beginComputePass();e.setPipeline(this.pipelines.randomize),e.setBindGroup(0,this.randomGroups[this.currentIndex]),e.dispatchWorkgroups(G(this.width,8),G(this.height,8)),e.end(),this.device.queue.submit([t.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const t=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),e=t.beginComputePass();e.setPipeline(this.pipelines.clearBlue),e.setBindGroup(0,this.clearGroups[this.currentIndex]),e.dispatchWorkgroups(G(this.width,8),G(this.height,8)),e.end(),this.device.queue.submit([t.finish()]),this.fieldDirty=!0}step(t,e){for(let n=0;n<e;n+=1){const s=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,t,s);const i=this.device.createCommandEncoder({label:"Advance Ising state"}),r=i.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(G(this.width,8),G(this.height,8)),r.end(),this.device.queue.submit([i.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}e>0&&(this.fieldDirty=!0)}paintSegment(t,e,n,s,i,r,o){const l=Math.floor(Math.min(t,n)-i),c=Math.floor(Math.min(e,s)-i),u=Math.ceil(Math.max(t,n)+i),g=Math.ceil(Math.max(e,s)+i),d=u-l+1,a=g-c+1;this.writeBrushParams(l,c,d,a,t,e,n,s,i,o);const h=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const m=h.beginComputePass();m.setPipeline(this.pipelines.select),m.setBindGroup(0,this.selectGroups[this.currentIndex]),m.dispatchWorkgroups(1),m.end()}const p=h.beginComputePass();p.setPipeline(this.pipelines.paint),p.setBindGroup(0,this.paintGroups[this.currentIndex]),p.dispatchWorkgroups(G(d,8),G(a,8)),p.end(),this.device.queue.submit([h.finish()]),this.fieldDirty=!0}draw(t,e,n,s,i){if(!this.renderGroup||!this.blurPrimaryVerticalGroup||!this.blurSecondaryHorizontalGroup||!this.blurSecondaryVerticalGroup)return;const r=t>1?Math.max(1,Math.round(e*.45)):0,o=this.fieldDirty||e!==this.lastBlurRadius||r!==this.lastSecondaryRadius,l=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const u=l.beginComputePass();u.setPipeline(this.pipelines.field),u.setBindGroup(0,this.fieldGroups[this.currentIndex]),u.dispatchWorkgroups(G(this.width,8),G(this.height,8)),u.end(),this.fieldDirty=!1}if(o){this.writeBlurParams(this.blurUniforms[0],e),this.writeBlurParams(this.blurUniforms[1],r);const u=l.beginComputePass({label:"Horizontal Ising observation blur"});u.setPipeline(this.pipelines.blurSpinsHorizontal),u.setBindGroup(0,this.blurPrimaryHorizontalGroups[this.currentIndex]),u.dispatchWorkgroups(G(this.height,64)),u.end();const g=l.beginComputePass({label:"Vertical Ising observation blur"});if(g.setPipeline(this.pipelines.blurTextureVertical),g.setBindGroup(0,this.blurPrimaryVerticalGroup),g.dispatchWorkgroups(G(this.width,64)),g.end(),r>0){const d=l.beginComputePass({label:"Secondary horizontal Ising blur"});d.setPipeline(this.pipelines.blurTextureHorizontal),d.setBindGroup(0,this.blurSecondaryHorizontalGroup),d.dispatchWorkgroups(G(this.height,64)),d.end();const a=l.beginComputePass({label:"Secondary vertical Ising blur"});a.setPipeline(this.pipelines.blurTextureVertical),a.setBindGroup(0,this.blurSecondaryVerticalGroup),a.dispatchWorkgroups(G(this.width,64)),a.end()}this.lastBlurRadius=e,this.lastSecondaryRadius=r}this.writeRenderParams(t,e,n,s,i);const c=l.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});c.setPipeline(this.pipelines.render),c.setBindGroup(0,this.renderGroup),c.draw(3),c.end(),this.device.queue.submit([l.finish()])}async readRegionSample(){const t=this.regionGroup;if(!t||this.regionReadback.mapState!=="unmapped")return null;const e=lt(this.width,this.height),n=e.width*e.height;if(n*4>this.regionStorage.size)return null;this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([e.width,e.height,0,0]));const s=this.device.createCommandEncoder({label:"Read Ising regions"}),i=s.beginComputePass();i.setPipeline(this.pipelines.regions),i.setBindGroup(0,t),i.dispatchWorkgroups(G(e.width,8),G(e.height,8)),i.end(),s.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,n*4),this.device.queue.submit([s.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const r=new Int32Array(this.regionReadback.getMappedRange(),0,n),o=new Int8Array(n);for(let l=0;l<n;l+=1)o[l]=r[l]<0?-1:1;return{width:e.width,height:e.height,signs:o}}finally{this.regionReadback.unmap()}}async readStats(){const t=this.statsOutput,e=this.statsReadback,n=this.statsGroups[this.currentIndex];if(!t||!e||!n)return{energy:0,magnetization:0,signedMagnetization:0};const s=G(this.width,16),i=G(this.height,16),r=new Uint32Array([this.width,this.height,s,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(t);const l=o.beginComputePass();l.setPipeline(this.pipelines.stats),l.setBindGroup(0,n),l.dispatchWorkgroups(s,i),l.end(),o.copyBufferToBuffer(t,0,e,0,8),this.device.queue.submit([o.finish()]),await e.mapAsync(GPUMapMode.READ);const c=new Int32Array(e.getMappedRange()),u=c[0],g=c[1];e.unmap();const d=this.width*this.height;return{magnetization:Math.abs(u/d),signedMagnetization:u/d,energy:g/d}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const t=this.width*this.height*4;this.spinBuffers=[0,1].map(e=>this.device.createBuffer({label:`Ising spin buffer ${e}`,size:t,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(e=>this.device.createTexture({label:`Ising full-resolution blur ${e}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(e=>e.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const t=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(e=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[e]}},{binding:1,resource:{buffer:this.spinBuffers[1-e]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:e}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:t},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}}]})}writeSimParams(t,e,n,s,i=0,r=0){const o=new ArrayBuffer(32),l=new DataView(o);l.setUint32(0,this.width,!0),l.setUint32(4,this.height,!0),l.setUint32(8,t,!0),l.setUint32(12,e,!0),l.setFloat32(16,n,!0),l.setUint32(20,s,!0),l.setUint32(24,i,!0),l.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(t,e,n,s,i,r,o,l,c,u){const g=new ArrayBuffer(64),d=new DataView(g);d.setUint32(0,this.width,!0),d.setUint32(4,this.height,!0),d.setInt32(8,t,!0),d.setInt32(12,e,!0),d.setUint32(16,n,!0),d.setUint32(20,s,!0),d.setUint32(24,u?1:0,!0),d.setFloat32(32,i,!0),d.setFloat32(36,r,!0),d.setFloat32(40,o,!0),d.setFloat32(44,l,!0),d.setFloat32(48,c,!0),this.device.queue.writeBuffer(this.brushUniform,0,g)}writeBlurParams(t,e){this.device.queue.writeBuffer(t,0,new Uint32Array([this.width,this.height,e,0]))}writeRenderParams(t,e,n,s,i){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=e,r[5]=t,r[6]=n,r[7]=i.active?1:0,r[8]=i.x*this.density,r[9]=i.y*this.density,r[10]=i.radius*this.density,r[11]=i.painting?1:0,r[12]=i.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),r[14]=s,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(t){const e=()=>{for(const n of t.buffers)n.destroy();for(const n of t.textures??[])n.destroy();t.readback&&(t.readback.mapState==="unmapped"?t.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:t.readback}),250))};this.device.queue.onSubmittedWorkDone().then(e)}}const Le="aeiou",De="bcdfghklmnprstvw",Fe=(b,t)=>t[Math.floor(b()*t.length)]??"a",ct=(b,t)=>{for(let n=0;n<32;n+=1){const s=b()<.62?5:3;let i="";for(let r=0;r<s;r+=1)i+=Fe(b,r%2===0?De:Le);if(!t?.has(i))return i}let e="";for(let n=0;n<7;n+=1)e+=Fe(b,n%2===0?De:Le);return e},Ye=(b,t)=>{const e=`${t.charAt(0).toUpperCase()}${t.slice(1)}`;return b==="continent"?`${e}ia`:b==="sea"?`Sea of ${e}`:b==="lake"?`Lake ${e}`:`${e} island`},dt=15,ht=.0035,ft=.008,pt=.055,gt=.058,mt=.042,xt=.45,bt=.3,Xe=2.5,Ve=.75,_t=3.2,He=.12,yt=.28,_e=30,ye=120,vt=.85,Y=1.35,re=24,wt=150,St=14,Pt=20,It=8,We=8,Mt=.625,qe=7,zt=.22,kt=.7,Bt=.35,Et=.9,Gt=[-24,-12,0,12,24],At=1.05,Ct=.45,Ut=.22,$e=48,Tt='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',je=b=>b==="continent"||b==="island",Nt=b=>b==="continent"||b==="sea",L=(b,t,e)=>Math.min(e,Math.max(t,b)),K=(b,t,e,n,s)=>{if(s)return t;const i=1-Math.exp(-e/n);return b+(t-b)*i},Ze=(b,t,e)=>{if(t<ht)return null;const s=(e?Nt(e):!1)?t>=mt:t>=(e?gt:pt),i=b>0?s?"continent":"island":s?"sea":"lake";return i==="island"&&t<ft?null:i},Rt=(b,t,e)=>{const n=b%t,s=Math.floor(b/t);return[(n+1)%t+s*t,(n-1+t)%t+s*t,n+(s+1)%e*t,n+(s-1+e)%e*t]},Ot=(b,t,e)=>{const n=b%t,s=Math.floor(b/t),i=[];return n>0&&i.push(b-1),n+1<t&&i.push(b+1),s>0&&i.push(b-t),s+1<e&&i.push(b+t),i},Lt=(b,t,e,n,s)=>{const i=new Int32Array(t),r=new Int32Array(t+1),o={any:null,wide:null,tall:null,anyArea:0,wideArea:0,tallArea:0},l=g=>{const d=g.w*g.h;d>o.anyArea&&(o.anyArea=d,o.any=g),g.w>=g.h*1.35&&d>o.wideArea&&(o.wideArea=d,o.wide=g),g.h>=g.w*1.35&&d>o.tallArea&&(o.tallArea=d,o.tall=g)};for(let g=0;g<e;g+=1){for(let a=0;a<t;a+=1)i[a]=b[a+g*t]===1?i[a]+1:0;let d=0;r[0]=-1;for(let a=0;a<=t;a+=1){const h=a===t?0:i[a];for(;d>0&&i[r[d]]>h;){const p=i[r[d]];d-=1;const m=a-r[d]-1;m>=n&&p>=s&&l({x:r[d]+1,y:g-p+1,w:m,h:p})}d+=1,r[d]=a}}const c=[],u=(g,d)=>g.x===d.x&&g.y===d.y&&g.w===d.w&&g.h===d.h;return o.any&&c.push(o.any),o.wide&&c.every(g=>!u(g,o.wide))&&c.push(o.wide),o.tall&&c.every(g=>!u(g,o.tall))&&c.push(o.tall),c},Dt=(b,t,e)=>{const n=t*e;if(b.length!==n||n===0)return[];const s=new Uint8Array(n),i=[];for(let r=0;r<n;r+=1){if(s[r]!==0)continue;const o=b[r]<0?-1:1,l=[],c=[r];for(s[r]=1;c.length>0;){const d=c.pop();l.push(d);for(const a of Rt(d,t,e))s[a]===0&&(b[a]<0?-1:1)===o&&(s[a]=1,c.push(a))}const u=l.length/n,g=Ze(o,u,null);g&&i.push({sign:o,area:l.length,fraction:u,kind:g,cells:l})}return i.sort((r,o)=>o.area-r.area),i.length>$e&&(i.length=$e),i},Ke=b=>b==="continent"?{min:22,max:38}:b==="sea"?{min:18,max:30}:{min:16,max:20},Ft=b=>[{x:b.x,y:b.y}];class Yt{measure;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextId=1;nextPlacementId=1;synced=!1;lastIngest=-1;viewport={width:1,height:1};sampleWidth=0;sampleHeight=0;constructor(){if(typeof document>"u"){this.measure=null;return}this.measure=document.createElement("canvas").getContext("2d")}reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.synced=!1,this.lastIngest=-1,this.sampleWidth=0,this.sampleHeight=0}advance(t,e,n){this.viewport=n;const s=L(t,0,.5),i=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;e!=="map"&&(this.synced=!1);for(const o of this.tracks.values()){e!=="map"&&(o.confirmed=!1),e==="map"&&o.confirmed&&o.missing<.001&&(o.age+=s);const l=o.placements.some(u=>u.locked),c=e==="map"&&this.synced&&o.confirmed&&o.age>=dt&&o.missing<(l?2:Ve);for(const u of o.placements){u.alive&&u.locked&&this.glide(o,u,s),c&&u.alive&&(u.locked=!0);const g=c&&u.alive?1:0,d=e==="chaos"?Ut:g?At:Ct;u.opacity=L(K(u.opacity,g,s,d,i),0,1)}o.placements=o.placements.filter(u=>u.alive||u.opacity>.02)}this.resolveCollisions(s,i);const r=this.collect();return e==="chaos"&&r.length===0&&this.reset(),r}ingest(t){if(t.signs.length!==t.width*t.height||t.width<2||t.height<2)return;const e=performance.now()/1e3,n=this.lastIngest<0?0:Math.min(2,e-this.lastIngest);if(this.lastIngest=e,t.width!==this.sampleWidth||t.height!==this.sampleHeight){const a=this.sampleWidth,h=this.sampleHeight;this.owners=this.regridOwners(this.owners,a,h,t.width,t.height);for(const p of this.tracks.values()){p.history=p.history.map(m=>this.regridMask(m,a,h,t.width,t.height));for(const m of p.placements)m.mask=m.mask?this.regridMask(m.mask,a,h,t.width,t.height):null}this.sampleWidth=t.width,this.sampleHeight=t.height}const s=Dt(t.signs,t.width,t.height),i=new Map,r=[];for(let a=0;a<s.length;a+=1){i.clear();for(const h of s[a].cells){const p=this.owners[h]??0;p!==0&&i.set(p,(i.get(p)??0)+1)}for(const[h,p]of i)r.push({regionIndex:a,trackId:h,overlap:p})}const o=new Map,l=new Set,c=new Map,u=new Map;for(const a of r){const h=this.tracks.get(a.trackId),p=s[a.regionIndex];if(!h||je(h.kind)!==je(p.kind)||a.overlap<xt*p.area||a.overlap<bt*h.area)continue;const m=p.area/h.area;if(m>Xe||m<1/Xe)continue;const x=u.get(h.id)??[];x.push(a),u.set(h.id,x)}for(const a of u.values()){a.sort((m,x)=>x.overlap-m.overlap);const h=a[0],p=c.get(h.regionIndex)??[];p.push(h),c.set(h.regionIndex,p)}for(const[a,h]of c){h.sort((m,x)=>{const I=this.tracks.get(m.trackId),S=(this.tracks.get(x.trackId)?.age??0)-(I?.age??0);return Math.abs(S)>.25?S:x.overlap-m.overlap});const p=this.tracks.get(h[0].trackId);p&&(o.set(a,p),l.add(p.id))}for(const[a,h]of o){const p=s[a],m=Ze(p.sign,p.fraction,h.kind)??p.kind;h.kind=m,h.text=Ye(m,h.stem),h.area=p.area,h.missing=0,h.confirmed=!0,this.rememberRegion(h,p.cells),this.place(h,p)}for(const a of this.tracks.values())l.has(a.id)||(a.missing+=n,a.missing>=Ve&&!a.placements.some(h=>h.locked)&&(a.age=0));for(const a of[...this.tracks.values()])a.missing<=_t||(this.tracks.delete(a.id),this.usedStems.delete(a.stem));const g=[];for(let a=0;a<s.length;a+=1){if(o.has(a))continue;const h=s[a],p=ct(Math.random,this.usedStems);this.usedStems.add(p);const m={id:this.nextId,stem:p,kind:h.kind,text:Ye(h.kind,p),area:h.area,age:0,missing:0,confirmed:!0,placements:[],history:[]};this.rememberRegion(m,h.cells),this.place(m,h),this.tracks.set(m.id,m),g.push({region:h,track:m}),this.nextId+=1,this.nextId>=65535&&(this.nextId=1)}const d=new Uint16Array(t.signs.length);if(this.owners.length===d.length)for(let a=0;a<d.length;a+=1){const h=this.owners[a];h!==0&&this.tracks.has(h)&&!l.has(h)&&(d[a]=h)}for(const[a,h]of o)for(const p of s[a].cells)d[p]=h.id;for(const a of g)for(const h of a.region.cells)d[h]=a.track.id;this.owners=d,this.synced=!0}place(t,e){const n=this.layouts(t,e.cells),s=new Set,i=new Set,r=[...t.placements].sort((o,l)=>l.opacity-o.opacity);for(const o of r){if(!o.alive)continue;let l=-1;const c=this.cellIndex(o.displayX,o.displayY);if(c>=0&&(l=n.findIndex((u,g)=>!s.has(g)&&u.mask[c]===1)),l<0){let u=Number.POSITIVE_INFINITY;for(let g=0;g<n.length;g+=1){if(s.has(g))continue;const d=n[g],a=this.planar(o.displayX,o.displayY,d.x,d.y);a<u&&(u=a,l=g)}}l<0||!this.adopt(t,o,n[l])||(s.add(l),i.add(o.id))}for(const o of t.placements)o.alive&&!i.has(o.id)&&this.retire(o);for(let o=0;o<n.length;o+=1){if(s.has(o))continue;if(t.placements.some(c=>c.alive))break;const l=n[o];this.spawn(t,l),s.add(o)}}layouts(t,e){const n=this.sampleWidth,s=this.sampleHeight,i=this.viewport.width,r=this.viewport.height;if(n<2||s<2||i<2||r<2||e.length===0)return[];const o=Ke(t.kind),l=i/n,c=r/s,u=o.min*Y+6,g=u/l,d=u/c,a=new Uint8Array(n*s);for(const p of e)a[p]=1;const h=[];for(const p of this.screenPieces(a,n,s)){const m=this.temporalMask(p.mask,t.history),x=this.readInterior(m)??this.readInterior(p.mask);if(!x)continue;const I=[],z=Math.max(1,Math.floor(x.max*.45));for(let k=0;k<p.mask.length;k+=1)p.mask[k]===1&&x.dist[k]>=z&&I.push(k);const S=this.preferredAngle(I.length>=4?I:x.cells),M=new Uint8Array(m.length),w=Math.max(1,Math.floor(x.max*.35));if(w>1)for(let k=0;k<M.length;k+=1)m[k]===1&&x.dist[k]>=w&&(M[k]=1);let P=null;for(const k of w>1?[M,m,p.mask]:[m,p.mask]){for(const R of Lt(k,n,s,g,d)){const O=this.chooseFit(t.text,t.kind,R,S);if(!O)continue;(!P||O.fontSize>P.fit.fontSize+1||Math.abs(O.fontSize-P.fit.fontSize)<=1&&R.w*R.h>P.rect.w*P.rect.h)&&(P={rect:R,fit:O})}if(P)break}if(!P)continue;const U=x.x/i,D=x.y/r,A=this.limitsFor(P.rect,t.text,P.fit.fontSize,P.fit.letterSpacing,P.fit.angle);h.push({mask:p.mask,area:p.area,rect:P.rect,x:A?L(U,A.l,A.r):U,y:A?L(D,A.t,A.b):D,fontSize:P.fit.fontSize,letterSpacing:P.fit.letterSpacing,angle:P.fit.angle})}return h.sort((p,m)=>m.area-p.area),h}rememberRegion(t,e){const n=new Uint8Array(this.sampleWidth*this.sampleHeight);for(const s of e)n[s]=1;t.history.unshift(n),t.history.length>We&&(t.history.length=We)}temporalMask(t,e){if(e.length<2)return t;const n=new Uint8Array(t.length),s=Math.ceil(e.length*Mt);let i=0;for(let r=0;r<t.length;r+=1){if(t[r]!==1)continue;let o=0;for(const l of e)o+=l[r]??0;o<s||(n[r]=1,i+=1)}return i>0?n:t}regridOwners(t,e,n,s,i){const r=new Uint16Array(s*i);if(e<1||n<1||t.length!==e*n)return r;for(let o=0;o<i;o+=1){const l=Math.min(n-1,Math.floor((o+.5)*n/i));for(let c=0;c<s;c+=1){const u=Math.min(e-1,Math.floor((c+.5)*e/s));r[c+o*s]=t[u+l*e]}}return r}regridMask(t,e,n,s,i){const r=new Uint8Array(s*i);if(e<1||n<1||t.length!==e*n)return r;for(let o=0;o<i;o+=1){const l=Math.min(n-1,Math.floor((o+.5)*n/i));for(let c=0;c<s;c+=1){const u=Math.min(e-1,Math.floor((c+.5)*e/s));r[c+o*s]=t[u+l*e]}}return r}preferredAngle(t){const e=this.sampleWidth;if(t.length<4)return 0;let n=0,s=0;for(const h of t)n+=h%e+.5,s+=Math.floor(h/e)+.5;n/=t.length,s/=t.length;let i=0,r=0,o=0;for(const h of t){const p=h%e+.5-n,m=Math.floor(h/e)+.5-s;i+=p*p,r+=m*m,o+=p*m}const l=i+r,c=i*r-o*o,u=Math.sqrt(Math.max(0,l*l*.25-c)),g=l*.5-u,d=l*.5+u;if(g<=1||d/g<1.45)return 0;let a=Math.atan2(2*o,i-r)*.5*180/Math.PI;return a>90&&(a-=180),a<-90&&(a+=180),L(a,-re,re)}chooseFit(t,e,n,s){const i=[L(s,-re,re),...Gt];let r=null;for(const o of i){const l=this.fitInside(t,e,n,o);if(!l)continue;const c=r!==null&&Math.abs(o-s)<Math.abs(r.angle-s)-.1;(r===null||l.fontSize>r.fontSize+1||Math.abs(l.fontSize-r.fontSize)<=1&&c)&&(r={fontSize:l.fontSize,letterSpacing:l.letterSpacing,angle:o})}return r}fitInside(t,e,n,s){const i=this.viewport.width/this.sampleWidth,r=this.viewport.height/this.sampleHeight,o=n.w*i-6,l=n.h*r-6,c=Ke(e);if(o<8||l<c.min*Y*.45)return null;const u=s*Math.PI/180,g=Math.abs(Math.cos(u)),d=Math.abs(Math.sin(u)),a=S=>{const M=S*Y,w=S*He,P=this.boxWidth(t,S,w),U=this.extents(P,M,g,d);return U.w<=o&&U.h<=l};if(!a(c.min))return null;let h=c.min,p=c.max;for(let S=0;S<8;S+=1){const M=(h+p)/2;a(M)?h=M:p=M}const m=h,x=m*Y;let I=m*He,z=m*yt;for(let S=0;S<6;S+=1){const M=(I+z)/2,w=this.extents(this.boxWidth(t,m,M),x,g,d);w.w<=o&&w.h<=l?I=M:z=M}return{fontSize:m,letterSpacing:I}}extents(t,e,n,s){return{w:t*n+e*s,h:t*s+e*n}}readInterior(t){const e=this.sampleWidth,n=this.sampleHeight,s=e*n;if(t.length!==s||s===0)return null;const i=new Int16Array(s),r=new Int32Array(s);let o=0,l=0,c=!1;for(let x=0;x<s;x+=1){if(t[x]===1){i[x]=-1,c=!0;continue}i[x]=0,r[l]=x,l+=1}if(!c)return null;const u=[];for(let x=0;x<s;x+=1)t[x]===1&&u.push(x);const g=this.viewport.width/e,d=this.viewport.height/n;if(l===0){const x=Math.min(e,n);let I=0,z=0;for(const S of u)i[S]=x,I+=S%e+.5,z+=Math.floor(S/e)+.5;return{dist:i,max:x,x:I/u.length*g,y:z/u.length*d,cells:u}}for(;o<l;){const x=r[o];o+=1;const I=i[x]+1,z=x%e,S=Math.floor(x/e),M=[z>0?x-1:-1,z+1<e?x+1:-1,S>0?x-e:-1,S+1<n?x+e:-1];for(const w of M)w<0||i[w]!==-1||(i[w]=I,r[l]=w,l+=1)}let a=0,h=0,p=0,m=0;for(const x of u){const I=i[x]<0?0:i[x];i[x]=I,I>a&&(a=I)}for(let x=0;x<s;x+=1)t[x]!==1||i[x]<a||(h+=x%e+.5,p+=Math.floor(x/e)+.5,m+=1);return m===0?null:{dist:i,max:a,x:h/m*g,y:p/m*d,cells:u}}adopt(t,e,n){const s=this.planar(e.displayX,e.displayY,n.x,n.y),i=this.cellIndex(e.displayX,e.displayY),r=i>=0&&n.mask[i]===1;if(e.locked&&(!r&&s>wt||!r&&!this.pathFits(t.text,n,e.displayX,e.displayY)))return!1;if(e.alive=!0,e.mask=n.mask,!e.locked)return e.displayX=n.x,e.displayY=n.y,e.idealX=n.x,e.idealY=n.y,e.angle=n.angle,e.fontSize=n.fontSize,e.letterSpacing=n.letterSpacing,e.candidateX=n.x,e.candidateY=n.y,e.candidateFrames=0,!0;const o=n.fontSize<e.idealFont?.32:.2;return e.idealFont+=(n.fontSize-e.idealFont)*o,e.idealTracking+=(n.letterSpacing-e.idealTracking)*o,e.idealAngle+=(n.angle-e.idealAngle)*.18,this.planar(e.idealX,e.idealY,n.x,n.y)<=St?(e.idealX+=(n.x-e.idealX)*.18,e.idealY+=(n.y-e.idealY)*.18,e.candidateFrames=0,!0):(this.planar(e.candidateX,e.candidateY,n.x,n.y)<=Pt?(e.candidateX+=(n.x-e.candidateX)*.35,e.candidateY+=(n.y-e.candidateY)*.35,e.candidateFrames+=1):(e.candidateX=n.x,e.candidateY=n.y,e.candidateFrames=1),e.candidateFrames>=It&&(e.idealX=e.candidateX,e.idealY=e.candidateY,e.candidateFrames=0),!0)}spawn(t,e){t.placements.push({id:this.nextPlacementId,alive:!0,displayX:e.x,displayY:e.y,idealX:e.x,idealY:e.y,angle:e.angle,idealAngle:e.angle,fontSize:e.fontSize,idealFont:e.fontSize,letterSpacing:e.letterSpacing,idealTracking:e.letterSpacing,opacity:0,collisionOpacity:0,mask:e.mask,velocityX:0,velocityY:0,candidateX:e.x,candidateY:e.y,candidateFrames:0,collisionHidden:!1,collisionChangeSeconds:0,locked:!1}),this.nextPlacementId+=1,this.nextPlacementId>=1e6&&(this.nextPlacementId=1)}retire(t){t.alive=!1}glide(t,e,n){const s=e.idealFont<e.fontSize?.45:1.8,i=K(e.fontSize,e.idealFont,n,s,!1),r=K(e.letterSpacing,e.idealTracking,n,1.1,!1),o=K(e.angle,e.idealAngle,n,1.25,!1);let l=e.mask?this.geometryViolations(e.mask,t.text,e.displayX,e.displayY,e.fontSize,e.letterSpacing,e.angle):0;const c=e.mask?this.geometryViolations(e.mask,t.text,e.displayX,e.displayY,i,r,o):0;c<=l&&(e.fontSize=i,e.letterSpacing=r,e.angle=o,l=c);const u=this.viewport.width,g=this.viewport.height;let d=e.displayX*u,a=e.displayY*g;const h=e.idealX*u,p=e.idealY*g,m=2/vt;let x=(h-d)*m*m-2*m*e.velocityX,I=(p-a)*m*m-2*m*e.velocityY;const z=Math.hypot(x,I);z>ye&&(x*=ye/z,I*=ye/z),e.velocityX+=x*n,e.velocityY+=I*n;const S=Math.hypot(e.velocityX,e.velocityY);S>_e&&(e.velocityX*=_e/S,e.velocityY*=_e/S),d+=e.velocityX*n,a+=e.velocityY*n,Math.hypot(h-d,p-a)<.3&&Math.hypot(e.velocityX,e.velocityY)<.5&&(d=h,a=p,e.velocityX=0,e.velocityY=0);const M=d/u,w=a/g;(e.mask?this.geometryViolations(e.mask,t.text,M,w,e.fontSize,e.letterSpacing,e.angle):0)<=l?(e.displayX=M,e.displayY=w):(e.velocityX=0,e.velocityY=0)}geometryFits(t,e,n,s,i,r,o){return this.geometryViolations(t,e,n,s,i,r,o)===0}geometryViolations(t,e,n,s,i,r,o){if(this.sampleWidth<2||this.sampleHeight<2)return 0;const l=this.viewport.width,c=this.viewport.height,u=l/this.sampleWidth,g=c/this.sampleHeight,d=n*l,a=s*c,h=Math.max(1,this.boxWidth(e,i,r)/2-1),p=Math.max(1,i*Y/2-1),m=o*Math.PI/180,x=Math.cos(m),I=Math.sin(m),z=this.extents(h*2,p*2,Math.abs(x),Math.abs(I));if(d-z.w/2<1||a-z.h/2<1||d+z.w/2>l-1||a+z.h/2>c-1)return Number.POSITIVE_INFINITY;const S=Math.max(2,Math.min(u,g)*.45),M=Math.max(2,Math.ceil(h*2/S)),w=Math.max(2,Math.ceil(p*2/S));let P=0;for(let U=0;U<=w;U+=1){const D=-p+U/w*p*2;for(let A=0;A<=M;A+=1){const k=-h+A/M*h*2,R=d+k*x-D*I,O=a+k*I+D*x,F=Math.floor(R/u),V=Math.floor(O/g);if(F<0||V<0||F>=this.sampleWidth||V>=this.sampleHeight){P+=1;continue}t[F+V*this.sampleWidth]!==1&&(P+=1)}}return P}pathFits(t,e,n,s){const i=this.planar(n,s,e.x,e.y),r=this.viewport.width/this.sampleWidth,o=this.viewport.height/this.sampleHeight,l=Math.max(4,Math.min(8,r,o)),c=Math.max(1,Math.ceil(i/l));for(let u=1;u<=c;u+=1){const g=u/c;if(!this.geometryFits(e.mask,t,n+(e.x-n)*g,s+(e.y-s)*g,e.fontSize,e.letterSpacing,e.angle))return!1}return!0}limitsFor(t,e,n,s,i){if(n<1||this.sampleWidth<2||this.sampleHeight<2)return null;const r=this.viewport.width,o=this.viewport.height,l=i*Math.PI/180,c=this.extents(this.boxWidth(e,n,s),n*Y,Math.abs(Math.cos(l)),Math.abs(Math.sin(l))),u=r/this.sampleWidth,g=o/this.sampleHeight,d=3;let a=t.x*u+c.w/2+d,h=(t.x+t.w)*u-c.w/2-d,p=t.y*g+c.h/2+d,m=(t.y+t.h)*g-c.h/2-d;if(a=Math.max(a,c.w/2),h=Math.min(h,r-c.w/2),p=Math.max(p,c.h/2),m=Math.min(m,o-c.h/2),h<a){if(a-h>1)return null;const x=(a+h)/2;a=x,h=x}if(m<p){if(p-m>1)return null;const x=(p+m)/2;p=x,m=x}return{l:a/r,t:p/o,r:h/r,b:m/o}}cellIndex(t,e){const n=this.sampleWidth,s=this.sampleHeight;if(n<1||s<1)return-1;const i=Math.floor(L(t,0,.999999)*n),r=Math.floor(L(e,0,.999999)*s);return i+r*n}planar(t,e,n,s){return Math.hypot((t-n)*this.viewport.width,(e-s)*this.viewport.height)}boxWidth(t,e,n){return this.textWidth(t,e,n)*1.06+2}textWidth(t,e,n){const s=Math.max(0,t.length-1);return this.measure?(this.measure.font=`500 ${e}px ${Tt}`,this.measure.fontKerning="none",this.measure.measureText(t).width+n*s):e*.56*t.length+n*s}screenPieces(t,e,n){const s=new Uint8Array(t.length),i=[];for(let r=0;r<t.length;r+=1){if(t[r]!==1||s[r]!==0)continue;const o=new Uint8Array(t.length),l=[r];s[r]=1;let c=0;for(;l.length>0;){const u=l.pop();o[u]=1,c+=1;for(const g of Ot(u,e,n))s[g]!==0||t[g]!==1||(s[g]=1,l.push(g))}i.push({mask:o,area:c})}return i}collisionPriority(t){return t==="lake"?4:t==="island"?3:t==="continent"?2:1}placementCorners(t,e){const n=e.displayX*this.viewport.width,s=e.displayY*this.viewport.height,i=this.boxWidth(t.text,e.fontSize,e.letterSpacing)/2+qe,r=e.fontSize*Y/2+qe,o=e.angle*Math.PI/180,l=Math.cos(o),c=Math.sin(o);return[{x:-i,y:-r},{x:i,y:-r},{x:i,y:r},{x:-i,y:r}].map(u=>({x:n+u.x*l-u.y*c,y:s+u.x*c+u.y*l}))}boxesOverlap(t,e){for(const n of[t,e])for(let s=0;s<2;s+=1){const i=n[s],r=n[(s+1)%n.length],o=-(r.y-i.y),l=r.x-i.x;let c=Number.POSITIVE_INFINITY,u=Number.NEGATIVE_INFINITY,g=Number.POSITIVE_INFINITY,d=Number.NEGATIVE_INFINITY;for(const a of t){const h=a.x*o+a.y*l;c=Math.min(c,h),u=Math.max(u,h)}for(const a of e){const h=a.x*o+a.y*l;g=Math.min(g,h),d=Math.max(d,h)}if(u<=g||d<=c)return!1}return!0}resolveCollisions(t,e){const n=[];for(const i of this.tracks.values())for(const r of i.placements)!r.alive&&r.opacity<=.02||r.fontSize<1||n.push({track:i,placement:r,corners:this.placementCorners(i,r)});n.sort((i,r)=>{const o=this.collisionPriority(r.track.kind)-this.collisionPriority(i.track.kind);if(o!==0)return o;const l=r.track.age-i.track.age;return Math.abs(l)>.25?l:i.track.id-r.track.id});const s=[];for(const i of n){const r=s.some(c=>c.track.id!==i.track.id&&this.boxesOverlap(i.corners,c.corners));if(r===i.placement.collisionHidden)i.placement.collisionChangeSeconds=0;else if(i.placement.opacity<.05&&r)i.placement.collisionHidden=!0,i.placement.collisionChangeSeconds=0;else{i.placement.collisionChangeSeconds+=t;const c=r?Bt:Et;i.placement.collisionChangeSeconds>=c&&(i.placement.collisionHidden=r,i.placement.collisionChangeSeconds=0)}const o=i.placement.collisionHidden?0:1,l=i.placement.collisionHidden?zt:kt;i.placement.collisionOpacity=L(K(i.placement.collisionOpacity,o,t,l,e),0,1),r||s.push(i)}}collect(){const t=[],{width:e,height:n}=this.viewport;for(const s of this.tracks.values())for(const i of s.placements){const r=i.opacity*i.collisionOpacity;r<=.015||i.fontSize<1||t.push({id:i.id,kind:s.kind,text:s.text,x:i.displayX*e,y:i.displayY*n,width:this.boxWidth(s.text,i.fontSize,i.letterSpacing),height:i.fontSize*Y,opacity:r,fontSize:i.fontSize,letterSpacing:i.letterSpacing,angle:i.angle})}return t}}const Je=2/Math.log(1+Math.sqrt(2)),Xt=30,ve=40,B=b=>{const t=document.getElementById(b);if(!t)throw new Error(`Missing #${b}`);return t},N=B("field"),oe=B("scale"),H=B("temperature"),we=B("time-speed"),ae=B("brush-size"),Vt=B("scale-value"),Ht=B("temperature-value"),Wt=B("time-speed-value"),qt=B("brush-size-value"),$t=B("explanation"),Se=B("settings-toggle"),Qe=B("settings-panel"),le=B("pause"),jt=B("restart"),Kt=B("clear-blue"),ue=B("freeze"),ce=B("heat"),Pe=B("phase"),Ie=B("magnetization"),Me=B("energy"),de=B("fatal-error"),Jt=B("place-labels"),Qt=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function Zt(){const b=await ot();if(!b){de.hidden=!1,de.textContent="This experiment requires a browser with WebGPU enabled.";return}const t=new ut(b.device,b.format,N);let e=Number(H.value),n=e,s=Number(oe.value),i=s,r=Number(we.value),o=Number(ae.value),l=!1,c=!0,u=!1,g=!1,d=!1,a=0,h=0,p=null,m=!0,x=0,I=performance.now(),z=0,S=!1,M=0;const w=new Map;let P=!1,U=0,D=s,A=!1,k=!1,R=0,O=0,F=!1,V=0;const he=new Yt,J=new Map,fe=new Set,pe=new Set,ze=Je+.2,ge=Number(H.min),ke=Number(H.max),et=1.35,tt=.75,it=()=>{const f=Math.max(1,window.innerWidth),_=Math.max(1,window.innerHeight),y=f<=720?Math.min(window.devicePixelRatio||1,2):1,E=Math.min(b.device.limits.maxTextureDimension2D/f,b.device.limits.maxTextureDimension2D/_),v=Math.sqrt(Number(b.device.limits.maxStorageBufferBindingSize)/4/(f*_)),C=Math.max(.25,Math.min(y,E,v)),T=Math.max(1,Math.round(f*C)),X=Math.max(1,Math.round(_*C));return{density:T/f,width:T,height:X}},W=()=>Math.max(0,Math.round((2**s-1)*(Math.min(t.width,t.height)/65.64)))*2+1,Q=()=>{const f=W();oe.value=s.toFixed(2),Vt.textContent=f===1?"1 spin":`${f} × ${f}`,$t.textContent=Qt[Math.min(3,Math.floor(s+.25))],document.documentElement.style.setProperty("--noise-opacity",(.12*(1-s/3)**2).toFixed(3))},Z=()=>{H.value=e.toFixed(2),Ht.textContent=`T = ${e.toFixed(2)}`;const f=Math.max(0,Math.min(1,(e-ge)/(ke-ge)));ue.style.setProperty("--temperature-progress",(1-f).toFixed(4)),ce.style.setProperty("--temperature-progress",f.toFixed(4)),ue.setAttribute("aria-label",`Freeze, current temperature ${e.toFixed(2)}`),ce.setAttribute("aria-label",`Heat, current temperature ${e.toFixed(2)}`);const _=e-Je;_<-.2?Pe.textContent="ordered":_>.2?Pe.textContent="disordered":Pe.textContent="critical"},Be=()=>{const f=Number.isInteger(r)?0:1;Wt.textContent=`${r.toFixed(f)}×`},me=()=>{ae.value=String(o),qt.textContent=`${o} px`},nt=()=>({active:d&&!P&&!k,painting:u,forceHot:g,x:a,y:h,radius:o/2}),q=()=>{const f=W(),_=(f-1)/2,y=f===1?0:.14*(1-s/3)**2;t.draw(s,_,y,R,nt()),m=!1},Ee=()=>{O+=1,he.reset(),Ge([])},Ge=f=>{const _=new Set;for(const y of f){_.add(y.id);const E=Ft(y);let v=J.get(y.id);for(v||(v=[],J.set(y.id,v));v.length<E.length;){const C=document.createElement("span");C.className="place-label",Jt.append(C),v.push(C)}for(;v.length>E.length;)v.pop()?.remove();for(let C=0;C<E.length;C+=1){const T=v[C],X=E[C];T.dataset.kind!==y.kind&&(T.dataset.kind=y.kind),T.textContent!==y.text&&(T.textContent=y.text),T.style.opacity=y.opacity.toFixed(3),T.style.fontSize=`${y.fontSize.toFixed(2)}px`,T.style.letterSpacing=`${y.letterSpacing.toFixed(2)}px`,T.style.transform=`translate(${X.x.toFixed(2)}px, ${X.y.toFixed(2)}px) rotate(${y.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[y,E]of J)if(!_.has(y)){for(const v of E)v.remove();J.delete(y)}},Ae=(f=!0)=>{const _=it();t.resize(_.width,_.height,_.density,f),Q(),m=!0,q(),M+=1,O+=1},ee=f=>{const _=N.getBoundingClientRect(),y=(f.clientX-_.left)/_.width,E=(f.clientY-_.top)/_.height;return y<0||y>=1||E<0||E>=1?null:(a=f.clientX-_.left,h=f.clientY-_.top,{x:y*t.width,y:E*t.height})},te=(f,_)=>{const y=ee(f);if(!y){p=null;return}const E=p??y;t.paintSegment(E.x,E.y,y.x,y.y,o*t.density/2,_,g),p=y,m=!0},xe=f=>{u=!0,p=null,te(f,!0),g=!1},Ce=()=>{const f=[...w.values()];return f.length<2?0:Math.hypot(f[1].x-f[0].x,f[1].y-f[0].y)},$=()=>{if(S)return;S=!0;const f=M;t.readStats().then(_=>{if(f!==M)return;Ie.textContent=_.magnetization.toFixed(3),Me.textContent=_.energy.toFixed(3);const y=_.signedMagnetization===-1;!u&&g!==y&&(g=y,m=!0)}).catch(_=>{console.warn("Could not read Ising statistics.",_)}).finally(()=>{S=!1})};oe.addEventListener("input",()=>{s=Number(oe.value),i=s,Q(),m=!0}),H.addEventListener("input",()=>{n=Number(H.value),e=n,Z()});const Ue=(f,_)=>{const y=()=>{f.setAttribute("aria-pressed",String(_.size>0))},E=v=>{_.delete(`pointer:${v.pointerId}`),f.hasPointerCapture(v.pointerId)&&f.releasePointerCapture(v.pointerId),y()};f.addEventListener("pointerdown",v=>{v.pointerType==="mouse"&&v.button!==0||(v.preventDefault(),f.setPointerCapture(v.pointerId),_.add(`pointer:${v.pointerId}`),y())}),f.addEventListener("pointerup",E),f.addEventListener("pointercancel",E),f.addEventListener("lostpointercapture",v=>{_.delete(`pointer:${v.pointerId}`),y()}),f.addEventListener("keydown",v=>{v.code!=="Space"&&v.code!=="Enter"||(v.preventDefault(),_.add(`key:${v.code}`),y())}),f.addEventListener("keyup",v=>{v.code!=="Space"&&v.code!=="Enter"||(v.preventDefault(),_.delete(`key:${v.code}`),y())}),f.addEventListener("blur",()=>{for(const v of _)v.startsWith("key:")&&_.delete(v);y()})};Ue(ue,fe),Ue(ce,pe),we.addEventListener("input",()=>{r=Number(we.value),Be()}),ae.addEventListener("input",()=>{o=Number(ae.value),me(),m=!0}),window.addEventListener("keydown",f=>{f.code!=="BracketLeft"&&f.code!=="BracketRight"||(f.preventDefault(),o=Math.max(4,Math.min(100,o+(f.code==="BracketLeft"?-4:4))),me(),m=!0)}),Se.addEventListener("click",()=>{c=!c,Qe.classList.toggle("is-closed",!c),Qe.setAttribute("aria-hidden",String(!c)),Se.setAttribute("aria-expanded",String(c)),Se.setAttribute("aria-label",c?"Close settings":"Open settings")}),le.addEventListener("click",()=>{l=!l;const f=l?"Resume simulation":"Pause simulation";le.setAttribute("aria-pressed",String(l)),le.setAttribute("aria-label",f),le.title=f,x=0}),jt.addEventListener("click",()=>{t.randomize(),g=!1,x=0,M+=1,Ee(),Ie.textContent="0.000",Me.textContent="0.000",m=!0,q(),$()}),Kt.addEventListener("click",()=>{t.clearBlue(),g=!0,x=0,M+=1,Ee(),Ie.textContent="1.000",Me.textContent="-2.000",m=!0,q(),$()}),N.addEventListener("pointerdown",f=>{if(ee(f)){if(N.setPointerCapture(f.pointerId),d=!0,f.pointerType==="touch"){w.set(f.pointerId,{x:f.clientX,y:f.clientY}),w.size===1?(A=!0,k=!1):w.size===2&&(u=!1,p=null,A=!1,k=!0,P=!0,U=Ce(),D=i),m=!0;return}xe(f)}}),N.addEventListener("pointermove",f=>{if(ee(f),d=!0,m=!0,f.pointerType==="touch"){if(!w.has(f.pointerId))return;if(w.set(f.pointerId,{x:f.clientX,y:f.clientY}),P&&w.size>=2){const _=Ce();U>0&&_>0&&(i=Math.max(0,Math.min(3,D-Math.log2(_/U)*.9)));return}if(w.size===1&&!k){if(A)xe(f),A=!1;else if(u)for(const _ of f.getCoalescedEvents())te(_,!1)}return}if(u){const _=f.getCoalescedEvents();if(_.length===0)te(f,!1);else for(const y of _)te(y,!1)}});const st=f=>{f.pointerType==="touch"&&(A&&!k&&xe(f),w.delete(f.pointerId),w.size<2&&(P=!1),w.size===0&&(A=!1,k=!1,d=!1)),u=!1,p=null,N.hasPointerCapture(f.pointerId)&&N.releasePointerCapture(f.pointerId),m=!0,$()};N.addEventListener("pointerup",st),N.addEventListener("pointercancel",f=>{w.delete(f.pointerId),u=!1,d=!1,p=null,A=!1,P=!1,m=!0}),N.addEventListener("pointerenter",()=>{d=!0,m=!0}),N.addEventListener("pointerleave",()=>{u||(d=!1,m=!0)}),N.addEventListener("wheel",f=>{f.preventDefault();const _=Math.max(-120,Math.min(120,f.deltaY));i=Math.max(0,Math.min(3,i+_*.00125)),ee(f),d=!0},{passive:!1}),window.addEventListener("blur",()=>{u=!1,d=!1,p=null,w.clear(),P=!1,A=!1,fe.clear(),pe.clear(),ue.setAttribute("aria-pressed","false"),ce.setAttribute("aria-pressed","false"),m=!0}),window.addEventListener("resize",()=>Ae(!0)),Ae(!1),t.step(e,40),Z(),Be(),me(),m=!0,q(),$();const Te=f=>{const _=Math.max(0,(f-I)/1e3),y=Math.min(.1,_);I=f;const E=i-s;Math.abs(E)>5e-4?(s+=E*(1-Math.exp(-y*10)),Q(),m=!0):s!==i&&(s=i,Q(),m=!0);const v=+(pe.size>0)-+(fe.size>0),C=v<0?ge:v>0?ke:n,T=v===0?tt:et,X=C-e;if(Math.abs(X)>5e-4?(e+=X*(1-Math.exp(-y/T)),Z()):e!==C&&(e=C,Z()),!l){x+=y*Xt*r;const j=Math.min(8,Math.floor(x));j>0&&(x-=j,t.step(e,j),m=!0)}const be=W()>=ve?1:0,Ne=be-R;Math.abs(Ne)>.001?(R+=Ne*(1-Math.exp(-y*7)),m=!0):R!==be&&(R=be,m=!0);const Re=e>ze?"chaos":W()>=ve?"map":"hidden",Oe=N.getBoundingClientRect(),rt=he.advance(Math.min(.5,_),Re,{width:Oe.width,height:Oe.height});if(Ge(rt),m&&q(),!F&&Re==="map"&&f-V>280){V=f,F=!0;const j=O;t.readRegionSample().then(ie=>{j!==O||!ie||e>ze||W()<ve||he.ingest(ie)}).catch(ie=>{console.warn("Could not read Ising regions.",ie)}).finally(()=>{F=!1})}f-z>750&&(z=f,$()),requestAnimationFrame(Te)};requestAnimationFrame(Te)}Zt().catch(b=>{console.error(b),de.hidden=!1,de.textContent=b instanceof Error?b.message:"Could not start the WebGPU simulation."});
