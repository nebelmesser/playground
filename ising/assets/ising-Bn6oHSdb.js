(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();async function wi(){try{if(!navigator.gpu)return null;const o=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!o)return null;const e=await o.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(o){return console.error("WebGPU initialization failed.",o),null}}const _i=`struct SimParams {
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
`,O=(o,e)=>Math.ceil(o/e),De=112,qe=128,Mi=(o,e)=>o>=e?{width:De,height:Math.max(1,Math.round(De*e/o))}:{width:Math.max(1,Math.round(De*o/e)),height:De};class Pi{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,n){this.device=e,this.format=t,this.canvas=n;const i=n.getContext("webgpu");if(!i)throw new Error("Could not create a WebGPU canvas context.");this.context=i,this.context.configure({device:e,format:t,alphaMode:"opaque"});const s=e.createShaderModule({label:"Ising shaders",code:_i});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:s,entryPoint:"fullscreen_vertex"},fragment:{module:s,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising label blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:qe*qe*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:qe*qe*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,n,i=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=n;return}const s=this.width,r=this.height,a=this.spinBuffers,c=this.fieldTexture,h=this.blurTextures,f=this.labelBlurTextures,b=this.statsOutput,p=this.statsReadback,P=a?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=n,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),i&&P){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,s,r);const M=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:P}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),x=this.device.createCommandEncoder({label:"Resize Ising grid"}),y=x.beginComputePass();y.setPipeline(this.pipelines.resize),y.setBindGroup(0,M),y.dispatchWorkgroups(O(e,8),O(t,8)),y.end(),this.device.queue.submit([x.finish()])}else this.randomize();a&&this.retire({buffers:[a[0],a[1],...b?[b]:[]],readback:p??void 0,textures:[c,...h??[],...f??[]].filter(M=>!!M)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(O(this.width,8),O(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(O(this.width,8),O(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let n=0;n<t;n+=1){const i=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,i);const s=this.device.createCommandEncoder({label:"Advance Ising state"}),r=s.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(O(this.width,8),O(this.height,8)),r.end(),this.device.queue.submit([s.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,n,i,s,r,a){const c=Math.floor(Math.min(e,n)-s),h=Math.floor(Math.min(t,i)-s),f=Math.ceil(Math.max(e,n)+s),b=Math.ceil(Math.max(t,i)+s),p=f-c+1,P=b-h+1;this.writeBrushParams(c,h,p,P,e,t,n,i,s,a);const M=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const y=M.beginComputePass();y.setPipeline(this.pipelines.select),y.setBindGroup(0,this.selectGroups[this.currentIndex]),y.dispatchWorkgroups(1),y.end()}const x=M.beginComputePass();x.setPipeline(this.pipelines.paint),x.setBindGroup(0,this.paintGroups[this.currentIndex]),x.dispatchWorkgroups(O(p,8),O(P,8)),x.end(),this.device.queue.submit([M.finish()]),this.fieldDirty=!0}draw(e,t,n,i,s){if(!this.renderGroup||!this.observationReady())return;const r=this.secondaryObservationRadius(t,e),a=this.fieldDirty||t!==this.lastBlurRadius||r!==this.lastSecondaryRadius,c=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const f=c.beginComputePass();f.setPipeline(this.pipelines.field),f.setBindGroup(0,this.fieldGroups[this.currentIndex]),f.dispatchWorkgroups(O(this.width,8),O(this.height,8)),f.end(),this.fieldDirty=!1}a&&this.appendObservationBlur(c,t,r,"display"),this.writeRenderParams(e,t,n,i,s);const h=c.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});h.setPipeline(this.pipelines.render),h.setBindGroup(0,this.renderGroup),h.draw(3),h.end(),this.device.queue.submit([c.finish()])}async readRegionSample(e,t){const n=this.regionGroup;if(!n||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const i=Mi(this.width,this.height),s=i.width*i.height;if(s*4>this.regionStorage.size)return null;const r=this.secondaryObservationRadius(e,t),a=e===this.lastBlurRadius&&r===this.lastSecondaryRadius,c=a?n:this.labelRegionGroup;if(!c)return null;const h=this.device.createCommandEncoder({label:"Read Ising regions"});a||this.appendObservationBlur(h,e,r,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([i.width,i.height,0,0]));const f=h.beginComputePass();f.setPipeline(this.pipelines.regions),f.setBindGroup(0,c),f.dispatchWorkgroups(O(i.width,8),O(i.height,8)),f.end(),h.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,s*4),this.device.queue.submit([h.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const b=new Int32Array(this.regionReadback.getMappedRange(),0,s),p=new Int8Array(s),P=new Float32Array(s);for(let M=0;M<s;M+=1)p[M]=b[M]<0?-1:1,P[M]=(Math.abs(b[M])-1)/65534;return{width:i.width,height:i.height,signs:p,luminance:P}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,n=this.statsGroups[this.currentIndex];if(!e||!t||!n)return{energy:0,magnetization:0,signedMagnetization:0};const i=O(this.width,16),s=O(this.height,16),r=new Uint32Array([this.width,this.height,i,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const a=this.device.createCommandEncoder({label:"Read Ising statistics"});a.clearBuffer(e);const c=a.beginComputePass();c.setPipeline(this.pipelines.stats),c.setBindGroup(0,n),c.dispatchWorkgroups(i,s),c.end(),a.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([a.finish()]),await t.mapAsync(GPUMapMode.READ);const h=new Int32Array(t.getMappedRange()),f=h[0],b=h[1];t.unmap();const p=this.width*this.height;return{magnetization:Math.abs(f/p),signedMagnetization:f/p,energy:b/p}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}))}writeSimParams(e,t,n,i,s=0,r=0){const a=new ArrayBuffer(32),c=new DataView(a);c.setUint32(0,this.width,!0),c.setUint32(4,this.height,!0),c.setUint32(8,e,!0),c.setUint32(12,t,!0),c.setFloat32(16,n,!0),c.setUint32(20,i,!0),c.setUint32(24,s,!0),c.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,a)}writeBrushParams(e,t,n,i,s,r,a,c,h,f){const b=new ArrayBuffer(64),p=new DataView(b);p.setUint32(0,this.width,!0),p.setUint32(4,this.height,!0),p.setInt32(8,e,!0),p.setInt32(12,t,!0),p.setUint32(16,n,!0),p.setUint32(20,i,!0),p.setUint32(24,f?1:0,!0),p.setFloat32(32,s,!0),p.setFloat32(36,r,!0),p.setFloat32(40,a,!0),p.setFloat32(44,c,!0),p.setFloat32(48,h,!0),this.device.queue.writeBuffer(this.brushUniform,0,b)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,n,i){const s=i==="display",r=s?this.blurUniforms:this.labelBlurUniforms,a=s?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,c=s?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,h=s?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,f=s?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!c||!h||!f||a.length===0)return;this.writeBlurParams(r[0],t),this.writeBlurParams(r[1],n);const b=e.beginComputePass({label:"Horizontal Ising observation blur"});b.setPipeline(this.pipelines.blurSpinsHorizontal),b.setBindGroup(0,a[this.currentIndex]),b.dispatchWorkgroups(O(this.height,64)),b.end();const p=e.beginComputePass({label:"Vertical Ising observation blur"});if(p.setPipeline(this.pipelines.blurTextureVertical),p.setBindGroup(0,c),p.dispatchWorkgroups(O(this.width,64)),p.end(),n>0){const P=e.beginComputePass({label:"Secondary horizontal Ising blur"});P.setPipeline(this.pipelines.blurTextureHorizontal),P.setBindGroup(0,h),P.dispatchWorkgroups(O(this.height,64)),P.end();const M=e.beginComputePass({label:"Secondary vertical Ising blur"});M.setPipeline(this.pipelines.blurTextureVertical),M.setBindGroup(0,f),M.dispatchWorkgroups(O(this.width,64)),M.end()}s&&(this.lastBlurRadius=t,this.lastSecondaryRadius=n)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,n,i,s){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=t,r[5]=e,r[6]=n,r[7]=s.active?1:0,r[8]=s.x*this.density,r[9]=s.y*this.density,r[10]=s.radius*this.density,r[11]=s.painting?1:0,r[12]=s.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),r[14]=i,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const n of e.buffers)n.destroy();for(const n of e.textures??[])n.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const Si={land:{dark:"#050302",light:"#ffd5a6"},water:{dark:"#06132e",light:"#c4eaff"}},ti=(o,e,t)=>Math.max(e,Math.min(t,o)),Bi=o=>o<=.04045?o/12.92:((o+.055)/1.055)**2.4,Vt=o=>{const e=[1,3,5].map(t=>Bi(parseInt(o.slice(t,t+2),16)/255));return e[0]*.2126+e[1]*.7152+e[2]*.0722},Dt=(o,e)=>(Math.max(o,e)+.05)/(Math.min(o,e)+.05),Ke=(o,e)=>Si[o==="lake"?"water":"land"][e],Gi=(o,e,t,n)=>{const i=Ke(o,e),s=Ke(o,t);return`rgb(${[1,3,5].map(a=>{const c=parseInt(i.slice(a,a+2),16),h=parseInt(s.slice(a,a+2),16);return(c+(h-c)*n).toFixed(2)}).join(", ")})`},Ii=(o,e,t)=>{const n=o.angle*Math.PI/180,i=Math.cos(n),s=Math.sin(n),r=Vt(Ke(o.kind,"dark")),a=Vt(Ke(o.kind,"light")),c=[],h=[];for(let b=-1;b<=1;b+=1)for(let p=-4;p<=4;p+=1){const P=p*o.width*.105,M=b*o.height*.28,x=o.x+P*i-M*s,y=o.y+P*s+M*i,E=Math.max(0,Math.min(e.width-1,Math.floor(x/t.width*e.width))),T=Math.max(0,Math.min(e.height-1,Math.floor(y/t.height*e.height))),d=e.luminance[T*e.width+E];c.push(Dt(d,r)),h.push(Dt(d,a))}c.sort((b,p)=>b-p),h.sort((b,p)=>b-p);const f=Math.floor((c.length-1)*.25);return{dark:c[f],light:h[f]}},zi=(o,e)=>{const t=o?o.darkContrast*.55+e.dark*.45:e.dark,n=o?o.lightContrast*.55+e.light*.45:e.light;let i=o?.mode??(t>=2.5||n<4.5?"dark":"light");const s=i==="dark"?n:t,a=(i==="dark"?t:n)<(i==="dark"?2.5:3)&&s>4.5?(o?.weakSamples??0)+1:0,c=a>=5;return c&&(i=i==="dark"?"light":"dark"),{mode:i,darkContrast:t,lightContrast:n,weakSamples:c?0:a,opacity:i==="dark"?ti(.82+(5-t)*.06,.82,1):1}},Ei=(o,e,t)=>o===void 0?e:o+(e-o)*(1-Math.exp(-ti(t,0,.5)/.8)),Ai=(o,e,t)=>{if(!o)return{from:e,to:e,progress:1,velocity:0};let n=o;if(n.from===n.to){if(e===n.to)return n;n={from:n.to,to:e,progress:0,velocity:0}}const i=e===n.to?1:0,s=Math.max(0,Math.min(t,1/60)),r=5,a=n.progress-i,c=n.velocity+r*a,h=Math.exp(-r*s),f=Math.max(0,Math.min(1,i+(a+c*s)*h)),b=(n.velocity-r*c*s)*h;return Math.abs(f-i)<.001&&Math.abs(b)<.02?{from:e,to:e,progress:1,velocity:0}:{...n,progress:f,velocity:b}},Ti=o=>o.from===o.to?{blend:1,opacity:1}:{blend:o.progress*o.progress*(3-2*o.progress),opacity:1};let dt=1;const qt=new WeakMap,ze=o=>({value:o,revision:0}),H=o=>{if(o.ancestry)return o.ancestry;const e=qt.get(o);if(e)return e;const t=o.chromosome.syllables.map(i=>({id:dt++,onset:ze(i.onset),vowel:ze(i.vowel),bridge:ze(i.bridge??"")})),n={syllables:t,order:t.map(i=>i.id),orderRevision:0,coda:{id:dt++,...ze(o.chromosome.coda)},ending:{id:dt++,...ze(o.chromosome.ending??"")}};return qt.set(o,n),n},Bt=o=>({syllables:o.syllables.map(e=>({id:e.id,onset:{...e.onset},vowel:{...e.vowel},bridge:{...e.bridge}})),order:[...o.order],orderRevision:o.orderRevision,coda:{...o.coda},ending:{...o.ending}}),ii=(o,e)=>{const t=Bt(H(o));o.ancestry=t;for(let n=0;n<o.chromosome.syllables.length;n+=1){const i=o.chromosome.syllables[n],s=e.syllables[n],r=t.syllables[n];for(const a of["onset","vowel","bridge"]){const c=i[a]??"";c!==(s[a]??"")&&(r[a]={value:c,revision:r[a].revision+1})}}for(const n of["coda","ending"]){const i=o.chromosome[n]??"";i!==(e[n]??"")&&(t[n]={id:t[n].id,value:i,revision:t[n].revision+1})}},ni=o=>{const e=o.filter(({weight:t})=>Number.isFinite(t)&&t>0);if(!e.length)throw new Error("Homologous inheritance needs a positive contribution");if(e.some(({origin:t})=>t.id!==e[0].origin.id))throw new Error("Cannot align unrelated gene origins");return e},si=o=>{const e=Math.max(...o.map(i=>i.variant.revision)),t=new Map;for(const i of o){if(i.variant.revision!==e)continue;const s=i.variant.value;t.set(s,(t.get(s)??0)+i.weight)}return{value:[...t].sort((i,s)=>s[1]-i[1]||(i[0]<s[0]?-1:i[0]>s[0]?1:0))[0][0],revision:e}},Ui=o=>{const e=ni(o),t=n=>si(e.map(({origin:i,weight:s})=>({variant:i[n],weight:s})));return{id:e[0].origin.id,onset:t("onset"),vowel:t("vowel"),bridge:t("bridge")}},Ci=o=>{const e=ni(o);return{id:e[0].origin.id,...si(e.map(({origin:t,weight:n})=>({variant:t,weight:n})))}},Ze=o=>(o.bridge??"")+o.onset,Q=o=>`${o.syllables.map(e=>Ze(e)+e.vowel).join("")}${o.coda}${o.ending??""}`,Ce=["v","l","m","n","s","c","r","t","p","d","f","g","b"],ri=["br","cr","dr","gr","pr","tr","cl","fl","gl","pl","fr","st"],oi=["","",...Ce,...ri,"qu"],ai=[...Ce,...ri],fe=["a","e","i","o","u"],li=[...fe,"ae","au","oe"],ci=["n","r","s","l","m","t"],ui=["a","us","um","is","or","ia","ea","ium","ius","aris","ensis"],Ri={"":["n","r","l","m","s","t"],b:["","m","r","l"],p:["","m","r","l"],d:["","n","r","l"],t:["","n","r","l","s","c"],c:["","n","r","s"],g:["","n","r","l"],f:["","r","l"],s:["","n","r","l"],m:["","r","l","m"],n:["","r","n"],l:["","l"],r:["","r"],v:["","l","r"],tr:["","s","n"],dr:["","n"],cr:[""],gr:[""],br:["","m"],pr:["","m"],cl:[""],fl:[""],gl:[""],pl:[""],fr:[""],st:["","n"]},ki=.035,hi=14,et=9,tt=10,ge=(o,e,t)=>Math.max(e,Math.min(t,o)),we=o=>({...o,syllables:o.syllables.map(e=>({...e}))}),de=o=>ge(o(),0,1-Number.EPSILON),ve=(o,e)=>e[Math.floor(de(o)*e.length)],ae=o=>({...o,chromosome:we(o.chromosome),ancestry:Bt(H(o))}),pe=o=>Ri[o]??[""],Ye=(o,e)=>e===void 0?o<.012?1:o<.03?2:3:e===1?o>=.0132?2:1:e===2?o<.0108?1:o>=.033?3:2:o<.0108?1:o<.027?2:3,Li=o=>.025*Math.exp(ge((o-2.27)*5,-12,12)),oe=(o,e)=>({syllables:o.syllables.slice(0,e).map(t=>({...t})),coda:e<3?Ze(o.syllables[e]).charAt(0):o.coda,ending:e===3?o.ending??"":""}),di=o=>{const e=o.syllables[0];return e.onset.length+e.vowel.length<=3&&o.syllables.filter(t=>t.vowel.length>1).length<=1&&o.syllables.every((t,n)=>(t.onset!=="qu"||!["u","au","oe"].includes(t.vowel))&&(n===0?!t.bridge:pe(t.onset).includes(t.bridge??""))&&(n===0||t.onset!==o.syllables[n-1].onset||t.vowel!==o.syllables[n-1].vowel))&&Q(o).length<=hi},Gt=o=>{const e=we(o);e.syllables[0].bridge="";let t=0;for(let n=0;n<3;n+=1){const i=e.syllables[n];if((n===0&&i.onset.length+i.vowel.length>3||i.vowel.length>1&&t>0)&&(i.vowel=i.vowel.charAt(0)),i.onset==="qu"&&["u","au","oe"].includes(i.vowel)&&(i.vowel="a"),n>0&&!pe(i.onset).includes(i.bridge??"")){const s=pe(i.onset);i.bridge=s.includes("")?"":s[0]}i.vowel.length>1&&(t+=1)}for(;Q(e).length>hi;){const n=e.syllables.slice(1).reverse().find(i=>i.bridge&&i.onset||i.onset.length>1||i.vowel.length>1);if(!n)break;n.bridge&&n.onset?n.bridge="":n.onset.length>1?n.onset=n.onset.charAt(0):n.vowel=n.vowel.charAt(0)}for(let n=1;n<3;n+=1){const i=e.syllables[n-1],s=e.syllables[n];i.onset===s.onset&&i.vowel===s.vowel&&(s.vowel=fe[(fe.indexOf(s.vowel.charAt(0))+2)%fe.length])}return e},Ni=o=>{const e=[];let t=!1;for(let n=0;n<3;n+=1){const i=ve(o,n===0?oi:ai),s=ve(o,t||n===0&&i.length>1?fe:li);t||=s.length>1,e.push({onset:i,vowel:s,bridge:n===0?"":ve(o,pe(i))})}return ae({chromosome:Gt({syllables:e,coda:ve(o,ci),ending:ve(o,ui)}),mutability:.75+de(o)*.5,cooldown:5+de(o)*5,generation:0})},fi=(o,e)=>{const t=[];for(let n=0;n<e;n+=1)t.push(n*3,n*3+1),n>0&&t.push(n*3+2);return e===3?t.push(et,tt):t.push(e*3+(o.syllables[e].bridge?2:0)),t},Pt=(o,e)=>{if(e===et)return o.coda;if(e===tt)return o.ending??"";const t=o.syllables[Math.floor(e/3)];return e%3===0?t.onset:e%3===1?t.vowel:t.bridge??""},Qe=(o,e,t)=>{if(e===et)o.coda=t;else if(e===tt)o.ending=t;else{const n=o.syllables[Math.floor(e/3)];e%3===0?n.onset=t:e%3===1?n.vowel=t:n.bridge=t}},gi=(o,e)=>{const t=e===et?ci:e===tt?ui:e%3===2?pe(o.syllables[Math.floor(e/3)].onset):e%3===1?li:e===0?oi:ai;return[...new Set(t)].filter(n=>{if(n===Pt(o,e))return!1;const i=we(o);return Qe(i,e,n),di(i)})},Yt=(o,e,t,n=de(t)<ki)=>{const i=ae(o),s=fi(i.chromosome,e),r=n?Math.max(3,s.length-1):1;let a=0;for(;a<r&&s.length;){const[c]=s.splice(Math.floor(de(t)*s.length),1),h=Q(oe(i.chromosome,e));let f=gi(i.chromosome,c).filter(b=>{const p=we(i.chromosome);return Qe(p,c,b),Q(oe(p,e))!==h});if(!n){const b=f.filter(p=>p.length===Pt(i.chromosome,c).length);f=b.length?b:f.filter(p=>Math.abs(p.length-Pt(i.chromosome,c).length)<=1)}f.length&&(Qe(i.chromosome,c,ve(t,f)),a+=1)}return i.mutability=ge(i.mutability*(1+(de(t)-.5)*.08),.5,1.5),i.cooldown=ge(i.cooldown+(de(t)-.5)*.4,5,10),ii(i,o.chromosome),i},St=(o,e,t)=>{if(e===3){o.coda=t;return}const n=o.syllables[e];n.onset.startsWith(t)?n.bridge="":pe(n.onset).includes(t)?n.bridge=t:(n.bridge="",n.onset=t)},Xt=(o,e,t,n,i,s=!1)=>{const r=c=>{const h=Q(oe(c.chromosome,e));return di(c.chromosome)&&(h!==n||s)&&(!t?.has(h)||s&&h===n)&&(!i||h.startsWith(i))},a=c=>(ii(c,o.chromosome),c);if(r(o))return o;for(const c of[...fi(o.chromosome,e)].reverse())for(const h of gi(o.chromosome,c)){const f=ae(o);if(Qe(f.chromosome,c,h),r(f))return a(f)}if(i&&e>1)for(const c of fe)for(const h of Ce){const f=ae(o);if(f.chromosome.syllables[e-1].vowel=c,St(f.chromosome,e,h),r(f))return a(f)}for(const c of Ce)for(const h of fe)for(const f of Ce){const b=ae(o);if(b.chromosome.syllables[0]={onset:c,vowel:h,bridge:""},St(b.chromosome,e,f),r(b))return a(b)}return null},Oi=(o,e)=>{const t=pe(e.onset);return t.includes(o)?o:o==="n"&&t.includes("m")?"m":e.bridge&&t.includes(e.bridge)?e.bridge:t.find(n=>n==="r"||n==="l"||n==="n")??""},Fi=(o,e)=>{const t=o.filter(l=>l.weight>0).sort((l,u)=>u.weight-l.weight||H(l.genes).order.join(",").localeCompare(H(u.genes).order.join(","))),n=t.reduce((l,u)=>l+u.weight,0),i=new Set(t),s=[];for(;i.size;){const l=[i.values().next().value];i.delete(l[0]);const u=new Set(H(l[0].genes).order);for(let g=!0;g;){g=!1;for(const w of i){const B=H(w.genes).syllables.map(({id:G})=>G);B.some(G=>u.has(G))&&(l.push(w),i.delete(w),B.forEach(G=>u.add(G)),g=!0)}}s.push(l)}const r=(l,u)=>{const g=new Map;for(const B of l){const G=H(B.genes)[u],z=g.get(G.id)??[];z.push({origin:G,weight:B.weight}),g.set(G.id,z)}const w=[...g.values()].sort((B,G)=>G.reduce((z,_)=>z+_.weight,0)-B.reduce((z,_)=>z+_.weight,0)||B[0].origin.id-G[0].origin.id);return Ci(w[0])},a=s.map(l=>{const u=[...l].sort((_,I)=>H(I.genes).orderRevision-H(_.genes).orderRevision||I.weight-_.weight||H(_.genes).order.join(",").localeCompare(H(I.genes).order.join(","))),g=H(u[0].genes).order,w=new Map,B=[];for(const _ of u){const I=H(_.genes),A=l.length===1?I.syllables.map(({id:C})=>C):I.order;for(const C of A)B.includes(C)||B.push(C);for(const C of I.syllables){const L=w.get(C.id)??[];L.push({origin:C,weight:_.weight}),w.set(C.id,L)}}const G=B.map(_=>{const I=w.get(_),A=Ui(I),C=l.length===1?{...l[0].genes.chromosome.syllables.find((L,D)=>H(l[0].genes).syllables[D].id===_)}:{onset:A.onset.value,vowel:A.vowel.value,bridge:A.bridge.value};return{origin:A,sound:C,shared:I.length>1,support:I.reduce((L,D)=>L+D.weight,0)}}),z=[...G].sort((_,I)=>Number(I.shared)-Number(_.shared)||Number(g.includes(I.origin.id))-Number(g.includes(_.origin.id))||I.support-_.support||B.indexOf(_.origin.id)-B.indexOf(I.origin.id));return{material:G,priorities:z,weight:l.reduce((_,I)=>_+I.weight,0),coda:r(l,"coda"),ending:r(l,"ending")}}),c=a.map(l=>l.weight/n*e),h=c.map(Math.floor),f=a.map((l,u)=>u).sort((l,u)=>c[u]-h[u]-(c[l]-h[l])||l-u);for(let l=e-h.reduce((g,w)=>g+w,0),u=0;l>0;l-=1,u+=1)h[f[u]]+=1;const b=[...h];for(;h.reduce((l,u)=>l+u,0)<3;){const l=a.map((u,g)=>g).sort((u,g)=>a[g].weight/n*3-h[g]-(a[u].weight/n*3-h[u])||u-g).find(u=>h[u]<a[u].material.length);h[l]+=1}const p=a.map((l,u)=>{const g=new Set(l.priorities.slice(0,h[u]));return l.material.filter(w=>g.has(w))}),P=[];p.forEach((l,u)=>l.slice(0,b[u]).forEach(g=>P.push({family:u,part:g}))),p.forEach((l,u)=>l.slice(b[u]).forEach(g=>P.push({family:u,part:g})));const M=[];let x="";P.forEach(({family:l,part:u},g)=>{const w=a[l],B={...u.sound};g>0&&P[g-1].family!==l&&(B.bridge=Oi(x,B)),M.push(B);const G=w.material[w.material.indexOf(u)+1];x=G?Ze(G.sound).charAt(0):w.coda.value});const y=a[P[2].family],E=P.map(({part:l})=>l.origin.id),T=t.map(({genes:l})=>H(l)).filter(l=>l.order.every((u,g)=>u===E[g])),d={syllables:P.map(({part:l})=>l.origin),order:E,orderRevision:T.length?Math.max(...T.map(l=>l.orderRevision)):Math.max(...t.map(({genes:l})=>H(l).orderRevision))+1,coda:y.coda,ending:y.ending};return{chromosome:Gt({syllables:M,coda:y.coda.value,ending:y.ending.value}),ancestry:Bt(d),mutability:t.reduce((l,u)=>l+u.genes.mutability*u.weight,0)/n,cooldown:ge(t.reduce((l,u)=>l+u.genes.cooldown*u.weight,0)/n,5,10),generation:Math.max(...t.map(l=>l.genes.generation))+1}};class Vi{genes;genome;pending=null;nextChangeAt;rng;exposure=0;capacity;inheritance=null;inheritanceKey="";get hereditary(){const e=this.pending?.cause==="recombination"?this.pending.genes:this.inheritance;if(!e)return{genes:ae(this.genes),genome:we(this.genome)};const t=this.pending?.cause==="recombination"?this.pending.capacity:this.capacity;return{genes:ae(e),genome:oe(e.chromosome,t)}}constructor(e){this.rng=e.rng??Math.random,this.capacity=Ye(e.areaFraction);let t;if(e.parent){t=ae(e.parent);const n=Math.abs(e.fragment??0)%(4-this.capacity);if(t.chromosome.syllables=[...t.chromosome.syllables.slice(n),...t.chromosome.syllables.slice(0,n)],t.ancestry.syllables=[...t.ancestry.syllables.slice(n),...t.ancestry.syllables.slice(0,n)],this.capacity<3){const i=n+this.capacity<3?Ze(e.parent.chromosome.syllables[n+this.capacity]).charAt(0):e.parent.chromosome.coda;St(t.chromosome,this.capacity,i)}t.chromosome=Gt(t.chromosome),t.generation+=1,t=Yt(t,this.capacity,this.rng)}else t=Ni(this.rng);this.genes=Xt(t,this.capacity,e.banned)??t,this.genome=oe(this.genes.chromosome,this.capacity),this.nextChangeAt=e.now+this.genes.cooldown}recombine(e,t){const n=e.filter(r=>r.weight>0);if(n.length<2)return;const i=`${Ye(t)}:`+n.map(({genes:r,genome:a,weight:c})=>`${Q(r.chromosome)}:${Q(a??r.chromosome)}:${JSON.stringify(H(r))}:${c}`).join("|");if(i===this.inheritanceKey)return;this.inheritanceKey=i;const s=Ye(t);this.inheritance=Fi(n,s),this.pending={genes:this.inheritance,genome:oe(this.inheritance.chromosome,s),capacity:s,cause:"recombination"}}propose(e){const{areaFraction:t,temperature:n,elapsed:i,now:s,banned:r}=e,a=ge(Math.sqrt(.055/Math.max(t,.001)),.5,2);this.exposure=Math.min(1,this.exposure+Math.max(0,i)*Li(n)*this.genes.mutability*a);const c=Ye(t,this.capacity);if(c===this.capacity&&(this.pending?.cause==="growth"||this.pending?.cause==="shrink")&&(this.pending=null),(c!==this.capacity||this.inheritance)&&this.pending?.capacity!==c){const h=this.inheritance??this.genes;this.pending={genes:h,genome:oe(h.chromosome,c),capacity:c,cause:this.inheritance?"recombination":c<this.capacity?"shrink":"growth"}}if(!this.pending&&this.exposure>=1-1e-10){const h=Yt(this.genes,this.capacity,this.rng);this.pending={genes:h,genome:oe(h.chromosome,this.capacity),capacity:this.capacity,cause:"mutation"}}if(this.pending){const h=Xt(this.pending.genes,this.pending.capacity,r,Q(this.genome),this.pending.cause==="growth"?Q(this.genome):void 0,this.pending.cause==="recombination");if(!h)return null;h!==this.pending.genes&&(this.pending={...this.pending,genes:h,genome:oe(h.chromosome,this.pending.capacity)})}return s+1e-10>=this.nextChangeAt?this.pending:null}reject(e){e!==this.pending||e.cause!=="mutation"||(this.pending=null,this.exposure=0)}commit(e,t){if(e!==this.pending||t+1e-10<this.nextChangeAt)return;const n=Q(e.genome)!==Q(this.genome);this.genes=ae(e.genes),this.genome=we(e.genome),this.capacity=e.capacity,this.pending=null,this.inheritance=null,n&&(this.exposure=0,this.nextChangeAt=t+ge(this.genes.cooldown,5,10))}}const Ht=.7,ft=5,Di=2.27,qi=.0025,Yi=.004,Xi=.055,$t=1/2,Hi=48,gt=1.35,$i=.16,Wi=9,F=8,ie=64,ne=80,Wt=20,jt=.12,Kt=.22,ji=.05,Ki=.12,Qi=.85,Ji=.25,Zi=3,Qt=8,en=1.8,tn=140,nn=28,sn=160,rn=2,on='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',Z=(o,e,t)=>Math.max(e,Math.min(t,o)),Ee=(o,e,t,n)=>o+(e-o)*(1-Math.exp(-t/n)),be=o=>o==="island"||o==="continent",re=o=>o*$i,Xe=(o,e,t)=>o+(e-o)*t,Ae=(o,e)=>{const t=Math.abs(o-e)%180;return Math.min(t,180-t)},an=(o,e,t,n)=>{const i=2/Qi,s=(t-o)*i*i-2*i*e,r=e+s*n;return{value:o+r*n,velocity:r}},ln=o=>[{x:o.x,y:o.y}];class cn{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1}advance(e,t,n){this.applyViewport(n);const i=Z(e,0,.5);t!=="map"&&(this.synced=!1);for(const r of this.tracks.values()){const a=t==="map"&&r.confirmed&&r.missing===0;r.agreement=Ee(r.agreement,a?1:0,i,Ht),r.stability=Ee(r.stability,a?r.agreement:0,i,Ht);const c=r.placement;c?.alive&&r.present&&this.glide(r,c,i);const h=c?[c,...r.ghosts]:r.ghosts;for(const f of h){const b=t==="map"&&this.synced&&r.present&&r.confirmed&&r.missing<.75&&f.alive;f.opacity=Ee(f.opacity,b?r.stability:0,i,b?.25:.45)}c&&!c.alive&&c.opacity<.02&&(r.placement=null),r.ghosts=r.ghosts.filter(f=>f.opacity>=.02)}const s=this.collect(i);return t==="chaos"&&s.length===0&&this.reset(),s}ingest(e,t=Di){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const n=performance.now()/1e3,i=this.lastIngest<0?0:Math.min(2,n-this.lastIngest);this.lastIngest=n;for(const d of this.tracks.values())d.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const d=[];for(const l of this.tracks.values()){l.soft&&(l.soft=this.regridFloat(l.soft,this.width,this.height,e.width,e.height)),l.lastMask&&(l.lastMask=this.regrid(l.lastMask,this.width,this.height,e.width,e.height));const u=l.placement?[l.placement,...l.ghosts]:l.ghosts;for(const g of u){const w=g.mask===g.regionMask;g.mask=this.regrid(g.mask,this.width,this.height,e.width,e.height),g.regionMask=w?g.mask:this.regrid(g.regionMask,this.width,this.height,e.width,e.height),d.push(g.mask),w||d.push(g.regionMask)}}this.width=e.width,this.height=e.height;for(const l of d)this.remember(l)}const r=this.components(e.signs).filter(d=>d.role==="place").sort((d,l)=>l.area-d.area).slice(0,Hi),a=[],c=[],h=(d,l,u)=>{const g=l.placement?.alive?{x:l.placement.position.x/this.viewport.width,y:l.placement.position.y/this.viewport.height}:l.center;return{region:d,track:l,overlap:u,distance:this.distance(g,r[d].center)}};for(let d=0;d<r.length;d+=1){const l=new Map;for(const u of r[d].cells){const g=this.owners[u];g&&l.set(g,(l.get(g)??0)+1)}for(const[u,g]of l){const w=this.tracks.get(u);!w||be(w.kind)!==r[d].sign>0||g<=0||a.push(h(d,w,g))}c.push(l)}const f=new Set,b=new Set,p=[],P=d=>{d.sort((l,u)=>u.overlap-l.overlap||l.distance-u.distance||l.track.id-u.track.id);for(const l of d)f.has(l.region)||b.has(l.track.id)||(f.add(l.region),b.add(l.track.id),p.push({track:l.track,region:r[l.region],overlap:l.overlap}))};P(a);const M=[];for(const d of this.tracks.values())if(!(b.has(d.id)||!d.lastMask||d.missing>=ft))for(let l=0;l<r.length;l+=1){if(f.has(l)||be(d.kind)!==r[l].sign>0)continue;const u=r[l].bounds;if(d.bounds.x1<=u.x0||u.x1<=d.bounds.x0||d.bounds.y1<=u.y0||u.y1<=d.bounds.y0)continue;let g=0;for(const w of r[l].cells)g+=d.lastMask[w]??0;g>0&&M.push(h(l,d,g))}P(M);const x=[];for(const d of this.tracks.values())if(!(b.has(d.id)||d.missing>=ft))for(let l=0;l<r.length;l+=1){const u=r[l];if(f.has(l)||be(d.kind)!==u.sign>0)continue;const g=Math.min(d.area,u.area)/Math.max(d.area,u.area),w=Math.max(0,d.bounds.x0-u.bounds.x1,u.bounds.x0-d.bounds.x1)*this.width,B=Math.max(0,d.bounds.y0-u.bounds.y1,u.bounds.y0-d.bounds.y1)*this.height,G=Math.hypot((d.center.x-u.center.x)*this.width,(d.center.y-u.center.y)*this.height),z=Math.sqrt(Math.min(d.area,u.area)/Math.PI);g>=.5&&Math.hypot(w,B)<=1.5&&G<=Math.max(3,z*1.25)&&x.push(h(l,d,0))}P(x);const y=new Set;for(const d of this.tracks.values()){let l=0;for(let u=0;u<r.length;u+=1)be(d.kind)===r[u].sign>0&&(c[u].get(d.id)??0)>=r[u].area*.5&&(l+=1);l>1&&y.add(d.id)}const E=new Map([...this.tracks].map(([d,l])=>[d,l.name.hereditary]));for(let d=0;d<r.length;d+=1){if(f.has(d))continue;const l=r[d];if(!l.kind)continue;const u=[...c[d]].filter(([I,A])=>y.has(I)&&A>=l.area*.5&&be(this.tracks.get(I).kind)===l.sign>0).sort((I,A)=>A[1]-I[1]).map(([I])=>this.tracks.get(I)).find(I=>I!==void 0),g=this.nextTrackId++,w=u?r.filter((I,A)=>(c[A].get(u.id)??0)>=I.area*.5).sort((I,A)=>I.center.x-A.center.x||I.center.y-A.center.y):[],B=new Vi({areaFraction:l.area/e.signs.length,now:n,banned:this.usedStems,parent:u?E.get(u.id)?.genes:void 0,fragment:w.indexOf(l)}),G=Q(B.genome);this.usedStems.add(G);const z=this.nameText(B.genome),_={id:g,stem:G,name:B,kind:l.kind,text:z,area:l.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:l.center,bounds:l.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(_.id,_),p.push({track:_,region:l,overlap:0})}for(const{track:d,region:l}of p){const u=r.indexOf(l),g=[...c[u]].filter(([w,B])=>{const G=this.tracks.get(w);if(!G||be(G.kind)!==l.sign>0)return!1;const z=G.name.genome.syllables.length*2+1;return B/l.area>=.5/z}).map(([w,B])=>({track:this.tracks.get(w),weight:B})).sort((w,B)=>B.weight-w.weight||+(B.track===d)-+(w.track===d)||w.track.id-B.track.id);g.length>1&&d.name.recombine(g.map(({track:w,weight:B})=>({...E.get(w.id),weight:B})),l.area/e.signs.length)}const T=new Uint16Array(e.signs.length);for(const{track:d,region:l,overlap:u}of p){if(d.present=!0,u>0){const g=u/Math.min(d.area,l.area);d.agreement=Math.min(d.agreement,.65+.35*g)}d.area=l.area,d.center=l.center,d.bounds=l.bounds,d.missing=0,d.confirmed=!0;for(const g of l.cells)T[g]=d.id}this.owners=T;for(const d of[...this.tracks.values()])p.some(l=>l.track===d)||(d.missing+=i,d.confirmed=!1,d.missing>ft&&(this.tracks.delete(d.id),this.usedStems.delete(d.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}for(const{track:d,region:l}of p){const u=this.allowedMask(l),g=d.name.propose({areaFraction:l.area/e.signs.length,temperature:t,elapsed:i,now:n,banned:this.usedStems});g&&this.rename(d,g,u,n),d.lastMask=u,this.remember(u),this.smooth(d,u,i),this.aim(d,u,i)}this.synced=!0}nameText(e){const t=Q(e);return t.charAt(0).toUpperCase()+t.slice(1)}rename(e,t,n,i){const s=Q(t.genome);if(i<e.name.nextChangeAt||s!==e.stem&&this.usedStems.has(s))return!1;if(s===e.stem)return e.name.commit(t,i),!0;const r=this.nameText(t.genome),a=e.placement;return a?.alive&&(!this.fitsPose(n,r,this.snapshot(a))||!this.fitsPose(a.mask,r,this.snapshot(a)))?!1:(this.usedStems.delete(e.stem),this.usedStems.add(s),e.name.commit(t,i),e.stem=s,e.text=r,!0)}aim(e,t,n){const i=this.viewport.width*this.viewport.height/t.length,s=Z(Math.sqrt(e.area*i/(Math.max(4,e.text.length)*3.2)),F,ie);e.styleFont=e.styleFont===0?s:Ee(e.styleFont,s,n,2.5);const r=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),a=e.placement?.alive?e.placement:null,c=a?.angle??0,h=e.name.pending?this.nameText(e.name.pending.genome):null,f=h&&this.boxWidth(h,F,re(F))>this.boxWidth(e.text,F,re(F))?h:e.text,b=(G,z)=>Math.max(.01,r.quality[G]+.12*z.font/e.styleFont-ji*Math.abs(z.angle)/ne-Ki*r.elongation[G]*Ae(z.angle,r.axis[G])/ne),p=G=>{const z=[];for(const _ of r.candidates){const I=this.cellPoint(_);if(z.some(C=>this.distance(C.pose,I)<r.radius*.55))continue;const A=this.poseAt(G,t,I,e.styleFont,c,r.axis[_],r.elongation[_]);if(A&&(z.push({pose:A,quality:b(_,A)}),z.length>=24))break}if(a){const _=this.index(a.position);if(_>=0&&r.centerX[_]>0){const I={x:r.centerX[_],y:r.centerY[_]},A=this.index(I),C=A<0?null:this.poseAt(G,t,I,e.styleFont,c,r.axis[A],r.elongation[A]);C&&A>=0&&z.push({pose:C,quality:b(A,C)})}}return z};let P=p(f);if(P.length===0&&f!==e.text&&(e.name.pending&&e.name.reject(e.name.pending),P=p(e.text)),P.length===0){a&&this.release(e);return}P.sort((G,z)=>z.quality-G.quality);const M=P[0];if(!a){e.placement=this.spawn(M.pose,t);return}const x=P.filter(G=>this.distance(G.pose,a.position)<=r.radius*1.5).sort((G,z)=>z.quality-this.distance(z.pose,a.position)/(r.radius*16)-(G.quality-this.distance(G.pose,a.position)/(r.radius*16)))[0],y=this.index(a.position),E=x?.quality??(y>=0?r.quality[y]:0),T=M.quality>E*rn,d=x&&M.quality<=x.quality*1.08?x:M,l=this.snapshot(a),u=this.distance(l,d.pose)<=r.radius*1.5;let g=t,w=!1;if(!this.fitsPose(t,e.text,l)&&(g=this.union(a.regionMask,t),this.remember(g),!this.fitsPose(g,e.text,l)&&u&&a.mask!==a.regionMask&&(g=this.union(a.mask,t),this.remember(g),w=!0),!this.fitsPose(g,e.text,l))){this.relight(e,d.pose,t);return}let B=this.planRoute(e.text,g,l,d.pose);if(!B&&g!==t&&u&&!w&&a.mask!==a.regionMask){const G=this.union(a.mask,t);if(this.remember(G),this.fitsPose(G,e.text,l)){const z=this.planRoute(e.text,G,l,d.pose);z&&(g=G,B=z)}}if(!B){(g!==t||T&&this.distance(l,d.pose)>r.radius*1.5)&&this.relight(e,d.pose,t);return}a.mask=g,a.regionMask=t,a.target=d.pose,a.route=B}poseAt(e,t,n,i,s,r,a){const c=this.index(n);if(c<0||!t[c])return null;let h=null,f=-1/0;const b=this.maxFont(t,e,n,0);if(b>=F){const p=Math.min(i,Math.max(F,b*.9));h={x:n.x,y:n.y,font:p,angle:0},f=p/i-Kt*a*Ae(0,r)/ne-.02*Ae(0,s)/ne}for(let p=Wt;p<=ne;p+=Wt){const P=Math.min(i,ie*.9)/i-jt*p/ne;if(f>=P)break;for(const M of[-p,p]){const x=this.maxFont(t,e,n,M);if(x<F)continue;const y=Math.min(i,Math.max(F,x*.9)),E=y/i-jt*p/ne-Kt*a*Ae(M,r)/ne-.02*Ae(M,s)/ne;E>f&&(h={x:n.x,y:n.y,font:y,angle:M},f=E)}}return h}landscape(e,t,n,i,s){const r=this.width+1,a=r*(this.height+1),c=new Float64Array(a),h=new Float64Array(a),f=new Float64Array(a),b=new Float64Array(a),p=new Float64Array(a),P=new Float64Array(a),M=new Float32Array(e.length),x=new Float32Array(e.length),y=new Float32Array(e.length),E=new Float32Array(e.length),T=new Float32Array(e.length),d=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),l=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(i*3.5,Math.sqrt(s*d*d)*.33,d*3)),u=Math.max(1,Math.ceil(l*this.width/this.viewport.width)),g=Math.max(1,Math.ceil(l*this.height/this.viewport.height));for(let _=0;_<this.height;_+=1){let I=0,A=0,C=0,L=0,D=0,K=0;for(let q=0;q<this.width;q+=1){const te=q+_*this.width,Y=e[te]*(.85+.15*n[te])*Z(t[te]*d/(i*2),0,1),$=this.cellPoint(te);I+=Y,A+=Y*$.x,C+=Y*$.y,L+=Y*$.x*$.x,D+=Y*$.y*$.y,K+=Y*$.x*$.y;const V=(_+1)*r+q+1;c[V]=c[V-r]+I,h[V]=h[V-r]+A,f[V]=f[V-r]+C,b[V]=b[V-r]+L,p[V]=p[V-r]+D,P[V]=P[V-r]+K}}const w=(_,I,A,C,L)=>_[L*r+C]-_[A*r+C]-_[L*r+I]+_[A*r+I],B=c[a-1],G=B>0?{x:h[a-1]/B,y:f[a-1]/B}:{x:this.viewport.width/2,y:this.viewport.height/2},z=[];for(let _=0;_<e.length;_+=1){if(!e[_])continue;const I=_%this.width,A=Math.floor(_/this.width),C=Math.max(0,I-u),L=Math.max(0,A-g),D=Math.min(this.width,I+u+1),K=Math.min(this.height,A+g+1),q=w(c,C,L,D,K);if(q<=0)continue;x[_]=w(h,C,L,D,K)/q,y[_]=w(f,C,L,D,K)/q;const te=Math.max(0,w(b,C,L,D,K)/q-x[_]**2),Y=Math.max(0,w(p,C,L,D,K)/q-y[_]**2),$=w(P,C,L,D,K)/q-x[_]*y[_],V=Math.hypot(te-Y,2*$);E[_]=.5*Math.atan2(2*$,te-Y)*180/Math.PI,T[_]=Z(V/(te+Y+1),0,1);const ce=q/((u*2+1)*(g*2+1)),_e=Z(t[_]*d/(i*2),0,1);M[_]=.7*ce+.3*_e-.08*this.distance(this.cellPoint(_),G)/l,z.push(_)}return z.sort((_,I)=>M[I]-M[_]),{quality:M,centerX:x,centerY:y,axis:E,elongation:T,candidates:z,radius:l}}union(e,t){const n=new Uint8Array(t.length);for(let i=0;i<n.length;i+=1)n[i]=e[i]|t[i];return n}planRoute(e,t,n,i){if(this.posesFit(t,e,n,i))return[i];let s=Math.min(n.font,i.font);for(let r=0;r<9;r+=1){s=Math.max(F,s);for(const a of[...new Set([n.angle,i.angle,0])]){const c={...n,font:s},h={...c,angle:a},f={...i,font:s,angle:a},b={...i,font:s};if(!this.posesFit(t,e,n,c)||!this.posesFit(t,e,c,h)||!this.posesFit(t,e,f,b)||!this.posesFit(t,e,b,i))continue;const p=[];if(Math.abs(n.font-s)>.05&&p.push(c),Math.abs(n.angle-a)>.05&&p.push(h),this.posesFit(t,e,h,f))return p.push(f),Math.abs(i.angle-a)>.05&&p.push(b),p.push(i),p;const P=this.legalPath(e,t,h,f);if(!P)continue;let M=h,x=!0;for(let y=0;y<P.length;){let E=-1;for(let d=P.length-1;d>=y;d-=1){const u={...this.cellPoint(P[d]),font:s,angle:a};if(this.posesFit(t,e,M,u)){E=d;break}}if(E<0){x=!1;break}const T={...this.cellPoint(P[E]),font:s,angle:a};this.distance(M,T)>.5&&p.push(T),M=T,y=E+1}if(!(!x||!this.posesFit(t,e,M,f)))return this.distance(M,f)>.5&&p.push(f),Math.abs(i.angle-a)>.05&&p.push(b),p.push(i),p}if(s<=F)break;s=Math.max(F,s*.82)}return null}legalPath(e,t,n,i){const s=new Uint8Array(t.length),r=x=>{if(s[x]===0){const y={...this.cellPoint(x),font:n.font,angle:n.angle};s[x]=t[x]&&this.fitsPose(t,e,y)?1:2}return s[x]===1},a=x=>{const y=this.index(x);if(y<0)return-1;const E=y%this.width,T=Math.floor(y/this.width);for(let d=0;d<=3;d+=1)for(let l=-d;l<=d;l+=1)for(let u=-d;u<=d;u+=1){const g=E+u,w=T+l;if(g<0||w<0||g>=this.width||w>=this.height)continue;const B=g+w*this.width;if(r(B)&&this.posesFit(t,e,x,{...this.cellPoint(B),font:n.font,angle:n.angle}))return B}return-1},c=a(n),h=a(i);if(c<0||h<0)return null;const f=new Int32Array(t.length).fill(-1),b=new Int32Array(t.length);let p=0,P=0;for(b[P++]=c,f[c]=c;p<P&&f[h]<0;){const x=b[p++],y=x%this.width,E=Math.floor(x/this.width);for(const T of[y>0?x-1:-1,y+1<this.width?x+1:-1,E>0?x-this.width:-1,E+1<this.height?x+this.width:-1])T<0||f[T]>=0||!r(T)||(f[T]=x,b[P++]=T)}if(f[h]<0)return null;const M=[];for(let x=h;x!==c;x=f[x])M.push(x);return M.push(c),M.reverse(),M}glide(e,t,n){if(n<=0)return;const i=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,i)){const w=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,w<F){t.fontVelocity=0;return}const B=an(t.font,t.fontVelocity,Math.min(t.target.font,w),n);t.font=Math.max(w,Math.min(t.font,B.value)),t.fontVelocity=t.font<=w?0:B.velocity;return}for(;t.route.length>1&&this.distance(i,t.route[0])<.75&&Math.abs(i.font-t.route[0].font)<.15&&Math.abs(i.angle-t.route[0].angle)<.3;)t.route.shift();const s=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,i,s)&&this.distance(i,s)<.2&&Math.abs(i.font-s.font)<.05&&Math.abs(i.angle-s.angle)<.05){t.position={x:s.x,y:s.y},t.font=s.font,t.angle=s.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const a=!this.fitsPose(t.regionMask,e.text,i)?1:Zi,c=tn/a,h=nn/a,f=sn/a,b=this.distance(i,s),p=b/c,P=Math.abs(s.font-i.font)/h,M=Math.abs(s.angle-i.angle)/f,x=Math.max(p,P,M);let y=0;x===p&&b>0?y=((s.x-i.x)*t.velocity.x+(s.y-i.y)*t.velocity.y)/b/c:x===P&&P>0?y=Math.sign(s.font-i.font)*t.fontVelocity/h:M>0&&(y=Math.sign(s.angle-i.angle)*t.angleVelocity/f),y=Z(y,-1,1);const E=2/(Ji*a),T=Z(E*E*x-2*E*y,-Qt,Qt),d=Z(y+T*n,-1,1),l=Math.min(x,(y+d)*n/2);let u=this.lerpPose(i,s,x>0?l/x:1);if(!(l<0?this.posesFit(t.mask,e.text,i,u):this.fitsPose(t.mask,e.text,u))){const w=this.longestLegal(e.text,t.mask,i,u);if(!w){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}u=w}const g=n>0?1/n:0;t.position={x:u.x,y:u.y},t.velocity={x:(u.x-i.x)*g,y:(u.y-i.y)*g},t.font=u.font,t.fontVelocity=(u.font-i.font)*g,t.angle=u.angle,t.angleVelocity=(u.angle-i.angle)*g}collect(e){const t=[];for(const s of this.tracks.values()){const r=s.placement?[s.placement,...s.ghosts]:s.ghosts;for(const a of r)a.opacity<.015||this.fitsPose(a.mask,s.text,this.snapshot(a))&&t.push({track:s,placement:a})}t.sort((s,r)=>r.track.area-s.track.area);const n=[],i=[];for(const s of t){const{track:r,placement:a}=s,c=n.some(f=>f.track!==r&&this.overlaps(r.text,this.snapshot(a),f.track.text,this.snapshot(f.placement)));a.collisionOpacity=Ee(a.collisionOpacity,c?0:1,e,c?.3:.7),c||n.push(s);const h=a.opacity*a.collisionOpacity;h<.015||i.push({id:a.id,kind:r.kind,text:r.text,x:a.position.x,y:a.position.y,width:this.boxWidth(r.text,a.font,re(a.font)),height:a.font*gt,opacity:h,fontSize:a.font,letterSpacing:re(a.font),angle:a.angle})}return i}relight(e,t,n){const i=e.placement;if(i){const s=this.snapshot(i);if(this.fitsPose(i.mask,e.text,s)&&this.overlaps(e.text,s,e.text,t)){i.target=s,i.route=[],i.velocity={x:0,y:0},i.fontVelocity=0,i.angleVelocity=0,i.regionMask=n;return}i.alive=!1,e.ghosts.push(i)}e.placement=this.spawn(t,n)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,n){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const i=1-Math.exp(-n/en),s=e.soft;for(let r=0;r<t.length;r+=1)s[r]+=(t[r]-s[r])*i}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const n of e.cells)t[n]=1;return t}components(e){const t=new Uint8Array(e.length),n=new Int32Array(e.length),i=[];for(let s=0;s<e.length;s+=1){if(t[s])continue;const r=i.length,a=e[s]<0?-1:1,c=[];let h=0,f=0,b=this.width,p=this.height,P=0,M=0;const x=[s];for(t[s]=1;x.length;){const d=x.pop();c.push(d),n[d]=r;const l=d%this.width,u=Math.floor(d/this.width);h+=l+.5,f+=u+.5,b=Math.min(b,l),p=Math.min(p,u),P=Math.max(P,l+1),M=Math.max(M,u+1);for(const g of this.neighbors(d))t[g]||(e[g]<0?-1:1)!==a||(t[g]=1,x.push(g))}const y=c.length/e.length;let E=null,T="hole";a>0?y>=Xi?(E="continent",T="place"):y>=Yi&&(E="island",T="place"):P-b>this.width*$t&&M-p>this.height*$t||b===0||p===0||P===this.width||M===this.height?T="sea":y>=qi&&(E="lake",T="place"),i.push({sign:a,area:c.length,cells:c,kind:E,role:T,center:{x:h/c.length/this.width,y:f/c.length/this.height},bounds:{x0:b/this.width,y0:p/this.height,x1:P/this.width,y1:M/this.height}})}for(const s of i){if(s.kind!=="lake")continue;const r=new Map;let a=0;for(const c of s.cells)for(const h of this.neighbors(c)){const f=n[h];i[f].sign<0||(r.set(f,(r.get(f)??0)+1),a+=1)}(a===0||Math.max(...r.values())*5<a*4)&&(s.kind=null,s.role="sea")}return i}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),n=new Int32Array(e.length);let i=0;for(let s=0;s<e.length;s+=1){const r=s%this.width,a=Math.floor(s/this.width);(!e[s]||r===0||a===0||r===this.width-1||a===this.height-1)&&(t[s]=0,n[i++]=s)}for(let s=0;s<i;s+=1){const r=n[s],a=r%this.width,c=Math.floor(r/this.width);for(const h of[a>0?r-1:-1,a+1<this.width?r+1:-1,c>0?r-this.width:-1,c+1<this.height?r+this.width:-1])h<0||t[h]>=0||(t[h]=t[r]+1,n[i++]=h)}return t}prefix(e){const t=this.width+1,n=new Int32Array(t*(this.height+1));for(let i=0;i<this.height;i+=1){let s=0;for(let r=0;r<this.width;r+=1)s+=e[r+i*this.width],n[(i+1)*t+r+1]=n[i*t+r+1]+s}return n}maxFont(e,t,n,i){if(!this.fits(e,t,n,F,re(F),i))return 0;if(this.fits(e,t,n,ie,re(ie),i))return ie;let s=F,r=ie;for(let a=0;a<8;a+=1){const c=(s+r)/2;this.fits(e,t,n,c,re(c),i)?s=c:r=c}return s}fitsPose(e,t,n){return Math.abs(n.angle)<=ne&&this.fits(e,t,n,n.font,re(n.font),n.angle)}posesFit(e,t,n,i){if(!this.fitsPose(e,t,n)||!this.fitsPose(e,t,i))return!1;const s=Math.max(1,Math.ceil(Math.max(this.distance(n,i)/4,Math.abs(n.font-i.font),Math.abs(n.angle-i.angle)/2)));for(let r=1;r<s;r+=1)if(!this.fitsPose(e,t,this.lerpPose(n,i,r/s)))return!1;return!0}longestLegal(e,t,n,i){if(!this.fitsPose(t,e,n))return null;let s=0,r=1;for(let a=0;a<8;a+=1){const c=(s+r)/2;this.posesFit(t,e,n,this.lerpPose(n,i,c))?s=c:r=c}return s<=0?null:this.lerpPose(n,i,s)}fits(e,t,n,i,s,r){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const a=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),c=Math.max(Wi,a*1.25),h=this.boxWidth(t,i,s)/2+c,f=i*gt/2+c,b=r*Math.PI/180,p=Math.cos(b),P=Math.sin(b),M=Math.abs(h*p)+Math.abs(f*P),x=Math.abs(h*P)+Math.abs(f*p);if(n.x-M<0||n.y-x<0||n.x+M>this.viewport.width||n.y+x>this.viewport.height)return!1;const y=this.prefixFields.get(e);if(y){const g=Math.floor((n.x-M)*this.width/this.viewport.width),w=Math.floor((n.y-x)*this.height/this.viewport.height),B=Math.min(this.width,Math.ceil((n.x+M)*this.width/this.viewport.width)),G=Math.min(this.height,Math.ceil((n.y+x)*this.height/this.viewport.height)),z=this.width+1;if(y[G*z+B]-y[w*z+B]-y[G*z+g]+y[w*z+g]===(B-g)*(G-w))return!0}const E=this.distanceFields.get(e),T=this.index(n);if(E&&T>=0){const g=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(E[T]-2)*g/Math.SQRT2)>=Math.hypot(h,f))return!0}const d=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),l=Math.max(2,Math.ceil(h*2/d)),u=Math.max(2,Math.ceil(f*2/d));for(let g=0;g<=u;g+=1){const w=-f+g*f*2/u;for(let B=0;B<=l;B+=1){const G=-h+B*h*2/l,z=Math.floor((n.x+G*p-w*P)*this.width/this.viewport.width),_=Math.floor((n.y+G*P+w*p)*this.height/this.viewport.height);if(z<0||_<0||z>=this.width||_>=this.height||!e[z+_*this.width])return!1}}return!0}overlaps(e,t,n,i){const s=(c,h)=>{const f=h.angle*Math.PI/180,b=this.boxWidth(c,h.font,re(h.font))/2+7,p=h.font*gt/2+7;return{x:Math.abs(b*Math.cos(f))+Math.abs(p*Math.sin(f)),y:Math.abs(b*Math.sin(f))+Math.abs(p*Math.cos(f))}},r=s(e,t),a=s(n,i);return Math.abs(t.x-i.x)<r.x+a.x&&Math.abs(t.y-i.y)<r.y+a.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const n=e.width/t.width,i=e.height/t.height,s=(n+i)/2;for(const r of this.tracks.values()){r.styleFont=Z(r.styleFont*s,F,ie);const a=r.placement?[r.placement,...r.ghosts]:r.ghosts;for(const c of a)this.scalePlacement(c,n,i,s)}}this.viewport=e}scalePlacement(e,t,n,i){e.position={x:e.position.x*t,y:e.position.y*n},e.velocity={x:e.velocity.x*t,y:e.velocity.y*n},e.font=Z(e.font*i,F,ie),e.fontVelocity*=i,e.target={x:e.target.x*t,y:e.target.y*n,font:Z(e.target.font*i,F,ie),angle:e.target.angle},e.route=e.route.map(s=>({x:s.x*t,y:s.y*n,font:Z(s.font*i,F,ie),angle:s.angle}))}regrid(e,t,n,i,s){const r=new e.constructor(i*s);if(e.length!==t*n||t<1||n<1)return r;for(let a=0;a<s;a+=1)for(let c=0;c<i;c+=1)r[c+a*i]=e[Math.min(t-1,Math.floor((c+.5)*t/i))+Math.min(n-1,Math.floor((a+.5)*n/s))*t];return r}regridFloat(e,t,n,i,s){const r=new Float32Array(i*s);if(e.length!==t*n||t<1||n<1)return r;for(let a=0;a<s;a+=1)for(let c=0;c<i;c+=1)r[c+a*i]=e[Math.min(t-1,Math.floor((c+.5)*t/i))+Math.min(n-1,Math.floor((a+.5)*n/s))*t];return r}neighbors(e){const t=e%this.width,n=Math.floor(e/this.width);return[(t+1)%this.width+n*this.width,(t-1+this.width)%this.width+n*this.width,t+(n+1)%this.height*this.width,t+(n-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,n){return{x:Xe(e.x,t.x,n),y:Xe(e.y,t.y,n),font:Xe(e.font,t.font,n),angle:Xe(e.angle,t.angle,n)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),n=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&n>=0&&n<this.height?t+n*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,n){const i=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(i?.58:.56)+n)+4;const s=i?`i:${e}`:e;let r=this.textMetrics.get(s);return r===void 0&&(this.measure.font=`${i?"italic ":""}500 100px ${on}`,this.measure.fontKerning="none",r=this.measure.measureText(e).width/100,this.textMetrics.set(s,r)),r*t+e.length*n+4}}const un=.6,hn=(o,e,t,n=!1)=>{if(!o||n)return{from:null,to:e,progress:1};if(o.from===null)return e===o.to?o:{from:o.to,to:e,progress:0};const i=Number.isFinite(t)?Math.max(0,t):0,s=Math.min(1,o.progress+i/un);return s<1-1e-9?{...o,progress:s}:e===o.to?{from:null,to:e,progress:1}:{from:o.to,to:e,progress:0}},dn=o=>{const e=o.from===null?1:o.progress**2*(3-2*o.progress);return{previous:o.from,current:o.to,previousOpacity:1-e,currentOpacity:e}},pt=2.4,fn=12,gn=(o,e,t,n,i,s)=>{if(n<=0)return o;const r=Math.max(0,t),a=r+n,h=(s-i)/fn*(n-pt*(Math.exp(-r/pt)-Math.exp(-a/pt)));return Math.max(i,Math.min(s,o+e*h))},pn=(o,e,t,n)=>({freeze:e>t?Math.max(0,Math.min(1,(e-o)/(e-t))):0,heat:e<n?Math.max(0,Math.min(1,(o-e)/(n-e))):0}),Jt=2/Math.log(1+Math.sqrt(2)),mn=30,mt=40,bn=45,R=o=>{const e=document.getElementById(o);if(!e)throw new Error(`Missing #${o}`);return e},j=R("field"),ye=R("scale"),xe=R("temperature"),bt=R("time-speed"),He=R("brush-size"),Zt=R("show-labels"),yn=R("scale-value"),xn=R("temperature-value"),vn=R("time-speed-value"),wn=R("brush-size-value"),Te=R("settings-toggle"),Ue=R("settings-panel"),$e=R("pause"),_n=R("restart"),Mn=R("clear-blue"),yt=R("rough"),xt=R("smooth"),vt=R("scale-dock"),Pn=R("scale-readout"),We=R("cool"),je=R("heat"),wt=R("phase"),_t=R("magnetization"),Mt=R("energy"),Je=R("fatal-error"),ei=R("place-labels");async function Sn(){const o=await wi();if(!o){Je.hidden=!1,Je.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new Pi(o.device,o.format,j);let t=Number(xe.value),n=t,i=Number(ye.value),s=i,r=Number(bt.value),a=Number(He.value),c=!1,h=!1,f=!1,b=!1,p=!1,P=0,M=0,x=null,y=!0,E=0,T=performance.now(),d=0,l=!1,u=0;const g=new Map;let w=!1,B=0,G=i,z=!1,_=!1,I=0,A=0,C=!1,L=0;const D=new cn,K=new Map,q=new Map,te=window.matchMedia("(prefers-reduced-motion: reduce)"),Y=new Map,$=new Map,V=new Map;let ce=null,_e=0;const Re=new Map,it=new Set,nt=new Set,st=new Set,rt=new Set,It=Jt+.2,ke=Number(ye.min),ue=Number(ye.max),zt=Number(xe.min),Et=Number(xe.max),pi=.75;let Me=0,ot=0;const mi=(ue-ke)/2.2,At=Math.ceil((mt-1)/2),bi=()=>{const m=Math.max(1,window.innerWidth),v=Math.max(1,window.innerHeight),U=m<=720?Math.min(window.devicePixelRatio||1,2):1,N=Math.min(o.device.limits.maxTextureDimension2D/m,o.device.limits.maxTextureDimension2D/v),S=Math.sqrt(Number(o.device.limits.maxStorageBufferBindingSize)/4/(m*v)),J=Math.max(.25,Math.min(U,N,S)),se=Math.max(1,Math.round(m*J)),me=Math.max(1,Math.round(v*J));return{density:se/m,width:se,height:me}},at=m=>{const v=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**m-1)*v))},Le=()=>at(i)*2+1,yi=()=>{const m=Math.min(e.width,e.height)/65.64;if(m<=0)return ue;let v=Math.log2(1+Math.max(0,(At-.5)/m));for(v=Math.min(ue,Math.max(ke,v));v<ue&&at(v)<At;)v=Math.min(ue,v+.01);return v},Pe=()=>{const m=Le(),v=m===1?"1 spin":`${m} × ${m}`;ye.value=i.toFixed(2),vt.value=i.toFixed(2),yn.textContent=v,Pn.textContent=v,yt.setAttribute("aria-label",`Rough, observation scale ${i.toFixed(2)}`),xt.setAttribute("aria-label",`Smooth, observation scale ${i.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-i/3)**2).toFixed(3))},Se=()=>{xe.value=t.toFixed(2),xn.textContent=`T = ${t.toFixed(2)}`;const m=pn(t,n,zt,Et);We.style.setProperty("--paddle-progress",m.freeze.toFixed(4)),je.style.setProperty("--paddle-progress",m.heat.toFixed(4)),We.setAttribute("aria-label",`Cool, current temperature ${t.toFixed(2)}`),je.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const v=t-Jt;v<-.2?wt.textContent="ordered":v>.2?wt.textContent="disordered":wt.textContent="critical"},Tt=()=>{const m=Number.isInteger(r)?0:1;vn.textContent=`${r.toFixed(m)}×`},lt=()=>{He.value=String(a),wn.textContent=`${a} px`},xi=()=>({active:p&&!w&&!_,painting:f,forceHot:b,x:P,y:M,radius:a/2}),Be=()=>{const m=Le(),v=(m-1)/2,U=m===1?0:.14*(1-i/3)**2;e.draw(i,v,U,I,xi()),y=!1},Ut=()=>{A+=1,D.reset(),ce=null,Y.clear(),$.clear(),V.clear(),Re.clear(),q.clear(),Ct([],0)},Ct=(m,v)=>{const U=new Set,N={width:j.clientWidth,height:j.clientHeight};for(const S of m){if(U.add(S.id),ce&&Re.get(S.id)!==_e){const ee=Ii(S,ce,N);Y.set(S.id,zi(Y.get(S.id),ee)),Re.set(S.id,_e)}const J=Ai($.get(S.id),Y.get(S.id)?.mode??"dark",v);$.set(S.id,J);const se=Ti(J),me=Gi(S.kind,J.from,J.to,se.blend),Ie=Ei(V.get(S.id),Y.get(S.id)?.opacity??1,v);V.set(S.id,Ie);const he=ln(S),Ve=hn(q.get(S.id),S.text,v,te.matches);q.set(S.id,Ve);const k=dn(Ve);let X=K.get(S.id);for(X||(X=[],K.set(S.id,X));X.length<he.length;){const ee=document.createElement("span");ee.className="place-label";const W=document.createElement("span");W.className="place-label-text",ee.append(W),ei.append(ee),X.push({node:ee,current:W,previous:null})}for(;X.length>he.length;)X.pop()?.node.remove();for(let ee=0;ee<he.length;ee+=1){const W=X[ee],{node:le,current:ht}=W,Ft=he[ee];le.dataset.kind!==S.kind&&(le.dataset.kind=S.kind),ht.textContent!==k.current&&(ht.textContent=k.current),ht.style.opacity=k.currentOpacity.toFixed(3),k.previous!==null?(W.previous||(W.previous=document.createElement("span"),W.previous.className="place-label-text place-label-text-previous",W.previous.setAttribute("aria-hidden","true"),le.prepend(W.previous)),W.previous.textContent!==k.previous&&(W.previous.textContent=k.previous),W.previous.style.opacity=k.previousOpacity.toFixed(3)):W.previous&&(W.previous.remove(),W.previous=null),le.style.color=me,le.style.opacity=(S.opacity*Ie).toFixed(3),le.style.fontSize=`${S.fontSize.toFixed(2)}px`,le.style.letterSpacing=`${S.letterSpacing.toFixed(2)}px`,le.style.transform=`translate(${Ft.x.toFixed(2)}px, ${Ft.y.toFixed(2)}px) rotate(${S.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[S,J]of K)if(!U.has(S)){for(const{node:se}of J)se.remove();K.delete(S),q.delete(S),Y.delete(S),$.delete(S),V.delete(S),Re.delete(S)}},Rt=(m=!0)=>{const v=bi();if(e.resize(v.width,v.height,v.density,m),!m){const U=Math.min(e.width,e.height)/65.64,N=(bn-1)/2;i=Math.max(ke,Math.min(ue,Math.log2(1+N/U))),s=i}Pe(),y=!0,Be(),u+=1,A+=1,ce=null},Ne=m=>{const v=j.getBoundingClientRect(),U=(m.clientX-v.left)/v.width,N=(m.clientY-v.top)/v.height;return U<0||U>=1||N<0||N>=1?null:(P=m.clientX-v.left,M=m.clientY-v.top,{x:U*e.width,y:N*e.height})},Oe=(m,v)=>{const U=Ne(m);if(!U){x=null;return}const N=x??U;e.paintSegment(N.x,N.y,U.x,U.y,a*e.density/2,v,b),x=U,y=!0},ct=m=>{f=!0,x=null,Oe(m,!0),b=!1},kt=()=>{const m=[...g.values()];return m.length<2?0:Math.hypot(m[1].x-m[0].x,m[1].y-m[0].y)},Ge=()=>{if(l)return;l=!0;const m=u;e.readStats().then(v=>{if(m!==u)return;_t.textContent=v.magnetization.toFixed(3),Mt.textContent=v.energy.toFixed(3);const U=v.signedMagnetization===-1;!f&&b!==U&&(b=U,y=!0)}).catch(v=>{console.warn("Could not read Ising statistics.",v)}).finally(()=>{l=!1})},Lt=m=>{i=m,s=i,Pe(),y=!0};ye.addEventListener("input",()=>Lt(Number(ye.value))),vt.addEventListener("input",()=>Lt(Number(vt.value))),xe.addEventListener("input",()=>{n=Number(xe.value),t=n,Me=0,Se()});const Fe=(m,v)=>{const U=()=>{m.setAttribute("aria-pressed",String(v.size>0))},N=S=>{v.delete(`pointer:${S.pointerId}`),m.hasPointerCapture(S.pointerId)&&m.releasePointerCapture(S.pointerId),U()};m.addEventListener("pointerdown",S=>{S.pointerType==="mouse"&&S.button!==0||(S.preventDefault(),m.setPointerCapture(S.pointerId),v.add(`pointer:${S.pointerId}`),U())}),m.addEventListener("pointerup",N),m.addEventListener("pointercancel",N),m.addEventListener("lostpointercapture",S=>{v.delete(`pointer:${S.pointerId}`),U()}),m.addEventListener("keydown",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),v.add(`key:${S.code}`),U())}),m.addEventListener("keyup",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),v.delete(`key:${S.code}`),U())}),m.addEventListener("blur",()=>{for(const S of v)S.startsWith("key:")&&v.delete(S);U()})};Fe(yt,it),Fe(xt,nt),Fe(We,st),Fe(je,rt),bt.addEventListener("input",()=>{r=Number(bt.value),Tt()}),He.addEventListener("input",()=>{a=Number(He.value),lt(),y=!0});const Nt=()=>{ei.hidden=!Zt.checked};Zt.addEventListener("change",Nt),Nt(),window.addEventListener("keydown",m=>{m.code!=="BracketLeft"&&m.code!=="BracketRight"||(m.preventDefault(),a=Math.max(4,Math.min(100,a+(m.code==="BracketLeft"?-4:4))),lt(),y=!0)});const ut=m=>{h=m,Ue.classList.toggle("is-closed",!h),Ue.inert=!h,Ue.setAttribute("aria-hidden",String(!h)),Te.setAttribute("aria-expanded",String(h)),Te.setAttribute("aria-label",h?"Close settings":"Open settings")};Te.addEventListener("click",()=>ut(!h)),document.addEventListener("pointerdown",m=>{const v=m.target;!h||!(v instanceof Node)||Ue.contains(v)||Te.contains(v)||ut(!1)},{capture:!0}),document.addEventListener("click",m=>{const v=m.target;!h||!(v instanceof Node)||Te.contains(v)||(!Ue.contains(v)||v instanceof Element&&v.closest("button"))&&ut(!1)}),$e.addEventListener("click",()=>{c=!c;const m=c?"Resume simulation":"Pause simulation";$e.setAttribute("aria-pressed",String(c)),$e.setAttribute("aria-label",m),$e.title=m,E=0}),_n.addEventListener("click",()=>{e.randomize(),b=!1,E=0,u+=1,Ut(),_t.textContent="0.000",Mt.textContent="0.000",y=!0,Be(),Ge()}),Mn.addEventListener("click",()=>{e.clearBlue(),b=!0,E=0,u+=1,Ut(),_t.textContent="1.000",Mt.textContent="-2.000",y=!0,Be(),Ge()}),j.addEventListener("pointerdown",m=>{if(Ne(m)){if(j.setPointerCapture(m.pointerId),p=!0,m.pointerType==="touch"){g.set(m.pointerId,{x:m.clientX,y:m.clientY}),g.size===1?(z=!0,_=!1):g.size===2&&(f=!1,x=null,z=!1,_=!0,w=!0,B=kt(),G=s),y=!0;return}ct(m)}}),j.addEventListener("pointermove",m=>{if(Ne(m),p=!0,y=!0,m.pointerType==="touch"){if(!g.has(m.pointerId))return;if(g.set(m.pointerId,{x:m.clientX,y:m.clientY}),w&&g.size>=2){const v=kt();B>0&&v>0&&(s=Math.max(0,Math.min(3,G-Math.log2(v/B)*.9)));return}if(g.size===1&&!_){if(z)ct(m),z=!1;else if(f)for(const v of m.getCoalescedEvents())Oe(v,!1)}return}if(f){const v=m.getCoalescedEvents();if(v.length===0)Oe(m,!1);else for(const U of v)Oe(U,!1)}});const vi=m=>{m.pointerType==="touch"&&(z&&!_&&ct(m),g.delete(m.pointerId),g.size<2&&(w=!1),g.size===0&&(z=!1,_=!1,p=!1)),f=!1,x=null,j.hasPointerCapture(m.pointerId)&&j.releasePointerCapture(m.pointerId),y=!0,Ge()};j.addEventListener("pointerup",vi),j.addEventListener("pointercancel",m=>{g.delete(m.pointerId),f=!1,p=!1,x=null,z=!1,w=!1,y=!0}),j.addEventListener("pointerenter",()=>{p=!0,y=!0}),j.addEventListener("pointerleave",()=>{f||(p=!1,y=!0)}),j.addEventListener("wheel",m=>{m.preventDefault();const v=Math.max(-120,Math.min(120,m.deltaY));s=Math.max(0,Math.min(3,s+v*.00125)),Ne(m),p=!0},{passive:!1}),window.addEventListener("blur",()=>{f=!1,p=!1,x=null,g.clear(),w=!1,z=!1,it.clear(),nt.clear(),st.clear(),rt.clear(),Me=0,ot=0,yt.setAttribute("aria-pressed","false"),xt.setAttribute("aria-pressed","false"),We.setAttribute("aria-pressed","false"),je.setAttribute("aria-pressed","false"),y=!0}),window.addEventListener("resize",()=>Rt(!0)),Rt(!1),e.step(t,40),Se(),Tt(),lt(),y=!0,Be(),Ge();const Ot=m=>{const v=Math.max(0,(m-T)/1e3),U=Math.min(.1,v);T=m;const N=+(nt.size>0)-+(it.size>0);if(N!==0){const k=N<0?ke:ue,X=N*mi*U;i=N<0?Math.max(k,i+X):Math.min(k,i+X),s=i,Pe(),y=!0}else{const k=s-i;Math.abs(k)>5e-4?(i+=k*(1-Math.exp(-U*10)),Pe(),y=!0):i!==s&&(i=s,Pe(),y=!0)}const S=+(rt.size>0)-+(st.size>0);if(S!==ot&&(Me=0,ot=S),S!==0)t=gn(t,S,Me,U,zt,Et),Me+=U,Se();else{const k=n-t;Math.abs(k)>5e-4?(t+=k*(1-Math.exp(-U/pi)),Se()):t!==n&&(t=n,Se())}if(!c){E+=U*mn*r;const k=Math.min(8,Math.floor(E));k>0&&(E-=k,e.step(t,k),y=!0)}const J=Le()>=mt?1:0,se=J-I;Math.abs(se)>.001?(I+=se*(1-Math.exp(-U*7)),y=!0):I!==J&&(I=J,y=!0);const me=Le()>=mt?i:yi(),Ie=t>It?"chaos":"map",he=j.getBoundingClientRect(),Ve=D.advance(Math.min(.5,v),Ie,{width:he.width,height:he.height});if(Ct(Ve,v),y&&Be(),!C&&Ie==="map"&&m-L>280){L=m,C=!0;const k=A;e.readRegionSample(at(me),me).then(X=>{k!==A||!X||t>It||(ce=X,_e+=1,D.ingest(X,t))}).catch(X=>{console.warn("Could not read Ising regions.",X)}).finally(()=>{C=!1})}m-d>750&&(d=m,Ge()),requestAnimationFrame(Ot)};requestAnimationFrame(Ot)}Sn().catch(o=>{console.error(o),Je.hidden=!1,Je.textContent=o instanceof Error?o.message:"Could not start the WebGPU simulation."});
