(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();async function wt(){try{if(!navigator.gpu)return null;const x=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!x)return null;const e=await x.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(x){return console.error("WebGPU initialization failed.",x),null}}const _t=`struct SimParams {
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
    color = mix(color, vec3<f32>(0.29, 0.1, 0.045), relief * render_params.map_strength * 0.22);
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
`,T=(x,e)=>Math.ceil(x/e),ye=112,we=128,vt=(x,e)=>x>=e?{width:ye,height:Math.max(1,Math.round(ye*e/x))}:{width:Math.max(1,Math.round(ye*x/e)),height:ye};class Mt{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,r){this.device=e,this.format=t,this.canvas=r;const s=r.getContext("webgpu");if(!s)throw new Error("Could not create a WebGPU canvas context.");this.context=s,this.context.configure({device:e,format:t,alphaMode:"opaque"});const i=e.createShaderModule({label:"Ising shaders",code:_t});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:i,entryPoint:"fullscreen_vertex"},fragment:{module:i,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(n=>e.createBuffer({label:`Ising blur uniforms ${n}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(n=>e.createBuffer({label:`Ising label blur uniforms ${n}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:we*we*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:we*we*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,r,s=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=r;return}const i=this.width,n=this.height,o=this.spinBuffers,u=this.fieldTexture,h=this.blurTextures,d=this.labelBlurTextures,m=this.statsOutput,f=this.statsReadback,v=o?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=r,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),s&&v){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,i,n);const w=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),l=this.device.createCommandEncoder({label:"Resize Ising grid"}),a=l.beginComputePass();a.setPipeline(this.pipelines.resize),a.setBindGroup(0,w),a.dispatchWorkgroups(T(e,8),T(t,8)),a.end(),this.device.queue.submit([l.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...m?[m]:[]],readback:f??void 0,textures:[u,...h??[],...d??[]].filter(w=>!!w)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let r=0;r<t;r+=1){const s=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,s);const i=this.device.createCommandEncoder({label:"Advance Ising state"}),n=i.beginComputePass();n.setPipeline(this.pipelines.update),n.setBindGroup(0,this.updateGroups[this.currentIndex]),n.dispatchWorkgroups(T(this.width,8),T(this.height,8)),n.end(),this.device.queue.submit([i.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,r,s,i,n,o){const u=Math.floor(Math.min(e,r)-i),h=Math.floor(Math.min(t,s)-i),d=Math.ceil(Math.max(e,r)+i),m=Math.ceil(Math.max(t,s)+i),f=d-u+1,v=m-h+1;this.writeBrushParams(u,h,f,v,e,t,r,s,i,o);const w=this.device.createCommandEncoder({label:"Paint Ising spins"});if(n){const a=w.beginComputePass();a.setPipeline(this.pipelines.select),a.setBindGroup(0,this.selectGroups[this.currentIndex]),a.dispatchWorkgroups(1),a.end()}const l=w.beginComputePass();l.setPipeline(this.pipelines.paint),l.setBindGroup(0,this.paintGroups[this.currentIndex]),l.dispatchWorkgroups(T(f,8),T(v,8)),l.end(),this.device.queue.submit([w.finish()]),this.fieldDirty=!0}draw(e,t,r,s,i){if(!this.renderGroup||!this.observationReady())return;const n=this.secondaryObservationRadius(t,e),o=this.fieldDirty||t!==this.lastBlurRadius||n!==this.lastSecondaryRadius,u=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const d=u.beginComputePass();d.setPipeline(this.pipelines.field),d.setBindGroup(0,this.fieldGroups[this.currentIndex]),d.dispatchWorkgroups(T(this.width,8),T(this.height,8)),d.end(),this.fieldDirty=!1}o&&this.appendObservationBlur(u,t,n,"display"),this.writeRenderParams(e,t,r,s,i);const h=u.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});h.setPipeline(this.pipelines.render),h.setBindGroup(0,this.renderGroup),h.draw(3),h.end(),this.device.queue.submit([u.finish()])}async readRegionSample(e,t){const r=this.regionGroup;if(!r||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const s=vt(this.width,this.height),i=s.width*s.height;if(i*4>this.regionStorage.size)return null;const n=this.secondaryObservationRadius(e,t),o=e===this.lastBlurRadius&&n===this.lastSecondaryRadius,u=o?r:this.labelRegionGroup;if(!u)return null;const h=this.device.createCommandEncoder({label:"Read Ising regions"});o||this.appendObservationBlur(h,e,n,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([s.width,s.height,0,0]));const d=h.beginComputePass();d.setPipeline(this.pipelines.regions),d.setBindGroup(0,u),d.dispatchWorkgroups(T(s.width,8),T(s.height,8)),d.end(),h.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,i*4),this.device.queue.submit([h.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const m=new Int32Array(this.regionReadback.getMappedRange(),0,i),f=new Int8Array(i);for(let v=0;v<i;v+=1)f[v]=m[v]<0?-1:1;return{width:s.width,height:s.height,signs:f}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,r=this.statsGroups[this.currentIndex];if(!e||!t||!r)return{energy:0,magnetization:0,signedMagnetization:0};const s=T(this.width,16),i=T(this.height,16),n=new Uint32Array([this.width,this.height,s,0]);this.device.queue.writeBuffer(this.statsUniform,0,n);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(e);const u=o.beginComputePass();u.setPipeline(this.pipelines.stats),u.setBindGroup(0,r),u.dispatchWorkgroups(s,i),u.end(),o.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([o.finish()]),await t.mapAsync(GPUMapMode.READ);const h=new Int32Array(t.getMappedRange()),d=h[0],m=h[1];t.unmap();const f=this.width*this.height;return{magnetization:Math.abs(d/f),signedMagnetization:d/f,energy:m/f}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}}]}))}writeSimParams(e,t,r,s,i=0,n=0){const o=new ArrayBuffer(32),u=new DataView(o);u.setUint32(0,this.width,!0),u.setUint32(4,this.height,!0),u.setUint32(8,e,!0),u.setUint32(12,t,!0),u.setFloat32(16,r,!0),u.setUint32(20,s,!0),u.setUint32(24,i,!0),u.setUint32(28,n,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(e,t,r,s,i,n,o,u,h,d){const m=new ArrayBuffer(64),f=new DataView(m);f.setUint32(0,this.width,!0),f.setUint32(4,this.height,!0),f.setInt32(8,e,!0),f.setInt32(12,t,!0),f.setUint32(16,r,!0),f.setUint32(20,s,!0),f.setUint32(24,d?1:0,!0),f.setFloat32(32,i,!0),f.setFloat32(36,n,!0),f.setFloat32(40,o,!0),f.setFloat32(44,u,!0),f.setFloat32(48,h,!0),this.device.queue.writeBuffer(this.brushUniform,0,m)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,r,s){const i=s==="display",n=i?this.blurUniforms:this.labelBlurUniforms,o=i?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,u=i?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,h=i?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,d=i?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!u||!h||!d||o.length===0)return;this.writeBlurParams(n[0],t),this.writeBlurParams(n[1],r);const m=e.beginComputePass({label:"Horizontal Ising observation blur"});m.setPipeline(this.pipelines.blurSpinsHorizontal),m.setBindGroup(0,o[this.currentIndex]),m.dispatchWorkgroups(T(this.height,64)),m.end();const f=e.beginComputePass({label:"Vertical Ising observation blur"});if(f.setPipeline(this.pipelines.blurTextureVertical),f.setBindGroup(0,u),f.dispatchWorkgroups(T(this.width,64)),f.end(),r>0){const v=e.beginComputePass({label:"Secondary horizontal Ising blur"});v.setPipeline(this.pipelines.blurTextureHorizontal),v.setBindGroup(0,h),v.dispatchWorkgroups(T(this.height,64)),v.end();const w=e.beginComputePass({label:"Secondary vertical Ising blur"});w.setPipeline(this.pipelines.blurTextureVertical),w.setBindGroup(0,d),w.dispatchWorkgroups(T(this.width,64)),w.end()}i&&(this.lastBlurRadius=t,this.lastSecondaryRadius=r)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,r,s,i){const n=new Float32Array(16);n[0]=this.width,n[1]=this.height,n[2]=this.width,n[3]=this.height,n[4]=t,n[5]=e,n[6]=r,n[7]=i.active?1:0,n[8]=i.x*this.density,n[9]=i.y*this.density,n[10]=i.radius*this.density,n[11]=i.painting?1:0,n[12]=i.forceHot?1:0,n[13]=Math.max(.5,this.density*.5),n[14]=s,this.device.queue.writeBuffer(this.renderUniform,0,n)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const r of e.buffers)r.destroy();for(const r of e.textures??[])r.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const it=["v","l","m","n","s","c","r","t","p","d","f","g","b","pr","tr","cl","cr","fl","fr","gl","gr","pl","br","dr","st","qu"],Pt=["l","r","n","m","t","s","c","d","v","p","g","b","f","br","cr","dr","gr","pr","tr","st"],Bt=["a","e","i","o","u"],st=["a","e","i","o","u","a","e","i","o","ae","au","oe"],St=["n","r","s","l","m","t"],nt=["a","us","um","is","or"],de=(x,e,t=0)=>e[(Math.floor(x()*e.length)+t)%e.length],Gt=(x,e)=>{for(let t=0;t<512;t+=1){const r=x()<.82||t>=24?2:3,s=[];let i=!1;for(let o=0;o<r;o+=1){const u=de(x,o===0?it:Pt,o===0?t:o===1?Math.floor(t/it.length):0);let h=de(x,st);h.length>1&&i&&(h=de(x,Bt)),u==="qu"&&(h==="u"||h==="au"||h==="oe")&&(h="a"),o>0&&`${u}${h}`===s[o-1]&&(h=de(x,st,1)),i||=h.length>1,s.push(`${u}${h}`)}const n=`${s.join("")}${de(x,St)}`;if(!(n.length>8)&&!e?.has(n))return n}throw new Error("Could not find an unused place name")},zt=(x,e)=>{const t=`${e.charAt(0).toUpperCase()}${e.slice(1)}`;if(x==="continent")return`${t}ia`;const r=nt[[...e].reduce((s,i)=>s+i.charCodeAt(0),0)%nt.length];return`${t}${r}`},rt=.7,Ae=5,It=.0035,Ut=.008,Et=.055,At=.018,Tt=48,Te=1.35,Rt=.16,Ct=9,N=8,Q=64,J=80,ot=20,at=.12,lt=.22,Lt=.05,Ot=.12,Ft=.85,Nt=1.8,kt=140,Vt=28,Dt=160,qt=2,$t='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',Z=(x,e,t)=>Math.max(e,Math.min(t,x)),fe=(x,e,t,r)=>x+(e-x)*(1-Math.exp(-t/r)),Re=x=>x==="island"||x==="continent",se=x=>x*Rt,_e=(x,e,t)=>x+(e-x)*t,pe=(x,e)=>{const t=Math.abs(x-e)%180;return Math.min(t,180-t)},Xt=(x,e,t,r)=>{const s=2/Ft,i=(t-x)*s*s-2*s*e,n=e+i*r;return{value:x+n*r,velocity:n}},Yt=x=>[{x:x.x,y:x.y}];class Ht{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1}advance(e,t,r){this.applyViewport(r);const s=Z(e,0,.5);t!=="map"&&(this.synced=!1);for(const n of this.tracks.values()){const o=t==="map"&&n.confirmed&&n.missing===0;n.agreement=fe(n.agreement,o?1:0,s,rt),n.stability=fe(n.stability,o?n.agreement:0,s,rt);const u=n.placement;u?.alive&&n.present&&this.glide(n,u,s);const h=u?[u,...n.ghosts]:n.ghosts;for(const d of h){const m=t==="map"&&this.synced&&n.present&&n.confirmed&&n.missing<.75&&d.alive;d.opacity=fe(d.opacity,m?n.stability:0,s,m?.25:.45)}u&&!u.alive&&u.opacity<.02&&(n.placement=null),n.ghosts=n.ghosts.filter(d=>d.opacity>=.02)}const i=this.collect(s);return t==="chaos"&&i.length===0&&this.reset(),i}ingest(e){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const t=performance.now()/1e3,r=this.lastIngest<0?0:Math.min(2,t-this.lastIngest);this.lastIngest=t;for(const l of this.tracks.values())l.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const l=[];for(const a of this.tracks.values()){a.soft&&(a.soft=this.regridFloat(a.soft,this.width,this.height,e.width,e.height)),a.lastMask&&(a.lastMask=this.regrid(a.lastMask,this.width,this.height,e.width,e.height));const p=a.placement?[a.placement,...a.ghosts]:a.ghosts;for(const b of p){const _=b.mask===b.regionMask;b.mask=this.regrid(b.mask,this.width,this.height,e.width,e.height),b.regionMask=_?b.mask:this.regrid(b.regionMask,this.width,this.height,e.width,e.height),l.push(b.mask),_||l.push(b.regionMask)}}this.width=e.width,this.height=e.height;for(const a of l)this.remember(a)}const i=this.components(e.signs).filter(l=>l.role==="place").sort((l,a)=>a.area-l.area).slice(0,Tt),n=[],o=(l,a,p)=>{const b=a.placement?.alive?{x:a.placement.position.x/this.viewport.width,y:a.placement.position.y/this.viewport.height}:a.center;return{region:l,track:a,overlap:p,distance:this.distance(b,i[l].center)}};for(let l=0;l<i.length;l+=1){const a=new Map;for(const p of i[l].cells){const b=this.owners[p];b&&a.set(b,(a.get(b)??0)+1)}for(const[p,b]of a){const _=this.tracks.get(p);!_||Re(_.kind)!==i[l].sign>0||b<=0||n.push(o(l,_,b))}}const u=new Set,h=new Set,d=[],m=l=>{l.sort((a,p)=>a.track.id-p.track.id||a.distance-p.distance||p.overlap-a.overlap);for(const a of l)u.has(a.region)||h.has(a.track.id)||(u.add(a.region),h.add(a.track.id),d.push({track:a.track,region:i[a.region],overlap:a.overlap}))};m(n);const f=[];for(const l of this.tracks.values())if(!(h.has(l.id)||!l.lastMask||l.missing>=Ae))for(let a=0;a<i.length;a+=1){if(u.has(a)||Re(l.kind)!==i[a].sign>0)continue;const p=i[a].bounds;if(l.bounds.x1<=p.x0||p.x1<=l.bounds.x0||l.bounds.y1<=p.y0||p.y1<=l.bounds.y0)continue;let b=0;for(const _ of i[a].cells)b+=l.lastMask[_]??0;b>0&&f.push(o(a,l,b))}m(f);const v=[];for(const l of this.tracks.values())if(!(h.has(l.id)||l.missing>=Ae))for(let a=0;a<i.length;a+=1){const p=i[a];if(u.has(a)||Re(l.kind)!==p.sign>0)continue;const b=Math.min(l.area,p.area)/Math.max(l.area,p.area),_=Math.max(0,l.bounds.x0-p.bounds.x1,p.bounds.x0-l.bounds.x1)*this.width,z=Math.max(0,l.bounds.y0-p.bounds.y1,p.bounds.y0-l.bounds.y1)*this.height,U=Math.hypot((l.center.x-p.center.x)*this.width,(l.center.y-p.center.y)*this.height),y=Math.sqrt(Math.min(l.area,p.area)/Math.PI);b>=.5&&Math.hypot(_,z)<=1.5&&U<=Math.max(3,y*1.25)&&v.push(o(a,l,0))}m(v);for(let l=0;l<i.length;l+=1){if(u.has(l))continue;const a=i[l];if(!a.kind)continue;const p=Gt(Math.random,this.usedStems);this.usedStems.add(p);const b={id:this.nextTrackId++,stem:p,kind:a.kind,text:zt(a.kind,p),area:a.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:a.center,bounds:a.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(b.id,b),d.push({track:b,region:a,overlap:0})}const w=new Uint16Array(e.signs.length);for(const{track:l,region:a,overlap:p}of d){if(l.present=!0,p>0){const b=p/Math.min(l.area,a.area);l.agreement=Math.min(l.agreement,.65+.35*b)}l.area=a.area,l.center=a.center,l.bounds=a.bounds,l.missing=0,l.confirmed=!0;for(const b of a.cells)w[b]=l.id}this.owners=w;for(const l of[...this.tracks.values()])d.some(a=>a.track===l)||(l.missing+=r,l.confirmed=!1,l.missing>Ae&&(this.tracks.delete(l.id),this.usedStems.delete(l.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}for(const{track:l,region:a}of d){const p=this.allowedMask(a);l.lastMask=p,this.remember(p),this.smooth(l,p,r),this.aim(l,p,r)}this.synced=!0}aim(e,t,r){const s=this.viewport.width*this.viewport.height/t.length,i=Z(Math.sqrt(e.area*s/(Math.max(4,e.text.length)*3.2)),N,Q);e.styleFont=e.styleFont===0?i:fe(e.styleFont,i,r,2.5);const n=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),o=e.placement?.alive?e.placement:null,u=o?.angle??0,h=[],d=(y,P)=>Math.max(.01,n.quality[y]+.12*P.font/e.styleFont-Lt*Math.abs(P.angle)/J-Ot*n.elongation[y]*pe(P.angle,n.axis[y])/J);for(const y of n.candidates){const P=this.cellPoint(y);if(h.some(R=>this.distance(R.pose,P)<n.radius*.55))continue;const G=this.poseAt(e.text,t,P,e.styleFont,u,n.axis[y],n.elongation[y]);if(G&&(h.push({pose:G,quality:d(y,G)}),h.length>=24))break}if(o){const y=this.index(o.position);if(y>=0&&n.centerX[y]>0){const P={x:n.centerX[y],y:n.centerY[y]},G=this.index(P),R=G<0?null:this.poseAt(e.text,t,P,e.styleFont,u,n.axis[G],n.elongation[G]);R&&G>=0&&h.push({pose:R,quality:d(G,R)})}}if(h.length===0){o&&this.release(e);return}h.sort((y,P)=>P.quality-y.quality);const m=h[0];if(!o){e.placement=this.spawn(m.pose,t);return}const f=h.filter(y=>this.distance(y.pose,o.position)<=n.radius*1.5).sort((y,P)=>P.quality-this.distance(P.pose,o.position)/(n.radius*16)-(y.quality-this.distance(y.pose,o.position)/(n.radius*16)))[0],v=this.index(o.position),w=f?.quality??(v>=0?n.quality[v]:0),l=m.quality>w*qt,a=f&&m.quality<=f.quality*1.08?f:m,p=this.snapshot(o),b=this.distance(p,a.pose)<=n.radius*1.5;let _=t,z=!1;if(!this.fitsPose(t,e.text,p)&&(_=this.union(o.regionMask,t),this.remember(_),!this.fitsPose(_,e.text,p)&&b&&o.mask!==o.regionMask&&(_=this.union(o.mask,t),this.remember(_),z=!0),!this.fitsPose(_,e.text,p))){this.relight(e,a.pose,t);return}let U=this.planRoute(e.text,_,p,a.pose);if(!U&&_!==t&&b&&!z&&o.mask!==o.regionMask){const y=this.union(o.mask,t);if(this.remember(y),this.fitsPose(y,e.text,p)){const P=this.planRoute(e.text,y,p,a.pose);P&&(_=y,U=P)}}if(!U){(_!==t||l&&this.distance(p,a.pose)>n.radius*1.5)&&this.relight(e,a.pose,t);return}o.mask=_,o.regionMask=t,o.target=a.pose,o.route=U}poseAt(e,t,r,s,i,n,o){const u=this.index(r);if(u<0||!t[u])return null;let h=null,d=-1/0;const m=this.maxFont(t,e,r,0);if(m>=N){const f=Math.min(s,Math.max(N,m*.9));h={x:r.x,y:r.y,font:f,angle:0},d=f/s-lt*o*pe(0,n)/J-.02*pe(0,i)/J}for(let f=ot;f<=J;f+=ot){const v=Math.min(s,Q*.9)/s-at*f/J;if(d>=v)break;for(const w of[-f,f]){const l=this.maxFont(t,e,r,w);if(l<N)continue;const a=Math.min(s,Math.max(N,l*.9)),p=a/s-at*f/J-lt*o*pe(w,n)/J-.02*pe(w,i)/J;p>d&&(h={x:r.x,y:r.y,font:a,angle:w},d=p)}}return h}landscape(e,t,r,s,i){const n=this.width+1,o=n*(this.height+1),u=new Float64Array(o),h=new Float64Array(o),d=new Float64Array(o),m=new Float64Array(o),f=new Float64Array(o),v=new Float64Array(o),w=new Float32Array(e.length),l=new Float32Array(e.length),a=new Float32Array(e.length),p=new Float32Array(e.length),b=new Float32Array(e.length),_=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),z=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(s*3.5,Math.sqrt(i*_*_)*.33,_*3)),U=Math.max(1,Math.ceil(z*this.width/this.viewport.width)),y=Math.max(1,Math.ceil(z*this.height/this.viewport.height));for(let B=0;B<this.height;B+=1){let L=0,X=0,O=0,k=0,Y=0,q=0;for(let F=0;F<this.width;F+=1){const j=F+B*this.width,$=e[j]*(.85+.15*r[j])*Z(t[j]*_/(s*2),0,1),V=this.cellPoint(j);L+=$,X+=$*V.x,O+=$*V.y,k+=$*V.x*V.x,Y+=$*V.y*V.y,q+=$*V.x*V.y;const C=(B+1)*n+F+1;u[C]=u[C-n]+L,h[C]=h[C-n]+X,d[C]=d[C-n]+O,m[C]=m[C-n]+k,f[C]=f[C-n]+Y,v[C]=v[C-n]+q}}const P=(B,L,X,O,k)=>B[k*n+O]-B[X*n+O]-B[k*n+L]+B[X*n+L],G=u[o-1],R=G>0?{x:h[o-1]/G,y:d[o-1]/G}:{x:this.viewport.width/2,y:this.viewport.height/2},A=[];for(let B=0;B<e.length;B+=1){if(!e[B])continue;const L=B%this.width,X=Math.floor(B/this.width),O=Math.max(0,L-U),k=Math.max(0,X-y),Y=Math.min(this.width,L+U+1),q=Math.min(this.height,X+y+1),F=P(u,O,k,Y,q);if(F<=0)continue;l[B]=P(h,O,k,Y,q)/F,a[B]=P(d,O,k,Y,q)/F;const j=Math.max(0,P(m,O,k,Y,q)/F-l[B]**2),$=Math.max(0,P(f,O,k,Y,q)/F-a[B]**2),V=P(v,O,k,Y,q)/F-l[B]*a[B],C=Math.hypot(j-$,2*V);p[B]=.5*Math.atan2(2*V,j-$)*180/Math.PI,b[B]=Z(C/(j+$+1),0,1);const ae=F/((U*2+1)*(y*2+1)),ee=Z(t[B]*_/(s*2),0,1);w[B]=.7*ae+.3*ee-.08*this.distance(this.cellPoint(B),R)/z,A.push(B)}return A.sort((B,L)=>w[L]-w[B]),{quality:w,centerX:l,centerY:a,axis:p,elongation:b,candidates:A,radius:z}}union(e,t){const r=new Uint8Array(t.length);for(let s=0;s<r.length;s+=1)r[s]=e[s]|t[s];return r}planRoute(e,t,r,s){if(this.posesFit(t,e,r,s))return[s];let i=Math.min(r.font,s.font);for(let n=0;n<9;n+=1){i=Math.max(N,i);for(const o of[...new Set([r.angle,s.angle,0])]){const u={...r,font:i},h={...u,angle:o},d={...s,font:i,angle:o},m={...s,font:i};if(!this.posesFit(t,e,r,u)||!this.posesFit(t,e,u,h)||!this.posesFit(t,e,d,m)||!this.posesFit(t,e,m,s))continue;const f=[];if(Math.abs(r.font-i)>.05&&f.push(u),Math.abs(r.angle-o)>.05&&f.push(h),this.posesFit(t,e,h,d))return f.push(d),Math.abs(s.angle-o)>.05&&f.push(m),f.push(s),f;const v=this.legalPath(e,t,h,d);if(!v)continue;let w=h,l=!0;for(let a=0;a<v.length;){let p=-1;for(let _=v.length-1;_>=a;_-=1){const U={...this.cellPoint(v[_]),font:i,angle:o};if(this.posesFit(t,e,w,U)){p=_;break}}if(p<0){l=!1;break}const b={...this.cellPoint(v[p]),font:i,angle:o};this.distance(w,b)>.5&&f.push(b),w=b,a=p+1}if(!(!l||!this.posesFit(t,e,w,d)))return this.distance(w,d)>.5&&f.push(d),Math.abs(s.angle-o)>.05&&f.push(m),f.push(s),f}if(i<=N)break;i=Math.max(N,i*.82)}return null}legalPath(e,t,r,s){const i=new Uint8Array(t.length),n=l=>{if(i[l]===0){const a={...this.cellPoint(l),font:r.font,angle:r.angle};i[l]=t[l]&&this.fitsPose(t,e,a)?1:2}return i[l]===1},o=l=>{const a=this.index(l);if(a<0)return-1;const p=a%this.width,b=Math.floor(a/this.width);for(let _=0;_<=3;_+=1)for(let z=-_;z<=_;z+=1)for(let U=-_;U<=_;U+=1){const y=p+U,P=b+z;if(y<0||P<0||y>=this.width||P>=this.height)continue;const G=y+P*this.width;if(n(G)&&this.posesFit(t,e,l,{...this.cellPoint(G),font:r.font,angle:r.angle}))return G}return-1},u=o(r),h=o(s);if(u<0||h<0)return null;const d=new Int32Array(t.length).fill(-1),m=new Int32Array(t.length);let f=0,v=0;for(m[v++]=u,d[u]=u;f<v&&d[h]<0;){const l=m[f++],a=l%this.width,p=Math.floor(l/this.width);for(const b of[a>0?l-1:-1,a+1<this.width?l+1:-1,p>0?l-this.width:-1,p+1<this.height?l+this.width:-1])b<0||d[b]>=0||!n(b)||(d[b]=l,m[v++]=b)}if(d[h]<0)return null;const w=[];for(let l=h;l!==u;l=d[l])w.push(l);return w.push(u),w.reverse(),w}glide(e,t,r){const s=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,s)){const h=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,h<N){t.fontVelocity=0;return}const d=Xt(t.font,t.fontVelocity,Math.min(t.target.font,h),r);t.font=Math.max(h,Math.min(t.font,d.value)),t.fontVelocity=t.font<=h?0:d.velocity;return}for(;t.route.length>1&&this.distance(s,t.route[0])<.75&&Math.abs(s.font-t.route[0].font)<.15&&Math.abs(s.angle-t.route[0].angle)<.3;)t.route.shift();const i=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,s,i)&&this.distance(s,i)<.2&&Math.abs(s.font-i.font)<.05&&Math.abs(s.angle-i.angle)<.05){t.position={x:i.x,y:i.y},t.font=i.font,t.angle=i.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const n=Math.max(this.distance(s,i)/kt,Math.abs(i.font-s.font)/Vt,Math.abs(i.angle-s.angle)/Dt);let o=this.lerpPose(s,i,n>0?Math.min(1,r/n):1);if(!this.fitsPose(t.mask,e.text,o)){const h=this.longestLegal(e.text,t.mask,s,o);if(!h){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}o=h}const u=r>0?1/r:0;t.position={x:o.x,y:o.y},t.velocity={x:(o.x-s.x)*u,y:(o.y-s.y)*u},t.font=o.font,t.fontVelocity=(o.font-s.font)*u,t.angle=o.angle,t.angleVelocity=(o.angle-s.angle)*u}collect(e){const t=[];for(const i of this.tracks.values()){const n=i.placement?[i.placement,...i.ghosts]:i.ghosts;for(const o of n)o.opacity<.015||this.fitsPose(o.mask,i.text,this.snapshot(o))&&t.push({track:i,placement:o})}t.sort((i,n)=>n.track.area-i.track.area);const r=[],s=[];for(const i of t){const{track:n,placement:o}=i,u=r.some(d=>d.track!==n&&this.overlaps(n.text,this.snapshot(o),d.track.text,this.snapshot(d.placement)));o.collisionOpacity=fe(o.collisionOpacity,u?0:1,e,u?.3:.7),u||r.push(i);const h=o.opacity*o.collisionOpacity;h<.015||s.push({id:o.id,kind:n.kind,text:n.text,x:o.position.x,y:o.position.y,width:this.boxWidth(n.text,o.font,se(o.font)),height:o.font*Te,opacity:h,fontSize:o.font,letterSpacing:se(o.font),angle:o.angle})}return s}relight(e,t,r){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=this.spawn(t,r)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,r){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const s=1-Math.exp(-r/Nt),i=e.soft;for(let n=0;n<t.length;n+=1)i[n]+=(t[n]-i[n])*s}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const r of e.cells)t[r]=1;return t}components(e){const t=new Uint8Array(e.length),r=[];for(let s=0;s<e.length;s+=1){if(t[s])continue;const i=e[s]<0?-1:1,n=[];let o=0,u=0,h=this.width,d=this.height,m=0,f=0;const v=[s];for(t[s]=1;v.length;){const p=v.pop();n.push(p);const b=p%this.width,_=Math.floor(p/this.width);o+=b+.5,u+=_+.5,h=Math.min(h,b),d=Math.min(d,_),m=Math.max(m,b+1),f=Math.max(f,_+1);for(const z of this.neighbors(p))t[z]||(e[z]<0?-1:1)!==i||(t[z]=1,v.push(z))}const w=n.length/e.length;let l=null,a="hole";i>0?w>=Et?(l="continent",a="place"):w>=Ut&&(l="island",a="place"):w>At||h===0||d===0||m===this.width||f===this.height?a="sea":w>=It&&(l="lake",a="place"),r.push({sign:i,area:n.length,cells:n,kind:l,role:a,center:{x:o/n.length/this.width,y:u/n.length/this.height},bounds:{x0:h/this.width,y0:d/this.height,x1:m/this.width,y1:f/this.height}})}return r}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),r=new Int32Array(e.length);let s=0;for(let i=0;i<e.length;i+=1){const n=i%this.width,o=Math.floor(i/this.width);(!e[i]||n===0||o===0||n===this.width-1||o===this.height-1)&&(t[i]=0,r[s++]=i)}for(let i=0;i<s;i+=1){const n=r[i],o=n%this.width,u=Math.floor(n/this.width);for(const h of[o>0?n-1:-1,o+1<this.width?n+1:-1,u>0?n-this.width:-1,u+1<this.height?n+this.width:-1])h<0||t[h]>=0||(t[h]=t[n]+1,r[s++]=h)}return t}prefix(e){const t=this.width+1,r=new Int32Array(t*(this.height+1));for(let s=0;s<this.height;s+=1){let i=0;for(let n=0;n<this.width;n+=1)i+=e[n+s*this.width],r[(s+1)*t+n+1]=r[s*t+n+1]+i}return r}maxFont(e,t,r,s){if(!this.fits(e,t,r,N,se(N),s))return 0;if(this.fits(e,t,r,Q,se(Q),s))return Q;let i=N,n=Q;for(let o=0;o<8;o+=1){const u=(i+n)/2;this.fits(e,t,r,u,se(u),s)?i=u:n=u}return i}fitsPose(e,t,r){return this.fits(e,t,r,r.font,se(r.font),r.angle)}posesFit(e,t,r,s){if(!this.fitsPose(e,t,r)||!this.fitsPose(e,t,s))return!1;const i=Math.max(1,Math.ceil(Math.max(this.distance(r,s)/4,Math.abs(r.font-s.font),Math.abs(r.angle-s.angle)/2)));for(let n=1;n<i;n+=1)if(!this.fitsPose(e,t,this.lerpPose(r,s,n/i)))return!1;return!0}longestLegal(e,t,r,s){if(!this.fitsPose(t,e,r))return null;let i=0,n=1;for(let o=0;o<8;o+=1){const u=(i+n)/2;this.fitsPose(t,e,this.lerpPose(r,s,u))?i=u:n=u}return i<=0?null:this.lerpPose(r,s,i)}fits(e,t,r,s,i,n){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const o=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),u=Math.max(Ct,o*1.25),h=this.boxWidth(t,s,i)/2+u,d=s*Te/2+u,m=n*Math.PI/180,f=Math.cos(m),v=Math.sin(m),w=Math.abs(h*f)+Math.abs(d*v),l=Math.abs(h*v)+Math.abs(d*f);if(r.x-w<0||r.y-l<0||r.x+w>this.viewport.width||r.y+l>this.viewport.height)return!1;const a=this.prefixFields.get(e);if(a){const y=Math.floor((r.x-w)*this.width/this.viewport.width),P=Math.floor((r.y-l)*this.height/this.viewport.height),G=Math.min(this.width,Math.ceil((r.x+w)*this.width/this.viewport.width)),R=Math.min(this.height,Math.ceil((r.y+l)*this.height/this.viewport.height)),A=this.width+1;if(a[R*A+G]-a[P*A+G]-a[R*A+y]+a[P*A+y]===(G-y)*(R-P))return!0}const p=this.distanceFields.get(e),b=this.index(r);if(p&&b>=0){const y=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(p[b]-2)*y/Math.SQRT2)>=Math.hypot(h,d))return!0}const _=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),z=Math.max(2,Math.ceil(h*2/_)),U=Math.max(2,Math.ceil(d*2/_));for(let y=0;y<=U;y+=1){const P=-d+y*d*2/U;for(let G=0;G<=z;G+=1){const R=-h+G*h*2/z,A=Math.floor((r.x+R*f-P*v)*this.width/this.viewport.width),B=Math.floor((r.y+R*v+P*f)*this.height/this.viewport.height);if(A<0||B<0||A>=this.width||B>=this.height||!e[A+B*this.width])return!1}}return!0}overlaps(e,t,r,s){const i=(u,h)=>{const d=h.angle*Math.PI/180,m=this.boxWidth(u,h.font,se(h.font))/2+7,f=h.font*Te/2+7;return{x:Math.abs(m*Math.cos(d))+Math.abs(f*Math.sin(d)),y:Math.abs(m*Math.sin(d))+Math.abs(f*Math.cos(d))}},n=i(e,t),o=i(r,s);return Math.abs(t.x-s.x)<n.x+o.x&&Math.abs(t.y-s.y)<n.y+o.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const r=e.width/t.width,s=e.height/t.height,i=(r+s)/2;for(const n of this.tracks.values()){n.styleFont=Z(n.styleFont*i,N,Q);const o=n.placement?[n.placement,...n.ghosts]:n.ghosts;for(const u of o)this.scalePlacement(u,r,s,i)}}this.viewport=e}scalePlacement(e,t,r,s){e.position={x:e.position.x*t,y:e.position.y*r},e.velocity={x:e.velocity.x*t,y:e.velocity.y*r},e.font=Z(e.font*s,N,Q),e.fontVelocity*=s,e.target={x:e.target.x*t,y:e.target.y*r,font:Z(e.target.font*s,N,Q),angle:e.target.angle},e.route=e.route.map(i=>({x:i.x*t,y:i.y*r,font:Z(i.font*s,N,Q),angle:i.angle}))}regrid(e,t,r,s,i){const n=new e.constructor(s*i);if(e.length!==t*r||t<1||r<1)return n;for(let o=0;o<i;o+=1)for(let u=0;u<s;u+=1)n[u+o*s]=e[Math.min(t-1,Math.floor((u+.5)*t/s))+Math.min(r-1,Math.floor((o+.5)*r/i))*t];return n}regridFloat(e,t,r,s,i){const n=new Float32Array(s*i);if(e.length!==t*r||t<1||r<1)return n;for(let o=0;o<i;o+=1)for(let u=0;u<s;u+=1)n[u+o*s]=e[Math.min(t-1,Math.floor((u+.5)*t/s))+Math.min(r-1,Math.floor((o+.5)*r/i))*t];return n}neighbors(e){const t=e%this.width,r=Math.floor(e/this.width);return[(t+1)%this.width+r*this.width,(t-1+this.width)%this.width+r*this.width,t+(r+1)%this.height*this.width,t+(r-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,r){return{x:_e(e.x,t.x,r),y:_e(e.y,t.y,r),font:_e(e.font,t.font,r),angle:_e(e.angle,t.angle,r)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),r=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&r>=0&&r<this.height?t+r*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,r){const s=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(s?.58:.56)+r)+4;const i=s?`i:${e}`:e;let n=this.textMetrics.get(i);return n===void 0&&(this.measure.font=`${s?"italic ":""}500 100px ${$t}`,this.measure.fontKerning="none",n=this.measure.measureText(e).width/100,this.textMetrics.set(i,n)),n*t+e.length*r+4}}const ut=2/Math.log(1+Math.sqrt(2)),Wt=30,ve=40,I=x=>{const e=document.getElementById(x);if(!e)throw new Error(`Missing #${x}`);return e},W=I("field"),re=I("scale"),oe=I("temperature"),Ce=I("time-speed"),Me=I("brush-size"),jt=I("scale-value"),Kt=I("temperature-value"),Qt=I("time-speed-value"),Jt=I("brush-size-value"),Zt=I("explanation"),Le=I("settings-toggle"),ht=I("settings-panel"),Pe=I("pause"),ei=I("restart"),ti=I("clear-blue"),Oe=I("rough"),Fe=I("smooth"),Ne=I("scale-dock"),ii=I("scale-readout"),Be=I("freeze"),Se=I("heat"),ke=I("phase"),Ve=I("magnetization"),De=I("energy"),Ge=I("fatal-error"),ct=I("place-labels"),si=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function ni(){const x=await wt();if(!x){Ge.hidden=!1,Ge.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new Mt(x.device,x.format,W);let t=Number(oe.value),r=t,s=Number(re.value),i=s,n=Number(Ce.value),o=Number(Me.value),u=!1,h=!0,d=!1,m=!1,f=!1,v=0,w=0,l=null,a=!0,p=0,b=performance.now(),_=0,z=!1,U=0;const y=new Map;let P=!1,G=0,R=s,A=!1,B=!1,L=0,X=0,O=!1,k=0;const Y=new Ht,q=new Map,F=new Set,j=new Set,$=new Set,V=new Set,C=ut+.2,ae=Number(re.min),ee=Number(re.max),ze=Number(oe.min),qe=Number(oe.max),dt=1.35,ft=.75,pt=(ee-ae)/2.2,$e=Math.ceil((ve-1)/2),gt=()=>{const c=Math.max(1,window.innerWidth),g=Math.max(1,window.innerHeight),M=c<=720?Math.min(window.devicePixelRatio||1,2):1,E=Math.min(x.device.limits.maxTextureDimension2D/c,x.device.limits.maxTextureDimension2D/g),S=Math.sqrt(Number(x.device.limits.maxStorageBufferBindingSize)/4/(c*g)),D=Math.max(.25,Math.min(M,E,S)),H=Math.max(1,Math.round(c*D)),te=Math.max(1,Math.round(g*D));return{density:H/c,width:H,height:te}},Ie=c=>{const g=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**c-1)*g))},ne=()=>Ie(s)*2+1,mt=()=>{const c=Math.min(e.width,e.height)/65.64;if(c<=0)return ee;let g=Math.log2(1+Math.max(0,($e-.5)/c));for(g=Math.min(ee,Math.max(ae,g));g<ee&&Ie(g)<$e;)g=Math.min(ee,g+.01);return g},le=()=>{const c=ne(),g=c===1?"1 spin":`${c} × ${c}`;re.value=s.toFixed(2),Ne.value=s.toFixed(2),jt.textContent=g,ii.textContent=g,Zt.textContent=si[Math.min(3,Math.floor(s+.25))],Oe.setAttribute("aria-label",`Rough, observation scale ${s.toFixed(2)}`),Fe.setAttribute("aria-label",`Smooth, observation scale ${s.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-s/3)**2).toFixed(3))},ge=()=>{oe.value=t.toFixed(2),Kt.textContent=`T = ${t.toFixed(2)}`;const c=Math.max(0,Math.min(1,(t-ze)/(qe-ze)));Be.style.setProperty("--paddle-progress",(1-c).toFixed(4)),Se.style.setProperty("--paddle-progress",c.toFixed(4)),Be.setAttribute("aria-label",`Freeze, current temperature ${t.toFixed(2)}`),Se.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const g=t-ut;g<-.2?ke.textContent="ordered":g>.2?ke.textContent="disordered":ke.textContent="critical"},Xe=()=>{const c=Number.isInteger(n)?0:1;Qt.textContent=`${n.toFixed(c)}×`},Ue=()=>{Me.value=String(o),Jt.textContent=`${o} px`},bt=()=>({active:f&&!P&&!B,painting:d,forceHot:m,x:v,y:w,radius:o/2}),ue=()=>{const c=ne(),g=(c-1)/2,M=c===1?0:.14*(1-s/3)**2;e.draw(s,g,M,L,bt()),a=!1},Ye=()=>{X+=1,Y.reset(),He([])},He=c=>{ct.classList.toggle("is-single-spin",ne()===1);const g=new Set;for(const M of c){g.add(M.id);const E=Yt(M);let S=q.get(M.id);for(S||(S=[],q.set(M.id,S));S.length<E.length;){const D=document.createElement("span");D.className="place-label",ct.append(D),S.push(D)}for(;S.length>E.length;)S.pop()?.remove();for(let D=0;D<E.length;D+=1){const H=S[D],te=E[D];H.dataset.kind!==M.kind&&(H.dataset.kind=M.kind),H.textContent!==M.text&&(H.textContent=M.text);const ce=ne()<ve?.7:1;H.style.opacity=(M.opacity*ce).toFixed(3),H.style.fontSize=`${M.fontSize.toFixed(2)}px`,H.style.letterSpacing=`${M.letterSpacing.toFixed(2)}px`,H.style.transform=`translate(${te.x.toFixed(2)}px, ${te.y.toFixed(2)}px) rotate(${M.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[M,E]of q)if(!g.has(M)){for(const S of E)S.remove();q.delete(M)}},We=(c=!0)=>{const g=gt();e.resize(g.width,g.height,g.density,c),le(),a=!0,ue(),U+=1,X+=1},me=c=>{const g=W.getBoundingClientRect(),M=(c.clientX-g.left)/g.width,E=(c.clientY-g.top)/g.height;return M<0||M>=1||E<0||E>=1?null:(v=c.clientX-g.left,w=c.clientY-g.top,{x:M*e.width,y:E*e.height})},be=(c,g)=>{const M=me(c);if(!M){l=null;return}const E=l??M;e.paintSegment(E.x,E.y,M.x,M.y,o*e.density/2,g,m),l=M,a=!0},Ee=c=>{d=!0,l=null,be(c,!0),m=!1},je=()=>{const c=[...y.values()];return c.length<2?0:Math.hypot(c[1].x-c[0].x,c[1].y-c[0].y)},he=()=>{if(z)return;z=!0;const c=U;e.readStats().then(g=>{if(c!==U)return;Ve.textContent=g.magnetization.toFixed(3),De.textContent=g.energy.toFixed(3);const M=g.signedMagnetization===-1;!d&&m!==M&&(m=M,a=!0)}).catch(g=>{console.warn("Could not read Ising statistics.",g)}).finally(()=>{z=!1})},Ke=c=>{s=c,i=s,le(),a=!0};re.addEventListener("input",()=>Ke(Number(re.value))),Ne.addEventListener("input",()=>Ke(Number(Ne.value))),oe.addEventListener("input",()=>{r=Number(oe.value),t=r,ge()});const xe=(c,g)=>{const M=()=>{c.setAttribute("aria-pressed",String(g.size>0))},E=S=>{g.delete(`pointer:${S.pointerId}`),c.hasPointerCapture(S.pointerId)&&c.releasePointerCapture(S.pointerId),M()};c.addEventListener("pointerdown",S=>{S.pointerType==="mouse"&&S.button!==0||(S.preventDefault(),c.setPointerCapture(S.pointerId),g.add(`pointer:${S.pointerId}`),M())}),c.addEventListener("pointerup",E),c.addEventListener("pointercancel",E),c.addEventListener("lostpointercapture",S=>{g.delete(`pointer:${S.pointerId}`),M()}),c.addEventListener("keydown",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),g.add(`key:${S.code}`),M())}),c.addEventListener("keyup",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),g.delete(`key:${S.code}`),M())}),c.addEventListener("blur",()=>{for(const S of g)S.startsWith("key:")&&g.delete(S);M()})};xe(Oe,F),xe(Fe,j),xe(Be,$),xe(Se,V),Ce.addEventListener("input",()=>{n=Number(Ce.value),Xe()}),Me.addEventListener("input",()=>{o=Number(Me.value),Ue(),a=!0}),window.addEventListener("keydown",c=>{c.code!=="BracketLeft"&&c.code!=="BracketRight"||(c.preventDefault(),o=Math.max(4,Math.min(100,o+(c.code==="BracketLeft"?-4:4))),Ue(),a=!0)}),Le.addEventListener("click",()=>{h=!h,ht.classList.toggle("is-closed",!h),ht.setAttribute("aria-hidden",String(!h)),Le.setAttribute("aria-expanded",String(h)),Le.setAttribute("aria-label",h?"Close settings":"Open settings")}),Pe.addEventListener("click",()=>{u=!u;const c=u?"Resume simulation":"Pause simulation";Pe.setAttribute("aria-pressed",String(u)),Pe.setAttribute("aria-label",c),Pe.title=c,p=0}),ei.addEventListener("click",()=>{e.randomize(),m=!1,p=0,U+=1,Ye(),Ve.textContent="0.000",De.textContent="0.000",a=!0,ue(),he()}),ti.addEventListener("click",()=>{e.clearBlue(),m=!0,p=0,U+=1,Ye(),Ve.textContent="1.000",De.textContent="-2.000",a=!0,ue(),he()}),W.addEventListener("pointerdown",c=>{if(me(c)){if(W.setPointerCapture(c.pointerId),f=!0,c.pointerType==="touch"){y.set(c.pointerId,{x:c.clientX,y:c.clientY}),y.size===1?(A=!0,B=!1):y.size===2&&(d=!1,l=null,A=!1,B=!0,P=!0,G=je(),R=i),a=!0;return}Ee(c)}}),W.addEventListener("pointermove",c=>{if(me(c),f=!0,a=!0,c.pointerType==="touch"){if(!y.has(c.pointerId))return;if(y.set(c.pointerId,{x:c.clientX,y:c.clientY}),P&&y.size>=2){const g=je();G>0&&g>0&&(i=Math.max(0,Math.min(3,R-Math.log2(g/G)*.9)));return}if(y.size===1&&!B){if(A)Ee(c),A=!1;else if(d)for(const g of c.getCoalescedEvents())be(g,!1)}return}if(d){const g=c.getCoalescedEvents();if(g.length===0)be(c,!1);else for(const M of g)be(M,!1)}});const xt=c=>{c.pointerType==="touch"&&(A&&!B&&Ee(c),y.delete(c.pointerId),y.size<2&&(P=!1),y.size===0&&(A=!1,B=!1,f=!1)),d=!1,l=null,W.hasPointerCapture(c.pointerId)&&W.releasePointerCapture(c.pointerId),a=!0,he()};W.addEventListener("pointerup",xt),W.addEventListener("pointercancel",c=>{y.delete(c.pointerId),d=!1,f=!1,l=null,A=!1,P=!1,a=!0}),W.addEventListener("pointerenter",()=>{f=!0,a=!0}),W.addEventListener("pointerleave",()=>{d||(f=!1,a=!0)}),W.addEventListener("wheel",c=>{c.preventDefault();const g=Math.max(-120,Math.min(120,c.deltaY));i=Math.max(0,Math.min(3,i+g*.00125)),me(c),f=!0},{passive:!1}),window.addEventListener("blur",()=>{d=!1,f=!1,l=null,y.clear(),P=!1,A=!1,F.clear(),j.clear(),$.clear(),V.clear(),Oe.setAttribute("aria-pressed","false"),Fe.setAttribute("aria-pressed","false"),Be.setAttribute("aria-pressed","false"),Se.setAttribute("aria-pressed","false"),a=!0}),window.addEventListener("resize",()=>We(!0)),We(!1),e.step(t,40),ge(),Xe(),Ue(),a=!0,ue(),he();const Qe=c=>{const g=Math.max(0,(c-b)/1e3),M=Math.min(.1,g);b=c;const E=+(j.size>0)-+(F.size>0);if(E!==0){const K=E<0?ae:ee,ie=E*pt*M;s=E<0?Math.max(K,s+ie):Math.min(K,s+ie),i=s,le(),a=!0}else{const K=i-s;Math.abs(K)>5e-4?(s+=K*(1-Math.exp(-M*10)),le(),a=!0):s!==i&&(s=i,le(),a=!0)}const S=+(V.size>0)-+($.size>0),D=S<0?ze:S>0?qe:r,H=S===0?ft:dt,te=D-t;if(Math.abs(te)>5e-4?(t+=te*(1-Math.exp(-M/H)),ge()):t!==D&&(t=D,ge()),!u){p+=M*Wt*n;const K=Math.min(8,Math.floor(p));K>0&&(p-=K,e.step(t,K),a=!0)}const ce=ne()>=ve?1:0,Je=ce-L;Math.abs(Je)>.001?(L+=Je*(1-Math.exp(-M*7)),a=!0):L!==ce&&(L=ce,a=!0);const Ze=ne()>=ve?s:mt(),et=t>C?"chaos":"map",tt=W.getBoundingClientRect(),yt=Y.advance(Math.min(.5,g),et,{width:tt.width,height:tt.height});if(He(yt),a&&ue(),!O&&et==="map"&&c-k>280){k=c,O=!0;const K=X;e.readRegionSample(Ie(Ze),Ze).then(ie=>{K!==X||!ie||t>C||Y.ingest(ie)}).catch(ie=>{console.warn("Could not read Ising regions.",ie)}).finally(()=>{O=!1})}c-_>750&&(_=c,he()),requestAnimationFrame(Qe)};requestAnimationFrame(Qe)}ni().catch(x=>{console.error(x),Ge.hidden=!1,Ge.textContent=x instanceof Error?x.message:"Could not start the WebGPU simulation."});
