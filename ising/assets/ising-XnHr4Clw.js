(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();async function vt(){try{if(!navigator.gpu)return null;const x=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!x)return null;const e=await x.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(x){return console.error("WebGPU initialization failed.",x),null}}const Mt=`struct SimParams {
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
`,T=(x,e)=>Math.ceil(x/e),_e=112,ve=128,Pt=(x,e)=>x>=e?{width:_e,height:Math.max(1,Math.round(_e*e/x))}:{width:Math.max(1,Math.round(_e*x/e)),height:_e};class Bt{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,r){this.device=e,this.format=t,this.canvas=r;const n=r.getContext("webgpu");if(!n)throw new Error("Could not create a WebGPU canvas context.");this.context=n,this.context.configure({device:e,format:t,alphaMode:"opaque"});const i=e.createShaderModule({label:"Ising shaders",code:Mt});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:i,entryPoint:"fullscreen_vertex"},fragment:{module:i,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(s=>e.createBuffer({label:`Ising blur uniforms ${s}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(s=>e.createBuffer({label:`Ising label blur uniforms ${s}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:ve*ve*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:ve*ve*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,r,n=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=r;return}const i=this.width,s=this.height,o=this.spinBuffers,u=this.fieldTexture,c=this.blurTextures,d=this.labelBlurTextures,b=this.statsOutput,f=this.statsReadback,w=o?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=r,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),n&&w){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,i,s);const _=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:w}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),l=this.device.createCommandEncoder({label:"Resize Ising grid"}),a=l.beginComputePass();a.setPipeline(this.pipelines.resize),a.setBindGroup(0,_),a.dispatchWorkgroups(T(e,8),T(t,8)),a.end(),this.device.queue.submit([l.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...b?[b]:[]],readback:f??void 0,textures:[u,...c??[],...d??[]].filter(_=>!!_)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let r=0;r<t;r+=1){const n=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,n);const i=this.device.createCommandEncoder({label:"Advance Ising state"}),s=i.beginComputePass();s.setPipeline(this.pipelines.update),s.setBindGroup(0,this.updateGroups[this.currentIndex]),s.dispatchWorkgroups(T(this.width,8),T(this.height,8)),s.end(),this.device.queue.submit([i.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,r,n,i,s,o){const u=Math.floor(Math.min(e,r)-i),c=Math.floor(Math.min(t,n)-i),d=Math.ceil(Math.max(e,r)+i),b=Math.ceil(Math.max(t,n)+i),f=d-u+1,w=b-c+1;this.writeBrushParams(u,c,f,w,e,t,r,n,i,o);const _=this.device.createCommandEncoder({label:"Paint Ising spins"});if(s){const a=_.beginComputePass();a.setPipeline(this.pipelines.select),a.setBindGroup(0,this.selectGroups[this.currentIndex]),a.dispatchWorkgroups(1),a.end()}const l=_.beginComputePass();l.setPipeline(this.pipelines.paint),l.setBindGroup(0,this.paintGroups[this.currentIndex]),l.dispatchWorkgroups(T(f,8),T(w,8)),l.end(),this.device.queue.submit([_.finish()]),this.fieldDirty=!0}draw(e,t,r,n,i){if(!this.renderGroup||!this.observationReady())return;const s=this.secondaryObservationRadius(t,e),o=this.fieldDirty||t!==this.lastBlurRadius||s!==this.lastSecondaryRadius,u=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const d=u.beginComputePass();d.setPipeline(this.pipelines.field),d.setBindGroup(0,this.fieldGroups[this.currentIndex]),d.dispatchWorkgroups(T(this.width,8),T(this.height,8)),d.end(),this.fieldDirty=!1}o&&this.appendObservationBlur(u,t,s,"display"),this.writeRenderParams(e,t,r,n,i);const c=u.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});c.setPipeline(this.pipelines.render),c.setBindGroup(0,this.renderGroup),c.draw(3),c.end(),this.device.queue.submit([u.finish()])}async readRegionSample(e,t){const r=this.regionGroup;if(!r||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const n=Pt(this.width,this.height),i=n.width*n.height;if(i*4>this.regionStorage.size)return null;const s=this.secondaryObservationRadius(e,t),o=e===this.lastBlurRadius&&s===this.lastSecondaryRadius,u=o?r:this.labelRegionGroup;if(!u)return null;const c=this.device.createCommandEncoder({label:"Read Ising regions"});o||this.appendObservationBlur(c,e,s,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([n.width,n.height,0,0]));const d=c.beginComputePass();d.setPipeline(this.pipelines.regions),d.setBindGroup(0,u),d.dispatchWorkgroups(T(n.width,8),T(n.height,8)),d.end(),c.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,i*4),this.device.queue.submit([c.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const b=new Int32Array(this.regionReadback.getMappedRange(),0,i),f=new Int8Array(i);for(let w=0;w<i;w+=1)f[w]=b[w]<0?-1:1;return{width:n.width,height:n.height,signs:f}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,r=this.statsGroups[this.currentIndex];if(!e||!t||!r)return{energy:0,magnetization:0,signedMagnetization:0};const n=T(this.width,16),i=T(this.height,16),s=new Uint32Array([this.width,this.height,n,0]);this.device.queue.writeBuffer(this.statsUniform,0,s);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(e);const u=o.beginComputePass();u.setPipeline(this.pipelines.stats),u.setBindGroup(0,r),u.dispatchWorkgroups(n,i),u.end(),o.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([o.finish()]),await t.mapAsync(GPUMapMode.READ);const c=new Int32Array(t.getMappedRange()),d=c[0],b=c[1];t.unmap();const f=this.width*this.height;return{magnetization:Math.abs(d/f),signedMagnetization:d/f,energy:b/f}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}}]}))}writeSimParams(e,t,r,n,i=0,s=0){const o=new ArrayBuffer(32),u=new DataView(o);u.setUint32(0,this.width,!0),u.setUint32(4,this.height,!0),u.setUint32(8,e,!0),u.setUint32(12,t,!0),u.setFloat32(16,r,!0),u.setUint32(20,n,!0),u.setUint32(24,i,!0),u.setUint32(28,s,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(e,t,r,n,i,s,o,u,c,d){const b=new ArrayBuffer(64),f=new DataView(b);f.setUint32(0,this.width,!0),f.setUint32(4,this.height,!0),f.setInt32(8,e,!0),f.setInt32(12,t,!0),f.setUint32(16,r,!0),f.setUint32(20,n,!0),f.setUint32(24,d?1:0,!0),f.setFloat32(32,i,!0),f.setFloat32(36,s,!0),f.setFloat32(40,o,!0),f.setFloat32(44,u,!0),f.setFloat32(48,c,!0),this.device.queue.writeBuffer(this.brushUniform,0,b)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,r,n){const i=n==="display",s=i?this.blurUniforms:this.labelBlurUniforms,o=i?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,u=i?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,c=i?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,d=i?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!u||!c||!d||o.length===0)return;this.writeBlurParams(s[0],t),this.writeBlurParams(s[1],r);const b=e.beginComputePass({label:"Horizontal Ising observation blur"});b.setPipeline(this.pipelines.blurSpinsHorizontal),b.setBindGroup(0,o[this.currentIndex]),b.dispatchWorkgroups(T(this.height,64)),b.end();const f=e.beginComputePass({label:"Vertical Ising observation blur"});if(f.setPipeline(this.pipelines.blurTextureVertical),f.setBindGroup(0,u),f.dispatchWorkgroups(T(this.width,64)),f.end(),r>0){const w=e.beginComputePass({label:"Secondary horizontal Ising blur"});w.setPipeline(this.pipelines.blurTextureHorizontal),w.setBindGroup(0,c),w.dispatchWorkgroups(T(this.height,64)),w.end();const _=e.beginComputePass({label:"Secondary vertical Ising blur"});_.setPipeline(this.pipelines.blurTextureVertical),_.setBindGroup(0,d),_.dispatchWorkgroups(T(this.width,64)),_.end()}i&&(this.lastBlurRadius=t,this.lastSecondaryRadius=r)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,r,n,i){const s=new Float32Array(16);s[0]=this.width,s[1]=this.height,s[2]=this.width,s[3]=this.height,s[4]=t,s[5]=e,s[6]=r,s[7]=i.active?1:0,s[8]=i.x*this.density,s[9]=i.y*this.density,s[10]=i.radius*this.density,s[11]=i.painting?1:0,s[12]=i.forceHot?1:0,s[13]=Math.max(.5,this.density*.5),s[14]=n,this.device.queue.writeBuffer(this.renderUniform,0,s)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const r of e.buffers)r.destroy();for(const r of e.textures??[])r.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const st=["v","l","m","n","s","c","r","t","p","d","f","g","b","pr","tr","cl","cr","fl","fr","gl","gr","pl","br","dr","st","qu"],St=["l","r","n","m","t","s","c","d","v","p","g","b","f","br","cr","dr","gr","pr","tr","st"],Gt=["a","e","i","o","u"],rt=["a","e","i","o","u","a","e","i","o","ae","au","oe"],zt=["n","r","s","l","m","t"],ot=["a","us","um","is","or"],fe=(x,e,t=0)=>e[(Math.floor(x()*e.length)+t)%e.length],It=(x,e)=>{for(let t=0;t<512;t+=1){const r=x()<.82||t>=24?2:3,n=[];let i=!1;for(let o=0;o<r;o+=1){const u=fe(x,o===0?st:St,o===0?t:o===1?Math.floor(t/st.length):0);let c=fe(x,rt);c.length>1&&i&&(c=fe(x,Gt)),u==="qu"&&(c==="u"||c==="au"||c==="oe")&&(c="a"),o>0&&`${u}${c}`===n[o-1]&&(c=fe(x,rt,1)),i||=c.length>1,n.push(`${u}${c}`)}const s=`${n.join("")}${fe(x,zt)}`;if(!(s.length>8)&&!e?.has(s))return s}throw new Error("Could not find an unused place name")},Ut=(x,e)=>{const t=`${e.charAt(0).toUpperCase()}${e.slice(1)}`;if(x==="continent")return`${t}ia`;const r=ot[[...e].reduce((n,i)=>n+i.charCodeAt(0),0)%ot.length];return`${t}${r}`},at=.7,Le=5,Et=.0035,At=.008,Tt=.055,lt=1/4,Rt=48,Oe=1.35,Ct=.16,Lt=9,F=8,J=64,Z=80,ut=20,ht=.12,ct=.22,Ot=.05,Nt=.12,Ft=.85,kt=.25,Vt=3,dt=8,Dt=1.8,qt=140,Xt=28,$t=160,Ht=2,Yt='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',Q=(x,e,t)=>Math.max(e,Math.min(t,x)),pe=(x,e,t,r)=>x+(e-x)*(1-Math.exp(-t/r)),Ne=x=>x==="island"||x==="continent",ne=x=>x*Ct,Me=(x,e,t)=>x+(e-x)*t,ge=(x,e)=>{const t=Math.abs(x-e)%180;return Math.min(t,180-t)},Wt=(x,e,t,r)=>{const n=2/Ft,i=(t-x)*n*n-2*n*e,s=e+i*r;return{value:x+s*r,velocity:s}},jt=x=>[{x:x.x,y:x.y}];class Kt{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1}advance(e,t,r){this.applyViewport(r);const n=Q(e,0,.5);t!=="map"&&(this.synced=!1);for(const s of this.tracks.values()){const o=t==="map"&&s.confirmed&&s.missing===0;s.agreement=pe(s.agreement,o?1:0,n,at),s.stability=pe(s.stability,o?s.agreement:0,n,at);const u=s.placement;u?.alive&&s.present&&this.glide(s,u,n);const c=u?[u,...s.ghosts]:s.ghosts;for(const d of c){const b=t==="map"&&this.synced&&s.present&&s.confirmed&&s.missing<.75&&d.alive;d.opacity=pe(d.opacity,b?s.stability:0,n,b?.25:.45)}u&&!u.alive&&u.opacity<.02&&(s.placement=null),s.ghosts=s.ghosts.filter(d=>d.opacity>=.02)}const i=this.collect(n);return t==="chaos"&&i.length===0&&this.reset(),i}ingest(e){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const t=performance.now()/1e3,r=this.lastIngest<0?0:Math.min(2,t-this.lastIngest);this.lastIngest=t;for(const l of this.tracks.values())l.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const l=[];for(const a of this.tracks.values()){a.soft&&(a.soft=this.regridFloat(a.soft,this.width,this.height,e.width,e.height)),a.lastMask&&(a.lastMask=this.regrid(a.lastMask,this.width,this.height,e.width,e.height));const p=a.placement?[a.placement,...a.ghosts]:a.ghosts;for(const y of p){const v=y.mask===y.regionMask;y.mask=this.regrid(y.mask,this.width,this.height,e.width,e.height),y.regionMask=v?y.mask:this.regrid(y.regionMask,this.width,this.height,e.width,e.height),l.push(y.mask),v||l.push(y.regionMask)}}this.width=e.width,this.height=e.height;for(const a of l)this.remember(a)}const i=this.components(e.signs).filter(l=>l.role==="place").sort((l,a)=>a.area-l.area).slice(0,Rt),s=[],o=(l,a,p)=>{const y=a.placement?.alive?{x:a.placement.position.x/this.viewport.width,y:a.placement.position.y/this.viewport.height}:a.center;return{region:l,track:a,overlap:p,distance:this.distance(y,i[l].center)}};for(let l=0;l<i.length;l+=1){const a=new Map;for(const p of i[l].cells){const y=this.owners[p];y&&a.set(y,(a.get(y)??0)+1)}for(const[p,y]of a){const v=this.tracks.get(p);!v||Ne(v.kind)!==i[l].sign>0||y<=0||s.push(o(l,v,y))}}const u=new Set,c=new Set,d=[],b=l=>{l.sort((a,p)=>a.track.id-p.track.id||a.distance-p.distance||p.overlap-a.overlap);for(const a of l)u.has(a.region)||c.has(a.track.id)||(u.add(a.region),c.add(a.track.id),d.push({track:a.track,region:i[a.region],overlap:a.overlap}))};b(s);const f=[];for(const l of this.tracks.values())if(!(c.has(l.id)||!l.lastMask||l.missing>=Le))for(let a=0;a<i.length;a+=1){if(u.has(a)||Ne(l.kind)!==i[a].sign>0)continue;const p=i[a].bounds;if(l.bounds.x1<=p.x0||p.x1<=l.bounds.x0||l.bounds.y1<=p.y0||p.y1<=l.bounds.y0)continue;let y=0;for(const v of i[a].cells)y+=l.lastMask[v]??0;y>0&&f.push(o(a,l,y))}b(f);const w=[];for(const l of this.tracks.values())if(!(c.has(l.id)||l.missing>=Le))for(let a=0;a<i.length;a+=1){const p=i[a];if(u.has(a)||Ne(l.kind)!==p.sign>0)continue;const y=Math.min(l.area,p.area)/Math.max(l.area,p.area),v=Math.max(0,l.bounds.x0-p.bounds.x1,p.bounds.x0-l.bounds.x1)*this.width,I=Math.max(0,l.bounds.y0-p.bounds.y1,p.bounds.y0-l.bounds.y1)*this.height,B=Math.hypot((l.center.x-p.center.x)*this.width,(l.center.y-p.center.y)*this.height),m=Math.sqrt(Math.min(l.area,p.area)/Math.PI);y>=.5&&Math.hypot(v,I)<=1.5&&B<=Math.max(3,m*1.25)&&w.push(o(a,l,0))}b(w);for(let l=0;l<i.length;l+=1){if(u.has(l))continue;const a=i[l];if(!a.kind)continue;const p=It(Math.random,this.usedStems);this.usedStems.add(p);const y={id:this.nextTrackId++,stem:p,kind:a.kind,text:Ut(a.kind,p),area:a.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:a.center,bounds:a.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(y.id,y),d.push({track:y,region:a,overlap:0})}const _=new Uint16Array(e.signs.length);for(const{track:l,region:a,overlap:p}of d){if(l.present=!0,p>0){const y=p/Math.min(l.area,a.area);l.agreement=Math.min(l.agreement,.65+.35*y)}l.area=a.area,l.center=a.center,l.bounds=a.bounds,l.missing=0,l.confirmed=!0;for(const y of a.cells)_[y]=l.id}this.owners=_;for(const l of[...this.tracks.values()])d.some(a=>a.track===l)||(l.missing+=r,l.confirmed=!1,l.missing>Le&&(this.tracks.delete(l.id),this.usedStems.delete(l.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}for(const{track:l,region:a}of d){const p=this.allowedMask(a);l.lastMask=p,this.remember(p),this.smooth(l,p,r),this.aim(l,p,r)}this.synced=!0}aim(e,t,r){const n=this.viewport.width*this.viewport.height/t.length,i=Q(Math.sqrt(e.area*n/(Math.max(4,e.text.length)*3.2)),F,J);e.styleFont=e.styleFont===0?i:pe(e.styleFont,i,r,2.5);const s=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),o=e.placement?.alive?e.placement:null,u=o?.angle??0,c=[],d=(m,M)=>Math.max(.01,s.quality[m]+.12*M.font/e.styleFont-Ot*Math.abs(M.angle)/Z-Nt*s.elongation[m]*ge(M.angle,s.axis[m])/Z);for(const m of s.candidates){const M=this.cellPoint(m);if(c.some(R=>this.distance(R.pose,M)<s.radius*.55))continue;const z=this.poseAt(e.text,t,M,e.styleFont,u,s.axis[m],s.elongation[m]);if(z&&(c.push({pose:z,quality:d(m,z)}),c.length>=24))break}if(o){const m=this.index(o.position);if(m>=0&&s.centerX[m]>0){const M={x:s.centerX[m],y:s.centerY[m]},z=this.index(M),R=z<0?null:this.poseAt(e.text,t,M,e.styleFont,u,s.axis[z],s.elongation[z]);R&&z>=0&&c.push({pose:R,quality:d(z,R)})}}if(c.length===0){o&&this.release(e);return}c.sort((m,M)=>M.quality-m.quality);const b=c[0];if(!o){e.placement=this.spawn(b.pose,t);return}const f=c.filter(m=>this.distance(m.pose,o.position)<=s.radius*1.5).sort((m,M)=>M.quality-this.distance(M.pose,o.position)/(s.radius*16)-(m.quality-this.distance(m.pose,o.position)/(s.radius*16)))[0],w=this.index(o.position),_=f?.quality??(w>=0?s.quality[w]:0),l=b.quality>_*Ht,a=f&&b.quality<=f.quality*1.08?f:b,p=this.snapshot(o),y=this.distance(p,a.pose)<=s.radius*1.5;let v=t,I=!1;if(!this.fitsPose(t,e.text,p)&&(v=this.union(o.regionMask,t),this.remember(v),!this.fitsPose(v,e.text,p)&&y&&o.mask!==o.regionMask&&(v=this.union(o.mask,t),this.remember(v),I=!0),!this.fitsPose(v,e.text,p))){this.relight(e,a.pose,t);return}let B=this.planRoute(e.text,v,p,a.pose);if(!B&&v!==t&&y&&!I&&o.mask!==o.regionMask){const m=this.union(o.mask,t);if(this.remember(m),this.fitsPose(m,e.text,p)){const M=this.planRoute(e.text,m,p,a.pose);M&&(v=m,B=M)}}if(!B){(v!==t||l&&this.distance(p,a.pose)>s.radius*1.5)&&this.relight(e,a.pose,t);return}o.mask=v,o.regionMask=t,o.target=a.pose,o.route=B}poseAt(e,t,r,n,i,s,o){const u=this.index(r);if(u<0||!t[u])return null;let c=null,d=-1/0;const b=this.maxFont(t,e,r,0);if(b>=F){const f=Math.min(n,Math.max(F,b*.9));c={x:r.x,y:r.y,font:f,angle:0},d=f/n-ct*o*ge(0,s)/Z-.02*ge(0,i)/Z}for(let f=ut;f<=Z;f+=ut){const w=Math.min(n,J*.9)/n-ht*f/Z;if(d>=w)break;for(const _ of[-f,f]){const l=this.maxFont(t,e,r,_);if(l<F)continue;const a=Math.min(n,Math.max(F,l*.9)),p=a/n-ht*f/Z-ct*o*ge(_,s)/Z-.02*ge(_,i)/Z;p>d&&(c={x:r.x,y:r.y,font:a,angle:_},d=p)}}return c}landscape(e,t,r,n,i){const s=this.width+1,o=s*(this.height+1),u=new Float64Array(o),c=new Float64Array(o),d=new Float64Array(o),b=new Float64Array(o),f=new Float64Array(o),w=new Float64Array(o),_=new Float32Array(e.length),l=new Float32Array(e.length),a=new Float32Array(e.length),p=new Float32Array(e.length),y=new Float32Array(e.length),v=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),I=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(n*3.5,Math.sqrt(i*v*v)*.33,v*3)),B=Math.max(1,Math.ceil(I*this.width/this.viewport.width)),m=Math.max(1,Math.ceil(I*this.height/this.viewport.height));for(let G=0;G<this.height;G+=1){let L=0,Y=0,O=0,k=0,W=0,q=0;for(let N=0;N<this.width;N+=1){const K=N+G*this.width,X=e[K]*(.85+.15*r[K])*Q(t[K]*v/(n*2),0,1),V=this.cellPoint(K);L+=X,Y+=X*V.x,O+=X*V.y,k+=X*V.x*V.x,W+=X*V.y*V.y,q+=X*V.x*V.y;const C=(G+1)*s+N+1;u[C]=u[C-s]+L,c[C]=c[C-s]+Y,d[C]=d[C-s]+O,b[C]=b[C-s]+k,f[C]=f[C-s]+W,w[C]=w[C-s]+q}}const M=(G,L,Y,O,k)=>G[k*s+O]-G[Y*s+O]-G[k*s+L]+G[Y*s+L],z=u[o-1],R=z>0?{x:c[o-1]/z,y:d[o-1]/z}:{x:this.viewport.width/2,y:this.viewport.height/2},A=[];for(let G=0;G<e.length;G+=1){if(!e[G])continue;const L=G%this.width,Y=Math.floor(G/this.width),O=Math.max(0,L-B),k=Math.max(0,Y-m),W=Math.min(this.width,L+B+1),q=Math.min(this.height,Y+m+1),N=M(u,O,k,W,q);if(N<=0)continue;l[G]=M(c,O,k,W,q)/N,a[G]=M(d,O,k,W,q)/N;const K=Math.max(0,M(b,O,k,W,q)/N-l[G]**2),X=Math.max(0,M(f,O,k,W,q)/N-a[G]**2),V=M(w,O,k,W,q)/N-l[G]*a[G],C=Math.hypot(K-X,2*V);p[G]=.5*Math.atan2(2*V,K-X)*180/Math.PI,y[G]=Q(C/(K+X+1),0,1);const ae=N/((B*2+1)*(m*2+1)),ee=Q(t[G]*v/(n*2),0,1);_[G]=.7*ae+.3*ee-.08*this.distance(this.cellPoint(G),R)/I,A.push(G)}return A.sort((G,L)=>_[L]-_[G]),{quality:_,centerX:l,centerY:a,axis:p,elongation:y,candidates:A,radius:I}}union(e,t){const r=new Uint8Array(t.length);for(let n=0;n<r.length;n+=1)r[n]=e[n]|t[n];return r}planRoute(e,t,r,n){if(this.posesFit(t,e,r,n))return[n];let i=Math.min(r.font,n.font);for(let s=0;s<9;s+=1){i=Math.max(F,i);for(const o of[...new Set([r.angle,n.angle,0])]){const u={...r,font:i},c={...u,angle:o},d={...n,font:i,angle:o},b={...n,font:i};if(!this.posesFit(t,e,r,u)||!this.posesFit(t,e,u,c)||!this.posesFit(t,e,d,b)||!this.posesFit(t,e,b,n))continue;const f=[];if(Math.abs(r.font-i)>.05&&f.push(u),Math.abs(r.angle-o)>.05&&f.push(c),this.posesFit(t,e,c,d))return f.push(d),Math.abs(n.angle-o)>.05&&f.push(b),f.push(n),f;const w=this.legalPath(e,t,c,d);if(!w)continue;let _=c,l=!0;for(let a=0;a<w.length;){let p=-1;for(let v=w.length-1;v>=a;v-=1){const B={...this.cellPoint(w[v]),font:i,angle:o};if(this.posesFit(t,e,_,B)){p=v;break}}if(p<0){l=!1;break}const y={...this.cellPoint(w[p]),font:i,angle:o};this.distance(_,y)>.5&&f.push(y),_=y,a=p+1}if(!(!l||!this.posesFit(t,e,_,d)))return this.distance(_,d)>.5&&f.push(d),Math.abs(n.angle-o)>.05&&f.push(b),f.push(n),f}if(i<=F)break;i=Math.max(F,i*.82)}return null}legalPath(e,t,r,n){const i=new Uint8Array(t.length),s=l=>{if(i[l]===0){const a={...this.cellPoint(l),font:r.font,angle:r.angle};i[l]=t[l]&&this.fitsPose(t,e,a)?1:2}return i[l]===1},o=l=>{const a=this.index(l);if(a<0)return-1;const p=a%this.width,y=Math.floor(a/this.width);for(let v=0;v<=3;v+=1)for(let I=-v;I<=v;I+=1)for(let B=-v;B<=v;B+=1){const m=p+B,M=y+I;if(m<0||M<0||m>=this.width||M>=this.height)continue;const z=m+M*this.width;if(s(z)&&this.posesFit(t,e,l,{...this.cellPoint(z),font:r.font,angle:r.angle}))return z}return-1},u=o(r),c=o(n);if(u<0||c<0)return null;const d=new Int32Array(t.length).fill(-1),b=new Int32Array(t.length);let f=0,w=0;for(b[w++]=u,d[u]=u;f<w&&d[c]<0;){const l=b[f++],a=l%this.width,p=Math.floor(l/this.width);for(const y of[a>0?l-1:-1,a+1<this.width?l+1:-1,p>0?l-this.width:-1,p+1<this.height?l+this.width:-1])y<0||d[y]>=0||!s(y)||(d[y]=l,b[w++]=y)}if(d[c]<0)return null;const _=[];for(let l=c;l!==u;l=d[l])_.push(l);return _.push(u),_.reverse(),_}glide(e,t,r){if(r<=0)return;const n=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,n)){const M=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,M<F){t.fontVelocity=0;return}const z=Wt(t.font,t.fontVelocity,Math.min(t.target.font,M),r);t.font=Math.max(M,Math.min(t.font,z.value)),t.fontVelocity=t.font<=M?0:z.velocity;return}for(;t.route.length>1&&this.distance(n,t.route[0])<.75&&Math.abs(n.font-t.route[0].font)<.15&&Math.abs(n.angle-t.route[0].angle)<.3;)t.route.shift();const i=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,n,i)&&this.distance(n,i)<.2&&Math.abs(n.font-i.font)<.05&&Math.abs(n.angle-i.angle)<.05){t.position={x:i.x,y:i.y},t.font=i.font,t.angle=i.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const o=!this.fitsPose(t.regionMask,e.text,n)?1:Vt,u=qt/o,c=Xt/o,d=$t/o,b=this.distance(n,i),f=b/u,w=Math.abs(i.font-n.font)/c,_=Math.abs(i.angle-n.angle)/d,l=Math.max(f,w,_);let a=0;l===f&&b>0?a=((i.x-n.x)*t.velocity.x+(i.y-n.y)*t.velocity.y)/b/u:l===w&&w>0?a=Math.sign(i.font-n.font)*t.fontVelocity/c:_>0&&(a=Math.sign(i.angle-n.angle)*t.angleVelocity/d),a=Q(a,-1,1);const p=2/(kt*o),y=Q(p*p*l-2*p*a,-dt,dt),v=Q(a+y*r,-1,1),I=Math.min(l,(a+v)*r/2);let B=this.lerpPose(n,i,l>0?I/l:1);if(!(I<0?this.posesFit(t.mask,e.text,n,B):this.fitsPose(t.mask,e.text,B))){const M=this.longestLegal(e.text,t.mask,n,B);if(!M){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}B=M}const m=r>0?1/r:0;t.position={x:B.x,y:B.y},t.velocity={x:(B.x-n.x)*m,y:(B.y-n.y)*m},t.font=B.font,t.fontVelocity=(B.font-n.font)*m,t.angle=B.angle,t.angleVelocity=(B.angle-n.angle)*m}collect(e){const t=[];for(const i of this.tracks.values()){const s=i.placement?[i.placement,...i.ghosts]:i.ghosts;for(const o of s)o.opacity<.015||this.fitsPose(o.mask,i.text,this.snapshot(o))&&t.push({track:i,placement:o})}t.sort((i,s)=>s.track.area-i.track.area);const r=[],n=[];for(const i of t){const{track:s,placement:o}=i,u=r.some(d=>d.track!==s&&this.overlaps(s.text,this.snapshot(o),d.track.text,this.snapshot(d.placement)));o.collisionOpacity=pe(o.collisionOpacity,u?0:1,e,u?.3:.7),u||r.push(i);const c=o.opacity*o.collisionOpacity;c<.015||n.push({id:o.id,kind:s.kind,text:s.text,x:o.position.x,y:o.position.y,width:this.boxWidth(s.text,o.font,ne(o.font)),height:o.font*Oe,opacity:c,fontSize:o.font,letterSpacing:ne(o.font),angle:o.angle})}return n}relight(e,t,r){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=this.spawn(t,r)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,r){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const n=1-Math.exp(-r/Dt),i=e.soft;for(let s=0;s<t.length;s+=1)i[s]+=(t[s]-i[s])*n}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const r of e.cells)t[r]=1;return t}components(e){const t=new Uint8Array(e.length),r=new Int32Array(e.length),n=[];for(let i=0;i<e.length;i+=1){if(t[i])continue;const s=n.length,o=e[i]<0?-1:1,u=[];let c=0,d=0,b=this.width,f=this.height,w=0,_=0;const l=[i];for(t[i]=1;l.length;){const v=l.pop();u.push(v),r[v]=s;const I=v%this.width,B=Math.floor(v/this.width);c+=I+.5,d+=B+.5,b=Math.min(b,I),f=Math.min(f,B),w=Math.max(w,I+1),_=Math.max(_,B+1);for(const m of this.neighbors(v))t[m]||(e[m]<0?-1:1)!==o||(t[m]=1,l.push(m))}const a=u.length/e.length;let p=null,y="hole";o>0?a>=Tt?(p="continent",y="place"):a>=At&&(p="island",y="place"):w-b>this.width*lt&&_-f>this.height*lt||b===0||f===0||w===this.width||_===this.height?y="sea":a>=Et&&(p="lake",y="place"),n.push({sign:o,area:u.length,cells:u,kind:p,role:y,center:{x:c/u.length/this.width,y:d/u.length/this.height},bounds:{x0:b/this.width,y0:f/this.height,x1:w/this.width,y1:_/this.height}})}for(const i of n){if(i.kind!=="lake")continue;const s=new Map;let o=0;for(const u of i.cells)for(const c of this.neighbors(u)){const d=r[c];n[d].sign<0||(s.set(d,(s.get(d)??0)+1),o+=1)}(o===0||Math.max(...s.values())*5<o*4)&&(i.kind=null,i.role="sea")}return n}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),r=new Int32Array(e.length);let n=0;for(let i=0;i<e.length;i+=1){const s=i%this.width,o=Math.floor(i/this.width);(!e[i]||s===0||o===0||s===this.width-1||o===this.height-1)&&(t[i]=0,r[n++]=i)}for(let i=0;i<n;i+=1){const s=r[i],o=s%this.width,u=Math.floor(s/this.width);for(const c of[o>0?s-1:-1,o+1<this.width?s+1:-1,u>0?s-this.width:-1,u+1<this.height?s+this.width:-1])c<0||t[c]>=0||(t[c]=t[s]+1,r[n++]=c)}return t}prefix(e){const t=this.width+1,r=new Int32Array(t*(this.height+1));for(let n=0;n<this.height;n+=1){let i=0;for(let s=0;s<this.width;s+=1)i+=e[s+n*this.width],r[(n+1)*t+s+1]=r[n*t+s+1]+i}return r}maxFont(e,t,r,n){if(!this.fits(e,t,r,F,ne(F),n))return 0;if(this.fits(e,t,r,J,ne(J),n))return J;let i=F,s=J;for(let o=0;o<8;o+=1){const u=(i+s)/2;this.fits(e,t,r,u,ne(u),n)?i=u:s=u}return i}fitsPose(e,t,r){return Math.abs(r.angle)<=Z&&this.fits(e,t,r,r.font,ne(r.font),r.angle)}posesFit(e,t,r,n){if(!this.fitsPose(e,t,r)||!this.fitsPose(e,t,n))return!1;const i=Math.max(1,Math.ceil(Math.max(this.distance(r,n)/4,Math.abs(r.font-n.font),Math.abs(r.angle-n.angle)/2)));for(let s=1;s<i;s+=1)if(!this.fitsPose(e,t,this.lerpPose(r,n,s/i)))return!1;return!0}longestLegal(e,t,r,n){if(!this.fitsPose(t,e,r))return null;let i=0,s=1;for(let o=0;o<8;o+=1){const u=(i+s)/2;this.posesFit(t,e,r,this.lerpPose(r,n,u))?i=u:s=u}return i<=0?null:this.lerpPose(r,n,i)}fits(e,t,r,n,i,s){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const o=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),u=Math.max(Lt,o*1.25),c=this.boxWidth(t,n,i)/2+u,d=n*Oe/2+u,b=s*Math.PI/180,f=Math.cos(b),w=Math.sin(b),_=Math.abs(c*f)+Math.abs(d*w),l=Math.abs(c*w)+Math.abs(d*f);if(r.x-_<0||r.y-l<0||r.x+_>this.viewport.width||r.y+l>this.viewport.height)return!1;const a=this.prefixFields.get(e);if(a){const m=Math.floor((r.x-_)*this.width/this.viewport.width),M=Math.floor((r.y-l)*this.height/this.viewport.height),z=Math.min(this.width,Math.ceil((r.x+_)*this.width/this.viewport.width)),R=Math.min(this.height,Math.ceil((r.y+l)*this.height/this.viewport.height)),A=this.width+1;if(a[R*A+z]-a[M*A+z]-a[R*A+m]+a[M*A+m]===(z-m)*(R-M))return!0}const p=this.distanceFields.get(e),y=this.index(r);if(p&&y>=0){const m=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(p[y]-2)*m/Math.SQRT2)>=Math.hypot(c,d))return!0}const v=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),I=Math.max(2,Math.ceil(c*2/v)),B=Math.max(2,Math.ceil(d*2/v));for(let m=0;m<=B;m+=1){const M=-d+m*d*2/B;for(let z=0;z<=I;z+=1){const R=-c+z*c*2/I,A=Math.floor((r.x+R*f-M*w)*this.width/this.viewport.width),G=Math.floor((r.y+R*w+M*f)*this.height/this.viewport.height);if(A<0||G<0||A>=this.width||G>=this.height||!e[A+G*this.width])return!1}}return!0}overlaps(e,t,r,n){const i=(u,c)=>{const d=c.angle*Math.PI/180,b=this.boxWidth(u,c.font,ne(c.font))/2+7,f=c.font*Oe/2+7;return{x:Math.abs(b*Math.cos(d))+Math.abs(f*Math.sin(d)),y:Math.abs(b*Math.sin(d))+Math.abs(f*Math.cos(d))}},s=i(e,t),o=i(r,n);return Math.abs(t.x-n.x)<s.x+o.x&&Math.abs(t.y-n.y)<s.y+o.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const r=e.width/t.width,n=e.height/t.height,i=(r+n)/2;for(const s of this.tracks.values()){s.styleFont=Q(s.styleFont*i,F,J);const o=s.placement?[s.placement,...s.ghosts]:s.ghosts;for(const u of o)this.scalePlacement(u,r,n,i)}}this.viewport=e}scalePlacement(e,t,r,n){e.position={x:e.position.x*t,y:e.position.y*r},e.velocity={x:e.velocity.x*t,y:e.velocity.y*r},e.font=Q(e.font*n,F,J),e.fontVelocity*=n,e.target={x:e.target.x*t,y:e.target.y*r,font:Q(e.target.font*n,F,J),angle:e.target.angle},e.route=e.route.map(i=>({x:i.x*t,y:i.y*r,font:Q(i.font*n,F,J),angle:i.angle}))}regrid(e,t,r,n,i){const s=new e.constructor(n*i);if(e.length!==t*r||t<1||r<1)return s;for(let o=0;o<i;o+=1)for(let u=0;u<n;u+=1)s[u+o*n]=e[Math.min(t-1,Math.floor((u+.5)*t/n))+Math.min(r-1,Math.floor((o+.5)*r/i))*t];return s}regridFloat(e,t,r,n,i){const s=new Float32Array(n*i);if(e.length!==t*r||t<1||r<1)return s;for(let o=0;o<i;o+=1)for(let u=0;u<n;u+=1)s[u+o*n]=e[Math.min(t-1,Math.floor((u+.5)*t/n))+Math.min(r-1,Math.floor((o+.5)*r/i))*t];return s}neighbors(e){const t=e%this.width,r=Math.floor(e/this.width);return[(t+1)%this.width+r*this.width,(t-1+this.width)%this.width+r*this.width,t+(r+1)%this.height*this.width,t+(r-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,r){return{x:Me(e.x,t.x,r),y:Me(e.y,t.y,r),font:Me(e.font,t.font,r),angle:Me(e.angle,t.angle,r)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),r=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&r>=0&&r<this.height?t+r*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,r){const n=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(n?.58:.56)+r)+4;const i=n?`i:${e}`:e;let s=this.textMetrics.get(i);return s===void 0&&(this.measure.font=`${n?"italic ":""}500 100px ${Yt}`,this.measure.fontKerning="none",s=this.measure.measureText(e).width/100,this.textMetrics.set(i,s)),s*t+e.length*r+4}}const Fe=.7,Qt=1.8,Jt=(x,e,t,r,n,i)=>{if(r<=0)return x;const s=Math.max(0,t),o=s+r,c=(i-n)/Qt*(r-Fe*(Math.exp(-s/Fe)-Math.exp(-o/Fe)));return Math.max(n,Math.min(i,x+e*c))},Zt=(x,e,t,r)=>({freeze:e>t?Math.max(0,Math.min(1,(e-x)/(e-t))):0,heat:e<r?Math.max(0,Math.min(1,(x-e)/(r-e))):0}),ft=2/Math.log(1+Math.sqrt(2)),ei=30,Pe=40,U=x=>{const e=document.getElementById(x);if(!e)throw new Error(`Missing #${x}`);return e},j=U("field"),re=U("scale"),oe=U("temperature"),ke=U("time-speed"),Be=U("brush-size"),ti=U("scale-value"),ii=U("temperature-value"),ni=U("time-speed-value"),si=U("brush-size-value"),ri=U("explanation"),me=U("settings-toggle"),Se=U("settings-panel"),Ge=U("pause"),oi=U("restart"),ai=U("clear-blue"),Ve=U("rough"),De=U("smooth"),qe=U("scale-dock"),li=U("scale-readout"),ze=U("freeze"),Ie=U("heat"),Xe=U("phase"),$e=U("magnetization"),He=U("energy"),Ue=U("fatal-error"),pt=U("place-labels"),ui=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function hi(){const x=await vt();if(!x){Ue.hidden=!1,Ue.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new Bt(x.device,x.format,j);let t=Number(oe.value),r=t,n=Number(re.value),i=n,s=Number(ke.value),o=Number(Be.value),u=!1,c=!0,d=!1,b=!1,f=!1,w=0,_=0,l=null,a=!0,p=0,y=performance.now(),v=0,I=!1,B=0;const m=new Map;let M=!1,z=0,R=n,A=!1,G=!1,L=0,Y=0,O=!1,k=0;const W=new Kt,q=new Map,N=new Set,K=new Set,X=new Set,V=new Set,C=ft+.2,ae=Number(re.min),ee=Number(re.max),Ye=Number(oe.min),We=Number(oe.max),gt=.75;let le=0,Ee=0;const mt=(ee-ae)/2.2,je=Math.ceil((Pe-1)/2),bt=()=>{const h=Math.max(1,window.innerWidth),g=Math.max(1,window.innerHeight),P=h<=720?Math.min(window.devicePixelRatio||1,2):1,E=Math.min(x.device.limits.maxTextureDimension2D/h,x.device.limits.maxTextureDimension2D/g),S=Math.sqrt(Number(x.device.limits.maxStorageBufferBindingSize)/4/(h*g)),D=Math.max(.25,Math.min(P,E,S)),$=Math.max(1,Math.round(h*D)),te=Math.max(1,Math.round(g*D));return{density:$/h,width:$,height:te}},Ae=h=>{const g=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**h-1)*g))},se=()=>Ae(n)*2+1,xt=()=>{const h=Math.min(e.width,e.height)/65.64;if(h<=0)return ee;let g=Math.log2(1+Math.max(0,(je-.5)/h));for(g=Math.min(ee,Math.max(ae,g));g<ee&&Ae(g)<je;)g=Math.min(ee,g+.01);return g},ue=()=>{const h=se(),g=h===1?"1 spin":`${h} × ${h}`;re.value=n.toFixed(2),qe.value=n.toFixed(2),ti.textContent=g,li.textContent=g,ri.textContent=ui[Math.min(3,Math.floor(n+.25))],Ve.setAttribute("aria-label",`Rough, observation scale ${n.toFixed(2)}`),De.setAttribute("aria-label",`Smooth, observation scale ${n.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-n/3)**2).toFixed(3))},he=()=>{oe.value=t.toFixed(2),ii.textContent=`T = ${t.toFixed(2)}`;const h=Zt(t,r,Ye,We);ze.style.setProperty("--paddle-progress",h.freeze.toFixed(4)),Ie.style.setProperty("--paddle-progress",h.heat.toFixed(4)),ze.setAttribute("aria-label",`Freeze, current temperature ${t.toFixed(2)}`),Ie.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const g=t-ft;g<-.2?Xe.textContent="ordered":g>.2?Xe.textContent="disordered":Xe.textContent="critical"},Ke=()=>{const h=Number.isInteger(s)?0:1;ni.textContent=`${s.toFixed(h)}×`},Te=()=>{Be.value=String(o),si.textContent=`${o} px`},yt=()=>({active:f&&!M&&!G,painting:d,forceHot:b,x:w,y:_,radius:o/2}),ce=()=>{const h=se(),g=(h-1)/2,P=h===1?0:.14*(1-n/3)**2;e.draw(n,g,P,L,yt()),a=!1},Qe=()=>{Y+=1,W.reset(),Je([])},Je=h=>{pt.classList.toggle("is-single-spin",se()===1);const g=new Set;for(const P of h){g.add(P.id);const E=jt(P);let S=q.get(P.id);for(S||(S=[],q.set(P.id,S));S.length<E.length;){const D=document.createElement("span");D.className="place-label",pt.append(D),S.push(D)}for(;S.length>E.length;)S.pop()?.remove();for(let D=0;D<E.length;D+=1){const $=S[D],te=E[D];$.dataset.kind!==P.kind&&($.dataset.kind=P.kind),$.textContent!==P.text&&($.textContent=P.text);const we=se()<Pe?.7:1;$.style.opacity=(P.opacity*we).toFixed(3),$.style.fontSize=`${P.fontSize.toFixed(2)}px`,$.style.letterSpacing=`${P.letterSpacing.toFixed(2)}px`,$.style.transform=`translate(${te.x.toFixed(2)}px, ${te.y.toFixed(2)}px) rotate(${P.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[P,E]of q)if(!g.has(P)){for(const S of E)S.remove();q.delete(P)}},Ze=(h=!0)=>{const g=bt();e.resize(g.width,g.height,g.density,h),ue(),a=!0,ce(),B+=1,Y+=1},be=h=>{const g=j.getBoundingClientRect(),P=(h.clientX-g.left)/g.width,E=(h.clientY-g.top)/g.height;return P<0||P>=1||E<0||E>=1?null:(w=h.clientX-g.left,_=h.clientY-g.top,{x:P*e.width,y:E*e.height})},xe=(h,g)=>{const P=be(h);if(!P){l=null;return}const E=l??P;e.paintSegment(E.x,E.y,P.x,P.y,o*e.density/2,g,b),l=P,a=!0},Re=h=>{d=!0,l=null,xe(h,!0),b=!1},et=()=>{const h=[...m.values()];return h.length<2?0:Math.hypot(h[1].x-h[0].x,h[1].y-h[0].y)},de=()=>{if(I)return;I=!0;const h=B;e.readStats().then(g=>{if(h!==B)return;$e.textContent=g.magnetization.toFixed(3),He.textContent=g.energy.toFixed(3);const P=g.signedMagnetization===-1;!d&&b!==P&&(b=P,a=!0)}).catch(g=>{console.warn("Could not read Ising statistics.",g)}).finally(()=>{I=!1})},tt=h=>{n=h,i=n,ue(),a=!0};re.addEventListener("input",()=>tt(Number(re.value))),qe.addEventListener("input",()=>tt(Number(qe.value))),oe.addEventListener("input",()=>{r=Number(oe.value),t=r,le=0,he()});const ye=(h,g)=>{const P=()=>{h.setAttribute("aria-pressed",String(g.size>0))},E=S=>{g.delete(`pointer:${S.pointerId}`),h.hasPointerCapture(S.pointerId)&&h.releasePointerCapture(S.pointerId),P()};h.addEventListener("pointerdown",S=>{S.pointerType==="mouse"&&S.button!==0||(S.preventDefault(),h.setPointerCapture(S.pointerId),g.add(`pointer:${S.pointerId}`),P())}),h.addEventListener("pointerup",E),h.addEventListener("pointercancel",E),h.addEventListener("lostpointercapture",S=>{g.delete(`pointer:${S.pointerId}`),P()}),h.addEventListener("keydown",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),g.add(`key:${S.code}`),P())}),h.addEventListener("keyup",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),g.delete(`key:${S.code}`),P())}),h.addEventListener("blur",()=>{for(const S of g)S.startsWith("key:")&&g.delete(S);P()})};ye(Ve,N),ye(De,K),ye(ze,X),ye(Ie,V),ke.addEventListener("input",()=>{s=Number(ke.value),Ke()}),Be.addEventListener("input",()=>{o=Number(Be.value),Te(),a=!0}),window.addEventListener("keydown",h=>{h.code!=="BracketLeft"&&h.code!=="BracketRight"||(h.preventDefault(),o=Math.max(4,Math.min(100,o+(h.code==="BracketLeft"?-4:4))),Te(),a=!0)});const Ce=h=>{c=h,Se.classList.toggle("is-closed",!c),Se.setAttribute("aria-hidden",String(!c)),me.setAttribute("aria-expanded",String(c)),me.setAttribute("aria-label",c?"Close settings":"Open settings")};me.addEventListener("click",()=>Ce(!c)),document.addEventListener("pointerdown",h=>{const g=h.target;!c||!(g instanceof Node)||Se.contains(g)||me.contains(g)||Ce(!1)},{capture:!0}),document.addEventListener("click",h=>{const g=h.target;!c||!(g instanceof Node)||me.contains(g)||(!Se.contains(g)||g instanceof Element&&g.closest("button"))&&Ce(!1)}),Ge.addEventListener("click",()=>{u=!u;const h=u?"Resume simulation":"Pause simulation";Ge.setAttribute("aria-pressed",String(u)),Ge.setAttribute("aria-label",h),Ge.title=h,p=0}),oi.addEventListener("click",()=>{e.randomize(),b=!1,p=0,B+=1,Qe(),$e.textContent="0.000",He.textContent="0.000",a=!0,ce(),de()}),ai.addEventListener("click",()=>{e.clearBlue(),b=!0,p=0,B+=1,Qe(),$e.textContent="1.000",He.textContent="-2.000",a=!0,ce(),de()}),j.addEventListener("pointerdown",h=>{if(be(h)){if(j.setPointerCapture(h.pointerId),f=!0,h.pointerType==="touch"){m.set(h.pointerId,{x:h.clientX,y:h.clientY}),m.size===1?(A=!0,G=!1):m.size===2&&(d=!1,l=null,A=!1,G=!0,M=!0,z=et(),R=i),a=!0;return}Re(h)}}),j.addEventListener("pointermove",h=>{if(be(h),f=!0,a=!0,h.pointerType==="touch"){if(!m.has(h.pointerId))return;if(m.set(h.pointerId,{x:h.clientX,y:h.clientY}),M&&m.size>=2){const g=et();z>0&&g>0&&(i=Math.max(0,Math.min(3,R-Math.log2(g/z)*.9)));return}if(m.size===1&&!G){if(A)Re(h),A=!1;else if(d)for(const g of h.getCoalescedEvents())xe(g,!1)}return}if(d){const g=h.getCoalescedEvents();if(g.length===0)xe(h,!1);else for(const P of g)xe(P,!1)}});const wt=h=>{h.pointerType==="touch"&&(A&&!G&&Re(h),m.delete(h.pointerId),m.size<2&&(M=!1),m.size===0&&(A=!1,G=!1,f=!1)),d=!1,l=null,j.hasPointerCapture(h.pointerId)&&j.releasePointerCapture(h.pointerId),a=!0,de()};j.addEventListener("pointerup",wt),j.addEventListener("pointercancel",h=>{m.delete(h.pointerId),d=!1,f=!1,l=null,A=!1,M=!1,a=!0}),j.addEventListener("pointerenter",()=>{f=!0,a=!0}),j.addEventListener("pointerleave",()=>{d||(f=!1,a=!0)}),j.addEventListener("wheel",h=>{h.preventDefault();const g=Math.max(-120,Math.min(120,h.deltaY));i=Math.max(0,Math.min(3,i+g*.00125)),be(h),f=!0},{passive:!1}),window.addEventListener("blur",()=>{d=!1,f=!1,l=null,m.clear(),M=!1,A=!1,N.clear(),K.clear(),X.clear(),V.clear(),le=0,Ee=0,Ve.setAttribute("aria-pressed","false"),De.setAttribute("aria-pressed","false"),ze.setAttribute("aria-pressed","false"),Ie.setAttribute("aria-pressed","false"),a=!0}),window.addEventListener("resize",()=>Ze(!0)),Ze(!1),e.step(t,40),he(),Ke(),Te(),a=!0,ce(),de();const it=h=>{const g=Math.max(0,(h-y)/1e3),P=Math.min(.1,g);y=h;const E=+(K.size>0)-+(N.size>0);if(E!==0){const H=E<0?ae:ee,ie=E*mt*P;n=E<0?Math.max(H,n+ie):Math.min(H,n+ie),i=n,ue(),a=!0}else{const H=i-n;Math.abs(H)>5e-4?(n+=H*(1-Math.exp(-P*10)),ue(),a=!0):n!==i&&(n=i,ue(),a=!0)}const S=+(V.size>0)-+(X.size>0);if(S!==Ee&&(le=0,Ee=S),S!==0)t=Jt(t,S,le,P,Ye,We),le+=P,he();else{const H=r-t;Math.abs(H)>5e-4?(t+=H*(1-Math.exp(-P/gt)),he()):t!==r&&(t=r,he())}if(!u){p+=P*ei*s;const H=Math.min(8,Math.floor(p));H>0&&(p-=H,e.step(t,H),a=!0)}const D=se()>=Pe?1:0,$=D-L;Math.abs($)>.001?(L+=$*(1-Math.exp(-P*7)),a=!0):L!==D&&(L=D,a=!0);const te=se()>=Pe?n:xt(),we=t>C?"chaos":"map",nt=j.getBoundingClientRect(),_t=W.advance(Math.min(.5,g),we,{width:nt.width,height:nt.height});if(Je(_t),a&&ce(),!O&&we==="map"&&h-k>280){k=h,O=!0;const H=Y;e.readRegionSample(Ae(te),te).then(ie=>{H!==Y||!ie||t>C||W.ingest(ie)}).catch(ie=>{console.warn("Could not read Ising regions.",ie)}).finally(()=>{O=!1})}h-v>750&&(v=h,de()),requestAnimationFrame(it)};requestAnimationFrame(it)}hi().catch(x=>{console.error(x),Ue.hidden=!1,Ue.textContent=x instanceof Error?x.message:"Could not start the WebGPU simulation."});
