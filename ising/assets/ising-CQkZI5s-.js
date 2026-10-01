(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();async function At(){try{if(!navigator.gpu)return null;const h=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!h)return null;const e=await h.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(h){return console.error("WebGPU initialization failed.",h),null}}const Tt=`struct SimParams {
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
`,T=(h,e)=>Math.ceil(h/e),Pe=112,Be=128,Ct=(h,e)=>h>=e?{width:Pe,height:Math.max(1,Math.round(Pe*e/h))}:{width:Math.max(1,Math.round(Pe*h/e)),height:Pe};class Rt{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,s){this.device=e,this.format=t,this.canvas=s;const i=s.getContext("webgpu");if(!i)throw new Error("Could not create a WebGPU canvas context.");this.context=i,this.context.configure({device:e,format:t,alphaMode:"opaque"});const n=e.createShaderModule({label:"Ising shaders",code:Tt});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:n,entryPoint:"fullscreen_vertex"},fragment:{module:n,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising label blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:Be*Be*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:Be*Be*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,s,i=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=s;return}const n=this.width,r=this.height,o=this.spinBuffers,u=this.fieldTexture,c=this.blurTextures,f=this.labelBlurTextures,m=this.statsOutput,p=this.statsReadback,M=o?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=s,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),i&&M){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,n,r);const v=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:M}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),l=this.device.createCommandEncoder({label:"Resize Ising grid"}),a=l.beginComputePass();a.setPipeline(this.pipelines.resize),a.setBindGroup(0,v),a.dispatchWorkgroups(T(e,8),T(t,8)),a.end(),this.device.queue.submit([l.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...m?[m]:[]],readback:p??void 0,textures:[u,...c??[],...f??[]].filter(v=>!!v)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let s=0;s<t;s+=1){const i=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,i);const n=this.device.createCommandEncoder({label:"Advance Ising state"}),r=n.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(T(this.width,8),T(this.height,8)),r.end(),this.device.queue.submit([n.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,s,i,n,r,o){const u=Math.floor(Math.min(e,s)-n),c=Math.floor(Math.min(t,i)-n),f=Math.ceil(Math.max(e,s)+n),m=Math.ceil(Math.max(t,i)+n),p=f-u+1,M=m-c+1;this.writeBrushParams(u,c,p,M,e,t,s,i,n,o);const v=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const a=v.beginComputePass();a.setPipeline(this.pipelines.select),a.setBindGroup(0,this.selectGroups[this.currentIndex]),a.dispatchWorkgroups(1),a.end()}const l=v.beginComputePass();l.setPipeline(this.pipelines.paint),l.setBindGroup(0,this.paintGroups[this.currentIndex]),l.dispatchWorkgroups(T(p,8),T(M,8)),l.end(),this.device.queue.submit([v.finish()]),this.fieldDirty=!0}draw(e,t,s,i,n){if(!this.renderGroup||!this.observationReady())return;const r=this.secondaryObservationRadius(t,e),o=this.fieldDirty||t!==this.lastBlurRadius||r!==this.lastSecondaryRadius,u=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const f=u.beginComputePass();f.setPipeline(this.pipelines.field),f.setBindGroup(0,this.fieldGroups[this.currentIndex]),f.dispatchWorkgroups(T(this.width,8),T(this.height,8)),f.end(),this.fieldDirty=!1}o&&this.appendObservationBlur(u,t,r,"display"),this.writeRenderParams(e,t,s,i,n);const c=u.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});c.setPipeline(this.pipelines.render),c.setBindGroup(0,this.renderGroup),c.draw(3),c.end(),this.device.queue.submit([u.finish()])}async readRegionSample(e,t){const s=this.regionGroup;if(!s||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const i=Ct(this.width,this.height),n=i.width*i.height;if(n*4>this.regionStorage.size)return null;const r=this.secondaryObservationRadius(e,t),o=e===this.lastBlurRadius&&r===this.lastSecondaryRadius,u=o?s:this.labelRegionGroup;if(!u)return null;const c=this.device.createCommandEncoder({label:"Read Ising regions"});o||this.appendObservationBlur(c,e,r,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([i.width,i.height,0,0]));const f=c.beginComputePass();f.setPipeline(this.pipelines.regions),f.setBindGroup(0,u),f.dispatchWorkgroups(T(i.width,8),T(i.height,8)),f.end(),c.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,n*4),this.device.queue.submit([c.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const m=new Int32Array(this.regionReadback.getMappedRange(),0,n),p=new Int8Array(n),M=new Float32Array(n);for(let v=0;v<n;v+=1)p[v]=m[v]<0?-1:1,M[v]=(Math.abs(m[v])-1)/65534;return{width:i.width,height:i.height,signs:p,luminance:M}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,s=this.statsGroups[this.currentIndex];if(!e||!t||!s)return{energy:0,magnetization:0,signedMagnetization:0};const i=T(this.width,16),n=T(this.height,16),r=new Uint32Array([this.width,this.height,i,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(e);const u=o.beginComputePass();u.setPipeline(this.pipelines.stats),u.setBindGroup(0,s),u.dispatchWorkgroups(i,n),u.end(),o.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([o.finish()]),await t.mapAsync(GPUMapMode.READ);const c=new Int32Array(t.getMappedRange()),f=c[0],m=c[1];t.unmap();const p=this.width*this.height;return{magnetization:Math.abs(f/p),signedMagnetization:f/p,energy:m/p}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}))}writeSimParams(e,t,s,i,n=0,r=0){const o=new ArrayBuffer(32),u=new DataView(o);u.setUint32(0,this.width,!0),u.setUint32(4,this.height,!0),u.setUint32(8,e,!0),u.setUint32(12,t,!0),u.setFloat32(16,s,!0),u.setUint32(20,i,!0),u.setUint32(24,n,!0),u.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(e,t,s,i,n,r,o,u,c,f){const m=new ArrayBuffer(64),p=new DataView(m);p.setUint32(0,this.width,!0),p.setUint32(4,this.height,!0),p.setInt32(8,e,!0),p.setInt32(12,t,!0),p.setUint32(16,s,!0),p.setUint32(20,i,!0),p.setUint32(24,f?1:0,!0),p.setFloat32(32,n,!0),p.setFloat32(36,r,!0),p.setFloat32(40,o,!0),p.setFloat32(44,u,!0),p.setFloat32(48,c,!0),this.device.queue.writeBuffer(this.brushUniform,0,m)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,s,i){const n=i==="display",r=n?this.blurUniforms:this.labelBlurUniforms,o=n?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,u=n?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,c=n?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,f=n?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!u||!c||!f||o.length===0)return;this.writeBlurParams(r[0],t),this.writeBlurParams(r[1],s);const m=e.beginComputePass({label:"Horizontal Ising observation blur"});m.setPipeline(this.pipelines.blurSpinsHorizontal),m.setBindGroup(0,o[this.currentIndex]),m.dispatchWorkgroups(T(this.height,64)),m.end();const p=e.beginComputePass({label:"Vertical Ising observation blur"});if(p.setPipeline(this.pipelines.blurTextureVertical),p.setBindGroup(0,u),p.dispatchWorkgroups(T(this.width,64)),p.end(),s>0){const M=e.beginComputePass({label:"Secondary horizontal Ising blur"});M.setPipeline(this.pipelines.blurTextureHorizontal),M.setBindGroup(0,c),M.dispatchWorkgroups(T(this.height,64)),M.end();const v=e.beginComputePass({label:"Secondary vertical Ising blur"});v.setPipeline(this.pipelines.blurTextureVertical),v.setBindGroup(0,f),v.dispatchWorkgroups(T(this.width,64)),v.end()}n&&(this.lastBlurRadius=t,this.lastSecondaryRadius=s)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,s,i,n){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=t,r[5]=e,r[6]=s,r[7]=n.active?1:0,r[8]=n.x*this.density,r[9]=n.y*this.density,r[10]=n.radius*this.density,r[11]=n.painting?1:0,r[12]=n.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),r[14]=i,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const s of e.buffers)s.destroy();for(const s of e.textures??[])s.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const kt={land:{dark:"#050302",light:"#ffd5a6"},water:{dark:"#06132e",light:"#c4eaff"}},Bt=(h,e,t)=>Math.max(e,Math.min(t,h)),Lt=h=>h<=.04045?h/12.92:((h+.055)/1.055)**2.4,ft=h=>{const e=[1,3,5].map(t=>Lt(parseInt(h.slice(t,t+2),16)/255));return e[0]*.2126+e[1]*.7152+e[2]*.0722},pt=(h,e)=>(Math.max(h,e)+.05)/(Math.min(h,e)+.05),Ae=(h,e)=>kt[h==="lake"?"water":"land"][e],Ot=(h,e,t,s)=>{const i=Ae(h,e),n=Ae(h,t);return`rgb(${[1,3,5].map(o=>{const u=parseInt(i.slice(o,o+2),16),c=parseInt(n.slice(o,o+2),16);return(u+(c-u)*s).toFixed(2)}).join(", ")})`},Ft=(h,e,t)=>{const s=h.angle*Math.PI/180,i=Math.cos(s),n=Math.sin(s),r=ft(Ae(h.kind,"dark")),o=ft(Ae(h.kind,"light")),u=[],c=[];for(let m=-1;m<=1;m+=1)for(let p=-4;p<=4;p+=1){const M=p*h.width*.105,v=m*h.height*.28,l=h.x+M*i-v*n,a=h.y+M*n+v*i,g=Math.max(0,Math.min(e.width-1,Math.floor(l/t.width*e.width))),y=Math.max(0,Math.min(e.height-1,Math.floor(a/t.height*e.height))),_=e.luminance[y*e.width+g];u.push(pt(_,r)),c.push(pt(_,o))}u.sort((m,p)=>m-p),c.sort((m,p)=>m-p);const f=Math.floor((u.length-1)*.25);return{dark:u[f],light:c[f]}},Nt=(h,e)=>{const t=h?h.darkContrast*.55+e.dark*.45:e.dark,s=h?h.lightContrast*.55+e.light*.45:e.light;let i=h?.mode??(t>=2.5||s<4.5?"dark":"light");const n=i==="dark"?s:t,o=(i==="dark"?t:s)<(i==="dark"?2.5:3)&&n>4.5?(h?.weakSamples??0)+1:0,u=o>=5;return u&&(i=i==="dark"?"light":"dark"),{mode:i,darkContrast:t,lightContrast:s,weakSamples:u?0:o,opacity:i==="dark"?Bt(.82+(5-t)*.06,.82,1):1}},Vt=(h,e,t)=>h===void 0?e:h+(e-h)*(1-Math.exp(-Bt(t,0,.5)/.8)),Dt=(h,e,t)=>{if(!h)return{from:e,to:e,progress:1,velocity:0};let s=h;if(s.from===s.to){if(e===s.to)return s;s={from:s.to,to:e,progress:0,velocity:0}}const i=e===s.to?1:0,n=Math.max(0,Math.min(t,1/60)),r=5,o=s.progress-i,u=s.velocity+r*o,c=Math.exp(-r*n),f=Math.max(0,Math.min(1,i+(o+u*n)*c)),m=(s.velocity-r*u*n)*c;return Math.abs(f-i)<.001&&Math.abs(m)<.02?{from:e,to:e,progress:1,velocity:0}:{...s,progress:f,velocity:m}},qt=h=>h.from===h.to?{blend:1,opacity:1}:{blend:h.progress*h.progress*(3-2*h.progress),opacity:1},gt=["v","l","m","n","s","c","r","t","p","d","f","g","b","pr","tr","cl","cr","fl","fr","gl","gr","pl","br","dr","st","qu"],Xt=["l","r","n","m","t","s","c","d","v","p","g","b","f","br","cr","dr","gr","pr","tr","st"],$t=["a","e","i","o","u"],mt=["a","e","i","o","u","a","e","i","o","ae","au","oe"],Yt=["n","r","s","l","m","t"],bt=["a","us","um","is","or"],me=(h,e,t=0)=>e[(Math.floor(h()*e.length)+t)%e.length],Ht=(h,e)=>{for(let t=0;t<512;t+=1){const s=h()<.82||t>=24?2:3,i=[];let n=!1;for(let o=0;o<s;o+=1){const u=me(h,o===0?gt:Xt,o===0?t:o===1?Math.floor(t/gt.length):0);let c=me(h,mt);c.length>1&&n&&(c=me(h,$t)),u==="qu"&&(c==="u"||c==="au"||c==="oe")&&(c="a"),o>0&&`${u}${c}`===i[o-1]&&(c=me(h,mt,1)),n||=c.length>1,i.push(`${u}${c}`)}const r=`${i.join("")}${me(h,Yt)}`;if(!(r.length>8)&&!e?.has(r))return r}throw new Error("Could not find an unused place name")},Wt=(h,e)=>{const t=`${e.charAt(0).toUpperCase()}${e.slice(1)}`;if(h==="continent")return`${t}ia`;const s=bt[[...e].reduce((i,n)=>i+n.charCodeAt(0),0)%bt.length];return`${t}${s}`},xt=.7,qe=5,Kt=.0035,jt=.008,Qt=.055,yt=1/4,Jt=48,Xe=1.35,Zt=.16,ei=9,D=8,Z=64,ee=80,vt=20,wt=.12,_t=.22,ti=.05,ii=.12,ni=.85,si=.25,ri=3,Mt=8,oi=1.8,ai=140,li=28,ui=160,ci=2,hi='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',Q=(h,e,t)=>Math.max(e,Math.min(t,h)),be=(h,e,t,s)=>h+(e-h)*(1-Math.exp(-t/s)),$e=h=>h==="island"||h==="continent",ne=h=>h*Zt,Se=(h,e,t)=>h+(e-h)*t,xe=(h,e)=>{const t=Math.abs(h-e)%180;return Math.min(t,180-t)},di=(h,e,t,s)=>{const i=2/ni,n=(t-h)*i*i-2*i*e,r=e+n*s;return{value:h+r*s,velocity:r}},fi=h=>[{x:h.x,y:h.y}];class pi{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1}advance(e,t,s){this.applyViewport(s);const i=Q(e,0,.5);t!=="map"&&(this.synced=!1);for(const r of this.tracks.values()){const o=t==="map"&&r.confirmed&&r.missing===0;r.agreement=be(r.agreement,o?1:0,i,xt),r.stability=be(r.stability,o?r.agreement:0,i,xt);const u=r.placement;u?.alive&&r.present&&this.glide(r,u,i);const c=u?[u,...r.ghosts]:r.ghosts;for(const f of c){const m=t==="map"&&this.synced&&r.present&&r.confirmed&&r.missing<.75&&f.alive;f.opacity=be(f.opacity,m?r.stability:0,i,m?.25:.45)}u&&!u.alive&&u.opacity<.02&&(r.placement=null),r.ghosts=r.ghosts.filter(f=>f.opacity>=.02)}const n=this.collect(i);return t==="chaos"&&n.length===0&&this.reset(),n}ingest(e){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const t=performance.now()/1e3,s=this.lastIngest<0?0:Math.min(2,t-this.lastIngest);this.lastIngest=t;for(const l of this.tracks.values())l.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const l=[];for(const a of this.tracks.values()){a.soft&&(a.soft=this.regridFloat(a.soft,this.width,this.height,e.width,e.height)),a.lastMask&&(a.lastMask=this.regrid(a.lastMask,this.width,this.height,e.width,e.height));const g=a.placement?[a.placement,...a.ghosts]:a.ghosts;for(const y of g){const _=y.mask===y.regionMask;y.mask=this.regrid(y.mask,this.width,this.height,e.width,e.height),y.regionMask=_?y.mask:this.regrid(y.regionMask,this.width,this.height,e.width,e.height),l.push(y.mask),_||l.push(y.regionMask)}}this.width=e.width,this.height=e.height;for(const a of l)this.remember(a)}const n=this.components(e.signs).filter(l=>l.role==="place").sort((l,a)=>a.area-l.area).slice(0,Jt),r=[],o=(l,a,g)=>{const y=a.placement?.alive?{x:a.placement.position.x/this.viewport.width,y:a.placement.position.y/this.viewport.height}:a.center;return{region:l,track:a,overlap:g,distance:this.distance(y,n[l].center)}};for(let l=0;l<n.length;l+=1){const a=new Map;for(const g of n[l].cells){const y=this.owners[g];y&&a.set(y,(a.get(y)??0)+1)}for(const[g,y]of a){const _=this.tracks.get(g);!_||$e(_.kind)!==n[l].sign>0||y<=0||r.push(o(l,_,y))}}const u=new Set,c=new Set,f=[],m=l=>{l.sort((a,g)=>a.track.id-g.track.id||a.distance-g.distance||g.overlap-a.overlap);for(const a of l)u.has(a.region)||c.has(a.track.id)||(u.add(a.region),c.add(a.track.id),f.push({track:a.track,region:n[a.region],overlap:a.overlap}))};m(r);const p=[];for(const l of this.tracks.values())if(!(c.has(l.id)||!l.lastMask||l.missing>=qe))for(let a=0;a<n.length;a+=1){if(u.has(a)||$e(l.kind)!==n[a].sign>0)continue;const g=n[a].bounds;if(l.bounds.x1<=g.x0||g.x1<=l.bounds.x0||l.bounds.y1<=g.y0||g.y1<=l.bounds.y0)continue;let y=0;for(const _ of n[a].cells)y+=l.lastMask[_]??0;y>0&&p.push(o(a,l,y))}m(p);const M=[];for(const l of this.tracks.values())if(!(c.has(l.id)||l.missing>=qe))for(let a=0;a<n.length;a+=1){const g=n[a];if(u.has(a)||$e(l.kind)!==g.sign>0)continue;const y=Math.min(l.area,g.area)/Math.max(l.area,g.area),_=Math.max(0,l.bounds.x0-g.bounds.x1,g.bounds.x0-l.bounds.x1)*this.width,I=Math.max(0,l.bounds.y0-g.bounds.y1,g.bounds.y0-l.bounds.y1)*this.height,B=Math.hypot((l.center.x-g.center.x)*this.width,(l.center.y-g.center.y)*this.height),x=Math.sqrt(Math.min(l.area,g.area)/Math.PI);y>=.5&&Math.hypot(_,I)<=1.5&&B<=Math.max(3,x*1.25)&&M.push(o(a,l,0))}m(M);for(let l=0;l<n.length;l+=1){if(u.has(l))continue;const a=n[l];if(!a.kind)continue;const g=Ht(Math.random,this.usedStems);this.usedStems.add(g);const y={id:this.nextTrackId++,stem:g,kind:a.kind,text:Wt(a.kind,g),area:a.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:a.center,bounds:a.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(y.id,y),f.push({track:y,region:a,overlap:0})}const v=new Uint16Array(e.signs.length);for(const{track:l,region:a,overlap:g}of f){if(l.present=!0,g>0){const y=g/Math.min(l.area,a.area);l.agreement=Math.min(l.agreement,.65+.35*y)}l.area=a.area,l.center=a.center,l.bounds=a.bounds,l.missing=0,l.confirmed=!0;for(const y of a.cells)v[y]=l.id}this.owners=v;for(const l of[...this.tracks.values()])f.some(a=>a.track===l)||(l.missing+=s,l.confirmed=!1,l.missing>qe&&(this.tracks.delete(l.id),this.usedStems.delete(l.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}for(const{track:l,region:a}of f){const g=this.allowedMask(a);l.lastMask=g,this.remember(g),this.smooth(l,g,s),this.aim(l,g,s)}this.synced=!0}aim(e,t,s){const i=this.viewport.width*this.viewport.height/t.length,n=Q(Math.sqrt(e.area*i/(Math.max(4,e.text.length)*3.2)),D,Z);e.styleFont=e.styleFont===0?n:be(e.styleFont,n,s,2.5);const r=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),o=e.placement?.alive?e.placement:null,u=o?.angle??0,c=[],f=(x,P)=>Math.max(.01,r.quality[x]+.12*P.font/e.styleFont-ti*Math.abs(P.angle)/ee-ii*r.elongation[x]*xe(P.angle,r.axis[x])/ee);for(const x of r.candidates){const P=this.cellPoint(x);if(c.some(O=>this.distance(O.pose,P)<r.radius*.55))continue;const z=this.poseAt(e.text,t,P,e.styleFont,u,r.axis[x],r.elongation[x]);if(z&&(c.push({pose:z,quality:f(x,z)}),c.length>=24))break}if(o){const x=this.index(o.position);if(x>=0&&r.centerX[x]>0){const P={x:r.centerX[x],y:r.centerY[x]},z=this.index(P),O=z<0?null:this.poseAt(e.text,t,P,e.styleFont,u,r.axis[z],r.elongation[z]);O&&z>=0&&c.push({pose:O,quality:f(z,O)})}}if(c.length===0){o&&this.release(e);return}c.sort((x,P)=>P.quality-x.quality);const m=c[0];if(!o){e.placement=this.spawn(m.pose,t);return}const p=c.filter(x=>this.distance(x.pose,o.position)<=r.radius*1.5).sort((x,P)=>P.quality-this.distance(P.pose,o.position)/(r.radius*16)-(x.quality-this.distance(x.pose,o.position)/(r.radius*16)))[0],M=this.index(o.position),v=p?.quality??(M>=0?r.quality[M]:0),l=m.quality>v*ci,a=p&&m.quality<=p.quality*1.08?p:m,g=this.snapshot(o),y=this.distance(g,a.pose)<=r.radius*1.5;let _=t,I=!1;if(!this.fitsPose(t,e.text,g)&&(_=this.union(o.regionMask,t),this.remember(_),!this.fitsPose(_,e.text,g)&&y&&o.mask!==o.regionMask&&(_=this.union(o.mask,t),this.remember(_),I=!0),!this.fitsPose(_,e.text,g))){this.relight(e,a.pose,t);return}let B=this.planRoute(e.text,_,g,a.pose);if(!B&&_!==t&&y&&!I&&o.mask!==o.regionMask){const x=this.union(o.mask,t);if(this.remember(x),this.fitsPose(x,e.text,g)){const P=this.planRoute(e.text,x,g,a.pose);P&&(_=x,B=P)}}if(!B){(_!==t||l&&this.distance(g,a.pose)>r.radius*1.5)&&this.relight(e,a.pose,t);return}o.mask=_,o.regionMask=t,o.target=a.pose,o.route=B}poseAt(e,t,s,i,n,r,o){const u=this.index(s);if(u<0||!t[u])return null;let c=null,f=-1/0;const m=this.maxFont(t,e,s,0);if(m>=D){const p=Math.min(i,Math.max(D,m*.9));c={x:s.x,y:s.y,font:p,angle:0},f=p/i-_t*o*xe(0,r)/ee-.02*xe(0,n)/ee}for(let p=vt;p<=ee;p+=vt){const M=Math.min(i,Z*.9)/i-wt*p/ee;if(f>=M)break;for(const v of[-p,p]){const l=this.maxFont(t,e,s,v);if(l<D)continue;const a=Math.min(i,Math.max(D,l*.9)),g=a/i-wt*p/ee-_t*o*xe(v,r)/ee-.02*xe(v,n)/ee;g>f&&(c={x:s.x,y:s.y,font:a,angle:v},f=g)}}return c}landscape(e,t,s,i,n){const r=this.width+1,o=r*(this.height+1),u=new Float64Array(o),c=new Float64Array(o),f=new Float64Array(o),m=new Float64Array(o),p=new Float64Array(o),M=new Float64Array(o),v=new Float32Array(e.length),l=new Float32Array(e.length),a=new Float32Array(e.length),g=new Float32Array(e.length),y=new Float32Array(e.length),_=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),I=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(i*3.5,Math.sqrt(n*_*_)*.33,_*3)),B=Math.max(1,Math.ceil(I*this.width/this.viewport.width)),x=Math.max(1,Math.ceil(I*this.height/this.viewport.height));for(let S=0;S<this.height;S+=1){let N=0,H=0,V=0,q=0,W=0,Y=0;for(let C=0;C<this.width;C+=1){const K=C+S*this.width,X=e[K]*(.85+.15*s[K])*Q(t[K]*_/(i*2),0,1),F=this.cellPoint(K);N+=X,H+=X*F.x,V+=X*F.y,q+=X*F.x*F.x,W+=X*F.y*F.y,Y+=X*F.x*F.y;const R=(S+1)*r+C+1;u[R]=u[R-r]+N,c[R]=c[R-r]+H,f[R]=f[R-r]+V,m[R]=m[R-r]+q,p[R]=p[R-r]+W,M[R]=M[R-r]+Y}}const P=(S,N,H,V,q)=>S[q*r+V]-S[H*r+V]-S[q*r+N]+S[H*r+N],z=u[o-1],O=z>0?{x:c[o-1]/z,y:f[o-1]/z}:{x:this.viewport.width/2,y:this.viewport.height/2},A=[];for(let S=0;S<e.length;S+=1){if(!e[S])continue;const N=S%this.width,H=Math.floor(S/this.width),V=Math.max(0,N-B),q=Math.max(0,H-x),W=Math.min(this.width,N+B+1),Y=Math.min(this.height,H+x+1),C=P(u,V,q,W,Y);if(C<=0)continue;l[S]=P(c,V,q,W,Y)/C,a[S]=P(f,V,q,W,Y)/C;const K=Math.max(0,P(m,V,q,W,Y)/C-l[S]**2),X=Math.max(0,P(p,V,q,W,Y)/C-a[S]**2),F=P(M,V,q,W,Y)/C-l[S]*a[S],R=Math.hypot(K-X,2*F);g[S]=.5*Math.atan2(2*F,K-X)*180/Math.PI,y[S]=Q(R/(K+X+1),0,1);const se=C/((B*2+1)*(x*2+1)),ue=Q(t[S]*_/(i*2),0,1);v[S]=.7*se+.3*ue-.08*this.distance(this.cellPoint(S),O)/I,A.push(S)}return A.sort((S,N)=>v[N]-v[S]),{quality:v,centerX:l,centerY:a,axis:g,elongation:y,candidates:A,radius:I}}union(e,t){const s=new Uint8Array(t.length);for(let i=0;i<s.length;i+=1)s[i]=e[i]|t[i];return s}planRoute(e,t,s,i){if(this.posesFit(t,e,s,i))return[i];let n=Math.min(s.font,i.font);for(let r=0;r<9;r+=1){n=Math.max(D,n);for(const o of[...new Set([s.angle,i.angle,0])]){const u={...s,font:n},c={...u,angle:o},f={...i,font:n,angle:o},m={...i,font:n};if(!this.posesFit(t,e,s,u)||!this.posesFit(t,e,u,c)||!this.posesFit(t,e,f,m)||!this.posesFit(t,e,m,i))continue;const p=[];if(Math.abs(s.font-n)>.05&&p.push(u),Math.abs(s.angle-o)>.05&&p.push(c),this.posesFit(t,e,c,f))return p.push(f),Math.abs(i.angle-o)>.05&&p.push(m),p.push(i),p;const M=this.legalPath(e,t,c,f);if(!M)continue;let v=c,l=!0;for(let a=0;a<M.length;){let g=-1;for(let _=M.length-1;_>=a;_-=1){const B={...this.cellPoint(M[_]),font:n,angle:o};if(this.posesFit(t,e,v,B)){g=_;break}}if(g<0){l=!1;break}const y={...this.cellPoint(M[g]),font:n,angle:o};this.distance(v,y)>.5&&p.push(y),v=y,a=g+1}if(!(!l||!this.posesFit(t,e,v,f)))return this.distance(v,f)>.5&&p.push(f),Math.abs(i.angle-o)>.05&&p.push(m),p.push(i),p}if(n<=D)break;n=Math.max(D,n*.82)}return null}legalPath(e,t,s,i){const n=new Uint8Array(t.length),r=l=>{if(n[l]===0){const a={...this.cellPoint(l),font:s.font,angle:s.angle};n[l]=t[l]&&this.fitsPose(t,e,a)?1:2}return n[l]===1},o=l=>{const a=this.index(l);if(a<0)return-1;const g=a%this.width,y=Math.floor(a/this.width);for(let _=0;_<=3;_+=1)for(let I=-_;I<=_;I+=1)for(let B=-_;B<=_;B+=1){const x=g+B,P=y+I;if(x<0||P<0||x>=this.width||P>=this.height)continue;const z=x+P*this.width;if(r(z)&&this.posesFit(t,e,l,{...this.cellPoint(z),font:s.font,angle:s.angle}))return z}return-1},u=o(s),c=o(i);if(u<0||c<0)return null;const f=new Int32Array(t.length).fill(-1),m=new Int32Array(t.length);let p=0,M=0;for(m[M++]=u,f[u]=u;p<M&&f[c]<0;){const l=m[p++],a=l%this.width,g=Math.floor(l/this.width);for(const y of[a>0?l-1:-1,a+1<this.width?l+1:-1,g>0?l-this.width:-1,g+1<this.height?l+this.width:-1])y<0||f[y]>=0||!r(y)||(f[y]=l,m[M++]=y)}if(f[c]<0)return null;const v=[];for(let l=c;l!==u;l=f[l])v.push(l);return v.push(u),v.reverse(),v}glide(e,t,s){if(s<=0)return;const i=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,i)){const P=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,P<D){t.fontVelocity=0;return}const z=di(t.font,t.fontVelocity,Math.min(t.target.font,P),s);t.font=Math.max(P,Math.min(t.font,z.value)),t.fontVelocity=t.font<=P?0:z.velocity;return}for(;t.route.length>1&&this.distance(i,t.route[0])<.75&&Math.abs(i.font-t.route[0].font)<.15&&Math.abs(i.angle-t.route[0].angle)<.3;)t.route.shift();const n=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,i,n)&&this.distance(i,n)<.2&&Math.abs(i.font-n.font)<.05&&Math.abs(i.angle-n.angle)<.05){t.position={x:n.x,y:n.y},t.font=n.font,t.angle=n.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const o=!this.fitsPose(t.regionMask,e.text,i)?1:ri,u=ai/o,c=li/o,f=ui/o,m=this.distance(i,n),p=m/u,M=Math.abs(n.font-i.font)/c,v=Math.abs(n.angle-i.angle)/f,l=Math.max(p,M,v);let a=0;l===p&&m>0?a=((n.x-i.x)*t.velocity.x+(n.y-i.y)*t.velocity.y)/m/u:l===M&&M>0?a=Math.sign(n.font-i.font)*t.fontVelocity/c:v>0&&(a=Math.sign(n.angle-i.angle)*t.angleVelocity/f),a=Q(a,-1,1);const g=2/(si*o),y=Q(g*g*l-2*g*a,-Mt,Mt),_=Q(a+y*s,-1,1),I=Math.min(l,(a+_)*s/2);let B=this.lerpPose(i,n,l>0?I/l:1);if(!(I<0?this.posesFit(t.mask,e.text,i,B):this.fitsPose(t.mask,e.text,B))){const P=this.longestLegal(e.text,t.mask,i,B);if(!P){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}B=P}const x=s>0?1/s:0;t.position={x:B.x,y:B.y},t.velocity={x:(B.x-i.x)*x,y:(B.y-i.y)*x},t.font=B.font,t.fontVelocity=(B.font-i.font)*x,t.angle=B.angle,t.angleVelocity=(B.angle-i.angle)*x}collect(e){const t=[];for(const n of this.tracks.values()){const r=n.placement?[n.placement,...n.ghosts]:n.ghosts;for(const o of r)o.opacity<.015||this.fitsPose(o.mask,n.text,this.snapshot(o))&&t.push({track:n,placement:o})}t.sort((n,r)=>r.track.area-n.track.area);const s=[],i=[];for(const n of t){const{track:r,placement:o}=n,u=s.some(f=>f.track!==r&&this.overlaps(r.text,this.snapshot(o),f.track.text,this.snapshot(f.placement)));o.collisionOpacity=be(o.collisionOpacity,u?0:1,e,u?.3:.7),u||s.push(n);const c=o.opacity*o.collisionOpacity;c<.015||i.push({id:o.id,kind:r.kind,text:r.text,x:o.position.x,y:o.position.y,width:this.boxWidth(r.text,o.font,ne(o.font)),height:o.font*Xe,opacity:c,fontSize:o.font,letterSpacing:ne(o.font),angle:o.angle})}return i}relight(e,t,s){const i=e.placement;if(i){const n=this.snapshot(i);if(this.fitsPose(i.mask,e.text,n)&&this.overlaps(e.text,n,e.text,t)){i.target=n,i.route=[],i.velocity={x:0,y:0},i.fontVelocity=0,i.angleVelocity=0,i.regionMask=s;return}i.alive=!1,e.ghosts.push(i)}e.placement=this.spawn(t,s)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,s){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const i=1-Math.exp(-s/oi),n=e.soft;for(let r=0;r<t.length;r+=1)n[r]+=(t[r]-n[r])*i}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const s of e.cells)t[s]=1;return t}components(e){const t=new Uint8Array(e.length),s=new Int32Array(e.length),i=[];for(let n=0;n<e.length;n+=1){if(t[n])continue;const r=i.length,o=e[n]<0?-1:1,u=[];let c=0,f=0,m=this.width,p=this.height,M=0,v=0;const l=[n];for(t[n]=1;l.length;){const _=l.pop();u.push(_),s[_]=r;const I=_%this.width,B=Math.floor(_/this.width);c+=I+.5,f+=B+.5,m=Math.min(m,I),p=Math.min(p,B),M=Math.max(M,I+1),v=Math.max(v,B+1);for(const x of this.neighbors(_))t[x]||(e[x]<0?-1:1)!==o||(t[x]=1,l.push(x))}const a=u.length/e.length;let g=null,y="hole";o>0?a>=Qt?(g="continent",y="place"):a>=jt&&(g="island",y="place"):M-m>this.width*yt&&v-p>this.height*yt||m===0||p===0||M===this.width||v===this.height?y="sea":a>=Kt&&(g="lake",y="place"),i.push({sign:o,area:u.length,cells:u,kind:g,role:y,center:{x:c/u.length/this.width,y:f/u.length/this.height},bounds:{x0:m/this.width,y0:p/this.height,x1:M/this.width,y1:v/this.height}})}for(const n of i){if(n.kind!=="lake")continue;const r=new Map;let o=0;for(const u of n.cells)for(const c of this.neighbors(u)){const f=s[c];i[f].sign<0||(r.set(f,(r.get(f)??0)+1),o+=1)}(o===0||Math.max(...r.values())*5<o*4)&&(n.kind=null,n.role="sea")}return i}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),s=new Int32Array(e.length);let i=0;for(let n=0;n<e.length;n+=1){const r=n%this.width,o=Math.floor(n/this.width);(!e[n]||r===0||o===0||r===this.width-1||o===this.height-1)&&(t[n]=0,s[i++]=n)}for(let n=0;n<i;n+=1){const r=s[n],o=r%this.width,u=Math.floor(r/this.width);for(const c of[o>0?r-1:-1,o+1<this.width?r+1:-1,u>0?r-this.width:-1,u+1<this.height?r+this.width:-1])c<0||t[c]>=0||(t[c]=t[r]+1,s[i++]=c)}return t}prefix(e){const t=this.width+1,s=new Int32Array(t*(this.height+1));for(let i=0;i<this.height;i+=1){let n=0;for(let r=0;r<this.width;r+=1)n+=e[r+i*this.width],s[(i+1)*t+r+1]=s[i*t+r+1]+n}return s}maxFont(e,t,s,i){if(!this.fits(e,t,s,D,ne(D),i))return 0;if(this.fits(e,t,s,Z,ne(Z),i))return Z;let n=D,r=Z;for(let o=0;o<8;o+=1){const u=(n+r)/2;this.fits(e,t,s,u,ne(u),i)?n=u:r=u}return n}fitsPose(e,t,s){return Math.abs(s.angle)<=ee&&this.fits(e,t,s,s.font,ne(s.font),s.angle)}posesFit(e,t,s,i){if(!this.fitsPose(e,t,s)||!this.fitsPose(e,t,i))return!1;const n=Math.max(1,Math.ceil(Math.max(this.distance(s,i)/4,Math.abs(s.font-i.font),Math.abs(s.angle-i.angle)/2)));for(let r=1;r<n;r+=1)if(!this.fitsPose(e,t,this.lerpPose(s,i,r/n)))return!1;return!0}longestLegal(e,t,s,i){if(!this.fitsPose(t,e,s))return null;let n=0,r=1;for(let o=0;o<8;o+=1){const u=(n+r)/2;this.posesFit(t,e,s,this.lerpPose(s,i,u))?n=u:r=u}return n<=0?null:this.lerpPose(s,i,n)}fits(e,t,s,i,n,r){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const o=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),u=Math.max(ei,o*1.25),c=this.boxWidth(t,i,n)/2+u,f=i*Xe/2+u,m=r*Math.PI/180,p=Math.cos(m),M=Math.sin(m),v=Math.abs(c*p)+Math.abs(f*M),l=Math.abs(c*M)+Math.abs(f*p);if(s.x-v<0||s.y-l<0||s.x+v>this.viewport.width||s.y+l>this.viewport.height)return!1;const a=this.prefixFields.get(e);if(a){const x=Math.floor((s.x-v)*this.width/this.viewport.width),P=Math.floor((s.y-l)*this.height/this.viewport.height),z=Math.min(this.width,Math.ceil((s.x+v)*this.width/this.viewport.width)),O=Math.min(this.height,Math.ceil((s.y+l)*this.height/this.viewport.height)),A=this.width+1;if(a[O*A+z]-a[P*A+z]-a[O*A+x]+a[P*A+x]===(z-x)*(O-P))return!0}const g=this.distanceFields.get(e),y=this.index(s);if(g&&y>=0){const x=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(g[y]-2)*x/Math.SQRT2)>=Math.hypot(c,f))return!0}const _=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),I=Math.max(2,Math.ceil(c*2/_)),B=Math.max(2,Math.ceil(f*2/_));for(let x=0;x<=B;x+=1){const P=-f+x*f*2/B;for(let z=0;z<=I;z+=1){const O=-c+z*c*2/I,A=Math.floor((s.x+O*p-P*M)*this.width/this.viewport.width),S=Math.floor((s.y+O*M+P*p)*this.height/this.viewport.height);if(A<0||S<0||A>=this.width||S>=this.height||!e[A+S*this.width])return!1}}return!0}overlaps(e,t,s,i){const n=(u,c)=>{const f=c.angle*Math.PI/180,m=this.boxWidth(u,c.font,ne(c.font))/2+7,p=c.font*Xe/2+7;return{x:Math.abs(m*Math.cos(f))+Math.abs(p*Math.sin(f)),y:Math.abs(m*Math.sin(f))+Math.abs(p*Math.cos(f))}},r=n(e,t),o=n(s,i);return Math.abs(t.x-i.x)<r.x+o.x&&Math.abs(t.y-i.y)<r.y+o.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const s=e.width/t.width,i=e.height/t.height,n=(s+i)/2;for(const r of this.tracks.values()){r.styleFont=Q(r.styleFont*n,D,Z);const o=r.placement?[r.placement,...r.ghosts]:r.ghosts;for(const u of o)this.scalePlacement(u,s,i,n)}}this.viewport=e}scalePlacement(e,t,s,i){e.position={x:e.position.x*t,y:e.position.y*s},e.velocity={x:e.velocity.x*t,y:e.velocity.y*s},e.font=Q(e.font*i,D,Z),e.fontVelocity*=i,e.target={x:e.target.x*t,y:e.target.y*s,font:Q(e.target.font*i,D,Z),angle:e.target.angle},e.route=e.route.map(n=>({x:n.x*t,y:n.y*s,font:Q(n.font*i,D,Z),angle:n.angle}))}regrid(e,t,s,i,n){const r=new e.constructor(i*n);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<n;o+=1)for(let u=0;u<i;u+=1)r[u+o*i]=e[Math.min(t-1,Math.floor((u+.5)*t/i))+Math.min(s-1,Math.floor((o+.5)*s/n))*t];return r}regridFloat(e,t,s,i,n){const r=new Float32Array(i*n);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<n;o+=1)for(let u=0;u<i;u+=1)r[u+o*i]=e[Math.min(t-1,Math.floor((u+.5)*t/i))+Math.min(s-1,Math.floor((o+.5)*s/n))*t];return r}neighbors(e){const t=e%this.width,s=Math.floor(e/this.width);return[(t+1)%this.width+s*this.width,(t-1+this.width)%this.width+s*this.width,t+(s+1)%this.height*this.width,t+(s-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,s){return{x:Se(e.x,t.x,s),y:Se(e.y,t.y,s),font:Se(e.font,t.font,s),angle:Se(e.angle,t.angle,s)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),s=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&s>=0&&s<this.height?t+s*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,s){const i=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(i?.58:.56)+s)+4;const n=i?`i:${e}`:e;let r=this.textMetrics.get(n);return r===void 0&&(this.measure.font=`${i?"italic ":""}500 100px ${hi}`,this.measure.fontKerning="none",r=this.measure.measureText(e).width/100,this.textMetrics.set(n,r)),r*t+e.length*s+4}}const Ye=.7,gi=1.8,mi=(h,e,t,s,i,n)=>{if(s<=0)return h;const r=Math.max(0,t),o=r+s,c=(n-i)/gi*(s-Ye*(Math.exp(-r/Ye)-Math.exp(-o/Ye)));return Math.max(i,Math.min(n,h+e*c))},bi=(h,e,t,s)=>({freeze:e>t?Math.max(0,Math.min(1,(e-h)/(e-t))):0,heat:e<s?Math.max(0,Math.min(1,(h-e)/(s-e))):0}),Pt=2/Math.log(1+Math.sqrt(2)),xi=30,He=40,U=h=>{const e=document.getElementById(h);if(!e)throw new Error(`Missing #${h}`);return e},$=U("field"),ae=U("scale"),le=U("temperature"),We=U("time-speed"),Ge=U("brush-size"),yi=U("scale-value"),vi=U("temperature-value"),wi=U("time-speed-value"),_i=U("brush-size-value"),Mi=U("explanation"),ye=U("settings-toggle"),ze=U("settings-panel"),Ie=U("pause"),Pi=U("restart"),Bi=U("clear-blue"),Ke=U("rough"),je=U("smooth"),Qe=U("scale-dock"),Si=U("scale-readout"),Ue=U("freeze"),Ee=U("heat"),Je=U("phase"),Ze=U("magnetization"),et=U("energy"),Te=U("fatal-error"),Gi=U("place-labels"),zi=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function Ii(){const h=await At();if(!h){Te.hidden=!1,Te.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new Rt(h.device,h.format,$);let t=Number(le.value),s=t,i=Number(ae.value),n=i,r=Number(We.value),o=Number(Ge.value),u=!1,c=!0,f=!1,m=!1,p=!1,M=0,v=0,l=null,a=!0,g=0,y=performance.now(),_=0,I=!1,B=0;const x=new Map;let P=!1,z=0,O=i,A=!1,S=!1,N=0,H=0,V=!1,q=0;const W=new pi,Y=new Map,C=new Map,K=new Map,X=new Map;let F=null,R=0;const se=new Map,ue=new Set,Ce=new Set,Re=new Set,ke=new Set,tt=Pt+.2,Le=Number(ae.min),re=Number(ae.max),it=Number(le.min),nt=Number(le.max),St=.75;let ce=0,Oe=0;const Gt=(re-Le)/2.2,st=Math.ceil((He-1)/2),zt=()=>{const d=Math.max(1,window.innerWidth),b=Math.max(1,window.innerHeight),G=d<=720?Math.min(window.devicePixelRatio||1,2):1,k=Math.min(h.device.limits.maxTextureDimension2D/d,h.device.limits.maxTextureDimension2D/b),w=Math.sqrt(Number(h.device.limits.maxStorageBufferBindingSize)/4/(d*b)),j=Math.max(.25,Math.min(G,k,w)),te=Math.max(1,Math.round(d*j)),oe=Math.max(1,Math.round(b*j));return{density:te/d,width:te,height:oe}},Fe=d=>{const b=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**d-1)*b))},ve=()=>Fe(i)*2+1,It=()=>{const d=Math.min(e.width,e.height)/65.64;if(d<=0)return re;let b=Math.log2(1+Math.max(0,(st-.5)/d));for(b=Math.min(re,Math.max(Le,b));b<re&&Fe(b)<st;)b=Math.min(re,b+.01);return b},he=()=>{const d=ve(),b=d===1?"1 spin":`${d} × ${d}`;ae.value=i.toFixed(2),Qe.value=i.toFixed(2),yi.textContent=b,Si.textContent=b,Mi.textContent=zi[Math.min(3,Math.floor(i+.25))],Ke.setAttribute("aria-label",`Rough, observation scale ${i.toFixed(2)}`),je.setAttribute("aria-label",`Smooth, observation scale ${i.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-i/3)**2).toFixed(3))},de=()=>{le.value=t.toFixed(2),vi.textContent=`T = ${t.toFixed(2)}`;const d=bi(t,s,it,nt);Ue.style.setProperty("--paddle-progress",d.freeze.toFixed(4)),Ee.style.setProperty("--paddle-progress",d.heat.toFixed(4)),Ue.setAttribute("aria-label",`Freeze, current temperature ${t.toFixed(2)}`),Ee.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const b=t-Pt;b<-.2?Je.textContent="ordered":b>.2?Je.textContent="disordered":Je.textContent="critical"},rt=()=>{const d=Number.isInteger(r)?0:1;wi.textContent=`${r.toFixed(d)}×`},Ne=()=>{Ge.value=String(o),_i.textContent=`${o} px`},Ut=()=>({active:p&&!P&&!S,painting:f,forceHot:m,x:M,y:v,radius:o/2}),fe=()=>{const d=ve(),b=(d-1)/2,G=d===1?0:.14*(1-i/3)**2;e.draw(i,b,G,N,Ut()),a=!1},ot=()=>{H+=1,W.reset(),F=null,C.clear(),K.clear(),X.clear(),se.clear(),at([],0)},at=(d,b)=>{const G=new Set,k={width:$.clientWidth,height:$.clientHeight};for(const w of d){if(G.add(w.id),F&&se.get(w.id)!==R){const E=Ft(w,F,k);C.set(w.id,Nt(C.get(w.id),E)),se.set(w.id,R)}const j=Dt(K.get(w.id),C.get(w.id)?.mode??"dark",b);K.set(w.id,j);const te=qt(j),oe=Ot(w.kind,j.from,j.to,te.blend),ge=Vt(X.get(w.id),C.get(w.id)?.opacity??1,b);X.set(w.id,ge);const ie=fi(w);let J=Y.get(w.id);for(J||(J=[],Y.set(w.id,J));J.length<ie.length;){const E=document.createElement("span");E.className="place-label",Gi.append(E),J.push(E)}for(;J.length>ie.length;)J.pop()?.remove();for(let E=0;E<ie.length;E+=1){const L=J[E],dt=ie[E];L.dataset.kind!==w.kind&&(L.dataset.kind=w.kind),L.textContent!==w.text&&(L.textContent=w.text),L.style.color=oe,L.style.opacity=(w.opacity*ge).toFixed(3),L.style.fontSize=`${w.fontSize.toFixed(2)}px`,L.style.letterSpacing=`${w.letterSpacing.toFixed(2)}px`,L.style.transform=`translate(${dt.x.toFixed(2)}px, ${dt.y.toFixed(2)}px) rotate(${w.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[w,j]of Y)if(!G.has(w)){for(const te of j)te.remove();Y.delete(w),C.delete(w),K.delete(w),X.delete(w),se.delete(w)}},lt=(d=!0)=>{const b=zt();e.resize(b.width,b.height,b.density,d),he(),a=!0,fe(),B+=1,H+=1,F=null},we=d=>{const b=$.getBoundingClientRect(),G=(d.clientX-b.left)/b.width,k=(d.clientY-b.top)/b.height;return G<0||G>=1||k<0||k>=1?null:(M=d.clientX-b.left,v=d.clientY-b.top,{x:G*e.width,y:k*e.height})},_e=(d,b)=>{const G=we(d);if(!G){l=null;return}const k=l??G;e.paintSegment(k.x,k.y,G.x,G.y,o*e.density/2,b,m),l=G,a=!0},Ve=d=>{f=!0,l=null,_e(d,!0),m=!1},ut=()=>{const d=[...x.values()];return d.length<2?0:Math.hypot(d[1].x-d[0].x,d[1].y-d[0].y)},pe=()=>{if(I)return;I=!0;const d=B;e.readStats().then(b=>{if(d!==B)return;Ze.textContent=b.magnetization.toFixed(3),et.textContent=b.energy.toFixed(3);const G=b.signedMagnetization===-1;!f&&m!==G&&(m=G,a=!0)}).catch(b=>{console.warn("Could not read Ising statistics.",b)}).finally(()=>{I=!1})},ct=d=>{i=d,n=i,he(),a=!0};ae.addEventListener("input",()=>ct(Number(ae.value))),Qe.addEventListener("input",()=>ct(Number(Qe.value))),le.addEventListener("input",()=>{s=Number(le.value),t=s,ce=0,de()});const Me=(d,b)=>{const G=()=>{d.setAttribute("aria-pressed",String(b.size>0))},k=w=>{b.delete(`pointer:${w.pointerId}`),d.hasPointerCapture(w.pointerId)&&d.releasePointerCapture(w.pointerId),G()};d.addEventListener("pointerdown",w=>{w.pointerType==="mouse"&&w.button!==0||(w.preventDefault(),d.setPointerCapture(w.pointerId),b.add(`pointer:${w.pointerId}`),G())}),d.addEventListener("pointerup",k),d.addEventListener("pointercancel",k),d.addEventListener("lostpointercapture",w=>{b.delete(`pointer:${w.pointerId}`),G()}),d.addEventListener("keydown",w=>{w.code!=="Space"&&w.code!=="Enter"||(w.preventDefault(),b.add(`key:${w.code}`),G())}),d.addEventListener("keyup",w=>{w.code!=="Space"&&w.code!=="Enter"||(w.preventDefault(),b.delete(`key:${w.code}`),G())}),d.addEventListener("blur",()=>{for(const w of b)w.startsWith("key:")&&b.delete(w);G()})};Me(Ke,ue),Me(je,Ce),Me(Ue,Re),Me(Ee,ke),We.addEventListener("input",()=>{r=Number(We.value),rt()}),Ge.addEventListener("input",()=>{o=Number(Ge.value),Ne(),a=!0}),window.addEventListener("keydown",d=>{d.code!=="BracketLeft"&&d.code!=="BracketRight"||(d.preventDefault(),o=Math.max(4,Math.min(100,o+(d.code==="BracketLeft"?-4:4))),Ne(),a=!0)});const De=d=>{c=d,ze.classList.toggle("is-closed",!c),ze.setAttribute("aria-hidden",String(!c)),ye.setAttribute("aria-expanded",String(c)),ye.setAttribute("aria-label",c?"Close settings":"Open settings")};ye.addEventListener("click",()=>De(!c)),document.addEventListener("pointerdown",d=>{const b=d.target;!c||!(b instanceof Node)||ze.contains(b)||ye.contains(b)||De(!1)},{capture:!0}),document.addEventListener("click",d=>{const b=d.target;!c||!(b instanceof Node)||ye.contains(b)||(!ze.contains(b)||b instanceof Element&&b.closest("button"))&&De(!1)}),Ie.addEventListener("click",()=>{u=!u;const d=u?"Resume simulation":"Pause simulation";Ie.setAttribute("aria-pressed",String(u)),Ie.setAttribute("aria-label",d),Ie.title=d,g=0}),Pi.addEventListener("click",()=>{e.randomize(),m=!1,g=0,B+=1,ot(),Ze.textContent="0.000",et.textContent="0.000",a=!0,fe(),pe()}),Bi.addEventListener("click",()=>{e.clearBlue(),m=!0,g=0,B+=1,ot(),Ze.textContent="1.000",et.textContent="-2.000",a=!0,fe(),pe()}),$.addEventListener("pointerdown",d=>{if(we(d)){if($.setPointerCapture(d.pointerId),p=!0,d.pointerType==="touch"){x.set(d.pointerId,{x:d.clientX,y:d.clientY}),x.size===1?(A=!0,S=!1):x.size===2&&(f=!1,l=null,A=!1,S=!0,P=!0,z=ut(),O=n),a=!0;return}Ve(d)}}),$.addEventListener("pointermove",d=>{if(we(d),p=!0,a=!0,d.pointerType==="touch"){if(!x.has(d.pointerId))return;if(x.set(d.pointerId,{x:d.clientX,y:d.clientY}),P&&x.size>=2){const b=ut();z>0&&b>0&&(n=Math.max(0,Math.min(3,O-Math.log2(b/z)*.9)));return}if(x.size===1&&!S){if(A)Ve(d),A=!1;else if(f)for(const b of d.getCoalescedEvents())_e(b,!1)}return}if(f){const b=d.getCoalescedEvents();if(b.length===0)_e(d,!1);else for(const G of b)_e(G,!1)}});const Et=d=>{d.pointerType==="touch"&&(A&&!S&&Ve(d),x.delete(d.pointerId),x.size<2&&(P=!1),x.size===0&&(A=!1,S=!1,p=!1)),f=!1,l=null,$.hasPointerCapture(d.pointerId)&&$.releasePointerCapture(d.pointerId),a=!0,pe()};$.addEventListener("pointerup",Et),$.addEventListener("pointercancel",d=>{x.delete(d.pointerId),f=!1,p=!1,l=null,A=!1,P=!1,a=!0}),$.addEventListener("pointerenter",()=>{p=!0,a=!0}),$.addEventListener("pointerleave",()=>{f||(p=!1,a=!0)}),$.addEventListener("wheel",d=>{d.preventDefault();const b=Math.max(-120,Math.min(120,d.deltaY));n=Math.max(0,Math.min(3,n+b*.00125)),we(d),p=!0},{passive:!1}),window.addEventListener("blur",()=>{f=!1,p=!1,l=null,x.clear(),P=!1,A=!1,ue.clear(),Ce.clear(),Re.clear(),ke.clear(),ce=0,Oe=0,Ke.setAttribute("aria-pressed","false"),je.setAttribute("aria-pressed","false"),Ue.setAttribute("aria-pressed","false"),Ee.setAttribute("aria-pressed","false"),a=!0}),window.addEventListener("resize",()=>lt(!0)),lt(!1),e.step(t,40),de(),rt(),Ne(),a=!0,fe(),pe();const ht=d=>{const b=Math.max(0,(d-y)/1e3),G=Math.min(.1,b);y=d;const k=+(Ce.size>0)-+(ue.size>0);if(k!==0){const E=k<0?Le:re,L=k*Gt*G;i=k<0?Math.max(E,i+L):Math.min(E,i+L),n=i,he(),a=!0}else{const E=n-i;Math.abs(E)>5e-4?(i+=E*(1-Math.exp(-G*10)),he(),a=!0):i!==n&&(i=n,he(),a=!0)}const w=+(ke.size>0)-+(Re.size>0);if(w!==Oe&&(ce=0,Oe=w),w!==0)t=mi(t,w,ce,G,it,nt),ce+=G,de();else{const E=s-t;Math.abs(E)>5e-4?(t+=E*(1-Math.exp(-G/St)),de()):t!==s&&(t=s,de())}if(!u){g+=G*xi*r;const E=Math.min(8,Math.floor(g));E>0&&(g-=E,e.step(t,E),a=!0)}const j=ve()>=He?1:0,te=j-N;Math.abs(te)>.001?(N+=te*(1-Math.exp(-G*7)),a=!0):N!==j&&(N=j,a=!0);const oe=ve()>=He?i:It(),ge=t>tt?"chaos":"map",ie=$.getBoundingClientRect(),J=W.advance(Math.min(.5,b),ge,{width:ie.width,height:ie.height});if(at(J,b),a&&fe(),!V&&ge==="map"&&d-q>280){q=d,V=!0;const E=H;e.readRegionSample(Fe(oe),oe).then(L=>{E!==H||!L||t>tt||(F=L,R+=1,W.ingest(L))}).catch(L=>{console.warn("Could not read Ising regions.",L)}).finally(()=>{V=!1})}d-_>750&&(_=d,pe()),requestAnimationFrame(ht)};requestAnimationFrame(ht)}Ii().catch(h=>{console.error(h),Te.hidden=!1,Te.textContent=h instanceof Error?h.message:"Could not start the WebGPU simulation."});
