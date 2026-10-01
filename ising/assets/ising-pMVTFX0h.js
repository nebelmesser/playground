(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();async function Vt(){try{if(!navigator.gpu)return null;const l=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!l)return null;const e=await l.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(l){return console.error("WebGPU initialization failed.",l),null}}const Dt=`struct SimParams {
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
`,T=(l,e)=>Math.ceil(l/e),ze=112,Ie=128,qt=(l,e)=>l>=e?{width:ze,height:Math.max(1,Math.round(ze*e/l))}:{width:Math.max(1,Math.round(ze*l/e)),height:ze};class $t{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,s){this.device=e,this.format=t,this.canvas=s;const n=s.getContext("webgpu");if(!n)throw new Error("Could not create a WebGPU canvas context.");this.context=n,this.context.configure({device:e,format:t,alphaMode:"opaque"});const i=e.createShaderModule({label:"Ising shaders",code:Dt});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:i,entryPoint:"fullscreen_vertex"},fragment:{module:i,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising label blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:Ie*Ie*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:Ie*Ie*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,s,n=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=s;return}const i=this.width,r=this.height,o=this.spinBuffers,a=this.fieldTexture,c=this.blurTextures,h=this.labelBlurTextures,m=this.statsOutput,p=this.statsReadback,B=o?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=s,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),n&&B){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,i,r);const v=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:B}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),w=this.device.createCommandEncoder({label:"Resize Ising grid"}),b=w.beginComputePass();b.setPipeline(this.pipelines.resize),b.setBindGroup(0,v),b.dispatchWorkgroups(T(e,8),T(t,8)),b.end(),this.device.queue.submit([w.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...m?[m]:[]],readback:p??void 0,textures:[a,...c??[],...h??[]].filter(v=>!!v)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let s=0;s<t;s+=1){const n=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,n);const i=this.device.createCommandEncoder({label:"Advance Ising state"}),r=i.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(T(this.width,8),T(this.height,8)),r.end(),this.device.queue.submit([i.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,s,n,i,r,o){const a=Math.floor(Math.min(e,s)-i),c=Math.floor(Math.min(t,n)-i),h=Math.ceil(Math.max(e,s)+i),m=Math.ceil(Math.max(t,n)+i),p=h-a+1,B=m-c+1;this.writeBrushParams(a,c,p,B,e,t,s,n,i,o);const v=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const b=v.beginComputePass();b.setPipeline(this.pipelines.select),b.setBindGroup(0,this.selectGroups[this.currentIndex]),b.dispatchWorkgroups(1),b.end()}const w=v.beginComputePass();w.setPipeline(this.pipelines.paint),w.setBindGroup(0,this.paintGroups[this.currentIndex]),w.dispatchWorkgroups(T(p,8),T(B,8)),w.end(),this.device.queue.submit([v.finish()]),this.fieldDirty=!0}draw(e,t,s,n,i){if(!this.renderGroup||!this.observationReady())return;const r=this.secondaryObservationRadius(t,e),o=this.fieldDirty||t!==this.lastBlurRadius||r!==this.lastSecondaryRadius,a=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const h=a.beginComputePass();h.setPipeline(this.pipelines.field),h.setBindGroup(0,this.fieldGroups[this.currentIndex]),h.dispatchWorkgroups(T(this.width,8),T(this.height,8)),h.end(),this.fieldDirty=!1}o&&this.appendObservationBlur(a,t,r,"display"),this.writeRenderParams(e,t,s,n,i);const c=a.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});c.setPipeline(this.pipelines.render),c.setBindGroup(0,this.renderGroup),c.draw(3),c.end(),this.device.queue.submit([a.finish()])}async readRegionSample(e,t){const s=this.regionGroup;if(!s||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const n=qt(this.width,this.height),i=n.width*n.height;if(i*4>this.regionStorage.size)return null;const r=this.secondaryObservationRadius(e,t),o=e===this.lastBlurRadius&&r===this.lastSecondaryRadius,a=o?s:this.labelRegionGroup;if(!a)return null;const c=this.device.createCommandEncoder({label:"Read Ising regions"});o||this.appendObservationBlur(c,e,r,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([n.width,n.height,0,0]));const h=c.beginComputePass();h.setPipeline(this.pipelines.regions),h.setBindGroup(0,a),h.dispatchWorkgroups(T(n.width,8),T(n.height,8)),h.end(),c.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,i*4),this.device.queue.submit([c.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const m=new Int32Array(this.regionReadback.getMappedRange(),0,i),p=new Int8Array(i),B=new Float32Array(i);for(let v=0;v<i;v+=1)p[v]=m[v]<0?-1:1,B[v]=(Math.abs(m[v])-1)/65534;return{width:n.width,height:n.height,signs:p,luminance:B}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,s=this.statsGroups[this.currentIndex];if(!e||!t||!s)return{energy:0,magnetization:0,signedMagnetization:0};const n=T(this.width,16),i=T(this.height,16),r=new Uint32Array([this.width,this.height,n,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(e);const a=o.beginComputePass();a.setPipeline(this.pipelines.stats),a.setBindGroup(0,s),a.dispatchWorkgroups(n,i),a.end(),o.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([o.finish()]),await t.mapAsync(GPUMapMode.READ);const c=new Int32Array(t.getMappedRange()),h=c[0],m=c[1];t.unmap();const p=this.width*this.height;return{magnetization:Math.abs(h/p),signedMagnetization:h/p,energy:m/p}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}))}writeSimParams(e,t,s,n,i=0,r=0){const o=new ArrayBuffer(32),a=new DataView(o);a.setUint32(0,this.width,!0),a.setUint32(4,this.height,!0),a.setUint32(8,e,!0),a.setUint32(12,t,!0),a.setFloat32(16,s,!0),a.setUint32(20,n,!0),a.setUint32(24,i,!0),a.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(e,t,s,n,i,r,o,a,c,h){const m=new ArrayBuffer(64),p=new DataView(m);p.setUint32(0,this.width,!0),p.setUint32(4,this.height,!0),p.setInt32(8,e,!0),p.setInt32(12,t,!0),p.setUint32(16,s,!0),p.setUint32(20,n,!0),p.setUint32(24,h?1:0,!0),p.setFloat32(32,i,!0),p.setFloat32(36,r,!0),p.setFloat32(40,o,!0),p.setFloat32(44,a,!0),p.setFloat32(48,c,!0),this.device.queue.writeBuffer(this.brushUniform,0,m)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,s,n){const i=n==="display",r=i?this.blurUniforms:this.labelBlurUniforms,o=i?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,a=i?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,c=i?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,h=i?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!a||!c||!h||o.length===0)return;this.writeBlurParams(r[0],t),this.writeBlurParams(r[1],s);const m=e.beginComputePass({label:"Horizontal Ising observation blur"});m.setPipeline(this.pipelines.blurSpinsHorizontal),m.setBindGroup(0,o[this.currentIndex]),m.dispatchWorkgroups(T(this.height,64)),m.end();const p=e.beginComputePass({label:"Vertical Ising observation blur"});if(p.setPipeline(this.pipelines.blurTextureVertical),p.setBindGroup(0,a),p.dispatchWorkgroups(T(this.width,64)),p.end(),s>0){const B=e.beginComputePass({label:"Secondary horizontal Ising blur"});B.setPipeline(this.pipelines.blurTextureHorizontal),B.setBindGroup(0,c),B.dispatchWorkgroups(T(this.height,64)),B.end();const v=e.beginComputePass({label:"Secondary vertical Ising blur"});v.setPipeline(this.pipelines.blurTextureVertical),v.setBindGroup(0,h),v.dispatchWorkgroups(T(this.width,64)),v.end()}i&&(this.lastBlurRadius=t,this.lastSecondaryRadius=s)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,s,n,i){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=t,r[5]=e,r[6]=s,r[7]=i.active?1:0,r[8]=i.x*this.density,r[9]=i.y*this.density,r[10]=i.radius*this.density,r[11]=i.painting?1:0,r[12]=i.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),r[14]=n,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const s of e.buffers)s.destroy();for(const s of e.textures??[])s.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const Ht={land:{dark:"#050302",light:"#ffd5a6"},water:{dark:"#06132e",light:"#c4eaff"}},Ut=(l,e,t)=>Math.max(e,Math.min(t,l)),Xt=l=>l<=.04045?l/12.92:((l+.055)/1.055)**2.4,wt=l=>{const e=[1,3,5].map(t=>Xt(parseInt(l.slice(t,t+2),16)/255));return e[0]*.2126+e[1]*.7152+e[2]*.0722},vt=(l,e)=>(Math.max(l,e)+.05)/(Math.min(l,e)+.05),ke=(l,e)=>Ht[l==="lake"?"water":"land"][e],Yt=(l,e,t,s)=>{const n=ke(l,e),i=ke(l,t);return`rgb(${[1,3,5].map(o=>{const a=parseInt(n.slice(o,o+2),16),c=parseInt(i.slice(o,o+2),16);return(a+(c-a)*s).toFixed(2)}).join(", ")})`},Wt=(l,e,t)=>{const s=l.angle*Math.PI/180,n=Math.cos(s),i=Math.sin(s),r=wt(ke(l.kind,"dark")),o=wt(ke(l.kind,"light")),a=[],c=[];for(let m=-1;m<=1;m+=1)for(let p=-4;p<=4;p+=1){const B=p*l.width*.105,v=m*l.height*.28,w=l.x+B*n-v*i,b=l.y+B*i+v*n,u=Math.max(0,Math.min(e.width-1,Math.floor(w/t.width*e.width))),d=Math.max(0,Math.min(e.height-1,Math.floor(b/t.height*e.height))),g=e.luminance[d*e.width+u];a.push(vt(g,r)),c.push(vt(g,o))}a.sort((m,p)=>m-p),c.sort((m,p)=>m-p);const h=Math.floor((a.length-1)*.25);return{dark:a[h],light:c[h]}},Kt=(l,e)=>{const t=l?l.darkContrast*.55+e.dark*.45:e.dark,s=l?l.lightContrast*.55+e.light*.45:e.light;let n=l?.mode??(t>=2.5||s<4.5?"dark":"light");const i=n==="dark"?s:t,o=(n==="dark"?t:s)<(n==="dark"?2.5:3)&&i>4.5?(l?.weakSamples??0)+1:0,a=o>=5;return a&&(n=n==="dark"?"light":"dark"),{mode:n,darkContrast:t,lightContrast:s,weakSamples:a?0:o,opacity:n==="dark"?Ut(.82+(5-t)*.06,.82,1):1}},jt=(l,e,t)=>l===void 0?e:l+(e-l)*(1-Math.exp(-Ut(t,0,.5)/.8)),Qt=(l,e,t)=>{if(!l)return{from:e,to:e,progress:1,velocity:0};let s=l;if(s.from===s.to){if(e===s.to)return s;s={from:s.to,to:e,progress:0,velocity:0}}const n=e===s.to?1:0,i=Math.max(0,Math.min(t,1/60)),r=5,o=s.progress-n,a=s.velocity+r*o,c=Math.exp(-r*i),h=Math.max(0,Math.min(1,n+(o+a*i)*c)),m=(s.velocity-r*a*i)*c;return Math.abs(h-n)<.001&&Math.abs(m)<.02?{from:e,to:e,progress:1,velocity:0}:{...s,progress:h,velocity:m}},Jt=l=>l.from===l.to?{blend:1,opacity:1}:{blend:l.progress*l.progress*(3-2*l.progress),opacity:1},st=["v","l","m","n","s","c","r","t","p","d","f","g","b","pr","tr","cl","cr","fl","fr","gl","gr","pl","br","dr","st","qu"],Ct=["l","r","n","m","t","s","c","d","v","p","g","b","f","br","cr","dr","gr","pr","tr","st"],Zt=["a","e","i","o","u"],rt=["a","e","i","o","u","a","e","i","o","ae","au","oe"],Tt=["n","r","s","l","m","t"],_t=["a","us","um","is","or"],xe=(l,e,t=0)=>e[(Math.floor(l()*e.length)+t)%e.length],Q=l=>`${l.syllables.map(e=>e.onset+e.vowel).join("")}${l.coda}`,Mt=(l,e)=>{for(let t=0;t<512;t+=1){const s=l()<.82||t>=24?2:3,n=[];let i=!1;for(let a=0;a<s;a+=1){const c=xe(l,a===0?st:Ct,a===0?t:a===1?Math.floor(t/st.length):0);let h=xe(l,rt);h.length>1&&i&&(h=xe(l,Zt)),c==="qu"&&(h==="u"||h==="au"||h==="oe")&&(h="a"),a>0&&`${c}${h}`===n[a-1].onset+n[a-1].vowel&&(h=xe(l,rt,1)),i||=h.length>1,n.push({onset:c,vowel:h})}const r={syllables:n,coda:xe(l,Tt)},o=Q(r);if(!(o.length>8)&&!e?.has(o))return r}throw new Error("Could not find an unused place name")},Le=l=>({syllables:l.syllables.map(e=>({...e})),coda:l.coda}),Me=(l,e)=>{if(e===l.syllables.length*2)return l.coda;const t=l.syllables[Math.floor(e/2)];return e%2===0?t.onset:t.vowel},ot=(l,e,t)=>{const s=Le(l);return e===s.syllables.length*2?s.coda=t:e%2===0?s.syllables[Math.floor(e/2)].onset=t:s.syllables[Math.floor(e/2)].vowel=t,s},at=l=>l.syllables.every(({onset:e,vowel:t})=>e!=="qu"||!["u","au","oe"].includes(t)),Pt=(l,e,t)=>{const s=l.syllables.length*2+1;for(let n=0;n<s;n+=1){const i=(Math.abs(e)+n)%s,r=Me(l,i),o=i===s-1?Tt:i%2===1?rt:i===0?st:Ct,a=[...new Set(o)].filter(c=>c.length===r.length&&c!==r);if(a.length!==0)for(let c=0;c<a.length;c+=1){const h=a[(Math.abs(e+n*7)+c)%a.length],m=ot(l,i,h),p=Q(m);if(p.length<=8&&at(m)&&!t?.has(p))return m}}return Le(l)},ei=l=>{const e=[...l].sort((a,c)=>c.weight-a.weight),t=e[0];if(!t)throw new Error("Cannot recombine without a parent");const s=e.reduce((a,c)=>a+Math.max(0,c.weight),0);if(e.length===1||s<=0)return Le(t.genome);const n=Le(t.genome),i=n.syllables.length*2+1;let r=0;const o=e.map(a=>(r+=Math.max(0,a.weight)/s,r));for(let a=0;a<i;a+=1){const c=(a+.5)/i,h=e[o.findIndex(v=>c<=v)]?.genome??t.genome,m=a===i-1?h.syllables.length*2:Math.min(Math.floor(a/2),h.syllables.length-1)*2+a%2,p=Me(h,m);if(p.length!==Me(n,a).length)continue;const B=ot(n,a,p);Q(B).length<=8&&at(B)&&(n.syllables=B.syllables,n.coda=B.coda)}return n},ti=(l,e,t)=>{const s=l.syllables.length*2+1;if(e.syllables.length!==l.syllables.length)return null;for(let n=0;n<s;n+=1){const i=Me(e,n);if(i===Me(l,n))continue;const r=ot(l,n,i);if(Q(r).length<=8&&at(r)&&!t?.has(Q(r)))return r}return null},ii=(l,e)=>{const t=`${e.charAt(0).toUpperCase()}${e.slice(1)}`;if(l==="continent")return`${t}ia`;const s=_t[[...e].reduce((n,i)=>n+i.charCodeAt(0),0)%_t.length];return`${t}${s}`},St=.7,ye=5,ni=.24,si=3,ri=.0035,oi=.008,ai=.055,Bt=1/4,li=48,We=1.35,ui=.16,ci=9,D=8,ee=64,te=80,Gt=20,zt=.12,It=.22,hi=.05,di=.12,fi=.85,pi=.25,gi=3,At=8,mi=1.8,bi=140,xi=28,yi=160,wi=2,vi='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',J=(l,e,t)=>Math.max(e,Math.min(t,l)),we=(l,e,t,s)=>l+(e-l)*(1-Math.exp(-t/s)),le=l=>l==="island"||l==="continent",se=l=>l*ui,Ae=(l,e,t)=>l+(e-l)*t,ve=(l,e)=>{const t=Math.abs(l-e)%180;return Math.min(t,180-t)},_i=(l,e,t,s)=>{const n=2/fi,i=(t-l)*n*n-2*n*e,r=e+i*s;return{value:l+r*s,velocity:r}},Mi=l=>[{x:l.x,y:l.y}];class Pi{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1}advance(e,t,s){this.applyViewport(s);const n=J(e,0,.5);t!=="map"&&(this.synced=!1);for(const r of this.tracks.values()){const o=t==="map"&&r.confirmed&&r.missing===0;r.agreement=we(r.agreement,o?1:0,n,St),r.stability=we(r.stability,o?r.agreement:0,n,St);const a=r.placement;a?.alive&&r.present&&this.glide(r,a,n);const c=a?[a,...r.ghosts]:r.ghosts;for(const h of c){const m=t==="map"&&this.synced&&r.present&&r.confirmed&&r.missing<.75&&h.alive;h.opacity=we(h.opacity,m?r.stability:0,n,m?.25:.45)}a&&!a.alive&&a.opacity<.02&&(r.placement=null),r.ghosts=r.ghosts.filter(h=>h.opacity>=.02)}const i=this.collect(n);return t==="chaos"&&i.length===0&&this.reset(),i}ingest(e){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const t=performance.now()/1e3,s=this.lastIngest<0?0:Math.min(2,t-this.lastIngest);this.lastIngest=t;for(const u of this.tracks.values())u.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const u=[];for(const d of this.tracks.values()){d.soft&&(d.soft=this.regridFloat(d.soft,this.width,this.height,e.width,e.height)),d.lastMask&&(d.lastMask=this.regrid(d.lastMask,this.width,this.height,e.width,e.height)),d.nameAnchor&&(d.nameAnchor=this.regrid(d.nameAnchor,this.width,this.height,e.width,e.height));const g=d.placement?[d.placement,...d.ghosts]:d.ghosts;for(const _ of g){const M=_.mask===_.regionMask;_.mask=this.regrid(_.mask,this.width,this.height,e.width,e.height),_.regionMask=M?_.mask:this.regrid(_.regionMask,this.width,this.height,e.width,e.height),u.push(_.mask),M||u.push(_.regionMask)}}this.width=e.width,this.height=e.height;for(const d of u)this.remember(d)}const i=this.components(e.signs).filter(u=>u.role==="place").sort((u,d)=>d.area-u.area).slice(0,li),r=[],o=[],a=(u,d,g)=>{const _=d.placement?.alive?{x:d.placement.position.x/this.viewport.width,y:d.placement.position.y/this.viewport.height}:d.center;return{region:u,track:d,overlap:g,distance:this.distance(_,i[u].center)}};for(let u=0;u<i.length;u+=1){const d=new Map;for(const g of i[u].cells){const _=this.owners[g];_&&d.set(_,(d.get(_)??0)+1)}for(const[g,_]of d){const M=this.tracks.get(g);!M||le(M.kind)!==i[u].sign>0||_<=0||r.push(a(u,M,_))}o.push(d)}const c=new Set,h=new Set,m=[],p=u=>{u.sort((d,g)=>g.overlap-d.overlap||d.distance-g.distance||d.track.id-g.track.id);for(const d of u)c.has(d.region)||h.has(d.track.id)||(c.add(d.region),h.add(d.track.id),m.push({track:d.track,region:i[d.region],overlap:d.overlap}))};p(r);const B=[];for(const u of this.tracks.values())if(!(h.has(u.id)||!u.lastMask||u.missing>=ye))for(let d=0;d<i.length;d+=1){if(c.has(d)||le(u.kind)!==i[d].sign>0)continue;const g=i[d].bounds;if(u.bounds.x1<=g.x0||g.x1<=u.bounds.x0||u.bounds.y1<=g.y0||g.y1<=u.bounds.y0)continue;let _=0;for(const M of i[d].cells)_+=u.lastMask[M]??0;_>0&&B.push(a(d,u,_))}p(B);const v=[];for(const u of this.tracks.values())if(!(h.has(u.id)||u.missing>=ye))for(let d=0;d<i.length;d+=1){const g=i[d];if(c.has(d)||le(u.kind)!==g.sign>0)continue;const _=Math.min(u.area,g.area)/Math.max(u.area,g.area),M=Math.max(0,u.bounds.x0-g.bounds.x1,g.bounds.x0-u.bounds.x1)*this.width,x=Math.max(0,u.bounds.y0-g.bounds.y1,g.bounds.y0-u.bounds.y1)*this.height,P=Math.hypot((u.center.x-g.center.x)*this.width,(u.center.y-g.center.y)*this.height),G=Math.sqrt(Math.min(u.area,g.area)/Math.PI);_>=.5&&Math.hypot(M,x)<=1.5&&P<=Math.max(3,G*1.25)&&v.push(a(d,u,0))}p(v);const w=new Set;for(const u of this.tracks.values()){let d=0;for(let g=0;g<i.length;g+=1)le(u.kind)===i[g].sign>0&&(o[g].get(u.id)??0)>=i[g].area*.5&&(d+=1);d>1&&w.add(u.id)}for(let u=0;u<i.length;u+=1){if(c.has(u))continue;const d=i[u];if(!d.kind)continue;const g=[...o[u]].filter(([A,U])=>w.has(A)&&U>=d.area*.5&&le(this.tracks.get(A).kind)===d.sign>0).sort((A,U)=>U[1]-A[1]).map(([A])=>this.tracks.get(A)).find(A=>A!==void 0);let _=g?Pt(g.genome,this.nameSeed(d,g.id),this.usedStems):Mt(Math.random,this.usedStems);this.usedStems.has(Q(_))&&(_=Mt(Math.random,this.usedStems));const M=Q(_);this.usedStems.add(M);const x=g?`${M.charAt(0).toUpperCase()}${M.slice(1)}${g.suffix}`:ii(d.kind,M),P=this.nextTrackId++,G={id:P,stem:M,genome:_,suffix:x.slice(M.length),lineage:g?.lineage??P,pendingGenome:null,nameAnchor:null,nameStreak:0,lastNameChange:t,mutationSerial:0,kind:d.kind,text:x,area:d.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:d.center,bounds:d.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(G.id,G),m.push({track:G,region:d,overlap:0})}for(const{track:u,region:d}of m){const g=i.indexOf(d),_=[...o[g]].filter(([M,x])=>{const P=this.tracks.get(M);if(!P||le(P.kind)!==d.sign>0)return!1;const G=P.genome.syllables.length*2+1;return x/d.area>=.5/G}).map(([M,x])=>({track:this.tracks.get(M),weight:x})).sort((M,x)=>x.weight-M.weight||M.track.id-x.track.id);if(_.length>1){const x=_.every(P=>P.track.lineage===_[0].track.lineage)?[..._].sort((P,G)=>P.track.id-G.track.id)[0].track.genome:ei(_.map(({track:P,weight:G})=>({genome:P.genome,weight:G})));Q(x)!==u.stem&&(u.pendingGenome=x),u.lastNameChange=t,u.nameStreak=0,u.nameAnchor=null}else w.has(u.id)&&(u.lastNameChange=t,u.nameStreak=0,u.nameAnchor=null)}const b=new Uint16Array(e.signs.length);for(const{track:u,region:d,overlap:g}of m){if(u.present=!0,g>0){const _=g/Math.min(u.area,d.area);u.agreement=Math.min(u.agreement,.65+.35*_)}u.area=d.area,u.center=d.center,u.bounds=d.bounds,u.missing=0,u.confirmed=!0;for(const _ of d.cells)b[_]=u.id}this.owners=b;for(const u of[...this.tracks.values()])m.some(d=>d.track===u)||(u.missing+=s,u.confirmed=!1,u.missing>ye&&(this.tracks.delete(u.id),this.usedStems.delete(u.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}for(const{track:u,region:d}of m){const g=this.allowedMask(d);this.evolveName(u,d,g,t),u.lastMask=g,this.remember(g),this.smooth(u,g,s),this.aim(u,g,s)}this.synced=!0}nameSeed(e,t){return Math.floor(e.center.x*8191+e.center.y*16381+e.area*17+t*131)}maskDistance(e,t){let s=0,n=0;for(let i=0;i<t.length;i+=1)s+=e[i]|t[i],n+=e[i]&t[i];return s>0?1-n/s:0}rename(e,t,s,n){const i=Q(t);if(i===e.stem||this.usedStems.has(i))return!1;const r=`${i.charAt(0).toUpperCase()}${i.slice(1)}${e.suffix}`,o=e.placement;return o?.alive&&!this.fitsPose(o.mask,r,this.snapshot(o))?!1:(this.usedStems.delete(e.stem),this.usedStems.add(i),e.genome=t,e.stem=i,e.text=r,e.lastNameChange=n,e.nameAnchor=s.slice(),e.nameStreak=0,!0)}evolveName(e,t,s,n){if((!e.nameAnchor||e.nameAnchor.length!==s.length)&&(e.nameAnchor=s.slice()),e.pendingGenome){if(n-e.lastNameChange<ye)return;const r=e.pendingGenome,o=ti(e.genome,r,this.usedStems);(!o&&(Q(e.genome)===Q(r)||e.genome.syllables.length!==r.syllables.length)||o&&this.rename(e,o,s,n)&&Q(e.genome)===Q(r))&&(e.pendingGenome=null);return}if(this.maskDistance(e.nameAnchor,s)>ni?e.nameStreak+=1:e.nameStreak=0,e.nameStreak<si||n-e.lastNameChange<ye)return;const i=Pt(e.genome,this.nameSeed(t,e.lineage)+e.mutationSerial*31,this.usedStems);this.rename(e,i,s,n)&&(e.mutationSerial+=1)}aim(e,t,s){const n=this.viewport.width*this.viewport.height/t.length,i=J(Math.sqrt(e.area*n/(Math.max(4,e.text.length)*3.2)),D,ee);e.styleFont=e.styleFont===0?i:we(e.styleFont,i,s,2.5);const r=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),o=e.placement?.alive?e.placement:null,a=o?.angle??0,c=[],h=(x,P)=>Math.max(.01,r.quality[x]+.12*P.font/e.styleFont-hi*Math.abs(P.angle)/te-di*r.elongation[x]*ve(P.angle,r.axis[x])/te);for(const x of r.candidates){const P=this.cellPoint(x);if(c.some(A=>this.distance(A.pose,P)<r.radius*.55))continue;const G=this.poseAt(e.text,t,P,e.styleFont,a,r.axis[x],r.elongation[x]);if(G&&(c.push({pose:G,quality:h(x,G)}),c.length>=24))break}if(o){const x=this.index(o.position);if(x>=0&&r.centerX[x]>0){const P={x:r.centerX[x],y:r.centerY[x]},G=this.index(P),A=G<0?null:this.poseAt(e.text,t,P,e.styleFont,a,r.axis[G],r.elongation[G]);A&&G>=0&&c.push({pose:A,quality:h(G,A)})}}if(c.length===0){o&&this.release(e);return}c.sort((x,P)=>P.quality-x.quality);const m=c[0];if(!o){e.placement=this.spawn(m.pose,t);return}const p=c.filter(x=>this.distance(x.pose,o.position)<=r.radius*1.5).sort((x,P)=>P.quality-this.distance(P.pose,o.position)/(r.radius*16)-(x.quality-this.distance(x.pose,o.position)/(r.radius*16)))[0],B=this.index(o.position),v=p?.quality??(B>=0?r.quality[B]:0),w=m.quality>v*wi,b=p&&m.quality<=p.quality*1.08?p:m,u=this.snapshot(o),d=this.distance(u,b.pose)<=r.radius*1.5;let g=t,_=!1;if(!this.fitsPose(t,e.text,u)&&(g=this.union(o.regionMask,t),this.remember(g),!this.fitsPose(g,e.text,u)&&d&&o.mask!==o.regionMask&&(g=this.union(o.mask,t),this.remember(g),_=!0),!this.fitsPose(g,e.text,u))){this.relight(e,b.pose,t);return}let M=this.planRoute(e.text,g,u,b.pose);if(!M&&g!==t&&d&&!_&&o.mask!==o.regionMask){const x=this.union(o.mask,t);if(this.remember(x),this.fitsPose(x,e.text,u)){const P=this.planRoute(e.text,x,u,b.pose);P&&(g=x,M=P)}}if(!M){(g!==t||w&&this.distance(u,b.pose)>r.radius*1.5)&&this.relight(e,b.pose,t);return}o.mask=g,o.regionMask=t,o.target=b.pose,o.route=M}poseAt(e,t,s,n,i,r,o){const a=this.index(s);if(a<0||!t[a])return null;let c=null,h=-1/0;const m=this.maxFont(t,e,s,0);if(m>=D){const p=Math.min(n,Math.max(D,m*.9));c={x:s.x,y:s.y,font:p,angle:0},h=p/n-It*o*ve(0,r)/te-.02*ve(0,i)/te}for(let p=Gt;p<=te;p+=Gt){const B=Math.min(n,ee*.9)/n-zt*p/te;if(h>=B)break;for(const v of[-p,p]){const w=this.maxFont(t,e,s,v);if(w<D)continue;const b=Math.min(n,Math.max(D,w*.9)),u=b/n-zt*p/te-It*o*ve(v,r)/te-.02*ve(v,i)/te;u>h&&(c={x:s.x,y:s.y,font:b,angle:v},h=u)}}return c}landscape(e,t,s,n,i){const r=this.width+1,o=r*(this.height+1),a=new Float64Array(o),c=new Float64Array(o),h=new Float64Array(o),m=new Float64Array(o),p=new Float64Array(o),B=new Float64Array(o),v=new Float32Array(e.length),w=new Float32Array(e.length),b=new Float32Array(e.length),u=new Float32Array(e.length),d=new Float32Array(e.length),g=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),_=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(n*3.5,Math.sqrt(i*g*g)*.33,g*3)),M=Math.max(1,Math.ceil(_*this.width/this.viewport.width)),x=Math.max(1,Math.ceil(_*this.height/this.viewport.height));for(let z=0;z<this.height;z+=1){let F=0,Y=0,V=0,q=0,W=0,X=0;for(let R=0;R<this.width;R+=1){const K=R+z*this.width,$=e[K]*(.85+.15*s[K])*J(t[K]*g/(n*2),0,1),O=this.cellPoint(K);F+=$,Y+=$*O.x,V+=$*O.y,q+=$*O.x*O.x,W+=$*O.y*O.y,X+=$*O.x*O.y;const k=(z+1)*r+R+1;a[k]=a[k-r]+F,c[k]=c[k-r]+Y,h[k]=h[k-r]+V,m[k]=m[k-r]+q,p[k]=p[k-r]+W,B[k]=B[k-r]+X}}const P=(z,F,Y,V,q)=>z[q*r+V]-z[Y*r+V]-z[q*r+F]+z[Y*r+F],G=a[o-1],A=G>0?{x:c[o-1]/G,y:h[o-1]/G}:{x:this.viewport.width/2,y:this.viewport.height/2},U=[];for(let z=0;z<e.length;z+=1){if(!e[z])continue;const F=z%this.width,Y=Math.floor(z/this.width),V=Math.max(0,F-M),q=Math.max(0,Y-x),W=Math.min(this.width,F+M+1),X=Math.min(this.height,Y+x+1),R=P(a,V,q,W,X);if(R<=0)continue;w[z]=P(c,V,q,W,X)/R,b[z]=P(h,V,q,W,X)/R;const K=Math.max(0,P(m,V,q,W,X)/R-w[z]**2),$=Math.max(0,P(p,V,q,W,X)/R-b[z]**2),O=P(B,V,q,W,X)/R-w[z]*b[z],k=Math.hypot(K-$,2*O);u[z]=.5*Math.atan2(2*O,K-$)*180/Math.PI,d[z]=J(k/(K+$+1),0,1);const re=R/((M*2+1)*(x*2+1)),he=J(t[z]*g/(n*2),0,1);v[z]=.7*re+.3*he-.08*this.distance(this.cellPoint(z),A)/_,U.push(z)}return U.sort((z,F)=>v[F]-v[z]),{quality:v,centerX:w,centerY:b,axis:u,elongation:d,candidates:U,radius:_}}union(e,t){const s=new Uint8Array(t.length);for(let n=0;n<s.length;n+=1)s[n]=e[n]|t[n];return s}planRoute(e,t,s,n){if(this.posesFit(t,e,s,n))return[n];let i=Math.min(s.font,n.font);for(let r=0;r<9;r+=1){i=Math.max(D,i);for(const o of[...new Set([s.angle,n.angle,0])]){const a={...s,font:i},c={...a,angle:o},h={...n,font:i,angle:o},m={...n,font:i};if(!this.posesFit(t,e,s,a)||!this.posesFit(t,e,a,c)||!this.posesFit(t,e,h,m)||!this.posesFit(t,e,m,n))continue;const p=[];if(Math.abs(s.font-i)>.05&&p.push(a),Math.abs(s.angle-o)>.05&&p.push(c),this.posesFit(t,e,c,h))return p.push(h),Math.abs(n.angle-o)>.05&&p.push(m),p.push(n),p;const B=this.legalPath(e,t,c,h);if(!B)continue;let v=c,w=!0;for(let b=0;b<B.length;){let u=-1;for(let g=B.length-1;g>=b;g-=1){const M={...this.cellPoint(B[g]),font:i,angle:o};if(this.posesFit(t,e,v,M)){u=g;break}}if(u<0){w=!1;break}const d={...this.cellPoint(B[u]),font:i,angle:o};this.distance(v,d)>.5&&p.push(d),v=d,b=u+1}if(!(!w||!this.posesFit(t,e,v,h)))return this.distance(v,h)>.5&&p.push(h),Math.abs(n.angle-o)>.05&&p.push(m),p.push(n),p}if(i<=D)break;i=Math.max(D,i*.82)}return null}legalPath(e,t,s,n){const i=new Uint8Array(t.length),r=w=>{if(i[w]===0){const b={...this.cellPoint(w),font:s.font,angle:s.angle};i[w]=t[w]&&this.fitsPose(t,e,b)?1:2}return i[w]===1},o=w=>{const b=this.index(w);if(b<0)return-1;const u=b%this.width,d=Math.floor(b/this.width);for(let g=0;g<=3;g+=1)for(let _=-g;_<=g;_+=1)for(let M=-g;M<=g;M+=1){const x=u+M,P=d+_;if(x<0||P<0||x>=this.width||P>=this.height)continue;const G=x+P*this.width;if(r(G)&&this.posesFit(t,e,w,{...this.cellPoint(G),font:s.font,angle:s.angle}))return G}return-1},a=o(s),c=o(n);if(a<0||c<0)return null;const h=new Int32Array(t.length).fill(-1),m=new Int32Array(t.length);let p=0,B=0;for(m[B++]=a,h[a]=a;p<B&&h[c]<0;){const w=m[p++],b=w%this.width,u=Math.floor(w/this.width);for(const d of[b>0?w-1:-1,b+1<this.width?w+1:-1,u>0?w-this.width:-1,u+1<this.height?w+this.width:-1])d<0||h[d]>=0||!r(d)||(h[d]=w,m[B++]=d)}if(h[c]<0)return null;const v=[];for(let w=c;w!==a;w=h[w])v.push(w);return v.push(a),v.reverse(),v}glide(e,t,s){if(s<=0)return;const n=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,n)){const P=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,P<D){t.fontVelocity=0;return}const G=_i(t.font,t.fontVelocity,Math.min(t.target.font,P),s);t.font=Math.max(P,Math.min(t.font,G.value)),t.fontVelocity=t.font<=P?0:G.velocity;return}for(;t.route.length>1&&this.distance(n,t.route[0])<.75&&Math.abs(n.font-t.route[0].font)<.15&&Math.abs(n.angle-t.route[0].angle)<.3;)t.route.shift();const i=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,n,i)&&this.distance(n,i)<.2&&Math.abs(n.font-i.font)<.05&&Math.abs(n.angle-i.angle)<.05){t.position={x:i.x,y:i.y},t.font=i.font,t.angle=i.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const o=!this.fitsPose(t.regionMask,e.text,n)?1:gi,a=bi/o,c=xi/o,h=yi/o,m=this.distance(n,i),p=m/a,B=Math.abs(i.font-n.font)/c,v=Math.abs(i.angle-n.angle)/h,w=Math.max(p,B,v);let b=0;w===p&&m>0?b=((i.x-n.x)*t.velocity.x+(i.y-n.y)*t.velocity.y)/m/a:w===B&&B>0?b=Math.sign(i.font-n.font)*t.fontVelocity/c:v>0&&(b=Math.sign(i.angle-n.angle)*t.angleVelocity/h),b=J(b,-1,1);const u=2/(pi*o),d=J(u*u*w-2*u*b,-At,At),g=J(b+d*s,-1,1),_=Math.min(w,(b+g)*s/2);let M=this.lerpPose(n,i,w>0?_/w:1);if(!(_<0?this.posesFit(t.mask,e.text,n,M):this.fitsPose(t.mask,e.text,M))){const P=this.longestLegal(e.text,t.mask,n,M);if(!P){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}M=P}const x=s>0?1/s:0;t.position={x:M.x,y:M.y},t.velocity={x:(M.x-n.x)*x,y:(M.y-n.y)*x},t.font=M.font,t.fontVelocity=(M.font-n.font)*x,t.angle=M.angle,t.angleVelocity=(M.angle-n.angle)*x}collect(e){const t=[];for(const i of this.tracks.values()){const r=i.placement?[i.placement,...i.ghosts]:i.ghosts;for(const o of r)o.opacity<.015||this.fitsPose(o.mask,i.text,this.snapshot(o))&&t.push({track:i,placement:o})}t.sort((i,r)=>r.track.area-i.track.area);const s=[],n=[];for(const i of t){const{track:r,placement:o}=i,a=s.some(h=>h.track!==r&&this.overlaps(r.text,this.snapshot(o),h.track.text,this.snapshot(h.placement)));o.collisionOpacity=we(o.collisionOpacity,a?0:1,e,a?.3:.7),a||s.push(i);const c=o.opacity*o.collisionOpacity;c<.015||n.push({id:o.id,kind:r.kind,text:r.text,x:o.position.x,y:o.position.y,width:this.boxWidth(r.text,o.font,se(o.font)),height:o.font*We,opacity:c,fontSize:o.font,letterSpacing:se(o.font),angle:o.angle})}return n}relight(e,t,s){const n=e.placement;if(n){const i=this.snapshot(n);if(this.fitsPose(n.mask,e.text,i)&&this.overlaps(e.text,i,e.text,t)){n.target=i,n.route=[],n.velocity={x:0,y:0},n.fontVelocity=0,n.angleVelocity=0,n.regionMask=s;return}n.alive=!1,e.ghosts.push(n)}e.placement=this.spawn(t,s)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,s){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const n=1-Math.exp(-s/mi),i=e.soft;for(let r=0;r<t.length;r+=1)i[r]+=(t[r]-i[r])*n}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const s of e.cells)t[s]=1;return t}components(e){const t=new Uint8Array(e.length),s=new Int32Array(e.length),n=[];for(let i=0;i<e.length;i+=1){if(t[i])continue;const r=n.length,o=e[i]<0?-1:1,a=[];let c=0,h=0,m=this.width,p=this.height,B=0,v=0;const w=[i];for(t[i]=1;w.length;){const g=w.pop();a.push(g),s[g]=r;const _=g%this.width,M=Math.floor(g/this.width);c+=_+.5,h+=M+.5,m=Math.min(m,_),p=Math.min(p,M),B=Math.max(B,_+1),v=Math.max(v,M+1);for(const x of this.neighbors(g))t[x]||(e[x]<0?-1:1)!==o||(t[x]=1,w.push(x))}const b=a.length/e.length;let u=null,d="hole";o>0?b>=ai?(u="continent",d="place"):b>=oi&&(u="island",d="place"):B-m>this.width*Bt&&v-p>this.height*Bt||m===0||p===0||B===this.width||v===this.height?d="sea":b>=ri&&(u="lake",d="place"),n.push({sign:o,area:a.length,cells:a,kind:u,role:d,center:{x:c/a.length/this.width,y:h/a.length/this.height},bounds:{x0:m/this.width,y0:p/this.height,x1:B/this.width,y1:v/this.height}})}for(const i of n){if(i.kind!=="lake")continue;const r=new Map;let o=0;for(const a of i.cells)for(const c of this.neighbors(a)){const h=s[c];n[h].sign<0||(r.set(h,(r.get(h)??0)+1),o+=1)}(o===0||Math.max(...r.values())*5<o*4)&&(i.kind=null,i.role="sea")}return n}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),s=new Int32Array(e.length);let n=0;for(let i=0;i<e.length;i+=1){const r=i%this.width,o=Math.floor(i/this.width);(!e[i]||r===0||o===0||r===this.width-1||o===this.height-1)&&(t[i]=0,s[n++]=i)}for(let i=0;i<n;i+=1){const r=s[i],o=r%this.width,a=Math.floor(r/this.width);for(const c of[o>0?r-1:-1,o+1<this.width?r+1:-1,a>0?r-this.width:-1,a+1<this.height?r+this.width:-1])c<0||t[c]>=0||(t[c]=t[r]+1,s[n++]=c)}return t}prefix(e){const t=this.width+1,s=new Int32Array(t*(this.height+1));for(let n=0;n<this.height;n+=1){let i=0;for(let r=0;r<this.width;r+=1)i+=e[r+n*this.width],s[(n+1)*t+r+1]=s[n*t+r+1]+i}return s}maxFont(e,t,s,n){if(!this.fits(e,t,s,D,se(D),n))return 0;if(this.fits(e,t,s,ee,se(ee),n))return ee;let i=D,r=ee;for(let o=0;o<8;o+=1){const a=(i+r)/2;this.fits(e,t,s,a,se(a),n)?i=a:r=a}return i}fitsPose(e,t,s){return Math.abs(s.angle)<=te&&this.fits(e,t,s,s.font,se(s.font),s.angle)}posesFit(e,t,s,n){if(!this.fitsPose(e,t,s)||!this.fitsPose(e,t,n))return!1;const i=Math.max(1,Math.ceil(Math.max(this.distance(s,n)/4,Math.abs(s.font-n.font),Math.abs(s.angle-n.angle)/2)));for(let r=1;r<i;r+=1)if(!this.fitsPose(e,t,this.lerpPose(s,n,r/i)))return!1;return!0}longestLegal(e,t,s,n){if(!this.fitsPose(t,e,s))return null;let i=0,r=1;for(let o=0;o<8;o+=1){const a=(i+r)/2;this.posesFit(t,e,s,this.lerpPose(s,n,a))?i=a:r=a}return i<=0?null:this.lerpPose(s,n,i)}fits(e,t,s,n,i,r){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const o=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),a=Math.max(ci,o*1.25),c=this.boxWidth(t,n,i)/2+a,h=n*We/2+a,m=r*Math.PI/180,p=Math.cos(m),B=Math.sin(m),v=Math.abs(c*p)+Math.abs(h*B),w=Math.abs(c*B)+Math.abs(h*p);if(s.x-v<0||s.y-w<0||s.x+v>this.viewport.width||s.y+w>this.viewport.height)return!1;const b=this.prefixFields.get(e);if(b){const x=Math.floor((s.x-v)*this.width/this.viewport.width),P=Math.floor((s.y-w)*this.height/this.viewport.height),G=Math.min(this.width,Math.ceil((s.x+v)*this.width/this.viewport.width)),A=Math.min(this.height,Math.ceil((s.y+w)*this.height/this.viewport.height)),U=this.width+1;if(b[A*U+G]-b[P*U+G]-b[A*U+x]+b[P*U+x]===(G-x)*(A-P))return!0}const u=this.distanceFields.get(e),d=this.index(s);if(u&&d>=0){const x=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(u[d]-2)*x/Math.SQRT2)>=Math.hypot(c,h))return!0}const g=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),_=Math.max(2,Math.ceil(c*2/g)),M=Math.max(2,Math.ceil(h*2/g));for(let x=0;x<=M;x+=1){const P=-h+x*h*2/M;for(let G=0;G<=_;G+=1){const A=-c+G*c*2/_,U=Math.floor((s.x+A*p-P*B)*this.width/this.viewport.width),z=Math.floor((s.y+A*B+P*p)*this.height/this.viewport.height);if(U<0||z<0||U>=this.width||z>=this.height||!e[U+z*this.width])return!1}}return!0}overlaps(e,t,s,n){const i=(a,c)=>{const h=c.angle*Math.PI/180,m=this.boxWidth(a,c.font,se(c.font))/2+7,p=c.font*We/2+7;return{x:Math.abs(m*Math.cos(h))+Math.abs(p*Math.sin(h)),y:Math.abs(m*Math.sin(h))+Math.abs(p*Math.cos(h))}},r=i(e,t),o=i(s,n);return Math.abs(t.x-n.x)<r.x+o.x&&Math.abs(t.y-n.y)<r.y+o.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const s=e.width/t.width,n=e.height/t.height,i=(s+n)/2;for(const r of this.tracks.values()){r.styleFont=J(r.styleFont*i,D,ee);const o=r.placement?[r.placement,...r.ghosts]:r.ghosts;for(const a of o)this.scalePlacement(a,s,n,i)}}this.viewport=e}scalePlacement(e,t,s,n){e.position={x:e.position.x*t,y:e.position.y*s},e.velocity={x:e.velocity.x*t,y:e.velocity.y*s},e.font=J(e.font*n,D,ee),e.fontVelocity*=n,e.target={x:e.target.x*t,y:e.target.y*s,font:J(e.target.font*n,D,ee),angle:e.target.angle},e.route=e.route.map(i=>({x:i.x*t,y:i.y*s,font:J(i.font*n,D,ee),angle:i.angle}))}regrid(e,t,s,n,i){const r=new e.constructor(n*i);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<i;o+=1)for(let a=0;a<n;a+=1)r[a+o*n]=e[Math.min(t-1,Math.floor((a+.5)*t/n))+Math.min(s-1,Math.floor((o+.5)*s/i))*t];return r}regridFloat(e,t,s,n,i){const r=new Float32Array(n*i);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<i;o+=1)for(let a=0;a<n;a+=1)r[a+o*n]=e[Math.min(t-1,Math.floor((a+.5)*t/n))+Math.min(s-1,Math.floor((o+.5)*s/i))*t];return r}neighbors(e){const t=e%this.width,s=Math.floor(e/this.width);return[(t+1)%this.width+s*this.width,(t-1+this.width)%this.width+s*this.width,t+(s+1)%this.height*this.width,t+(s-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,s){return{x:Ae(e.x,t.x,s),y:Ae(e.y,t.y,s),font:Ae(e.font,t.font,s),angle:Ae(e.angle,t.angle,s)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),s=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&s>=0&&s<this.height?t+s*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,s){const n=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(n?.58:.56)+s)+4;const i=n?`i:${e}`:e;let r=this.textMetrics.get(i);return r===void 0&&(this.measure.font=`${n?"italic ":""}500 100px ${vi}`,this.measure.fontKerning="none",r=this.measure.measureText(e).width/100,this.textMetrics.set(i,r)),r*t+e.length*s+4}}const Ke=.7,Si=1.8,Bi=(l,e,t,s,n,i)=>{if(s<=0)return l;const r=Math.max(0,t),o=r+s,c=(i-n)/Si*(s-Ke*(Math.exp(-r/Ke)-Math.exp(-o/Ke)));return Math.max(n,Math.min(i,l+e*c))},Gi=(l,e,t,s)=>({freeze:e>t?Math.max(0,Math.min(1,(e-l)/(e-t))):0,heat:e<s?Math.max(0,Math.min(1,(l-e)/(s-e))):0}),Et=2/Math.log(1+Math.sqrt(2)),zi=30,je=40,E=l=>{const e=document.getElementById(l);if(!e)throw new Error(`Missing #${l}`);return e},H=E("field"),ue=E("scale"),ce=E("temperature"),Qe=E("time-speed"),Ee=E("brush-size"),Ii=E("scale-value"),Ai=E("temperature-value"),Ei=E("time-speed-value"),Ui=E("brush-size-value"),Ci=E("explanation"),_e=E("settings-toggle"),Ue=E("settings-panel"),Ce=E("pause"),Ti=E("restart"),Ri=E("clear-blue"),Je=E("rough"),Ze=E("smooth"),et=E("scale-dock"),ki=E("scale-readout"),Te=E("freeze"),Re=E("heat"),tt=E("phase"),it=E("magnetization"),nt=E("energy"),Ne=E("fatal-error"),Li=E("place-labels"),Ni=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function Oi(){const l=await Vt();if(!l){Ne.hidden=!1,Ne.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new $t(l.device,l.format,H);let t=Number(ce.value),s=t,n=Number(ue.value),i=n,r=Number(Qe.value),o=Number(Ee.value),a=!1,c=!0,h=!1,m=!1,p=!1,B=0,v=0,w=null,b=!0,u=0,d=performance.now(),g=0,_=!1,M=0;const x=new Map;let P=!1,G=0,A=n,U=!1,z=!1,F=0,Y=0,V=!1,q=0;const W=new Pi,X=new Map,R=new Map,K=new Map,$=new Map;let O=null,k=0;const re=new Map,he=new Set,Oe=new Set,Fe=new Set,Ve=new Set,lt=Et+.2,De=Number(ue.min),oe=Number(ue.max),ut=Number(ce.min),ct=Number(ce.max),Rt=.75;let de=0,qe=0;const kt=(oe-De)/2.2,ht=Math.ceil((je-1)/2),Lt=()=>{const f=Math.max(1,window.innerWidth),y=Math.max(1,window.innerHeight),I=f<=720?Math.min(window.devicePixelRatio||1,2):1,L=Math.min(l.device.limits.maxTextureDimension2D/f,l.device.limits.maxTextureDimension2D/y),S=Math.sqrt(Number(l.device.limits.maxStorageBufferBindingSize)/4/(f*y)),j=Math.max(.25,Math.min(I,L,S)),ie=Math.max(1,Math.round(f*j)),ae=Math.max(1,Math.round(y*j));return{density:ie/f,width:ie,height:ae}},$e=f=>{const y=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**f-1)*y))},Pe=()=>$e(n)*2+1,Nt=()=>{const f=Math.min(e.width,e.height)/65.64;if(f<=0)return oe;let y=Math.log2(1+Math.max(0,(ht-.5)/f));for(y=Math.min(oe,Math.max(De,y));y<oe&&$e(y)<ht;)y=Math.min(oe,y+.01);return y},fe=()=>{const f=Pe(),y=f===1?"1 spin":`${f} × ${f}`;ue.value=n.toFixed(2),et.value=n.toFixed(2),Ii.textContent=y,ki.textContent=y,Ci.textContent=Ni[Math.min(3,Math.floor(n+.25))],Je.setAttribute("aria-label",`Rough, observation scale ${n.toFixed(2)}`),Ze.setAttribute("aria-label",`Smooth, observation scale ${n.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-n/3)**2).toFixed(3))},pe=()=>{ce.value=t.toFixed(2),Ai.textContent=`T = ${t.toFixed(2)}`;const f=Gi(t,s,ut,ct);Te.style.setProperty("--paddle-progress",f.freeze.toFixed(4)),Re.style.setProperty("--paddle-progress",f.heat.toFixed(4)),Te.setAttribute("aria-label",`Freeze, current temperature ${t.toFixed(2)}`),Re.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const y=t-Et;y<-.2?tt.textContent="ordered":y>.2?tt.textContent="disordered":tt.textContent="critical"},dt=()=>{const f=Number.isInteger(r)?0:1;Ei.textContent=`${r.toFixed(f)}×`},He=()=>{Ee.value=String(o),Ui.textContent=`${o} px`},Ot=()=>({active:p&&!P&&!z,painting:h,forceHot:m,x:B,y:v,radius:o/2}),ge=()=>{const f=Pe(),y=(f-1)/2,I=f===1?0:.14*(1-n/3)**2;e.draw(n,y,I,F,Ot()),b=!1},ft=()=>{Y+=1,W.reset(),O=null,R.clear(),K.clear(),$.clear(),re.clear(),pt([],0)},pt=(f,y)=>{const I=new Set,L={width:H.clientWidth,height:H.clientHeight};for(const S of f){if(I.add(S.id),O&&re.get(S.id)!==k){const C=Wt(S,O,L);R.set(S.id,Kt(R.get(S.id),C)),re.set(S.id,k)}const j=Qt(K.get(S.id),R.get(S.id)?.mode??"dark",y);K.set(S.id,j);const ie=Jt(j),ae=Yt(S.kind,j.from,j.to,ie.blend),be=jt($.get(S.id),R.get(S.id)?.opacity??1,y);$.set(S.id,be);const ne=Mi(S);let Z=X.get(S.id);for(Z||(Z=[],X.set(S.id,Z));Z.length<ne.length;){const C=document.createElement("span");C.className="place-label",Li.append(C),Z.push(C)}for(;Z.length>ne.length;)Z.pop()?.remove();for(let C=0;C<ne.length;C+=1){const N=Z[C],yt=ne[C];N.dataset.kind!==S.kind&&(N.dataset.kind=S.kind),N.textContent!==S.text&&(N.textContent=S.text),N.style.color=ae,N.style.opacity=(S.opacity*be).toFixed(3),N.style.fontSize=`${S.fontSize.toFixed(2)}px`,N.style.letterSpacing=`${S.letterSpacing.toFixed(2)}px`,N.style.transform=`translate(${yt.x.toFixed(2)}px, ${yt.y.toFixed(2)}px) rotate(${S.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[S,j]of X)if(!I.has(S)){for(const ie of j)ie.remove();X.delete(S),R.delete(S),K.delete(S),$.delete(S),re.delete(S)}},gt=(f=!0)=>{const y=Lt();e.resize(y.width,y.height,y.density,f),fe(),b=!0,ge(),M+=1,Y+=1,O=null},Se=f=>{const y=H.getBoundingClientRect(),I=(f.clientX-y.left)/y.width,L=(f.clientY-y.top)/y.height;return I<0||I>=1||L<0||L>=1?null:(B=f.clientX-y.left,v=f.clientY-y.top,{x:I*e.width,y:L*e.height})},Be=(f,y)=>{const I=Se(f);if(!I){w=null;return}const L=w??I;e.paintSegment(L.x,L.y,I.x,I.y,o*e.density/2,y,m),w=I,b=!0},Xe=f=>{h=!0,w=null,Be(f,!0),m=!1},mt=()=>{const f=[...x.values()];return f.length<2?0:Math.hypot(f[1].x-f[0].x,f[1].y-f[0].y)},me=()=>{if(_)return;_=!0;const f=M;e.readStats().then(y=>{if(f!==M)return;it.textContent=y.magnetization.toFixed(3),nt.textContent=y.energy.toFixed(3);const I=y.signedMagnetization===-1;!h&&m!==I&&(m=I,b=!0)}).catch(y=>{console.warn("Could not read Ising statistics.",y)}).finally(()=>{_=!1})},bt=f=>{n=f,i=n,fe(),b=!0};ue.addEventListener("input",()=>bt(Number(ue.value))),et.addEventListener("input",()=>bt(Number(et.value))),ce.addEventListener("input",()=>{s=Number(ce.value),t=s,de=0,pe()});const Ge=(f,y)=>{const I=()=>{f.setAttribute("aria-pressed",String(y.size>0))},L=S=>{y.delete(`pointer:${S.pointerId}`),f.hasPointerCapture(S.pointerId)&&f.releasePointerCapture(S.pointerId),I()};f.addEventListener("pointerdown",S=>{S.pointerType==="mouse"&&S.button!==0||(S.preventDefault(),f.setPointerCapture(S.pointerId),y.add(`pointer:${S.pointerId}`),I())}),f.addEventListener("pointerup",L),f.addEventListener("pointercancel",L),f.addEventListener("lostpointercapture",S=>{y.delete(`pointer:${S.pointerId}`),I()}),f.addEventListener("keydown",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),y.add(`key:${S.code}`),I())}),f.addEventListener("keyup",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),y.delete(`key:${S.code}`),I())}),f.addEventListener("blur",()=>{for(const S of y)S.startsWith("key:")&&y.delete(S);I()})};Ge(Je,he),Ge(Ze,Oe),Ge(Te,Fe),Ge(Re,Ve),Qe.addEventListener("input",()=>{r=Number(Qe.value),dt()}),Ee.addEventListener("input",()=>{o=Number(Ee.value),He(),b=!0}),window.addEventListener("keydown",f=>{f.code!=="BracketLeft"&&f.code!=="BracketRight"||(f.preventDefault(),o=Math.max(4,Math.min(100,o+(f.code==="BracketLeft"?-4:4))),He(),b=!0)});const Ye=f=>{c=f,Ue.classList.toggle("is-closed",!c),Ue.setAttribute("aria-hidden",String(!c)),_e.setAttribute("aria-expanded",String(c)),_e.setAttribute("aria-label",c?"Close settings":"Open settings")};_e.addEventListener("click",()=>Ye(!c)),document.addEventListener("pointerdown",f=>{const y=f.target;!c||!(y instanceof Node)||Ue.contains(y)||_e.contains(y)||Ye(!1)},{capture:!0}),document.addEventListener("click",f=>{const y=f.target;!c||!(y instanceof Node)||_e.contains(y)||(!Ue.contains(y)||y instanceof Element&&y.closest("button"))&&Ye(!1)}),Ce.addEventListener("click",()=>{a=!a;const f=a?"Resume simulation":"Pause simulation";Ce.setAttribute("aria-pressed",String(a)),Ce.setAttribute("aria-label",f),Ce.title=f,u=0}),Ti.addEventListener("click",()=>{e.randomize(),m=!1,u=0,M+=1,ft(),it.textContent="0.000",nt.textContent="0.000",b=!0,ge(),me()}),Ri.addEventListener("click",()=>{e.clearBlue(),m=!0,u=0,M+=1,ft(),it.textContent="1.000",nt.textContent="-2.000",b=!0,ge(),me()}),H.addEventListener("pointerdown",f=>{if(Se(f)){if(H.setPointerCapture(f.pointerId),p=!0,f.pointerType==="touch"){x.set(f.pointerId,{x:f.clientX,y:f.clientY}),x.size===1?(U=!0,z=!1):x.size===2&&(h=!1,w=null,U=!1,z=!0,P=!0,G=mt(),A=i),b=!0;return}Xe(f)}}),H.addEventListener("pointermove",f=>{if(Se(f),p=!0,b=!0,f.pointerType==="touch"){if(!x.has(f.pointerId))return;if(x.set(f.pointerId,{x:f.clientX,y:f.clientY}),P&&x.size>=2){const y=mt();G>0&&y>0&&(i=Math.max(0,Math.min(3,A-Math.log2(y/G)*.9)));return}if(x.size===1&&!z){if(U)Xe(f),U=!1;else if(h)for(const y of f.getCoalescedEvents())Be(y,!1)}return}if(h){const y=f.getCoalescedEvents();if(y.length===0)Be(f,!1);else for(const I of y)Be(I,!1)}});const Ft=f=>{f.pointerType==="touch"&&(U&&!z&&Xe(f),x.delete(f.pointerId),x.size<2&&(P=!1),x.size===0&&(U=!1,z=!1,p=!1)),h=!1,w=null,H.hasPointerCapture(f.pointerId)&&H.releasePointerCapture(f.pointerId),b=!0,me()};H.addEventListener("pointerup",Ft),H.addEventListener("pointercancel",f=>{x.delete(f.pointerId),h=!1,p=!1,w=null,U=!1,P=!1,b=!0}),H.addEventListener("pointerenter",()=>{p=!0,b=!0}),H.addEventListener("pointerleave",()=>{h||(p=!1,b=!0)}),H.addEventListener("wheel",f=>{f.preventDefault();const y=Math.max(-120,Math.min(120,f.deltaY));i=Math.max(0,Math.min(3,i+y*.00125)),Se(f),p=!0},{passive:!1}),window.addEventListener("blur",()=>{h=!1,p=!1,w=null,x.clear(),P=!1,U=!1,he.clear(),Oe.clear(),Fe.clear(),Ve.clear(),de=0,qe=0,Je.setAttribute("aria-pressed","false"),Ze.setAttribute("aria-pressed","false"),Te.setAttribute("aria-pressed","false"),Re.setAttribute("aria-pressed","false"),b=!0}),window.addEventListener("resize",()=>gt(!0)),gt(!1),e.step(t,40),pe(),dt(),He(),b=!0,ge(),me();const xt=f=>{const y=Math.max(0,(f-d)/1e3),I=Math.min(.1,y);d=f;const L=+(Oe.size>0)-+(he.size>0);if(L!==0){const C=L<0?De:oe,N=L*kt*I;n=L<0?Math.max(C,n+N):Math.min(C,n+N),i=n,fe(),b=!0}else{const C=i-n;Math.abs(C)>5e-4?(n+=C*(1-Math.exp(-I*10)),fe(),b=!0):n!==i&&(n=i,fe(),b=!0)}const S=+(Ve.size>0)-+(Fe.size>0);if(S!==qe&&(de=0,qe=S),S!==0)t=Bi(t,S,de,I,ut,ct),de+=I,pe();else{const C=s-t;Math.abs(C)>5e-4?(t+=C*(1-Math.exp(-I/Rt)),pe()):t!==s&&(t=s,pe())}if(!a){u+=I*zi*r;const C=Math.min(8,Math.floor(u));C>0&&(u-=C,e.step(t,C),b=!0)}const j=Pe()>=je?1:0,ie=j-F;Math.abs(ie)>.001?(F+=ie*(1-Math.exp(-I*7)),b=!0):F!==j&&(F=j,b=!0);const ae=Pe()>=je?n:Nt(),be=t>lt?"chaos":"map",ne=H.getBoundingClientRect(),Z=W.advance(Math.min(.5,y),be,{width:ne.width,height:ne.height});if(pt(Z,y),b&&ge(),!V&&be==="map"&&f-q>280){q=f,V=!0;const C=Y;e.readRegionSample($e(ae),ae).then(N=>{C!==Y||!N||t>lt||(O=N,k+=1,W.ingest(N))}).catch(N=>{console.warn("Could not read Ising regions.",N)}).finally(()=>{V=!1})}f-g>750&&(g=f,me()),requestAnimationFrame(xt)};requestAnimationFrame(xt)}Oi().catch(l=>{console.error(l),Ne.hidden=!1,Ne.textContent=l instanceof Error?l.message:"Could not start the WebGPU simulation."});
