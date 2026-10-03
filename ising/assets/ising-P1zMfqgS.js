(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function t(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(n){if(n.ep)return;n.ep=!0;const s=t(n);fetch(n.href,s)}})();const ge={startTerrain:.47,terrainColor:[1,1,1],waterColor:[1/255,14/255,134/255],temperatureDuration:8},Zt=(o,e)=>{const t=o?.trim().replace(/^#/,"")??"";if(!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(t))return e;const i=t.length===3?[...t].map(s=>s+s).join(""):t,n=s=>parseInt(i.slice(s,s+2),16)/255;return[n(0),n(2),n(4)]},Ni=o=>{const e=new URLSearchParams(o),t=e.get("start_terrain")?.trim()??"",i=/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t)?Number(t):NaN,n=e.get("temperature_duration")?.trim()??"",s=/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(n)?Number(n):NaN;return{startTerrain:Number.isFinite(i)&&i>=0&&i<=100?i/100:ge.startTerrain,terrainColor:Zt(e.get("terrain_color"),ge.terrainColor),waterColor:Zt(e.get("water_color"),ge.waterColor),temperatureDuration:Number.isFinite(s)&&s>0?s:ge.temperatureDuration}},ei=o=>`rgb(${o.map(e=>e*255).join(", ")})`;async function Li(){try{if(!navigator.gpu)return null;const o=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!o)return null;const e=await o.requestDevice();return e.lost.then(t=>{console.error("WebGPU device lost:",t.message)}),e.addEventListener("uncapturederror",t=>{console.error("WebGPU:",t.error.message)}),{device:e,format:navigator.gpu.getPreferredCanvasFormat()}}catch(o){return console.error("WebGPU initialization failed.",o),null}}const Fi=`override start_terrain: f32 = 0.47;
override terrain_r: f32 = 1.0;
override terrain_g: f32 = 1.0;
override terrain_b: f32 = 1.0;
override water_r: f32 = 1.0 / 255.0;
override water_g: f32 = 14.0 / 255.0;
override water_b: f32 = 134.0 / 255.0;

struct SimParams {
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
  fallback_spin: i32,
  invert: u32,
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
  fallback_brush_spin: f32,
  cursor_stroke_half_width: f32,
  map_strength: f32,
  invert_brush: f32,
}

struct Selection {
  value: i32,
}

struct StatsAccumulator {
  magnetization: atomic<i32>,
  energy: atomic<i32>,
  visible_magnetization: atomic<i32>,
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
var<workgroup> group_visible_magnetization: array<i32, 256>;

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

fn initial_spin(index: u32) -> i32 {
  return select(-1, 1, start_terrain >= 1.0 || random_unit(index ^ sim.seed) < start_terrain);
}

fn wrap(value: i32, size: i32) -> u32 {
  return u32(((value % size) + size) % size);
}

@compute @workgroup_size(8, 8)
fn randomize(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= sim.size.x || gid.y >= sim.size.y) { return; }
  let index = gid.y * sim.size.x + gid.x;
  spins_write[index] = initial_spin(index);
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
  selection.value = select(select(-1, 1, visible_value >= 0.0), brush.fallback_spin, brush.fallback_spin != 0);
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
  spins_write[y * brush.size.x + x] = select(selection.value, -selection.value, brush.invert != 0u);
}

@compute @workgroup_size(16, 16)
fn reduce_stats(
  @builtin(global_invocation_id) gid: vec3<u32>,
  @builtin(local_invocation_index) local_index: u32,
  @builtin(workgroup_id) group_id: vec3<u32>,
) {
  var magnetization = 0;
  var energy = 0;
  var visible_magnetization = 0;
  if (gid.x < stats_params.width && gid.y < stats_params.height) {
    let index = gid.y * stats_params.width + gid.x;
    let spin = spins_read[index];
    let right_x = select(gid.x + 1u, 0u, gid.x + 1u == stats_params.width);
    let down_y = select(gid.y + 1u, 0u, gid.y + 1u == stats_params.height);
    magnetization = spin;
    visible_magnetization = select(-1, 1, textureLoad(observed_field, vec2<i32>(gid.xy), 0).r >= 0.0);
    energy = -spin * (
      spins_read[gid.y * stats_params.width + right_x]
      + spins_read[down_y * stats_params.width + gid.x]
    );
  }

  group_magnetization[local_index] = magnetization;
  group_energy[local_index] = energy;
  group_visible_magnetization[local_index] = visible_magnetization;
  workgroupBarrier();

  var stride = 128u;
  loop {
    if (local_index < stride) {
      group_magnetization[local_index] += group_magnetization[local_index + stride];
      group_energy[local_index] += group_energy[local_index + stride];
      group_visible_magnetization[local_index] += group_visible_magnetization[local_index + stride];
    }
    workgroupBarrier();
    if (stride == 1u) { break; }
    stride = stride / 2u;
  }

  if (local_index == 0u) {
    atomicAdd(&stats_output.magnetization, group_magnetization[0]);
    atomicAdd(&stats_output.energy, group_energy[0]);
    atomicAdd(&stats_output.visible_magnetization, group_visible_magnetization[0]);
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
  let cold = vec3<f32>(water_r, water_g, water_b);
  let hot = vec3<f32>(terrain_r, terrain_g, terrain_b);
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

fn terrain_isolines(value: f32) -> f32 {
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
    let relief = terrain_isolines(value);
    let contour_color = vec3<f32>(terrain_r, terrain_g, terrain_b) * 0.28;
    color = mix(color, contour_color, relief * render_params.map_strength * 0.22);
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
    if (render_params.fallback_brush_spin != 0.0) {
      cursor_spin = render_params.fallback_brush_spin;
    }
    if (render_params.painting > 0.5) {
      cursor_spin = f32(selection.value);
    }
    if (render_params.invert_brush > 0.5) { cursor_spin = -cursor_spin; }
    let cursor_color = select(
      vec3<f32>(water_r, water_g, water_b),
      vec3<f32>(terrain_r, terrain_g, terrain_b),
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
`,L=(o,e)=>Math.ceil(o/e),We=112,je=128,Vi=(o,e)=>o>=e?{width:We,height:Math.max(1,Math.round(We*e/o))}:{width:Math.max(1,Math.round(We*o/e)),height:We};class Di{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;labelBlurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;labelBlurTextures=null;labelBlurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;labelBlurPrimaryHorizontalGroups=[];labelBlurPrimaryVerticalGroup=null;labelBlurSecondaryHorizontalGroup=null;labelBlurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;labelRegionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(e,t,i,n=ge){this.device=e,this.format=t,this.canvas=i;const s=i.getContext("webgpu");if(!s)throw new Error("Could not create a WebGPU canvas context.");this.context=s,this.context.configure({device:e,format:t,alphaMode:"opaque"});const r=e.createShaderModule({label:"Ising shaders",code:Fi}),a={terrain_r:n.terrainColor[0],terrain_g:n.terrainColor[1],terrain_b:n.terrainColor[2],water_r:n.waterColor[0],water_g:n.waterColor[1],water_b:n.waterColor[2]};this.pipelines={randomize:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"randomize",constants:{start_terrain:n.startTerrain}}}),clearBlue:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"clear_blue"}}),resize:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"resize_grid"}}),update:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"metropolis"}}),field:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"write_field"}}),blurSpinsHorizontal:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"blur_texture_vertical"}}),select:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"select_spin"}}),paint:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"paint"}}),stats:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"reduce_stats"}}),regions:e.createComputePipeline({layout:"auto",compute:{module:r,entryPoint:"sample_regions",constants:a}}),render:e.createRenderPipeline({layout:"auto",vertex:{module:r,entryPoint:"fullscreen_vertex"},fragment:{module:r,entryPoint:"field_fragment",constants:a,targets:[{format:t}]},primitive:{topology:"triangle-list"}})},this.simUniform=e.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=e.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=e.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=e.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(l=>e.createBuffer({label:`Ising blur uniforms ${l}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.labelBlurUniforms=[0,1].map(l=>e.createBuffer({label:`Ising label blur uniforms ${l}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=e.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=e.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=e.createBuffer({label:"Ising region sample",size:je*je*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=e.createBuffer({label:"Ising region readback",size:je*je*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=e.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(e,t,i,n=!0){if(e===this.width&&t===this.height&&this.spinBuffers){this.density=i;return}const s=this.width,r=this.height,a=this.spinBuffers,l=this.fieldTexture,u=this.blurTextures,d=this.labelBlurTextures,y=this.statsOutput,m=this.statsReadback,b=a?.[this.currentIndex]??null;if(this.width=e,this.height=t,this.density=i,this.currentIndex=0,this.canvas.width=e,this.canvas.height=t,this.allocateResources(),n&&b){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,s,r);const P=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:b}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),_=this.device.createCommandEncoder({label:"Resize Ising grid"}),S=_.beginComputePass();S.setPipeline(this.pipelines.resize),S.setBindGroup(0,P),S.dispatchWorkgroups(L(e,8),L(t,8)),S.end(),this.device.queue.submit([_.finish()])}else this.randomize();a&&this.retire({buffers:[a[0],a[1],...y?[y]:[]],readback:m??void 0,textures:[l,...u??[],...d??[]].filter(P=>!!P)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const e=this.device.createCommandEncoder({label:"Randomize Ising state"}),t=e.beginComputePass();t.setPipeline(this.pipelines.randomize),t.setBindGroup(0,this.randomGroups[this.currentIndex]),t.dispatchWorkgroups(L(this.width,8),L(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const e=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),t=e.beginComputePass();t.setPipeline(this.pipelines.clearBlue),t.setBindGroup(0,this.clearGroups[this.currentIndex]),t.dispatchWorkgroups(L(this.width,8),L(this.height,8)),t.end(),this.device.queue.submit([e.finish()]),this.fieldDirty=!0}step(e,t){for(let i=0;i<t;i+=1){const n=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,e,n);const s=this.device.createCommandEncoder({label:"Advance Ising state"}),r=s.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(L(this.width,8),L(this.height,8)),r.end(),this.device.queue.submit([s.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}t>0&&(this.fieldDirty=!0)}paintSegment(e,t,i,n,s,r,a,l){const u=Math.floor(Math.min(e,i)-s),d=Math.floor(Math.min(t,n)-s),y=Math.ceil(Math.max(e,i)+s),m=Math.ceil(Math.max(t,n)+s),b=y-u+1,P=m-d+1;this.writeBrushParams(u,d,b,P,e,t,i,n,s,a,l);const _=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const G=_.beginComputePass();G.setPipeline(this.pipelines.select),G.setBindGroup(0,this.selectGroups[this.currentIndex]),G.dispatchWorkgroups(1),G.end()}const S=_.beginComputePass();S.setPipeline(this.pipelines.paint),S.setBindGroup(0,this.paintGroups[this.currentIndex]),S.dispatchWorkgroups(L(b,8),L(P,8)),S.end(),this.device.queue.submit([_.finish()]),this.fieldDirty=!0}draw(e,t,i,n,s){if(!this.renderGroup||!this.observationReady())return;const r=this.secondaryObservationRadius(t,e),a=this.fieldDirty||t!==this.lastBlurRadius||r!==this.lastSecondaryRadius,l=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const d=l.beginComputePass();d.setPipeline(this.pipelines.field),d.setBindGroup(0,this.fieldGroups[this.currentIndex]),d.dispatchWorkgroups(L(this.width,8),L(this.height,8)),d.end(),this.fieldDirty=!1}a&&this.appendObservationBlur(l,t,r,"display"),this.writeRenderParams(e,t,i,n,s);const u=l.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});u.setPipeline(this.pipelines.render),u.setBindGroup(0,this.renderGroup),u.draw(3),u.end(),this.device.queue.submit([l.finish()])}async readRegionSample(e,t){const i=this.regionGroup;if(!i||!this.observationReady()||this.regionReadback.mapState!=="unmapped")return null;const n=Vi(this.width,this.height),s=n.width*n.height;if(s*4>this.regionStorage.size)return null;const r=this.secondaryObservationRadius(e,t),a=e===this.lastBlurRadius&&r===this.lastSecondaryRadius,l=a?i:this.labelRegionGroup;if(!l)return null;const u=this.device.createCommandEncoder({label:"Read Ising regions"});a||this.appendObservationBlur(u,e,r,"label"),this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([n.width,n.height,0,0]));const d=u.beginComputePass();d.setPipeline(this.pipelines.regions),d.setBindGroup(0,l),d.dispatchWorkgroups(L(n.width,8),L(n.height,8)),d.end(),u.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,s*4),this.device.queue.submit([u.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const y=new Int32Array(this.regionReadback.getMappedRange(),0,s),m=new Int8Array(s),b=new Float32Array(s);for(let P=0;P<s;P+=1)m[P]=y[P]<0?-1:1,b[P]=(Math.abs(y[P])-1)/65534;return{width:n.width,height:n.height,signs:m,luminance:b}}finally{this.regionReadback.unmap()}}async readStats(){const e=this.statsOutput,t=this.statsReadback,i=this.statsGroups[this.currentIndex];if(!e||!t||!i)return{energy:0,magnetization:0,signedMagnetization:0,visibleMagnetization:0};const n=L(this.width,16),s=L(this.height,16),r=new Uint32Array([this.width,this.height,n,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const a=this.device.createCommandEncoder({label:"Read Ising statistics"});a.clearBuffer(e);const l=a.beginComputePass();l.setPipeline(this.pipelines.stats),l.setBindGroup(0,i),l.dispatchWorkgroups(n,s),l.end(),a.copyBufferToBuffer(e,0,t,0,12),this.device.queue.submit([a.finish()]),await t.mapAsync(GPUMapMode.READ);const u=new Int32Array(t.getMappedRange()),d=u[0],y=u[1],m=u[2];t.unmap();const b=this.width*this.height;return{magnetization:Math.abs(d/b),signedMagnetization:d/b,visibleMagnetization:m/b,energy:y/b}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const e=this.width*this.height*4;this.spinBuffers=[0,1].map(t=>this.device.createBuffer({label:`Ising spin buffer ${t}`,size:e,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising full-resolution blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(t=>t.createView()),this.labelBlurTextures=[0,1].map(t=>this.device.createTexture({label:`Ising label observation blur ${t}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.labelBlurViews=this.labelBlurTextures.map(t=>t.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:12,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:12,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const e=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(t=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[t]}},{binding:1,resource:{buffer:this.spinBuffers[1-t]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:t}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}},{binding:15,resource:this.blurViews[1]}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:e},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}),this.labelBlurViews&&(this.labelBlurPrimaryHorizontalGroups=this.spinBuffers.map(t=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]})),this.labelBlurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[0]}}]}),this.labelBlurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[1]},{binding:13,resource:this.labelBlurViews[0]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelBlurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.labelBlurViews[0]},{binding:13,resource:this.labelBlurViews[1]},{binding:14,resource:{buffer:this.labelBlurUniforms[1]}}]}),this.labelRegionGroup=this.device.createBindGroup({label:"Ising label-scale region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.labelBlurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}},{binding:18,resource:this.blurViews[1]}]}))}writeSimParams(e,t,i,n,s=0,r=0){const a=new ArrayBuffer(32),l=new DataView(a);l.setUint32(0,this.width,!0),l.setUint32(4,this.height,!0),l.setUint32(8,e,!0),l.setUint32(12,t,!0),l.setFloat32(16,i,!0),l.setUint32(20,n,!0),l.setUint32(24,s,!0),l.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,a)}writeBrushParams(e,t,i,n,s,r,a,l,u,d,y){const m=new ArrayBuffer(64),b=new DataView(m);b.setUint32(0,this.width,!0),b.setUint32(4,this.height,!0),b.setInt32(8,e,!0),b.setInt32(12,t,!0),b.setUint32(16,i,!0),b.setUint32(20,n,!0),b.setInt32(24,d,!0),b.setUint32(28,y?1:0,!0),b.setFloat32(32,s,!0),b.setFloat32(36,r,!0),b.setFloat32(40,a,!0),b.setFloat32(44,l,!0),b.setFloat32(48,u,!0),this.device.queue.writeBuffer(this.brushUniform,0,m)}observationReady(){return!!(this.blurPrimaryVerticalGroup&&this.blurSecondaryHorizontalGroup&&this.blurSecondaryVerticalGroup)}secondaryObservationRadius(e,t){return t>1?Math.max(1,Math.round(e*.45)):0}appendObservationBlur(e,t,i,n){const s=n==="display",r=s?this.blurUniforms:this.labelBlurUniforms,a=s?this.blurPrimaryHorizontalGroups:this.labelBlurPrimaryHorizontalGroups,l=s?this.blurPrimaryVerticalGroup:this.labelBlurPrimaryVerticalGroup,u=s?this.blurSecondaryHorizontalGroup:this.labelBlurSecondaryHorizontalGroup,d=s?this.blurSecondaryVerticalGroup:this.labelBlurSecondaryVerticalGroup;if(!l||!u||!d||a.length===0)return;this.writeBlurParams(r[0],t),this.writeBlurParams(r[1],i);const y=e.beginComputePass({label:"Horizontal Ising observation blur"});y.setPipeline(this.pipelines.blurSpinsHorizontal),y.setBindGroup(0,a[this.currentIndex]),y.dispatchWorkgroups(L(this.height,64)),y.end();const m=e.beginComputePass({label:"Vertical Ising observation blur"});if(m.setPipeline(this.pipelines.blurTextureVertical),m.setBindGroup(0,l),m.dispatchWorkgroups(L(this.width,64)),m.end(),i>0){const b=e.beginComputePass({label:"Secondary horizontal Ising blur"});b.setPipeline(this.pipelines.blurTextureHorizontal),b.setBindGroup(0,u),b.dispatchWorkgroups(L(this.height,64)),b.end();const P=e.beginComputePass({label:"Secondary vertical Ising blur"});P.setPipeline(this.pipelines.blurTextureVertical),P.setBindGroup(0,d),P.dispatchWorkgroups(L(this.width,64)),P.end()}s&&(this.lastBlurRadius=t,this.lastSecondaryRadius=i)}writeBlurParams(e,t){this.device.queue.writeBuffer(e,0,new Uint32Array([this.width,this.height,t,0]))}writeRenderParams(e,t,i,n,s){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=t,r[5]=e,r[6]=i,r[7]=s.active?1:0,r[8]=s.x*this.density,r[9]=s.y*this.density,r[10]=s.radius*this.density,r[11]=s.painting?1:0,r[12]=s.fallbackSpin,r[13]=Math.max(.5,this.density*.5),r[14]=n,r[15]=s.inverted?1:0,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(e){const t=()=>{for(const i of e.buffers)i.destroy();for(const i of e.textures??[])i.destroy();e.readback&&(e.readback.mapState==="unmapped"?e.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:e.readback}),250))};this.device.queue.onSubmittedWorkDone().then(t)}}const ti=o=>{const e=(t,i)=>"#"+o.map(n=>Math.round((n*t+i*(1-t))*255).toString(16).padStart(2,"0")).join("");return{dark:e(.1,0),light:e(.15,1)}},yi=o=>({land:ti(o.terrainColor),water:ti(o.waterColor)}),Rt=yi(ge),Ct=(o,e,t)=>Math.max(e,Math.min(t,o)),qi=o=>o<=.04045?o/12.92:((o+.055)/1.055)**2.4,ii=o=>{const e=[1,3,5].map(t=>qi(parseInt(o.slice(t,t+2),16)/255));return e[0]*.2126+e[1]*.7152+e[2]*.0722},ni=(o,e)=>(Math.max(o,e)+.05)/(Math.min(o,e)+.05),it=(o,e,t=Rt)=>t[o==="lake"?"water":"land"][e],Yi=(o,e,t,i,n=Rt)=>{const s=it(o,e,n),r=it(o,t,n);return`rgb(${[1,3,5].map(l=>{const u=parseInt(s.slice(l,l+2),16),d=parseInt(r.slice(l,l+2),16);return(u+(d-u)*i).toFixed(2)}).join(", ")})`},wt=o=>o<=.0031308?o*12.92:1.055*o**(1/2.4)-.055,$i=o=>1.6+1.6/(1+(Math.max(0,o)/24)**2),si=(o,e,t)=>{const i=e<o?(o+.05)/t-.05:(o+.05)*t-.05,n=wt(o),s=wt(e);return Math.abs(s-n)<1e-6?1:Ct((wt(Ct(i,0,1))-n)/(s-n),0,1)},Xi=(o,e,t,i=Rt)=>{const n=o.angle*Math.PI/180,s=Math.cos(n),r=Math.sin(n),a=ii(it(o.kind,"dark",i)),l=ii(it(o.kind,"light",i)),u=[],d=[],y=[],m=[],b=$i(o.fontSize);for(let S=-1;S<=1;S+=1)for(let G=-4;G<=4;G+=1){const T=G*o.width*.105,I=S*o.height*.28,g=o.x+T*s-I*r,x=o.y+T*r+I*s,c=Math.max(0,Math.min(e.width-1,Math.floor(g/t.width*e.width))),h=Math.max(0,Math.min(e.height-1,Math.floor(x/t.height*e.height))),p=e.luminance[h*e.width+c];u.push(ni(p,a)),d.push(ni(p,l)),y.push(si(p,a,b)),m.push(si(p,l,b))}u.sort((S,G)=>S-G),d.sort((S,G)=>S-G);const P=Math.floor((u.length-1)*.25);y.sort((S,G)=>S-G),m.sort((S,G)=>S-G);const _=u.length-1-P;return{dark:u[P],light:d[P],darkOpacity:y[_],lightOpacity:m[_]}},Hi=(o,e)=>{const t=o?o.darkContrast*.55+e.dark*.45:e.dark,i=o?o.lightContrast*.55+e.light*.45:e.light;let n=o?.mode??(t>=2.5||i<4.5?"dark":"light");const s=n==="dark"?i:t,a=(n==="dark"?t:i)<(n==="dark"?2.5:3)&&s>4.5?(o?.weakSamples??0)+1:0,l=a>=5;return l&&(n=n==="dark"?"light":"dark"),{...e,mode:n,darkContrast:t,lightContrast:i,weakSamples:l?0:a}},Wi=(o,e,t)=>{if(!o)return{value:e,velocity:0};const i=Ct(t,0,1/60),n=5,s=o.value-e,r=o.velocity+n*s,a=Math.exp(-n*i);return{value:e+(s+r*i)*a,velocity:(o.velocity-n*r*i)*a}},ji=(o,e,t)=>{if(!o)return{from:e,to:e,progress:1,velocity:0};let i=o;if(i.from===i.to){if(e===i.to)return i;i={from:i.to,to:e,progress:0,velocity:0}}const n=e===i.to?1:0,s=Math.max(0,Math.min(t,1/60)),r=5,a=i.progress-n,l=i.velocity+r*a,u=Math.exp(-r*s),d=Math.max(0,Math.min(1,n+(a+l*s)*u)),y=(i.velocity-r*l*s)*u;return Math.abs(d-n)<.001&&Math.abs(y)<.02?{from:e,to:e,progress:1,velocity:0}:{...i,progress:d,velocity:y}},Ki=o=>o.from===o.to?{blend:1,opacity:1}:{blend:o.progress*o.progress*(3-2*o.progress),opacity:1};let _t=1;const ri=new WeakMap,Ue=o=>({value:o,revision:0}),q=o=>{if(o.ancestry)return o.ancestry;const e=ri.get(o);if(e)return e;const t=o.chromosome.syllables.map(n=>({id:_t++,onset:Ue(n.onset),vowel:Ue(n.vowel),bridge:Ue(n.bridge??"")})),i={syllables:t,order:t.map(n=>n.id),orderRevision:0,coda:{id:_t++,...Ue(o.chromosome.coda)},ending:{id:_t++,...Ue(o.chromosome.ending??"")}};return ri.set(o,i),i},Ot=o=>({syllables:o.syllables.map(e=>({id:e.id,onset:{...e.onset},vowel:{...e.vowel},bridge:{...e.bridge}})),order:[...o.order],orderRevision:o.orderRevision,coda:{...o.coda},ending:{...o.ending}}),xi=(o,e)=>{const t=Ot(q(o));o.ancestry=t;for(let i=0;i<o.chromosome.syllables.length;i+=1){const n=o.chromosome.syllables[i],s=e.syllables[i],r=t.syllables[i];for(const a of["onset","vowel","bridge"]){const l=n[a]??"";l!==(s[a]??"")&&(r[a]={value:l,revision:r[a].revision+1})}}for(const i of["coda","ending"]){const n=o.chromosome[i]??"";n!==(e[i]??"")&&(t[i]={id:t[i].id,value:n,revision:t[i].revision+1})}},vi=o=>{const e=o.filter(({weight:t})=>Number.isFinite(t)&&t>0);if(!e.length)throw new Error("Homologous inheritance needs a positive contribution");if(e.some(({origin:t})=>t.id!==e[0].origin.id))throw new Error("Cannot align unrelated gene origins");return e},wi=o=>{const e=Math.max(...o.map(n=>n.variant.revision)),t=new Map;for(const n of o){if(n.variant.revision!==e)continue;const s=n.variant.value;t.set(s,(t.get(s)??0)+n.weight)}return{value:[...t].sort((n,s)=>s[1]-n[1]||(n[0]<s[0]?-1:n[0]>s[0]?1:0))[0][0],revision:e}},Qi=o=>{const e=vi(o),t=i=>wi(e.map(({origin:n,weight:s})=>({variant:n[i],weight:s})));return{id:e[0].origin.id,onset:t("onset"),vowel:t("vowel"),bridge:t("bridge")}},Ji=o=>{const e=vi(o);return{id:e[0].origin.id,...wi(e.map(({origin:t,weight:i})=>({variant:t,weight:i})))}},rt=o=>(o.bridge??"")+o.onset,Q=o=>`${o.syllables.map(e=>rt(e)+e.vowel).join("")}${o.coda}${o.ending??""}`,Le=["v","l","m","n","s","c","r","t","p","d","f","g","b"],_i=["br","cr","dr","gr","pr","tr","cl","fl","gl","pl","fr","st"],Mi=["","",...Le,..._i,"qu"],Pi=[...Le,..._i],me=["a","e","i","o","u"],Si=[...me,"ae","au","oe"],Bi=["n","r","s","l","m","t"],Ii=["a","us","um","is","or","ia","ea","ium","ius","aris","ensis"],Zi={"":["n","r","l","m","s","t"],b:["","m","r","l"],p:["","m","r","l"],d:["","n","r","l"],t:["","n","r","l","s","c"],c:["","n","r","s"],g:["","n","r","l"],f:["","r","l"],s:["","n","r","l"],m:["","r","l","m"],n:["","r","n"],l:["","l"],r:["","r"],v:["","l","r"],tr:["","s","n"],dr:["","n"],cr:[""],gr:[""],br:["","m"],pr:["","m"],cl:[""],fl:[""],gl:[""],pl:[""],fr:[""],st:["","n"]},en=.035,zi=14,ot=9,at=10,be=(o,e,t)=>Math.max(e,Math.min(t,o)),Be=o=>({...o,syllables:o.syllables.map(e=>({...e}))}),pe=o=>be(o(),0,1-Number.EPSILON),Se=(o,e)=>e[Math.floor(pe(o)*e.length)],ae=o=>({...o,chromosome:Be(o.chromosome),ancestry:Ot(q(o))}),ye=o=>Zi[o]??[""],Ke=(o,e)=>e===void 0?o<.012?1:o<.03?2:3:e===1?o>=.0132?2:1:e===2?o<.0108?1:o>=.033?3:2:o<.0108?1:o<.027?2:3,tn=o=>.025*Math.exp(be((o-2.27)*5,-12,12)),oe=(o,e)=>({syllables:o.syllables.slice(0,e).map(t=>({...t})),coda:e<3?rt(o.syllables[e]).charAt(0):o.coda,ending:e===3?o.ending??"":""}),Gi=o=>{const e=o.syllables[0];return e.onset.length+e.vowel.length<=3&&o.syllables.filter(t=>t.vowel.length>1).length<=1&&o.syllables.every((t,i)=>(t.onset!=="qu"||!["u","au","oe"].includes(t.vowel))&&(i===0?!t.bridge:ye(t.onset).includes(t.bridge??""))&&(i===0||t.onset!==o.syllables[i-1].onset||t.vowel!==o.syllables[i-1].vowel))&&Q(o).length<=zi},Nt=o=>{const e=Be(o);e.syllables[0].bridge="";let t=0;for(let i=0;i<3;i+=1){const n=e.syllables[i];if((i===0&&n.onset.length+n.vowel.length>3||n.vowel.length>1&&t>0)&&(n.vowel=n.vowel.charAt(0)),n.onset==="qu"&&["u","au","oe"].includes(n.vowel)&&(n.vowel="a"),i>0&&!ye(n.onset).includes(n.bridge??"")){const s=ye(n.onset);n.bridge=s.includes("")?"":s[0]}n.vowel.length>1&&(t+=1)}for(;Q(e).length>zi;){const i=e.syllables.slice(1).reverse().find(n=>n.bridge&&n.onset||n.onset.length>1||n.vowel.length>1);if(!i)break;i.bridge&&i.onset?i.bridge="":i.onset.length>1?i.onset=i.onset.charAt(0):i.vowel=i.vowel.charAt(0)}for(let i=1;i<3;i+=1){const n=e.syllables[i-1],s=e.syllables[i];n.onset===s.onset&&n.vowel===s.vowel&&(s.vowel=me[(me.indexOf(s.vowel.charAt(0))+2)%me.length])}return e},nn=o=>{const e=[];let t=!1;for(let i=0;i<3;i+=1){const n=Se(o,i===0?Mi:Pi),s=Se(o,t||i===0&&n.length>1?me:Si);t||=s.length>1,e.push({onset:n,vowel:s,bridge:i===0?"":Se(o,ye(n))})}return ae({chromosome:Nt({syllables:e,coda:Se(o,Bi),ending:Se(o,Ii)}),mutability:.75+pe(o)*.5,cooldown:5+pe(o)*5,generation:0})},Ei=(o,e)=>{const t=[];for(let i=0;i<e;i+=1)t.push(i*3,i*3+1),i>0&&t.push(i*3+2);return e===3?t.push(ot,at):t.push(e*3+(o.syllables[e].bridge?2:0)),t},Ut=(o,e)=>{if(e===ot)return o.coda;if(e===at)return o.ending??"";const t=o.syllables[Math.floor(e/3)];return e%3===0?t.onset:e%3===1?t.vowel:t.bridge??""},nt=(o,e,t)=>{if(e===ot)o.coda=t;else if(e===at)o.ending=t;else{const i=o.syllables[Math.floor(e/3)];e%3===0?i.onset=t:e%3===1?i.vowel=t:i.bridge=t}},Ti=(o,e)=>{const t=e===ot?Bi:e===at?Ii:e%3===2?ye(o.syllables[Math.floor(e/3)].onset):e%3===1?Si:e===0?Mi:Pi;return[...new Set(t)].filter(i=>{if(i===Ut(o,e))return!1;const n=Be(o);return nt(n,e,i),Gi(n)})},oi=(o,e,t,i=pe(t)<en)=>{const n=ae(o),s=Ei(n.chromosome,e),r=i?Math.max(3,s.length-1):1;let a=0;for(;a<r&&s.length;){const[l]=s.splice(Math.floor(pe(t)*s.length),1),u=Q(oe(n.chromosome,e));let d=Ti(n.chromosome,l).filter(y=>{const m=Be(n.chromosome);return nt(m,l,y),Q(oe(m,e))!==u});if(!i){const y=d.filter(m=>m.length===Ut(n.chromosome,l).length);d=y.length?y:d.filter(m=>Math.abs(m.length-Ut(n.chromosome,l).length)<=1)}d.length&&(nt(n.chromosome,l,Se(t,d)),a+=1)}return n.mutability=be(n.mutability*(1+(pe(t)-.5)*.08),.5,1.5),n.cooldown=be(n.cooldown+(pe(t)-.5)*.4,5,10),xi(n,o.chromosome),n},kt=(o,e,t)=>{if(e===3){o.coda=t;return}const i=o.syllables[e];i.onset.startsWith(t)?i.bridge="":ye(i.onset).includes(t)?i.bridge=t:(i.bridge="",i.onset=t)},ai=(o,e,t,i,n,s=!1)=>{const r=l=>{const u=Q(oe(l.chromosome,e));return Gi(l.chromosome)&&(u!==i||s)&&(!t?.has(u)||s&&u===i)&&(!n||u.startsWith(n))},a=l=>(xi(l,o.chromosome),l);if(r(o))return o;for(const l of[...Ei(o.chromosome,e)].reverse())for(const u of Ti(o.chromosome,l)){const d=ae(o);if(nt(d.chromosome,l,u),r(d))return a(d)}if(n&&e>1)for(const l of me)for(const u of Le){const d=ae(o);if(d.chromosome.syllables[e-1].vowel=l,kt(d.chromosome,e,u),r(d))return a(d)}for(const l of Le)for(const u of me)for(const d of Le){const y=ae(o);if(y.chromosome.syllables[0]={onset:l,vowel:u,bridge:""},kt(y.chromosome,e,d),r(y))return a(y)}return null},sn=(o,e)=>{const t=ye(e.onset);return t.includes(o)?o:o==="n"&&t.includes("m")?"m":e.bridge&&t.includes(e.bridge)?e.bridge:t.find(i=>i==="r"||i==="l"||i==="n")??""},rn=(o,e)=>{const t=o.filter(g=>g.weight>0).sort((g,x)=>x.weight-g.weight||q(g.genes).order.join(",").localeCompare(q(x.genes).order.join(","))),i=t.reduce((g,x)=>g+x.weight,0),n=new Set(t),s=[];for(;n.size;){const g=[n.values().next().value];n.delete(g[0]);const x=new Set(q(g[0].genes).order);for(let c=!0;c;){c=!1;for(const h of n){const p=q(h.genes).syllables.map(({id:v})=>v);p.some(v=>x.has(v))&&(g.push(h),n.delete(h),p.forEach(v=>x.add(v)),c=!0)}}s.push(g)}const r=(g,x)=>{const c=new Map;for(const p of g){const v=q(p.genes)[x],B=c.get(v.id)??[];B.push({origin:v,weight:p.weight}),c.set(v.id,B)}const h=[...c.values()].sort((p,v)=>v.reduce((B,w)=>B+w.weight,0)-p.reduce((B,w)=>B+w.weight,0)||p[0].origin.id-v[0].origin.id);return Ji(h[0])},a=s.map(g=>{const x=[...g].sort((w,E)=>q(E.genes).orderRevision-q(w.genes).orderRevision||E.weight-w.weight||q(w.genes).order.join(",").localeCompare(q(E.genes).order.join(","))),c=q(x[0].genes).order,h=new Map,p=[];for(const w of x){const E=q(w.genes),k=g.length===1?E.syllables.map(({id:A})=>A):E.order;for(const A of k)p.includes(A)||p.push(A);for(const A of E.syllables){const C=h.get(A.id)??[];C.push({origin:A,weight:w.weight}),h.set(A.id,C)}}const v=p.map(w=>{const E=h.get(w),k=Qi(E),A=g.length===1?{...g[0].genes.chromosome.syllables.find((C,R)=>q(g[0].genes).syllables[R].id===w)}:{onset:k.onset.value,vowel:k.vowel.value,bridge:k.bridge.value};return{origin:k,sound:A,shared:E.length>1,support:E.reduce((C,R)=>C+R.weight,0)}}),B=[...v].sort((w,E)=>Number(E.shared)-Number(w.shared)||Number(c.includes(E.origin.id))-Number(c.includes(w.origin.id))||E.support-w.support||p.indexOf(w.origin.id)-p.indexOf(E.origin.id));return{material:v,priorities:B,weight:g.reduce((w,E)=>w+E.weight,0),coda:r(g,"coda"),ending:r(g,"ending")}}),l=a.map(g=>g.weight/i*e),u=l.map(Math.floor),d=a.map((g,x)=>x).sort((g,x)=>l[x]-u[x]-(l[g]-u[g])||g-x);for(let g=e-u.reduce((c,h)=>c+h,0),x=0;g>0;g-=1,x+=1)u[d[x]]+=1;const y=[...u];for(;u.reduce((g,x)=>g+x,0)<3;){const g=a.map((x,c)=>c).sort((x,c)=>a[c].weight/i*3-u[c]-(a[x].weight/i*3-u[x])||x-c).find(x=>u[x]<a[x].material.length);u[g]+=1}const m=a.map((g,x)=>{const c=new Set(g.priorities.slice(0,u[x]));return g.material.filter(h=>c.has(h))}),b=[];m.forEach((g,x)=>g.slice(0,y[x]).forEach(c=>b.push({family:x,part:c}))),m.forEach((g,x)=>g.slice(y[x]).forEach(c=>b.push({family:x,part:c})));const P=[];let _="";b.forEach(({family:g,part:x},c)=>{const h=a[g],p={...x.sound};c>0&&b[c-1].family!==g&&(p.bridge=sn(_,p)),P.push(p);const v=h.material[h.material.indexOf(x)+1];_=v?rt(v.sound).charAt(0):h.coda.value});const S=a[b[2].family],G=b.map(({part:g})=>g.origin.id),T=t.map(({genes:g})=>q(g)).filter(g=>g.order.every((x,c)=>x===G[c])),I={syllables:b.map(({part:g})=>g.origin),order:G,orderRevision:T.length?Math.max(...T.map(g=>g.orderRevision)):Math.max(...t.map(({genes:g})=>q(g).orderRevision))+1,coda:S.coda,ending:S.ending};return{chromosome:Nt({syllables:P,coda:S.coda.value,ending:S.ending.value}),ancestry:Ot(I),mutability:t.reduce((g,x)=>g+x.genes.mutability*x.weight,0)/i,cooldown:be(t.reduce((g,x)=>g+x.genes.cooldown*x.weight,0)/i,5,10),generation:Math.max(...t.map(g=>g.genes.generation))+1}};class on{genes;genome;pending=null;nextChangeAt;rng;exposure=0;capacity;inheritance=null;inheritanceKey="";get hereditary(){const e=this.pending?.cause==="recombination"?this.pending.genes:this.inheritance;if(!e)return{genes:ae(this.genes),genome:Be(this.genome)};const t=this.pending?.cause==="recombination"?this.pending.capacity:this.capacity;return{genes:ae(e),genome:oe(e.chromosome,t)}}constructor(e){this.rng=e.rng??Math.random,this.capacity=Ke(e.areaFraction);let t;if(e.parent){t=ae(e.parent);const i=Math.abs(e.fragment??0)%(4-this.capacity);if(t.chromosome.syllables=[...t.chromosome.syllables.slice(i),...t.chromosome.syllables.slice(0,i)],t.ancestry.syllables=[...t.ancestry.syllables.slice(i),...t.ancestry.syllables.slice(0,i)],this.capacity<3){const n=i+this.capacity<3?rt(e.parent.chromosome.syllables[i+this.capacity]).charAt(0):e.parent.chromosome.coda;kt(t.chromosome,this.capacity,n)}t.chromosome=Nt(t.chromosome),t.generation+=1,t=oi(t,this.capacity,this.rng)}else t=nn(this.rng);this.genes=ai(t,this.capacity,e.banned)??t,this.genome=oe(this.genes.chromosome,this.capacity),this.nextChangeAt=e.now+this.genes.cooldown}recombine(e,t){const i=e.filter(r=>r.weight>0);if(i.length<2)return;const n=`${Ke(t)}:`+i.map(({genes:r,genome:a,weight:l})=>`${Q(r.chromosome)}:${Q(a??r.chromosome)}:${JSON.stringify(q(r))}:${l}`).join("|");if(n===this.inheritanceKey)return;this.inheritanceKey=n;const s=Ke(t);this.inheritance=rn(i,s),this.pending={genes:this.inheritance,genome:oe(this.inheritance.chromosome,s),capacity:s,cause:"recombination"}}propose(e){const{areaFraction:t,temperature:i,elapsed:n,now:s,banned:r}=e,a=be(Math.sqrt(.055/Math.max(t,.001)),.5,2);this.exposure=Math.min(1,this.exposure+Math.max(0,n)*tn(i)*this.genes.mutability*a);const l=Ke(t,this.capacity);if(l===this.capacity&&(this.pending?.cause==="growth"||this.pending?.cause==="shrink")&&(this.pending=null),(l!==this.capacity||this.inheritance)&&this.pending?.capacity!==l){const u=this.inheritance??this.genes;this.pending={genes:u,genome:oe(u.chromosome,l),capacity:l,cause:this.inheritance?"recombination":l<this.capacity?"shrink":"growth"}}if(!this.pending&&this.exposure>=1-1e-10){const u=oi(this.genes,this.capacity,this.rng);this.pending={genes:u,genome:oe(u.chromosome,this.capacity),capacity:this.capacity,cause:"mutation"}}if(this.pending){const u=ai(this.pending.genes,this.pending.capacity,r,Q(this.genome),this.pending.cause==="growth"?Q(this.genome):void 0,this.pending.cause==="recombination");if(!u)return null;u!==this.pending.genes&&(this.pending={...this.pending,genes:u,genome:oe(u.chromosome,this.pending.capacity)})}return s+1e-10>=this.nextChangeAt?this.pending:null}reject(e){e!==this.pending||e.cause!=="mutation"||(this.pending=null,this.exposure=0)}commit(e,t){if(e!==this.pending||t+1e-10<this.nextChangeAt)return;const i=Q(e.genome)!==Q(this.genome);this.genes=ae(e.genes),this.genome=Be(e.genome),this.capacity=e.capacity,this.pending=null,this.inheritance=null,i&&(this.exposure=0,this.nextChangeAt=t+be(this.genes.cooldown,5,10))}}const li=.7,Mt=5,an=2.27,ln=.0025,cn=.004,un=.055,ci=1/2,hn=48,Pt=1.35,dn=.16,fn=9,F=8,ne=64,se=80,ui=20,hi=.12,di=.22,gn=.05,pn=.12,mn=.85,bn=.25,yn=3,fi=8,xn=1.8,vn=140,wn=28,_n=160,Mn=2,Pn='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',J=(o,e,t)=>Math.max(e,Math.min(t,o)),ke=(o,e,t,i)=>o+(e-o)*(1-Math.exp(-t/i)),_e=o=>o==="island"||o==="continent",re=o=>o*dn,Qe=(o,e,t)=>o+(e-o)*t,Re=(o,e)=>{const t=Math.abs(o-e)%180;return Math.min(t,180-t)},Sn=(o,e,t,i)=>{const n=2/mn,s=(t-o)*n*n-2*n*e,r=e+s*i;return{value:o+r*i,velocity:r}},Bn=o=>[{x:o.x,y:o.y}];class In{measure=typeof document>"u"?null:document.createElement("canvas").getContext("2d");textMetrics=new Map;distanceFields=new WeakMap;prefixFields=new WeakMap;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextTrackId=1;nextPlacementId=1;width=0;height=0;viewport={width:1,height:1};synced=!1;lastIngest=-1;lastNameTime=-1;reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.width=0,this.height=0,this.synced=!1,this.lastIngest=-1,this.lastNameTime=-1}advance(e,t,i){this.applyViewport(i);const n=J(e,0,.5);t!=="map"&&(this.synced=!1);for(const r of this.tracks.values()){const a=t==="map"&&r.confirmed&&r.missing===0;r.agreement=ke(r.agreement,a?1:0,n,li),r.stability=ke(r.stability,a?r.agreement:0,n,li);const l=r.placement;l?.alive&&r.present&&this.glide(r,l,n);const u=l?[l,...r.ghosts]:r.ghosts;for(const d of u){const y=t==="map"&&this.synced&&r.present&&r.confirmed&&r.missing<.75&&d.alive;d.opacity=ke(d.opacity,y?r.stability:0,n,y?.25:.45)}l&&!l.alive&&l.opacity<.02&&(r.placement=null),r.ghosts=r.ghosts.filter(d=>d.opacity>=.02)}const s=this.collect(n);return t==="chaos"&&s.length===0&&this.reset(),s}ingest(e,t=an,i){if(e.width<2||e.height<2||e.signs.length!==e.width*e.height)return;const n=performance.now()/1e3,s=this.lastIngest<0?0:Math.min(2,n-this.lastIngest);this.lastIngest=n;const r=i??n,a=this.lastNameTime<0?0:i===void 0?s:Math.max(0,r-this.lastNameTime);this.lastNameTime=r;for(const c of this.tracks.values())c.present=!1;if(e.width!==this.width||e.height!==this.height){this.owners=this.regrid(this.owners,this.width,this.height,e.width,e.height);const c=[];for(const h of this.tracks.values()){h.soft&&(h.soft=this.regridFloat(h.soft,this.width,this.height,e.width,e.height)),h.lastMask&&(h.lastMask=this.regrid(h.lastMask,this.width,this.height,e.width,e.height));const p=h.placement?[h.placement,...h.ghosts]:h.ghosts;for(const v of p){const B=v.mask===v.regionMask;v.mask=this.regrid(v.mask,this.width,this.height,e.width,e.height),v.regionMask=B?v.mask:this.regrid(v.regionMask,this.width,this.height,e.width,e.height),c.push(v.mask),B||c.push(v.regionMask)}}this.width=e.width,this.height=e.height;for(const h of c)this.remember(h)}const u=this.components(e.signs).filter(c=>c.role==="place").sort((c,h)=>h.area-c.area).slice(0,hn),d=[],y=[],m=(c,h,p)=>{const v=h.placement?.alive?{x:h.placement.position.x/this.viewport.width,y:h.placement.position.y/this.viewport.height}:h.center;return{region:c,track:h,overlap:p,distance:this.distance(v,u[c].center)}};for(let c=0;c<u.length;c+=1){const h=new Map;for(const p of u[c].cells){const v=this.owners[p];v&&h.set(v,(h.get(v)??0)+1)}for(const[p,v]of h){const B=this.tracks.get(p);!B||_e(B.kind)!==u[c].sign>0||v<=0||d.push(m(c,B,v))}y.push(h)}const b=new Set,P=new Set,_=[],S=c=>{c.sort((h,p)=>p.overlap-h.overlap||h.distance-p.distance||h.track.id-p.track.id);for(const h of c)b.has(h.region)||P.has(h.track.id)||(b.add(h.region),P.add(h.track.id),_.push({track:h.track,region:u[h.region],overlap:h.overlap}))};S(d);const G=[];for(const c of this.tracks.values())if(!(P.has(c.id)||!c.lastMask||c.missing>=Mt))for(let h=0;h<u.length;h+=1){if(b.has(h)||_e(c.kind)!==u[h].sign>0)continue;const p=u[h].bounds;if(c.bounds.x1<=p.x0||p.x1<=c.bounds.x0||c.bounds.y1<=p.y0||p.y1<=c.bounds.y0)continue;let v=0;for(const B of u[h].cells)v+=c.lastMask[B]??0;v>0&&G.push(m(h,c,v))}S(G);const T=[];for(const c of this.tracks.values())if(!(P.has(c.id)||c.missing>=Mt))for(let h=0;h<u.length;h+=1){const p=u[h];if(b.has(h)||_e(c.kind)!==p.sign>0)continue;const v=Math.min(c.area,p.area)/Math.max(c.area,p.area),B=Math.max(0,c.bounds.x0-p.bounds.x1,p.bounds.x0-c.bounds.x1)*this.width,w=Math.max(0,c.bounds.y0-p.bounds.y1,p.bounds.y0-c.bounds.y1)*this.height,E=Math.hypot((c.center.x-p.center.x)*this.width,(c.center.y-p.center.y)*this.height),k=Math.sqrt(Math.min(c.area,p.area)/Math.PI);v>=.5&&Math.hypot(B,w)<=1.5&&E<=Math.max(3,k*1.25)&&T.push(m(h,c,0))}S(T);const I=new Set;for(const c of this.tracks.values()){let h=0;for(let p=0;p<u.length;p+=1)_e(c.kind)===u[p].sign>0&&(y[p].get(c.id)??0)>=u[p].area*.5&&(h+=1);h>1&&I.add(c.id)}const g=new Map([...this.tracks].map(([c,h])=>[c,h.name.hereditary]));for(let c=0;c<u.length;c+=1){if(b.has(c))continue;const h=u[c];if(!h.kind)continue;const p=[...y[c]].filter(([C,R])=>I.has(C)&&R>=h.area*.5&&_e(this.tracks.get(C).kind)===h.sign>0).sort((C,R)=>R[1]-C[1]).map(([C])=>this.tracks.get(C)).find(C=>C!==void 0),v=this.nextTrackId++,B=p?u.filter((C,R)=>(y[R].get(p.id)??0)>=C.area*.5).sort((C,R)=>C.center.x-R.center.x||C.center.y-R.center.y):[],w=new on({areaFraction:h.area/e.signs.length,now:r,banned:this.usedStems,parent:p?g.get(p.id)?.genes:void 0,fragment:B.indexOf(h)}),E=Q(w.genome);this.usedStems.add(E);const k=this.nameText(w.genome),A={id:v,stem:E,name:w,kind:h.kind,text:k,area:h.area,stability:.15,agreement:1,missing:0,confirmed:!0,present:!1,center:h.center,bounds:h.bounds,lastMask:null,soft:null,placement:null,ghosts:[],styleFont:0};this.tracks.set(A.id,A),_.push({track:A,region:h,overlap:0})}for(const{track:c,region:h}of _){const p=u.indexOf(h),v=[...y[p]].filter(([B,w])=>{const E=this.tracks.get(B);if(!E||_e(E.kind)!==h.sign>0)return!1;const k=E.name.genome.syllables.length*2+1;return w/h.area>=.5/k}).map(([B,w])=>({track:this.tracks.get(B),weight:w})).sort((B,w)=>w.weight-B.weight||+(w.track===c)-+(B.track===c)||B.track.id-w.track.id);v.length>1&&c.name.recombine(v.map(({track:B,weight:w})=>({...g.get(B.id),weight:w})),h.area/e.signs.length)}const x=new Uint16Array(e.signs.length);for(const{track:c,region:h,overlap:p}of _){if(c.present=!0,p>0){const v=p/Math.min(c.area,h.area);c.agreement=Math.min(c.agreement,.65+.35*v)}c.area=h.area,c.center=h.center,c.bounds=h.bounds,c.missing=0,c.confirmed=!0;for(const v of h.cells)x[v]=c.id}this.owners=x;for(const c of[...this.tracks.values()])_.some(h=>h.track===c)||(c.missing+=s,c.confirmed=!1,c.missing>Mt&&(this.tracks.delete(c.id),this.usedStems.delete(c.stem)));if(this.viewport.width<2||this.viewport.height<2){this.synced=!0;return}for(const{track:c,region:h}of _){const p=this.allowedMask(h),v=c.name.propose({areaFraction:h.area/e.signs.length,temperature:t,elapsed:a,now:r,banned:this.usedStems});v&&this.rename(c,v,p,r),c.lastMask=p,this.remember(p),this.smooth(c,p,s),this.aim(c,p,s)}this.synced=!0}nameText(e){const t=Q(e);return t.charAt(0).toUpperCase()+t.slice(1)}rename(e,t,i,n){const s=Q(t.genome);if(n<e.name.nextChangeAt||s!==e.stem&&this.usedStems.has(s))return!1;if(s===e.stem)return e.name.commit(t,n),!0;const r=this.nameText(t.genome),a=e.placement;return a?.alive&&(!this.fitsPose(i,r,this.snapshot(a))||!this.fitsPose(a.mask,r,this.snapshot(a)))?!1:(this.usedStems.delete(e.stem),this.usedStems.add(s),e.name.commit(t,n),e.stem=s,e.text=r,!0)}aim(e,t,i){const n=this.viewport.width*this.viewport.height/t.length,s=J(Math.sqrt(e.area*n/(Math.max(4,e.text.length)*3.2)),F,ne);e.styleFont=e.styleFont===0?s:ke(e.styleFont,s,i,2.5);const r=this.landscape(t,this.distanceFields.get(t),e.soft??Float32Array.from(t),e.styleFont,e.area),a=e.placement?.alive?e.placement:null,l=a?.angle??0,u=e.name.pending?this.nameText(e.name.pending.genome):null,d=u&&this.boxWidth(u,F,re(F))>this.boxWidth(e.text,F,re(F))?u:e.text,y=(v,B)=>Math.max(.01,r.quality[v]+.12*B.font/e.styleFont-gn*Math.abs(B.angle)/se-pn*r.elongation[v]*Re(B.angle,r.axis[v])/se),m=v=>{const B=[];for(const w of r.candidates){const E=this.cellPoint(w);if(B.some(A=>this.distance(A.pose,E)<r.radius*.55))continue;const k=this.poseAt(v,t,E,e.styleFont,l,r.axis[w],r.elongation[w]);if(k&&(B.push({pose:k,quality:y(w,k)}),B.length>=24))break}if(a){const w=this.index(a.position);if(w>=0&&r.centerX[w]>0){const E={x:r.centerX[w],y:r.centerY[w]},k=this.index(E),A=k<0?null:this.poseAt(v,t,E,e.styleFont,l,r.axis[k],r.elongation[k]);A&&k>=0&&B.push({pose:A,quality:y(k,A)})}}return B};let b=m(d);if(b.length===0&&d!==e.text&&(e.name.pending&&e.name.reject(e.name.pending),b=m(e.text)),b.length===0){a&&this.release(e);return}b.sort((v,B)=>B.quality-v.quality);const P=b[0];if(!a){e.placement=this.spawn(P.pose,t);return}const _=b.filter(v=>this.distance(v.pose,a.position)<=r.radius*1.5).sort((v,B)=>B.quality-this.distance(B.pose,a.position)/(r.radius*16)-(v.quality-this.distance(v.pose,a.position)/(r.radius*16)))[0],S=this.index(a.position),G=_?.quality??(S>=0?r.quality[S]:0),T=P.quality>G*Mn,I=_&&P.quality<=_.quality*1.08?_:P,g=this.snapshot(a),x=this.distance(g,I.pose)<=r.radius*1.5;let c=t,h=!1;if(!this.fitsPose(t,e.text,g)&&(c=this.union(a.regionMask,t),this.remember(c),!this.fitsPose(c,e.text,g)&&x&&a.mask!==a.regionMask&&(c=this.union(a.mask,t),this.remember(c),h=!0),!this.fitsPose(c,e.text,g))){this.relight(e,I.pose,t);return}let p=this.planRoute(e.text,c,g,I.pose);if(!p&&c!==t&&x&&!h&&a.mask!==a.regionMask){const v=this.union(a.mask,t);if(this.remember(v),this.fitsPose(v,e.text,g)){const B=this.planRoute(e.text,v,g,I.pose);B&&(c=v,p=B)}}if(!p){(c!==t||T&&this.distance(g,I.pose)>r.radius*1.5)&&this.relight(e,I.pose,t);return}a.mask=c,a.regionMask=t,a.target=I.pose,a.route=p}poseAt(e,t,i,n,s,r,a){const l=this.index(i);if(l<0||!t[l])return null;let u=null,d=-1/0;const y=this.maxFont(t,e,i,0);if(y>=F){const m=Math.min(n,Math.max(F,y*.9));u={x:i.x,y:i.y,font:m,angle:0},d=m/n-di*a*Re(0,r)/se-.02*Re(0,s)/se}for(let m=ui;m<=se;m+=ui){const b=Math.min(n,ne*.9)/n-hi*m/se;if(d>=b)break;for(const P of[-m,m]){const _=this.maxFont(t,e,i,P);if(_<F)continue;const S=Math.min(n,Math.max(F,_*.9)),G=S/n-hi*m/se-di*a*Re(P,r)/se-.02*Re(P,s)/se;G>d&&(u={x:i.x,y:i.y,font:S,angle:P},d=G)}}return u}landscape(e,t,i,n,s){const r=this.width+1,a=r*(this.height+1),l=new Float64Array(a),u=new Float64Array(a),d=new Float64Array(a),y=new Float64Array(a),m=new Float64Array(a),b=new Float64Array(a),P=new Float32Array(e.length),_=new Float32Array(e.length),S=new Float32Array(e.length),G=new Float32Array(e.length),T=new Float32Array(e.length),I=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),g=Math.min(Math.min(this.viewport.width,this.viewport.height)*.32,Math.max(n*3.5,Math.sqrt(s*I*I)*.33,I*3)),x=Math.max(1,Math.ceil(g*this.width/this.viewport.width)),c=Math.max(1,Math.ceil(g*this.height/this.viewport.height));for(let w=0;w<this.height;w+=1){let E=0,k=0,A=0,C=0,R=0,j=0;for(let Y=0;Y<this.width;Y+=1){const Z=Y+w*this.width,K=e[Z]*(.85+.15*i[Z])*J(t[Z]*I/(n*2),0,1),$=this.cellPoint(Z);E+=K,k+=K*$.x,A+=K*$.y,C+=K*$.x*$.x,R+=K*$.y*$.y,j+=K*$.x*$.y;const V=(w+1)*r+Y+1;l[V]=l[V-r]+E,u[V]=u[V-r]+k,d[V]=d[V-r]+A,y[V]=y[V-r]+C,m[V]=m[V-r]+R,b[V]=b[V-r]+j}}const h=(w,E,k,A,C)=>w[C*r+A]-w[k*r+A]-w[C*r+E]+w[k*r+E],p=l[a-1],v=p>0?{x:u[a-1]/p,y:d[a-1]/p}:{x:this.viewport.width/2,y:this.viewport.height/2},B=[];for(let w=0;w<e.length;w+=1){if(!e[w])continue;const E=w%this.width,k=Math.floor(w/this.width),A=Math.max(0,E-x),C=Math.max(0,k-c),R=Math.min(this.width,E+x+1),j=Math.min(this.height,k+c+1),Y=h(l,A,C,R,j);if(Y<=0)continue;_[w]=h(u,A,C,R,j)/Y,S[w]=h(d,A,C,R,j)/Y;const Z=Math.max(0,h(y,A,C,R,j)/Y-_[w]**2),K=Math.max(0,h(m,A,C,R,j)/Y-S[w]**2),$=h(b,A,C,R,j)/Y-_[w]*S[w],V=Math.hypot(Z-K,2*$);G[w]=.5*Math.atan2(2*$,Z-K)*180/Math.PI,T[w]=J(V/(Z+K+1),0,1);const lt=Y/((x*2+1)*(c*2+1)),le=J(t[w]*I/(n*2),0,1);P[w]=.7*lt+.3*le-.08*this.distance(this.cellPoint(w),v)/g,B.push(w)}return B.sort((w,E)=>P[E]-P[w]),{quality:P,centerX:_,centerY:S,axis:G,elongation:T,candidates:B,radius:g}}union(e,t){const i=new Uint8Array(t.length);for(let n=0;n<i.length;n+=1)i[n]=e[n]|t[n];return i}planRoute(e,t,i,n){if(this.posesFit(t,e,i,n))return[n];let s=Math.min(i.font,n.font);for(let r=0;r<9;r+=1){s=Math.max(F,s);for(const a of[...new Set([i.angle,n.angle,0])]){const l={...i,font:s},u={...l,angle:a},d={...n,font:s,angle:a},y={...n,font:s};if(!this.posesFit(t,e,i,l)||!this.posesFit(t,e,l,u)||!this.posesFit(t,e,d,y)||!this.posesFit(t,e,y,n))continue;const m=[];if(Math.abs(i.font-s)>.05&&m.push(l),Math.abs(i.angle-a)>.05&&m.push(u),this.posesFit(t,e,u,d))return m.push(d),Math.abs(n.angle-a)>.05&&m.push(y),m.push(n),m;const b=this.legalPath(e,t,u,d);if(!b)continue;let P=u,_=!0;for(let S=0;S<b.length;){let G=-1;for(let I=b.length-1;I>=S;I-=1){const x={...this.cellPoint(b[I]),font:s,angle:a};if(this.posesFit(t,e,P,x)){G=I;break}}if(G<0){_=!1;break}const T={...this.cellPoint(b[G]),font:s,angle:a};this.distance(P,T)>.5&&m.push(T),P=T,S=G+1}if(!(!_||!this.posesFit(t,e,P,d)))return this.distance(P,d)>.5&&m.push(d),Math.abs(n.angle-a)>.05&&m.push(y),m.push(n),m}if(s<=F)break;s=Math.max(F,s*.82)}return null}legalPath(e,t,i,n){const s=new Uint8Array(t.length),r=_=>{if(s[_]===0){const S={...this.cellPoint(_),font:i.font,angle:i.angle};s[_]=t[_]&&this.fitsPose(t,e,S)?1:2}return s[_]===1},a=_=>{const S=this.index(_);if(S<0)return-1;const G=S%this.width,T=Math.floor(S/this.width);for(let I=0;I<=3;I+=1)for(let g=-I;g<=I;g+=1)for(let x=-I;x<=I;x+=1){const c=G+x,h=T+g;if(c<0||h<0||c>=this.width||h>=this.height)continue;const p=c+h*this.width;if(r(p)&&this.posesFit(t,e,_,{...this.cellPoint(p),font:i.font,angle:i.angle}))return p}return-1},l=a(i),u=a(n);if(l<0||u<0)return null;const d=new Int32Array(t.length).fill(-1),y=new Int32Array(t.length);let m=0,b=0;for(y[b++]=l,d[l]=l;m<b&&d[u]<0;){const _=y[m++],S=_%this.width,G=Math.floor(_/this.width);for(const T of[S>0?_-1:-1,S+1<this.width?_+1:-1,G>0?_-this.width:-1,G+1<this.height?_+this.width:-1])T<0||d[T]>=0||!r(T)||(d[T]=_,y[b++]=T)}if(d[u]<0)return null;const P=[];for(let _=u;_!==l;_=d[_])P.push(_);return P.push(l),P.reverse(),P}glide(e,t,i){if(i<=0)return;const n=this.snapshot(t);if(!this.fitsPose(t.mask,e.text,n)){const h=this.maxFont(t.mask,e.text,t.position,t.angle);if(t.velocity={x:0,y:0},t.angleVelocity=0,h<F){t.fontVelocity=0;return}const p=Sn(t.font,t.fontVelocity,Math.min(t.target.font,h),i);t.font=Math.max(h,Math.min(t.font,p.value)),t.fontVelocity=t.font<=h?0:p.velocity;return}for(;t.route.length>1&&this.distance(n,t.route[0])<.75&&Math.abs(n.font-t.route[0].font)<.15&&Math.abs(n.angle-t.route[0].angle)<.3;)t.route.shift();const s=t.route[0]??t.target;if(this.posesFit(t.mask,e.text,n,s)&&this.distance(n,s)<.2&&Math.abs(n.font-s.font)<.05&&Math.abs(n.angle-s.angle)<.05){t.position={x:s.x,y:s.y},t.font=s.font,t.angle=s.angle,t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0,t.route.length>0&&t.route.shift(),t.route.length===0&&this.fitsPose(t.regionMask,e.text,this.snapshot(t))&&(t.mask=t.regionMask);return}const a=!this.fitsPose(t.regionMask,e.text,n)?1:yn,l=vn/a,u=wn/a,d=_n/a,y=this.distance(n,s),m=y/l,b=Math.abs(s.font-n.font)/u,P=Math.abs(s.angle-n.angle)/d,_=Math.max(m,b,P);let S=0;_===m&&y>0?S=((s.x-n.x)*t.velocity.x+(s.y-n.y)*t.velocity.y)/y/l:_===b&&b>0?S=Math.sign(s.font-n.font)*t.fontVelocity/u:P>0&&(S=Math.sign(s.angle-n.angle)*t.angleVelocity/d),S=J(S,-1,1);const G=2/(bn*a),T=J(G*G*_-2*G*S,-fi,fi),I=J(S+T*i,-1,1),g=Math.min(_,(S+I)*i/2);let x=this.lerpPose(n,s,_>0?g/_:1);if(!(g<0?this.posesFit(t.mask,e.text,n,x):this.fitsPose(t.mask,e.text,x))){const h=this.longestLegal(e.text,t.mask,n,x);if(!h){t.velocity={x:0,y:0},t.fontVelocity=0,t.angleVelocity=0;return}x=h}const c=i>0?1/i:0;t.position={x:x.x,y:x.y},t.velocity={x:(x.x-n.x)*c,y:(x.y-n.y)*c},t.font=x.font,t.fontVelocity=(x.font-n.font)*c,t.angle=x.angle,t.angleVelocity=(x.angle-n.angle)*c}collect(e){const t=[];for(const s of this.tracks.values()){const r=s.placement?[s.placement,...s.ghosts]:s.ghosts;for(const a of r)a.opacity<.015||this.fitsPose(a.mask,s.text,this.snapshot(a))&&t.push({track:s,placement:a})}t.sort((s,r)=>r.track.area-s.track.area);const i=[],n=[];for(const s of t){const{track:r,placement:a}=s,l=i.some(d=>d.track!==r&&this.overlaps(r.text,this.snapshot(a),d.track.text,this.snapshot(d.placement)));a.collisionOpacity=ke(a.collisionOpacity,l?0:1,e,l?.3:.7),l||i.push(s);const u=a.opacity*a.collisionOpacity;u<.015||n.push({id:a.id,kind:r.kind,text:r.text,x:a.position.x,y:a.position.y,width:this.boxWidth(r.text,a.font,re(a.font)),height:a.font*Pt,opacity:u,fontSize:a.font,letterSpacing:re(a.font),angle:a.angle})}return n}relight(e,t,i){const n=e.placement;if(n){const s=this.snapshot(n);if(this.fitsPose(n.mask,e.text,s)&&this.overlaps(e.text,s,e.text,t)){n.target=s,n.route=[],n.velocity={x:0,y:0},n.fontVelocity=0,n.angleVelocity=0,n.regionMask=i;return}n.alive=!1,e.ghosts.push(n)}e.placement=this.spawn(t,i)}release(e){e.placement&&(e.placement.alive=!1,e.ghosts.push(e.placement)),e.placement=null}spawn(e,t){return{id:this.nextPlacementId++,position:{x:e.x,y:e.y},velocity:{x:0,y:0},font:e.font,fontVelocity:0,angle:e.angle,angleVelocity:0,target:{...e},opacity:0,collisionOpacity:1,mask:t,regionMask:t,alive:!0,route:[]}}smooth(e,t,i){if(!e.soft||e.soft.length!==t.length){e.soft=Float32Array.from(t);return}const n=1-Math.exp(-i/xn),s=e.soft;for(let r=0;r<t.length;r+=1)s[r]+=(t[r]-s[r])*n}allowedMask(e){const t=new Uint8Array(this.width*this.height);for(const i of e.cells)t[i]=1;return t}components(e){const t=new Uint8Array(e.length),i=new Int32Array(e.length),n=[];for(let s=0;s<e.length;s+=1){if(t[s])continue;const r=n.length,a=e[s]<0?-1:1,l=[];let u=0,d=0,y=this.width,m=this.height,b=0,P=0;const _=[s];for(t[s]=1;_.length;){const I=_.pop();l.push(I),i[I]=r;const g=I%this.width,x=Math.floor(I/this.width);u+=g+.5,d+=x+.5,y=Math.min(y,g),m=Math.min(m,x),b=Math.max(b,g+1),P=Math.max(P,x+1);for(const c of this.neighbors(I))t[c]||(e[c]<0?-1:1)!==a||(t[c]=1,_.push(c))}const S=l.length/e.length;let G=null,T="hole";a>0?S>=un?(G="continent",T="place"):S>=cn&&(G="island",T="place"):b-y>this.width*ci&&P-m>this.height*ci||y===0||m===0||b===this.width||P===this.height?T="sea":S>=ln&&(G="lake",T="place"),n.push({sign:a,area:l.length,cells:l,kind:G,role:T,center:{x:u/l.length/this.width,y:d/l.length/this.height},bounds:{x0:y/this.width,y0:m/this.height,x1:b/this.width,y1:P/this.height}})}for(const s of n){if(s.kind!=="lake")continue;const r=new Map;let a=0;for(const l of s.cells)for(const u of this.neighbors(l)){const d=i[u];n[d].sign<0||(r.set(d,(r.get(d)??0)+1),a+=1)}(a===0||Math.max(...r.values())*5<a*4)&&(s.kind=null,s.role="sea")}return n}remember(e){this.distanceFields.set(e,this.depth(e)),this.prefixFields.set(e,this.prefix(e))}depth(e){const t=new Int16Array(e.length).fill(-1),i=new Int32Array(e.length);let n=0;for(let s=0;s<e.length;s+=1){const r=s%this.width,a=Math.floor(s/this.width);(!e[s]||r===0||a===0||r===this.width-1||a===this.height-1)&&(t[s]=0,i[n++]=s)}for(let s=0;s<n;s+=1){const r=i[s],a=r%this.width,l=Math.floor(r/this.width);for(const u of[a>0?r-1:-1,a+1<this.width?r+1:-1,l>0?r-this.width:-1,l+1<this.height?r+this.width:-1])u<0||t[u]>=0||(t[u]=t[r]+1,i[n++]=u)}return t}prefix(e){const t=this.width+1,i=new Int32Array(t*(this.height+1));for(let n=0;n<this.height;n+=1){let s=0;for(let r=0;r<this.width;r+=1)s+=e[r+n*this.width],i[(n+1)*t+r+1]=i[n*t+r+1]+s}return i}maxFont(e,t,i,n){if(!this.fits(e,t,i,F,re(F),n))return 0;if(this.fits(e,t,i,ne,re(ne),n))return ne;let s=F,r=ne;for(let a=0;a<8;a+=1){const l=(s+r)/2;this.fits(e,t,i,l,re(l),n)?s=l:r=l}return s}fitsPose(e,t,i){return Math.abs(i.angle)<=se&&this.fits(e,t,i,i.font,re(i.font),i.angle)}posesFit(e,t,i,n){if(!this.fitsPose(e,t,i)||!this.fitsPose(e,t,n))return!1;const s=Math.max(1,Math.ceil(Math.max(this.distance(i,n)/4,Math.abs(i.font-n.font),Math.abs(i.angle-n.angle)/2)));for(let r=1;r<s;r+=1)if(!this.fitsPose(e,t,this.lerpPose(i,n,r/s)))return!1;return!0}longestLegal(e,t,i,n){if(!this.fitsPose(t,e,i))return null;let s=0,r=1;for(let a=0;a<8;a+=1){const l=(s+r)/2;this.posesFit(t,e,i,this.lerpPose(i,n,l))?s=l:r=l}return s<=0?null:this.lerpPose(i,n,s)}fits(e,t,i,n,s,r){if(e.length!==this.width*this.height||this.width<2||this.height<2)return!1;const a=Math.min(this.viewport.width/this.width,this.viewport.height/this.height),l=Math.max(fn,a*1.25),u=this.boxWidth(t,n,s)/2+l,d=n*Pt/2+l,y=r*Math.PI/180,m=Math.cos(y),b=Math.sin(y),P=Math.abs(u*m)+Math.abs(d*b),_=Math.abs(u*b)+Math.abs(d*m);if(i.x-P<0||i.y-_<0||i.x+P>this.viewport.width||i.y+_>this.viewport.height)return!1;const S=this.prefixFields.get(e);if(S){const c=Math.floor((i.x-P)*this.width/this.viewport.width),h=Math.floor((i.y-_)*this.height/this.viewport.height),p=Math.min(this.width,Math.ceil((i.x+P)*this.width/this.viewport.width)),v=Math.min(this.height,Math.ceil((i.y+_)*this.height/this.viewport.height)),B=this.width+1;if(S[v*B+p]-S[h*B+p]-S[v*B+c]+S[h*B+c]===(p-c)*(v-h))return!0}const G=this.distanceFields.get(e),T=this.index(i);if(G&&T>=0){const c=Math.min(this.viewport.width/this.width,this.viewport.height/this.height);if(Math.max(0,(G[T]-2)*c/Math.SQRT2)>=Math.hypot(u,d))return!0}const I=Math.max(1,Math.min(this.viewport.width/this.width,this.viewport.height/this.height)*.25),g=Math.max(2,Math.ceil(u*2/I)),x=Math.max(2,Math.ceil(d*2/I));for(let c=0;c<=x;c+=1){const h=-d+c*d*2/x;for(let p=0;p<=g;p+=1){const v=-u+p*u*2/g,B=Math.floor((i.x+v*m-h*b)*this.width/this.viewport.width),w=Math.floor((i.y+v*b+h*m)*this.height/this.viewport.height);if(B<0||w<0||B>=this.width||w>=this.height||!e[B+w*this.width])return!1}}return!0}overlaps(e,t,i,n){const s=(l,u)=>{const d=u.angle*Math.PI/180,y=this.boxWidth(l,u.font,re(u.font))/2+7,m=u.font*Pt/2+7;return{x:Math.abs(y*Math.cos(d))+Math.abs(m*Math.sin(d)),y:Math.abs(y*Math.sin(d))+Math.abs(m*Math.cos(d))}},r=s(e,t),a=s(i,n);return Math.abs(t.x-n.x)<r.x+a.x&&Math.abs(t.y-n.y)<r.y+a.y}applyViewport(e){const t=this.viewport;if(t.width>1&&t.height>1&&(t.width!==e.width||t.height!==e.height)){const i=e.width/t.width,n=e.height/t.height,s=(i+n)/2;for(const r of this.tracks.values()){r.styleFont=J(r.styleFont*s,F,ne);const a=r.placement?[r.placement,...r.ghosts]:r.ghosts;for(const l of a)this.scalePlacement(l,i,n,s)}}this.viewport=e}scalePlacement(e,t,i,n){e.position={x:e.position.x*t,y:e.position.y*i},e.velocity={x:e.velocity.x*t,y:e.velocity.y*i},e.font=J(e.font*n,F,ne),e.fontVelocity*=n,e.target={x:e.target.x*t,y:e.target.y*i,font:J(e.target.font*n,F,ne),angle:e.target.angle},e.route=e.route.map(s=>({x:s.x*t,y:s.y*i,font:J(s.font*n,F,ne),angle:s.angle}))}regrid(e,t,i,n,s){const r=new e.constructor(n*s);if(e.length!==t*i||t<1||i<1)return r;for(let a=0;a<s;a+=1)for(let l=0;l<n;l+=1)r[l+a*n]=e[Math.min(t-1,Math.floor((l+.5)*t/n))+Math.min(i-1,Math.floor((a+.5)*i/s))*t];return r}regridFloat(e,t,i,n,s){const r=new Float32Array(n*s);if(e.length!==t*i||t<1||i<1)return r;for(let a=0;a<s;a+=1)for(let l=0;l<n;l+=1)r[l+a*n]=e[Math.min(t-1,Math.floor((l+.5)*t/n))+Math.min(i-1,Math.floor((a+.5)*i/s))*t];return r}neighbors(e){const t=e%this.width,i=Math.floor(e/this.width);return[(t+1)%this.width+i*this.width,(t-1+this.width)%this.width+i*this.width,t+(i+1)%this.height*this.width,t+(i-1+this.height)%this.height*this.width]}snapshot(e){return{x:e.position.x,y:e.position.y,font:e.font,angle:e.angle}}lerpPose(e,t,i){return{x:Qe(e.x,t.x,i),y:Qe(e.y,t.y,i),font:Qe(e.font,t.font,i),angle:Qe(e.angle,t.angle,i)}}index(e){const t=Math.floor(e.x*this.width/this.viewport.width),i=Math.floor(e.y*this.height/this.viewport.height);return t>=0&&t<this.width&&i>=0&&i<this.height?t+i*this.width:-1}cellPoint(e){return{x:(e%this.width+.5)*this.viewport.width/this.width,y:(Math.floor(e/this.width)+.5)*this.viewport.height/this.height}}distance(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}boxWidth(e,t,i){const n=e.startsWith("Lake ");if(!this.measure)return e.length*(t*(n?.58:.56)+i)+4;const s=n?`i:${e}`:e;let r=this.textMetrics.get(s);return r===void 0&&(this.measure.font=`${n?"italic ":""}500 100px ${Pn}`,this.measure.fontKerning="none",r=this.measure.measureText(e).width/100,this.textMetrics.set(s,r)),r*t+e.length*i+4}}const zn=.6,Gn=(o,e,t,i=!1)=>{if(!o||i)return{from:null,to:e,progress:1};if(o.from===null)return e===o.to?o:{from:o.to,to:e,progress:0};const n=Number.isFinite(t)?Math.max(0,t):0,s=Math.min(1,o.progress+n/zn);return s<1-1e-9?{...o,progress:s}:e===o.to?{from:null,to:e,progress:1}:{from:o.to,to:e,progress:0}},En=o=>{const e=o.from===null?1:o.progress**2*(3-2*o.progress);return{previous:o.from,current:o.to,previousOpacity:1-e,currentOpacity:e}},Tn=(o,e,t,i,n,s,r=ge.temperatureDuration)=>{if(i<=0)return o;const a=e<0?n:s,l=Math.min(1,Math.max(0,t)/r),u=Math.min(1,(Math.max(0,t)+i)/r);if(u>=1)return a;const d=y=>(1-y)**2*(1+2*y);return Math.max(n,Math.min(s,a+(o-a)*d(u)/d(l)))},An=(o,e,t,i)=>({freeze:e>t?Math.max(0,Math.min(1,(e-o)/(e-t))):0,heat:e<i?Math.max(0,Math.min(1,(o-e)/(i-e))):0}),gi=2/Math.log(1+Math.sqrt(2)),pi=30,St=40,Cn=45,O=o=>{const e=document.getElementById(o);if(!e)throw new Error(`Missing #${o}`);return e},H=O("field"),Me=O("scale"),Pe=O("temperature"),Bt=O("time-speed"),Je=O("brush-size"),mi=O("show-labels"),Un=O("scale-value"),kn=O("temperature-value"),Rn=O("time-speed-value"),On=O("brush-size-value"),Oe=O("settings-toggle"),Ne=O("settings-panel"),Ze=O("pause"),Nn=O("restart"),Ln=O("clear-blue"),It=O("rough"),zt=O("smooth"),Gt=O("scale-dock"),Fn=O("scale-readout"),et=O("cool"),tt=O("heat"),Et=O("phase"),Tt=O("magnetization"),At=O("energy"),st=O("fatal-error"),bi=O("place-labels");async function Vn(){const o=await Li();if(!o){st.hidden=!1,st.textContent="This experiment requires a browser with WebGPU enabled.";return}const e=Ni(window.location.search),t=yi(e);document.documentElement.style.setProperty("--hot",ei(e.terrainColor)),document.documentElement.style.setProperty("--cold",ei(e.waterColor));const i=new Di(o.device,o.format,H,e);let n=Number(Pe.value),s=n,r=Number(Me.value),a=r,l=Number(Bt.value),u=Number(Je.value),d=!1,y=!1,m=!1,b=0,P=!1,_=!1,S=0,G=0,T=null,I=!0,g=0,x=0,c=performance.now(),h=0,p=!1,v=0;const B=new Map;let w=!1,E=0,k=r,A=!1,C=!1,R=0,j=0,Y=!1,Z=0;const K=new In,$=new Map,V=new Map,lt=window.matchMedia("(prefers-reduced-motion: reduce)"),le=new Map,Fe=new Map,Ve=new Map;let Ie=null,ct=0;const De=new Map,ut=new Set,ht=new Set,dt=new Set,ft=new Set,Lt=gi+.2,qe=Number(Me.min),he=Number(Me.max),Ft=Number(Pe.min),Vt=Number(Pe.max),Ai=.75;let ze=0,gt=0;const Ci=(he-qe)/2.2,Dt=Math.ceil((St-1)/2),Ui=()=>{const f=Math.max(1,window.innerWidth),M=Math.max(1,window.innerHeight),U=f<=720?Math.min(window.devicePixelRatio||1,2):1,N=Math.min(o.device.limits.maxTextureDimension2D/f,o.device.limits.maxTextureDimension2D/M),z=Math.sqrt(Number(o.device.limits.maxStorageBufferBindingSize)/4/(f*M)),W=Math.max(.25,Math.min(U,N,z)),te=Math.max(1,Math.round(f*W)),we=Math.max(1,Math.round(M*W));return{density:te/f,width:te,height:we}},pt=f=>{const M=Math.min(i.width,i.height)/65.64;return Math.max(0,Math.round((2**f-1)*M))},Ye=()=>pt(r)*2+1,ki=()=>{const f=Math.min(i.width,i.height)/65.64;if(f<=0)return he;let M=Math.log2(1+Math.max(0,(Dt-.5)/f));for(M=Math.min(he,Math.max(qe,M));M<he&&pt(M)<Dt;)M=Math.min(he,M+.01);return M},Ge=()=>{const f=Ye(),M=f===1?"1 spin":`${f} × ${f}`;Me.value=r.toFixed(2),Gt.value=r.toFixed(2),Un.textContent=M,Fn.textContent=M,It.setAttribute("aria-label",`Rough, observation scale ${r.toFixed(2)}`),zt.setAttribute("aria-label",`Smooth, observation scale ${r.toFixed(2)}`),document.documentElement.style.setProperty("--noise-opacity",(.12*(1-r/3)**2).toFixed(3))},Ee=()=>{Pe.value=n.toFixed(2),kn.textContent=`T = ${n.toFixed(2)}`;const f=An(n,s,Ft,Vt);et.style.setProperty("--paddle-progress",f.freeze.toFixed(4)),tt.style.setProperty("--paddle-progress",f.heat.toFixed(4)),et.setAttribute("aria-label",`Cool, current temperature ${n.toFixed(2)}`),tt.setAttribute("aria-label",`Heat, current temperature ${n.toFixed(2)}`);const M=n-gi;M<-.2?Et.textContent="ordered":M>.2?Et.textContent="disordered":Et.textContent="critical"},qt=()=>{const f=Number.isInteger(l)?0:1;Rn.textContent=`${l.toFixed(f)}×`},mt=()=>{Je.value=String(u),On.textContent=`${u} px`},Ri=()=>({active:_&&!w&&!C,painting:m,fallbackSpin:b,inverted:P,x:S,y:G,radius:u/2}),xe=()=>{const f=Ye(),M=(f-1)/2,U=f===1?0:.14*(1-r/3)**2;i.draw(r,M,U,R,Ri()),I=!1},Yt=()=>{j+=1,K.reset(),Ie=null,le.clear(),Fe.clear(),Ve.clear(),De.clear(),V.clear(),$t([],0)},$t=(f,M)=>{const U=new Set,N={width:H.clientWidth,height:H.clientHeight};for(const z of f){if(U.add(z.id),Ie&&De.get(z.id)!==ct){const ee=Xi(z,Ie,N,t);le.set(z.id,Hi(le.get(z.id),ee)),De.set(z.id,ct)}const W=ji(Fe.get(z.id),le.get(z.id)?.mode??"dark",M);Fe.set(z.id,W);const te=Ki(W),we=Yi(z.kind,W.from,W.to,te.blend,t),Ae=le.get(z.id),Ce=Ae?.[W.from==="dark"?"darkOpacity":"lightOpacity"]??1,xt=Ae?.[W.to==="dark"?"darkOpacity":"lightOpacity"]??1,D=Ce+(xt-Ce)*te.blend,de=Wi(Ve.get(z.id),D,M);Ve.set(z.id,de);const ie=Bn(z),Qt=Gn(V.get(z.id),z.text,M,lt.matches);V.set(z.id,Qt);const fe=En(Qt);let ce=$.get(z.id);for(ce||(ce=[],$.set(z.id,ce));ce.length<ie.length;){const ee=document.createElement("span");ee.className="place-label";const X=document.createElement("span");X.className="place-label-text",ee.append(X),bi.append(ee),ce.push({node:ee,current:X,previous:null})}for(;ce.length>ie.length;)ce.pop()?.node.remove();for(let ee=0;ee<ie.length;ee+=1){const X=ce[ee],{node:ue,current:vt}=X,Jt=ie[ee];ue.dataset.kind!==z.kind&&(ue.dataset.kind=z.kind),vt.textContent!==fe.current&&(vt.textContent=fe.current),vt.style.opacity=fe.currentOpacity.toFixed(3),fe.previous!==null?(X.previous||(X.previous=document.createElement("span"),X.previous.className="place-label-text place-label-text-previous",X.previous.setAttribute("aria-hidden","true"),ue.prepend(X.previous)),X.previous.textContent!==fe.previous&&(X.previous.textContent=fe.previous),X.previous.style.opacity=fe.previousOpacity.toFixed(3)):X.previous&&(X.previous.remove(),X.previous=null),ue.style.color=we,ue.style.opacity=(z.opacity*de.value).toFixed(4),ue.style.fontSize=`${z.fontSize.toFixed(2)}px`,ue.style.letterSpacing=`${z.letterSpacing.toFixed(2)}px`,ue.style.transform=`translate(${Jt.x.toFixed(2)}px, ${Jt.y.toFixed(2)}px) rotate(${z.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[z,W]of $)if(!U.has(z)){for(const{node:te}of W)te.remove();$.delete(z),V.delete(z),le.delete(z),Fe.delete(z),Ve.delete(z),De.delete(z)}},Xt=(f=!0)=>{const M=Ui();if(i.resize(M.width,M.height,M.density,f),!f){const U=Math.min(i.width,i.height)/65.64,N=(Cn-1)/2;r=Math.max(qe,Math.min(he,Math.log2(1+N/U))),a=r}Ge(),I=!0,xe(),v+=1,j+=1,Ie=null},$e=f=>{const M=H.getBoundingClientRect(),U=(f.clientX-M.left)/M.width,N=(f.clientY-M.top)/M.height;return U<0||U>=1||N<0||N>=1?null:(S=f.clientX-M.left,G=f.clientY-M.top,{x:U*i.width,y:N*i.height})},ve=f=>{const M=f.metaKey||f.ctrlKey;P!==M&&(P=M,I=!0)},Xe=(f,M)=>{ve(f);const U=$e(f);if(!U){T=null;return}const N=T??U;i.paintSegment(N.x,N.y,U.x,U.y,u*i.density/2,M,b,P),T=U,I=!0},bt=f=>{m=!0,T=null,Xe(f,!0)},Ht=()=>{const f=[...B.values()];return f.length<2?0:Math.hypot(f[1].x-f[0].x,f[1].y-f[0].y)},Te=()=>{if(p)return;p=!0;const f=v;i.readStats().then(M=>{if(f!==v)return;Tt.textContent=M.magnetization.toFixed(3),At.textContent=M.energy.toFixed(3);const U=Math.abs(M.visibleMagnetization)===1?-M.visibleMagnetization:0;!m&&b!==U&&(b=U,I=!0)}).catch(M=>{console.warn("Could not read Ising statistics.",M)}).finally(()=>{p=!1})},Wt=f=>{r=f,a=r,Ge(),I=!0};Me.addEventListener("input",()=>Wt(Number(Me.value))),Gt.addEventListener("input",()=>Wt(Number(Gt.value))),Pe.addEventListener("input",()=>{s=Number(Pe.value),n=s,ze=0,Ee()});const He=(f,M)=>{const U=()=>{f.setAttribute("aria-pressed",String(M.size>0))},N=z=>{M.delete(`pointer:${z.pointerId}`),f.hasPointerCapture(z.pointerId)&&f.releasePointerCapture(z.pointerId),U()};f.addEventListener("pointerdown",z=>{z.pointerType==="mouse"&&z.button!==0||(z.preventDefault(),f.setPointerCapture(z.pointerId),M.add(`pointer:${z.pointerId}`),U())}),f.addEventListener("pointerup",N),f.addEventListener("pointercancel",N),f.addEventListener("lostpointercapture",z=>{M.delete(`pointer:${z.pointerId}`),U()}),f.addEventListener("keydown",z=>{z.code!=="Space"&&z.code!=="Enter"||(z.preventDefault(),M.add(`key:${z.code}`),U())}),f.addEventListener("keyup",z=>{z.code!=="Space"&&z.code!=="Enter"||(z.preventDefault(),M.delete(`key:${z.code}`),U())}),f.addEventListener("blur",()=>{for(const z of M)z.startsWith("key:")&&M.delete(z);U()})};He(It,ut),He(zt,ht),He(et,dt),He(tt,ft),Bt.addEventListener("input",()=>{l=Number(Bt.value),qt()}),Je.addEventListener("input",()=>{u=Number(Je.value),mt(),I=!0});const jt=()=>{bi.hidden=!mi.checked};mi.addEventListener("change",jt),jt(),window.addEventListener("keyup",ve),window.addEventListener("keydown",f=>{ve(f),!(f.code!=="BracketLeft"&&f.code!=="BracketRight")&&(f.preventDefault(),u=Math.max(4,Math.min(100,u+(f.code==="BracketLeft"?-4:4))),mt(),I=!0)});const yt=f=>{y=f,Ne.classList.toggle("is-closed",!y),Ne.inert=!y,Ne.setAttribute("aria-hidden",String(!y)),Oe.setAttribute("aria-expanded",String(y)),Oe.setAttribute("aria-label",y?"Close settings":"Open settings")};Oe.addEventListener("click",()=>yt(!y)),document.addEventListener("pointerdown",f=>{const M=f.target;!y||!(M instanceof Node)||Ne.contains(M)||Oe.contains(M)||yt(!1)},{capture:!0}),document.addEventListener("click",f=>{const M=f.target;!y||!(M instanceof Node)||Oe.contains(M)||Ne.contains(M)||yt(!1)}),Ze.addEventListener("click",()=>{d=!d;const f=d?"Resume simulation":"Pause simulation";Ze.setAttribute("aria-pressed",String(d)),Ze.setAttribute("aria-label",f),Ze.title=f,g=0}),Nn.addEventListener("click",()=>{i.randomize(),b=0,g=0,v+=1,Yt(),Tt.textContent="0.000",At.textContent="0.000",I=!0,xe(),Te()}),Ln.addEventListener("click",()=>{i.clearBlue(),b=1,g=0,v+=1,Yt(),Tt.textContent="1.000",At.textContent="-2.000",I=!0,xe(),Te()}),H.addEventListener("contextmenu",f=>f.preventDefault()),H.addEventListener("pointerdown",f=>{if(ve(f),!!$e(f)){if(H.setPointerCapture(f.pointerId),_=!0,f.pointerType==="touch"){B.set(f.pointerId,{x:f.clientX,y:f.clientY}),B.size===1?(A=!0,C=!1):B.size===2&&(m=!1,T=null,A=!1,C=!0,w=!0,E=Ht(),k=a),I=!0;return}bt(f)}}),H.addEventListener("pointermove",f=>{if(ve(f),$e(f),_=!0,I=!0,f.pointerType==="touch"){if(!B.has(f.pointerId))return;if(B.set(f.pointerId,{x:f.clientX,y:f.clientY}),w&&B.size>=2){const M=Ht();E>0&&M>0&&(a=Math.max(0,Math.min(3,k-Math.log2(M/E)*.9)));return}if(B.size===1&&!C){if(A)bt(f),A=!1;else if(m)for(const M of f.getCoalescedEvents())Xe(M,!1)}return}if(m){const M=f.getCoalescedEvents();if(M.length===0)Xe(f,!1);else for(const U of M)Xe(U,!1)}});const Oi=f=>{f.pointerType==="touch"&&(A&&!C&&bt(f),B.delete(f.pointerId),B.size<2&&(w=!1),B.size===0&&(A=!1,C=!1,_=!1)),m=!1,T=null,H.hasPointerCapture(f.pointerId)&&H.releasePointerCapture(f.pointerId),I=!0,xe(),Te()};H.addEventListener("pointerup",Oi),H.addEventListener("pointercancel",f=>{B.delete(f.pointerId),m=!1,_=!1,T=null,A=!1,w=!1,I=!0}),H.addEventListener("pointerenter",f=>{ve(f),_=!0,I=!0}),H.addEventListener("pointerleave",()=>{m||(_=!1,I=!0)}),H.addEventListener("wheel",f=>{f.preventDefault();const M=Math.max(-120,Math.min(120,f.deltaY));a=Math.max(0,Math.min(3,a+M*.00125)),$e(f),_=!0},{passive:!1}),window.addEventListener("blur",()=>{P=!1,m=!1,_=!1,T=null,B.clear(),w=!1,A=!1,ut.clear(),ht.clear(),dt.clear(),ft.clear(),ze=0,gt=0,It.setAttribute("aria-pressed","false"),zt.setAttribute("aria-pressed","false"),et.setAttribute("aria-pressed","false"),tt.setAttribute("aria-pressed","false"),I=!0}),window.addEventListener("resize",()=>Xt(!0)),Xt(!1),i.step(n,40),Ee(),qt(),mt(),I=!0,xe(),Te();const Kt=f=>{const M=Math.max(0,(f-c)/1e3),U=Math.min(.1,M);c=f;const N=+(ht.size>0)-+(ut.size>0);if(N!==0){const D=N<0?qe:he,de=N*Ci*U;r=N<0?Math.max(D,r+de):Math.min(D,r+de),a=r,Ge(),I=!0}else{const D=a-r;Math.abs(D)>5e-4?(r+=D*(1-Math.exp(-U*10)),Ge(),I=!0):r!==a&&(r=a,Ge(),I=!0)}const z=+(ft.size>0)-+(dt.size>0);if(z!==gt&&(ze=0,gt=z),z!==0)n=Tn(n,z,ze,U,Ft,Vt,e.temperatureDuration),ze+=U,Ee();else{const D=s-n;Math.abs(D)>5e-4?(n+=D*(1-Math.exp(-U/Ai)),Ee()):n!==s&&(n=s,Ee())}if(!d){g+=U*pi*l;const D=Math.min(8,Math.floor(g));D>0&&(g-=D,i.step(n,D),x+=D/pi,I=!0)}const W=Ye()>=St?1:0,te=W-R;Math.abs(te)>.001?(R+=te*(1-Math.exp(-U*7)),I=!0):R!==W&&(R=W,I=!0);const we=Ye()>=St?r:ki(),Ae=n>Lt?"chaos":"map",Ce=H.getBoundingClientRect(),xt=K.advance(Math.min(.5,M),Ae,{width:Ce.width,height:Ce.height});if($t(xt,M),I&&xe(),!Y&&Ae==="map"&&f-Z>280){Z=f,Y=!0;const D=j,de=x;i.readRegionSample(pt(we),we).then(ie=>{D!==j||!ie||n>Lt||(Ie=ie,ct+=1,K.ingest(ie,n,de))}).catch(ie=>{console.warn("Could not read Ising regions.",ie)}).finally(()=>{Y=!1})}f-h>750&&(h=f,Te()),requestAnimationFrame(Kt)};requestAnimationFrame(Kt)}Vn().catch(o=>{console.error(o),st.hidden=!1,st.textContent=o instanceof Error?o.message:"Could not start the WebGPU simulation."});
