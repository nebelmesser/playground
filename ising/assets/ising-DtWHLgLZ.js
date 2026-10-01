(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();async function Ht(){try{if(!navigator.gpu)return null;const u=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!u)return null;const e=await u.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(u){return console.error("WebGPU initialization failed.",u),null}}const $t=`struct SimParams {
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
@group(0) @binding(18) var display_field: texture_2d<f32>;

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

fn linear_channel(value: f32) -> f32 {
  return select(value / 12.92, pow((value + 0.055) / 1.055, 2.4), value > 0.04045);
}

fn palette_luminance(value: f32) -> f32 {
  let color = palette(value);
  return dot(
    vec3<f32>(linear_channel(color.r), linear_channel(color.g), linear_channel(color.b)),
    vec3<f32>(0.2126, 0.7152, 0.0722),
  );
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
  // Keep the label-scale sign for geography, but measure the displayed field
  // before averaging colors. Orange and blue pixels stay bright even when
  // their signed values cancel within one coarse cell.
  let luminance = (
    palette_luminance(textureSampleLevel(display_field, field_sampler, origin + cell * vec2<f32>(0.25, 0.25), 0.0).r)
    + palette_luminance(textureSampleLevel(display_field, field_sampler, origin + cell * vec2<f32>(0.75, 0.25), 0.0).r)
    + palette_luminance(textureSampleLevel(display_field, field_sampler, origin + cell * vec2<f32>(0.25, 0.75), 0.0).r)
    + palette_luminance(textureSampleLevel(display_field, field_sampler, origin + cell * vec2<f32>(0.75, 0.75), 0.0).r)
  ) * 0.25;
  let encoded = 1 + i32(round(clamp(luminance, 0.0, 1.0) * 65534.0));
  region_cells[gid.y * region_params.coarse.x + gid.x] = select(-encoded, encoded, value >= 0.0);
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
`,N=(u,e)=>Math.ceil(u/e),ze=112,Ae=128,Xt=(u,e)=>u>=e?{width:ze,height:Math.max(1,Math.round(ze*e/u))}:{width:Math.max(1,Math.round(ze*u/e)),height:ze};class Yt{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,s){this.device=e,this.format=t,this.canvas=s;const i=s.getContext("webgpu");if(!i)throw new Error("Could not create a WebGPU canvas context.");this.context=i,this.context.configure({device:e,format:t,alphaMode:"opaque"});const n=e.createShaderModule({label:"Ising shaders",code:$t});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:n,entryPoint:"fullscreen_vertex"},fragment:{module:n,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising label blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:Ae*Ae*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:Ae*Ae*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,s,i=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=s;return}const n=this.width,r=this.height,o=this.spinBuffers,a=this.fieldTexture,c=this.blurTextures,d=this.labelBlurTextures,m=this.statsOutput,f=this.statsReadback,_=o?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=s,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),i&&_){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,n,r);const x=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:_}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),w=this.device.createCommandEncoder({label:"Resize Ising grid"}),b=w.beginComputePass();b.setPipeline(this.pipelines.resize),b.setBindGroup(0,x),b.dispatchWorkgroups(N(e,8),N(t,8)),b.end(),this.device.queue.submit([w.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...m?[m]:[]],readback:f??void 0,textures:[a,...c??[],...d??[]].filter(x=>!!x)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(N(this.width,8),N(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(N(this.width,8),N(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let s=0;s<t;s+=1){const i=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,i);const n=this.device.createCommandEncoder({label:"Advance Ising state"}),r=n.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(N(this.width,8),N(this.height,8)),r.end(),this.device.queue.submit([n.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,s,i,n,r,o){const a=Math.floor(Math.min(e,s)-n),c=Math.floor(Math.min(t,i)-n),d=Math.ceil(Math.max(e,s)+n),m=Math.ceil(Math.max(t,i)+n),f=d-a+1,_=m-c+1;this.writeBrushParams(a,c,f,_,e,t,s,i,n,o);const x=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const b=x.beginComputePass();b.setPipeline(this.pipelines.select),b.setBindGroup(0,this.selectGroups[this.currentIndex]),b.dispatchWorkgroups(1),b.end()}const w=x.beginComputePass();w.setPipeline(this.pipelines.paint),w.setBindGroup(0,this.paintGroups[this.currentIndex]),w.dispatchWorkgroups(N(f,8),N(_,8)),w.end(),this.device.queue.submit([x.finish()]),this.fieldDirty=!0}draw(e,t,s,i,n){if(!this.renderGroup||!this.observationReady())return;const r=this.secondaryObservationRadius(t,e),o=this.fieldDirty||t!==this.lastBlurRadius||r!==this.lastSecondaryRadius,a=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const d=a.beginComputePass();d.setPipeline(this.pipelines.field),d.setBindGroup(0,this.fieldGroups[this.currentIndex]),d.dispatchWorkgroups(N(this.width,8),N(this.height,8)),d.end(),this.fieldDirty=!1}o&&this.appendObservationBlur(a,t,r,"display"),this.writeRenderParams(e,t,s,i,n);const c=a.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});c.setPipeline(this.pipelines.render),c.setBindGroup(0,this.renderGroup),c.draw(3),c.end(),this.device.queue.submit([a.finish()])}async readRegionSample(e,t){const s=this.regionGroup;if(!s||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const i=Xt(this.width,this.height),n=i.width*i.height;if(n*4>this.regionStorage.size)return null;const r=this.secondaryObservationRadius(e,t),o=e===this.lastBlurRadius&&r===this.lastSecondaryRadius,a=o?s:this.labelRegionGroup;if(!a)return null;const c=this.device.createCommandEncoder({label:"Read Ising regions"});o||this.appendObservationBlur(c,e,r,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([i.width,i.height,0,0]));const d=c.beginComputePass();d.setPipeline(this.pipelines.regions),d.setBindGroup(0,a),d.dispatchWorkgroups(N(i.width,8),N(i.height,8)),d.end(),c.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,n*4),this.device.queue.submit([c.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const m=new Int32Array(this.regionReadback.getMappedRange(),0,n),f=new Int8Array(n),_=new Float32Array(n);for(let x=0;x<n;x+=1)f[x]=m[x]<0?-1:1,_[x]=(Math.abs(m[x])-1)/65534;return{width:i.width,height:i.height,signs:f,luminance:_}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,s=this.statsGroups[this.currentIndex];if(!e||!t||!s)return{energy:0,magnetization:0,signedMagnetization:0};const i=N(this.width,16),n=N(this.height,16),r=new Uint32Array([this.width,this.height,i,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(e);const a=o.beginComputePass();a.setPipeline(this.pipelines.stats),a.setBindGroup(0,s),a.dispatchWorkgroups(i,n),a.end(),o.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([o.finish()]),await t.mapAsync(GPUMapMode.READ);const c=new Int32Array(t.getMappedRange()),d=c[0],m=c[1];t.unmap();const f=this.width*this.height;return{magnetization:Math.abs(d/f),signedMagnetization:d/f,energy:m/f}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}))}writeSimParams(e,t,s,i,n=0,r=0){const o=new ArrayBuffer(32),a=new DataView(o);a.setUint32(0,this.width,!0),a.setUint32(4,this.height,!0),a.setUint32(8,e,!0),a.setUint32(12,t,!0),a.setFloat32(16,s,!0),a.setUint32(20,i,!0),a.setUint32(24,n,!0),a.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(e,t,s,i,n,r,o,a,c,d){const m=new ArrayBuffer(64),f=new DataView(m);f.setUint32(0,this.width,!0),f.setUint32(4,this.height,!0),f.setInt32(8,e,!0),f.setInt32(12,t,!0),f.setUint32(16,s,!0),f.setUint32(20,i,!0),f.setUint32(24,d?1:0,!0),f.setFloat32(32,n,!0),f.setFloat32(36,r,!0),f.setFloat32(40,o,!0),f.setFloat32(44,a,!0),f.setFloat32(48,c,!0),this.device.queue.writeBuffer(this.brushUniform,0,m)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,s,i){const n=i==="display",r=n?this.blurUniforms:this.labelBlurUniforms,o=n?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,a=n?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,c=n?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,d=n?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!a||!c||!d||o.length===0)return;this.writeBlurParams(r[0],t),this.writeBlurParams(r[1],s);const m=e.beginComputePass({label:"Horizontal Ising observation blur"});m.setPipeline(this.pipelines.blurSpinsHorizontal),m.setBindGroup(0,o[this.currentIndex]),m.dispatchWorkgroups(N(this.height,64)),m.end();const f=e.beginComputePass({label:"Vertical Ising observation blur"});if(f.setPipeline(this.pipelines.blurTextureVertical),f.setBindGroup(0,a),f.dispatchWorkgroups(N(this.width,64)),f.end(),s>0){const _=e.beginComputePass({label:"Secondary horizontal Ising blur"});_.setPipeline(this.pipelines.blurTextureHorizontal),_.setBindGroup(0,c),_.dispatchWorkgroups(N(this.height,64)),_.end();const x=e.beginComputePass({label:"Secondary vertical Ising blur"});x.setPipeline(this.pipelines.blurTextureVertical),x.setBindGroup(0,d),x.dispatchWorkgroups(N(this.width,64)),x.end()}n&&(this.lastBlurRadius=t,this.lastSecondaryRadius=s)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,s,i,n){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=t,r[5]=e,r[6]=s,r[7]=n.active?1:0,r[8]=n.x*this.density,r[9]=n.y*this.density,r[10]=n.radius*this.density,r[11]=n.painting?1:0,r[12]=n.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),r[14]=i,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const s of e.buffers)s.destroy();for(const s of e.textures??[])s.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const Wt={land:{dark:"#050302",light:"#ffd5a6"},water:{dark:"#06132e",light:"#c4eaff"}},Ct=(u,e,t)=>Math.max(e,Math.min(t,u)),Kt=u=>u<=.04045?u/12.92:((u+.055)/1.055)**2.4,_t=u=>{const e=[1,3,5].map(t=>Kt(parseInt(u.slice(t,t+2),16)/255));return e[0]*.2126+e[1]*.7152+e[2]*.0722},Mt=(u,e)=>(Math.max(u,e)+.05)/(Math.min(u,e)+.05),Oe=(u,e)=>Wt[u==="lake"?"water":"land"][e],jt=(u,e,t,s)=>{const i=Oe(u,e),n=Oe(u,t);return`rgb(${[1,3,5].map(o=>{const a=parseInt(i.slice(o,o+2),16),c=parseInt(n.slice(o,o+2),16);return(a+(c-a)*s).toFixed(2)}).join(", ")})`},Qt=(u,e,t)=>{const s=u.angle*Math.PI/180,i=Math.cos(s),n=Math.sin(s),r=_t(Oe(u.kind,"dark")),o=_t(Oe(u.kind,"light")),a=[],c=[];for(let m=-1;m<=1;m+=1)for(let f=-4;f<=4;f+=1){const _=f*u.width*.105,x=m*u.height*.28,w=u.x+_*i-x*n,b=u.y+_*n+x*i,S=Math.max(0,Math.min(e.width-1,Math.floor(w/t.width*e.width))),A=Math.max(0,Math.min(e.height-1,Math.floor(b/t.height*e.height))),B=e.luminance[A*e.width+S];a.push(Mt(B,r)),c.push(Mt(B,o))}a.sort((m,f)=>m-f),c.sort((m,f)=>m-f);const d=Math.floor((a.length-1)*.25);return{dark:a[d],light:c[d]}},Jt=(u,e)=>{const t=u?u.darkContrast*.55+e.dark*.45:e.dark,s=u?u.lightContrast*.55+e.light*.45:e.light;let i=u?.mode??(t>=2.5||s<4.5?"dark":"light");const n=i==="dark"?s:t,o=(i==="dark"?t:s)<(i==="dark"?2.5:3)&&n>4.5?(u?.weakSamples??0)+1:0,a=o>=5;return a&&(i=i==="dark"?"light":"dark"),{mode:i,darkContrast:t,lightContrast:s,weakSamples:a?0:o,opacity:i==="dark"?Ct(.82+(5-t)*.06,.82,1):1}},Zt=(u,e,t)=>u===void 0?e:u+(e-u)*(1-Math.exp(-Ct(t,0,.5)/.8)),ei=(u,e,t)=>{if(!u)return{from:e,to:e,progress:1,velocity:0};let s=u;if(s.from===s.to){if(e===s.to)return s;s={from:s.to,to:e,progress:0,velocity:0}}const i=e===s.to?1:0,n=Math.max(0,Math.min(t,1/60)),r=5,o=s.progress-i,a=s.velocity+r*o,c=Math.exp(-r*n),d=Math.max(0,Math.min(1,i+(o+a*n)*c)),m=(s.velocity-r*a*n)*c;return Math.abs(d-i)<.001&&Math.abs(m)<.02?{from:e,to:e,progress:1,velocity:0}:{...s,progress:d,velocity:m}},ti=u=>u.from===u.to?{blend:1,opacity:1}:{blend:u.progress*u.progress*(3-2*u.progress),opacity:1},at=["v","l","m","n","s","c","r","t","p","d","f","g","b","pr","tr","cl","cr","fl","fr","gl","gr","pl","br","dr","st","qu"],Lt=["l","r","n","m","t","s","c","d","v","p","g","b","f","br","cr","dr","gr","pr","tr","st"],ii=["a","e","i","o","u"],lt=["a","e","i","o","u","a","e","i","o","ae","au","oe"],Nt=["n","r","s","l","m","t"],ni=["a","us","um","is","or"],si=["ia","ea","on","ar","is","um"],we=(u,e,t=0)=>e[(Math.floor(u()*e.length)+t)%e.length],J=u=>`${u.syllables.map(e=>e.onset+e.vowel).join("")}${u.coda}`,Pt=(u,e)=>{for(let t=0;t<512;t+=1){const s=u()<.82||t>=24?2:3,i=[];let n=!1;for(let a=0;a<s;a+=1){const c=we(u,a===0?at:Lt,a===0?t:a===1?Math.floor(t/at.length):0);let d=we(u,lt);d.length>1&&n&&(d=we(u,ii)),c==="qu"&&(d==="u"||d==="au"||d==="oe")&&(d="a"),a>0&&`${c}${d}`===i[a-1].onset+i[a-1].vowel&&(d=we(u,lt,1)),n||=d.length>1,i.push({onset:c,vowel:d})}const r={syllables:i,coda:we(u,Nt)},o=J(r);if(!(o.length>8)&&!e?.has(o))return r}throw new Error("Could not find an unused place name")},Fe=u=>({syllables:u.syllables.map(e=>({...e})),coda:u.coda}),se=(u,e)=>{if(e===u.syllables.length*2)return u.coda;const t=u.syllables[Math.floor(e/2)];return e%2===0?t.onset:t.vowel},De=(u,e,t)=>{const s=Fe(u);return e===s.syllables.length*2?s.coda=t:e%2===0?s.syllables[Math.floor(e/2)].onset=t:s.syllables[Math.floor(e/2)].vowel=t,s},Ve=u=>u.syllables.every(({onset:e,vowel:t})=>e!=="qu"||!["u","au","oe"].includes(t)),St=(u,e,t=1,s=4)=>{let i=t;for(;i<s&&u()<e;)i+=1;return i},Bt=(u,e,t,s=1)=>{const i=u.syllables.length*2+1;let n=Fe(u);const r=new Set;for(let o=0;o<Math.min(s,i);o+=1){let a=null;for(let c=0;c<i&&!a;c+=1){const d=(Math.abs(e)+o+c)%i;if(r.has(d))continue;const m=se(n,d),f=d===i-1?Nt:d%2===1?lt:d===0?at:Lt,_=[...new Set(f)].filter(x=>x.length===m.length&&x!==m);for(let x=0;x<_.length;x+=1){const w=_[(Math.abs(e+c*7+o*11)+x)%_.length],b=De(n,d,w),S=J(b);if(S.length<=8&&Ve(b)&&!t?.has(S)){a=b,r.add(d);break}}}if(!a)break;n=a}return n},ri=u=>{const e=[...u].sort((a,c)=>c.weight-a.weight),t=e[0];if(!t)throw new Error("Cannot recombine without a parent");const s=e.reduce((a,c)=>a+Math.max(0,c.weight),0);if(e.length===1||s<=0)return Fe(t.genome);const i=Fe(t.genome),n=i.syllables.length*2+1;let r=0;const o=e.map(a=>(r+=Math.max(0,a.weight)/s,r));for(let a=0;a<n;a+=1){const c=(a+.5)/n,d=e[o.findIndex(x=>c<=x)]?.genome??t.genome,m=a===n-1?d.syllables.length*2:Math.min(Math.floor(a/2),d.syllables.length-1)*2+a%2,f=se(d,m);if(f.length!==se(i,a).length)continue;const _=De(i,a,f);J(_).length<=8&&Ve(_)&&(i.syllables=_.syllables,i.coda=_.coda)}return i},oi=(u,e,t)=>{const s=u.syllables.length*2+1;if(e.syllables.length!==u.syllables.length)return null;for(let i=0;i<s;i+=1){const n=se(e,i);if(n===se(u,i))continue;const r=De(u,i,n);if(J(r).length<=8&&Ve(r)&&!t?.has(J(r)))return r}return null},ai=(u,e,t,s)=>{const i=u.syllables.length*2+1;for(let n=0;n<i;n+=1){const r=(Math.abs(t)+n)%i,o=r===i-1?e.syllables.length*2:Math.min(Math.floor(r/2),e.syllables.length-1)*2+r%2,a=se(e,o);if(a===se(u,r)||a.length!==se(u,r).length)continue;const c=De(u,r,a);if(J(c).length<=8&&Ve(c)&&!s?.has(J(c)))return c}return null},li=(u,e)=>{const t=`${e.charAt(0).toUpperCase()}${e.slice(1)}`,s=[...e].reduce((r,o)=>r+o.charCodeAt(0),0),i=u==="continent"?si:ni,n=i[s%i.length];return`${t}${n}`},Gt=.7,he=5,ut=2.27,It=.2,Ee=3,ui=.75,hi=.24,ci=3,di=.0035,fi=.008,gi=.055,zt=1/4,pi=48,Qe=1.35,mi=.16,bi=9,H=8,ee=64,te=80,At=20,Et=.12,Ut=.22,xi=.05,yi=.12,wi=.85,vi=.25,_i=3,Tt=8,Mi=1.8,Pi=140,Si=28,Bi=160,Gi=2,Ii='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',W=(u,e,t)=>Math.max(e,Math.min(t,u)),ve=(u,e,t,s)=>u+(e-u)*(1-Math.exp(-t/s)),ne=u=>u==="island"||u==="continent",ae=u=>u*mi,Ue=(u,e,t)=>u+(e-u)*t,zi=u=>({heat:Math.sqrt(W((u-ut)/It,0,1)),cold:Math.sqrt(W((ut-u)/It,0,1))}),_e=(u,e)=>{const t=Math.abs(u-e)%180;return Math.min(t,180-t)},Ai=(u,e,t,s)=>{const i=2/wi,n=(t-u)*i*i-2*i*e,r=e+n*s;return{value:u+r*s,velocity:r}},Ei=u=>[{x:u.x,y:u.y}];class Ui{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1}advance(e,t,s,i=!1){this.applyViewport(s);const n=W(e,0,.5);t!=="map"&&(this.synced=!1);for(const o of this.tracks.values()){t!=="map"||!o.present||!o.confirmed?(o.heatHoldSeconds=0,o.heatPulseReady=!1):i&&!o.heatPulseReady?(o.heatHoldSeconds+=n,o.heatHoldSeconds>=ui&&(o.heatPulseReady=!0)):!i&&!o.heatPulseReady&&(o.heatHoldSeconds=0);const a=t==="map"&&o.confirmed&&o.missing===0;o.agreement=ve(o.agreement,a?1:0,n,Gt),o.stability=ve(o.stability,a?o.agreement:0,n,Gt);const c=o.placement;c?.alive&&o.present&&this.glide(o,c,n);const d=c?[c,...o.ghosts]:o.ghosts;for(const m of d){const f=t==="map"&&this.synced&&o.present&&o.confirmed&&o.missing<.75&&m.alive;m.opacity=ve(m.opacity,f?o.stability:0,n,f?.25:.45)}c&&!c.alive&&c.opacity<.02&&(o.placement=null),o.ghosts=o.ghosts.filter(m=>m.opacity>=.02)}const r=this.collect(n);return t==="chaos"&&r.length===0&&this.reset(),r}ingest(e,t=ut){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const s=performance.now()/1e3,i=this.lastIngest<0?0:Math.min(2,s-this.lastIngest);this.lastIngest=s;const{heat:n,cold:r}=zi(t);for(const h of this.tracks.values())h.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const h=[];for(const l of this.tracks.values()){l.soft&&(l.soft=this.regridFloat(l.soft,this.width,this.height,e.width,e.height)),l.lastMask&&(l.lastMask=this.regrid(l.lastMask,this.width,this.height,e.width,e.height)),l.nameAnchor&&(l.nameAnchor=this.regrid(l.nameAnchor,this.width,this.height,e.width,e.height));const p=l.placement?[l.placement,...l.ghosts]:l.ghosts;for(const v of p){const G=v.mask===v.regionMask;v.mask=this.regrid(v.mask,this.width,this.height,e.width,e.height),v.regionMask=G?v.mask:this.regrid(v.regionMask,this.width,this.height,e.width,e.height),h.push(v.mask),G||h.push(v.regionMask)}}this.width=e.width,this.height=e.height;for(const l of h)this.remember(l)}const a=this.components(e.signs).filter(h=>h.role==="place").sort((h,l)=>l.area-h.area).slice(0,pi),c=[],d=[],m=(h,l,p)=>{const v=l.placement?.alive?{x:l.placement.position.x/this.viewport.width,y:l.placement.position.y/this.viewport.height}:l.center;return{region:h,track:l,overlap:p,distance:this.distance(v,a[h].center)}};for(let h=0;h<a.length;h+=1){const l=new Map;for(const p of a[h].cells){const v=this.owners[p];v&&l.set(v,(l.get(v)??0)+1)}for(const[p,v]of l){const G=this.tracks.get(p);!G||ne(G.kind)!==a[h].sign>0||v<=0||c.push(m(h,G,v))}d.push(l)}const f=new Set,_=new Set,x=[],w=h=>{h.sort((l,p)=>p.overlap-l.overlap||l.distance-p.distance||l.track.id-p.track.id);for(const l of h)f.has(l.region)||_.has(l.track.id)||(f.add(l.region),_.add(l.track.id),x.push({track:l.track,region:a[l.region],overlap:l.overlap}))};w(c);const b=[];for(const h of this.tracks.values())if(!(_.has(h.id)||!h.lastMask||h.missing>=he))for(let l=0;l<a.length;l+=1){if(f.has(l)||ne(h.kind)!==a[l].sign>0)continue;const p=a[l].bounds;if(h.bounds.x1<=p.x0||p.x1<=h.bounds.x0||h.bounds.y1<=p.y0||p.y1<=h.bounds.y0)continue;let v=0;for(const G of a[l].cells)v+=h.lastMask[G]??0;v>0&&b.push(m(l,h,v))}w(b);const S=[];for(const h of this.tracks.values())if(!(_.has(h.id)||h.missing>=he))for(let l=0;l<a.length;l+=1){const p=a[l];if(f.has(l)||ne(h.kind)!==p.sign>0)continue;const v=Math.min(h.area,p.area)/Math.max(h.area,p.area),G=Math.max(0,h.bounds.x0-p.bounds.x1,p.bounds.x0-h.bounds.x1)*this.width,I=Math.max(0,h.bounds.y0-p.bounds.y1,p.bounds.y0-h.bounds.y1)*this.height,P=Math.hypot((h.center.x-p.center.x)*this.width,(h.center.y-p.center.y)*this.height),U=Math.sqrt(Math.min(h.area,p.area)/Math.PI);v>=.5&&Math.hypot(G,I)<=1.5&&P<=Math.max(3,U*1.25)&&S.push(m(l,h,0))}w(S);const A=new Set;for(const h of this.tracks.values()){let l=0;for(let p=0;p<a.length;p+=1)ne(h.kind)===a[p].sign>0&&(d[p].get(h.id)??0)>=a[p].area*.5&&(l+=1);l>1&&A.add(h.id)}for(let h=0;h<a.length;h+=1){if(f.has(h))continue;const l=a[h];if(!l.kind)continue;const p=[...d[h]].filter(([R,O])=>A.has(R)&&O>=l.area*.5&&ne(this.tracks.get(R).kind)===l.sign>0).sort((R,O)=>O[1]-R[1]).map(([R])=>this.tracks.get(R)).find(R=>R!==void 0),v=p?St(Math.random,.28+.35*n-.2*r):0;let G=p?Bt(p.genome,this.nameSeed(l,p.id),this.usedStems,v):Pt(Math.random,this.usedStems);this.usedStems.has(J(G))&&(G=Pt(Math.random,this.usedStems));const I=J(G);this.usedStems.add(I);const P=p&&v<3?`${I.charAt(0).toUpperCase()}${I.slice(1)}${p.suffix}`:li(l.kind,I),U=this.nextTrackId++,V={id:U,stem:I,genome:G,suffix:P.slice(I.length),lineage:p?.lineage??U,pendingGenome:null,nameAnchor:null,nameStreak:0,lastNameChange:s,mutationSerial:0,heatDose:0,coldDose:0,heatHoldSeconds:0,heatPulseReady:!1,kind:l.kind,text:P,area:l.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:l.center,bounds:l.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(V.id,V),x.push({track:V,region:l,overlap:0})}for(const{track:h,region:l}of x){const p=a.indexOf(l),v=[...d[p]].filter(([G,I])=>{const P=this.tracks.get(G);if(!P||ne(P.kind)!==l.sign>0)return!1;const U=P.genome.syllables.length*2+1;return I/l.area>=.5/U}).map(([G,I])=>({track:this.tracks.get(G),weight:I})).sort((G,I)=>I.weight-G.weight||G.track.id-I.track.id);if(v.length>1){const I=v.every(P=>P.track.lineage===v[0].track.lineage)?[...v].sort((P,U)=>P.track.id-U.track.id)[0].track.genome:ri(v.map(({track:P,weight:U})=>({genome:P.genome,weight:U})));J(I)!==h.stem&&(h.pendingGenome=I),h.lastNameChange=s,h.nameStreak=0,h.nameAnchor=null}else A.has(h.id)&&(h.lastNameChange=s,h.nameStreak=0,h.nameAnchor=null)}const B=new Uint16Array(e.signs.length);for(const{track:h,region:l,overlap:p}of x){if(h.present=!0,p>0){const v=p/Math.min(h.area,l.area);h.agreement=Math.min(h.agreement,.65+.35*v)}h.area=l.area,h.center=l.center,h.bounds=l.bounds,h.missing=0,h.confirmed=!0;for(const v of l.cells)B[v]=h.id}this.owners=B;for(const h of[...this.tracks.values()])x.some(l=>l.track===h)||(h.missing+=i,h.confirmed=!1,h.missing>he&&(this.tracks.delete(h.id),this.usedStems.delete(h.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}const E=new Map([...this.tracks].map(([h,l])=>[h,l.genome]));for(const{track:h,region:l}of x){const p=this.allowedMask(l),v=r>0?this.coldDonor(h,r):null;this.evolveName(h,l,p,s,i,n,r,v?E.get(v.id)??null:null),h.lastMask=p,this.remember(p),this.smooth(h,p,i),this.aim(h,p,i)}this.synced=!0}nameSeed(e,t){return Math.floor(e.center.x*8191+e.center.y*16381+e.area*17+t*131)}maskDistance(e,t){let s=0,i=0;for(let n=0;n<t.length;n+=1)s+=e[n]|t[n],i+=e[n]&t[n];return s>0?1-i/s:0}rename(e,t,s,i){const n=J(t);if(n===e.stem||this.usedStems.has(n))return!1;const r=`${n.charAt(0).toUpperCase()}${n.slice(1)}${e.suffix}`,o=e.placement;return o?.alive&&!this.fitsPose(o.mask,r,this.snapshot(o))?!1:(this.usedStems.delete(e.stem),this.usedStems.add(n),e.genome=t,e.stem=n,e.text=r,e.lastNameChange=i,e.nameAnchor=s.slice(),e.nameStreak=0,!0)}coldDonor(e,t){const s=Math.sqrt(e.area/Math.PI);let i=null,n=1/0;for(const r of this.tracks.values()){if(r.id===e.id||!r.present||!r.confirmed||ne(r.kind)!==ne(e.kind)||r.area<e.area||r.area===e.area&&r.id>e.id)continue;const a=Math.hypot((r.center.x-e.center.x)*this.width,(r.center.y-e.center.y)*this.height)/(s+Math.sqrt(r.area/Math.PI));a>1+2*t||a>=n||(i=r,n=a)}return i}evolveName(e,t,s,i,n,r,o,a){if((!e.nameAnchor||e.nameAnchor.length!==s.length)&&(e.nameAnchor=s.slice()),e.heatDose=r>0?Math.min(Ee,e.heatDose+r*n):0,e.coldDose=o>0?Math.min(Ee,e.coldDose+o*n):0,e.pendingGenome){if(i-e.lastNameChange<he)return;const m=e.pendingGenome,f=oi(e.genome,m,this.usedStems);f?this.rename(e,f,s,i)&&J(e.genome)===J(m)&&(e.pendingGenome=null):e.pendingGenome=null;return}if(o>0&&!e.heatPulseReady){if(e.nameAnchor=s.slice(),e.nameStreak=0,e.coldDose<Ee||i-e.lastNameChange<he||!a)return;const m=ai(e.genome,a,this.nameSeed(t,e.lineage)+e.mutationSerial*31,this.usedStems);e.coldDose=0,m&&this.rename(e,m,s,i)&&(e.mutationSerial+=1);return}if(this.maskDistance(e.nameAnchor,s)>hi?e.nameStreak+=1:e.nameStreak=0,e.nameStreak<ci&&e.heatDose<Ee&&!e.heatPulseReady||i-e.lastNameChange<he)return;const c=St(Math.random,e.heatPulseReady?.55:.28+.35*r,e.heatPulseReady?2:1),d=this.nameSeed(t,e.lineage)+e.mutationSerial*31;for(let m=0;m<e.genome.syllables.length*2+1;m+=1){const f=Bt(e.genome,d+m,this.usedStems,c);if(this.rename(e,f,s,i)){e.mutationSerial+=1,e.heatDose=0,e.heatHoldSeconds=0,e.heatPulseReady=!1;break}}}aim(e,t,s){const i=this.viewport.width*this.viewport.height/t.length,n=W(Math.sqrt(e.area*i/(Math.max(4,e.text.length)*3.2)),H,ee);e.styleFont=e.styleFont===0?n:ve(e.styleFont,n,s,2.5);const r=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),o=e.placement?.alive?e.placement:null,a=o?.angle??0,c=[],d=(l,p)=>Math.max(.01,r.quality[l]+.12*p.font/e.styleFont-xi*Math.abs(p.angle)/te-yi*r.elongation[l]*_e(p.angle,r.axis[l])/te);for(const l of r.candidates){const p=this.cellPoint(l);if(c.some(G=>this.distance(G.pose,p)<r.radius*.55))continue;const v=this.poseAt(e.text,t,p,e.styleFont,a,r.axis[l],r.elongation[l]);if(v&&(c.push({pose:v,quality:d(l,v)}),c.length>=24))break}if(o){const l=this.index(o.position);if(l>=0&&r.centerX[l]>0){const p={x:r.centerX[l],y:r.centerY[l]},v=this.index(p),G=v<0?null:this.poseAt(e.text,t,p,e.styleFont,a,r.axis[v],r.elongation[v]);G&&v>=0&&c.push({pose:G,quality:d(v,G)})}}if(c.length===0){o&&this.release(e);return}c.sort((l,p)=>p.quality-l.quality);const m=c[0];if(!o){e.placement=this.spawn(m.pose,t);return}const f=c.filter(l=>this.distance(l.pose,o.position)<=r.radius*1.5).sort((l,p)=>p.quality-this.distance(p.pose,o.position)/(r.radius*16)-(l.quality-this.distance(l.pose,o.position)/(r.radius*16)))[0],_=this.index(o.position),x=f?.quality??(_>=0?r.quality[_]:0),w=m.quality>x*Gi,b=f&&m.quality<=f.quality*1.08?f:m,S=this.snapshot(o),A=this.distance(S,b.pose)<=r.radius*1.5;let B=t,E=!1;if(!this.fitsPose(t,e.text,S)&&(B=this.union(o.regionMask,t),this.remember(B),!this.fitsPose(B,e.text,S)&&A&&o.mask!==o.regionMask&&(B=this.union(o.mask,t),this.remember(B),E=!0),!this.fitsPose(B,e.text,S))){this.relight(e,b.pose,t);return}let h=this.planRoute(e.text,B,S,b.pose);if(!h&&B!==t&&A&&!E&&o.mask!==o.regionMask){const l=this.union(o.mask,t);if(this.remember(l),this.fitsPose(l,e.text,S)){const p=this.planRoute(e.text,l,S,b.pose);p&&(B=l,h=p)}}if(!h){(B!==t||w&&this.distance(S,b.pose)>r.radius*1.5)&&this.relight(e,b.pose,t);return}o.mask=B,o.regionMask=t,o.target=b.pose,o.route=h}poseAt(e,t,s,i,n,r,o){const a=this.index(s);if(a<0||!t[a])return null;let c=null,d=-1/0;const m=this.maxFont(t,e,s,0);if(m>=H){const f=Math.min(i,Math.max(H,m*.9));c={x:s.x,y:s.y,font:f,angle:0},d=f/i-Ut*o*_e(0,r)/te-.02*_e(0,n)/te}for(let f=At;f<=te;f+=At){const _=Math.min(i,ee*.9)/i-Et*f/te;if(d>=_)break;for(const x of[-f,f]){const w=this.maxFont(t,e,s,x);if(w<H)continue;const b=Math.min(i,Math.max(H,w*.9)),S=b/i-Et*f/te-Ut*o*_e(x,r)/te-.02*_e(x,n)/te;S>d&&(c={x:s.x,y:s.y,font:b,angle:x},d=S)}}return c}landscape(e,t,s,i,n){const r=this.width+1,o=r*(this.height+1),a=new Float64Array(o),c=new Float64Array(o),d=new Float64Array(o),m=new Float64Array(o),f=new Float64Array(o),_=new Float64Array(o),x=new Float32Array(e.length),w=new Float32Array(e.length),b=new Float32Array(e.length),S=new Float32Array(e.length),A=new Float32Array(e.length),B=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),E=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(i*3.5,Math.sqrt(n*B*B)*.33,B*3)),h=Math.max(1,Math.ceil(E*this.width/this.viewport.width)),l=Math.max(1,Math.ceil(E*this.height/this.viewport.height));for(let P=0;P<this.height;P+=1){let U=0,V=0,R=0,O=0,K=0,Y=0;for(let F=0;F<this.width;F+=1){const j=F+P*this.width,$=e[j]*(.85+.15*s[j])*W(t[j]*B/(i*2),0,1),q=this.cellPoint(j);U+=$,V+=$*q.x,R+=$*q.y,O+=$*q.x*q.x,K+=$*q.y*q.y,Y+=$*q.x*q.y;const k=(P+1)*r+F+1;a[k]=a[k-r]+U,c[k]=c[k-r]+V,d[k]=d[k-r]+R,m[k]=m[k-r]+O,f[k]=f[k-r]+K,_[k]=_[k-r]+Y}}const p=(P,U,V,R,O)=>P[O*r+R]-P[V*r+R]-P[O*r+U]+P[V*r+U],v=a[o-1],G=v>0?{x:c[o-1]/v,y:d[o-1]/v}:{x:this.viewport.width/2,y:this.viewport.height/2},I=[];for(let P=0;P<e.length;P+=1){if(!e[P])continue;const U=P%this.width,V=Math.floor(P/this.width),R=Math.max(0,U-h),O=Math.max(0,V-l),K=Math.min(this.width,U+h+1),Y=Math.min(this.height,V+l+1),F=p(a,R,O,K,Y);if(F<=0)continue;w[P]=p(c,R,O,K,Y)/F,b[P]=p(d,R,O,K,Y)/F;const j=Math.max(0,p(m,R,O,K,Y)/F-w[P]**2),$=Math.max(0,p(f,R,O,K,Y)/F-b[P]**2),q=p(_,R,O,K,Y)/F-w[P]*b[P],k=Math.hypot(j-$,2*q);S[P]=.5*Math.atan2(2*q,j-$)*180/Math.PI,A[P]=W(k/(j+$+1),0,1);const le=F/((h*2+1)*(l*2+1)),fe=W(t[P]*B/(i*2),0,1);x[P]=.7*le+.3*fe-.08*this.distance(this.cellPoint(P),G)/E,I.push(P)}return I.sort((P,U)=>x[U]-x[P]),{quality:x,centerX:w,centerY:b,axis:S,elongation:A,candidates:I,radius:E}}union(e,t){const s=new Uint8Array(t.length);for(let i=0;i<s.length;i+=1)s[i]=e[i]|t[i];return s}planRoute(e,t,s,i){if(this.posesFit(t,e,s,i))return[i];let n=Math.min(s.font,i.font);for(let r=0;r<9;r+=1){n=Math.max(H,n);for(const o of[...new Set([s.angle,i.angle,0])]){const a={...s,font:n},c={...a,angle:o},d={...i,font:n,angle:o},m={...i,font:n};if(!this.posesFit(t,e,s,a)||!this.posesFit(t,e,a,c)||!this.posesFit(t,e,d,m)||!this.posesFit(t,e,m,i))continue;const f=[];if(Math.abs(s.font-n)>.05&&f.push(a),Math.abs(s.angle-o)>.05&&f.push(c),this.posesFit(t,e,c,d))return f.push(d),Math.abs(i.angle-o)>.05&&f.push(m),f.push(i),f;const _=this.legalPath(e,t,c,d);if(!_)continue;let x=c,w=!0;for(let b=0;b<_.length;){let S=-1;for(let B=_.length-1;B>=b;B-=1){const h={...this.cellPoint(_[B]),font:n,angle:o};if(this.posesFit(t,e,x,h)){S=B;break}}if(S<0){w=!1;break}const A={...this.cellPoint(_[S]),font:n,angle:o};this.distance(x,A)>.5&&f.push(A),x=A,b=S+1}if(!(!w||!this.posesFit(t,e,x,d)))return this.distance(x,d)>.5&&f.push(d),Math.abs(i.angle-o)>.05&&f.push(m),f.push(i),f}if(n<=H)break;n=Math.max(H,n*.82)}return null}legalPath(e,t,s,i){const n=new Uint8Array(t.length),r=w=>{if(n[w]===0){const b={...this.cellPoint(w),font:s.font,angle:s.angle};n[w]=t[w]&&this.fitsPose(t,e,b)?1:2}return n[w]===1},o=w=>{const b=this.index(w);if(b<0)return-1;const S=b%this.width,A=Math.floor(b/this.width);for(let B=0;B<=3;B+=1)for(let E=-B;E<=B;E+=1)for(let h=-B;h<=B;h+=1){const l=S+h,p=A+E;if(l<0||p<0||l>=this.width||p>=this.height)continue;const v=l+p*this.width;if(r(v)&&this.posesFit(t,e,w,{...this.cellPoint(v),font:s.font,angle:s.angle}))return v}return-1},a=o(s),c=o(i);if(a<0||c<0)return null;const d=new Int32Array(t.length).fill(-1),m=new Int32Array(t.length);let f=0,_=0;for(m[_++]=a,d[a]=a;f<_&&d[c]<0;){const w=m[f++],b=w%this.width,S=Math.floor(w/this.width);for(const A of[b>0?w-1:-1,b+1<this.width?w+1:-1,S>0?w-this.width:-1,S+1<this.height?w+this.width:-1])A<0||d[A]>=0||!r(A)||(d[A]=w,m[_++]=A)}if(d[c]<0)return null;const x=[];for(let w=c;w!==a;w=d[w])x.push(w);return x.push(a),x.reverse(),x}glide(e,t,s){if(s<=0)return;const i=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,i)){const p=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,p<H){t.fontVelocity=0;return}const v=Ai(t.font,t.fontVelocity,Math.min(t.target.font,p),s);t.font=Math.max(p,Math.min(t.font,v.value)),t.fontVelocity=t.font<=p?0:v.velocity;return}for(;t.route.length>1&&this.distance(i,t.route[0])<.75&&Math.abs(i.font-t.route[0].font)<.15&&Math.abs(i.angle-t.route[0].angle)<.3;)t.route.shift();const n=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,i,n)&&this.distance(i,n)<.2&&Math.abs(i.font-n.font)<.05&&Math.abs(i.angle-n.angle)<.05){t.position={x:n.x,y:n.y},t.font=n.font,t.angle=n.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const o=!this.fitsPose(t.regionMask,e.text,i)?1:_i,a=Pi/o,c=Si/o,d=Bi/o,m=this.distance(i,n),f=m/a,_=Math.abs(n.font-i.font)/c,x=Math.abs(n.angle-i.angle)/d,w=Math.max(f,_,x);let b=0;w===f&&m>0?b=((n.x-i.x)*t.velocity.x+(n.y-i.y)*t.velocity.y)/m/a:w===_&&_>0?b=Math.sign(n.font-i.font)*t.fontVelocity/c:x>0&&(b=Math.sign(n.angle-i.angle)*t.angleVelocity/d),b=W(b,-1,1);const S=2/(vi*o),A=W(S*S*w-2*S*b,-Tt,Tt),B=W(b+A*s,-1,1),E=Math.min(w,(b+B)*s/2);let h=this.lerpPose(i,n,w>0?E/w:1);if(!(E<0?this.posesFit(t.mask,e.text,i,h):this.fitsPose(t.mask,e.text,h))){const p=this.longestLegal(e.text,t.mask,i,h);if(!p){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}h=p}const l=s>0?1/s:0;t.position={x:h.x,y:h.y},t.velocity={x:(h.x-i.x)*l,y:(h.y-i.y)*l},t.font=h.font,t.fontVelocity=(h.font-i.font)*l,t.angle=h.angle,t.angleVelocity=(h.angle-i.angle)*l}collect(e){const t=[];for(const n of this.tracks.values()){const r=n.placement?[n.placement,...n.ghosts]:n.ghosts;for(const o of r)o.opacity<.015||this.fitsPose(o.mask,n.text,this.snapshot(o))&&t.push({track:n,placement:o})}t.sort((n,r)=>r.track.area-n.track.area);const s=[],i=[];for(const n of t){const{track:r,placement:o}=n,a=s.some(d=>d.track!==r&&this.overlaps(r.text,this.snapshot(o),d.track.text,this.snapshot(d.placement)));o.collisionOpacity=ve(o.collisionOpacity,a?0:1,e,a?.3:.7),a||s.push(n);const c=o.opacity*o.collisionOpacity;c<.015||i.push({id:o.id,kind:r.kind,text:r.text,x:o.position.x,y:o.position.y,width:this.boxWidth(r.text,o.font,ae(o.font)),height:o.font*Qe,opacity:c,fontSize:o.font,letterSpacing:ae(o.font),angle:o.angle})}return i}relight(e,t,s){const i=e.placement;if(i){const n=this.snapshot(i);if(this.fitsPose(i.mask,e.text,n)&&this.overlaps(e.text,n,e.text,t)){i.target=n,i.route=[],i.velocity={x:0,y:0},i.fontVelocity=0,i.angleVelocity=0,i.regionMask=s;return}i.alive=!1,e.ghosts.push(i)}e.placement=this.spawn(t,s)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,s){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const i=1-Math.exp(-s/Mi),n=e.soft;for(let r=0;r<t.length;r+=1)n[r]+=(t[r]-n[r])*i}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const s of e.cells)t[s]=1;return t}components(e){const t=new Uint8Array(e.length),s=new Int32Array(e.length),i=[];for(let n=0;n<e.length;n+=1){if(t[n])continue;const r=i.length,o=e[n]<0?-1:1,a=[];let c=0,d=0,m=this.width,f=this.height,_=0,x=0;const w=[n];for(t[n]=1;w.length;){const B=w.pop();a.push(B),s[B]=r;const E=B%this.width,h=Math.floor(B/this.width);c+=E+.5,d+=h+.5,m=Math.min(m,E),f=Math.min(f,h),_=Math.max(_,E+1),x=Math.max(x,h+1);for(const l of this.neighbors(B))t[l]||(e[l]<0?-1:1)!==o||(t[l]=1,w.push(l))}const b=a.length/e.length;let S=null,A="hole";o>0?b>=gi?(S="continent",A="place"):b>=fi&&(S="island",A="place"):_-m>this.width*zt&&x-f>this.height*zt||m===0||f===0||_===this.width||x===this.height?A="sea":b>=di&&(S="lake",A="place"),i.push({sign:o,area:a.length,cells:a,kind:S,role:A,center:{x:c/a.length/this.width,y:d/a.length/this.height},bounds:{x0:m/this.width,y0:f/this.height,x1:_/this.width,y1:x/this.height}})}for(const n of i){if(n.kind!=="lake")continue;const r=new Map;let o=0;for(const a of n.cells)for(const c of this.neighbors(a)){const d=s[c];i[d].sign<0||(r.set(d,(r.get(d)??0)+1),o+=1)}(o===0||Math.max(...r.values())*5<o*4)&&(n.kind=null,n.role="sea")}return i}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),s=new Int32Array(e.length);let i=0;for(let n=0;n<e.length;n+=1){const r=n%this.width,o=Math.floor(n/this.width);(!e[n]||r===0||o===0||r===this.width-1||o===this.height-1)&&(t[n]=0,s[i++]=n)}for(let n=0;n<i;n+=1){const r=s[n],o=r%this.width,a=Math.floor(r/this.width);for(const c of[o>0?r-1:-1,o+1<this.width?r+1:-1,a>0?r-this.width:-1,a+1<this.height?r+this.width:-1])c<0||t[c]>=0||(t[c]=t[r]+1,s[i++]=c)}return t}prefix(e){const t=this.width+1,s=new Int32Array(t*(this.height+1));for(let i=0;i<this.height;i+=1){let n=0;for(let r=0;r<this.width;r+=1)n+=e[r+i*this.width],s[(i+1)*t+r+1]=s[i*t+r+1]+n}return s}maxFont(e,t,s,i){if(!this.fits(e,t,s,H,ae(H),i))return 0;if(this.fits(e,t,s,ee,ae(ee),i))return ee;let n=H,r=ee;for(let o=0;o<8;o+=1){const a=(n+r)/2;this.fits(e,t,s,a,ae(a),i)?n=a:r=a}return n}fitsPose(e,t,s){return Math.abs(s.angle)<=te&&this.fits(e,t,s,s.font,ae(s.font),s.angle)}posesFit(e,t,s,i){if(!this.fitsPose(e,t,s)||!this.fitsPose(e,t,i))return!1;const n=Math.max(1,Math.ceil(Math.max(this.distance(s,i)/4,Math.abs(s.font-i.font),Math.abs(s.angle-i.angle)/2)));for(let r=1;r<n;r+=1)if(!this.fitsPose(e,t,this.lerpPose(s,i,r/n)))return!1;return!0}longestLegal(e,t,s,i){if(!this.fitsPose(t,e,s))return null;let n=0,r=1;for(let o=0;o<8;o+=1){const a=(n+r)/2;this.posesFit(t,e,s,this.lerpPose(s,i,a))?n=a:r=a}return n<=0?null:this.lerpPose(s,i,n)}fits(e,t,s,i,n,r){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const o=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),a=Math.max(bi,o*1.25),c=this.boxWidth(t,i,n)/2+a,d=i*Qe/2+a,m=r*Math.PI/180,f=Math.cos(m),_=Math.sin(m),x=Math.abs(c*f)+Math.abs(d*_),w=Math.abs(c*_)+Math.abs(d*f);if(s.x-x<0||s.y-w<0||s.x+x>this.viewport.width||s.y+w>this.viewport.height)return!1;const b=this.prefixFields.get(e);if(b){const l=Math.floor((s.x-x)*this.width/this.viewport.width),p=Math.floor((s.y-w)*this.height/this.viewport.height),v=Math.min(this.width,Math.ceil((s.x+x)*this.width/this.viewport.width)),G=Math.min(this.height,Math.ceil((s.y+w)*this.height/this.viewport.height)),I=this.width+1;if(b[G*I+v]-b[p*I+v]-b[G*I+l]+b[p*I+l]===(v-l)*(G-p))return!0}const S=this.distanceFields.get(e),A=this.index(s);if(S&&A>=0){const l=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(S[A]-2)*l/Math.SQRT2)>=Math.hypot(c,d))return!0}const B=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),E=Math.max(2,Math.ceil(c*2/B)),h=Math.max(2,Math.ceil(d*2/B));for(let l=0;l<=h;l+=1){const p=-d+l*d*2/h;for(let v=0;v<=E;v+=1){const G=-c+v*c*2/E,I=Math.floor((s.x+G*f-p*_)*this.width/this.viewport.width),P=Math.floor((s.y+G*_+p*f)*this.height/this.viewport.height);if(I<0||P<0||I>=this.width||P>=this.height||!e[I+P*this.width])return!1}}return!0}overlaps(e,t,s,i){const n=(a,c)=>{const d=c.angle*Math.PI/180,m=this.boxWidth(a,c.font,ae(c.font))/2+7,f=c.font*Qe/2+7;return{x:Math.abs(m*Math.cos(d))+Math.abs(f*Math.sin(d)),y:Math.abs(m*Math.sin(d))+Math.abs(f*Math.cos(d))}},r=n(e,t),o=n(s,i);return Math.abs(t.x-i.x)<r.x+o.x&&Math.abs(t.y-i.y)<r.y+o.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const s=e.width/t.width,i=e.height/t.height,n=(s+i)/2;for(const r of this.tracks.values()){r.styleFont=W(r.styleFont*n,H,ee);const o=r.placement?[r.placement,...r.ghosts]:r.ghosts;for(const a of o)this.scalePlacement(a,s,i,n)}}this.viewport=e}scalePlacement(e,t,s,i){e.position={x:e.position.x*t,y:e.position.y*s},e.velocity={x:e.velocity.x*t,y:e.velocity.y*s},e.font=W(e.font*i,H,ee),e.fontVelocity*=i,e.target={x:e.target.x*t,y:e.target.y*s,font:W(e.target.font*i,H,ee),angle:e.target.angle},e.route=e.route.map(n=>({x:n.x*t,y:n.y*s,font:W(n.font*i,H,ee),angle:n.angle}))}regrid(e,t,s,i,n){const r=new e.constructor(i*n);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<n;o+=1)for(let a=0;a<i;a+=1)r[a+o*i]=e[Math.min(t-1,Math.floor((a+.5)*t/i))+Math.min(s-1,Math.floor((o+.5)*s/n))*t];return r}regridFloat(e,t,s,i,n){const r=new Float32Array(i*n);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<n;o+=1)for(let a=0;a<i;a+=1)r[a+o*i]=e[Math.min(t-1,Math.floor((a+.5)*t/i))+Math.min(s-1,Math.floor((o+.5)*s/n))*t];return r}neighbors(e){const t=e%this.width,s=Math.floor(e/this.width);return[(t+1)%this.width+s*this.width,(t-1+this.width)%this.width+s*this.width,t+(s+1)%this.height*this.width,t+(s-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,s){return{x:Ue(e.x,t.x,s),y:Ue(e.y,t.y,s),font:Ue(e.font,t.font,s),angle:Ue(e.angle,t.angle,s)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),s=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&s>=0&&s<this.height?t+s*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,s){const i=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(i?.58:.56)+s)+4;const n=i?`i:${e}`:e;let r=this.textMetrics.get(n);return r===void 0&&(this.measure.font=`${i?"italic ":""}500 100px ${Ii}`,this.measure.fontKerning="none",r=this.measure.measureText(e).width/100,this.textMetrics.set(n,r)),r*t+e.length*s+4}}const Je=2.4,Ti=12,Ri=(u,e,t,s,i,n)=>{if(s<=0)return u;const r=Math.max(0,t),o=r+s,c=(n-i)/Ti*(s-Je*(Math.exp(-r/Je)-Math.exp(-o/Je)));return Math.max(i,Math.min(n,u+e*c))},Ci=(u,e,t,s)=>({freeze:e>t?Math.max(0,Math.min(1,(e-u)/(e-t))):0,heat:e<s?Math.max(0,Math.min(1,(u-e)/(s-e))):0}),Rt=2/Math.log(1+Math.sqrt(2)),Li=30,Ze=40,Ni=45,T=u=>{const e=document.getElementById(u);if(!e)throw new Error(`Missing #${u}`);return e},X=T("field"),ce=T("scale"),de=T("temperature"),et=T("time-speed"),Te=T("brush-size"),Oi=T("scale-value"),Fi=T("temperature-value"),ki=T("time-speed-value"),Di=T("brush-size-value"),Vi=T("explanation"),Me=T("settings-toggle"),Re=T("settings-panel"),Ce=T("pause"),qi=T("restart"),Hi=T("clear-blue"),tt=T("rough"),it=T("smooth"),nt=T("scale-dock"),$i=T("scale-readout"),Le=T("freeze"),Ne=T("heat"),st=T("phase"),rt=T("magnetization"),ot=T("energy"),ke=T("fatal-error"),Xi=T("place-labels"),Yi=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function Wi(){const u=await Ht();if(!u){ke.hidden=!1,ke.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new Yt(u.device,u.format,X);let t=Number(de.value),s=t,i=Number(ce.value),n=i,r=Number(et.value),o=Number(Te.value),a=!1,c=!0,d=!1,m=!1,f=!1,_=0,x=0,w=null,b=!0,S=0,A=performance.now(),B=0,E=!1,h=0;const l=new Map;let p=!1,v=0,G=i,I=!1,P=!1,U=0,V=0,R=!1,O=0;const K=new Ui,Y=new Map,F=new Map,j=new Map,$=new Map;let q=null,k=0;const le=new Map,fe=new Set,qe=new Set,He=new Set,$e=new Set,ht=Rt+.2,Pe=Number(ce.min),re=Number(ce.max),ct=Number(de.min),dt=Number(de.max),Ot=.75;let ge=0,Xe=0;const Ft=(re-Pe)/2.2,ft=Math.ceil((Ze-1)/2),kt=()=>{const g=Math.max(1,window.innerWidth),y=Math.max(1,window.innerHeight),z=g<=720?Math.min(window.devicePixelRatio||1,2):1,L=Math.min(u.device.limits.maxTextureDimension2D/g,u.device.limits.maxTextureDimension2D/y),M=Math.sqrt(Number(u.device.limits.maxStorageBufferBindingSize)/4/(g*y)),Q=Math.max(.25,Math.min(z,L,M)),ie=Math.max(1,Math.round(g*Q)),ue=Math.max(1,Math.round(y*Q));return{density:ie/g,width:ie,height:ue}},Ye=g=>{const y=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**g-1)*y))},Se=()=>Ye(i)*2+1,Dt=()=>{const g=Math.min(e.width,e.height)/65.64;if(g<=0)return re;let y=Math.log2(1+Math.max(0,(ft-.5)/g));for(y=Math.min(re,Math.max(Pe,y));y<re&&Ye(y)<ft;)y=Math.min(re,y+.01);return y},pe=()=>{const g=Se(),y=g===1?"1 spin":`${g} × ${g}`;ce.value=i.toFixed(2),nt.value=i.toFixed(2),Oi.textContent=y,$i.textContent=y,Vi.textContent=Yi[Math.min(3,Math.floor(i+.25))],tt.setAttribute("aria-label",`Rough, observation scale ${i.toFixed(2)}`),it.setAttribute("aria-label",`Smooth, observation scale ${i.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-i/3)**2).toFixed(3))},me=()=>{de.value=t.toFixed(2),Fi.textContent=`T = ${t.toFixed(2)}`;const g=Ci(t,s,ct,dt);Le.style.setProperty("--paddle-progress",g.freeze.toFixed(4)),Ne.style.setProperty("--paddle-progress",g.heat.toFixed(4)),Le.setAttribute("aria-label",`Freeze, current temperature ${t.toFixed(2)}`),Ne.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const y=t-Rt;y<-.2?st.textContent="ordered":y>.2?st.textContent="disordered":st.textContent="critical"},gt=()=>{const g=Number.isInteger(r)?0:1;ki.textContent=`${r.toFixed(g)}×`},We=()=>{Te.value=String(o),Di.textContent=`${o} px`},Vt=()=>({active:f&&!p&&!P,painting:d,forceHot:m,x:_,y:x,radius:o/2}),be=()=>{const g=Se(),y=(g-1)/2,z=g===1?0:.14*(1-i/3)**2;e.draw(i,y,z,U,Vt()),b=!1},pt=()=>{V+=1,K.reset(),q=null,F.clear(),j.clear(),$.clear(),le.clear(),mt([],0)},mt=(g,y)=>{const z=new Set,L={width:X.clientWidth,height:X.clientHeight};for(const M of g){if(z.add(M.id),q&&le.get(M.id)!==k){const C=Qt(M,q,L);F.set(M.id,Jt(F.get(M.id),C)),le.set(M.id,k)}const Q=ei(j.get(M.id),F.get(M.id)?.mode??"dark",y);j.set(M.id,Q);const ie=ti(Q),ue=jt(M.kind,Q.from,Q.to,ie.blend),ye=Zt($.get(M.id),F.get(M.id)?.opacity??1,y);$.set(M.id,ye);const oe=Ei(M);let Z=Y.get(M.id);for(Z||(Z=[],Y.set(M.id,Z));Z.length<oe.length;){const C=document.createElement("span");C.className="place-label",Xi.append(C),Z.push(C)}for(;Z.length>oe.length;)Z.pop()?.remove();for(let C=0;C<oe.length;C+=1){const D=Z[C],vt=oe[C];D.dataset.kind!==M.kind&&(D.dataset.kind=M.kind),D.textContent!==M.text&&(D.textContent=M.text),D.style.color=ue,D.style.opacity=(M.opacity*ye).toFixed(3),D.style.fontSize=`${M.fontSize.toFixed(2)}px`,D.style.letterSpacing=`${M.letterSpacing.toFixed(2)}px`,D.style.transform=`translate(${vt.x.toFixed(2)}px, ${vt.y.toFixed(2)}px) rotate(${M.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[M,Q]of Y)if(!z.has(M)){for(const ie of Q)ie.remove();Y.delete(M),F.delete(M),j.delete(M),$.delete(M),le.delete(M)}},bt=(g=!0)=>{const y=kt();if(e.resize(y.width,y.height,y.density,g),!g){const z=Math.min(e.width,e.height)/65.64,L=(Ni-1)/2;i=Math.max(Pe,Math.min(re,Math.log2(1+L/z))),n=i}pe(),b=!0,be(),h+=1,V+=1,q=null},Be=g=>{const y=X.getBoundingClientRect(),z=(g.clientX-y.left)/y.width,L=(g.clientY-y.top)/y.height;return z<0||z>=1||L<0||L>=1?null:(_=g.clientX-y.left,x=g.clientY-y.top,{x:z*e.width,y:L*e.height})},Ge=(g,y)=>{const z=Be(g);if(!z){w=null;return}const L=w??z;e.paintSegment(L.x,L.y,z.x,z.y,o*e.density/2,y,m),w=z,b=!0},Ke=g=>{d=!0,w=null,Ge(g,!0),m=!1},xt=()=>{const g=[...l.values()];return g.length<2?0:Math.hypot(g[1].x-g[0].x,g[1].y-g[0].y)},xe=()=>{if(E)return;E=!0;const g=h;e.readStats().then(y=>{if(g!==h)return;rt.textContent=y.magnetization.toFixed(3),ot.textContent=y.energy.toFixed(3);const z=y.signedMagnetization===-1;!d&&m!==z&&(m=z,b=!0)}).catch(y=>{console.warn("Could not read Ising statistics.",y)}).finally(()=>{E=!1})},yt=g=>{i=g,n=i,pe(),b=!0};ce.addEventListener("input",()=>yt(Number(ce.value))),nt.addEventListener("input",()=>yt(Number(nt.value))),de.addEventListener("input",()=>{s=Number(de.value),t=s,ge=0,me()});const Ie=(g,y)=>{const z=()=>{g.setAttribute("aria-pressed",String(y.size>0))},L=M=>{y.delete(`pointer:${M.pointerId}`),g.hasPointerCapture(M.pointerId)&&g.releasePointerCapture(M.pointerId),z()};g.addEventListener("pointerdown",M=>{M.pointerType==="mouse"&&M.button!==0||(M.preventDefault(),g.setPointerCapture(M.pointerId),y.add(`pointer:${M.pointerId}`),z())}),g.addEventListener("pointerup",L),g.addEventListener("pointercancel",L),g.addEventListener("lostpointercapture",M=>{y.delete(`pointer:${M.pointerId}`),z()}),g.addEventListener("keydown",M=>{M.code!=="Space"&&M.code!=="Enter"||(M.preventDefault(),y.add(`key:${M.code}`),z())}),g.addEventListener("keyup",M=>{M.code!=="Space"&&M.code!=="Enter"||(M.preventDefault(),y.delete(`key:${M.code}`),z())}),g.addEventListener("blur",()=>{for(const M of y)M.startsWith("key:")&&y.delete(M);z()})};Ie(tt,fe),Ie(it,qe),Ie(Le,He),Ie(Ne,$e),et.addEventListener("input",()=>{r=Number(et.value),gt()}),Te.addEventListener("input",()=>{o=Number(Te.value),We(),b=!0}),window.addEventListener("keydown",g=>{g.code!=="BracketLeft"&&g.code!=="BracketRight"||(g.preventDefault(),o=Math.max(4,Math.min(100,o+(g.code==="BracketLeft"?-4:4))),We(),b=!0)});const je=g=>{c=g,Re.classList.toggle("is-closed",!c),Re.setAttribute("aria-hidden",String(!c)),Me.setAttribute("aria-expanded",String(c)),Me.setAttribute("aria-label",c?"Close settings":"Open settings")};Me.addEventListener("click",()=>je(!c)),document.addEventListener("pointerdown",g=>{const y=g.target;!c||!(y instanceof Node)||Re.contains(y)||Me.contains(y)||je(!1)},{capture:!0}),document.addEventListener("click",g=>{const y=g.target;!c||!(y instanceof Node)||Me.contains(y)||(!Re.contains(y)||y instanceof Element&&y.closest("button"))&&je(!1)}),Ce.addEventListener("click",()=>{a=!a;const g=a?"Resume simulation":"Pause simulation";Ce.setAttribute("aria-pressed",String(a)),Ce.setAttribute("aria-label",g),Ce.title=g,S=0}),qi.addEventListener("click",()=>{e.randomize(),m=!1,S=0,h+=1,pt(),rt.textContent="0.000",ot.textContent="0.000",b=!0,be(),xe()}),Hi.addEventListener("click",()=>{e.clearBlue(),m=!0,S=0,h+=1,pt(),rt.textContent="1.000",ot.textContent="-2.000",b=!0,be(),xe()}),X.addEventListener("pointerdown",g=>{if(Be(g)){if(X.setPointerCapture(g.pointerId),f=!0,g.pointerType==="touch"){l.set(g.pointerId,{x:g.clientX,y:g.clientY}),l.size===1?(I=!0,P=!1):l.size===2&&(d=!1,w=null,I=!1,P=!0,p=!0,v=xt(),G=n),b=!0;return}Ke(g)}}),X.addEventListener("pointermove",g=>{if(Be(g),f=!0,b=!0,g.pointerType==="touch"){if(!l.has(g.pointerId))return;if(l.set(g.pointerId,{x:g.clientX,y:g.clientY}),p&&l.size>=2){const y=xt();v>0&&y>0&&(n=Math.max(0,Math.min(3,G-Math.log2(y/v)*.9)));return}if(l.size===1&&!P){if(I)Ke(g),I=!1;else if(d)for(const y of g.getCoalescedEvents())Ge(y,!1)}return}if(d){const y=g.getCoalescedEvents();if(y.length===0)Ge(g,!1);else for(const z of y)Ge(z,!1)}});const qt=g=>{g.pointerType==="touch"&&(I&&!P&&Ke(g),l.delete(g.pointerId),l.size<2&&(p=!1),l.size===0&&(I=!1,P=!1,f=!1)),d=!1,w=null,X.hasPointerCapture(g.pointerId)&&X.releasePointerCapture(g.pointerId),b=!0,xe()};X.addEventListener("pointerup",qt),X.addEventListener("pointercancel",g=>{l.delete(g.pointerId),d=!1,f=!1,w=null,I=!1,p=!1,b=!0}),X.addEventListener("pointerenter",()=>{f=!0,b=!0}),X.addEventListener("pointerleave",()=>{d||(f=!1,b=!0)}),X.addEventListener("wheel",g=>{g.preventDefault();const y=Math.max(-120,Math.min(120,g.deltaY));n=Math.max(0,Math.min(3,n+y*.00125)),Be(g),f=!0},{passive:!1}),window.addEventListener("blur",()=>{d=!1,f=!1,w=null,l.clear(),p=!1,I=!1,fe.clear(),qe.clear(),He.clear(),$e.clear(),ge=0,Xe=0,tt.setAttribute("aria-pressed","false"),it.setAttribute("aria-pressed","false"),Le.setAttribute("aria-pressed","false"),Ne.setAttribute("aria-pressed","false"),b=!0}),window.addEventListener("resize",()=>bt(!0)),bt(!1),e.step(t,40),me(),gt(),We(),b=!0,be(),xe();const wt=g=>{const y=Math.max(0,(g-A)/1e3),z=Math.min(.1,y);A=g;const L=+(qe.size>0)-+(fe.size>0);if(L!==0){const C=L<0?Pe:re,D=L*Ft*z;i=L<0?Math.max(C,i+D):Math.min(C,i+D),n=i,pe(),b=!0}else{const C=n-i;Math.abs(C)>5e-4?(i+=C*(1-Math.exp(-z*10)),pe(),b=!0):i!==n&&(i=n,pe(),b=!0)}const M=+($e.size>0)-+(He.size>0);if(M!==Xe&&(ge=0,Xe=M),M!==0)t=Ri(t,M,ge,z,ct,dt),ge+=z,me();else{const C=s-t;Math.abs(C)>5e-4?(t+=C*(1-Math.exp(-z/Ot)),me()):t!==s&&(t=s,me())}if(!a){S+=z*Li*r;const C=Math.min(8,Math.floor(S));C>0&&(S-=C,e.step(t,C),b=!0)}const Q=Se()>=Ze?1:0,ie=Q-U;Math.abs(ie)>.001?(U+=ie*(1-Math.exp(-z*7)),b=!0):U!==Q&&(U=Q,b=!0);const ue=Se()>=Ze?i:Dt(),ye=t>ht?"chaos":"map",oe=X.getBoundingClientRect(),Z=K.advance(Math.min(.5,y),ye,{width:oe.width,height:oe.height},M>0);if(mt(Z,y),b&&be(),!R&&ye==="map"&&g-O>280){O=g,R=!0;const C=V;e.readRegionSample(Ye(ue),ue).then(D=>{C!==V||!D||t>ht||(q=D,k+=1,K.ingest(D,t))}).catch(D=>{console.warn("Could not read Ising regions.",D)}).finally(()=>{R=!1})}g-B>750&&(B=g,xe()),requestAnimationFrame(wt)};requestAnimationFrame(wt)}Wi().catch(u=>{console.error(u),ke.hidden=!1,ke.textContent=u instanceof Error?u.message:"Could not start the WebGPU simulation."});
