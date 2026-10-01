(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();async function It(){try{if(!navigator.gpu)return null;const f=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!f)return null;const e=await f.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(f){return console.error("WebGPU initialization failed.",f),null}}const Ut=`struct SimParams {
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
`,T=(f,e)=>Math.ceil(f/e),Pe=112,Be=128,Et=(f,e)=>f>=e?{width:Pe,height:Math.max(1,Math.round(Pe*e/f))}:{width:Math.max(1,Math.round(Pe*f/e)),height:Pe};class At{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,s){this.device=e,this.format=t,this.canvas=s;const n=s.getContext("webgpu");if(!n)throw new Error("Could not create a WebGPU canvas context.");this.context=n,this.context.configure({device:e,format:t,alphaMode:"opaque"});const i=e.createShaderModule({label:"Ising shaders",code:Ut});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:i,entryPoint:"fullscreen_vertex"},fragment:{module:i,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising label blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:Be*Be*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:Be*Be*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,s,n=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=s;return}const i=this.width,r=this.height,o=this.spinBuffers,u=this.fieldTexture,c=this.blurTextures,d=this.labelBlurTextures,m=this.statsOutput,p=this.statsReadback,M=o?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=s,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),n&&M){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,i,r);const v=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:M}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),l=this.device.createCommandEncoder({label:"Resize Ising grid"}),a=l.beginComputePass();a.setPipeline(this.pipelines.resize),a.setBindGroup(0,v),a.dispatchWorkgroups(T(e,8),T(t,8)),a.end(),this.device.queue.submit([l.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...m?[m]:[]],readback:p??void 0,textures:[u,...c??[],...d??[]].filter(v=>!!v)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(T(this.width,8),T(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let s=0;s<t;s+=1){const n=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,n);const i=this.device.createCommandEncoder({label:"Advance Ising state"}),r=i.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(T(this.width,8),T(this.height,8)),r.end(),this.device.queue.submit([i.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,s,n,i,r,o){const u=Math.floor(Math.min(e,s)-i),c=Math.floor(Math.min(t,n)-i),d=Math.ceil(Math.max(e,s)+i),m=Math.ceil(Math.max(t,n)+i),p=d-u+1,M=m-c+1;this.writeBrushParams(u,c,p,M,e,t,s,n,i,o);const v=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const a=v.beginComputePass();a.setPipeline(this.pipelines.select),a.setBindGroup(0,this.selectGroups[this.currentIndex]),a.dispatchWorkgroups(1),a.end()}const l=v.beginComputePass();l.setPipeline(this.pipelines.paint),l.setBindGroup(0,this.paintGroups[this.currentIndex]),l.dispatchWorkgroups(T(p,8),T(M,8)),l.end(),this.device.queue.submit([v.finish()]),this.fieldDirty=!0}draw(e,t,s,n,i){if(!this.renderGroup||!this.observationReady())return;const r=this.secondaryObservationRadius(t,e),o=this.fieldDirty||t!==this.lastBlurRadius||r!==this.lastSecondaryRadius,u=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const d=u.beginComputePass();d.setPipeline(this.pipelines.field),d.setBindGroup(0,this.fieldGroups[this.currentIndex]),d.dispatchWorkgroups(T(this.width,8),T(this.height,8)),d.end(),this.fieldDirty=!1}o&&this.appendObservationBlur(u,t,r,"display"),this.writeRenderParams(e,t,s,n,i);const c=u.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});c.setPipeline(this.pipelines.render),c.setBindGroup(0,this.renderGroup),c.draw(3),c.end(),this.device.queue.submit([u.finish()])}async readRegionSample(e,t){const s=this.regionGroup;if(!s||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const n=Et(this.width,this.height),i=n.width*n.height;if(i*4>this.regionStorage.size)return null;const r=this.secondaryObservationRadius(e,t),o=e===this.lastBlurRadius&&r===this.lastSecondaryRadius,u=o?s:this.labelRegionGroup;if(!u)return null;const c=this.device.createCommandEncoder({label:"Read Ising regions"});o||this.appendObservationBlur(c,e,r,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([n.width,n.height,0,0]));const d=c.beginComputePass();d.setPipeline(this.pipelines.regions),d.setBindGroup(0,u),d.dispatchWorkgroups(T(n.width,8),T(n.height,8)),d.end(),c.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,i*4),this.device.queue.submit([c.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const m=new Int32Array(this.regionReadback.getMappedRange(),0,i),p=new Int8Array(i),M=new Float32Array(i);for(let v=0;v<i;v+=1)p[v]=m[v]<0?-1:1,M[v]=(Math.abs(m[v])-1)/65534;return{width:n.width,height:n.height,signs:p,luminance:M}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,s=this.statsGroups[this.currentIndex];if(!e||!t||!s)return{energy:0,magnetization:0,signedMagnetization:0};const n=T(this.width,16),i=T(this.height,16),r=new Uint32Array([this.width,this.height,n,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(e);const u=o.beginComputePass();u.setPipeline(this.pipelines.stats),u.setBindGroup(0,s),u.dispatchWorkgroups(n,i),u.end(),o.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([o.finish()]),await t.mapAsync(GPUMapMode.READ);const c=new Int32Array(t.getMappedRange()),d=c[0],m=c[1];t.unmap();const p=this.width*this.height;return{magnetization:Math.abs(d/p),signedMagnetization:d/p,energy:m/p}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}))}writeSimParams(e,t,s,n,i=0,r=0){const o=new ArrayBuffer(32),u=new DataView(o);u.setUint32(0,this.width,!0),u.setUint32(4,this.height,!0),u.setUint32(8,e,!0),u.setUint32(12,t,!0),u.setFloat32(16,s,!0),u.setUint32(20,n,!0),u.setUint32(24,i,!0),u.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(e,t,s,n,i,r,o,u,c,d){const m=new ArrayBuffer(64),p=new DataView(m);p.setUint32(0,this.width,!0),p.setUint32(4,this.height,!0),p.setInt32(8,e,!0),p.setInt32(12,t,!0),p.setUint32(16,s,!0),p.setUint32(20,n,!0),p.setUint32(24,d?1:0,!0),p.setFloat32(32,i,!0),p.setFloat32(36,r,!0),p.setFloat32(40,o,!0),p.setFloat32(44,u,!0),p.setFloat32(48,c,!0),this.device.queue.writeBuffer(this.brushUniform,0,m)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,s,n){const i=n==="display",r=i?this.blurUniforms:this.labelBlurUniforms,o=i?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,u=i?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,c=i?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,d=i?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!u||!c||!d||o.length===0)return;this.writeBlurParams(r[0],t),this.writeBlurParams(r[1],s);const m=e.beginComputePass({label:"Horizontal Ising observation blur"});m.setPipeline(this.pipelines.blurSpinsHorizontal),m.setBindGroup(0,o[this.currentIndex]),m.dispatchWorkgroups(T(this.height,64)),m.end();const p=e.beginComputePass({label:"Vertical Ising observation blur"});if(p.setPipeline(this.pipelines.blurTextureVertical),p.setBindGroup(0,u),p.dispatchWorkgroups(T(this.width,64)),p.end(),s>0){const M=e.beginComputePass({label:"Secondary horizontal Ising blur"});M.setPipeline(this.pipelines.blurTextureHorizontal),M.setBindGroup(0,c),M.dispatchWorkgroups(T(this.height,64)),M.end();const v=e.beginComputePass({label:"Secondary vertical Ising blur"});v.setPipeline(this.pipelines.blurTextureVertical),v.setBindGroup(0,d),v.dispatchWorkgroups(T(this.width,64)),v.end()}i&&(this.lastBlurRadius=t,this.lastSecondaryRadius=s)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,s,n,i){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=t,r[5]=e,r[6]=s,r[7]=i.active?1:0,r[8]=i.x*this.density,r[9]=i.y*this.density,r[10]=i.radius*this.density,r[11]=i.painting?1:0,r[12]=i.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),r[14]=n,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const s of e.buffers)s.destroy();for(const s of e.textures??[])s.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const Tt={land:{dark:"#060403",light:"#fffefd"},water:{dark:"#020913",light:"#fcfeff"}},Ct=f=>f<=.04045?f/12.92:((f+.055)/1.055)**2.4,ht=f=>{const e=[1,3,5].map(t=>Ct(parseInt(f.slice(t,t+2),16)/255));return e[0]*.2126+e[1]*.7152+e[2]*.0722},dt=(f,e)=>(Math.max(f,e)+.05)/(Math.min(f,e)+.05),Ae=(f,e)=>Tt[f==="lake"?"water":"land"][e],Rt=(f,e,t,s)=>{const n=Ae(f,e),i=Ae(f,t);return`rgb(${[1,3,5].map(o=>{const u=parseInt(n.slice(o,o+2),16),c=parseInt(i.slice(o,o+2),16);return(u+(c-u)*s).toFixed(2)}).join(", ")})`},kt=(f,e,t)=>{const s=f.angle*Math.PI/180,n=Math.cos(s),i=Math.sin(s),r=ht(Ae(f.kind,"dark")),o=ht(Ae(f.kind,"light")),u=[],c=[];for(let m=-1;m<=1;m+=1)for(let p=-4;p<=4;p+=1){const M=p*f.width*.105,v=m*f.height*.28,l=f.x+M*n-v*i,a=f.y+M*i+v*n,g=Math.max(0,Math.min(e.width-1,Math.floor(l/t.width*e.width))),y=Math.max(0,Math.min(e.height-1,Math.floor(a/t.height*e.height))),_=e.luminance[y*e.width+g];u.push(dt(_,r)),c.push(dt(_,o))}u.sort((m,p)=>m-p),c.sort((m,p)=>m-p);const d=Math.floor((u.length-1)*.25);return{dark:u[d],light:c[d]}},Lt=(f,e)=>{const t=f?f.darkContrast*.55+e.dark*.45:e.dark,s=f?f.lightContrast*.55+e.light*.45:e.light;let n=f?.mode??(t>=s?"dark":"light");return(n==="dark"?s:t)>(n==="dark"?t:s)*1.22&&(n=n==="dark"?"light":"dark"),{mode:n,darkContrast:t,lightContrast:s}},Ft=(f,e,t)=>{if(!f)return{from:e,to:e,progress:1,velocity:0};let s=f;if(s.from===s.to){if(e===s.to)return s;s={from:s.to,to:e,progress:0,velocity:0}}const n=e===s.to?1:0,i=Math.max(0,Math.min(t,1/60)),r=5,o=s.progress-n,u=s.velocity+r*o,c=Math.exp(-r*i),d=Math.max(0,Math.min(1,n+(o+u*i)*c)),m=(s.velocity-r*u*i)*c;return Math.abs(d-n)<.001&&Math.abs(m)<.02?{from:e,to:e,progress:1,velocity:0}:{...s,progress:d,velocity:m}},Nt=f=>{if(f.from===f.to)return{blend:1,opacity:1};const e=f.progress*f.progress*(3-2*f.progress);return{blend:e,opacity:1-.2*Math.sin(Math.PI*e)**2}},ft=["v","l","m","n","s","c","r","t","p","d","f","g","b","pr","tr","cl","cr","fl","fr","gl","gr","pl","br","dr","st","qu"],Ot=["l","r","n","m","t","s","c","d","v","p","g","b","f","br","cr","dr","gr","pr","tr","st"],Vt=["a","e","i","o","u"],pt=["a","e","i","o","u","a","e","i","o","ae","au","oe"],Dt=["n","r","s","l","m","t"],gt=["a","us","um","is","or"],me=(f,e,t=0)=>e[(Math.floor(f()*e.length)+t)%e.length],qt=(f,e)=>{for(let t=0;t<512;t+=1){const s=f()<.82||t>=24?2:3,n=[];let i=!1;for(let o=0;o<s;o+=1){const u=me(f,o===0?ft:Ot,o===0?t:o===1?Math.floor(t/ft.length):0);let c=me(f,pt);c.length>1&&i&&(c=me(f,Vt)),u==="qu"&&(c==="u"||c==="au"||c==="oe")&&(c="a"),o>0&&`${u}${c}`===n[o-1]&&(c=me(f,pt,1)),i||=c.length>1,n.push(`${u}${c}`)}const r=`${n.join("")}${me(f,Dt)}`;if(!(r.length>8)&&!e?.has(r))return r}throw new Error("Could not find an unused place name")},Xt=(f,e)=>{const t=`${e.charAt(0).toUpperCase()}${e.slice(1)}`;if(f==="continent")return`${t}ia`;const s=gt[[...e].reduce((n,i)=>n+i.charCodeAt(0),0)%gt.length];return`${t}${s}`},mt=.7,De=5,Yt=.0035,$t=.008,Ht=.055,bt=1/4,Wt=48,qe=1.35,Kt=.16,jt=9,V=8,te=64,ie=80,xt=20,yt=.12,vt=.22,Qt=.05,Jt=.12,Zt=.85,ei=.25,ti=3,wt=8,ii=1.8,ni=140,si=28,ri=160,oi=2,ai='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',Q=(f,e,t)=>Math.max(e,Math.min(t,f)),be=(f,e,t,s)=>f+(e-f)*(1-Math.exp(-t/s)),Xe=f=>f==="island"||f==="continent",se=f=>f*Kt,Se=(f,e,t)=>f+(e-f)*t,xe=(f,e)=>{const t=Math.abs(f-e)%180;return Math.min(t,180-t)},li=(f,e,t,s)=>{const n=2/Zt,i=(t-f)*n*n-2*n*e,r=e+i*s;return{value:f+r*s,velocity:r}},ui=f=>[{x:f.x,y:f.y}];class ci{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1}advance(e,t,s){this.applyViewport(s);const n=Q(e,0,.5);t!=="map"&&(this.synced=!1);for(const r of this.tracks.values()){const o=t==="map"&&r.confirmed&&r.missing===0;r.agreement=be(r.agreement,o?1:0,n,mt),r.stability=be(r.stability,o?r.agreement:0,n,mt);const u=r.placement;u?.alive&&r.present&&this.glide(r,u,n);const c=u?[u,...r.ghosts]:r.ghosts;for(const d of c){const m=t==="map"&&this.synced&&r.present&&r.confirmed&&r.missing<.75&&d.alive;d.opacity=be(d.opacity,m?r.stability:0,n,m?.25:.45)}u&&!u.alive&&u.opacity<.02&&(r.placement=null),r.ghosts=r.ghosts.filter(d=>d.opacity>=.02)}const i=this.collect(n);return t==="chaos"&&i.length===0&&this.reset(),i}ingest(e){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const t=performance.now()/1e3,s=this.lastIngest<0?0:Math.min(2,t-this.lastIngest);this.lastIngest=t;for(const l of this.tracks.values())l.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const l=[];for(const a of this.tracks.values()){a.soft&&(a.soft=this.regridFloat(a.soft,this.width,this.height,e.width,e.height)),a.lastMask&&(a.lastMask=this.regrid(a.lastMask,this.width,this.height,e.width,e.height));const g=a.placement?[a.placement,...a.ghosts]:a.ghosts;for(const y of g){const _=y.mask===y.regionMask;y.mask=this.regrid(y.mask,this.width,this.height,e.width,e.height),y.regionMask=_?y.mask:this.regrid(y.regionMask,this.width,this.height,e.width,e.height),l.push(y.mask),_||l.push(y.regionMask)}}this.width=e.width,this.height=e.height;for(const a of l)this.remember(a)}const i=this.components(e.signs).filter(l=>l.role==="place").sort((l,a)=>a.area-l.area).slice(0,Wt),r=[],o=(l,a,g)=>{const y=a.placement?.alive?{x:a.placement.position.x/this.viewport.width,y:a.placement.position.y/this.viewport.height}:a.center;return{region:l,track:a,overlap:g,distance:this.distance(y,i[l].center)}};for(let l=0;l<i.length;l+=1){const a=new Map;for(const g of i[l].cells){const y=this.owners[g];y&&a.set(y,(a.get(y)??0)+1)}for(const[g,y]of a){const _=this.tracks.get(g);!_||Xe(_.kind)!==i[l].sign>0||y<=0||r.push(o(l,_,y))}}const u=new Set,c=new Set,d=[],m=l=>{l.sort((a,g)=>a.track.id-g.track.id||a.distance-g.distance||g.overlap-a.overlap);for(const a of l)u.has(a.region)||c.has(a.track.id)||(u.add(a.region),c.add(a.track.id),d.push({track:a.track,region:i[a.region],overlap:a.overlap}))};m(r);const p=[];for(const l of this.tracks.values())if(!(c.has(l.id)||!l.lastMask||l.missing>=De))for(let a=0;a<i.length;a+=1){if(u.has(a)||Xe(l.kind)!==i[a].sign>0)continue;const g=i[a].bounds;if(l.bounds.x1<=g.x0||g.x1<=l.bounds.x0||l.bounds.y1<=g.y0||g.y1<=l.bounds.y0)continue;let y=0;for(const _ of i[a].cells)y+=l.lastMask[_]??0;y>0&&p.push(o(a,l,y))}m(p);const M=[];for(const l of this.tracks.values())if(!(c.has(l.id)||l.missing>=De))for(let a=0;a<i.length;a+=1){const g=i[a];if(u.has(a)||Xe(l.kind)!==g.sign>0)continue;const y=Math.min(l.area,g.area)/Math.max(l.area,g.area),_=Math.max(0,l.bounds.x0-g.bounds.x1,g.bounds.x0-l.bounds.x1)*this.width,I=Math.max(0,l.bounds.y0-g.bounds.y1,g.bounds.y0-l.bounds.y1)*this.height,B=Math.hypot((l.center.x-g.center.x)*this.width,(l.center.y-g.center.y)*this.height),x=Math.sqrt(Math.min(l.area,g.area)/Math.PI);y>=.5&&Math.hypot(_,I)<=1.5&&B<=Math.max(3,x*1.25)&&M.push(o(a,l,0))}m(M);for(let l=0;l<i.length;l+=1){if(u.has(l))continue;const a=i[l];if(!a.kind)continue;const g=qt(Math.random,this.usedStems);this.usedStems.add(g);const y={id:this.nextTrackId++,stem:g,kind:a.kind,text:Xt(a.kind,g),area:a.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:a.center,bounds:a.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(y.id,y),d.push({track:y,region:a,overlap:0})}const v=new Uint16Array(e.signs.length);for(const{track:l,region:a,overlap:g}of d){if(l.present=!0,g>0){const y=g/Math.min(l.area,a.area);l.agreement=Math.min(l.agreement,.65+.35*y)}l.area=a.area,l.center=a.center,l.bounds=a.bounds,l.missing=0,l.confirmed=!0;for(const y of a.cells)v[y]=l.id}this.owners=v;for(const l of[...this.tracks.values()])d.some(a=>a.track===l)||(l.missing+=s,l.confirmed=!1,l.missing>De&&(this.tracks.delete(l.id),this.usedStems.delete(l.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}for(const{track:l,region:a}of d){const g=this.allowedMask(a);l.lastMask=g,this.remember(g),this.smooth(l,g,s),this.aim(l,g,s)}this.synced=!0}aim(e,t,s){const n=this.viewport.width*this.viewport.height/t.length,i=Q(Math.sqrt(e.area*n/(Math.max(4,e.text.length)*3.2)),V,te);e.styleFont=e.styleFont===0?i:be(e.styleFont,i,s,2.5);const r=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),o=e.placement?.alive?e.placement:null,u=o?.angle??0,c=[],d=(x,P)=>Math.max(.01,r.quality[x]+.12*P.font/e.styleFont-Qt*Math.abs(P.angle)/ie-Jt*r.elongation[x]*xe(P.angle,r.axis[x])/ie);for(const x of r.candidates){const P=this.cellPoint(x);if(c.some(L=>this.distance(L.pose,P)<r.radius*.55))continue;const z=this.poseAt(e.text,t,P,e.styleFont,u,r.axis[x],r.elongation[x]);if(z&&(c.push({pose:z,quality:d(x,z)}),c.length>=24))break}if(o){const x=this.index(o.position);if(x>=0&&r.centerX[x]>0){const P={x:r.centerX[x],y:r.centerY[x]},z=this.index(P),L=z<0?null:this.poseAt(e.text,t,P,e.styleFont,u,r.axis[z],r.elongation[z]);L&&z>=0&&c.push({pose:L,quality:d(z,L)})}}if(c.length===0){o&&this.release(e);return}c.sort((x,P)=>P.quality-x.quality);const m=c[0];if(!o){e.placement=this.spawn(m.pose,t);return}const p=c.filter(x=>this.distance(x.pose,o.position)<=r.radius*1.5).sort((x,P)=>P.quality-this.distance(P.pose,o.position)/(r.radius*16)-(x.quality-this.distance(x.pose,o.position)/(r.radius*16)))[0],M=this.index(o.position),v=p?.quality??(M>=0?r.quality[M]:0),l=m.quality>v*oi,a=p&&m.quality<=p.quality*1.08?p:m,g=this.snapshot(o),y=this.distance(g,a.pose)<=r.radius*1.5;let _=t,I=!1;if(!this.fitsPose(t,e.text,g)&&(_=this.union(o.regionMask,t),this.remember(_),!this.fitsPose(_,e.text,g)&&y&&o.mask!==o.regionMask&&(_=this.union(o.mask,t),this.remember(_),I=!0),!this.fitsPose(_,e.text,g))){this.relight(e,a.pose,t);return}let B=this.planRoute(e.text,_,g,a.pose);if(!B&&_!==t&&y&&!I&&o.mask!==o.regionMask){const x=this.union(o.mask,t);if(this.remember(x),this.fitsPose(x,e.text,g)){const P=this.planRoute(e.text,x,g,a.pose);P&&(_=x,B=P)}}if(!B){(_!==t||l&&this.distance(g,a.pose)>r.radius*1.5)&&this.relight(e,a.pose,t);return}o.mask=_,o.regionMask=t,o.target=a.pose,o.route=B}poseAt(e,t,s,n,i,r,o){const u=this.index(s);if(u<0||!t[u])return null;let c=null,d=-1/0;const m=this.maxFont(t,e,s,0);if(m>=V){const p=Math.min(n,Math.max(V,m*.9));c={x:s.x,y:s.y,font:p,angle:0},d=p/n-vt*o*xe(0,r)/ie-.02*xe(0,i)/ie}for(let p=xt;p<=ie;p+=xt){const M=Math.min(n,te*.9)/n-yt*p/ie;if(d>=M)break;for(const v of[-p,p]){const l=this.maxFont(t,e,s,v);if(l<V)continue;const a=Math.min(n,Math.max(V,l*.9)),g=a/n-yt*p/ie-vt*o*xe(v,r)/ie-.02*xe(v,i)/ie;g>d&&(c={x:s.x,y:s.y,font:a,angle:v},d=g)}}return c}landscape(e,t,s,n,i){const r=this.width+1,o=r*(this.height+1),u=new Float64Array(o),c=new Float64Array(o),d=new Float64Array(o),m=new Float64Array(o),p=new Float64Array(o),M=new Float64Array(o),v=new Float32Array(e.length),l=new Float32Array(e.length),a=new Float32Array(e.length),g=new Float32Array(e.length),y=new Float32Array(e.length),_=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),I=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(n*3.5,Math.sqrt(i*_*_)*.33,_*3)),B=Math.max(1,Math.ceil(I*this.width/this.viewport.width)),x=Math.max(1,Math.ceil(I*this.height/this.viewport.height));for(let S=0;S<this.height;S+=1){let F=0,$=0,N=0,D=0,H=0,Y=0;for(let R=0;R<this.width;R+=1){const W=R+S*this.width,O=e[W]*(.85+.15*s[W])*Q(t[W]*_/(n*2),0,1),q=this.cellPoint(W);F+=O,$+=O*q.x,N+=O*q.y,D+=O*q.x*q.x,H+=O*q.y*q.y,Y+=O*q.x*q.y;const C=(S+1)*r+R+1;u[C]=u[C-r]+F,c[C]=c[C-r]+$,d[C]=d[C-r]+N,m[C]=m[C-r]+D,p[C]=p[C-r]+H,M[C]=M[C-r]+Y}}const P=(S,F,$,N,D)=>S[D*r+N]-S[$*r+N]-S[D*r+F]+S[$*r+F],z=u[o-1],L=z>0?{x:c[o-1]/z,y:d[o-1]/z}:{x:this.viewport.width/2,y:this.viewport.height/2},A=[];for(let S=0;S<e.length;S+=1){if(!e[S])continue;const F=S%this.width,$=Math.floor(S/this.width),N=Math.max(0,F-B),D=Math.max(0,$-x),H=Math.min(this.width,F+B+1),Y=Math.min(this.height,$+x+1),R=P(u,N,D,H,Y);if(R<=0)continue;l[S]=P(c,N,D,H,Y)/R,a[S]=P(d,N,D,H,Y)/R;const W=Math.max(0,P(m,N,D,H,Y)/R-l[S]**2),O=Math.max(0,P(p,N,D,H,Y)/R-a[S]**2),q=P(M,N,D,H,Y)/R-l[S]*a[S],C=Math.hypot(W-O,2*q);g[S]=.5*Math.atan2(2*q,W-O)*180/Math.PI,y[S]=Q(C/(W+O+1),0,1);const ue=R/((B*2+1)*(x*2+1)),ce=Q(t[S]*_/(n*2),0,1);v[S]=.7*ue+.3*ce-.08*this.distance(this.cellPoint(S),L)/I,A.push(S)}return A.sort((S,F)=>v[F]-v[S]),{quality:v,centerX:l,centerY:a,axis:g,elongation:y,candidates:A,radius:I}}union(e,t){const s=new Uint8Array(t.length);for(let n=0;n<s.length;n+=1)s[n]=e[n]|t[n];return s}planRoute(e,t,s,n){if(this.posesFit(t,e,s,n))return[n];let i=Math.min(s.font,n.font);for(let r=0;r<9;r+=1){i=Math.max(V,i);for(const o of[...new Set([s.angle,n.angle,0])]){const u={...s,font:i},c={...u,angle:o},d={...n,font:i,angle:o},m={...n,font:i};if(!this.posesFit(t,e,s,u)||!this.posesFit(t,e,u,c)||!this.posesFit(t,e,d,m)||!this.posesFit(t,e,m,n))continue;const p=[];if(Math.abs(s.font-i)>.05&&p.push(u),Math.abs(s.angle-o)>.05&&p.push(c),this.posesFit(t,e,c,d))return p.push(d),Math.abs(n.angle-o)>.05&&p.push(m),p.push(n),p;const M=this.legalPath(e,t,c,d);if(!M)continue;let v=c,l=!0;for(let a=0;a<M.length;){let g=-1;for(let _=M.length-1;_>=a;_-=1){const B={...this.cellPoint(M[_]),font:i,angle:o};if(this.posesFit(t,e,v,B)){g=_;break}}if(g<0){l=!1;break}const y={...this.cellPoint(M[g]),font:i,angle:o};this.distance(v,y)>.5&&p.push(y),v=y,a=g+1}if(!(!l||!this.posesFit(t,e,v,d)))return this.distance(v,d)>.5&&p.push(d),Math.abs(n.angle-o)>.05&&p.push(m),p.push(n),p}if(i<=V)break;i=Math.max(V,i*.82)}return null}legalPath(e,t,s,n){const i=new Uint8Array(t.length),r=l=>{if(i[l]===0){const a={...this.cellPoint(l),font:s.font,angle:s.angle};i[l]=t[l]&&this.fitsPose(t,e,a)?1:2}return i[l]===1},o=l=>{const a=this.index(l);if(a<0)return-1;const g=a%this.width,y=Math.floor(a/this.width);for(let _=0;_<=3;_+=1)for(let I=-_;I<=_;I+=1)for(let B=-_;B<=_;B+=1){const x=g+B,P=y+I;if(x<0||P<0||x>=this.width||P>=this.height)continue;const z=x+P*this.width;if(r(z)&&this.posesFit(t,e,l,{...this.cellPoint(z),font:s.font,angle:s.angle}))return z}return-1},u=o(s),c=o(n);if(u<0||c<0)return null;const d=new Int32Array(t.length).fill(-1),m=new Int32Array(t.length);let p=0,M=0;for(m[M++]=u,d[u]=u;p<M&&d[c]<0;){const l=m[p++],a=l%this.width,g=Math.floor(l/this.width);for(const y of[a>0?l-1:-1,a+1<this.width?l+1:-1,g>0?l-this.width:-1,g+1<this.height?l+this.width:-1])y<0||d[y]>=0||!r(y)||(d[y]=l,m[M++]=y)}if(d[c]<0)return null;const v=[];for(let l=c;l!==u;l=d[l])v.push(l);return v.push(u),v.reverse(),v}glide(e,t,s){if(s<=0)return;const n=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,n)){const P=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,P<V){t.fontVelocity=0;return}const z=li(t.font,t.fontVelocity,Math.min(t.target.font,P),s);t.font=Math.max(P,Math.min(t.font,z.value)),t.fontVelocity=t.font<=P?0:z.velocity;return}for(;t.route.length>1&&this.distance(n,t.route[0])<.75&&Math.abs(n.font-t.route[0].font)<.15&&Math.abs(n.angle-t.route[0].angle)<.3;)t.route.shift();const i=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,n,i)&&this.distance(n,i)<.2&&Math.abs(n.font-i.font)<.05&&Math.abs(n.angle-i.angle)<.05){t.position={x:i.x,y:i.y},t.font=i.font,t.angle=i.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const o=!this.fitsPose(t.regionMask,e.text,n)?1:ti,u=ni/o,c=si/o,d=ri/o,m=this.distance(n,i),p=m/u,M=Math.abs(i.font-n.font)/c,v=Math.abs(i.angle-n.angle)/d,l=Math.max(p,M,v);let a=0;l===p&&m>0?a=((i.x-n.x)*t.velocity.x+(i.y-n.y)*t.velocity.y)/m/u:l===M&&M>0?a=Math.sign(i.font-n.font)*t.fontVelocity/c:v>0&&(a=Math.sign(i.angle-n.angle)*t.angleVelocity/d),a=Q(a,-1,1);const g=2/(ei*o),y=Q(g*g*l-2*g*a,-wt,wt),_=Q(a+y*s,-1,1),I=Math.min(l,(a+_)*s/2);let B=this.lerpPose(n,i,l>0?I/l:1);if(!(I<0?this.posesFit(t.mask,e.text,n,B):this.fitsPose(t.mask,e.text,B))){const P=this.longestLegal(e.text,t.mask,n,B);if(!P){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}B=P}const x=s>0?1/s:0;t.position={x:B.x,y:B.y},t.velocity={x:(B.x-n.x)*x,y:(B.y-n.y)*x},t.font=B.font,t.fontVelocity=(B.font-n.font)*x,t.angle=B.angle,t.angleVelocity=(B.angle-n.angle)*x}collect(e){const t=[];for(const i of this.tracks.values()){const r=i.placement?[i.placement,...i.ghosts]:i.ghosts;for(const o of r)o.opacity<.015||this.fitsPose(o.mask,i.text,this.snapshot(o))&&t.push({track:i,placement:o})}t.sort((i,r)=>r.track.area-i.track.area);const s=[],n=[];for(const i of t){const{track:r,placement:o}=i,u=s.some(d=>d.track!==r&&this.overlaps(r.text,this.snapshot(o),d.track.text,this.snapshot(d.placement)));o.collisionOpacity=be(o.collisionOpacity,u?0:1,e,u?.3:.7),u||s.push(i);const c=o.opacity*o.collisionOpacity;c<.015||n.push({id:o.id,kind:r.kind,text:r.text,x:o.position.x,y:o.position.y,width:this.boxWidth(r.text,o.font,se(o.font)),height:o.font*qe,opacity:c,fontSize:o.font,letterSpacing:se(o.font),angle:o.angle})}return n}relight(e,t,s){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=this.spawn(t,s)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,s){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const n=1-Math.exp(-s/ii),i=e.soft;for(let r=0;r<t.length;r+=1)i[r]+=(t[r]-i[r])*n}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const s of e.cells)t[s]=1;return t}components(e){const t=new Uint8Array(e.length),s=new Int32Array(e.length),n=[];for(let i=0;i<e.length;i+=1){if(t[i])continue;const r=n.length,o=e[i]<0?-1:1,u=[];let c=0,d=0,m=this.width,p=this.height,M=0,v=0;const l=[i];for(t[i]=1;l.length;){const _=l.pop();u.push(_),s[_]=r;const I=_%this.width,B=Math.floor(_/this.width);c+=I+.5,d+=B+.5,m=Math.min(m,I),p=Math.min(p,B),M=Math.max(M,I+1),v=Math.max(v,B+1);for(const x of this.neighbors(_))t[x]||(e[x]<0?-1:1)!==o||(t[x]=1,l.push(x))}const a=u.length/e.length;let g=null,y="hole";o>0?a>=Ht?(g="continent",y="place"):a>=$t&&(g="island",y="place"):M-m>this.width*bt&&v-p>this.height*bt||m===0||p===0||M===this.width||v===this.height?y="sea":a>=Yt&&(g="lake",y="place"),n.push({sign:o,area:u.length,cells:u,kind:g,role:y,center:{x:c/u.length/this.width,y:d/u.length/this.height},bounds:{x0:m/this.width,y0:p/this.height,x1:M/this.width,y1:v/this.height}})}for(const i of n){if(i.kind!=="lake")continue;const r=new Map;let o=0;for(const u of i.cells)for(const c of this.neighbors(u)){const d=s[c];n[d].sign<0||(r.set(d,(r.get(d)??0)+1),o+=1)}(o===0||Math.max(...r.values())*5<o*4)&&(i.kind=null,i.role="sea")}return n}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),s=new Int32Array(e.length);let n=0;for(let i=0;i<e.length;i+=1){const r=i%this.width,o=Math.floor(i/this.width);(!e[i]||r===0||o===0||r===this.width-1||o===this.height-1)&&(t[i]=0,s[n++]=i)}for(let i=0;i<n;i+=1){const r=s[i],o=r%this.width,u=Math.floor(r/this.width);for(const c of[o>0?r-1:-1,o+1<this.width?r+1:-1,u>0?r-this.width:-1,u+1<this.height?r+this.width:-1])c<0||t[c]>=0||(t[c]=t[r]+1,s[n++]=c)}return t}prefix(e){const t=this.width+1,s=new Int32Array(t*(this.height+1));for(let n=0;n<this.height;n+=1){let i=0;for(let r=0;r<this.width;r+=1)i+=e[r+n*this.width],s[(n+1)*t+r+1]=s[n*t+r+1]+i}return s}maxFont(e,t,s,n){if(!this.fits(e,t,s,V,se(V),n))return 0;if(this.fits(e,t,s,te,se(te),n))return te;let i=V,r=te;for(let o=0;o<8;o+=1){const u=(i+r)/2;this.fits(e,t,s,u,se(u),n)?i=u:r=u}return i}fitsPose(e,t,s){return Math.abs(s.angle)<=ie&&this.fits(e,t,s,s.font,se(s.font),s.angle)}posesFit(e,t,s,n){if(!this.fitsPose(e,t,s)||!this.fitsPose(e,t,n))return!1;const i=Math.max(1,Math.ceil(Math.max(this.distance(s,n)/4,Math.abs(s.font-n.font),Math.abs(s.angle-n.angle)/2)));for(let r=1;r<i;r+=1)if(!this.fitsPose(e,t,this.lerpPose(s,n,r/i)))return!1;return!0}longestLegal(e,t,s,n){if(!this.fitsPose(t,e,s))return null;let i=0,r=1;for(let o=0;o<8;o+=1){const u=(i+r)/2;this.posesFit(t,e,s,this.lerpPose(s,n,u))?i=u:r=u}return i<=0?null:this.lerpPose(s,n,i)}fits(e,t,s,n,i,r){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const o=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),u=Math.max(jt,o*1.25),c=this.boxWidth(t,n,i)/2+u,d=n*qe/2+u,m=r*Math.PI/180,p=Math.cos(m),M=Math.sin(m),v=Math.abs(c*p)+Math.abs(d*M),l=Math.abs(c*M)+Math.abs(d*p);if(s.x-v<0||s.y-l<0||s.x+v>this.viewport.width||s.y+l>this.viewport.height)return!1;const a=this.prefixFields.get(e);if(a){const x=Math.floor((s.x-v)*this.width/this.viewport.width),P=Math.floor((s.y-l)*this.height/this.viewport.height),z=Math.min(this.width,Math.ceil((s.x+v)*this.width/this.viewport.width)),L=Math.min(this.height,Math.ceil((s.y+l)*this.height/this.viewport.height)),A=this.width+1;if(a[L*A+z]-a[P*A+z]-a[L*A+x]+a[P*A+x]===(z-x)*(L-P))return!0}const g=this.distanceFields.get(e),y=this.index(s);if(g&&y>=0){const x=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(g[y]-2)*x/Math.SQRT2)>=Math.hypot(c,d))return!0}const _=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),I=Math.max(2,Math.ceil(c*2/_)),B=Math.max(2,Math.ceil(d*2/_));for(let x=0;x<=B;x+=1){const P=-d+x*d*2/B;for(let z=0;z<=I;z+=1){const L=-c+z*c*2/I,A=Math.floor((s.x+L*p-P*M)*this.width/this.viewport.width),S=Math.floor((s.y+L*M+P*p)*this.height/this.viewport.height);if(A<0||S<0||A>=this.width||S>=this.height||!e[A+S*this.width])return!1}}return!0}overlaps(e,t,s,n){const i=(u,c)=>{const d=c.angle*Math.PI/180,m=this.boxWidth(u,c.font,se(c.font))/2+7,p=c.font*qe/2+7;return{x:Math.abs(m*Math.cos(d))+Math.abs(p*Math.sin(d)),y:Math.abs(m*Math.sin(d))+Math.abs(p*Math.cos(d))}},r=i(e,t),o=i(s,n);return Math.abs(t.x-n.x)<r.x+o.x&&Math.abs(t.y-n.y)<r.y+o.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const s=e.width/t.width,n=e.height/t.height,i=(s+n)/2;for(const r of this.tracks.values()){r.styleFont=Q(r.styleFont*i,V,te);const o=r.placement?[r.placement,...r.ghosts]:r.ghosts;for(const u of o)this.scalePlacement(u,s,n,i)}}this.viewport=e}scalePlacement(e,t,s,n){e.position={x:e.position.x*t,y:e.position.y*s},e.velocity={x:e.velocity.x*t,y:e.velocity.y*s},e.font=Q(e.font*n,V,te),e.fontVelocity*=n,e.target={x:e.target.x*t,y:e.target.y*s,font:Q(e.target.font*n,V,te),angle:e.target.angle},e.route=e.route.map(i=>({x:i.x*t,y:i.y*s,font:Q(i.font*n,V,te),angle:i.angle}))}regrid(e,t,s,n,i){const r=new e.constructor(n*i);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<i;o+=1)for(let u=0;u<n;u+=1)r[u+o*n]=e[Math.min(t-1,Math.floor((u+.5)*t/n))+Math.min(s-1,Math.floor((o+.5)*s/i))*t];return r}regridFloat(e,t,s,n,i){const r=new Float32Array(n*i);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<i;o+=1)for(let u=0;u<n;u+=1)r[u+o*n]=e[Math.min(t-1,Math.floor((u+.5)*t/n))+Math.min(s-1,Math.floor((o+.5)*s/i))*t];return r}neighbors(e){const t=e%this.width,s=Math.floor(e/this.width);return[(t+1)%this.width+s*this.width,(t-1+this.width)%this.width+s*this.width,t+(s+1)%this.height*this.width,t+(s-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,s){return{x:Se(e.x,t.x,s),y:Se(e.y,t.y,s),font:Se(e.font,t.font,s),angle:Se(e.angle,t.angle,s)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),s=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&s>=0&&s<this.height?t+s*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,s){const n=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(n?.58:.56)+s)+4;const i=n?`i:${e}`:e;let r=this.textMetrics.get(i);return r===void 0&&(this.measure.font=`${n?"italic ":""}500 100px ${ai}`,this.measure.fontKerning="none",r=this.measure.measureText(e).width/100,this.textMetrics.set(i,r)),r*t+e.length*s+4}}const Ye=.7,hi=1.8,di=(f,e,t,s,n,i)=>{if(s<=0)return f;const r=Math.max(0,t),o=r+s,c=(i-n)/hi*(s-Ye*(Math.exp(-r/Ye)-Math.exp(-o/Ye)));return Math.max(n,Math.min(i,f+e*c))},fi=(f,e,t,s)=>({freeze:e>t?Math.max(0,Math.min(1,(e-f)/(e-t))):0,heat:e<s?Math.max(0,Math.min(1,(f-e)/(s-e))):0}),_t=2/Math.log(1+Math.sqrt(2)),pi=30,$e=40,U=f=>{const e=document.getElementById(f);if(!e)throw new Error(`Missing #${f}`);return e},X=U("field"),ae=U("scale"),le=U("temperature"),He=U("time-speed"),Ge=U("brush-size"),gi=U("scale-value"),mi=U("temperature-value"),bi=U("time-speed-value"),xi=U("brush-size-value"),yi=U("explanation"),ye=U("settings-toggle"),ze=U("settings-panel"),Ie=U("pause"),vi=U("restart"),wi=U("clear-blue"),We=U("rough"),Ke=U("smooth"),je=U("scale-dock"),_i=U("scale-readout"),Ue=U("freeze"),Ee=U("heat"),Qe=U("phase"),Je=U("magnetization"),Ze=U("energy"),Te=U("fatal-error"),Mi=U("place-labels"),Pi=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function Bi(){const f=await It();if(!f){Te.hidden=!1,Te.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new At(f.device,f.format,X);let t=Number(le.value),s=t,n=Number(ae.value),i=n,r=Number(He.value),o=Number(Ge.value),u=!1,c=!0,d=!1,m=!1,p=!1,M=0,v=0,l=null,a=!0,g=0,y=performance.now(),_=0,I=!1,B=0;const x=new Map;let P=!1,z=0,L=n,A=!1,S=!1,F=0,$=0,N=!1,D=0;const H=new ci,Y=new Map,R=new Map,W=new Map;let O=null,q=0;const C=new Map,ue=new Set,ce=new Set,Ce=new Set,Re=new Set,et=_t+.2,ke=Number(ae.min),re=Number(ae.max),tt=Number(le.min),it=Number(le.max),Mt=.75;let he=0,Le=0;const Pt=(re-ke)/2.2,nt=Math.ceil(($e-1)/2),Bt=()=>{const h=Math.max(1,window.innerWidth),b=Math.max(1,window.innerHeight),G=h<=720?Math.min(window.devicePixelRatio||1,2):1,k=Math.min(f.device.limits.maxTextureDimension2D/h,f.device.limits.maxTextureDimension2D/b),w=Math.sqrt(Number(f.device.limits.maxStorageBufferBindingSize)/4/(h*b)),K=Math.max(.25,Math.min(G,k,w)),ee=Math.max(1,Math.round(h*K)),oe=Math.max(1,Math.round(b*K));return{density:ee/h,width:ee,height:oe}},Fe=h=>{const b=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**h-1)*b))},ve=()=>Fe(n)*2+1,St=()=>{const h=Math.min(e.width,e.height)/65.64;if(h<=0)return re;let b=Math.log2(1+Math.max(0,(nt-.5)/h));for(b=Math.min(re,Math.max(ke,b));b<re&&Fe(b)<nt;)b=Math.min(re,b+.01);return b},de=()=>{const h=ve(),b=h===1?"1 spin":`${h} × ${h}`;ae.value=n.toFixed(2),je.value=n.toFixed(2),gi.textContent=b,_i.textContent=b,yi.textContent=Pi[Math.min(3,Math.floor(n+.25))],We.setAttribute("aria-label",`Rough, observation scale ${n.toFixed(2)}`),Ke.setAttribute("aria-label",`Smooth, observation scale ${n.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-n/3)**2).toFixed(3))},fe=()=>{le.value=t.toFixed(2),mi.textContent=`T = ${t.toFixed(2)}`;const h=fi(t,s,tt,it);Ue.style.setProperty("--paddle-progress",h.freeze.toFixed(4)),Ee.style.setProperty("--paddle-progress",h.heat.toFixed(4)),Ue.setAttribute("aria-label",`Freeze, current temperature ${t.toFixed(2)}`),Ee.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const b=t-_t;b<-.2?Qe.textContent="ordered":b>.2?Qe.textContent="disordered":Qe.textContent="critical"},st=()=>{const h=Number.isInteger(r)?0:1;bi.textContent=`${r.toFixed(h)}×`},Ne=()=>{Ge.value=String(o),xi.textContent=`${o} px`},Gt=()=>({active:p&&!P&&!S,painting:d,forceHot:m,x:M,y:v,radius:o/2}),pe=()=>{const h=ve(),b=(h-1)/2,G=h===1?0:.14*(1-n/3)**2;e.draw(n,b,G,F,Gt()),a=!1},rt=()=>{$+=1,H.reset(),O=null,R.clear(),W.clear(),C.clear(),ot([],0)},ot=(h,b)=>{const G=new Set,k={width:X.clientWidth,height:X.clientHeight};for(const w of h){if(G.add(w.id),O&&C.get(w.id)!==q){const j=kt(w,O,k);R.set(w.id,Lt(R.get(w.id),j)),C.set(w.id,q)}const K=Ft(W.get(w.id),R.get(w.id)?.mode??"dark",b);W.set(w.id,K);const ee=Nt(K),oe=Rt(w.kind,K.from,K.to,ee.blend),ne=ui(w);let J=Y.get(w.id);for(J||(J=[],Y.set(w.id,J));J.length<ne.length;){const j=document.createElement("span");j.className="place-label",Mi.append(j),J.push(j)}for(;J.length>ne.length;)J.pop()?.remove();for(let j=0;j<ne.length;j+=1){const E=J[j],Z=ne[j];E.dataset.kind!==w.kind&&(E.dataset.kind=w.kind),E.textContent!==w.text&&(E.textContent=w.text),E.style.color=oe,E.style.opacity=(w.opacity*ee.opacity).toFixed(3),E.style.fontSize=`${w.fontSize.toFixed(2)}px`,E.style.letterSpacing=`${w.letterSpacing.toFixed(2)}px`,E.style.transform=`translate(${Z.x.toFixed(2)}px, ${Z.y.toFixed(2)}px) rotate(${w.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[w,K]of Y)if(!G.has(w)){for(const ee of K)ee.remove();Y.delete(w),R.delete(w),W.delete(w),C.delete(w)}},at=(h=!0)=>{const b=Bt();e.resize(b.width,b.height,b.density,h),de(),a=!0,pe(),B+=1,$+=1,O=null},we=h=>{const b=X.getBoundingClientRect(),G=(h.clientX-b.left)/b.width,k=(h.clientY-b.top)/b.height;return G<0||G>=1||k<0||k>=1?null:(M=h.clientX-b.left,v=h.clientY-b.top,{x:G*e.width,y:k*e.height})},_e=(h,b)=>{const G=we(h);if(!G){l=null;return}const k=l??G;e.paintSegment(k.x,k.y,G.x,G.y,o*e.density/2,b,m),l=G,a=!0},Oe=h=>{d=!0,l=null,_e(h,!0),m=!1},lt=()=>{const h=[...x.values()];return h.length<2?0:Math.hypot(h[1].x-h[0].x,h[1].y-h[0].y)},ge=()=>{if(I)return;I=!0;const h=B;e.readStats().then(b=>{if(h!==B)return;Je.textContent=b.magnetization.toFixed(3),Ze.textContent=b.energy.toFixed(3);const G=b.signedMagnetization===-1;!d&&m!==G&&(m=G,a=!0)}).catch(b=>{console.warn("Could not read Ising statistics.",b)}).finally(()=>{I=!1})},ut=h=>{n=h,i=n,de(),a=!0};ae.addEventListener("input",()=>ut(Number(ae.value))),je.addEventListener("input",()=>ut(Number(je.value))),le.addEventListener("input",()=>{s=Number(le.value),t=s,he=0,fe()});const Me=(h,b)=>{const G=()=>{h.setAttribute("aria-pressed",String(b.size>0))},k=w=>{b.delete(`pointer:${w.pointerId}`),h.hasPointerCapture(w.pointerId)&&h.releasePointerCapture(w.pointerId),G()};h.addEventListener("pointerdown",w=>{w.pointerType==="mouse"&&w.button!==0||(w.preventDefault(),h.setPointerCapture(w.pointerId),b.add(`pointer:${w.pointerId}`),G())}),h.addEventListener("pointerup",k),h.addEventListener("pointercancel",k),h.addEventListener("lostpointercapture",w=>{b.delete(`pointer:${w.pointerId}`),G()}),h.addEventListener("keydown",w=>{w.code!=="Space"&&w.code!=="Enter"||(w.preventDefault(),b.add(`key:${w.code}`),G())}),h.addEventListener("keyup",w=>{w.code!=="Space"&&w.code!=="Enter"||(w.preventDefault(),b.delete(`key:${w.code}`),G())}),h.addEventListener("blur",()=>{for(const w of b)w.startsWith("key:")&&b.delete(w);G()})};Me(We,ue),Me(Ke,ce),Me(Ue,Ce),Me(Ee,Re),He.addEventListener("input",()=>{r=Number(He.value),st()}),Ge.addEventListener("input",()=>{o=Number(Ge.value),Ne(),a=!0}),window.addEventListener("keydown",h=>{h.code!=="BracketLeft"&&h.code!=="BracketRight"||(h.preventDefault(),o=Math.max(4,Math.min(100,o+(h.code==="BracketLeft"?-4:4))),Ne(),a=!0)});const Ve=h=>{c=h,ze.classList.toggle("is-closed",!c),ze.setAttribute("aria-hidden",String(!c)),ye.setAttribute("aria-expanded",String(c)),ye.setAttribute("aria-label",c?"Close settings":"Open settings")};ye.addEventListener("click",()=>Ve(!c)),document.addEventListener("pointerdown",h=>{const b=h.target;!c||!(b instanceof Node)||ze.contains(b)||ye.contains(b)||Ve(!1)},{capture:!0}),document.addEventListener("click",h=>{const b=h.target;!c||!(b instanceof Node)||ye.contains(b)||(!ze.contains(b)||b instanceof Element&&b.closest("button"))&&Ve(!1)}),Ie.addEventListener("click",()=>{u=!u;const h=u?"Resume simulation":"Pause simulation";Ie.setAttribute("aria-pressed",String(u)),Ie.setAttribute("aria-label",h),Ie.title=h,g=0}),vi.addEventListener("click",()=>{e.randomize(),m=!1,g=0,B+=1,rt(),Je.textContent="0.000",Ze.textContent="0.000",a=!0,pe(),ge()}),wi.addEventListener("click",()=>{e.clearBlue(),m=!0,g=0,B+=1,rt(),Je.textContent="1.000",Ze.textContent="-2.000",a=!0,pe(),ge()}),X.addEventListener("pointerdown",h=>{if(we(h)){if(X.setPointerCapture(h.pointerId),p=!0,h.pointerType==="touch"){x.set(h.pointerId,{x:h.clientX,y:h.clientY}),x.size===1?(A=!0,S=!1):x.size===2&&(d=!1,l=null,A=!1,S=!0,P=!0,z=lt(),L=i),a=!0;return}Oe(h)}}),X.addEventListener("pointermove",h=>{if(we(h),p=!0,a=!0,h.pointerType==="touch"){if(!x.has(h.pointerId))return;if(x.set(h.pointerId,{x:h.clientX,y:h.clientY}),P&&x.size>=2){const b=lt();z>0&&b>0&&(i=Math.max(0,Math.min(3,L-Math.log2(b/z)*.9)));return}if(x.size===1&&!S){if(A)Oe(h),A=!1;else if(d)for(const b of h.getCoalescedEvents())_e(b,!1)}return}if(d){const b=h.getCoalescedEvents();if(b.length===0)_e(h,!1);else for(const G of b)_e(G,!1)}});const zt=h=>{h.pointerType==="touch"&&(A&&!S&&Oe(h),x.delete(h.pointerId),x.size<2&&(P=!1),x.size===0&&(A=!1,S=!1,p=!1)),d=!1,l=null,X.hasPointerCapture(h.pointerId)&&X.releasePointerCapture(h.pointerId),a=!0,ge()};X.addEventListener("pointerup",zt),X.addEventListener("pointercancel",h=>{x.delete(h.pointerId),d=!1,p=!1,l=null,A=!1,P=!1,a=!0}),X.addEventListener("pointerenter",()=>{p=!0,a=!0}),X.addEventListener("pointerleave",()=>{d||(p=!1,a=!0)}),X.addEventListener("wheel",h=>{h.preventDefault();const b=Math.max(-120,Math.min(120,h.deltaY));i=Math.max(0,Math.min(3,i+b*.00125)),we(h),p=!0},{passive:!1}),window.addEventListener("blur",()=>{d=!1,p=!1,l=null,x.clear(),P=!1,A=!1,ue.clear(),ce.clear(),Ce.clear(),Re.clear(),he=0,Le=0,We.setAttribute("aria-pressed","false"),Ke.setAttribute("aria-pressed","false"),Ue.setAttribute("aria-pressed","false"),Ee.setAttribute("aria-pressed","false"),a=!0}),window.addEventListener("resize",()=>at(!0)),at(!1),e.step(t,40),fe(),st(),Ne(),a=!0,pe(),ge();const ct=h=>{const b=Math.max(0,(h-y)/1e3),G=Math.min(.1,b);y=h;const k=+(ce.size>0)-+(ue.size>0);if(k!==0){const E=k<0?ke:re,Z=k*Pt*G;n=k<0?Math.max(E,n+Z):Math.min(E,n+Z),i=n,de(),a=!0}else{const E=i-n;Math.abs(E)>5e-4?(n+=E*(1-Math.exp(-G*10)),de(),a=!0):n!==i&&(n=i,de(),a=!0)}const w=+(Re.size>0)-+(Ce.size>0);if(w!==Le&&(he=0,Le=w),w!==0)t=di(t,w,he,G,tt,it),he+=G,fe();else{const E=s-t;Math.abs(E)>5e-4?(t+=E*(1-Math.exp(-G/Mt)),fe()):t!==s&&(t=s,fe())}if(!u){g+=G*pi*r;const E=Math.min(8,Math.floor(g));E>0&&(g-=E,e.step(t,E),a=!0)}const K=ve()>=$e?1:0,ee=K-F;Math.abs(ee)>.001?(F+=ee*(1-Math.exp(-G*7)),a=!0):F!==K&&(F=K,a=!0);const oe=ve()>=$e?n:St(),ne=t>et?"chaos":"map",J=X.getBoundingClientRect(),j=H.advance(Math.min(.5,b),ne,{width:J.width,height:J.height});if(ot(j,b),a&&pe(),!N&&ne==="map"&&h-D>280){D=h,N=!0;const E=$;e.readRegionSample(Fe(oe),oe).then(Z=>{E!==$||!Z||t>et||(O=Z,q+=1,H.ingest(Z))}).catch(Z=>{console.warn("Could not read Ising regions.",Z)}).finally(()=>{N=!1})}h-_>750&&(_=h,ge()),requestAnimationFrame(ct)};requestAnimationFrame(ct)}Bi().catch(f=>{console.error(f),Te.hidden=!1,Te.textContent=f instanceof Error?f.message:"Could not start the WebGPU simulation."});
