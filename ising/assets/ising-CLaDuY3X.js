(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();async function Mi(){try{if(!navigator.gpu)return null;const r=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!r)return null;const e=await r.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(r){return console.error("WebGPU initialization failed.",r),null}}const Pi=`struct SimParams {
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
`,F=(r,e)=>Math.ceil(r/e),De=112,qe=128,Si=(r,e)=>r>=e?{width:De,height:Math.max(1,Math.round(De*e/r))}:{width:Math.max(1,Math.round(De*r/e)),height:De};class Bi{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,n){this.device=e,this.format=t,this.canvas=n;const i=n.getContext("webgpu");if(!i)throw new Error("Could not create a WebGPU canvas context.");this.context=i,this.context.configure({device:e,format:t,alphaMode:"opaque"});const s=e.createShaderModule({label:"Ising shaders",code:Pi});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:s,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:s,entryPoint:"fullscreen_vertex"},fragment:{module:s,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(o=>e.createBuffer({label:`Ising blur uniforms ${o}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(o=>e.createBuffer({label:`Ising label blur uniforms ${o}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:qe*qe*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:qe*qe*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,n,i=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=n;return}const s=this.width,o=this.height,a=this.spinBuffers,l=this.fieldTexture,u=this.blurTextures,d=this.labelBlurTextures,b=this.statsOutput,f=this.statsReadback,S=a?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=n,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),i&&S){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,s,o);const P=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:S}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),_=this.device.createCommandEncoder({label:"Resize Ising grid"}),v=_.beginComputePass();v.setPipeline(this.pipelines.resize),v.setBindGroup(0,P),v.dispatchWorkgroups(F(e,8),F(t,8)),v.end(),this.device.queue.submit([_.finish()])}else this.randomize();a&&this.retire({buffers:[a[0],a[1],...b?[b]:[]],readback:f??void 0,textures:[l,...u??[],...d??[]].filter(P=>!!P)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(F(this.width,8),F(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(F(this.width,8),F(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let n=0;n<t;n+=1){const i=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,i);const s=this.device.createCommandEncoder({label:"Advance Ising state"}),o=s.beginComputePass();o.setPipeline(this.pipelines.update),o.setBindGroup(0,this.updateGroups[this.currentIndex]),o.dispatchWorkgroups(F(this.width,8),F(this.height,8)),o.end(),this.device.queue.submit([s.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,n,i,s,o,a){const l=Math.floor(Math.min(e,n)-s),u=Math.floor(Math.min(t,i)-s),d=Math.ceil(Math.max(e,n)+s),b=Math.ceil(Math.max(t,i)+s),f=d-l+1,S=b-u+1;this.writeBrushParams(l,u,f,S,e,t,n,i,s,a);const P=this.device.createCommandEncoder({label:"Paint Ising spins"});if(o){const v=P.beginComputePass();v.setPipeline(this.pipelines.select),v.setBindGroup(0,this.selectGroups[this.currentIndex]),v.dispatchWorkgroups(1),v.end()}const _=P.beginComputePass();_.setPipeline(this.pipelines.paint),_.setBindGroup(0,this.paintGroups[this.currentIndex]),_.dispatchWorkgroups(F(f,8),F(S,8)),_.end(),this.device.queue.submit([P.finish()]),this.fieldDirty=!0}draw(e,t,n,i,s){if(!this.renderGroup||!this.observationReady())return;const o=this.secondaryObservationRadius(t,e),a=this.fieldDirty||t!==this.lastBlurRadius||o!==this.lastSecondaryRadius,l=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const d=l.beginComputePass();d.setPipeline(this.pipelines.field),d.setBindGroup(0,this.fieldGroups[this.currentIndex]),d.dispatchWorkgroups(F(this.width,8),F(this.height,8)),d.end(),this.fieldDirty=!1}a&&this.appendObservationBlur(l,t,o,"display"),this.writeRenderParams(e,t,n,i,s);const u=l.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});u.setPipeline(this.pipelines.render),u.setBindGroup(0,this.renderGroup),u.draw(3),u.end(),this.device.queue.submit([l.finish()])}async readRegionSample(e,t){const n=this.regionGroup;if(!n||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const i=Si(this.width,this.height),s=i.width*i.height;if(s*4>this.regionStorage.size)return null;const o=this.secondaryObservationRadius(e,t),a=e===this.lastBlurRadius&&o===this.lastSecondaryRadius,l=a?n:this.labelRegionGroup;if(!l)return null;const u=this.device.createCommandEncoder({label:"Read Ising regions"});a||this.appendObservationBlur(u,e,o,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([i.width,i.height,0,0]));const d=u.beginComputePass();d.setPipeline(this.pipelines.regions),d.setBindGroup(0,l),d.dispatchWorkgroups(F(i.width,8),F(i.height,8)),d.end(),u.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,s*4),this.device.queue.submit([u.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const b=new Int32Array(this.regionReadback.getMappedRange(),0,s),f=new Int8Array(s),S=new Float32Array(s);for(let P=0;P<s;P+=1)f[P]=b[P]<0?-1:1,S[P]=(Math.abs(b[P])-1)/65534;return{width:i.width,height:i.height,signs:f,luminance:S}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,n=this.statsGroups[this.currentIndex];if(!e||!t||!n)return{energy:0,magnetization:0,signedMagnetization:0};const i=F(this.width,16),s=F(this.height,16),o=new Uint32Array([this.width,this.height,i,0]);this.device.queue.writeBuffer(this.statsUniform,0,o);const a=this.device.createCommandEncoder({label:"Read Ising statistics"});a.clearBuffer(e);const l=a.beginComputePass();l.setPipeline(this.pipelines.stats),l.setBindGroup(0,n),l.dispatchWorkgroups(i,s),l.end(),a.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([a.finish()]),await t.mapAsync(GPUMapMode.READ);const u=new Int32Array(t.getMappedRange()),d=u[0],b=u[1];t.unmap();const f=this.width*this.height;return{magnetization:Math.abs(d/f),signedMagnetization:d/f,energy:b/f}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}))}writeSimParams(e,t,n,i,s=0,o=0){const a=new ArrayBuffer(32),l=new DataView(a);l.setUint32(0,this.width,!0),l.setUint32(4,this.height,!0),l.setUint32(8,e,!0),l.setUint32(12,t,!0),l.setFloat32(16,n,!0),l.setUint32(20,i,!0),l.setUint32(24,s,!0),l.setUint32(28,o,!0),this.device.queue.writeBuffer(this.simUniform,0,a)}writeBrushParams(e,t,n,i,s,o,a,l,u,d){const b=new ArrayBuffer(64),f=new DataView(b);f.setUint32(0,this.width,!0),f.setUint32(4,this.height,!0),f.setInt32(8,e,!0),f.setInt32(12,t,!0),f.setUint32(16,n,!0),f.setUint32(20,i,!0),f.setUint32(24,d?1:0,!0),f.setFloat32(32,s,!0),f.setFloat32(36,o,!0),f.setFloat32(40,a,!0),f.setFloat32(44,l,!0),f.setFloat32(48,u,!0),this.device.queue.writeBuffer(this.brushUniform,0,b)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,n,i){const s=i==="display",o=s?this.blurUniforms:this.labelBlurUniforms,a=s?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,l=s?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,u=s?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,d=s?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!l||!u||!d||a.length===0)return;this.writeBlurParams(o[0],t),this.writeBlurParams(o[1],n);const b=e.beginComputePass({label:"Horizontal Ising observation blur"});b.setPipeline(this.pipelines.blurSpinsHorizontal),b.setBindGroup(0,a[this.currentIndex]),b.dispatchWorkgroups(F(this.height,64)),b.end();const f=e.beginComputePass({label:"Vertical Ising observation blur"});if(f.setPipeline(this.pipelines.blurTextureVertical),f.setBindGroup(0,l),f.dispatchWorkgroups(F(this.width,64)),f.end(),n>0){const S=e.beginComputePass({label:"Secondary horizontal Ising blur"});S.setPipeline(this.pipelines.blurTextureHorizontal),S.setBindGroup(0,u),S.dispatchWorkgroups(F(this.height,64)),S.end();const P=e.beginComputePass({label:"Secondary vertical Ising blur"});P.setPipeline(this.pipelines.blurTextureVertical),P.setBindGroup(0,d),P.dispatchWorkgroups(F(this.width,64)),P.end()}s&&(this.lastBlurRadius=t,this.lastSecondaryRadius=n)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,n,i,s){const o=new Float32Array(16);o[0]=this.width,o[1]=this.height,o[2]=this.width,o[3]=this.height,o[4]=t,o[5]=e,o[6]=n,o[7]=s.active?1:0,o[8]=s.x*this.density,o[9]=s.y*this.density,o[10]=s.radius*this.density,o[11]=s.painting?1:0,o[12]=s.forceHot?1:0,o[13]=Math.max(.5,this.density*.5),o[14]=i,this.device.queue.writeBuffer(this.renderUniform,0,o)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const n of e.buffers)n.destroy();for(const n of e.textures??[])n.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const Gi={land:{dark:"#050302",light:"#ffd5a6"},water:{dark:"#06132e",light:"#c4eaff"}},ni=(r,e,t)=>Math.max(e,Math.min(t,r)),Ii=r=>r<=.04045?r/12.92:((r+.055)/1.055)**2.4,Dt=r=>{const e=[1,3,5].map(t=>Ii(parseInt(r.slice(t,t+2),16)/255));return e[0]*.2126+e[1]*.7152+e[2]*.0722},qt=(r,e)=>(Math.max(r,e)+.05)/(Math.min(r,e)+.05),Ke=(r,e)=>Gi[r==="lake"?"water":"land"][e],zi=(r,e,t,n)=>{const i=Ke(r,e),s=Ke(r,t);return`rgb(${[1,3,5].map(a=>{const l=parseInt(i.slice(a,a+2),16),u=parseInt(s.slice(a,a+2),16);return(l+(u-l)*n).toFixed(2)}).join(", ")})`},Ei=(r,e,t)=>{const n=r.angle*Math.PI/180,i=Math.cos(n),s=Math.sin(n),o=Dt(Ke(r.kind,"dark")),a=Dt(Ke(r.kind,"light")),l=[],u=[];for(let b=-1;b<=1;b+=1)for(let f=-4;f<=4;f+=1){const S=f*r.width*.105,P=b*r.height*.28,_=r.x+S*i-P*s,v=r.y+S*s+P*i,E=Math.max(0,Math.min(e.width-1,Math.floor(_/t.width*e.width))),A=Math.max(0,Math.min(e.height-1,Math.floor(v/t.height*e.height))),z=e.luminance[A*e.width+E];l.push(qt(z,o)),u.push(qt(z,a))}l.sort((b,f)=>b-f),u.sort((b,f)=>b-f);const d=Math.floor((l.length-1)*.25);return{dark:l[d],light:u[d]}},Ai=(r,e)=>{const t=r?r.darkContrast*.55+e.dark*.45:e.dark,n=r?r.lightContrast*.55+e.light*.45:e.light;let i=r?.mode??(t>=2.5||n<4.5?"dark":"light");const s=i==="dark"?n:t,a=(i==="dark"?t:n)<(i==="dark"?2.5:3)&&s>4.5?(r?.weakSamples??0)+1:0,l=a>=5;return l&&(i=i==="dark"?"light":"dark"),{mode:i,darkContrast:t,lightContrast:n,weakSamples:l?0:a,opacity:i==="dark"?ni(.82+(5-t)*.06,.82,1):1}},Ti=(r,e,t)=>r===void 0?e:r+(e-r)*(1-Math.exp(-ni(t,0,.5)/.8)),Ui=(r,e,t)=>{if(!r)return{from:e,to:e,progress:1,velocity:0};let n=r;if(n.from===n.to){if(e===n.to)return n;n={from:n.to,to:e,progress:0,velocity:0}}const i=e===n.to?1:0,s=Math.max(0,Math.min(t,1/60)),o=5,a=n.progress-i,l=n.velocity+o*a,u=Math.exp(-o*s),d=Math.max(0,Math.min(1,i+(a+l*s)*u)),b=(n.velocity-o*l*s)*u;return Math.abs(d-i)<.001&&Math.abs(b)<.02?{from:e,to:e,progress:1,velocity:0}:{...n,progress:d,velocity:b}},Ci=r=>r.from===r.to?{blend:1,opacity:1}:{blend:r.progress*r.progress*(3-2*r.progress),opacity:1};let ft=1;const Yt=new WeakMap,ze=r=>({value:r,revision:0}),H=r=>{if(r.ancestry)return r.ancestry;const e=Yt.get(r);if(e)return e;const t=r.chromosome.syllables.map(i=>({id:ft++,onset:ze(i.onset),vowel:ze(i.vowel),bridge:ze(i.bridge??"")})),n={syllables:t,order:t.map(i=>i.id),orderRevision:0,coda:{id:ft++,...ze(r.chromosome.coda)},ending:{id:ft++,...ze(r.chromosome.ending??"")}};return Yt.set(r,n),n},Gt=r=>({syllables:r.syllables.map(e=>({id:e.id,onset:{...e.onset},vowel:{...e.vowel},bridge:{...e.bridge}})),order:[...r.order],orderRevision:r.orderRevision,coda:{...r.coda},ending:{...r.ending}}),si=(r,e)=>{const t=Gt(H(r));r.ancestry=t;for(let n=0;n<r.chromosome.syllables.length;n+=1){const i=r.chromosome.syllables[n],s=e.syllables[n],o=t.syllables[n];for(const a of["onset","vowel","bridge"]){const l=i[a]??"";l!==(s[a]??"")&&(o[a]={value:l,revision:o[a].revision+1})}}for(const n of["coda","ending"]){const i=r.chromosome[n]??"";i!==(e[n]??"")&&(t[n]={id:t[n].id,value:i,revision:t[n].revision+1})}},ri=r=>{const e=r.filter(({weight:t})=>Number.isFinite(t)&&t>0);if(!e.length)throw new Error("Homologous inheritance needs a positive contribution");if(e.some(({origin:t})=>t.id!==e[0].origin.id))throw new Error("Cannot align unrelated gene origins");return e},oi=r=>{const e=Math.max(...r.map(i=>i.variant.revision)),t=new Map;for(const i of r){if(i.variant.revision!==e)continue;const s=i.variant.value;t.set(s,(t.get(s)??0)+i.weight)}return{value:[...t].sort((i,s)=>s[1]-i[1]||(i[0]<s[0]?-1:i[0]>s[0]?1:0))[0][0],revision:e}},Ri=r=>{const e=ri(r),t=n=>oi(e.map(({origin:i,weight:s})=>({variant:i[n],weight:s})));return{id:e[0].origin.id,onset:t("onset"),vowel:t("vowel"),bridge:t("bridge")}},ki=r=>{const e=ri(r);return{id:e[0].origin.id,...oi(e.map(({origin:t,weight:n})=>({variant:t,weight:n})))}},Ze=r=>(r.bridge??"")+r.onset,j=r=>`${r.syllables.map(e=>Ze(e)+e.vowel).join("")}${r.coda}${r.ending??""}`,Ce=["v","l","m","n","s","c","r","t","p","d","f","g","b"],ai=["br","cr","dr","gr","pr","tr","cl","fl","gl","pl","fr","st"],li=["","",...Ce,...ai,"qu"],ci=[...Ce,...ai],fe=["a","e","i","o","u"],ui=[...fe,"ae","au","oe"],hi=["n","r","s","l","m","t"],di=["a","us","um","is","or","ia","ea","ium","ius","aris","ensis"],Ni={"":["n","r","l","m","s","t"],b:["","m","r","l"],p:["","m","r","l"],d:["","n","r","l"],t:["","n","r","l","s","c"],c:["","n","r","s"],g:["","n","r","l"],f:["","r","l"],s:["","n","r","l"],m:["","r","l","m"],n:["","r","n"],l:["","l"],r:["","r"],v:["","l","r"],tr:["","s","n"],dr:["","n"],cr:[""],gr:[""],br:["","m"],pr:["","m"],cl:[""],fl:[""],gl:[""],pl:[""],fr:[""],st:["","n"]},Li=.035,fi=14,et=9,tt=10,ge=(r,e,t)=>Math.max(e,Math.min(t,r)),_e=r=>({...r,syllables:r.syllables.map(e=>({...e}))}),de=r=>ge(r(),0,1-Number.EPSILON),we=(r,e)=>e[Math.floor(de(r)*e.length)],ae=r=>({...r,chromosome:_e(r.chromosome),ancestry:Gt(H(r))}),pe=r=>Ni[r]??[""],Ye=(r,e)=>e===void 0?r<.012?1:r<.03?2:3:e===1?r>=.0132?2:1:e===2?r<.0108?1:r>=.033?3:2:r<.0108?1:r<.027?2:3,Oi=r=>.025*Math.exp(ge((r-2.27)*5,-12,12)),oe=(r,e)=>({syllables:r.syllables.slice(0,e).map(t=>({...t})),coda:e<3?Ze(r.syllables[e]).charAt(0):r.coda,ending:e===3?r.ending??"":""}),gi=r=>{const e=r.syllables[0];return e.onset.length+e.vowel.length<=3&&r.syllables.filter(t=>t.vowel.length>1).length<=1&&r.syllables.every((t,n)=>(t.onset!=="qu"||!["u","au","oe"].includes(t.vowel))&&(n===0?!t.bridge:pe(t.onset).includes(t.bridge??""))&&(n===0||t.onset!==r.syllables[n-1].onset||t.vowel!==r.syllables[n-1].vowel))&&j(r).length<=fi},It=r=>{const e=_e(r);e.syllables[0].bridge="";let t=0;for(let n=0;n<3;n+=1){const i=e.syllables[n];if((n===0&&i.onset.length+i.vowel.length>3||i.vowel.length>1&&t>0)&&(i.vowel=i.vowel.charAt(0)),i.onset==="qu"&&["u","au","oe"].includes(i.vowel)&&(i.vowel="a"),n>0&&!pe(i.onset).includes(i.bridge??"")){const s=pe(i.onset);i.bridge=s.includes("")?"":s[0]}i.vowel.length>1&&(t+=1)}for(;j(e).length>fi;){const n=e.syllables.slice(1).reverse().find(i=>i.bridge&&i.onset||i.onset.length>1||i.vowel.length>1);if(!n)break;n.bridge&&n.onset?n.bridge="":n.onset.length>1?n.onset=n.onset.charAt(0):n.vowel=n.vowel.charAt(0)}for(let n=1;n<3;n+=1){const i=e.syllables[n-1],s=e.syllables[n];i.onset===s.onset&&i.vowel===s.vowel&&(s.vowel=fe[(fe.indexOf(s.vowel.charAt(0))+2)%fe.length])}return e},Fi=r=>{const e=[];let t=!1;for(let n=0;n<3;n+=1){const i=we(r,n===0?li:ci),s=we(r,t||n===0&&i.length>1?fe:ui);t||=s.length>1,e.push({onset:i,vowel:s,bridge:n===0?"":we(r,pe(i))})}return ae({chromosome:It({syllables:e,coda:we(r,hi),ending:we(r,di)}),mutability:.75+de(r)*.5,cooldown:5+de(r)*5,generation:0})},pi=(r,e)=>{const t=[];for(let n=0;n<e;n+=1)t.push(n*3,n*3+1),n>0&&t.push(n*3+2);return e===3?t.push(et,tt):t.push(e*3+(r.syllables[e].bridge?2:0)),t},St=(r,e)=>{if(e===et)return r.coda;if(e===tt)return r.ending??"";const t=r.syllables[Math.floor(e/3)];return e%3===0?t.onset:e%3===1?t.vowel:t.bridge??""},Qe=(r,e,t)=>{if(e===et)r.coda=t;else if(e===tt)r.ending=t;else{const n=r.syllables[Math.floor(e/3)];e%3===0?n.onset=t:e%3===1?n.vowel=t:n.bridge=t}},mi=(r,e)=>{const t=e===et?hi:e===tt?di:e%3===2?pe(r.syllables[Math.floor(e/3)].onset):e%3===1?ui:e===0?li:ci;return[...new Set(t)].filter(n=>{if(n===St(r,e))return!1;const i=_e(r);return Qe(i,e,n),gi(i)})},Xt=(r,e,t,n=de(t)<Li)=>{const i=ae(r),s=pi(i.chromosome,e),o=n?Math.max(3,s.length-1):1;let a=0;for(;a<o&&s.length;){const[l]=s.splice(Math.floor(de(t)*s.length),1),u=j(oe(i.chromosome,e));let d=mi(i.chromosome,l).filter(b=>{const f=_e(i.chromosome);return Qe(f,l,b),j(oe(f,e))!==u});if(!n){const b=d.filter(f=>f.length===St(i.chromosome,l).length);d=b.length?b:d.filter(f=>Math.abs(f.length-St(i.chromosome,l).length)<=1)}d.length&&(Qe(i.chromosome,l,we(t,d)),a+=1)}return i.mutability=ge(i.mutability*(1+(de(t)-.5)*.08),.5,1.5),i.cooldown=ge(i.cooldown+(de(t)-.5)*.4,5,10),si(i,r.chromosome),i},Bt=(r,e,t)=>{if(e===3){r.coda=t;return}const n=r.syllables[e];n.onset.startsWith(t)?n.bridge="":pe(n.onset).includes(t)?n.bridge=t:(n.bridge="",n.onset=t)},Ht=(r,e,t,n,i,s=!1)=>{const o=l=>{const u=j(oe(l.chromosome,e));return gi(l.chromosome)&&(u!==n||s)&&(!t?.has(u)||s&&u===n)&&(!i||u.startsWith(i))},a=l=>(si(l,r.chromosome),l);if(o(r))return r;for(const l of[...pi(r.chromosome,e)].reverse())for(const u of mi(r.chromosome,l)){const d=ae(r);if(Qe(d.chromosome,l,u),o(d))return a(d)}if(i&&e>1)for(const l of fe)for(const u of Ce){const d=ae(r);if(d.chromosome.syllables[e-1].vowel=l,Bt(d.chromosome,e,u),o(d))return a(d)}for(const l of Ce)for(const u of fe)for(const d of Ce){const b=ae(r);if(b.chromosome.syllables[0]={onset:l,vowel:u,bridge:""},Bt(b.chromosome,e,d),o(b))return a(b)}return null},Vi=(r,e)=>{const t=pe(e.onset);return t.includes(r)?r:r==="n"&&t.includes("m")?"m":e.bridge&&t.includes(e.bridge)?e.bridge:t.find(n=>n==="r"||n==="l"||n==="n")??""},Di=(r,e)=>{const t=r.filter(p=>p.weight>0).sort((p,y)=>y.weight-p.weight||H(p.genes).order.join(",").localeCompare(H(y.genes).order.join(","))),n=t.reduce((p,y)=>p+y.weight,0),i=new Set(t),s=[];for(;i.size;){const p=[i.values().next().value];i.delete(p[0]);const y=new Set(H(p[0].genes).order);for(let c=!0;c;){c=!1;for(const h of i){const m=H(h.genes).syllables.map(({id:w})=>w);m.some(w=>y.has(w))&&(p.push(h),i.delete(h),m.forEach(w=>y.add(w)),c=!0)}}s.push(p)}const o=(p,y)=>{const c=new Map;for(const m of p){const w=H(m.genes)[y],B=c.get(w.id)??[];B.push({origin:w,weight:m.weight}),c.set(w.id,B)}const h=[...c.values()].sort((m,w)=>w.reduce((B,x)=>B+x.weight,0)-m.reduce((B,x)=>B+x.weight,0)||m[0].origin.id-w[0].origin.id);return ki(h[0])},a=s.map(p=>{const y=[...p].sort((x,I)=>H(I.genes).orderRevision-H(x.genes).orderRevision||I.weight-x.weight||H(x.genes).order.join(",").localeCompare(H(I.genes).order.join(","))),c=H(y[0].genes).order,h=new Map,m=[];for(const x of y){const I=H(x.genes),C=p.length===1?I.syllables.map(({id:T})=>T):I.order;for(const T of C)m.includes(T)||m.push(T);for(const T of I.syllables){const R=h.get(T.id)??[];R.push({origin:T,weight:x.weight}),h.set(T.id,R)}}const w=m.map(x=>{const I=h.get(x),C=Ri(I),T=p.length===1?{...p[0].genes.chromosome.syllables.find((R,N)=>H(p[0].genes).syllables[N].id===x)}:{onset:C.onset.value,vowel:C.vowel.value,bridge:C.bridge.value};return{origin:C,sound:T,shared:I.length>1,support:I.reduce((R,N)=>R+N.weight,0)}}),B=[...w].sort((x,I)=>Number(I.shared)-Number(x.shared)||Number(c.includes(I.origin.id))-Number(c.includes(x.origin.id))||I.support-x.support||m.indexOf(x.origin.id)-m.indexOf(I.origin.id));return{material:w,priorities:B,weight:p.reduce((x,I)=>x+I.weight,0),coda:o(p,"coda"),ending:o(p,"ending")}}),l=a.map(p=>p.weight/n*e),u=l.map(Math.floor),d=a.map((p,y)=>y).sort((p,y)=>l[y]-u[y]-(l[p]-u[p])||p-y);for(let p=e-u.reduce((c,h)=>c+h,0),y=0;p>0;p-=1,y+=1)u[d[y]]+=1;const b=[...u];for(;u.reduce((p,y)=>p+y,0)<3;){const p=a.map((y,c)=>c).sort((y,c)=>a[c].weight/n*3-u[c]-(a[y].weight/n*3-u[y])||y-c).find(y=>u[y]<a[y].material.length);u[p]+=1}const f=a.map((p,y)=>{const c=new Set(p.priorities.slice(0,u[y]));return p.material.filter(h=>c.has(h))}),S=[];f.forEach((p,y)=>p.slice(0,b[y]).forEach(c=>S.push({family:y,part:c}))),f.forEach((p,y)=>p.slice(b[y]).forEach(c=>S.push({family:y,part:c})));const P=[];let _="";S.forEach(({family:p,part:y},c)=>{const h=a[p],m={...y.sound};c>0&&S[c-1].family!==p&&(m.bridge=Vi(_,m)),P.push(m);const w=h.material[h.material.indexOf(y)+1];_=w?Ze(w.sound).charAt(0):h.coda.value});const v=a[S[2].family],E=S.map(({part:p})=>p.origin.id),A=t.map(({genes:p})=>H(p)).filter(p=>p.order.every((y,c)=>y===E[c])),z={syllables:S.map(({part:p})=>p.origin),order:E,orderRevision:A.length?Math.max(...A.map(p=>p.orderRevision)):Math.max(...t.map(({genes:p})=>H(p).orderRevision))+1,coda:v.coda,ending:v.ending};return{chromosome:It({syllables:P,coda:v.coda.value,ending:v.ending.value}),ancestry:Gt(z),mutability:t.reduce((p,y)=>p+y.genes.mutability*y.weight,0)/n,cooldown:ge(t.reduce((p,y)=>p+y.genes.cooldown*y.weight,0)/n,5,10),generation:Math.max(...t.map(p=>p.genes.generation))+1}};class qi{genes;genome;pending=null;nextChangeAt;rng;exposure=0;capacity;inheritance=null;inheritanceKey="";get hereditary(){const e=this.pending?.cause==="recombination"?this.pending.genes:this.inheritance;if(!e)return{genes:ae(this.genes),genome:_e(this.genome)};const t=this.pending?.cause==="recombination"?this.pending.capacity:this.capacity;return{genes:ae(e),genome:oe(e.chromosome,t)}}constructor(e){this.rng=e.rng??Math.random,this.capacity=Ye(e.areaFraction);let t;if(e.parent){t=ae(e.parent);const n=Math.abs(e.fragment??0)%(4-this.capacity);if(t.chromosome.syllables=[...t.chromosome.syllables.slice(n),...t.chromosome.syllables.slice(0,n)],t.ancestry.syllables=[...t.ancestry.syllables.slice(n),...t.ancestry.syllables.slice(0,n)],this.capacity<3){const i=n+this.capacity<3?Ze(e.parent.chromosome.syllables[n+this.capacity]).charAt(0):e.parent.chromosome.coda;Bt(t.chromosome,this.capacity,i)}t.chromosome=It(t.chromosome),t.generation+=1,t=Xt(t,this.capacity,this.rng)}else t=Fi(this.rng);this.genes=Ht(t,this.capacity,e.banned)??t,this.genome=oe(this.genes.chromosome,this.capacity),this.nextChangeAt=e.now+this.genes.cooldown}recombine(e,t){const n=e.filter(o=>o.weight>0);if(n.length<2)return;const i=`${Ye(t)}:`+n.map(({genes:o,genome:a,weight:l})=>`${j(o.chromosome)}:${j(a??o.chromosome)}:${JSON.stringify(H(o))}:${l}`).join("|");if(i===this.inheritanceKey)return;this.inheritanceKey=i;const s=Ye(t);this.inheritance=Di(n,s),this.pending={genes:this.inheritance,genome:oe(this.inheritance.chromosome,s),capacity:s,cause:"recombination"}}propose(e){const{areaFraction:t,temperature:n,elapsed:i,now:s,banned:o}=e,a=ge(Math.sqrt(.055/Math.max(t,.001)),.5,2);this.exposure=Math.min(1,this.exposure+Math.max(0,i)*Oi(n)*this.genes.mutability*a);const l=Ye(t,this.capacity);if(l===this.capacity&&(this.pending?.cause==="growth"||this.pending?.cause==="shrink")&&(this.pending=null),(l!==this.capacity||this.inheritance)&&this.pending?.capacity!==l){const u=this.inheritance??this.genes;this.pending={genes:u,genome:oe(u.chromosome,l),capacity:l,cause:this.inheritance?"recombination":l<this.capacity?"shrink":"growth"}}if(!this.pending&&this.exposure>=1-1e-10){const u=Xt(this.genes,this.capacity,this.rng);this.pending={genes:u,genome:oe(u.chromosome,this.capacity),capacity:this.capacity,cause:"mutation"}}if(this.pending){const u=Ht(this.pending.genes,this.pending.capacity,o,j(this.genome),this.pending.cause==="growth"?j(this.genome):void 0,this.pending.cause==="recombination");if(!u)return null;u!==this.pending.genes&&(this.pending={...this.pending,genes:u,genome:oe(u.chromosome,this.pending.capacity)})}return s+1e-10>=this.nextChangeAt?this.pending:null}reject(e){e!==this.pending||e.cause!=="mutation"||(this.pending=null,this.exposure=0)}commit(e,t){if(e!==this.pending||t+1e-10<this.nextChangeAt)return;const n=j(e.genome)!==j(this.genome);this.genes=ae(e.genes),this.genome=_e(e.genome),this.capacity=e.capacity,this.pending=null,this.inheritance=null,n&&(this.exposure=0,this.nextChangeAt=t+ge(this.genes.cooldown,5,10))}}const $t=.7,gt=5,Yi=2.27,Xi=.0025,Hi=.004,$i=.055,Wt=1/2,Wi=48,pt=1.35,ji=.16,Ki=9,V=8,ie=64,ne=80,jt=20,Kt=.12,Qt=.22,Qi=.05,Ji=.12,Zi=.85,en=.25,tn=3,Jt=8,nn=1.8,sn=140,rn=28,on=160,an=2,ln='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',te=(r,e,t)=>Math.max(e,Math.min(t,r)),Ee=(r,e,t,n)=>r+(e-r)*(1-Math.exp(-t/n)),ye=r=>r==="island"||r==="continent",re=r=>r*ji,Xe=(r,e,t)=>r+(e-r)*t,Ae=(r,e)=>{const t=Math.abs(r-e)%180;return Math.min(t,180-t)},cn=(r,e,t,n)=>{const i=2/Zi,s=(t-r)*i*i-2*i*e,o=e+s*n;return{value:r+o*n,velocity:o}},un=r=>[{x:r.x,y:r.y}];class hn{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;lastNameTime=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1,this.lastNameTime=-1}advance(e,t,n){this.applyViewport(n);const i=te(e,0,.5);t!=="map"&&(this.synced=!1);for(const o of this.tracks.values()){const a=t==="map"&&o.confirmed&&o.missing===0;o.agreement=Ee(o.agreement,a?1:0,i,$t),o.stability=Ee(o.stability,a?o.agreement:0,i,$t);const l=o.placement;l?.alive&&o.present&&this.glide(o,l,i);const u=l?[l,...o.ghosts]:o.ghosts;for(const d of u){const b=t==="map"&&this.synced&&o.present&&o.confirmed&&o.missing<.75&&d.alive;d.opacity=Ee(d.opacity,b?o.stability:0,i,b?.25:.45)}l&&!l.alive&&l.opacity<.02&&(o.placement=null),o.ghosts=o.ghosts.filter(d=>d.opacity>=.02)}const s=this.collect(i);return t==="chaos"&&s.length===0&&this.reset(),s}ingest(e,t=Yi,n){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const i=performance.now()/1e3,s=this.lastIngest<0?0:Math.min(2,i-this.lastIngest);this.lastIngest=i;const o=n??i,a=this.lastNameTime<0?0:n===void 0?s:Math.max(0,o-this.lastNameTime);this.lastNameTime=o;for(const c of this.tracks.values())c.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const c=[];for(const h of this.tracks.values()){h.soft&&(h.soft=this.regridFloat(h.soft,this.width,this.height,e.width,e.height)),h.lastMask&&(h.lastMask=this.regrid(h.lastMask,this.width,this.height,e.width,e.height));const m=h.placement?[h.placement,...h.ghosts]:h.ghosts;for(const w of m){const B=w.mask===w.regionMask;w.mask=this.regrid(w.mask,this.width,this.height,e.width,e.height),w.regionMask=B?w.mask:this.regrid(w.regionMask,this.width,this.height,e.width,e.height),c.push(w.mask),B||c.push(w.regionMask)}}this.width=e.width,this.height=e.height;for(const h of c)this.remember(h)}const u=this.components(e.signs).filter(c=>c.role==="place").sort((c,h)=>h.area-c.area).slice(0,Wi),d=[],b=[],f=(c,h,m)=>{const w=h.placement?.alive?{x:h.placement.position.x/this.viewport.width,y:h.placement.position.y/this.viewport.height}:h.center;return{region:c,track:h,overlap:m,distance:this.distance(w,u[c].center)}};for(let c=0;c<u.length;c+=1){const h=new Map;for(const m of u[c].cells){const w=this.owners[m];w&&h.set(w,(h.get(w)??0)+1)}for(const[m,w]of h){const B=this.tracks.get(m);!B||ye(B.kind)!==u[c].sign>0||w<=0||d.push(f(c,B,w))}b.push(h)}const S=new Set,P=new Set,_=[],v=c=>{c.sort((h,m)=>m.overlap-h.overlap||h.distance-m.distance||h.track.id-m.track.id);for(const h of c)S.has(h.region)||P.has(h.track.id)||(S.add(h.region),P.add(h.track.id),_.push({track:h.track,region:u[h.region],overlap:h.overlap}))};v(d);const E=[];for(const c of this.tracks.values())if(!(P.has(c.id)||!c.lastMask||c.missing>=gt))for(let h=0;h<u.length;h+=1){if(S.has(h)||ye(c.kind)!==u[h].sign>0)continue;const m=u[h].bounds;if(c.bounds.x1<=m.x0||m.x1<=c.bounds.x0||c.bounds.y1<=m.y0||m.y1<=c.bounds.y0)continue;let w=0;for(const B of u[h].cells)w+=c.lastMask[B]??0;w>0&&E.push(f(h,c,w))}v(E);const A=[];for(const c of this.tracks.values())if(!(P.has(c.id)||c.missing>=gt))for(let h=0;h<u.length;h+=1){const m=u[h];if(S.has(h)||ye(c.kind)!==m.sign>0)continue;const w=Math.min(c.area,m.area)/Math.max(c.area,m.area),B=Math.max(0,c.bounds.x0-m.bounds.x1,m.bounds.x0-c.bounds.x1)*this.width,x=Math.max(0,c.bounds.y0-m.bounds.y1,m.bounds.y0-c.bounds.y1)*this.height,I=Math.hypot((c.center.x-m.center.x)*this.width,(c.center.y-m.center.y)*this.height),C=Math.sqrt(Math.min(c.area,m.area)/Math.PI);w>=.5&&Math.hypot(B,x)<=1.5&&I<=Math.max(3,C*1.25)&&A.push(f(h,c,0))}v(A);const z=new Set;for(const c of this.tracks.values()){let h=0;for(let m=0;m<u.length;m+=1)ye(c.kind)===u[m].sign>0&&(b[m].get(c.id)??0)>=u[m].area*.5&&(h+=1);h>1&&z.add(c.id)}const p=new Map([...this.tracks].map(([c,h])=>[c,h.name.hereditary]));for(let c=0;c<u.length;c+=1){if(S.has(c))continue;const h=u[c];if(!h.kind)continue;const m=[...b[c]].filter(([R,N])=>z.has(R)&&N>=h.area*.5&&ye(this.tracks.get(R).kind)===h.sign>0).sort((R,N)=>N[1]-R[1]).map(([R])=>this.tracks.get(R)).find(R=>R!==void 0),w=this.nextTrackId++,B=m?u.filter((R,N)=>(b[N].get(m.id)??0)>=R.area*.5).sort((R,N)=>R.center.x-N.center.x||R.center.y-N.center.y):[],x=new qi({areaFraction:h.area/e.signs.length,now:o,banned:this.usedStems,parent:m?p.get(m.id)?.genes:void 0,fragment:B.indexOf(h)}),I=j(x.genome);this.usedStems.add(I);const C=this.nameText(x.genome),T={id:w,stem:I,name:x,kind:h.kind,text:C,area:h.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:h.center,bounds:h.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(T.id,T),_.push({track:T,region:h,overlap:0})}for(const{track:c,region:h}of _){const m=u.indexOf(h),w=[...b[m]].filter(([B,x])=>{const I=this.tracks.get(B);if(!I||ye(I.kind)!==h.sign>0)return!1;const C=I.name.genome.syllables.length*2+1;return x/h.area>=.5/C}).map(([B,x])=>({track:this.tracks.get(B),weight:x})).sort((B,x)=>x.weight-B.weight||+(x.track===c)-+(B.track===c)||B.track.id-x.track.id);w.length>1&&c.name.recombine(w.map(({track:B,weight:x})=>({...p.get(B.id),weight:x})),h.area/e.signs.length)}const y=new Uint16Array(e.signs.length);for(const{track:c,region:h,overlap:m}of _){if(c.present=!0,m>0){const w=m/Math.min(c.area,h.area);c.agreement=Math.min(c.agreement,.65+.35*w)}c.area=h.area,c.center=h.center,c.bounds=h.bounds,c.missing=0,c.confirmed=!0;for(const w of h.cells)y[w]=c.id}this.owners=y;for(const c of[...this.tracks.values()])_.some(h=>h.track===c)||(c.missing+=s,c.confirmed=!1,c.missing>gt&&(this.tracks.delete(c.id),this.usedStems.delete(c.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}for(const{track:c,region:h}of _){const m=this.allowedMask(h),w=c.name.propose({areaFraction:h.area/e.signs.length,temperature:t,elapsed:a,now:o,banned:this.usedStems});w&&this.rename(c,w,m,o),c.lastMask=m,this.remember(m),this.smooth(c,m,s),this.aim(c,m,s)}this.synced=!0}nameText(e){const t=j(e);return t.charAt(0).toUpperCase()+t.slice(1)}rename(e,t,n,i){const s=j(t.genome);if(i<e.name.nextChangeAt||s!==e.stem&&this.usedStems.has(s))return!1;if(s===e.stem)return e.name.commit(t,i),!0;const o=this.nameText(t.genome),a=e.placement;return a?.alive&&(!this.fitsPose(n,o,this.snapshot(a))||!this.fitsPose(a.mask,o,this.snapshot(a)))?!1:(this.usedStems.delete(e.stem),this.usedStems.add(s),e.name.commit(t,i),e.stem=s,e.text=o,!0)}aim(e,t,n){const i=this.viewport.width*this.viewport.height/t.length,s=te(Math.sqrt(e.area*i/(Math.max(4,e.text.length)*3.2)),V,ie);e.styleFont=e.styleFont===0?s:Ee(e.styleFont,s,n,2.5);const o=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),a=e.placement?.alive?e.placement:null,l=a?.angle??0,u=e.name.pending?this.nameText(e.name.pending.genome):null,d=u&&this.boxWidth(u,V,re(V))>this.boxWidth(e.text,V,re(V))?u:e.text,b=(w,B)=>Math.max(.01,o.quality[w]+.12*B.font/e.styleFont-Qi*Math.abs(B.angle)/ne-Ji*o.elongation[w]*Ae(B.angle,o.axis[w])/ne),f=w=>{const B=[];for(const x of o.candidates){const I=this.cellPoint(x);if(B.some(T=>this.distance(T.pose,I)<o.radius*.55))continue;const C=this.poseAt(w,t,I,e.styleFont,l,o.axis[x],o.elongation[x]);if(C&&(B.push({pose:C,quality:b(x,C)}),B.length>=24))break}if(a){const x=this.index(a.position);if(x>=0&&o.centerX[x]>0){const I={x:o.centerX[x],y:o.centerY[x]},C=this.index(I),T=C<0?null:this.poseAt(w,t,I,e.styleFont,l,o.axis[C],o.elongation[C]);T&&C>=0&&B.push({pose:T,quality:b(C,T)})}}return B};let S=f(d);if(S.length===0&&d!==e.text&&(e.name.pending&&e.name.reject(e.name.pending),S=f(e.text)),S.length===0){a&&this.release(e);return}S.sort((w,B)=>B.quality-w.quality);const P=S[0];if(!a){e.placement=this.spawn(P.pose,t);return}const _=S.filter(w=>this.distance(w.pose,a.position)<=o.radius*1.5).sort((w,B)=>B.quality-this.distance(B.pose,a.position)/(o.radius*16)-(w.quality-this.distance(w.pose,a.position)/(o.radius*16)))[0],v=this.index(a.position),E=_?.quality??(v>=0?o.quality[v]:0),A=P.quality>E*an,z=_&&P.quality<=_.quality*1.08?_:P,p=this.snapshot(a),y=this.distance(p,z.pose)<=o.radius*1.5;let c=t,h=!1;if(!this.fitsPose(t,e.text,p)&&(c=this.union(a.regionMask,t),this.remember(c),!this.fitsPose(c,e.text,p)&&y&&a.mask!==a.regionMask&&(c=this.union(a.mask,t),this.remember(c),h=!0),!this.fitsPose(c,e.text,p))){this.relight(e,z.pose,t);return}let m=this.planRoute(e.text,c,p,z.pose);if(!m&&c!==t&&y&&!h&&a.mask!==a.regionMask){const w=this.union(a.mask,t);if(this.remember(w),this.fitsPose(w,e.text,p)){const B=this.planRoute(e.text,w,p,z.pose);B&&(c=w,m=B)}}if(!m){(c!==t||A&&this.distance(p,z.pose)>o.radius*1.5)&&this.relight(e,z.pose,t);return}a.mask=c,a.regionMask=t,a.target=z.pose,a.route=m}poseAt(e,t,n,i,s,o,a){const l=this.index(n);if(l<0||!t[l])return null;let u=null,d=-1/0;const b=this.maxFont(t,e,n,0);if(b>=V){const f=Math.min(i,Math.max(V,b*.9));u={x:n.x,y:n.y,font:f,angle:0},d=f/i-Qt*a*Ae(0,o)/ne-.02*Ae(0,s)/ne}for(let f=jt;f<=ne;f+=jt){const S=Math.min(i,ie*.9)/i-Kt*f/ne;if(d>=S)break;for(const P of[-f,f]){const _=this.maxFont(t,e,n,P);if(_<V)continue;const v=Math.min(i,Math.max(V,_*.9)),E=v/i-Kt*f/ne-Qt*a*Ae(P,o)/ne-.02*Ae(P,s)/ne;E>d&&(u={x:n.x,y:n.y,font:v,angle:P},d=E)}}return u}landscape(e,t,n,i,s){const o=this.width+1,a=o*(this.height+1),l=new Float64Array(a),u=new Float64Array(a),d=new Float64Array(a),b=new Float64Array(a),f=new Float64Array(a),S=new Float64Array(a),P=new Float32Array(e.length),_=new Float32Array(e.length),v=new Float32Array(e.length),E=new Float32Array(e.length),A=new Float32Array(e.length),z=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),p=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(i*3.5,Math.sqrt(s*z*z)*.33,z*3)),y=Math.max(1,Math.ceil(p*this.width/this.viewport.width)),c=Math.max(1,Math.ceil(p*this.height/this.viewport.height));for(let x=0;x<this.height;x+=1){let I=0,C=0,T=0,R=0,N=0,K=0;for(let Y=0;Y<this.width;Y+=1){const Q=Y+x*this.width,ee=e[Q]*(.85+.15*n[Q])*te(t[Q]*z/(i*2),0,1),q=this.cellPoint(Q);I+=ee,C+=ee*q.x,T+=ee*q.y,R+=ee*q.x*q.x,N+=ee*q.y*q.y,K+=ee*q.x*q.y;const D=(x+1)*o+Y+1;l[D]=l[D-o]+I,u[D]=u[D-o]+C,d[D]=d[D-o]+T,b[D]=b[D-o]+R,f[D]=f[D-o]+N,S[D]=S[D-o]+K}}const h=(x,I,C,T,R)=>x[R*o+T]-x[C*o+T]-x[R*o+I]+x[C*o+I],m=l[a-1],w=m>0?{x:u[a-1]/m,y:d[a-1]/m}:{x:this.viewport.width/2,y:this.viewport.height/2},B=[];for(let x=0;x<e.length;x+=1){if(!e[x])continue;const I=x%this.width,C=Math.floor(x/this.width),T=Math.max(0,I-y),R=Math.max(0,C-c),N=Math.min(this.width,I+y+1),K=Math.min(this.height,C+c+1),Y=h(l,T,R,N,K);if(Y<=0)continue;_[x]=h(u,T,R,N,K)/Y,v[x]=h(d,T,R,N,K)/Y;const Q=Math.max(0,h(b,T,R,N,K)/Y-_[x]**2),ee=Math.max(0,h(f,T,R,N,K)/Y-v[x]**2),q=h(S,T,R,N,K)/Y-_[x]*v[x],D=Math.hypot(Q-ee,2*q);E[x]=.5*Math.atan2(2*q,Q-ee)*180/Math.PI,A[x]=te(D/(Q+ee+1),0,1);const me=Y/((y*2+1)*(c*2+1)),ce=te(t[x]*z/(i*2),0,1);P[x]=.7*me+.3*ce-.08*this.distance(this.cellPoint(x),w)/p,B.push(x)}return B.sort((x,I)=>P[I]-P[x]),{quality:P,centerX:_,centerY:v,axis:E,elongation:A,candidates:B,radius:p}}union(e,t){const n=new Uint8Array(t.length);for(let i=0;i<n.length;i+=1)n[i]=e[i]|t[i];return n}planRoute(e,t,n,i){if(this.posesFit(t,e,n,i))return[i];let s=Math.min(n.font,i.font);for(let o=0;o<9;o+=1){s=Math.max(V,s);for(const a of[...new Set([n.angle,i.angle,0])]){const l={...n,font:s},u={...l,angle:a},d={...i,font:s,angle:a},b={...i,font:s};if(!this.posesFit(t,e,n,l)||!this.posesFit(t,e,l,u)||!this.posesFit(t,e,d,b)||!this.posesFit(t,e,b,i))continue;const f=[];if(Math.abs(n.font-s)>.05&&f.push(l),Math.abs(n.angle-a)>.05&&f.push(u),this.posesFit(t,e,u,d))return f.push(d),Math.abs(i.angle-a)>.05&&f.push(b),f.push(i),f;const S=this.legalPath(e,t,u,d);if(!S)continue;let P=u,_=!0;for(let v=0;v<S.length;){let E=-1;for(let z=S.length-1;z>=v;z-=1){const y={...this.cellPoint(S[z]),font:s,angle:a};if(this.posesFit(t,e,P,y)){E=z;break}}if(E<0){_=!1;break}const A={...this.cellPoint(S[E]),font:s,angle:a};this.distance(P,A)>.5&&f.push(A),P=A,v=E+1}if(!(!_||!this.posesFit(t,e,P,d)))return this.distance(P,d)>.5&&f.push(d),Math.abs(i.angle-a)>.05&&f.push(b),f.push(i),f}if(s<=V)break;s=Math.max(V,s*.82)}return null}legalPath(e,t,n,i){const s=new Uint8Array(t.length),o=_=>{if(s[_]===0){const v={...this.cellPoint(_),font:n.font,angle:n.angle};s[_]=t[_]&&this.fitsPose(t,e,v)?1:2}return s[_]===1},a=_=>{const v=this.index(_);if(v<0)return-1;const E=v%this.width,A=Math.floor(v/this.width);for(let z=0;z<=3;z+=1)for(let p=-z;p<=z;p+=1)for(let y=-z;y<=z;y+=1){const c=E+y,h=A+p;if(c<0||h<0||c>=this.width||h>=this.height)continue;const m=c+h*this.width;if(o(m)&&this.posesFit(t,e,_,{...this.cellPoint(m),font:n.font,angle:n.angle}))return m}return-1},l=a(n),u=a(i);if(l<0||u<0)return null;const d=new Int32Array(t.length).fill(-1),b=new Int32Array(t.length);let f=0,S=0;for(b[S++]=l,d[l]=l;f<S&&d[u]<0;){const _=b[f++],v=_%this.width,E=Math.floor(_/this.width);for(const A of[v>0?_-1:-1,v+1<this.width?_+1:-1,E>0?_-this.width:-1,E+1<this.height?_+this.width:-1])A<0||d[A]>=0||!o(A)||(d[A]=_,b[S++]=A)}if(d[u]<0)return null;const P=[];for(let _=u;_!==l;_=d[_])P.push(_);return P.push(l),P.reverse(),P}glide(e,t,n){if(n<=0)return;const i=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,i)){const h=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,h<V){t.fontVelocity=0;return}const m=cn(t.font,t.fontVelocity,Math.min(t.target.font,h),n);t.font=Math.max(h,Math.min(t.font,m.value)),t.fontVelocity=t.font<=h?0:m.velocity;return}for(;t.route.length>1&&this.distance(i,t.route[0])<.75&&Math.abs(i.font-t.route[0].font)<.15&&Math.abs(i.angle-t.route[0].angle)<.3;)t.route.shift();const s=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,i,s)&&this.distance(i,s)<.2&&Math.abs(i.font-s.font)<.05&&Math.abs(i.angle-s.angle)<.05){t.position={x:s.x,y:s.y},t.font=s.font,t.angle=s.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const a=!this.fitsPose(t.regionMask,e.text,i)?1:tn,l=sn/a,u=rn/a,d=on/a,b=this.distance(i,s),f=b/l,S=Math.abs(s.font-i.font)/u,P=Math.abs(s.angle-i.angle)/d,_=Math.max(f,S,P);let v=0;_===f&&b>0?v=((s.x-i.x)*t.velocity.x+(s.y-i.y)*t.velocity.y)/b/l:_===S&&S>0?v=Math.sign(s.font-i.font)*t.fontVelocity/u:P>0&&(v=Math.sign(s.angle-i.angle)*t.angleVelocity/d),v=te(v,-1,1);const E=2/(en*a),A=te(E*E*_-2*E*v,-Jt,Jt),z=te(v+A*n,-1,1),p=Math.min(_,(v+z)*n/2);let y=this.lerpPose(i,s,_>0?p/_:1);if(!(p<0?this.posesFit(t.mask,e.text,i,y):this.fitsPose(t.mask,e.text,y))){const h=this.longestLegal(e.text,t.mask,i,y);if(!h){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}y=h}const c=n>0?1/n:0;t.position={x:y.x,y:y.y},t.velocity={x:(y.x-i.x)*c,y:(y.y-i.y)*c},t.font=y.font,t.fontVelocity=(y.font-i.font)*c,t.angle=y.angle,t.angleVelocity=(y.angle-i.angle)*c}collect(e){const t=[];for(const s of this.tracks.values()){const o=s.placement?[s.placement,...s.ghosts]:s.ghosts;for(const a of o)a.opacity<.015||this.fitsPose(a.mask,s.text,this.snapshot(a))&&t.push({track:s,placement:a})}t.sort((s,o)=>o.track.area-s.track.area);const n=[],i=[];for(const s of t){const{track:o,placement:a}=s,l=n.some(d=>d.track!==o&&this.overlaps(o.text,this.snapshot(a),d.track.text,this.snapshot(d.placement)));a.collisionOpacity=Ee(a.collisionOpacity,l?0:1,e,l?.3:.7),l||n.push(s);const u=a.opacity*a.collisionOpacity;u<.015||i.push({id:a.id,kind:o.kind,text:o.text,x:a.position.x,y:a.position.y,width:this.boxWidth(o.text,a.font,re(a.font)),height:a.font*pt,opacity:u,fontSize:a.font,letterSpacing:re(a.font),angle:a.angle})}return i}relight(e,t,n){const i=e.placement;if(i){const s=this.snapshot(i);if(this.fitsPose(i.mask,e.text,s)&&this.overlaps(e.text,s,e.text,t)){i.target=s,i.route=[],i.velocity={x:0,y:0},i.fontVelocity=0,i.angleVelocity=0,i.regionMask=n;return}i.alive=!1,e.ghosts.push(i)}e.placement=this.spawn(t,n)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,n){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const i=1-Math.exp(-n/nn),s=e.soft;for(let o=0;o<t.length;o+=1)s[o]+=(t[o]-s[o])*i}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const n of e.cells)t[n]=1;return t}components(e){const t=new Uint8Array(e.length),n=new Int32Array(e.length),i=[];for(let s=0;s<e.length;s+=1){if(t[s])continue;const o=i.length,a=e[s]<0?-1:1,l=[];let u=0,d=0,b=this.width,f=this.height,S=0,P=0;const _=[s];for(t[s]=1;_.length;){const z=_.pop();l.push(z),n[z]=o;const p=z%this.width,y=Math.floor(z/this.width);u+=p+.5,d+=y+.5,b=Math.min(b,p),f=Math.min(f,y),S=Math.max(S,p+1),P=Math.max(P,y+1);for(const c of this.neighbors(z))t[c]||(e[c]<0?-1:1)!==a||(t[c]=1,_.push(c))}const v=l.length/e.length;let E=null,A="hole";a>0?v>=$i?(E="continent",A="place"):v>=Hi&&(E="island",A="place"):S-b>this.width*Wt&&P-f>this.height*Wt||b===0||f===0||S===this.width||P===this.height?A="sea":v>=Xi&&(E="lake",A="place"),i.push({sign:a,area:l.length,cells:l,kind:E,role:A,center:{x:u/l.length/this.width,y:d/l.length/this.height},bounds:{x0:b/this.width,y0:f/this.height,x1:S/this.width,y1:P/this.height}})}for(const s of i){if(s.kind!=="lake")continue;const o=new Map;let a=0;for(const l of s.cells)for(const u of this.neighbors(l)){const d=n[u];i[d].sign<0||(o.set(d,(o.get(d)??0)+1),a+=1)}(a===0||Math.max(...o.values())*5<a*4)&&(s.kind=null,s.role="sea")}return i}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),n=new Int32Array(e.length);let i=0;for(let s=0;s<e.length;s+=1){const o=s%this.width,a=Math.floor(s/this.width);(!e[s]||o===0||a===0||o===this.width-1||a===this.height-1)&&(t[s]=0,n[i++]=s)}for(let s=0;s<i;s+=1){const o=n[s],a=o%this.width,l=Math.floor(o/this.width);for(const u of[a>0?o-1:-1,a+1<this.width?o+1:-1,l>0?o-this.width:-1,l+1<this.height?o+this.width:-1])u<0||t[u]>=0||(t[u]=t[o]+1,n[i++]=u)}return t}prefix(e){const t=this.width+1,n=new Int32Array(t*(this.height+1));for(let i=0;i<this.height;i+=1){let s=0;for(let o=0;o<this.width;o+=1)s+=e[o+i*this.width],n[(i+1)*t+o+1]=n[i*t+o+1]+s}return n}maxFont(e,t,n,i){if(!this.fits(e,t,n,V,re(V),i))return 0;if(this.fits(e,t,n,ie,re(ie),i))return ie;let s=V,o=ie;for(let a=0;a<8;a+=1){const l=(s+o)/2;this.fits(e,t,n,l,re(l),i)?s=l:o=l}return s}fitsPose(e,t,n){return Math.abs(n.angle)<=ne&&this.fits(e,t,n,n.font,re(n.font),n.angle)}posesFit(e,t,n,i){if(!this.fitsPose(e,t,n)||!this.fitsPose(e,t,i))return!1;const s=Math.max(1,Math.ceil(Math.max(this.distance(n,i)/4,Math.abs(n.font-i.font),Math.abs(n.angle-i.angle)/2)));for(let o=1;o<s;o+=1)if(!this.fitsPose(e,t,this.lerpPose(n,i,o/s)))return!1;return!0}longestLegal(e,t,n,i){if(!this.fitsPose(t,e,n))return null;let s=0,o=1;for(let a=0;a<8;a+=1){const l=(s+o)/2;this.posesFit(t,e,n,this.lerpPose(n,i,l))?s=l:o=l}return s<=0?null:this.lerpPose(n,i,s)}fits(e,t,n,i,s,o){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const a=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),l=Math.max(Ki,a*1.25),u=this.boxWidth(t,i,s)/2+l,d=i*pt/2+l,b=o*Math.PI/180,f=Math.cos(b),S=Math.sin(b),P=Math.abs(u*f)+Math.abs(d*S),_=Math.abs(u*S)+Math.abs(d*f);if(n.x-P<0||n.y-_<0||n.x+P>this.viewport.width||n.y+_>this.viewport.height)return!1;const v=this.prefixFields.get(e);if(v){const c=Math.floor((n.x-P)*this.width/this.viewport.width),h=Math.floor((n.y-_)*this.height/this.viewport.height),m=Math.min(this.width,Math.ceil((n.x+P)*this.width/this.viewport.width)),w=Math.min(this.height,Math.ceil((n.y+_)*this.height/this.viewport.height)),B=this.width+1;if(v[w*B+m]-v[h*B+m]-v[w*B+c]+v[h*B+c]===(m-c)*(w-h))return!0}const E=this.distanceFields.get(e),A=this.index(n);if(E&&A>=0){const c=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(E[A]-2)*c/Math.SQRT2)>=Math.hypot(u,d))return!0}const z=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),p=Math.max(2,Math.ceil(u*2/z)),y=Math.max(2,Math.ceil(d*2/z));for(let c=0;c<=y;c+=1){const h=-d+c*d*2/y;for(let m=0;m<=p;m+=1){const w=-u+m*u*2/p,B=Math.floor((n.x+w*f-h*S)*this.width/this.viewport.width),x=Math.floor((n.y+w*S+h*f)*this.height/this.viewport.height);if(B<0||x<0||B>=this.width||x>=this.height||!e[B+x*this.width])return!1}}return!0}overlaps(e,t,n,i){const s=(l,u)=>{const d=u.angle*Math.PI/180,b=this.boxWidth(l,u.font,re(u.font))/2+7,f=u.font*pt/2+7;return{x:Math.abs(b*Math.cos(d))+Math.abs(f*Math.sin(d)),y:Math.abs(b*Math.sin(d))+Math.abs(f*Math.cos(d))}},o=s(e,t),a=s(n,i);return Math.abs(t.x-i.x)<o.x+a.x&&Math.abs(t.y-i.y)<o.y+a.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const n=e.width/t.width,i=e.height/t.height,s=(n+i)/2;for(const o of this.tracks.values()){o.styleFont=te(o.styleFont*s,V,ie);const a=o.placement?[o.placement,...o.ghosts]:o.ghosts;for(const l of a)this.scalePlacement(l,n,i,s)}}this.viewport=e}scalePlacement(e,t,n,i){e.position={x:e.position.x*t,y:e.position.y*n},e.velocity={x:e.velocity.x*t,y:e.velocity.y*n},e.font=te(e.font*i,V,ie),e.fontVelocity*=i,e.target={x:e.target.x*t,y:e.target.y*n,font:te(e.target.font*i,V,ie),angle:e.target.angle},e.route=e.route.map(s=>({x:s.x*t,y:s.y*n,font:te(s.font*i,V,ie),angle:s.angle}))}regrid(e,t,n,i,s){const o=new e.constructor(i*s);if(e.length!==t*n||t<1||n<1)return o;for(let a=0;a<s;a+=1)for(let l=0;l<i;l+=1)o[l+a*i]=e[Math.min(t-1,Math.floor((l+.5)*t/i))+Math.min(n-1,Math.floor((a+.5)*n/s))*t];return o}regridFloat(e,t,n,i,s){const o=new Float32Array(i*s);if(e.length!==t*n||t<1||n<1)return o;for(let a=0;a<s;a+=1)for(let l=0;l<i;l+=1)o[l+a*i]=e[Math.min(t-1,Math.floor((l+.5)*t/i))+Math.min(n-1,Math.floor((a+.5)*n/s))*t];return o}neighbors(e){const t=e%this.width,n=Math.floor(e/this.width);return[(t+1)%this.width+n*this.width,(t-1+this.width)%this.width+n*this.width,t+(n+1)%this.height*this.width,t+(n-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,n){return{x:Xe(e.x,t.x,n),y:Xe(e.y,t.y,n),font:Xe(e.font,t.font,n),angle:Xe(e.angle,t.angle,n)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),n=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&n>=0&&n<this.height?t+n*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,n){const i=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(i?.58:.56)+n)+4;const s=i?`i:${e}`:e;let o=this.textMetrics.get(s);return o===void 0&&(this.measure.font=`${i?"italic ":""}500 100px ${ln}`,this.measure.fontKerning="none",o=this.measure.measureText(e).width/100,this.textMetrics.set(s,o)),o*t+e.length*n+4}}const dn=.6,fn=(r,e,t,n=!1)=>{if(!r||n)return{from:null,to:e,progress:1};if(r.from===null)return e===r.to?r:{from:r.to,to:e,progress:0};const i=Number.isFinite(t)?Math.max(0,t):0,s=Math.min(1,r.progress+i/dn);return s<1-1e-9?{...r,progress:s}:e===r.to?{from:null,to:e,progress:1}:{from:r.to,to:e,progress:0}},gn=r=>{const e=r.from===null?1:r.progress**2*(3-2*r.progress);return{previous:r.from,current:r.to,previousOpacity:1-e,currentOpacity:e}},mt=2.4,pn=12,mn=(r,e,t,n,i,s)=>{if(n<=0)return r;const o=Math.max(0,t),a=o+n,u=(s-i)/pn*(n-mt*(Math.exp(-o/mt)-Math.exp(-a/mt)));return Math.max(i,Math.min(s,r+e*u))},bn=(r,e,t,n)=>({freeze:e>t?Math.max(0,Math.min(1,(e-r)/(e-t))):0,heat:e<n?Math.max(0,Math.min(1,(r-e)/(n-e))):0}),Zt=2/Math.log(1+Math.sqrt(2)),ei=30,bt=40,yn=45,k=r=>{const e=document.getElementById(r);if(!e)throw new Error(`Missing #${r}`);return e},W=k("field"),xe=k("scale"),ve=k("temperature"),yt=k("time-speed"),He=k("brush-size"),ti=k("show-labels"),xn=k("scale-value"),vn=k("temperature-value"),wn=k("time-speed-value"),_n=k("brush-size-value"),Te=k("settings-toggle"),Ue=k("settings-panel"),$e=k("pause"),Mn=k("restart"),Pn=k("clear-blue"),xt=k("rough"),vt=k("smooth"),wt=k("scale-dock"),Sn=k("scale-readout"),We=k("cool"),je=k("heat"),_t=k("phase"),Mt=k("magnetization"),Pt=k("energy"),Je=k("fatal-error"),ii=k("place-labels");async function Bn(){const r=await Mi();if(!r){Je.hidden=!1,Je.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new Bi(r.device,r.format,W);let t=Number(ve.value),n=t,i=Number(xe.value),s=i,o=Number(yt.value),a=Number(He.value),l=!1,u=!1,d=!1,b=!1,f=!1,S=0,P=0,_=null,v=!0,E=0,A=0,z=performance.now(),p=0,y=!1,c=0;const h=new Map;let m=!1,w=0,B=i,x=!1,I=!1,C=0,T=0,R=!1,N=0;const K=new hn,Y=new Map,Q=new Map,ee=window.matchMedia("(prefers-reduced-motion: reduce)"),q=new Map,D=new Map,me=new Map;let ce=null,it=0;const Re=new Map,nt=new Set,st=new Set,rt=new Set,ot=new Set,zt=Zt+.2,ke=Number(xe.min),ue=Number(xe.max),Et=Number(ve.min),At=Number(ve.max),bi=.75;let Me=0,at=0;const yi=(ue-ke)/2.2,Tt=Math.ceil((bt-1)/2),xi=()=>{const g=Math.max(1,window.innerWidth),M=Math.max(1,window.innerHeight),U=g<=720?Math.min(window.devicePixelRatio||1,2):1,O=Math.min(r.device.limits.maxTextureDimension2D/g,r.device.limits.maxTextureDimension2D/M),G=Math.sqrt(Number(r.device.limits.maxStorageBufferBindingSize)/4/(g*M)),J=Math.max(.25,Math.min(U,O,G)),se=Math.max(1,Math.round(g*J)),be=Math.max(1,Math.round(M*J));return{density:se/g,width:se,height:be}},lt=g=>{const M=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**g-1)*M))},Ne=()=>lt(i)*2+1,vi=()=>{const g=Math.min(e.width,e.height)/65.64;if(g<=0)return ue;let M=Math.log2(1+Math.max(0,(Tt-.5)/g));for(M=Math.min(ue,Math.max(ke,M));M<ue&&lt(M)<Tt;)M=Math.min(ue,M+.01);return M},Pe=()=>{const g=Ne(),M=g===1?"1 spin":`${g} × ${g}`;xe.value=i.toFixed(2),wt.value=i.toFixed(2),xn.textContent=M,Sn.textContent=M,xt.setAttribute("aria-label",`Rough, observation scale ${i.toFixed(2)}`),vt.setAttribute("aria-label",`Smooth, observation scale ${i.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-i/3)**2).toFixed(3))},Se=()=>{ve.value=t.toFixed(2),vn.textContent=`T = ${t.toFixed(2)}`;const g=bn(t,n,Et,At);We.style.setProperty("--paddle-progress",g.freeze.toFixed(4)),je.style.setProperty("--paddle-progress",g.heat.toFixed(4)),We.setAttribute("aria-label",`Cool, current temperature ${t.toFixed(2)}`),je.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const M=t-Zt;M<-.2?_t.textContent="ordered":M>.2?_t.textContent="disordered":_t.textContent="critical"},Ut=()=>{const g=Number.isInteger(o)?0:1;wn.textContent=`${o.toFixed(g)}×`},ct=()=>{He.value=String(a),_n.textContent=`${a} px`},wi=()=>({active:f&&!m&&!I,painting:d,forceHot:b,x:S,y:P,radius:a/2}),Be=()=>{const g=Ne(),M=(g-1)/2,U=g===1?0:.14*(1-i/3)**2;e.draw(i,M,U,C,wi()),v=!1},Ct=()=>{T+=1,K.reset(),ce=null,q.clear(),D.clear(),me.clear(),Re.clear(),Q.clear(),Rt([],0)},Rt=(g,M)=>{const U=new Set,O={width:W.clientWidth,height:W.clientHeight};for(const G of g){if(U.add(G.id),ce&&Re.get(G.id)!==it){const X=Ei(G,ce,O);q.set(G.id,Ai(q.get(G.id),X)),Re.set(G.id,it)}const J=Ui(D.get(G.id),q.get(G.id)?.mode??"dark",M);D.set(G.id,J);const se=Ci(J),be=zi(G.kind,J.from,J.to,se.blend),Ie=Ti(me.get(G.id),q.get(G.id)?.opacity??1,M);me.set(G.id,Ie);const he=un(G),Ve=fn(Q.get(G.id),G.text,M,ee.matches);Q.set(G.id,Ve);const L=gn(Ve);let Z=Y.get(G.id);for(Z||(Z=[],Y.set(G.id,Z));Z.length<he.length;){const X=document.createElement("span");X.className="place-label";const $=document.createElement("span");$.className="place-label-text",X.append($),ii.append(X),Z.push({node:X,current:$,previous:null})}for(;Z.length>he.length;)Z.pop()?.node.remove();for(let X=0;X<he.length;X+=1){const $=Z[X],{node:le,current:dt}=$,Vt=he[X];le.dataset.kind!==G.kind&&(le.dataset.kind=G.kind),dt.textContent!==L.current&&(dt.textContent=L.current),dt.style.opacity=L.currentOpacity.toFixed(3),L.previous!==null?($.previous||($.previous=document.createElement("span"),$.previous.className="place-label-text place-label-text-previous",$.previous.setAttribute("aria-hidden","true"),le.prepend($.previous)),$.previous.textContent!==L.previous&&($.previous.textContent=L.previous),$.previous.style.opacity=L.previousOpacity.toFixed(3)):$.previous&&($.previous.remove(),$.previous=null),le.style.color=be,le.style.opacity=(G.opacity*Ie).toFixed(3),le.style.fontSize=`${G.fontSize.toFixed(2)}px`,le.style.letterSpacing=`${G.letterSpacing.toFixed(2)}px`,le.style.transform=`translate(${Vt.x.toFixed(2)}px, ${Vt.y.toFixed(2)}px) rotate(${G.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[G,J]of Y)if(!U.has(G)){for(const{node:se}of J)se.remove();Y.delete(G),Q.delete(G),q.delete(G),D.delete(G),me.delete(G),Re.delete(G)}},kt=(g=!0)=>{const M=xi();if(e.resize(M.width,M.height,M.density,g),!g){const U=Math.min(e.width,e.height)/65.64,O=(yn-1)/2;i=Math.max(ke,Math.min(ue,Math.log2(1+O/U))),s=i}Pe(),v=!0,Be(),c+=1,T+=1,ce=null},Le=g=>{const M=W.getBoundingClientRect(),U=(g.clientX-M.left)/M.width,O=(g.clientY-M.top)/M.height;return U<0||U>=1||O<0||O>=1?null:(S=g.clientX-M.left,P=g.clientY-M.top,{x:U*e.width,y:O*e.height})},Oe=(g,M)=>{const U=Le(g);if(!U){_=null;return}const O=_??U;e.paintSegment(O.x,O.y,U.x,U.y,a*e.density/2,M,b),_=U,v=!0},ut=g=>{d=!0,_=null,Oe(g,!0),b=!1},Nt=()=>{const g=[...h.values()];return g.length<2?0:Math.hypot(g[1].x-g[0].x,g[1].y-g[0].y)},Ge=()=>{if(y)return;y=!0;const g=c;e.readStats().then(M=>{if(g!==c)return;Mt.textContent=M.magnetization.toFixed(3),Pt.textContent=M.energy.toFixed(3);const U=M.signedMagnetization===-1;!d&&b!==U&&(b=U,v=!0)}).catch(M=>{console.warn("Could not read Ising statistics.",M)}).finally(()=>{y=!1})},Lt=g=>{i=g,s=i,Pe(),v=!0};xe.addEventListener("input",()=>Lt(Number(xe.value))),wt.addEventListener("input",()=>Lt(Number(wt.value))),ve.addEventListener("input",()=>{n=Number(ve.value),t=n,Me=0,Se()});const Fe=(g,M)=>{const U=()=>{g.setAttribute("aria-pressed",String(M.size>0))},O=G=>{M.delete(`pointer:${G.pointerId}`),g.hasPointerCapture(G.pointerId)&&g.releasePointerCapture(G.pointerId),U()};g.addEventListener("pointerdown",G=>{G.pointerType==="mouse"&&G.button!==0||(G.preventDefault(),g.setPointerCapture(G.pointerId),M.add(`pointer:${G.pointerId}`),U())}),g.addEventListener("pointerup",O),g.addEventListener("pointercancel",O),g.addEventListener("lostpointercapture",G=>{M.delete(`pointer:${G.pointerId}`),U()}),g.addEventListener("keydown",G=>{G.code!=="Space"&&G.code!=="Enter"||(G.preventDefault(),M.add(`key:${G.code}`),U())}),g.addEventListener("keyup",G=>{G.code!=="Space"&&G.code!=="Enter"||(G.preventDefault(),M.delete(`key:${G.code}`),U())}),g.addEventListener("blur",()=>{for(const G of M)G.startsWith("key:")&&M.delete(G);U()})};Fe(xt,nt),Fe(vt,st),Fe(We,rt),Fe(je,ot),yt.addEventListener("input",()=>{o=Number(yt.value),Ut()}),He.addEventListener("input",()=>{a=Number(He.value),ct(),v=!0});const Ot=()=>{ii.hidden=!ti.checked};ti.addEventListener("change",Ot),Ot(),window.addEventListener("keydown",g=>{g.code!=="BracketLeft"&&g.code!=="BracketRight"||(g.preventDefault(),a=Math.max(4,Math.min(100,a+(g.code==="BracketLeft"?-4:4))),ct(),v=!0)});const ht=g=>{u=g,Ue.classList.toggle("is-closed",!u),Ue.inert=!u,Ue.setAttribute("aria-hidden",String(!u)),Te.setAttribute("aria-expanded",String(u)),Te.setAttribute("aria-label",u?"Close settings":"Open settings")};Te.addEventListener("click",()=>ht(!u)),document.addEventListener("pointerdown",g=>{const M=g.target;!u||!(M instanceof Node)||Ue.contains(M)||Te.contains(M)||ht(!1)},{capture:!0}),document.addEventListener("click",g=>{const M=g.target;!u||!(M instanceof Node)||Te.contains(M)||(!Ue.contains(M)||M instanceof Element&&M.closest("button"))&&ht(!1)}),$e.addEventListener("click",()=>{l=!l;const g=l?"Resume simulation":"Pause simulation";$e.setAttribute("aria-pressed",String(l)),$e.setAttribute("aria-label",g),$e.title=g,E=0}),Mn.addEventListener("click",()=>{e.randomize(),b=!1,E=0,c+=1,Ct(),Mt.textContent="0.000",Pt.textContent="0.000",v=!0,Be(),Ge()}),Pn.addEventListener("click",()=>{e.clearBlue(),b=!0,E=0,c+=1,Ct(),Mt.textContent="1.000",Pt.textContent="-2.000",v=!0,Be(),Ge()}),W.addEventListener("pointerdown",g=>{if(Le(g)){if(W.setPointerCapture(g.pointerId),f=!0,g.pointerType==="touch"){h.set(g.pointerId,{x:g.clientX,y:g.clientY}),h.size===1?(x=!0,I=!1):h.size===2&&(d=!1,_=null,x=!1,I=!0,m=!0,w=Nt(),B=s),v=!0;return}ut(g)}}),W.addEventListener("pointermove",g=>{if(Le(g),f=!0,v=!0,g.pointerType==="touch"){if(!h.has(g.pointerId))return;if(h.set(g.pointerId,{x:g.clientX,y:g.clientY}),m&&h.size>=2){const M=Nt();w>0&&M>0&&(s=Math.max(0,Math.min(3,B-Math.log2(M/w)*.9)));return}if(h.size===1&&!I){if(x)ut(g),x=!1;else if(d)for(const M of g.getCoalescedEvents())Oe(M,!1)}return}if(d){const M=g.getCoalescedEvents();if(M.length===0)Oe(g,!1);else for(const U of M)Oe(U,!1)}});const _i=g=>{g.pointerType==="touch"&&(x&&!I&&ut(g),h.delete(g.pointerId),h.size<2&&(m=!1),h.size===0&&(x=!1,I=!1,f=!1)),d=!1,_=null,W.hasPointerCapture(g.pointerId)&&W.releasePointerCapture(g.pointerId),v=!0,Ge()};W.addEventListener("pointerup",_i),W.addEventListener("pointercancel",g=>{h.delete(g.pointerId),d=!1,f=!1,_=null,x=!1,m=!1,v=!0}),W.addEventListener("pointerenter",()=>{f=!0,v=!0}),W.addEventListener("pointerleave",()=>{d||(f=!1,v=!0)}),W.addEventListener("wheel",g=>{g.preventDefault();const M=Math.max(-120,Math.min(120,g.deltaY));s=Math.max(0,Math.min(3,s+M*.00125)),Le(g),f=!0},{passive:!1}),window.addEventListener("blur",()=>{d=!1,f=!1,_=null,h.clear(),m=!1,x=!1,nt.clear(),st.clear(),rt.clear(),ot.clear(),Me=0,at=0,xt.setAttribute("aria-pressed","false"),vt.setAttribute("aria-pressed","false"),We.setAttribute("aria-pressed","false"),je.setAttribute("aria-pressed","false"),v=!0}),window.addEventListener("resize",()=>kt(!0)),kt(!1),e.step(t,40),Se(),Ut(),ct(),v=!0,Be(),Ge();const Ft=g=>{const M=Math.max(0,(g-z)/1e3),U=Math.min(.1,M);z=g;const O=+(st.size>0)-+(nt.size>0);if(O!==0){const L=O<0?ke:ue,Z=O*yi*U;i=O<0?Math.max(L,i+Z):Math.min(L,i+Z),s=i,Pe(),v=!0}else{const L=s-i;Math.abs(L)>5e-4?(i+=L*(1-Math.exp(-U*10)),Pe(),v=!0):i!==s&&(i=s,Pe(),v=!0)}const G=+(ot.size>0)-+(rt.size>0);if(G!==at&&(Me=0,at=G),G!==0)t=mn(t,G,Me,U,Et,At),Me+=U,Se();else{const L=n-t;Math.abs(L)>5e-4?(t+=L*(1-Math.exp(-U/bi)),Se()):t!==n&&(t=n,Se())}if(!l){E+=U*ei*o;const L=Math.min(8,Math.floor(E));L>0&&(E-=L,e.step(t,L),A+=L/ei,v=!0)}const J=Ne()>=bt?1:0,se=J-C;Math.abs(se)>.001?(C+=se*(1-Math.exp(-U*7)),v=!0):C!==J&&(C=J,v=!0);const be=Ne()>=bt?i:vi(),Ie=t>zt?"chaos":"map",he=W.getBoundingClientRect(),Ve=K.advance(Math.min(.5,M),Ie,{width:he.width,height:he.height});if(Rt(Ve,M),v&&Be(),!R&&Ie==="map"&&g-N>280){N=g,R=!0;const L=T,Z=A;e.readRegionSample(lt(be),be).then(X=>{L!==T||!X||t>zt||(ce=X,it+=1,K.ingest(X,t,Z))}).catch(X=>{console.warn("Could not read Ising regions.",X)}).finally(()=>{R=!1})}g-p>750&&(p=g,Ge()),requestAnimationFrame(Ft)};requestAnimationFrame(Ft)}Bn().catch(r=>{console.error(r),Je.hidden=!1,Je.textContent=r instanceof Error?r.message:"Could not start the WebGPU simulation."});
