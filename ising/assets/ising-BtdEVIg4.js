(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();async function ui(){try{if(!navigator.gpu)return null;const o=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!o)return null;const e=await o.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(o){return console.error("WebGPU initialization failed.",o),null}}const hi=`struct SimParams {
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
`,N=(o,e)=>Math.ceil(o/e),Oe=112,Fe=128,di=(o,e)=>o>=e?{width:Oe,height:Math.max(1,Math.round(Oe*e/o))}:{width:Math.max(1,Math.round(Oe*o/e)),height:Oe};class fi{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,n){this.device=e,this.format=t,this.canvas=n;const i=n.getContext("webgpu");if(!i)throw new Error("Could not create a WebGPU canvas context.");this.context=i,this.context.configure({device:e,format:t,alphaMode:"opaque"});const r=e.createShaderModule({label:"Ising shaders",code:hi});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:r,entryPoint:"fullscreen_vertex"},fragment:{module:r,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(s=>e.createBuffer({label:`Ising blur uniforms ${s}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(s=>e.createBuffer({label:`Ising label blur uniforms ${s}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:Fe*Fe*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:Fe*Fe*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,n,i=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=n;return}const r=this.width,s=this.height,a=this.spinBuffers,l=this.fieldTexture,u=this.blurTextures,d=this.labelBlurTextures,b=this.statsOutput,f=this.statsReadback,_=a?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=n,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),i&&_){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,r,s);const w=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:_}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),y=this.device.createCommandEncoder({label:"Resize Ising grid"}),x=y.beginComputePass();x.setPipeline(this.pipelines.resize),x.setBindGroup(0,w),x.dispatchWorkgroups(N(e,8),N(t,8)),x.end(),this.device.queue.submit([y.finish()])}else this.randomize();a&&this.retire({buffers:[a[0],a[1],...b?[b]:[]],readback:f??void 0,textures:[l,...u??[],...d??[]].filter(w=>!!w)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(N(this.width,8),N(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(N(this.width,8),N(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let n=0;n<t;n+=1){const i=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,i);const r=this.device.createCommandEncoder({label:"Advance Ising state"}),s=r.beginComputePass();s.setPipeline(this.pipelines.update),s.setBindGroup(0,this.updateGroups[this.currentIndex]),s.dispatchWorkgroups(N(this.width,8),N(this.height,8)),s.end(),this.device.queue.submit([r.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,n,i,r,s,a){const l=Math.floor(Math.min(e,n)-r),u=Math.floor(Math.min(t,i)-r),d=Math.ceil(Math.max(e,n)+r),b=Math.ceil(Math.max(t,i)+r),f=d-l+1,_=b-u+1;this.writeBrushParams(l,u,f,_,e,t,n,i,r,a);const w=this.device.createCommandEncoder({label:"Paint Ising spins"});if(s){const x=w.beginComputePass();x.setPipeline(this.pipelines.select),x.setBindGroup(0,this.selectGroups[this.currentIndex]),x.dispatchWorkgroups(1),x.end()}const y=w.beginComputePass();y.setPipeline(this.pipelines.paint),y.setBindGroup(0,this.paintGroups[this.currentIndex]),y.dispatchWorkgroups(N(f,8),N(_,8)),y.end(),this.device.queue.submit([w.finish()]),this.fieldDirty=!0}draw(e,t,n,i,r){if(!this.renderGroup||!this.observationReady())return;const s=this.secondaryObservationRadius(t,e),a=this.fieldDirty||t!==this.lastBlurRadius||s!==this.lastSecondaryRadius,l=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const d=l.beginComputePass();d.setPipeline(this.pipelines.field),d.setBindGroup(0,this.fieldGroups[this.currentIndex]),d.dispatchWorkgroups(N(this.width,8),N(this.height,8)),d.end(),this.fieldDirty=!1}a&&this.appendObservationBlur(l,t,s,"display"),this.writeRenderParams(e,t,n,i,r);const u=l.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});u.setPipeline(this.pipelines.render),u.setBindGroup(0,this.renderGroup),u.draw(3),u.end(),this.device.queue.submit([l.finish()])}async readRegionSample(e,t){const n=this.regionGroup;if(!n||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const i=di(this.width,this.height),r=i.width*i.height;if(r*4>this.regionStorage.size)return null;const s=this.secondaryObservationRadius(e,t),a=e===this.lastBlurRadius&&s===this.lastSecondaryRadius,l=a?n:this.labelRegionGroup;if(!l)return null;const u=this.device.createCommandEncoder({label:"Read Ising regions"});a||this.appendObservationBlur(u,e,s,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([i.width,i.height,0,0]));const d=u.beginComputePass();d.setPipeline(this.pipelines.regions),d.setBindGroup(0,l),d.dispatchWorkgroups(N(i.width,8),N(i.height,8)),d.end(),u.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,r*4),this.device.queue.submit([u.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const b=new Int32Array(this.regionReadback.getMappedRange(),0,r),f=new Int8Array(r),_=new Float32Array(r);for(let w=0;w<r;w+=1)f[w]=b[w]<0?-1:1,_[w]=(Math.abs(b[w])-1)/65534;return{width:i.width,height:i.height,signs:f,luminance:_}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,n=this.statsGroups[this.currentIndex];if(!e||!t||!n)return{energy:0,magnetization:0,signedMagnetization:0};const i=N(this.width,16),r=N(this.height,16),s=new Uint32Array([this.width,this.height,i,0]);this.device.queue.writeBuffer(this.statsUniform,0,s);const a=this.device.createCommandEncoder({label:"Read Ising statistics"});a.clearBuffer(e);const l=a.beginComputePass();l.setPipeline(this.pipelines.stats),l.setBindGroup(0,n),l.dispatchWorkgroups(i,r),l.end(),a.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([a.finish()]),await t.mapAsync(GPUMapMode.READ);const u=new Int32Array(t.getMappedRange()),d=u[0],b=u[1];t.unmap();const f=this.width*this.height;return{magnetization:Math.abs(d/f),signedMagnetization:d/f,energy:b/f}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}))}writeSimParams(e,t,n,i,r=0,s=0){const a=new ArrayBuffer(32),l=new DataView(a);l.setUint32(0,this.width,!0),l.setUint32(4,this.height,!0),l.setUint32(8,e,!0),l.setUint32(12,t,!0),l.setFloat32(16,n,!0),l.setUint32(20,i,!0),l.setUint32(24,r,!0),l.setUint32(28,s,!0),this.device.queue.writeBuffer(this.simUniform,0,a)}writeBrushParams(e,t,n,i,r,s,a,l,u,d){const b=new ArrayBuffer(64),f=new DataView(b);f.setUint32(0,this.width,!0),f.setUint32(4,this.height,!0),f.setInt32(8,e,!0),f.setInt32(12,t,!0),f.setUint32(16,n,!0),f.setUint32(20,i,!0),f.setUint32(24,d?1:0,!0),f.setFloat32(32,r,!0),f.setFloat32(36,s,!0),f.setFloat32(40,a,!0),f.setFloat32(44,l,!0),f.setFloat32(48,u,!0),this.device.queue.writeBuffer(this.brushUniform,0,b)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,n,i){const r=i==="display",s=r?this.blurUniforms:this.labelBlurUniforms,a=r?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,l=r?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,u=r?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,d=r?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!l||!u||!d||a.length===0)return;this.writeBlurParams(s[0],t),this.writeBlurParams(s[1],n);const b=e.beginComputePass({label:"Horizontal Ising observation blur"});b.setPipeline(this.pipelines.blurSpinsHorizontal),b.setBindGroup(0,a[this.currentIndex]),b.dispatchWorkgroups(N(this.height,64)),b.end();const f=e.beginComputePass({label:"Vertical Ising observation blur"});if(f.setPipeline(this.pipelines.blurTextureVertical),f.setBindGroup(0,l),f.dispatchWorkgroups(N(this.width,64)),f.end(),n>0){const _=e.beginComputePass({label:"Secondary horizontal Ising blur"});_.setPipeline(this.pipelines.blurTextureHorizontal),_.setBindGroup(0,u),_.dispatchWorkgroups(N(this.height,64)),_.end();const w=e.beginComputePass({label:"Secondary vertical Ising blur"});w.setPipeline(this.pipelines.blurTextureVertical),w.setBindGroup(0,d),w.dispatchWorkgroups(N(this.width,64)),w.end()}r&&(this.lastBlurRadius=t,this.lastSecondaryRadius=n)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,n,i,r){const s=new Float32Array(16);s[0]=this.width,s[1]=this.height,s[2]=this.width,s[3]=this.height,s[4]=t,s[5]=e,s[6]=n,s[7]=r.active?1:0,s[8]=r.x*this.density,s[9]=r.y*this.density,s[10]=r.radius*this.density,s[11]=r.painting?1:0,s[12]=r.forceHot?1:0,s[13]=Math.max(.5,this.density*.5),s[14]=i,this.device.queue.writeBuffer(this.renderUniform,0,s)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const n of e.buffers)n.destroy();for(const n of e.textures??[])n.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const gi={land:{dark:"#050302",light:"#ffd5a6"},water:{dark:"#06132e",light:"#c4eaff"}},$t=(o,e,t)=>Math.max(e,Math.min(t,o)),pi=o=>o<=.04045?o/12.92:((o+.055)/1.055)**2.4,kt=o=>{const e=[1,3,5].map(t=>pi(parseInt(o.slice(t,t+2),16)/255));return e[0]*.2126+e[1]*.7152+e[2]*.0722},Lt=(o,e)=>(Math.max(o,e)+.05)/(Math.min(o,e)+.05),$e=(o,e)=>gi[o==="lake"?"water":"land"][e],mi=(o,e,t,n)=>{const i=$e(o,e),r=$e(o,t);return`rgb(${[1,3,5].map(a=>{const l=parseInt(i.slice(a,a+2),16),u=parseInt(r.slice(a,a+2),16);return(l+(u-l)*n).toFixed(2)}).join(", ")})`},bi=(o,e,t)=>{const n=o.angle*Math.PI/180,i=Math.cos(n),r=Math.sin(n),s=kt($e(o.kind,"dark")),a=kt($e(o.kind,"light")),l=[],u=[];for(let b=-1;b<=1;b+=1)for(let f=-4;f<=4;f+=1){const _=f*o.width*.105,w=b*o.height*.28,y=o.x+_*i-w*r,x=o.y+_*r+w*i,B=Math.max(0,Math.min(e.width-1,Math.floor(y/t.width*e.width))),z=Math.max(0,Math.min(e.height-1,Math.floor(x/t.height*e.height))),c=e.luminance[z*e.width+B];l.push(Lt(c,s)),u.push(Lt(c,a))}l.sort((b,f)=>b-f),u.sort((b,f)=>b-f);const d=Math.floor((l.length-1)*.25);return{dark:l[d],light:u[d]}},xi=(o,e)=>{const t=o?o.darkContrast*.55+e.dark*.45:e.dark,n=o?o.lightContrast*.55+e.light*.45:e.light;let i=o?.mode??(t>=2.5||n<4.5?"dark":"light");const r=i==="dark"?n:t,a=(i==="dark"?t:n)<(i==="dark"?2.5:3)&&r>4.5?(o?.weakSamples??0)+1:0,l=a>=5;return l&&(i=i==="dark"?"light":"dark"),{mode:i,darkContrast:t,lightContrast:n,weakSamples:l?0:a,opacity:i==="dark"?$t(.82+(5-t)*.06,.82,1):1}},yi=(o,e,t)=>o===void 0?e:o+(e-o)*(1-Math.exp(-$t(t,0,.5)/.8)),wi=(o,e,t)=>{if(!o)return{from:e,to:e,progress:1,velocity:0};let n=o;if(n.from===n.to){if(e===n.to)return n;n={from:n.to,to:e,progress:0,velocity:0}}const i=e===n.to?1:0,r=Math.max(0,Math.min(t,1/60)),s=5,a=n.progress-i,l=n.velocity+s*a,u=Math.exp(-s*r),d=Math.max(0,Math.min(1,i+(a+l*r)*u)),b=(n.velocity-s*l*r)*u;return Math.abs(d-i)<.001&&Math.abs(b)<.02?{from:e,to:e,progress:1,velocity:0}:{...n,progress:d,velocity:b}},vi=o=>o.from===o.to?{blend:1,opacity:1}:{blend:o.progress*o.progress*(3-2*o.progress),opacity:1},Qe=o=>(o.bridge??"")+o.onset,J=o=>`${o.syllables.map(e=>Qe(e)+e.vowel).join("")}${o.coda}${o.ending??""}`,Ee=["v","l","m","n","s","c","r","t","p","d","f","g","b"],Wt=["br","cr","dr","gr","pr","tr","cl","fl","gl","pl","fr","st"],jt=["","",...Ee,...Wt,"qu"],Kt=[...Ee,...Wt],de=["a","e","i","o","u"],Qt=[...de,"ae","au","oe"],Jt=["n","r","s","l","m","t"],Zt=["a","us","um","is","or","ia","ea","ium","ius","aris","ensis"],_i={"":["n","r","l","m","s","t"],b:["","m","r","l"],p:["","m","r","l"],d:["","n","r","l"],t:["","n","r","l","s","c"],c:["","n","r","s"],g:["","n","r","l"],f:["","r","l"],s:["","n","r","l"],m:["","r","l","m"],n:["","r","n"],l:["","l"],r:["","r"],v:["","l","r"],tr:["","s","n"],dr:["","n"],cr:[""],gr:[""],br:["","m"],pr:["","m"],cl:[""],fl:[""],gl:[""],pl:[""],fr:[""],st:["","n"]},Mi=.035,ei=14,Je=9,Ze=10,fe=(o,e,t)=>Math.max(e,Math.min(t,o)),ge=o=>({...o,syllables:o.syllables.map(e=>({...e}))}),he=o=>fe(o(),0,1-Number.EPSILON),we=(o,e)=>e[Math.floor(he(o)*e.length)],ae=o=>({...o,chromosome:ge(o.chromosome)}),pe=o=>_i[o]??[""],ut=(o,e)=>e===void 0?o<.012?1:o<.03?2:3:e===1?o>=.0132?2:1:e===2?o<.0108?1:o>=.033?3:2:o<.0108?1:o<.027?2:3,Pi=o=>.025*Math.exp(fe((o-2.27)*5,-12,12)),re=(o,e)=>({syllables:o.syllables.slice(0,e).map(t=>({...t})),coda:e<3?Qe(o.syllables[e]).charAt(0):o.coda,ending:e===3?o.ending??"":""}),ti=o=>{const e=o.syllables[0];return e.onset.length+e.vowel.length<=3&&o.syllables.filter(t=>t.vowel.length>1).length<=1&&o.syllables.every((t,n)=>(t.onset!=="qu"||!["u","au","oe"].includes(t.vowel))&&(n===0?!t.bridge:pe(t.onset).includes(t.bridge??""))&&(n===0||t.onset!==o.syllables[n-1].onset||t.vowel!==o.syllables[n-1].vowel))&&J(o).length<=ei},Mt=o=>{const e=ge(o);e.syllables[0].bridge="";let t=0;for(let n=0;n<3;n+=1){const i=e.syllables[n];if((n===0&&i.onset.length+i.vowel.length>3||i.vowel.length>1&&t>0)&&(i.vowel=i.vowel.charAt(0)),i.onset==="qu"&&["u","au","oe"].includes(i.vowel)&&(i.vowel="a"),n>0&&!pe(i.onset).includes(i.bridge??"")){const r=pe(i.onset);i.bridge=r.includes("")?"":r[0]}i.vowel.length>1&&(t+=1)}for(;J(e).length>ei;){const n=e.syllables.slice(1).reverse().find(i=>i.bridge&&i.onset||i.onset.length>1||i.vowel.length>1);if(!n)break;n.bridge&&n.onset?n.bridge="":n.onset.length>1?n.onset=n.onset.charAt(0):n.vowel=n.vowel.charAt(0)}for(let n=1;n<3;n+=1){const i=e.syllables[n-1],r=e.syllables[n];i.onset===r.onset&&i.vowel===r.vowel&&(r.vowel=de[(de.indexOf(r.vowel.charAt(0))+2)%de.length])}return e},Si=o=>{const e=[];let t=!1;for(let n=0;n<3;n+=1){const i=we(o,n===0?jt:Kt),r=we(o,t||n===0&&i.length>1?de:Qt);t||=r.length>1,e.push({onset:i,vowel:r,bridge:n===0?"":we(o,pe(i))})}return{chromosome:Mt({syllables:e,coda:we(o,Jt),ending:we(o,Zt)}),mutability:.75+he(o)*.5,cooldown:5+he(o)*5,generation:0}},ii=(o,e)=>{const t=[];for(let n=0;n<e;n+=1)t.push(n*3,n*3+1),n>0&&t.push(n*3+2);return e===3?t.push(Je,Ze):t.push(e*3+(o.syllables[e].bridge?2:0)),t},_t=(o,e)=>{if(e===Je)return o.coda;if(e===Ze)return o.ending??"";const t=o.syllables[Math.floor(e/3)];return e%3===0?t.onset:e%3===1?t.vowel:t.bridge??""},We=(o,e,t)=>{if(e===Je)o.coda=t;else if(e===Ze)o.ending=t;else{const n=o.syllables[Math.floor(e/3)];e%3===0?n.onset=t:e%3===1?n.vowel=t:n.bridge=t}},ni=(o,e)=>{const t=e===Je?Jt:e===Ze?Zt:e%3===2?pe(o.syllables[Math.floor(e/3)].onset):e%3===1?Qt:e===0?jt:Kt;return[...new Set(t)].filter(n=>{if(n===_t(o,e))return!1;const i=ge(o);return We(i,e,n),ti(i)})},Nt=(o,e,t,n=he(t)<Mi)=>{const i=ae(o),r=ii(i.chromosome,e),s=n?Math.max(3,r.length-1):1;let a=0;for(;a<s&&r.length;){const[l]=r.splice(Math.floor(he(t)*r.length),1),u=J(re(i.chromosome,e));let d=ni(i.chromosome,l).filter(b=>{const f=ge(i.chromosome);return We(f,l,b),J(re(f,e))!==u});if(!n){const b=d.filter(f=>f.length===_t(i.chromosome,l).length);d=b.length?b:d.filter(f=>Math.abs(f.length-_t(i.chromosome,l).length)<=1)}d.length&&(We(i.chromosome,l,we(t,d)),a+=1)}return i.mutability=fe(i.mutability*(1+(he(t)-.5)*.08),.5,1.5),i.cooldown=fe(i.cooldown+(he(t)-.5)*.4,5,10),i},je=(o,e,t)=>{if(e===3){o.coda=t;return}const n=o.syllables[e];n.onset.startsWith(t)?n.bridge="":pe(n.onset).includes(t)?n.bridge=t:(n.bridge="",n.onset=t)},Ot=(o,e,t,n,i)=>{const r=s=>{const a=J(re(s.chromosome,e));return ti(s.chromosome)&&a!==n&&!t?.has(a)&&(!i||a.startsWith(i))};if(r(o))return o;for(const s of[...ii(o.chromosome,e)].reverse())for(const a of ni(o.chromosome,s)){const l=ae(o);if(We(l.chromosome,s,a),r(l))return l}if(i&&e>1)for(const s of de)for(const a of Ee){const l=ae(o);if(l.chromosome.syllables[e-1].vowel=s,je(l.chromosome,e,a),r(l))return l}for(const s of Ee)for(const a of de)for(const l of Ee){const u=ae(o);if(u.chromosome.syllables[0]={onset:s,vowel:a,bridge:""},je(u.chromosome,e,l),r(u))return u}return null},Bi=(o,e)=>{const t=pe(e.onset);return t.includes(o)?o:o==="n"&&t.includes("m")?"m":e.bridge&&t.includes(e.bridge)?e.bridge:t.find(n=>n==="r"||n==="l"||n==="n")??""},Gi=(o,e)=>{const t=o.filter(s=>s.weight>0).sort((s,a)=>a.weight-s.weight),n=t.reduce((s,a)=>s+a.weight,0),i=ge(t[0].genes.chromosome),r=s=>{const a=t.map(_=>_.weight/n*s),l=a.map(Math.floor),u=t.map((_,w)=>w).sort((_,w)=>a[w]-l[w]-(a[_]-l[_])||_-w);for(let _=s-l.reduce((y,x)=>y+x,0),w=0;_>0;_-=1,w+=1)l[u[w]]+=1;let d=0,b=i.coda,f=i.ending;for(let _=0;_<t.length;_+=1){const w=l[_];if(!w)continue;const y=t[_],x=y.genome??y.genes.chromosome;for(let B=0;B<w;B+=1){const z={...x.syllables[B]??y.genes.chromosome.syllables[B]};d>0&&B===0&&(z.bridge=Bi(b,z)),i.syllables[d++]=z}b=w===x.syllables.length?x.coda:w<3?Qe(y.genes.chromosome.syllables[w]).charAt(0):y.genes.chromosome.coda,f=y.genes.chromosome.ending}je(i,s,b),s===3&&(i.ending=f)};return r(3),e<3&&r(e),{chromosome:Mt(i),mutability:t.reduce((s,a)=>s+a.genes.mutability*a.weight,0)/n,cooldown:fe(t.reduce((s,a)=>s+a.genes.cooldown*a.weight,0)/n,5,10),generation:Math.max(...t.map(s=>s.genes.generation))+1}};class Ii{genes;genome;pending=null;nextChangeAt;rng;exposure=0;capacity;inheritance=null;inheritanceKey="";get hereditary(){const e=this.pending?.cause==="recombination"?this.pending.genes:this.inheritance;if(!e)return{genes:ae(this.genes),genome:ge(this.genome)};const t=this.pending?.cause==="recombination"?this.pending.capacity:this.capacity;return{genes:ae(e),genome:re(e.chromosome,t)}}constructor(e){this.rng=e.rng??Math.random,this.capacity=ut(e.areaFraction);let t;if(e.parent){t=ae(e.parent);const n=Math.abs(e.fragment??0)%(4-this.capacity);if(t.chromosome.syllables=[...t.chromosome.syllables.slice(n),...t.chromosome.syllables.slice(0,n)],this.capacity<3){const i=n+this.capacity<3?Qe(e.parent.chromosome.syllables[n+this.capacity]).charAt(0):e.parent.chromosome.coda;je(t.chromosome,this.capacity,i)}t.chromosome=Mt(t.chromosome),t.generation+=1,t=Nt(t,this.capacity,this.rng)}else t=Si(this.rng);this.genes=Ot(t,this.capacity,e.banned)??t,this.genome=re(this.genes.chromosome,this.capacity),this.nextChangeAt=e.now+this.genes.cooldown}recombine(e,t){const n=e.filter(s=>s.weight>0);if(n.length<2)return;const i=n.map(({genes:s,genome:a,weight:l})=>`${J(s.chromosome)}:${J(a??s.chromosome)}:${l}`).join("|");if(i===this.inheritanceKey)return;this.inheritanceKey=i;const r=ut(t);this.inheritance=Gi(n,r),this.pending={genes:this.inheritance,genome:re(this.inheritance.chromosome,r),capacity:r,cause:"recombination"}}propose(e){const{areaFraction:t,temperature:n,elapsed:i,now:r,banned:s}=e,a=fe(Math.sqrt(.055/Math.max(t,.001)),.5,2);this.exposure=Math.min(1,this.exposure+Math.max(0,i)*Pi(n)*this.genes.mutability*a);const l=ut(t,this.capacity);if(l===this.capacity&&(this.pending?.cause==="growth"||this.pending?.cause==="shrink")&&(this.pending=null),(l!==this.capacity||this.inheritance)&&this.pending?.capacity!==l){const u=this.inheritance??this.genes;this.pending={genes:u,genome:re(u.chromosome,l),capacity:l,cause:this.inheritance?"recombination":l<this.capacity?"shrink":"growth"}}if(!this.pending&&this.exposure>=1-1e-10){const u=Nt(this.genes,this.capacity,this.rng);this.pending={genes:u,genome:re(u.chromosome,this.capacity),capacity:this.capacity,cause:"mutation"}}if(this.pending){const u=Ot(this.pending.genes,this.pending.capacity,s,J(this.genome),this.pending.cause==="growth"?J(this.genome):void 0);if(!u)return null;u!==this.pending.genes&&(this.pending={...this.pending,genes:u,genome:re(u.chromosome,this.pending.capacity)})}return r+1e-10>=this.nextChangeAt?this.pending:null}reject(e){e!==this.pending||e.cause!=="mutation"||(this.pending=null,this.exposure=0)}commit(e,t){e!==this.pending||t+1e-10<this.nextChangeAt||(this.genes=ae(e.genes),this.genome=ge(e.genome),this.capacity=e.capacity,this.pending=null,this.inheritance=null,this.exposure=0,this.nextChangeAt=t+fe(this.genes.cooldown,5,10))}}const Ft=.7,ht=5,zi=2.27,Ai=.0025,Ei=.004,Ti=.055,Vt=1/2,Ui=48,dt=1.35,Ci=.16,Ri=9,O=8,te=64,ie=80,Dt=20,qt=.12,Yt=.22,ki=.05,Li=.12,Ni=.85,Oi=.25,Fi=3,Xt=8,Vi=1.8,Di=140,qi=28,Yi=160,Xi=2,Hi='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',Q=(o,e,t)=>Math.max(e,Math.min(t,o)),Ie=(o,e,t,n)=>o+(e-o)*(1-Math.exp(-t/n)),be=o=>o==="island"||o==="continent",se=o=>o*Ci,Ve=(o,e,t)=>o+(e-o)*t,ze=(o,e)=>{const t=Math.abs(o-e)%180;return Math.min(t,180-t)},$i=(o,e,t,n)=>{const i=2/Ni,r=(t-o)*i*i-2*i*e,s=e+r*n;return{value:o+s*n,velocity:s}},Wi=o=>[{x:o.x,y:o.y}];class ji{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1}advance(e,t,n){this.applyViewport(n);const i=Q(e,0,.5);t!=="map"&&(this.synced=!1);for(const s of this.tracks.values()){const a=t==="map"&&s.confirmed&&s.missing===0;s.agreement=Ie(s.agreement,a?1:0,i,Ft),s.stability=Ie(s.stability,a?s.agreement:0,i,Ft);const l=s.placement;l?.alive&&s.present&&this.glide(s,l,i);const u=l?[l,...s.ghosts]:s.ghosts;for(const d of u){const b=t==="map"&&this.synced&&s.present&&s.confirmed&&s.missing<.75&&d.alive;d.opacity=Ie(d.opacity,b?s.stability:0,i,b?.25:.45)}l&&!l.alive&&l.opacity<.02&&(s.placement=null),s.ghosts=s.ghosts.filter(d=>d.opacity>=.02)}const r=this.collect(i);return t==="chaos"&&r.length===0&&this.reset(),r}ingest(e,t=zi){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const n=performance.now()/1e3,i=this.lastIngest<0?0:Math.min(2,n-this.lastIngest);this.lastIngest=n;for(const c of this.tracks.values())c.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const c=[];for(const h of this.tracks.values()){h.soft&&(h.soft=this.regridFloat(h.soft,this.width,this.height,e.width,e.height)),h.lastMask&&(h.lastMask=this.regrid(h.lastMask,this.width,this.height,e.width,e.height));const m=h.placement?[h.placement,...h.ghosts]:h.ghosts;for(const p of m){const P=p.mask===p.regionMask;p.mask=this.regrid(p.mask,this.width,this.height,e.width,e.height),p.regionMask=P?p.mask:this.regrid(p.regionMask,this.width,this.height,e.width,e.height),c.push(p.mask),P||c.push(p.regionMask)}}this.width=e.width,this.height=e.height;for(const h of c)this.remember(h)}const s=this.components(e.signs).filter(c=>c.role==="place").sort((c,h)=>h.area-c.area).slice(0,Ui),a=[],l=[],u=(c,h,m)=>{const p=h.placement?.alive?{x:h.placement.position.x/this.viewport.width,y:h.placement.position.y/this.viewport.height}:h.center;return{region:c,track:h,overlap:m,distance:this.distance(p,s[c].center)}};for(let c=0;c<s.length;c+=1){const h=new Map;for(const m of s[c].cells){const p=this.owners[m];p&&h.set(p,(h.get(p)??0)+1)}for(const[m,p]of h){const P=this.tracks.get(m);!P||be(P.kind)!==s[c].sign>0||p<=0||a.push(u(c,P,p))}l.push(h)}const d=new Set,b=new Set,f=[],_=c=>{c.sort((h,m)=>m.overlap-h.overlap||h.distance-m.distance||h.track.id-m.track.id);for(const h of c)d.has(h.region)||b.has(h.track.id)||(d.add(h.region),b.add(h.track.id),f.push({track:h.track,region:s[h.region],overlap:h.overlap}))};_(a);const w=[];for(const c of this.tracks.values())if(!(b.has(c.id)||!c.lastMask||c.missing>=ht))for(let h=0;h<s.length;h+=1){if(d.has(h)||be(c.kind)!==s[h].sign>0)continue;const m=s[h].bounds;if(c.bounds.x1<=m.x0||m.x1<=c.bounds.x0||c.bounds.y1<=m.y0||m.y1<=c.bounds.y0)continue;let p=0;for(const P of s[h].cells)p+=c.lastMask[P]??0;p>0&&w.push(u(h,c,p))}_(w);const y=[];for(const c of this.tracks.values())if(!(b.has(c.id)||c.missing>=ht))for(let h=0;h<s.length;h+=1){const m=s[h];if(d.has(h)||be(c.kind)!==m.sign>0)continue;const p=Math.min(c.area,m.area)/Math.max(c.area,m.area),P=Math.max(0,c.bounds.x0-m.bounds.x1,m.bounds.x0-c.bounds.x1)*this.width,I=Math.max(0,c.bounds.y0-m.bounds.y1,m.bounds.y0-c.bounds.y1)*this.height,A=Math.hypot((c.center.x-m.center.x)*this.width,(c.center.y-m.center.y)*this.height),G=Math.sqrt(Math.min(c.area,m.area)/Math.PI);p>=.5&&Math.hypot(P,I)<=1.5&&A<=Math.max(3,G*1.25)&&y.push(u(h,c,0))}_(y);const x=new Set;for(const c of this.tracks.values()){let h=0;for(let m=0;m<s.length;m+=1)be(c.kind)===s[m].sign>0&&(l[m].get(c.id)??0)>=s[m].area*.5&&(h+=1);h>1&&x.add(c.id)}const B=new Map([...this.tracks].map(([c,h])=>[c,h.name.hereditary]));for(let c=0;c<s.length;c+=1){if(d.has(c))continue;const h=s[c];if(!h.kind)continue;const m=[...l[c]].filter(([T,U])=>x.has(T)&&U>=h.area*.5&&be(this.tracks.get(T).kind)===h.sign>0).sort((T,U)=>U[1]-T[1]).map(([T])=>this.tracks.get(T)).find(T=>T!==void 0),p=this.nextTrackId++,P=m?s.filter((T,U)=>(l[U].get(m.id)??0)>=T.area*.5).sort((T,U)=>T.center.x-U.center.x||T.center.y-U.center.y):[],I=new Ii({areaFraction:h.area/e.signs.length,now:n,banned:this.usedStems,parent:m?B.get(m.id)?.genes:void 0,fragment:P.indexOf(h)}),A=J(I.genome);this.usedStems.add(A);const G=this.nameText(I.genome),S={id:p,stem:A,name:I,lineage:m?.lineage??p,kind:h.kind,text:G,area:h.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:h.center,bounds:h.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(S.id,S),f.push({track:S,region:h,overlap:0})}for(const{track:c,region:h}of f){const m=s.indexOf(h),p=[...l[m]].filter(([P,I])=>{const A=this.tracks.get(P);if(!A||be(A.kind)!==h.sign>0)return!1;const G=A.name.genome.syllables.length*2+1;return I/h.area>=.5/G}).map(([P,I])=>({track:this.tracks.get(P),weight:I})).sort((P,I)=>I.weight-P.weight||+(I.track===c)-+(P.track===c)||P.track.id-I.track.id);p.length>1&&c.name.recombine(p.map(({track:P,weight:I})=>({...B.get(P.id),weight:I})),h.area/e.signs.length)}const z=new Uint16Array(e.signs.length);for(const{track:c,region:h,overlap:m}of f){if(c.present=!0,m>0){const p=m/Math.min(c.area,h.area);c.agreement=Math.min(c.agreement,.65+.35*p)}c.area=h.area,c.center=h.center,c.bounds=h.bounds,c.missing=0,c.confirmed=!0;for(const p of h.cells)z[p]=c.id}this.owners=z;for(const c of[...this.tracks.values()])f.some(h=>h.track===c)||(c.missing+=i,c.confirmed=!1,c.missing>ht&&(this.tracks.delete(c.id),this.usedStems.delete(c.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}for(const{track:c,region:h}of f){const m=this.allowedMask(h),p=c.name.propose({areaFraction:h.area/e.signs.length,temperature:t,elapsed:i,now:n,banned:this.usedStems});p&&this.rename(c,p,m,n),c.lastMask=m,this.remember(m),this.smooth(c,m,i),this.aim(c,m,i)}this.synced=!0}nameText(e){const t=J(e);return t.charAt(0).toUpperCase()+t.slice(1)}rename(e,t,n,i){const r=J(t.genome);if(i<e.name.nextChangeAt||r!==e.stem&&this.usedStems.has(r))return!1;const s=this.nameText(t.genome),a=e.placement;return a?.alive&&(!this.fitsPose(n,s,this.snapshot(a))||!this.fitsPose(a.mask,s,this.snapshot(a)))?!1:(this.usedStems.delete(e.stem),this.usedStems.add(r),e.name.commit(t,i),e.stem=r,e.text=s,!0)}aim(e,t,n){const i=this.viewport.width*this.viewport.height/t.length,r=Q(Math.sqrt(e.area*i/(Math.max(4,e.text.length)*3.2)),O,te);e.styleFont=e.styleFont===0?r:Ie(e.styleFont,r,n,2.5);const s=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),a=e.placement?.alive?e.placement:null,l=a?.angle??0,u=e.name.pending?this.nameText(e.name.pending.genome):null,d=u&&this.boxWidth(u,O,se(O))>this.boxWidth(e.text,O,se(O))?u:e.text,b=(A,G)=>Math.max(.01,s.quality[A]+.12*G.font/e.styleFont-ki*Math.abs(G.angle)/ie-Li*s.elongation[A]*ze(G.angle,s.axis[A])/ie),f=A=>{const G=[];for(const S of s.candidates){const T=this.cellPoint(S);if(G.some(R=>this.distance(R.pose,T)<s.radius*.55))continue;const U=this.poseAt(A,t,T,e.styleFont,l,s.axis[S],s.elongation[S]);if(U&&(G.push({pose:U,quality:b(S,U)}),G.length>=24))break}if(a){const S=this.index(a.position);if(S>=0&&s.centerX[S]>0){const T={x:s.centerX[S],y:s.centerY[S]},U=this.index(T),R=U<0?null:this.poseAt(A,t,T,e.styleFont,l,s.axis[U],s.elongation[U]);R&&U>=0&&G.push({pose:R,quality:b(U,R)})}}return G};let _=f(d);if(_.length===0&&d!==e.text&&(e.name.pending&&e.name.reject(e.name.pending),_=f(e.text)),_.length===0){a&&this.release(e);return}_.sort((A,G)=>G.quality-A.quality);const w=_[0];if(!a){e.placement=this.spawn(w.pose,t);return}const y=_.filter(A=>this.distance(A.pose,a.position)<=s.radius*1.5).sort((A,G)=>G.quality-this.distance(G.pose,a.position)/(s.radius*16)-(A.quality-this.distance(A.pose,a.position)/(s.radius*16)))[0],x=this.index(a.position),B=y?.quality??(x>=0?s.quality[x]:0),z=w.quality>B*Xi,c=y&&w.quality<=y.quality*1.08?y:w,h=this.snapshot(a),m=this.distance(h,c.pose)<=s.radius*1.5;let p=t,P=!1;if(!this.fitsPose(t,e.text,h)&&(p=this.union(a.regionMask,t),this.remember(p),!this.fitsPose(p,e.text,h)&&m&&a.mask!==a.regionMask&&(p=this.union(a.mask,t),this.remember(p),P=!0),!this.fitsPose(p,e.text,h))){this.relight(e,c.pose,t);return}let I=this.planRoute(e.text,p,h,c.pose);if(!I&&p!==t&&m&&!P&&a.mask!==a.regionMask){const A=this.union(a.mask,t);if(this.remember(A),this.fitsPose(A,e.text,h)){const G=this.planRoute(e.text,A,h,c.pose);G&&(p=A,I=G)}}if(!I){(p!==t||z&&this.distance(h,c.pose)>s.radius*1.5)&&this.relight(e,c.pose,t);return}a.mask=p,a.regionMask=t,a.target=c.pose,a.route=I}poseAt(e,t,n,i,r,s,a){const l=this.index(n);if(l<0||!t[l])return null;let u=null,d=-1/0;const b=this.maxFont(t,e,n,0);if(b>=O){const f=Math.min(i,Math.max(O,b*.9));u={x:n.x,y:n.y,font:f,angle:0},d=f/i-Yt*a*ze(0,s)/ie-.02*ze(0,r)/ie}for(let f=Dt;f<=ie;f+=Dt){const _=Math.min(i,te*.9)/i-qt*f/ie;if(d>=_)break;for(const w of[-f,f]){const y=this.maxFont(t,e,n,w);if(y<O)continue;const x=Math.min(i,Math.max(O,y*.9)),B=x/i-qt*f/ie-Yt*a*ze(w,s)/ie-.02*ze(w,r)/ie;B>d&&(u={x:n.x,y:n.y,font:x,angle:w},d=B)}}return u}landscape(e,t,n,i,r){const s=this.width+1,a=s*(this.height+1),l=new Float64Array(a),u=new Float64Array(a),d=new Float64Array(a),b=new Float64Array(a),f=new Float64Array(a),_=new Float64Array(a),w=new Float32Array(e.length),y=new Float32Array(e.length),x=new Float32Array(e.length),B=new Float32Array(e.length),z=new Float32Array(e.length),c=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),h=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(i*3.5,Math.sqrt(r*c*c)*.33,c*3)),m=Math.max(1,Math.ceil(h*this.width/this.viewport.width)),p=Math.max(1,Math.ceil(h*this.height/this.viewport.height));for(let S=0;S<this.height;S+=1){let T=0,U=0,R=0,H=0,j=0,W=0;for(let V=0;V<this.width;V+=1){const ee=V+S*this.width,D=e[ee]*(.85+.15*n[ee])*Q(t[ee]*c/(i*2),0,1),Y=this.cellPoint(ee);T+=D,U+=D*Y.x,R+=D*Y.y,H+=D*Y.x*Y.x,j+=D*Y.y*Y.y,W+=D*Y.x*Y.y;const F=(S+1)*s+V+1;l[F]=l[F-s]+T,u[F]=u[F-s]+U,d[F]=d[F-s]+R,b[F]=b[F-s]+H,f[F]=f[F-s]+j,_[F]=_[F-s]+W}}const P=(S,T,U,R,H)=>S[H*s+R]-S[U*s+R]-S[H*s+T]+S[U*s+T],I=l[a-1],A=I>0?{x:u[a-1]/I,y:d[a-1]/I}:{x:this.viewport.width/2,y:this.viewport.height/2},G=[];for(let S=0;S<e.length;S+=1){if(!e[S])continue;const T=S%this.width,U=Math.floor(S/this.width),R=Math.max(0,T-m),H=Math.max(0,U-p),j=Math.min(this.width,T+m+1),W=Math.min(this.height,U+p+1),V=P(l,R,H,j,W);if(V<=0)continue;y[S]=P(u,R,H,j,W)/V,x[S]=P(d,R,H,j,W)/V;const ee=Math.max(0,P(b,R,H,j,W)/V-y[S]**2),D=Math.max(0,P(f,R,H,j,W)/V-x[S]**2),Y=P(_,R,H,j,W)/V-y[S]*x[S],F=Math.hypot(ee-D,2*Y);B[S]=.5*Math.atan2(2*Y,ee-D)*180/Math.PI,z[S]=Q(F/(ee+D+1),0,1);const le=V/((m*2+1)*(p*2+1)),ve=Q(t[S]*c/(i*2),0,1);w[S]=.7*le+.3*ve-.08*this.distance(this.cellPoint(S),A)/h,G.push(S)}return G.sort((S,T)=>w[T]-w[S]),{quality:w,centerX:y,centerY:x,axis:B,elongation:z,candidates:G,radius:h}}union(e,t){const n=new Uint8Array(t.length);for(let i=0;i<n.length;i+=1)n[i]=e[i]|t[i];return n}planRoute(e,t,n,i){if(this.posesFit(t,e,n,i))return[i];let r=Math.min(n.font,i.font);for(let s=0;s<9;s+=1){r=Math.max(O,r);for(const a of[...new Set([n.angle,i.angle,0])]){const l={...n,font:r},u={...l,angle:a},d={...i,font:r,angle:a},b={...i,font:r};if(!this.posesFit(t,e,n,l)||!this.posesFit(t,e,l,u)||!this.posesFit(t,e,d,b)||!this.posesFit(t,e,b,i))continue;const f=[];if(Math.abs(n.font-r)>.05&&f.push(l),Math.abs(n.angle-a)>.05&&f.push(u),this.posesFit(t,e,u,d))return f.push(d),Math.abs(i.angle-a)>.05&&f.push(b),f.push(i),f;const _=this.legalPath(e,t,u,d);if(!_)continue;let w=u,y=!0;for(let x=0;x<_.length;){let B=-1;for(let c=_.length-1;c>=x;c-=1){const m={...this.cellPoint(_[c]),font:r,angle:a};if(this.posesFit(t,e,w,m)){B=c;break}}if(B<0){y=!1;break}const z={...this.cellPoint(_[B]),font:r,angle:a};this.distance(w,z)>.5&&f.push(z),w=z,x=B+1}if(!(!y||!this.posesFit(t,e,w,d)))return this.distance(w,d)>.5&&f.push(d),Math.abs(i.angle-a)>.05&&f.push(b),f.push(i),f}if(r<=O)break;r=Math.max(O,r*.82)}return null}legalPath(e,t,n,i){const r=new Uint8Array(t.length),s=y=>{if(r[y]===0){const x={...this.cellPoint(y),font:n.font,angle:n.angle};r[y]=t[y]&&this.fitsPose(t,e,x)?1:2}return r[y]===1},a=y=>{const x=this.index(y);if(x<0)return-1;const B=x%this.width,z=Math.floor(x/this.width);for(let c=0;c<=3;c+=1)for(let h=-c;h<=c;h+=1)for(let m=-c;m<=c;m+=1){const p=B+m,P=z+h;if(p<0||P<0||p>=this.width||P>=this.height)continue;const I=p+P*this.width;if(s(I)&&this.posesFit(t,e,y,{...this.cellPoint(I),font:n.font,angle:n.angle}))return I}return-1},l=a(n),u=a(i);if(l<0||u<0)return null;const d=new Int32Array(t.length).fill(-1),b=new Int32Array(t.length);let f=0,_=0;for(b[_++]=l,d[l]=l;f<_&&d[u]<0;){const y=b[f++],x=y%this.width,B=Math.floor(y/this.width);for(const z of[x>0?y-1:-1,x+1<this.width?y+1:-1,B>0?y-this.width:-1,B+1<this.height?y+this.width:-1])z<0||d[z]>=0||!s(z)||(d[z]=y,b[_++]=z)}if(d[u]<0)return null;const w=[];for(let y=u;y!==l;y=d[y])w.push(y);return w.push(l),w.reverse(),w}glide(e,t,n){if(n<=0)return;const i=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,i)){const P=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,P<O){t.fontVelocity=0;return}const I=$i(t.font,t.fontVelocity,Math.min(t.target.font,P),n);t.font=Math.max(P,Math.min(t.font,I.value)),t.fontVelocity=t.font<=P?0:I.velocity;return}for(;t.route.length>1&&this.distance(i,t.route[0])<.75&&Math.abs(i.font-t.route[0].font)<.15&&Math.abs(i.angle-t.route[0].angle)<.3;)t.route.shift();const r=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,i,r)&&this.distance(i,r)<.2&&Math.abs(i.font-r.font)<.05&&Math.abs(i.angle-r.angle)<.05){t.position={x:r.x,y:r.y},t.font=r.font,t.angle=r.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const a=!this.fitsPose(t.regionMask,e.text,i)?1:Fi,l=Di/a,u=qi/a,d=Yi/a,b=this.distance(i,r),f=b/l,_=Math.abs(r.font-i.font)/u,w=Math.abs(r.angle-i.angle)/d,y=Math.max(f,_,w);let x=0;y===f&&b>0?x=((r.x-i.x)*t.velocity.x+(r.y-i.y)*t.velocity.y)/b/l:y===_&&_>0?x=Math.sign(r.font-i.font)*t.fontVelocity/u:w>0&&(x=Math.sign(r.angle-i.angle)*t.angleVelocity/d),x=Q(x,-1,1);const B=2/(Oi*a),z=Q(B*B*y-2*B*x,-Xt,Xt),c=Q(x+z*n,-1,1),h=Math.min(y,(x+c)*n/2);let m=this.lerpPose(i,r,y>0?h/y:1);if(!(h<0?this.posesFit(t.mask,e.text,i,m):this.fitsPose(t.mask,e.text,m))){const P=this.longestLegal(e.text,t.mask,i,m);if(!P){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}m=P}const p=n>0?1/n:0;t.position={x:m.x,y:m.y},t.velocity={x:(m.x-i.x)*p,y:(m.y-i.y)*p},t.font=m.font,t.fontVelocity=(m.font-i.font)*p,t.angle=m.angle,t.angleVelocity=(m.angle-i.angle)*p}collect(e){const t=[];for(const r of this.tracks.values()){const s=r.placement?[r.placement,...r.ghosts]:r.ghosts;for(const a of s)a.opacity<.015||this.fitsPose(a.mask,r.text,this.snapshot(a))&&t.push({track:r,placement:a})}t.sort((r,s)=>s.track.area-r.track.area);const n=[],i=[];for(const r of t){const{track:s,placement:a}=r,l=n.some(d=>d.track!==s&&this.overlaps(s.text,this.snapshot(a),d.track.text,this.snapshot(d.placement)));a.collisionOpacity=Ie(a.collisionOpacity,l?0:1,e,l?.3:.7),l||n.push(r);const u=a.opacity*a.collisionOpacity;u<.015||i.push({id:a.id,kind:s.kind,text:s.text,x:a.position.x,y:a.position.y,width:this.boxWidth(s.text,a.font,se(a.font)),height:a.font*dt,opacity:u,fontSize:a.font,letterSpacing:se(a.font),angle:a.angle})}return i}relight(e,t,n){const i=e.placement;if(i){const r=this.snapshot(i);if(this.fitsPose(i.mask,e.text,r)&&this.overlaps(e.text,r,e.text,t)){i.target=r,i.route=[],i.velocity={x:0,y:0},i.fontVelocity=0,i.angleVelocity=0,i.regionMask=n;return}i.alive=!1,e.ghosts.push(i)}e.placement=this.spawn(t,n)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,n){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const i=1-Math.exp(-n/Vi),r=e.soft;for(let s=0;s<t.length;s+=1)r[s]+=(t[s]-r[s])*i}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const n of e.cells)t[n]=1;return t}components(e){const t=new Uint8Array(e.length),n=new Int32Array(e.length),i=[];for(let r=0;r<e.length;r+=1){if(t[r])continue;const s=i.length,a=e[r]<0?-1:1,l=[];let u=0,d=0,b=this.width,f=this.height,_=0,w=0;const y=[r];for(t[r]=1;y.length;){const c=y.pop();l.push(c),n[c]=s;const h=c%this.width,m=Math.floor(c/this.width);u+=h+.5,d+=m+.5,b=Math.min(b,h),f=Math.min(f,m),_=Math.max(_,h+1),w=Math.max(w,m+1);for(const p of this.neighbors(c))t[p]||(e[p]<0?-1:1)!==a||(t[p]=1,y.push(p))}const x=l.length/e.length;let B=null,z="hole";a>0?x>=Ti?(B="continent",z="place"):x>=Ei&&(B="island",z="place"):_-b>this.width*Vt&&w-f>this.height*Vt||b===0||f===0||_===this.width||w===this.height?z="sea":x>=Ai&&(B="lake",z="place"),i.push({sign:a,area:l.length,cells:l,kind:B,role:z,center:{x:u/l.length/this.width,y:d/l.length/this.height},bounds:{x0:b/this.width,y0:f/this.height,x1:_/this.width,y1:w/this.height}})}for(const r of i){if(r.kind!=="lake")continue;const s=new Map;let a=0;for(const l of r.cells)for(const u of this.neighbors(l)){const d=n[u];i[d].sign<0||(s.set(d,(s.get(d)??0)+1),a+=1)}(a===0||Math.max(...s.values())*5<a*4)&&(r.kind=null,r.role="sea")}return i}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),n=new Int32Array(e.length);let i=0;for(let r=0;r<e.length;r+=1){const s=r%this.width,a=Math.floor(r/this.width);(!e[r]||s===0||a===0||s===this.width-1||a===this.height-1)&&(t[r]=0,n[i++]=r)}for(let r=0;r<i;r+=1){const s=n[r],a=s%this.width,l=Math.floor(s/this.width);for(const u of[a>0?s-1:-1,a+1<this.width?s+1:-1,l>0?s-this.width:-1,l+1<this.height?s+this.width:-1])u<0||t[u]>=0||(t[u]=t[s]+1,n[i++]=u)}return t}prefix(e){const t=this.width+1,n=new Int32Array(t*(this.height+1));for(let i=0;i<this.height;i+=1){let r=0;for(let s=0;s<this.width;s+=1)r+=e[s+i*this.width],n[(i+1)*t+s+1]=n[i*t+s+1]+r}return n}maxFont(e,t,n,i){if(!this.fits(e,t,n,O,se(O),i))return 0;if(this.fits(e,t,n,te,se(te),i))return te;let r=O,s=te;for(let a=0;a<8;a+=1){const l=(r+s)/2;this.fits(e,t,n,l,se(l),i)?r=l:s=l}return r}fitsPose(e,t,n){return Math.abs(n.angle)<=ie&&this.fits(e,t,n,n.font,se(n.font),n.angle)}posesFit(e,t,n,i){if(!this.fitsPose(e,t,n)||!this.fitsPose(e,t,i))return!1;const r=Math.max(1,Math.ceil(Math.max(this.distance(n,i)/4,Math.abs(n.font-i.font),Math.abs(n.angle-i.angle)/2)));for(let s=1;s<r;s+=1)if(!this.fitsPose(e,t,this.lerpPose(n,i,s/r)))return!1;return!0}longestLegal(e,t,n,i){if(!this.fitsPose(t,e,n))return null;let r=0,s=1;for(let a=0;a<8;a+=1){const l=(r+s)/2;this.posesFit(t,e,n,this.lerpPose(n,i,l))?r=l:s=l}return r<=0?null:this.lerpPose(n,i,r)}fits(e,t,n,i,r,s){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const a=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),l=Math.max(Ri,a*1.25),u=this.boxWidth(t,i,r)/2+l,d=i*dt/2+l,b=s*Math.PI/180,f=Math.cos(b),_=Math.sin(b),w=Math.abs(u*f)+Math.abs(d*_),y=Math.abs(u*_)+Math.abs(d*f);if(n.x-w<0||n.y-y<0||n.x+w>this.viewport.width||n.y+y>this.viewport.height)return!1;const x=this.prefixFields.get(e);if(x){const p=Math.floor((n.x-w)*this.width/this.viewport.width),P=Math.floor((n.y-y)*this.height/this.viewport.height),I=Math.min(this.width,Math.ceil((n.x+w)*this.width/this.viewport.width)),A=Math.min(this.height,Math.ceil((n.y+y)*this.height/this.viewport.height)),G=this.width+1;if(x[A*G+I]-x[P*G+I]-x[A*G+p]+x[P*G+p]===(I-p)*(A-P))return!0}const B=this.distanceFields.get(e),z=this.index(n);if(B&&z>=0){const p=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(B[z]-2)*p/Math.SQRT2)>=Math.hypot(u,d))return!0}const c=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),h=Math.max(2,Math.ceil(u*2/c)),m=Math.max(2,Math.ceil(d*2/c));for(let p=0;p<=m;p+=1){const P=-d+p*d*2/m;for(let I=0;I<=h;I+=1){const A=-u+I*u*2/h,G=Math.floor((n.x+A*f-P*_)*this.width/this.viewport.width),S=Math.floor((n.y+A*_+P*f)*this.height/this.viewport.height);if(G<0||S<0||G>=this.width||S>=this.height||!e[G+S*this.width])return!1}}return!0}overlaps(e,t,n,i){const r=(l,u)=>{const d=u.angle*Math.PI/180,b=this.boxWidth(l,u.font,se(u.font))/2+7,f=u.font*dt/2+7;return{x:Math.abs(b*Math.cos(d))+Math.abs(f*Math.sin(d)),y:Math.abs(b*Math.sin(d))+Math.abs(f*Math.cos(d))}},s=r(e,t),a=r(n,i);return Math.abs(t.x-i.x)<s.x+a.x&&Math.abs(t.y-i.y)<s.y+a.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const n=e.width/t.width,i=e.height/t.height,r=(n+i)/2;for(const s of this.tracks.values()){s.styleFont=Q(s.styleFont*r,O,te);const a=s.placement?[s.placement,...s.ghosts]:s.ghosts;for(const l of a)this.scalePlacement(l,n,i,r)}}this.viewport=e}scalePlacement(e,t,n,i){e.position={x:e.position.x*t,y:e.position.y*n},e.velocity={x:e.velocity.x*t,y:e.velocity.y*n},e.font=Q(e.font*i,O,te),e.fontVelocity*=i,e.target={x:e.target.x*t,y:e.target.y*n,font:Q(e.target.font*i,O,te),angle:e.target.angle},e.route=e.route.map(r=>({x:r.x*t,y:r.y*n,font:Q(r.font*i,O,te),angle:r.angle}))}regrid(e,t,n,i,r){const s=new e.constructor(i*r);if(e.length!==t*n||t<1||n<1)return s;for(let a=0;a<r;a+=1)for(let l=0;l<i;l+=1)s[l+a*i]=e[Math.min(t-1,Math.floor((l+.5)*t/i))+Math.min(n-1,Math.floor((a+.5)*n/r))*t];return s}regridFloat(e,t,n,i,r){const s=new Float32Array(i*r);if(e.length!==t*n||t<1||n<1)return s;for(let a=0;a<r;a+=1)for(let l=0;l<i;l+=1)s[l+a*i]=e[Math.min(t-1,Math.floor((l+.5)*t/i))+Math.min(n-1,Math.floor((a+.5)*n/r))*t];return s}neighbors(e){const t=e%this.width,n=Math.floor(e/this.width);return[(t+1)%this.width+n*this.width,(t-1+this.width)%this.width+n*this.width,t+(n+1)%this.height*this.width,t+(n-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,n){return{x:Ve(e.x,t.x,n),y:Ve(e.y,t.y,n),font:Ve(e.font,t.font,n),angle:Ve(e.angle,t.angle,n)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),n=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&n>=0&&n<this.height?t+n*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,n){const i=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(i?.58:.56)+n)+4;const r=i?`i:${e}`:e;let s=this.textMetrics.get(r);return s===void 0&&(this.measure.font=`${i?"italic ":""}500 100px ${Hi}`,this.measure.fontKerning="none",s=this.measure.measureText(e).width/100,this.textMetrics.set(r,s)),s*t+e.length*n+4}}const Ki=.6,Qi=(o,e,t,n=!1)=>{if(!o||n)return{from:null,to:e,progress:1};if(o.from===null)return e===o.to?o:{from:o.to,to:e,progress:0};const i=Number.isFinite(t)?Math.max(0,t):0,r=Math.min(1,o.progress+i/Ki);return r<1-1e-9?{...o,progress:r}:e===o.to?{from:null,to:e,progress:1}:{from:o.to,to:e,progress:0}},Ji=o=>{const e=o.from===null?1:o.progress**2*(3-2*o.progress);return{previous:o.from,current:o.to,previousOpacity:1-e,currentOpacity:e}},ft=2.4,Zi=12,en=(o,e,t,n,i,r)=>{if(n<=0)return o;const s=Math.max(0,t),a=s+n,u=(r-i)/Zi*(n-ft*(Math.exp(-s/ft)-Math.exp(-a/ft)));return Math.max(i,Math.min(r,o+e*u))},tn=(o,e,t,n)=>({freeze:e>t?Math.max(0,Math.min(1,(e-o)/(e-t))):0,heat:e<n?Math.max(0,Math.min(1,(o-e)/(n-e))):0}),Ht=2/Math.log(1+Math.sqrt(2)),nn=30,gt=40,sn=45,C=o=>{const e=document.getElementById(o);if(!e)throw new Error(`Missing #${o}`);return e},$=C("field"),xe=C("scale"),ye=C("temperature"),pt=C("time-speed"),De=C("brush-size"),rn=C("scale-value"),on=C("temperature-value"),an=C("time-speed-value"),ln=C("brush-size-value"),cn=C("explanation"),Ae=C("settings-toggle"),qe=C("settings-panel"),Ye=C("pause"),un=C("restart"),hn=C("clear-blue"),mt=C("rough"),bt=C("smooth"),xt=C("scale-dock"),dn=C("scale-readout"),Xe=C("freeze"),He=C("heat"),yt=C("phase"),wt=C("magnetization"),vt=C("energy"),Ke=C("fatal-error"),fn=C("place-labels"),gn=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function pn(){const o=await ui();if(!o){Ke.hidden=!1,Ke.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new fi(o.device,o.format,$);let t=Number(ye.value),n=t,i=Number(xe.value),r=i,s=Number(pt.value),a=Number(De.value),l=!1,u=!0,d=!1,b=!1,f=!1,_=0,w=0,y=null,x=!0,B=0,z=performance.now(),c=0,h=!1,m=0;const p=new Map;let P=!1,I=0,A=i,G=!1,S=!1,T=0,U=0,R=!1,H=0;const j=new ji,W=new Map,V=new Map,ee=window.matchMedia("(prefers-reduced-motion: reduce)"),D=new Map,Y=new Map,F=new Map;let le=null,ve=0;const Te=new Map,et=new Set,tt=new Set,it=new Set,nt=new Set,Pt=Ht+.2,Ue=Number(xe.min),ce=Number(xe.max),St=Number(ye.min),Bt=Number(ye.max),si=.75;let _e=0,st=0;const ri=(ce-Ue)/2.2,Gt=Math.ceil((gt-1)/2),oi=()=>{const g=Math.max(1,window.innerWidth),v=Math.max(1,window.innerHeight),E=g<=720?Math.min(window.devicePixelRatio||1,2):1,L=Math.min(o.device.limits.maxTextureDimension2D/g,o.device.limits.maxTextureDimension2D/v),M=Math.sqrt(Number(o.device.limits.maxStorageBufferBindingSize)/4/(g*v)),K=Math.max(.25,Math.min(E,L,M)),ne=Math.max(1,Math.round(g*K)),me=Math.max(1,Math.round(v*K));return{density:ne/g,width:ne,height:me}},rt=g=>{const v=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**g-1)*v))},Ce=()=>rt(i)*2+1,ai=()=>{const g=Math.min(e.width,e.height)/65.64;if(g<=0)return ce;let v=Math.log2(1+Math.max(0,(Gt-.5)/g));for(v=Math.min(ce,Math.max(Ue,v));v<ce&&rt(v)<Gt;)v=Math.min(ce,v+.01);return v},Me=()=>{const g=Ce(),v=g===1?"1 spin":`${g} × ${g}`;xe.value=i.toFixed(2),xt.value=i.toFixed(2),rn.textContent=v,dn.textContent=v,cn.textContent=gn[Math.min(3,Math.floor(i+.25))],mt.setAttribute("aria-label",`Rough, observation scale ${i.toFixed(2)}`),bt.setAttribute("aria-label",`Smooth, observation scale ${i.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-i/3)**2).toFixed(3))},Pe=()=>{ye.value=t.toFixed(2),on.textContent=`T = ${t.toFixed(2)}`;const g=tn(t,n,St,Bt);Xe.style.setProperty("--paddle-progress",g.freeze.toFixed(4)),He.style.setProperty("--paddle-progress",g.heat.toFixed(4)),Xe.setAttribute("aria-label",`Freeze, current temperature ${t.toFixed(2)}`),He.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const v=t-Ht;v<-.2?yt.textContent="ordered":v>.2?yt.textContent="disordered":yt.textContent="critical"},It=()=>{const g=Number.isInteger(s)?0:1;an.textContent=`${s.toFixed(g)}×`},ot=()=>{De.value=String(a),ln.textContent=`${a} px`},li=()=>({active:f&&!P&&!S,painting:d,forceHot:b,x:_,y:w,radius:a/2}),Se=()=>{const g=Ce(),v=(g-1)/2,E=g===1?0:.14*(1-i/3)**2;e.draw(i,v,E,T,li()),x=!1},zt=()=>{U+=1,j.reset(),le=null,D.clear(),Y.clear(),F.clear(),Te.clear(),V.clear(),At([],0)},At=(g,v)=>{const E=new Set,L={width:$.clientWidth,height:$.clientHeight};for(const M of g){if(E.add(M.id),le&&Te.get(M.id)!==ve){const Z=bi(M,le,L);D.set(M.id,xi(D.get(M.id),Z)),Te.set(M.id,ve)}const K=wi(Y.get(M.id),D.get(M.id)?.mode??"dark",v);Y.set(M.id,K);const ne=vi(K),me=mi(M.kind,K.from,K.to,ne.blend),Ge=yi(F.get(M.id),D.get(M.id)?.opacity??1,v);F.set(M.id,Ge);const ue=Wi(M),Ne=Qi(V.get(M.id),M.text,v,ee.matches);V.set(M.id,Ne);const k=Ji(Ne);let q=W.get(M.id);for(q||(q=[],W.set(M.id,q));q.length<ue.length;){const Z=document.createElement("span");Z.className="place-label";const X=document.createElement("span");X.className="place-label-text",Z.append(X),fn.append(Z),q.push({node:Z,current:X,previous:null})}for(;q.length>ue.length;)q.pop()?.node.remove();for(let Z=0;Z<ue.length;Z+=1){const X=q[Z],{node:oe,current:ct}=X,Rt=ue[Z];oe.dataset.kind!==M.kind&&(oe.dataset.kind=M.kind),ct.textContent!==k.current&&(ct.textContent=k.current),ct.style.opacity=k.currentOpacity.toFixed(3),k.previous!==null?(X.previous||(X.previous=document.createElement("span"),X.previous.className="place-label-text place-label-text-previous",X.previous.setAttribute("aria-hidden","true"),oe.prepend(X.previous)),X.previous.textContent!==k.previous&&(X.previous.textContent=k.previous),X.previous.style.opacity=k.previousOpacity.toFixed(3)):X.previous&&(X.previous.remove(),X.previous=null),oe.style.color=me,oe.style.opacity=(M.opacity*Ge).toFixed(3),oe.style.fontSize=`${M.fontSize.toFixed(2)}px`,oe.style.letterSpacing=`${M.letterSpacing.toFixed(2)}px`,oe.style.transform=`translate(${Rt.x.toFixed(2)}px, ${Rt.y.toFixed(2)}px) rotate(${M.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[M,K]of W)if(!E.has(M)){for(const{node:ne}of K)ne.remove();W.delete(M),V.delete(M),D.delete(M),Y.delete(M),F.delete(M),Te.delete(M)}},Et=(g=!0)=>{const v=oi();if(e.resize(v.width,v.height,v.density,g),!g){const E=Math.min(e.width,e.height)/65.64,L=(sn-1)/2;i=Math.max(Ue,Math.min(ce,Math.log2(1+L/E))),r=i}Me(),x=!0,Se(),m+=1,U+=1,le=null},Re=g=>{const v=$.getBoundingClientRect(),E=(g.clientX-v.left)/v.width,L=(g.clientY-v.top)/v.height;return E<0||E>=1||L<0||L>=1?null:(_=g.clientX-v.left,w=g.clientY-v.top,{x:E*e.width,y:L*e.height})},ke=(g,v)=>{const E=Re(g);if(!E){y=null;return}const L=y??E;e.paintSegment(L.x,L.y,E.x,E.y,a*e.density/2,v,b),y=E,x=!0},at=g=>{d=!0,y=null,ke(g,!0),b=!1},Tt=()=>{const g=[...p.values()];return g.length<2?0:Math.hypot(g[1].x-g[0].x,g[1].y-g[0].y)},Be=()=>{if(h)return;h=!0;const g=m;e.readStats().then(v=>{if(g!==m)return;wt.textContent=v.magnetization.toFixed(3),vt.textContent=v.energy.toFixed(3);const E=v.signedMagnetization===-1;!d&&b!==E&&(b=E,x=!0)}).catch(v=>{console.warn("Could not read Ising statistics.",v)}).finally(()=>{h=!1})},Ut=g=>{i=g,r=i,Me(),x=!0};xe.addEventListener("input",()=>Ut(Number(xe.value))),xt.addEventListener("input",()=>Ut(Number(xt.value))),ye.addEventListener("input",()=>{n=Number(ye.value),t=n,_e=0,Pe()});const Le=(g,v)=>{const E=()=>{g.setAttribute("aria-pressed",String(v.size>0))},L=M=>{v.delete(`pointer:${M.pointerId}`),g.hasPointerCapture(M.pointerId)&&g.releasePointerCapture(M.pointerId),E()};g.addEventListener("pointerdown",M=>{M.pointerType==="mouse"&&M.button!==0||(M.preventDefault(),g.setPointerCapture(M.pointerId),v.add(`pointer:${M.pointerId}`),E())}),g.addEventListener("pointerup",L),g.addEventListener("pointercancel",L),g.addEventListener("lostpointercapture",M=>{v.delete(`pointer:${M.pointerId}`),E()}),g.addEventListener("keydown",M=>{M.code!=="Space"&&M.code!=="Enter"||(M.preventDefault(),v.add(`key:${M.code}`),E())}),g.addEventListener("keyup",M=>{M.code!=="Space"&&M.code!=="Enter"||(M.preventDefault(),v.delete(`key:${M.code}`),E())}),g.addEventListener("blur",()=>{for(const M of v)M.startsWith("key:")&&v.delete(M);E()})};Le(mt,et),Le(bt,tt),Le(Xe,it),Le(He,nt),pt.addEventListener("input",()=>{s=Number(pt.value),It()}),De.addEventListener("input",()=>{a=Number(De.value),ot(),x=!0}),window.addEventListener("keydown",g=>{g.code!=="BracketLeft"&&g.code!=="BracketRight"||(g.preventDefault(),a=Math.max(4,Math.min(100,a+(g.code==="BracketLeft"?-4:4))),ot(),x=!0)});const lt=g=>{u=g,qe.classList.toggle("is-closed",!u),qe.setAttribute("aria-hidden",String(!u)),Ae.setAttribute("aria-expanded",String(u)),Ae.setAttribute("aria-label",u?"Close settings":"Open settings")};Ae.addEventListener("click",()=>lt(!u)),document.addEventListener("pointerdown",g=>{const v=g.target;!u||!(v instanceof Node)||qe.contains(v)||Ae.contains(v)||lt(!1)},{capture:!0}),document.addEventListener("click",g=>{const v=g.target;!u||!(v instanceof Node)||Ae.contains(v)||(!qe.contains(v)||v instanceof Element&&v.closest("button"))&&lt(!1)}),Ye.addEventListener("click",()=>{l=!l;const g=l?"Resume simulation":"Pause simulation";Ye.setAttribute("aria-pressed",String(l)),Ye.setAttribute("aria-label",g),Ye.title=g,B=0}),un.addEventListener("click",()=>{e.randomize(),b=!1,B=0,m+=1,zt(),wt.textContent="0.000",vt.textContent="0.000",x=!0,Se(),Be()}),hn.addEventListener("click",()=>{e.clearBlue(),b=!0,B=0,m+=1,zt(),wt.textContent="1.000",vt.textContent="-2.000",x=!0,Se(),Be()}),$.addEventListener("pointerdown",g=>{if(Re(g)){if($.setPointerCapture(g.pointerId),f=!0,g.pointerType==="touch"){p.set(g.pointerId,{x:g.clientX,y:g.clientY}),p.size===1?(G=!0,S=!1):p.size===2&&(d=!1,y=null,G=!1,S=!0,P=!0,I=Tt(),A=r),x=!0;return}at(g)}}),$.addEventListener("pointermove",g=>{if(Re(g),f=!0,x=!0,g.pointerType==="touch"){if(!p.has(g.pointerId))return;if(p.set(g.pointerId,{x:g.clientX,y:g.clientY}),P&&p.size>=2){const v=Tt();I>0&&v>0&&(r=Math.max(0,Math.min(3,A-Math.log2(v/I)*.9)));return}if(p.size===1&&!S){if(G)at(g),G=!1;else if(d)for(const v of g.getCoalescedEvents())ke(v,!1)}return}if(d){const v=g.getCoalescedEvents();if(v.length===0)ke(g,!1);else for(const E of v)ke(E,!1)}});const ci=g=>{g.pointerType==="touch"&&(G&&!S&&at(g),p.delete(g.pointerId),p.size<2&&(P=!1),p.size===0&&(G=!1,S=!1,f=!1)),d=!1,y=null,$.hasPointerCapture(g.pointerId)&&$.releasePointerCapture(g.pointerId),x=!0,Be()};$.addEventListener("pointerup",ci),$.addEventListener("pointercancel",g=>{p.delete(g.pointerId),d=!1,f=!1,y=null,G=!1,P=!1,x=!0}),$.addEventListener("pointerenter",()=>{f=!0,x=!0}),$.addEventListener("pointerleave",()=>{d||(f=!1,x=!0)}),$.addEventListener("wheel",g=>{g.preventDefault();const v=Math.max(-120,Math.min(120,g.deltaY));r=Math.max(0,Math.min(3,r+v*.00125)),Re(g),f=!0},{passive:!1}),window.addEventListener("blur",()=>{d=!1,f=!1,y=null,p.clear(),P=!1,G=!1,et.clear(),tt.clear(),it.clear(),nt.clear(),_e=0,st=0,mt.setAttribute("aria-pressed","false"),bt.setAttribute("aria-pressed","false"),Xe.setAttribute("aria-pressed","false"),He.setAttribute("aria-pressed","false"),x=!0}),window.addEventListener("resize",()=>Et(!0)),Et(!1),e.step(t,40),Pe(),It(),ot(),x=!0,Se(),Be();const Ct=g=>{const v=Math.max(0,(g-z)/1e3),E=Math.min(.1,v);z=g;const L=+(tt.size>0)-+(et.size>0);if(L!==0){const k=L<0?Ue:ce,q=L*ri*E;i=L<0?Math.max(k,i+q):Math.min(k,i+q),r=i,Me(),x=!0}else{const k=r-i;Math.abs(k)>5e-4?(i+=k*(1-Math.exp(-E*10)),Me(),x=!0):i!==r&&(i=r,Me(),x=!0)}const M=+(nt.size>0)-+(it.size>0);if(M!==st&&(_e=0,st=M),M!==0)t=en(t,M,_e,E,St,Bt),_e+=E,Pe();else{const k=n-t;Math.abs(k)>5e-4?(t+=k*(1-Math.exp(-E/si)),Pe()):t!==n&&(t=n,Pe())}if(!l){B+=E*nn*s;const k=Math.min(8,Math.floor(B));k>0&&(B-=k,e.step(t,k),x=!0)}const K=Ce()>=gt?1:0,ne=K-T;Math.abs(ne)>.001?(T+=ne*(1-Math.exp(-E*7)),x=!0):T!==K&&(T=K,x=!0);const me=Ce()>=gt?i:ai(),Ge=t>Pt?"chaos":"map",ue=$.getBoundingClientRect(),Ne=j.advance(Math.min(.5,v),Ge,{width:ue.width,height:ue.height});if(At(Ne,v),x&&Se(),!R&&Ge==="map"&&g-H>280){H=g,R=!0;const k=U;e.readRegionSample(rt(me),me).then(q=>{k!==U||!q||t>Pt||(le=q,ve+=1,j.ingest(q,t))}).catch(q=>{console.warn("Could not read Ising regions.",q)}).finally(()=>{R=!1})}g-c>750&&(c=g,Be()),requestAnimationFrame(Ct)};requestAnimationFrame(Ct)}pn().catch(o=>{console.error(o),Ke.hidden=!1,Ke.textContent=o instanceof Error?o.message:"Could not start the WebGPU simulation."});
