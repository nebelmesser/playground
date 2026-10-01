(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();async function ti(){try{if(!navigator.gpu)return null;const a=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!a)return null;const e=await a.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(a){return console.error("WebGPU initialization failed.",a),null}}const ii=`struct SimParams {
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
`,k=(a,e)=>Math.ceil(a/e),Re=112,Ce=128,ni=(a,e)=>a>=e?{width:Re,height:Math.max(1,Math.round(Re*e/a))}:{width:Math.max(1,Math.round(Re*a/e)),height:Re};class si{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,s){this.device=e,this.format=t,this.canvas=s;const i=s.getContext("webgpu");if(!i)throw new Error("Could not create a WebGPU canvas context.");this.context=i,this.context.configure({device:e,format:t,alphaMode:"opaque"});const n=e.createShaderModule({label:"Ising shaders",code:ii});this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"randomize"}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:n,entryPoint:"sample_regions"}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:n,entryPoint:"fullscreen_vertex"},fragment:{module:n,entryPoint:"field_fragment",targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(r=>e.createBuffer({label:`Ising label blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:Ce*Ce*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:Ce*Ce*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,s,i=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=s;return}const n=this.width,r=this.height,o=this.spinBuffers,l=this.fieldTexture,h=this.blurTextures,f=this.labelBlurTextures,x=this.statsOutput,d=this.statsReadback,y=o?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=s,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),i&&y){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,n,r);const p=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),v=this.device.createCommandEncoder({label:"Resize Ising grid"}),g=v.beginComputePass();g.setPipeline(this.pipelines.resize),g.setBindGroup(0,p),g.dispatchWorkgroups(k(e,8),k(t,8)),g.end(),this.device.queue.submit([v.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...x?[x]:[]],readback:d??void 0,textures:[l,...h??[],...f??[]].filter(p=>!!p)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(k(this.width,8),k(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(k(this.width,8),k(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let s=0;s<t;s+=1){const i=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,i);const n=this.device.createCommandEncoder({label:"Advance Ising state"}),r=n.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(k(this.width,8),k(this.height,8)),r.end(),this.device.queue.submit([n.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,s,i,n,r,o){const l=Math.floor(Math.min(e,s)-n),h=Math.floor(Math.min(t,i)-n),f=Math.ceil(Math.max(e,s)+n),x=Math.ceil(Math.max(t,i)+n),d=f-l+1,y=x-h+1;this.writeBrushParams(l,h,d,y,e,t,s,i,n,o);const p=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const g=p.beginComputePass();g.setPipeline(this.pipelines.select),g.setBindGroup(0,this.selectGroups[this.currentIndex]),g.dispatchWorkgroups(1),g.end()}const v=p.beginComputePass();v.setPipeline(this.pipelines.paint),v.setBindGroup(0,this.paintGroups[this.currentIndex]),v.dispatchWorkgroups(k(d,8),k(y,8)),v.end(),this.device.queue.submit([p.finish()]),this.fieldDirty=!0}draw(e,t,s,i,n){if(!this.renderGroup||!this.observationReady())return;const r=this.secondaryObservationRadius(t,e),o=this.fieldDirty||t!==this.lastBlurRadius||r!==this.lastSecondaryRadius,l=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const f=l.beginComputePass();f.setPipeline(this.pipelines.field),f.setBindGroup(0,this.fieldGroups[this.currentIndex]),f.dispatchWorkgroups(k(this.width,8),k(this.height,8)),f.end(),this.fieldDirty=!1}o&&this.appendObservationBlur(l,t,r,"display"),this.writeRenderParams(e,t,s,i,n);const h=l.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});h.setPipeline(this.pipelines.render),h.setBindGroup(0,this.renderGroup),h.draw(3),h.end(),this.device.queue.submit([l.finish()])}async readRegionSample(e,t){const s=this.regionGroup;if(!s||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const i=ni(this.width,this.height),n=i.width*i.height;if(n*4>this.regionStorage.size)return null;const r=this.secondaryObservationRadius(e,t),o=e===this.lastBlurRadius&&r===this.lastSecondaryRadius,l=o?s:this.labelRegionGroup;if(!l)return null;const h=this.device.createCommandEncoder({label:"Read Ising regions"});o||this.appendObservationBlur(h,e,r,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([i.width,i.height,0,0]));const f=h.beginComputePass();f.setPipeline(this.pipelines.regions),f.setBindGroup(0,l),f.dispatchWorkgroups(k(i.width,8),k(i.height,8)),f.end(),h.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,n*4),this.device.queue.submit([h.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const x=new Int32Array(this.regionReadback.getMappedRange(),0,n),d=new Int8Array(n),y=new Float32Array(n);for(let p=0;p<n;p+=1)d[p]=x[p]<0?-1:1,y[p]=(Math.abs(x[p])-1)/65534;return{width:i.width,height:i.height,signs:d,luminance:y}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,s=this.statsGroups[this.currentIndex];if(!e||!t||!s)return{energy:0,magnetization:0,signedMagnetization:0};const i=k(this.width,16),n=k(this.height,16),r=new Uint32Array([this.width,this.height,i,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(e);const l=o.beginComputePass();l.setPipeline(this.pipelines.stats),l.setBindGroup(0,s),l.dispatchWorkgroups(i,n),l.end(),o.copyBufferToBuffer(e,0,t,0,8),this.device.queue.submit([o.finish()]),await t.mapAsync(GPUMapMode.READ);const h=new Int32Array(t.getMappedRange()),f=h[0],x=h[1];t.unmap();const d=this.width*this.height;return{magnetization:Math.abs(f/d),signedMagnetization:f/d,energy:x/d}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}))}writeSimParams(e,t,s,i,n=0,r=0){const o=new ArrayBuffer(32),l=new DataView(o);l.setUint32(0,this.width,!0),l.setUint32(4,this.height,!0),l.setUint32(8,e,!0),l.setUint32(12,t,!0),l.setFloat32(16,s,!0),l.setUint32(20,i,!0),l.setUint32(24,n,!0),l.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(e,t,s,i,n,r,o,l,h,f){const x=new ArrayBuffer(64),d=new DataView(x);d.setUint32(0,this.width,!0),d.setUint32(4,this.height,!0),d.setInt32(8,e,!0),d.setInt32(12,t,!0),d.setUint32(16,s,!0),d.setUint32(20,i,!0),d.setUint32(24,f?1:0,!0),d.setFloat32(32,n,!0),d.setFloat32(36,r,!0),d.setFloat32(40,o,!0),d.setFloat32(44,l,!0),d.setFloat32(48,h,!0),this.device.queue.writeBuffer(this.brushUniform,0,x)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,s,i){const n=i==="display",r=n?this.blurUniforms:this.labelBlurUniforms,o=n?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,l=n?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,h=n?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,f=n?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!l||!h||!f||o.length===0)return;this.writeBlurParams(r[0],t),this.writeBlurParams(r[1],s);const x=e.beginComputePass({label:"Horizontal Ising observation blur"});x.setPipeline(this.pipelines.blurSpinsHorizontal),x.setBindGroup(0,o[this.currentIndex]),x.dispatchWorkgroups(k(this.height,64)),x.end();const d=e.beginComputePass({label:"Vertical Ising observation blur"});if(d.setPipeline(this.pipelines.blurTextureVertical),d.setBindGroup(0,l),d.dispatchWorkgroups(k(this.width,64)),d.end(),s>0){const y=e.beginComputePass({label:"Secondary horizontal Ising blur"});y.setPipeline(this.pipelines.blurTextureHorizontal),y.setBindGroup(0,h),y.dispatchWorkgroups(k(this.height,64)),y.end();const p=e.beginComputePass({label:"Secondary vertical Ising blur"});p.setPipeline(this.pipelines.blurTextureVertical),p.setBindGroup(0,f),p.dispatchWorkgroups(k(this.width,64)),p.end()}n&&(this.lastBlurRadius=t,this.lastSecondaryRadius=s)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,s,i,n){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=t,r[5]=e,r[6]=s,r[7]=n.active?1:0,r[8]=n.x*this.density,r[9]=n.y*this.density,r[10]=n.radius*this.density,r[11]=n.painting?1:0,r[12]=n.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),r[14]=i,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const s of e.buffers)s.destroy();for(const s of e.textures??[])s.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const ri={land:{dark:"#050302",light:"#ffd5a6"},water:{dark:"#06132e",light:"#c4eaff"}},$t=(a,e,t)=>Math.max(e,Math.min(t,a)),oi=a=>a<=.04045?a/12.92:((a+.055)/1.055)**2.4,Tt=a=>{const e=[1,3,5].map(t=>oi(parseInt(a.slice(t,t+2),16)/255));return e[0]*.2126+e[1]*.7152+e[2]*.0722},Ut=(a,e)=>(Math.max(a,e)+.05)/(Math.min(a,e)+.05),He=(a,e)=>ri[a==="lake"?"water":"land"][e],ai=(a,e,t,s)=>{const i=He(a,e),n=He(a,t);return`rgb(${[1,3,5].map(o=>{const l=parseInt(i.slice(o,o+2),16),h=parseInt(n.slice(o,o+2),16);return(l+(h-l)*s).toFixed(2)}).join(", ")})`},li=(a,e,t)=>{const s=a.angle*Math.PI/180,i=Math.cos(s),n=Math.sin(s),r=Tt(He(a.kind,"dark")),o=Tt(He(a.kind,"light")),l=[],h=[];for(let x=-1;x<=1;x+=1)for(let d=-4;d<=4;d+=1){const y=d*a.width*.105,p=x*a.height*.28,v=a.x+y*i-p*n,g=a.y+y*n+p*i,M=Math.max(0,Math.min(e.width-1,Math.floor(v/t.width*e.width))),B=Math.max(0,Math.min(e.height-1,Math.floor(g/t.height*e.height))),I=e.luminance[B*e.width+M];l.push(Ut(I,r)),h.push(Ut(I,o))}l.sort((x,d)=>x-d),h.sort((x,d)=>x-d);const f=Math.floor((l.length-1)*.25);return{dark:l[f],light:h[f]}},ui=(a,e)=>{const t=a?a.darkContrast*.55+e.dark*.45:e.dark,s=a?a.lightContrast*.55+e.light*.45:e.light;let i=a?.mode??(t>=2.5||s<4.5?"dark":"light");const n=i==="dark"?s:t,o=(i==="dark"?t:s)<(i==="dark"?2.5:3)&&n>4.5?(a?.weakSamples??0)+1:0,l=o>=5;return l&&(i=i==="dark"?"light":"dark"),{mode:i,darkContrast:t,lightContrast:s,weakSamples:l?0:o,opacity:i==="dark"?$t(.82+(5-t)*.06,.82,1):1}},hi=(a,e,t)=>a===void 0?e:a+(e-a)*(1-Math.exp(-$t(t,0,.5)/.8)),ci=(a,e,t)=>{if(!a)return{from:e,to:e,progress:1,velocity:0};let s=a;if(s.from===s.to){if(e===s.to)return s;s={from:s.to,to:e,progress:0,velocity:0}}const i=e===s.to?1:0,n=Math.max(0,Math.min(t,1/60)),r=5,o=s.progress-i,l=s.velocity+r*o,h=Math.exp(-r*n),f=Math.max(0,Math.min(1,i+(o+l*n)*h)),x=(s.velocity-r*l*n)*h;return Math.abs(f-i)<.001&&Math.abs(x)<.02?{from:e,to:e,progress:1,velocity:0}:{...s,progress:f,velocity:x}},di=a=>a.from===a.to?{blend:1,opacity:1}:{blend:a.progress*a.progress*(3-2*a.progress),opacity:1},$e=["v","l","m","n","s","c","r","t","p","d","f","g","b","pr","tr","cl","cr","fl","fr","gl","gr","pl","br","dr","st","qu"],tt=$e.filter(a=>a.length===1),Xt=["l","r","n","m","t","s","c","d","v","p","g","b","f","br","cr","dr","gr","pr","tr","st"],oe=["a","e","i","o","u"],gt=["a","e","i","o","u","a","e","i","o","ae","au","oe"],Be=["n","r","s","l","m","t"],fi=["a","us","um","is","or"],gi=["ia","ea","on","ar","is","um"],pe=12,Me=(a,e,t=0)=>e[(Math.floor(a()*e.length)+t)%e.length],T=a=>`${a.syllables.map(e=>e.onset+e.vowel).join("")}${a.coda}`,pt=(a,e,t)=>{for(let s=0;s<512;s+=1){const i=t??(a()<.82||s>=24?2:3),n=[];let r=!1;for(let h=0;h<i;h+=1){const x=Me(a,t===1?tt:h===0?$e:Xt,h===0?s:h===1?Math.floor(s/$e.length):0);let d=Me(a,t===1?oe:gt,t===1?Math.floor(s/tt.length):0);d.length>1&&r&&(d=Me(a,oe)),x==="qu"&&(d==="u"||d==="au"||d==="oe")&&(d="a"),h>0&&`${x}${d}`===n[h-1].onset+n[h-1].vowel&&(d=Me(a,gt,1)),r||=d.length>1,n.push({onset:x,vowel:d})}const o={syllables:n,coda:Me(a,Be,t===1?Math.floor(s/(tt.length*oe.length)):0)},l=T(o);if(!(l.length>pe)&&!e?.has(l))return o}throw new Error("Could not find an unused place name")},Yt=(a,e,t,s)=>{if(a.syllables.length>=3)return null;if(s&&s.syllables.length>a.syllables.length&&T(ue(s,a.syllables.length))===T(a)){const i=ue(s,a.syllables.length+1);if(!t?.has(T(i)))return i}for(let i=0;i<oe.length*Be.length;i+=1){const n=oe[(Math.abs(e)+i)%oe.length],r=Be[(Math.floor(Math.abs(e)/oe.length)+Math.floor(i/oe.length))%Be.length],o={syllables:[...a.syllables.map(l=>({...l})),{onset:a.coda,vowel:n}],coda:r};if(T(o).length<=pe&&!t?.has(T(o)))return o}return null},ue=(a,e)=>({syllables:a.syllables.slice(0,e).map(t=>({...t})),coda:e<a.syllables.length?a.syllables[e].onset.charAt(0):a.coda}),Rt=(a,e,t,s)=>{if(a.syllables.length<=e)return Ie(a);const i=ue(a,e);if(e===1){const n=i.syllables[0];n.onset=n.onset==="qu"?"c":n.onset.charAt(0),n.vowel=n.vowel.charAt(0)}if(!s?.has(T(i)))return i;for(let n=0;n<i.syllables.length*2+1;n+=1){const r=mt(i,t+n,s);if(!s?.has(T(r)))return r}return pt(Math.random,s,e)},Ie=a=>({syllables:a.syllables.map(e=>({...e})),coda:a.coda}),ge=(a,e)=>{if(e===a.syllables.length*2)return a.coda;const t=a.syllables[Math.floor(e/2)];return e%2===0?t.onset:t.vowel},yt=(a,e,t)=>{const s=Ie(a);return e===s.syllables.length*2?s.coda=t:e%2===0?s.syllables[Math.floor(e/2)].onset=t:s.syllables[Math.floor(e/2)].vowel=t,s},xt=a=>a.syllables.every(({onset:e,vowel:t})=>e!=="qu"||!["u","au","oe"].includes(t)),Ct=(a,e,t=1,s=4)=>{let i=t;for(;i<s&&a()<e;)i+=1;return i},mt=(a,e,t,s=1)=>{const i=a.syllables.length*2+1;let n=Ie(a);const r=new Set;for(let o=0;o<Math.min(s,i);o+=1){let l=null;for(let h=0;h<i&&!l;h+=1){const f=(Math.abs(e)+o+h)%i;if(r.has(f))continue;const x=ge(n,f),d=f===i-1?Be:f%2===1?gt:f===0?$e:Xt,y=[...new Set(d)].filter(p=>p.length===x.length&&p!==x);for(let p=0;p<y.length;p+=1){const v=y[(Math.abs(e+h*7+o*11)+p)%y.length],g=yt(n,f,v),M=T(g);if(M.length<=pe&&xt(g)&&!t?.has(M)){l=g,r.add(f);break}}}if(!l)break;n=l}return n},pi=a=>{const e=Ie(a);for(;T(e).length>pe;){let t=!1;for(let s=e.syllables.length-1;s>=0;s-=1){const i=e.syllables[s];if(i.onset.length>1){i.onset=i.onset==="qu"?"c":i.onset.charAt(0),t=!0;break}if(i.vowel.length>1){i.vowel=i.vowel.charAt(0),t=!0;break}}if(!t)break}return e},mi=(a,e)=>{const t=[...a].filter(y=>y.weight>0).sort((y,p)=>p.weight-y.weight);if(t.length===0)throw new Error("Cannot recombine without a parent");const s=e??Math.min(3,t.reduce((y,p)=>y+p.genome.syllables.length,0)),i=t.reduce((y,p)=>y+p.weight,0),n=t.map(y=>y.weight/i*s),r=n.map(Math.floor),o=t.map((y,p)=>p).sort((y,p)=>n[p]-r[p]-(n[y]-r[y])||t[p].weight-t[y].weight||y-p);for(let y=s-r.reduce((v,g)=>v+g,0),p=0;y>0;y-=1,p+=1)r[o[p]]+=1;const l=t.filter((y,p)=>r[p]>0),h=r.filter(y=>y>0),f=y=>{let p=Ie(l[y].genome);for(;p.syllables.length<h[y];){const v=Yt(p,T(p).length*131+y*17);if(!v)break;p=v}return p},x=f(0);let d=ue(x,h[0]);for(let y=1;y<l.length;y+=1){const p=f(y);for(let v=0;v<h[y];v+=1){const g=p.syllables[v],M=v+1<p.syllables.length?p.syllables[v+1].onset.charAt(0):p.coda;d=pi({syllables:[...d.syllables,{onset:d.coda+(v===0?g.onset:g.onset.slice(1)),vowel:g.vowel}],coda:M})}}return d},bi=(a,e,t)=>{if(e.syllables.length<a.syllables.length){const i=ue(a,a.syllables.length-1);return t?.has(T(i))?null:i}if(e.syllables.length>a.syllables.length){const i=ue(e,a.syllables.length);if(T(i)===T(a)){const n=ue(e,a.syllables.length+1);return t?.has(T(n))?null:n}e=i}const s=a.syllables.length*2+1;for(let i=0;i<s;i+=1){const n=ge(e,i);if(n===ge(a,i))continue;const r=yt(a,i,n);if(T(r).length<=pe&&xt(r)&&!t?.has(T(r)))return r}return null},yi=(a,e,t,s)=>{const i=a.syllables.length*2+1;for(let n=0;n<i;n+=1){const r=(Math.abs(t)+n)%i,o=r===i-1?e.syllables.length*2:Math.min(Math.floor(r/2),e.syllables.length-1)*2+r%2,l=ge(e,o);if(l===ge(a,r)||l.length!==ge(a,r).length)continue;const h=yt(a,r,l);if(T(h).length<=pe&&xt(h)&&!s?.has(T(h)))return h}return null},Ne=(a,e)=>{const t=`${e.charAt(0).toUpperCase()}${e.slice(1)}`,s=[...e].reduce((r,o)=>r+o.charCodeAt(0),0),i=a==="continent"?gi:fi,n=i[s%i.length];return`${t}${n}`},Nt=.7,se=5,bt=2.27,Lt=.2,Le=3,xi=.75,vi=.24,wi=3,_i=.0025,Mi=.004,Wt=.055,Pi=.012,Si=.03,Ot=1/2,Gi=48,it=1.35,Bi=.16,Ii=9,q=8,ee=64,te=80,Ft=20,Dt=.12,Vt=.22,zi=.05,Ai=.12,Ei=.85,Ti=.25,Ui=3,kt=8,Ri=1.8,Ci=140,Ni=28,Li=160,Oi=2,Fi='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',Q=(a,e,t)=>Math.max(e,Math.min(t,a)),Pe=(a,e,t,s)=>a+(e-a)*(1-Math.exp(-t/s)),re=a=>a==="island"||a==="continent",nt=(a,e)=>{const t=a/e;return t<Pi?1:t<Si?2:3},ne=a=>a*Bi,Oe=(a,e,t)=>a+(e-a)*t,st=(a,e)=>Math.sqrt(Wt*Math.max(1,e)/Math.max(1,a)),qt=(a,e)=>1-(1-a)**Math.sqrt(e),Di=a=>({heat:Math.sqrt(Q((a-bt)/Lt,0,1)),cold:Math.sqrt(Q((bt-a)/Lt,0,1))}),Se=(a,e)=>{const t=Math.abs(a-e)%180;return Math.min(t,180-t)},Vi=(a,e,t,s)=>{const i=2/Ei,n=(t-a)*i*i-2*i*e,r=e+n*s;return{value:a+r*s,velocity:r}},ki=a=>[{x:a.x,y:a.y}];class qi{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1}advance(e,t,s,i=!1){this.applyViewport(s);const n=Q(e,0,.5);t!=="map"&&(this.synced=!1);for(const o of this.tracks.values()){t!=="map"||!o.present||!o.confirmed?(o.heatHoldSeconds=0,o.heatPulseReady=!1):i&&!o.heatPulseReady?(o.heatHoldSeconds+=n*st(o.area,this.width*this.height),o.heatHoldSeconds>=xi&&(o.heatPulseReady=!0)):!i&&!o.heatPulseReady&&(o.heatHoldSeconds=0);const l=t==="map"&&o.confirmed&&o.missing===0;o.agreement=Pe(o.agreement,l?1:0,n,Nt),o.stability=Pe(o.stability,l?o.agreement:0,n,Nt);const h=o.placement;h?.alive&&o.present&&this.glide(o,h,n);const f=h?[h,...o.ghosts]:o.ghosts;for(const x of f){const d=t==="map"&&this.synced&&o.present&&o.confirmed&&o.missing<.75&&x.alive;x.opacity=Pe(x.opacity,d?o.stability:0,n,d?.25:.45)}h&&!h.alive&&h.opacity<.02&&(o.placement=null),o.ghosts=o.ghosts.filter(x=>x.opacity>=.02)}const r=this.collect(n);return t==="chaos"&&r.length===0&&this.reset(),r}ingest(e,t=bt){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const s=performance.now()/1e3,i=this.lastIngest<0?0:Math.min(2,s-this.lastIngest);this.lastIngest=s;const{heat:n,cold:r}=Di(t);for(const u of this.tracks.values())u.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const u=[];for(const c of this.tracks.values()){c.soft&&(c.soft=this.regridFloat(c.soft,this.width,this.height,e.width,e.height)),c.lastMask&&(c.lastMask=this.regrid(c.lastMask,this.width,this.height,e.width,e.height)),c.nameAnchor&&(c.nameAnchor=this.regrid(c.nameAnchor,this.width,this.height,e.width,e.height));const b=c.placement?[c.placement,...c.ghosts]:c.ghosts;for(const P of b){const z=P.mask===P.regionMask;P.mask=this.regrid(P.mask,this.width,this.height,e.width,e.height),P.regionMask=z?P.mask:this.regrid(P.regionMask,this.width,this.height,e.width,e.height),u.push(P.mask),z||u.push(P.regionMask)}}this.width=e.width,this.height=e.height;for(const c of u)this.remember(c)}const l=this.components(e.signs).filter(u=>u.role==="place").sort((u,c)=>c.area-u.area).slice(0,Gi),h=[],f=[],x=(u,c,b)=>{const P=c.placement?.alive?{x:c.placement.position.x/this.viewport.width,y:c.placement.position.y/this.viewport.height}:c.center;return{region:u,track:c,overlap:b,distance:this.distance(P,l[u].center)}};for(let u=0;u<l.length;u+=1){const c=new Map;for(const b of l[u].cells){const P=this.owners[b];P&&c.set(P,(c.get(P)??0)+1)}for(const[b,P]of c){const z=this.tracks.get(b);!z||re(z.kind)!==l[u].sign>0||P<=0||h.push(x(u,z,P))}f.push(c)}const d=new Set,y=new Set,p=[],v=u=>{u.sort((c,b)=>b.overlap-c.overlap||c.distance-b.distance||c.track.id-b.track.id);for(const c of u)d.has(c.region)||y.has(c.track.id)||(d.add(c.region),y.add(c.track.id),p.push({track:c.track,region:l[c.region],overlap:c.overlap}))};v(h);const g=[];for(const u of this.tracks.values())if(!(y.has(u.id)||!u.lastMask||u.missing>=se))for(let c=0;c<l.length;c+=1){if(d.has(c)||re(u.kind)!==l[c].sign>0)continue;const b=l[c].bounds;if(u.bounds.x1<=b.x0||b.x1<=u.bounds.x0||u.bounds.y1<=b.y0||b.y1<=u.bounds.y0)continue;let P=0;for(const z of l[c].cells)P+=u.lastMask[z]??0;P>0&&g.push(x(c,u,P))}v(g);const M=[];for(const u of this.tracks.values())if(!(y.has(u.id)||u.missing>=se))for(let c=0;c<l.length;c+=1){const b=l[c];if(d.has(c)||re(u.kind)!==b.sign>0)continue;const P=Math.min(u.area,b.area)/Math.max(u.area,b.area),z=Math.max(0,u.bounds.x0-b.bounds.x1,b.bounds.x0-u.bounds.x1)*this.width,G=Math.max(0,u.bounds.y0-b.bounds.y1,b.bounds.y0-u.bounds.y1)*this.height,_=Math.hypot((u.center.x-b.center.x)*this.width,(u.center.y-b.center.y)*this.height),E=Math.sqrt(Math.min(u.area,b.area)/Math.PI);P>=.5&&Math.hypot(z,G)<=1.5&&_<=Math.max(3,E*1.25)&&M.push(x(c,u,0))}v(M);const B=new Set;for(const u of this.tracks.values()){let c=0;for(let b=0;b<l.length;b+=1)re(u.kind)===l[b].sign>0&&(f[b].get(u.id)??0)>=l[b].area*.5&&(c+=1);c>1&&B.add(u.id)}for(let u=0;u<l.length;u+=1){if(d.has(u))continue;const c=l[u];if(!c.kind)continue;const b=[...f[u]].filter(([D,H])=>B.has(D)&&H>=c.area*.5&&re(this.tracks.get(D).kind)===c.sign>0).sort((D,H)=>H[1]-D[1]).map(([D])=>this.tracks.get(D)).find(D=>D!==void 0),P=st(c.area,e.signs.length),z=nt(c.area,e.signs.length),G=z===3?null:z,_=b?Ct(Math.random,qt(.28+.35*n-.2*r,P)):0,E=b&&G&&b.genome.syllables.length>G?Rt(b.genome,G,this.nameSeed(c,b.id),this.usedStems):b?.genome;let N=b?mt(E??b.genome,this.nameSeed(c,b.id),this.usedStems,_):pt(Math.random,this.usedStems,z);this.usedStems.has(T(N))&&(N=pt(Math.random,this.usedStems,z));const R=T(N);this.usedStems.add(R);const O=z<3?"":b&&_<3?b.suffix:Ne(c.kind,R).slice(R.length),K=`${R.charAt(0).toUpperCase()}${R.slice(1)}${O}`,Y=this.nextTrackId++,F={id:Y,stem:R,genome:N,reserveGenome:N,suffix:O,lineage:b?.lineage??Y,pendingGenome:null,nameAnchor:null,nameStreak:0,lastNameChange:s,mutationSerial:0,heatDose:0,coldDose:0,heatHoldSeconds:0,heatPulseReady:!1,kind:c.kind,text:K,area:c.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:c.center,bounds:c.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(F.id,F),p.push({track:F,region:c,overlap:0})}for(const{track:u,region:c}of p){const b=l.indexOf(c),P=[...f[b]].filter(([z,G])=>{const _=this.tracks.get(z);if(!_||re(_.kind)!==c.sign>0)return!1;const E=_.genome.syllables.length*2+1;return G/c.area>=.5/E}).map(([z,G])=>({track:this.tracks.get(z),weight:G})).sort((z,G)=>G.weight-z.weight||+(G.track===u)-+(z.track===u)||z.track.id-G.track.id);if(P.length>1){const G=P.every(_=>_.track.lineage===P[0].track.lineage)?[...P].sort((_,E)=>_.track.id-E.track.id)[0].track.genome:mi(P.map(({track:_,weight:E})=>({genome:_.genome,weight:E})),nt(c.area,e.signs.length));T(G)!==u.stem&&(u.pendingGenome=G),u.lastNameChange=s,u.nameStreak=0,u.nameAnchor=null}else B.has(u.id)&&(u.lastNameChange=s,u.nameStreak=0,u.nameAnchor=null)}const I=new Uint16Array(e.signs.length);for(const{track:u,region:c,overlap:b}of p){if(u.present=!0,b>0){const P=b/Math.min(u.area,c.area);u.agreement=Math.min(u.agreement,.65+.35*P)}u.area=c.area,u.center=c.center,u.bounds=c.bounds,u.missing=0,u.confirmed=!0;for(const P of c.cells)I[P]=u.id}this.owners=I;for(const u of[...this.tracks.values()])p.some(c=>c.track===u)||(u.missing+=i,u.confirmed=!1,u.missing>se&&(this.tracks.delete(u.id),this.usedStems.delete(u.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}const U=new Map([...this.tracks].map(([u,c])=>[u,c.genome]));for(const{track:u,region:c}of p){const b=this.allowedMask(c),P=r>0?this.coldDonor(u,r):null;this.evolveName(u,c,b,s,i,n,r,P?U.get(P.id)??null:null),u.lastMask=b,this.remember(b),this.smooth(u,b,i),this.aim(u,b,i)}this.synced=!0}nameSeed(e,t){return Math.floor(e.center.x*8191+e.center.y*16381+e.area*17+t*131)}maskDistance(e,t){let s=0,i=0;for(let n=0;n<t.length;n+=1)s+=e[n]|t[n],i+=e[n]&t[n];return s>0?1-i/s:0}rename(e,t,s,i,n=e.suffix){const r=T(t);if(r===e.stem&&n===e.suffix||r!==e.stem&&this.usedStems.has(r))return!1;const o=`${r.charAt(0).toUpperCase()}${r.slice(1)}${n}`,l=e.placement;return l?.alive&&!this.fitsPose(l.mask,o,this.snapshot(l))?!1:(this.usedStems.delete(e.stem),this.usedStems.add(r),e.genome=t,e.reserveGenome=t,e.stem=r,e.suffix=n,e.text=o,e.lastNameChange=i,e.nameAnchor=s.slice(),e.nameStreak=0,!0)}coldDonor(e,t){const s=Math.sqrt(e.area/Math.PI);let i=null,n=1/0;for(const r of this.tracks.values()){if(r.id===e.id||!r.present||!r.confirmed||re(r.kind)!==re(e.kind)||r.area<e.area||r.area===e.area&&r.id>e.id)continue;const l=Math.hypot((r.center.x-e.center.x)*this.width,(r.center.y-e.center.y)*this.height)/(s+Math.sqrt(r.area/Math.PI));l>1+2*t||l>=n||(i=r,n=l)}return i}evolveName(e,t,s,i,n,r,o,l){(!e.nameAnchor||e.nameAnchor.length!==s.length)&&(e.nameAnchor=s.slice());const h=st(e.area,s.length),f=nt(e.area,s.length),x=f===3?null:f;e.pendingGenome&&e.pendingGenome.syllables.length>f&&(e.pendingGenome=null);const d=e.placement?.alive?this.snapshot(e.placement):null,y=d!==null&&!this.fitsPose(s,e.text,d);if(x&&(e.genome.syllables.length>x||e.suffix!=="")&&(i-e.lastNameChange>=se||y)){const g=e.genome,M=e.reserveGenome,B=Rt(e.genome,x,this.nameSeed(t,e.lineage),this.usedStems);if(this.rename(e,B,s,i,"")){e.reserveGenome=M.syllables.length>=g.syllables.length?M:g,e.pendingGenome=null;return}}if(e.heatDose=r>0?Math.min(Le,e.heatDose+r*n*h):0,e.coldDose=o>0?Math.min(Le,e.coldDose+o*n*h):0,e.pendingGenome){if(i-e.lastNameChange<se/Math.min(1,h))return;const g=e.pendingGenome,M=bi(e.genome,g,this.usedStems);if(M){const B=e.reserveGenome;this.rename(e,M,s,i,M.syllables.length===3?e.suffix||Ne(e.kind,T(M)).slice(T(M).length):"")&&(B.syllables.length>M.syllables.length&&T(B).startsWith(T(M))&&(e.reserveGenome=B),T(e.genome)===T(g)&&(e.pendingGenome=null))}else{const B=[...this.tracks.values()].find(I=>I.id!==e.id&&I.stem===T(g));(!B||B.present)&&(e.pendingGenome=null)}return}if(e.genome.syllables.length<f&&i-e.lastNameChange>=se){const g=e.reserveGenome,M=Yt(e.genome,this.nameSeed(t,e.lineage)+e.mutationSerial*31,this.usedStems,g);if(M){const B=T(M),I=M.syllables.length===3?Ne(e.kind,B).slice(B.length):"";if(this.rename(e,M,s,i,I)){g.syllables.length>M.syllables.length&&T(g).startsWith(T(M))&&(e.reserveGenome=g),e.mutationSerial+=1;return}e.pendingGenome=M;return}}if(o>0&&!e.heatPulseReady){if(e.nameAnchor=s.slice(),e.nameStreak=0,e.coldDose<Le||i-e.lastNameChange<se||!l)return;const g=yi(e.genome,l,this.nameSeed(t,e.lineage)+e.mutationSerial*31,this.usedStems);e.coldDose=0,g&&this.rename(e,g,s,i)&&(e.mutationSerial+=1);return}if(this.maskDistance(e.nameAnchor,s)>vi?e.nameStreak+=h:e.nameStreak=0,e.nameStreak<wi&&e.heatDose<Le&&!e.heatPulseReady||i-e.lastNameChange<se)return;const p=Ct(Math.random,qt(e.heatPulseReady?.55:.28+.35*r,h),e.heatPulseReady?2:1),v=this.nameSeed(t,e.lineage)+e.mutationSerial*31;for(let g=0;g<e.genome.syllables.length*2+1;g+=1){const M=mt(e.genome,v+g,this.usedStems,p);if(this.rename(e,M,s,i)){e.mutationSerial+=1,e.heatDose=0,e.heatHoldSeconds=0,e.heatPulseReady=!1;break}}}aim(e,t,s){const i=this.viewport.width*this.viewport.height/t.length,n=Q(Math.sqrt(e.area*i/(Math.max(4,e.text.length)*3.2)),q,ee);e.styleFont=e.styleFont===0?n:Pe(e.styleFont,n,s,2.5);const r=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),o=e.placement?.alive?e.placement:null,l=o?.angle??0,h=e.pendingGenome?T(e.pendingGenome):null,f=h&&e.pendingGenome?`${h.charAt(0).toUpperCase()}${h.slice(1)}${e.pendingGenome.syllables.length===3?e.suffix||Ne(e.kind,h).slice(h.length):""}`:null,x=f&&this.boxWidth(f,q,ne(q))>this.boxWidth(e.text,q,ne(q))?f:e.text,d=(G,_)=>Math.max(.01,r.quality[G]+.12*_.font/e.styleFont-zi*Math.abs(_.angle)/te-Ai*r.elongation[G]*Se(_.angle,r.axis[G])/te),y=G=>{const _=[];for(const E of r.candidates){const N=this.cellPoint(E);if(_.some(O=>this.distance(O.pose,N)<r.radius*.55))continue;const R=this.poseAt(G,t,N,e.styleFont,l,r.axis[E],r.elongation[E]);if(R&&(_.push({pose:R,quality:d(E,R)}),_.length>=24))break}if(o){const E=this.index(o.position);if(E>=0&&r.centerX[E]>0){const N={x:r.centerX[E],y:r.centerY[E]},R=this.index(N),O=R<0?null:this.poseAt(G,t,N,e.styleFont,l,r.axis[R],r.elongation[R]);O&&R>=0&&_.push({pose:O,quality:d(R,O)})}}return _};let p=y(x);if(p.length===0&&x!==e.text&&(p=y(e.text)),p.length===0){o&&this.release(e);return}p.sort((G,_)=>_.quality-G.quality);const v=p[0];if(!o){e.placement=this.spawn(v.pose,t);return}const g=p.filter(G=>this.distance(G.pose,o.position)<=r.radius*1.5).sort((G,_)=>_.quality-this.distance(_.pose,o.position)/(r.radius*16)-(G.quality-this.distance(G.pose,o.position)/(r.radius*16)))[0],M=this.index(o.position),B=g?.quality??(M>=0?r.quality[M]:0),I=v.quality>B*Oi,U=g&&v.quality<=g.quality*1.08?g:v,u=this.snapshot(o),c=this.distance(u,U.pose)<=r.radius*1.5;let b=t,P=!1;if(!this.fitsPose(t,e.text,u)&&(b=this.union(o.regionMask,t),this.remember(b),!this.fitsPose(b,e.text,u)&&c&&o.mask!==o.regionMask&&(b=this.union(o.mask,t),this.remember(b),P=!0),!this.fitsPose(b,e.text,u))){this.relight(e,U.pose,t);return}let z=this.planRoute(e.text,b,u,U.pose);if(!z&&b!==t&&c&&!P&&o.mask!==o.regionMask){const G=this.union(o.mask,t);if(this.remember(G),this.fitsPose(G,e.text,u)){const _=this.planRoute(e.text,G,u,U.pose);_&&(b=G,z=_)}}if(!z){(b!==t||I&&this.distance(u,U.pose)>r.radius*1.5)&&this.relight(e,U.pose,t);return}o.mask=b,o.regionMask=t,o.target=U.pose,o.route=z}poseAt(e,t,s,i,n,r,o){const l=this.index(s);if(l<0||!t[l])return null;let h=null,f=-1/0;const x=this.maxFont(t,e,s,0);if(x>=q){const d=Math.min(i,Math.max(q,x*.9));h={x:s.x,y:s.y,font:d,angle:0},f=d/i-Vt*o*Se(0,r)/te-.02*Se(0,n)/te}for(let d=Ft;d<=te;d+=Ft){const y=Math.min(i,ee*.9)/i-Dt*d/te;if(f>=y)break;for(const p of[-d,d]){const v=this.maxFont(t,e,s,p);if(v<q)continue;const g=Math.min(i,Math.max(q,v*.9)),M=g/i-Dt*d/te-Vt*o*Se(p,r)/te-.02*Se(p,n)/te;M>f&&(h={x:s.x,y:s.y,font:g,angle:p},f=M)}}return h}landscape(e,t,s,i,n){const r=this.width+1,o=r*(this.height+1),l=new Float64Array(o),h=new Float64Array(o),f=new Float64Array(o),x=new Float64Array(o),d=new Float64Array(o),y=new Float64Array(o),p=new Float32Array(e.length),v=new Float32Array(e.length),g=new Float32Array(e.length),M=new Float32Array(e.length),B=new Float32Array(e.length),I=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),U=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(i*3.5,Math.sqrt(n*I*I)*.33,I*3)),u=Math.max(1,Math.ceil(U*this.width/this.viewport.width)),c=Math.max(1,Math.ceil(U*this.height/this.viewport.height));for(let _=0;_<this.height;_+=1){let E=0,N=0,R=0,O=0,K=0,Y=0;for(let F=0;F<this.width;F+=1){const D=F+_*this.width,H=e[D]*(.85+.15*s[D])*Q(t[D]*I/(i*2),0,1),W=this.cellPoint(D);E+=H,N+=H*W.x,R+=H*W.y,O+=H*W.x*W.x,K+=H*W.y*W.y,Y+=H*W.x*W.y;const $=(_+1)*r+F+1;l[$]=l[$-r]+E,h[$]=h[$-r]+N,f[$]=f[$-r]+R,x[$]=x[$-r]+O,d[$]=d[$-r]+K,y[$]=y[$-r]+Y}}const b=(_,E,N,R,O)=>_[O*r+R]-_[N*r+R]-_[O*r+E]+_[N*r+E],P=l[o-1],z=P>0?{x:h[o-1]/P,y:f[o-1]/P}:{x:this.viewport.width/2,y:this.viewport.height/2},G=[];for(let _=0;_<e.length;_+=1){if(!e[_])continue;const E=_%this.width,N=Math.floor(_/this.width),R=Math.max(0,E-u),O=Math.max(0,N-c),K=Math.min(this.width,E+u+1),Y=Math.min(this.height,N+c+1),F=b(l,R,O,K,Y);if(F<=0)continue;v[_]=b(h,R,O,K,Y)/F,g[_]=b(f,R,O,K,Y)/F;const D=Math.max(0,b(x,R,O,K,Y)/F-v[_]**2),H=Math.max(0,b(d,R,O,K,Y)/F-g[_]**2),W=b(y,R,O,K,Y)/F-v[_]*g[_],$=Math.hypot(D-H,2*W);M[_]=.5*Math.atan2(2*W,D-H)*180/Math.PI,B[_]=Q($/(D+H+1),0,1);const he=F/((u*2+1)*(c*2+1)),me=Q(t[_]*I/(i*2),0,1);p[_]=.7*he+.3*me-.08*this.distance(this.cellPoint(_),z)/U,G.push(_)}return G.sort((_,E)=>p[E]-p[_]),{quality:p,centerX:v,centerY:g,axis:M,elongation:B,candidates:G,radius:U}}union(e,t){const s=new Uint8Array(t.length);for(let i=0;i<s.length;i+=1)s[i]=e[i]|t[i];return s}planRoute(e,t,s,i){if(this.posesFit(t,e,s,i))return[i];let n=Math.min(s.font,i.font);for(let r=0;r<9;r+=1){n=Math.max(q,n);for(const o of[...new Set([s.angle,i.angle,0])]){const l={...s,font:n},h={...l,angle:o},f={...i,font:n,angle:o},x={...i,font:n};if(!this.posesFit(t,e,s,l)||!this.posesFit(t,e,l,h)||!this.posesFit(t,e,f,x)||!this.posesFit(t,e,x,i))continue;const d=[];if(Math.abs(s.font-n)>.05&&d.push(l),Math.abs(s.angle-o)>.05&&d.push(h),this.posesFit(t,e,h,f))return d.push(f),Math.abs(i.angle-o)>.05&&d.push(x),d.push(i),d;const y=this.legalPath(e,t,h,f);if(!y)continue;let p=h,v=!0;for(let g=0;g<y.length;){let M=-1;for(let I=y.length-1;I>=g;I-=1){const u={...this.cellPoint(y[I]),font:n,angle:o};if(this.posesFit(t,e,p,u)){M=I;break}}if(M<0){v=!1;break}const B={...this.cellPoint(y[M]),font:n,angle:o};this.distance(p,B)>.5&&d.push(B),p=B,g=M+1}if(!(!v||!this.posesFit(t,e,p,f)))return this.distance(p,f)>.5&&d.push(f),Math.abs(i.angle-o)>.05&&d.push(x),d.push(i),d}if(n<=q)break;n=Math.max(q,n*.82)}return null}legalPath(e,t,s,i){const n=new Uint8Array(t.length),r=v=>{if(n[v]===0){const g={...this.cellPoint(v),font:s.font,angle:s.angle};n[v]=t[v]&&this.fitsPose(t,e,g)?1:2}return n[v]===1},o=v=>{const g=this.index(v);if(g<0)return-1;const M=g%this.width,B=Math.floor(g/this.width);for(let I=0;I<=3;I+=1)for(let U=-I;U<=I;U+=1)for(let u=-I;u<=I;u+=1){const c=M+u,b=B+U;if(c<0||b<0||c>=this.width||b>=this.height)continue;const P=c+b*this.width;if(r(P)&&this.posesFit(t,e,v,{...this.cellPoint(P),font:s.font,angle:s.angle}))return P}return-1},l=o(s),h=o(i);if(l<0||h<0)return null;const f=new Int32Array(t.length).fill(-1),x=new Int32Array(t.length);let d=0,y=0;for(x[y++]=l,f[l]=l;d<y&&f[h]<0;){const v=x[d++],g=v%this.width,M=Math.floor(v/this.width);for(const B of[g>0?v-1:-1,g+1<this.width?v+1:-1,M>0?v-this.width:-1,M+1<this.height?v+this.width:-1])B<0||f[B]>=0||!r(B)||(f[B]=v,x[y++]=B)}if(f[h]<0)return null;const p=[];for(let v=h;v!==l;v=f[v])p.push(v);return p.push(l),p.reverse(),p}glide(e,t,s){if(s<=0)return;const i=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,i)){const b=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,b<q){t.fontVelocity=0;return}const P=Vi(t.font,t.fontVelocity,Math.min(t.target.font,b),s);t.font=Math.max(b,Math.min(t.font,P.value)),t.fontVelocity=t.font<=b?0:P.velocity;return}for(;t.route.length>1&&this.distance(i,t.route[0])<.75&&Math.abs(i.font-t.route[0].font)<.15&&Math.abs(i.angle-t.route[0].angle)<.3;)t.route.shift();const n=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,i,n)&&this.distance(i,n)<.2&&Math.abs(i.font-n.font)<.05&&Math.abs(i.angle-n.angle)<.05){t.position={x:n.x,y:n.y},t.font=n.font,t.angle=n.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const o=!this.fitsPose(t.regionMask,e.text,i)?1:Ui,l=Ci/o,h=Ni/o,f=Li/o,x=this.distance(i,n),d=x/l,y=Math.abs(n.font-i.font)/h,p=Math.abs(n.angle-i.angle)/f,v=Math.max(d,y,p);let g=0;v===d&&x>0?g=((n.x-i.x)*t.velocity.x+(n.y-i.y)*t.velocity.y)/x/l:v===y&&y>0?g=Math.sign(n.font-i.font)*t.fontVelocity/h:p>0&&(g=Math.sign(n.angle-i.angle)*t.angleVelocity/f),g=Q(g,-1,1);const M=2/(Ti*o),B=Q(M*M*v-2*M*g,-kt,kt),I=Q(g+B*s,-1,1),U=Math.min(v,(g+I)*s/2);let u=this.lerpPose(i,n,v>0?U/v:1);if(!(U<0?this.posesFit(t.mask,e.text,i,u):this.fitsPose(t.mask,e.text,u))){const b=this.longestLegal(e.text,t.mask,i,u);if(!b){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}u=b}const c=s>0?1/s:0;t.position={x:u.x,y:u.y},t.velocity={x:(u.x-i.x)*c,y:(u.y-i.y)*c},t.font=u.font,t.fontVelocity=(u.font-i.font)*c,t.angle=u.angle,t.angleVelocity=(u.angle-i.angle)*c}collect(e){const t=[];for(const n of this.tracks.values()){const r=n.placement?[n.placement,...n.ghosts]:n.ghosts;for(const o of r)o.opacity<.015||this.fitsPose(o.mask,n.text,this.snapshot(o))&&t.push({track:n,placement:o})}t.sort((n,r)=>r.track.area-n.track.area);const s=[],i=[];for(const n of t){const{track:r,placement:o}=n,l=s.some(f=>f.track!==r&&this.overlaps(r.text,this.snapshot(o),f.track.text,this.snapshot(f.placement)));o.collisionOpacity=Pe(o.collisionOpacity,l?0:1,e,l?.3:.7),l||s.push(n);const h=o.opacity*o.collisionOpacity;h<.015||i.push({id:o.id,kind:r.kind,text:r.text,x:o.position.x,y:o.position.y,width:this.boxWidth(r.text,o.font,ne(o.font)),height:o.font*it,opacity:h,fontSize:o.font,letterSpacing:ne(o.font),angle:o.angle})}return i}relight(e,t,s){const i=e.placement;if(i){const n=this.snapshot(i);if(this.fitsPose(i.mask,e.text,n)&&this.overlaps(e.text,n,e.text,t)){i.target=n,i.route=[],i.velocity={x:0,y:0},i.fontVelocity=0,i.angleVelocity=0,i.regionMask=s;return}i.alive=!1,e.ghosts.push(i)}e.placement=this.spawn(t,s)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,s){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const i=1-Math.exp(-s/Ri),n=e.soft;for(let r=0;r<t.length;r+=1)n[r]+=(t[r]-n[r])*i}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const s of e.cells)t[s]=1;return t}components(e){const t=new Uint8Array(e.length),s=new Int32Array(e.length),i=[];for(let n=0;n<e.length;n+=1){if(t[n])continue;const r=i.length,o=e[n]<0?-1:1,l=[];let h=0,f=0,x=this.width,d=this.height,y=0,p=0;const v=[n];for(t[n]=1;v.length;){const I=v.pop();l.push(I),s[I]=r;const U=I%this.width,u=Math.floor(I/this.width);h+=U+.5,f+=u+.5,x=Math.min(x,U),d=Math.min(d,u),y=Math.max(y,U+1),p=Math.max(p,u+1);for(const c of this.neighbors(I))t[c]||(e[c]<0?-1:1)!==o||(t[c]=1,v.push(c))}const g=l.length/e.length;let M=null,B="hole";o>0?g>=Wt?(M="continent",B="place"):g>=Mi&&(M="island",B="place"):y-x>this.width*Ot&&p-d>this.height*Ot||x===0||d===0||y===this.width||p===this.height?B="sea":g>=_i&&(M="lake",B="place"),i.push({sign:o,area:l.length,cells:l,kind:M,role:B,center:{x:h/l.length/this.width,y:f/l.length/this.height},bounds:{x0:x/this.width,y0:d/this.height,x1:y/this.width,y1:p/this.height}})}for(const n of i){if(n.kind!=="lake")continue;const r=new Map;let o=0;for(const l of n.cells)for(const h of this.neighbors(l)){const f=s[h];i[f].sign<0||(r.set(f,(r.get(f)??0)+1),o+=1)}(o===0||Math.max(...r.values())*5<o*4)&&(n.kind=null,n.role="sea")}return i}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),s=new Int32Array(e.length);let i=0;for(let n=0;n<e.length;n+=1){const r=n%this.width,o=Math.floor(n/this.width);(!e[n]||r===0||o===0||r===this.width-1||o===this.height-1)&&(t[n]=0,s[i++]=n)}for(let n=0;n<i;n+=1){const r=s[n],o=r%this.width,l=Math.floor(r/this.width);for(const h of[o>0?r-1:-1,o+1<this.width?r+1:-1,l>0?r-this.width:-1,l+1<this.height?r+this.width:-1])h<0||t[h]>=0||(t[h]=t[r]+1,s[i++]=h)}return t}prefix(e){const t=this.width+1,s=new Int32Array(t*(this.height+1));for(let i=0;i<this.height;i+=1){let n=0;for(let r=0;r<this.width;r+=1)n+=e[r+i*this.width],s[(i+1)*t+r+1]=s[i*t+r+1]+n}return s}maxFont(e,t,s,i){if(!this.fits(e,t,s,q,ne(q),i))return 0;if(this.fits(e,t,s,ee,ne(ee),i))return ee;let n=q,r=ee;for(let o=0;o<8;o+=1){const l=(n+r)/2;this.fits(e,t,s,l,ne(l),i)?n=l:r=l}return n}fitsPose(e,t,s){return Math.abs(s.angle)<=te&&this.fits(e,t,s,s.font,ne(s.font),s.angle)}posesFit(e,t,s,i){if(!this.fitsPose(e,t,s)||!this.fitsPose(e,t,i))return!1;const n=Math.max(1,Math.ceil(Math.max(this.distance(s,i)/4,Math.abs(s.font-i.font),Math.abs(s.angle-i.angle)/2)));for(let r=1;r<n;r+=1)if(!this.fitsPose(e,t,this.lerpPose(s,i,r/n)))return!1;return!0}longestLegal(e,t,s,i){if(!this.fitsPose(t,e,s))return null;let n=0,r=1;for(let o=0;o<8;o+=1){const l=(n+r)/2;this.posesFit(t,e,s,this.lerpPose(s,i,l))?n=l:r=l}return n<=0?null:this.lerpPose(s,i,n)}fits(e,t,s,i,n,r){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const o=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),l=Math.max(Ii,o*1.25),h=this.boxWidth(t,i,n)/2+l,f=i*it/2+l,x=r*Math.PI/180,d=Math.cos(x),y=Math.sin(x),p=Math.abs(h*d)+Math.abs(f*y),v=Math.abs(h*y)+Math.abs(f*d);if(s.x-p<0||s.y-v<0||s.x+p>this.viewport.width||s.y+v>this.viewport.height)return!1;const g=this.prefixFields.get(e);if(g){const c=Math.floor((s.x-p)*this.width/this.viewport.width),b=Math.floor((s.y-v)*this.height/this.viewport.height),P=Math.min(this.width,Math.ceil((s.x+p)*this.width/this.viewport.width)),z=Math.min(this.height,Math.ceil((s.y+v)*this.height/this.viewport.height)),G=this.width+1;if(g[z*G+P]-g[b*G+P]-g[z*G+c]+g[b*G+c]===(P-c)*(z-b))return!0}const M=this.distanceFields.get(e),B=this.index(s);if(M&&B>=0){const c=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(M[B]-2)*c/Math.SQRT2)>=Math.hypot(h,f))return!0}const I=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),U=Math.max(2,Math.ceil(h*2/I)),u=Math.max(2,Math.ceil(f*2/I));for(let c=0;c<=u;c+=1){const b=-f+c*f*2/u;for(let P=0;P<=U;P+=1){const z=-h+P*h*2/U,G=Math.floor((s.x+z*d-b*y)*this.width/this.viewport.width),_=Math.floor((s.y+z*y+b*d)*this.height/this.viewport.height);if(G<0||_<0||G>=this.width||_>=this.height||!e[G+_*this.width])return!1}}return!0}overlaps(e,t,s,i){const n=(l,h)=>{const f=h.angle*Math.PI/180,x=this.boxWidth(l,h.font,ne(h.font))/2+7,d=h.font*it/2+7;return{x:Math.abs(x*Math.cos(f))+Math.abs(d*Math.sin(f)),y:Math.abs(x*Math.sin(f))+Math.abs(d*Math.cos(f))}},r=n(e,t),o=n(s,i);return Math.abs(t.x-i.x)<r.x+o.x&&Math.abs(t.y-i.y)<r.y+o.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const s=e.width/t.width,i=e.height/t.height,n=(s+i)/2;for(const r of this.tracks.values()){r.styleFont=Q(r.styleFont*n,q,ee);const o=r.placement?[r.placement,...r.ghosts]:r.ghosts;for(const l of o)this.scalePlacement(l,s,i,n)}}this.viewport=e}scalePlacement(e,t,s,i){e.position={x:e.position.x*t,y:e.position.y*s},e.velocity={x:e.velocity.x*t,y:e.velocity.y*s},e.font=Q(e.font*i,q,ee),e.fontVelocity*=i,e.target={x:e.target.x*t,y:e.target.y*s,font:Q(e.target.font*i,q,ee),angle:e.target.angle},e.route=e.route.map(n=>({x:n.x*t,y:n.y*s,font:Q(n.font*i,q,ee),angle:n.angle}))}regrid(e,t,s,i,n){const r=new e.constructor(i*n);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<n;o+=1)for(let l=0;l<i;l+=1)r[l+o*i]=e[Math.min(t-1,Math.floor((l+.5)*t/i))+Math.min(s-1,Math.floor((o+.5)*s/n))*t];return r}regridFloat(e,t,s,i,n){const r=new Float32Array(i*n);if(e.length!==t*s||t<1||s<1)return r;for(let o=0;o<n;o+=1)for(let l=0;l<i;l+=1)r[l+o*i]=e[Math.min(t-1,Math.floor((l+.5)*t/i))+Math.min(s-1,Math.floor((o+.5)*s/n))*t];return r}neighbors(e){const t=e%this.width,s=Math.floor(e/this.width);return[(t+1)%this.width+s*this.width,(t-1+this.width)%this.width+s*this.width,t+(s+1)%this.height*this.width,t+(s-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,s){return{x:Oe(e.x,t.x,s),y:Oe(e.y,t.y,s),font:Oe(e.font,t.font,s),angle:Oe(e.angle,t.angle,s)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),s=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&s>=0&&s<this.height?t+s*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,s){const i=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(i?.58:.56)+s)+4;const n=i?`i:${e}`:e;let r=this.textMetrics.get(n);return r===void 0&&(this.measure.font=`${i?"italic ":""}500 100px ${Fi}`,this.measure.fontKerning="none",r=this.measure.measureText(e).width/100,this.textMetrics.set(n,r)),r*t+e.length*s+4}}const rt=2.4,Hi=12,$i=(a,e,t,s,i,n)=>{if(s<=0)return a;const r=Math.max(0,t),o=r+s,h=(n-i)/Hi*(s-rt*(Math.exp(-r/rt)-Math.exp(-o/rt)));return Math.max(i,Math.min(n,a+e*h))},Xi=(a,e,t,s)=>({freeze:e>t?Math.max(0,Math.min(1,(e-a)/(e-t))):0,heat:e<s?Math.max(0,Math.min(1,(a-e)/(s-e))):0}),Ht=2/Math.log(1+Math.sqrt(2)),Yi=30,ot=40,Wi=45,C=a=>{const e=document.getElementById(a);if(!e)throw new Error(`Missing #${a}`);return e},j=C("field"),de=C("scale"),fe=C("temperature"),at=C("time-speed"),Fe=C("brush-size"),Ki=C("scale-value"),ji=C("temperature-value"),Qi=C("time-speed-value"),Ji=C("brush-size-value"),Zi=C("explanation"),Ge=C("settings-toggle"),De=C("settings-panel"),Ve=C("pause"),en=C("restart"),tn=C("clear-blue"),lt=C("rough"),ut=C("smooth"),ht=C("scale-dock"),nn=C("scale-readout"),ke=C("freeze"),qe=C("heat"),ct=C("phase"),dt=C("magnetization"),ft=C("energy"),Xe=C("fatal-error"),sn=C("place-labels"),rn=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function on(){const a=await ti();if(!a){Xe.hidden=!1,Xe.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=new si(a.device,a.format,j);let t=Number(fe.value),s=t,i=Number(de.value),n=i,r=Number(at.value),o=Number(Fe.value),l=!1,h=!0,f=!1,x=!1,d=!1,y=0,p=0,v=null,g=!0,M=0,B=performance.now(),I=0,U=!1,u=0;const c=new Map;let b=!1,P=0,z=i,G=!1,_=!1,E=0,N=0,R=!1,O=0;const K=new qi,Y=new Map,F=new Map,D=new Map,H=new Map;let W=null,$=0;const he=new Map,me=new Set,Ye=new Set,We=new Set,Ke=new Set,vt=Ht+.2,ze=Number(de.min),ae=Number(de.max),wt=Number(fe.min),_t=Number(fe.max),Kt=.75;let be=0,je=0;const jt=(ae-ze)/2.2,Mt=Math.ceil((ot-1)/2),Qt=()=>{const m=Math.max(1,window.innerWidth),w=Math.max(1,window.innerHeight),A=m<=720?Math.min(window.devicePixelRatio||1,2):1,V=Math.min(a.device.limits.maxTextureDimension2D/m,a.device.limits.maxTextureDimension2D/w),S=Math.sqrt(Number(a.device.limits.maxStorageBufferBindingSize)/4/(m*w)),J=Math.max(.25,Math.min(A,V,S)),ie=Math.max(1,Math.round(m*J)),ce=Math.max(1,Math.round(w*J));return{density:ie/m,width:ie,height:ce}},Qe=m=>{const w=Math.min(e.width,e.height)/65.64;return Math.max(0,Math.round((2**m-1)*w))},Ae=()=>Qe(i)*2+1,Jt=()=>{const m=Math.min(e.width,e.height)/65.64;if(m<=0)return ae;let w=Math.log2(1+Math.max(0,(Mt-.5)/m));for(w=Math.min(ae,Math.max(ze,w));w<ae&&Qe(w)<Mt;)w=Math.min(ae,w+.01);return w},ye=()=>{const m=Ae(),w=m===1?"1 spin":`${m} × ${m}`;de.value=i.toFixed(2),ht.value=i.toFixed(2),Ki.textContent=w,nn.textContent=w,Zi.textContent=rn[Math.min(3,Math.floor(i+.25))],lt.setAttribute("aria-label",`Rough, observation scale ${i.toFixed(2)}`),ut.setAttribute("aria-label",`Smooth, observation scale ${i.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-i/3)**2).toFixed(3))},xe=()=>{fe.value=t.toFixed(2),ji.textContent=`T = ${t.toFixed(2)}`;const m=Xi(t,s,wt,_t);ke.style.setProperty("--paddle-progress",m.freeze.toFixed(4)),qe.style.setProperty("--paddle-progress",m.heat.toFixed(4)),ke.setAttribute("aria-label",`Freeze, current temperature ${t.toFixed(2)}`),qe.setAttribute("aria-label",`Heat, current temperature ${t.toFixed(2)}`);const w=t-Ht;w<-.2?ct.textContent="ordered":w>.2?ct.textContent="disordered":ct.textContent="critical"},Pt=()=>{const m=Number.isInteger(r)?0:1;Qi.textContent=`${r.toFixed(m)}×`},Je=()=>{Fe.value=String(o),Ji.textContent=`${o} px`},Zt=()=>({active:d&&!b&&!_,painting:f,forceHot:x,x:y,y:p,radius:o/2}),ve=()=>{const m=Ae(),w=(m-1)/2,A=m===1?0:.14*(1-i/3)**2;e.draw(i,w,A,E,Zt()),g=!1},St=()=>{N+=1,K.reset(),W=null,F.clear(),D.clear(),H.clear(),he.clear(),Gt([],0)},Gt=(m,w)=>{const A=new Set,V={width:j.clientWidth,height:j.clientHeight};for(const S of m){if(A.add(S.id),W&&he.get(S.id)!==$){const L=li(S,W,V);F.set(S.id,ui(F.get(S.id),L)),he.set(S.id,$)}const J=ci(D.get(S.id),F.get(S.id)?.mode??"dark",w);D.set(S.id,J);const ie=di(J),ce=ai(S.kind,J.from,J.to,ie.blend),_e=hi(H.get(S.id),F.get(S.id)?.opacity??1,w);H.set(S.id,_e);const le=ki(S);let Z=Y.get(S.id);for(Z||(Z=[],Y.set(S.id,Z));Z.length<le.length;){const L=document.createElement("span");L.className="place-label",sn.append(L),Z.push(L)}for(;Z.length>le.length;)Z.pop()?.remove();for(let L=0;L<le.length;L+=1){const X=Z[L],Et=le[L];X.dataset.kind!==S.kind&&(X.dataset.kind=S.kind),X.textContent!==S.text&&(X.textContent=S.text),X.style.color=ce,X.style.opacity=(S.opacity*_e).toFixed(3),X.style.fontSize=`${S.fontSize.toFixed(2)}px`,X.style.letterSpacing=`${S.letterSpacing.toFixed(2)}px`,X.style.transform=`translate(${Et.x.toFixed(2)}px, ${Et.y.toFixed(2)}px) rotate(${S.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[S,J]of Y)if(!A.has(S)){for(const ie of J)ie.remove();Y.delete(S),F.delete(S),D.delete(S),H.delete(S),he.delete(S)}},Bt=(m=!0)=>{const w=Qt();if(e.resize(w.width,w.height,w.density,m),!m){const A=Math.min(e.width,e.height)/65.64,V=(Wi-1)/2;i=Math.max(ze,Math.min(ae,Math.log2(1+V/A))),n=i}ye(),g=!0,ve(),u+=1,N+=1,W=null},Ee=m=>{const w=j.getBoundingClientRect(),A=(m.clientX-w.left)/w.width,V=(m.clientY-w.top)/w.height;return A<0||A>=1||V<0||V>=1?null:(y=m.clientX-w.left,p=m.clientY-w.top,{x:A*e.width,y:V*e.height})},Te=(m,w)=>{const A=Ee(m);if(!A){v=null;return}const V=v??A;e.paintSegment(V.x,V.y,A.x,A.y,o*e.density/2,w,x),v=A,g=!0},Ze=m=>{f=!0,v=null,Te(m,!0),x=!1},It=()=>{const m=[...c.values()];return m.length<2?0:Math.hypot(m[1].x-m[0].x,m[1].y-m[0].y)},we=()=>{if(U)return;U=!0;const m=u;e.readStats().then(w=>{if(m!==u)return;dt.textContent=w.magnetization.toFixed(3),ft.textContent=w.energy.toFixed(3);const A=w.signedMagnetization===-1;!f&&x!==A&&(x=A,g=!0)}).catch(w=>{console.warn("Could not read Ising statistics.",w)}).finally(()=>{U=!1})},zt=m=>{i=m,n=i,ye(),g=!0};de.addEventListener("input",()=>zt(Number(de.value))),ht.addEventListener("input",()=>zt(Number(ht.value))),fe.addEventListener("input",()=>{s=Number(fe.value),t=s,be=0,xe()});const Ue=(m,w)=>{const A=()=>{m.setAttribute("aria-pressed",String(w.size>0))},V=S=>{w.delete(`pointer:${S.pointerId}`),m.hasPointerCapture(S.pointerId)&&m.releasePointerCapture(S.pointerId),A()};m.addEventListener("pointerdown",S=>{S.pointerType==="mouse"&&S.button!==0||(S.preventDefault(),m.setPointerCapture(S.pointerId),w.add(`pointer:${S.pointerId}`),A())}),m.addEventListener("pointerup",V),m.addEventListener("pointercancel",V),m.addEventListener("lostpointercapture",S=>{w.delete(`pointer:${S.pointerId}`),A()}),m.addEventListener("keydown",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),w.add(`key:${S.code}`),A())}),m.addEventListener("keyup",S=>{S.code!=="Space"&&S.code!=="Enter"||(S.preventDefault(),w.delete(`key:${S.code}`),A())}),m.addEventListener("blur",()=>{for(const S of w)S.startsWith("key:")&&w.delete(S);A()})};Ue(lt,me),Ue(ut,Ye),Ue(ke,We),Ue(qe,Ke),at.addEventListener("input",()=>{r=Number(at.value),Pt()}),Fe.addEventListener("input",()=>{o=Number(Fe.value),Je(),g=!0}),window.addEventListener("keydown",m=>{m.code!=="BracketLeft"&&m.code!=="BracketRight"||(m.preventDefault(),o=Math.max(4,Math.min(100,o+(m.code==="BracketLeft"?-4:4))),Je(),g=!0)});const et=m=>{h=m,De.classList.toggle("is-closed",!h),De.setAttribute("aria-hidden",String(!h)),Ge.setAttribute("aria-expanded",String(h)),Ge.setAttribute("aria-label",h?"Close settings":"Open settings")};Ge.addEventListener("click",()=>et(!h)),document.addEventListener("pointerdown",m=>{const w=m.target;!h||!(w instanceof Node)||De.contains(w)||Ge.contains(w)||et(!1)},{capture:!0}),document.addEventListener("click",m=>{const w=m.target;!h||!(w instanceof Node)||Ge.contains(w)||(!De.contains(w)||w instanceof Element&&w.closest("button"))&&et(!1)}),Ve.addEventListener("click",()=>{l=!l;const m=l?"Resume simulation":"Pause simulation";Ve.setAttribute("aria-pressed",String(l)),Ve.setAttribute("aria-label",m),Ve.title=m,M=0}),en.addEventListener("click",()=>{e.randomize(),x=!1,M=0,u+=1,St(),dt.textContent="0.000",ft.textContent="0.000",g=!0,ve(),we()}),tn.addEventListener("click",()=>{e.clearBlue(),x=!0,M=0,u+=1,St(),dt.textContent="1.000",ft.textContent="-2.000",g=!0,ve(),we()}),j.addEventListener("pointerdown",m=>{if(Ee(m)){if(j.setPointerCapture(m.pointerId),d=!0,m.pointerType==="touch"){c.set(m.pointerId,{x:m.clientX,y:m.clientY}),c.size===1?(G=!0,_=!1):c.size===2&&(f=!1,v=null,G=!1,_=!0,b=!0,P=It(),z=n),g=!0;return}Ze(m)}}),j.addEventListener("pointermove",m=>{if(Ee(m),d=!0,g=!0,m.pointerType==="touch"){if(!c.has(m.pointerId))return;if(c.set(m.pointerId,{x:m.clientX,y:m.clientY}),b&&c.size>=2){const w=It();P>0&&w>0&&(n=Math.max(0,Math.min(3,z-Math.log2(w/P)*.9)));return}if(c.size===1&&!_){if(G)Ze(m),G=!1;else if(f)for(const w of m.getCoalescedEvents())Te(w,!1)}return}if(f){const w=m.getCoalescedEvents();if(w.length===0)Te(m,!1);else for(const A of w)Te(A,!1)}});const ei=m=>{m.pointerType==="touch"&&(G&&!_&&Ze(m),c.delete(m.pointerId),c.size<2&&(b=!1),c.size===0&&(G=!1,_=!1,d=!1)),f=!1,v=null,j.hasPointerCapture(m.pointerId)&&j.releasePointerCapture(m.pointerId),g=!0,we()};j.addEventListener("pointerup",ei),j.addEventListener("pointercancel",m=>{c.delete(m.pointerId),f=!1,d=!1,v=null,G=!1,b=!1,g=!0}),j.addEventListener("pointerenter",()=>{d=!0,g=!0}),j.addEventListener("pointerleave",()=>{f||(d=!1,g=!0)}),j.addEventListener("wheel",m=>{m.preventDefault();const w=Math.max(-120,Math.min(120,m.deltaY));n=Math.max(0,Math.min(3,n+w*.00125)),Ee(m),d=!0},{passive:!1}),window.addEventListener("blur",()=>{f=!1,d=!1,v=null,c.clear(),b=!1,G=!1,me.clear(),Ye.clear(),We.clear(),Ke.clear(),be=0,je=0,lt.setAttribute("aria-pressed","false"),ut.setAttribute("aria-pressed","false"),ke.setAttribute("aria-pressed","false"),qe.setAttribute("aria-pressed","false"),g=!0}),window.addEventListener("resize",()=>Bt(!0)),Bt(!1),e.step(t,40),xe(),Pt(),Je(),g=!0,ve(),we();const At=m=>{const w=Math.max(0,(m-B)/1e3),A=Math.min(.1,w);B=m;const V=+(Ye.size>0)-+(me.size>0);if(V!==0){const L=V<0?ze:ae,X=V*jt*A;i=V<0?Math.max(L,i+X):Math.min(L,i+X),n=i,ye(),g=!0}else{const L=n-i;Math.abs(L)>5e-4?(i+=L*(1-Math.exp(-A*10)),ye(),g=!0):i!==n&&(i=n,ye(),g=!0)}const S=+(Ke.size>0)-+(We.size>0);if(S!==je&&(be=0,je=S),S!==0)t=$i(t,S,be,A,wt,_t),be+=A,xe();else{const L=s-t;Math.abs(L)>5e-4?(t+=L*(1-Math.exp(-A/Kt)),xe()):t!==s&&(t=s,xe())}if(!l){M+=A*Yi*r;const L=Math.min(8,Math.floor(M));L>0&&(M-=L,e.step(t,L),g=!0)}const J=Ae()>=ot?1:0,ie=J-E;Math.abs(ie)>.001?(E+=ie*(1-Math.exp(-A*7)),g=!0):E!==J&&(E=J,g=!0);const ce=Ae()>=ot?i:Jt(),_e=t>vt?"chaos":"map",le=j.getBoundingClientRect(),Z=K.advance(Math.min(.5,w),_e,{width:le.width,height:le.height},S>0);if(Gt(Z,w),g&&ve(),!R&&_e==="map"&&m-O>280){O=m,R=!0;const L=N;e.readRegionSample(Qe(ce),ce).then(X=>{L!==N||!X||t>vt||(W=X,$+=1,K.ingest(X,t))}).catch(X=>{console.warn("Could not read Ising regions.",X)}).finally(()=>{R=!1})}m-I>750&&(I=m,we()),requestAnimationFrame(At)};requestAnimationFrame(At)}on().catch(a=>{console.error(a),Xe.hidden=!1,Xe.textContent=a instanceof Error?a.message:"Could not start the WebGPU simulation."});
