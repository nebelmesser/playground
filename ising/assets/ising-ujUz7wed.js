(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function e(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=e(s);fetch(s.href,i)}})();async function rt(){try{if(!navigator.gpu)return null;const y=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!y)return null;const t=await y.requestDevice();return t.lost.then(e=>{console.error("WebGPU device lost:",e.message)}),t.addEventListener("uncapturederror",e=>{console.error("WebGPU:",e.error.message)}),{device:t,format:navigator.gpu.getPreferredCanvasFormat()}}catch(y){return console.error("WebGPU initialization failed.",y),null}}const ot=`struct SimParams {
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
    color = mix(color, vec3<f32>(0.29, 0.1, 0.045), relief * render_params.map_strength * 0.42);
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
`,A=(y,t)=>Math.ceil(y/t),ce=112,de=128,at=(y,t)=>y>=t?{width:ce,height:Math.max(1,Math.round(ce*t/y))}:{width:Math.max(1,Math.round(ce*y/t)),height:ce};class lt{canvas;device;width=1;height=1;density=1;context;format;pipelines;simUniform;brushUniform;statsUniform;renderUniform;blurUniforms;selectionBuffer;sampler;spinBuffers=null;currentIndex=0;fieldTexture=null;fieldViews=[];blurTextures=null;blurViews=null;statsOutput=null;statsReadback=null;regionUniform;regionStorage;regionReadback;randomGroups=[];clearGroups=[];updateGroups=[];fieldGroups=[];selectGroups=[];paintGroups=[];statsGroups=[];blurPrimaryHorizontalGroups=[];blurPrimaryVerticalGroup=null;blurSecondaryHorizontalGroup=null;blurSecondaryVerticalGroup=null;renderGroup=null;regionGroup=null;stepNumber=0;fieldDirty=!0;lastBlurRadius=-1;lastSecondaryRadius=-1;constructor(t,e,n){this.device=t,this.format=e,this.canvas=n;const s=n.getContext("webgpu");if(!s)throw new Error("Could not create a WebGPU canvas context.");this.context=s,this.context.configure({device:t,format:e,alphaMode:"opaque"});const i=t.createShaderModule({label:"Ising shaders",code:ot});this.pipelines={randomize:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"randomize"}}),clearBlue:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"clear_blue"}}),resize:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"resize_grid"}}),update:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"metropolis"}}),field:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"write_field"}}),blurSpinsHorizontal:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_spins_horizontal"}}),blurTextureHorizontal:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_horizontal"}}),blurTextureVertical:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"blur_texture_vertical"}}),select:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"select_spin"}}),paint:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"paint"}}),stats:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"reduce_stats"}}),regions:t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"sample_regions"}}),render:t.createRenderPipeline({layout:"auto",vertex:{module:i,entryPoint:"fullscreen_vertex"},fragment:{module:i,entryPoint:"field_fragment",targets:[{format:e}]},primitive:{topology:"triangle-list"}})},this.simUniform=t.createBuffer({label:"Ising simulation uniforms",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.brushUniform=t.createBuffer({label:"Ising brush uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.statsUniform=t.createBuffer({label:"Ising statistics uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.renderUniform=t.createBuffer({label:"Ising render uniforms",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.blurUniforms=[0,1].map(r=>t.createBuffer({label:`Ising blur uniforms ${r}`,size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.selectionBuffer=t.createBuffer({label:"Ising selected paint spin",size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.regionUniform=t.createBuffer({label:"Ising region uniforms",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.regionStorage=t.createBuffer({label:"Ising region sample",size:de*de*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.regionReadback=t.createBuffer({label:"Ising region readback",size:de*de*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.sampler=t.createSampler({label:"Ising field sampler",addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"})}resize(t,e,n,s=!0){if(t===this.width&&e===this.height&&this.spinBuffers){this.density=n;return}const i=this.width,r=this.height,o=this.spinBuffers,l=this.fieldTexture,u=this.blurTextures,d=this.statsOutput,m=this.statsReadback,g=o?.[this.currentIndex]??null;if(this.width=t,this.height=e,this.density=n,this.currentIndex=0,this.canvas.width=t,this.canvas.height=e,this.allocateResources(),s&&g){this.writeSimParams(this.randomSeed(),this.stepNumber,0,0,i,r);const a=this.device.createBindGroup({label:"Ising resize bind group",layout:this.pipelines.resize.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:g}},{binding:1,resource:{buffer:this.currentBuffer}},{binding:2,resource:{buffer:this.simUniform}}]}),c=this.device.createCommandEncoder({label:"Resize Ising grid"}),h=c.beginComputePass();h.setPipeline(this.pipelines.resize),h.setBindGroup(0,a),h.dispatchWorkgroups(A(t,8),A(e,8)),h.end(),this.device.queue.submit([c.finish()])}else this.randomize();o&&this.retire({buffers:[o[0],o[1],...d?[d]:[]],readback:m??void 0,textures:[l,...u??[]].filter(a=>!!a)}),this.fieldDirty=!0,this.lastBlurRadius=-1,this.lastSecondaryRadius=-1}randomize(){this.stepNumber=0,this.writeSimParams(this.randomSeed(),0,0,0);const t=this.device.createCommandEncoder({label:"Randomize Ising state"}),e=t.beginComputePass();e.setPipeline(this.pipelines.randomize),e.setBindGroup(0,this.randomGroups[this.currentIndex]),e.dispatchWorkgroups(A(this.width,8),A(this.height,8)),e.end(),this.device.queue.submit([t.finish()]),this.fieldDirty=!0}clearBlue(){this.stepNumber=0,this.writeSimParams(0,0,0,0);const t=this.device.createCommandEncoder({label:"Clear Ising state to blue"}),e=t.beginComputePass();e.setPipeline(this.pipelines.clearBlue),e.setBindGroup(0,this.clearGroups[this.currentIndex]),e.dispatchWorkgroups(A(this.width,8),A(this.height,8)),e.end(),this.device.queue.submit([t.finish()]),this.fieldDirty=!0}step(t,e){for(let n=0;n<e;n+=1){const s=this.stepNumber&1;this.writeSimParams(this.randomSeed(),this.stepNumber,t,s);const i=this.device.createCommandEncoder({label:"Advance Ising state"}),r=i.beginComputePass();r.setPipeline(this.pipelines.update),r.setBindGroup(0,this.updateGroups[this.currentIndex]),r.dispatchWorkgroups(A(this.width,8),A(this.height,8)),r.end(),this.device.queue.submit([i.finish()]),this.currentIndex=1-this.currentIndex,this.stepNumber+=1}e>0&&(this.fieldDirty=!0)}paintSegment(t,e,n,s,i,r,o){const l=Math.floor(Math.min(t,n)-i),u=Math.floor(Math.min(e,s)-i),d=Math.ceil(Math.max(t,n)+i),m=Math.ceil(Math.max(e,s)+i),g=d-l+1,a=m-u+1;this.writeBrushParams(l,u,g,a,t,e,n,s,i,o);const c=this.device.createCommandEncoder({label:"Paint Ising spins"});if(r){const p=c.beginComputePass();p.setPipeline(this.pipelines.select),p.setBindGroup(0,this.selectGroups[this.currentIndex]),p.dispatchWorkgroups(1),p.end()}const h=c.beginComputePass();h.setPipeline(this.pipelines.paint),h.setBindGroup(0,this.paintGroups[this.currentIndex]),h.dispatchWorkgroups(A(g,8),A(a,8)),h.end(),this.device.queue.submit([c.finish()]),this.fieldDirty=!0}draw(t,e,n,s,i){if(!this.renderGroup||!this.blurPrimaryVerticalGroup||!this.blurSecondaryHorizontalGroup||!this.blurSecondaryVerticalGroup)return;const r=t>1?Math.max(1,Math.round(e*.45)):0,o=this.fieldDirty||e!==this.lastBlurRadius||r!==this.lastSecondaryRadius,l=this.device.createCommandEncoder({label:"Render Ising field"});if(this.fieldDirty){this.writeSimParams(0,this.stepNumber,0,0);const d=l.beginComputePass();d.setPipeline(this.pipelines.field),d.setBindGroup(0,this.fieldGroups[this.currentIndex]),d.dispatchWorkgroups(A(this.width,8),A(this.height,8)),d.end(),this.fieldDirty=!1}if(o){this.writeBlurParams(this.blurUniforms[0],e),this.writeBlurParams(this.blurUniforms[1],r);const d=l.beginComputePass({label:"Horizontal Ising observation blur"});d.setPipeline(this.pipelines.blurSpinsHorizontal),d.setBindGroup(0,this.blurPrimaryHorizontalGroups[this.currentIndex]),d.dispatchWorkgroups(A(this.height,64)),d.end();const m=l.beginComputePass({label:"Vertical Ising observation blur"});if(m.setPipeline(this.pipelines.blurTextureVertical),m.setBindGroup(0,this.blurPrimaryVerticalGroup),m.dispatchWorkgroups(A(this.width,64)),m.end(),r>0){const g=l.beginComputePass({label:"Secondary horizontal Ising blur"});g.setPipeline(this.pipelines.blurTextureHorizontal),g.setBindGroup(0,this.blurSecondaryHorizontalGroup),g.dispatchWorkgroups(A(this.height,64)),g.end();const a=l.beginComputePass({label:"Secondary vertical Ising blur"});a.setPipeline(this.pipelines.blurTextureVertical),a.setBindGroup(0,this.blurSecondaryVerticalGroup),a.dispatchWorkgroups(A(this.width,64)),a.end()}this.lastBlurRadius=e,this.lastSecondaryRadius=r}this.writeRenderParams(t,e,n,s,i);const u=l.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.035,g:.043,b:.063,a:1},loadOp:"clear",storeOp:"store"}]});u.setPipeline(this.pipelines.render),u.setBindGroup(0,this.renderGroup),u.draw(3),u.end(),this.device.queue.submit([l.finish()])}async readRegionSample(){const t=this.regionGroup;if(!t||this.regionReadback.mapState!=="unmapped")return null;const e=at(this.width,this.height),n=e.width*e.height;if(n*4>this.regionStorage.size)return null;this.device.queue.writeBuffer(this.regionUniform,0,new Uint32Array([e.width,e.height,0,0]));const s=this.device.createCommandEncoder({label:"Read Ising regions"}),i=s.beginComputePass();i.setPipeline(this.pipelines.regions),i.setBindGroup(0,t),i.dispatchWorkgroups(A(e.width,8),A(e.height,8)),i.end(),s.copyBufferToBuffer(this.regionStorage,0,this.regionReadback,0,n*4),this.device.queue.submit([s.finish()]),await this.regionReadback.mapAsync(GPUMapMode.READ);try{const r=new Int32Array(this.regionReadback.getMappedRange(),0,n),o=new Int8Array(n);for(let l=0;l<n;l+=1)o[l]=r[l]<0?-1:1;return{width:e.width,height:e.height,signs:o}}finally{this.regionReadback.unmap()}}async readStats(){const t=this.statsOutput,e=this.statsReadback,n=this.statsGroups[this.currentIndex];if(!t||!e||!n)return{energy:0,magnetization:0,signedMagnetization:0};const s=A(this.width,16),i=A(this.height,16),r=new Uint32Array([this.width,this.height,s,0]);this.device.queue.writeBuffer(this.statsUniform,0,r);const o=this.device.createCommandEncoder({label:"Read Ising statistics"});o.clearBuffer(t);const l=o.beginComputePass();l.setPipeline(this.pipelines.stats),l.setBindGroup(0,n),l.dispatchWorkgroups(s,i),l.end(),o.copyBufferToBuffer(t,0,e,0,8),this.device.queue.submit([o.finish()]),await e.mapAsync(GPUMapMode.READ);const u=new Int32Array(e.getMappedRange()),d=u[0],m=u[1];e.unmap();const g=this.width*this.height;return{magnetization:Math.abs(d/g),signedMagnetization:d/g,energy:m/g}}get currentBuffer(){if(!this.spinBuffers)throw new Error("Ising grid has not been allocated.");return this.spinBuffers[this.currentIndex]}allocateResources(){const t=this.width*this.height*4;this.spinBuffers=[0,1].map(e=>this.device.createBuffer({label:`Ising spin buffer ${e}`,size:t,usage:GPUBufferUsage.STORAGE})),this.fieldTexture=this.device.createTexture({label:"Ising microscopic field",size:{width:this.width,height:this.height},format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.fieldViews=[this.fieldTexture.createView()],this.blurTextures=[0,1].map(e=>this.device.createTexture({label:`Ising full-resolution blur ${e}`,size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})),this.blurViews=this.blurTextures.map(e=>e.createView()),this.statsOutput=this.device.createBuffer({label:"Ising statistics accumulator",size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this.statsReadback=this.device.createBuffer({label:"Ising statistics readback",size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.createBindGroups()}createBindGroups(){if(!this.spinBuffers||!this.fieldTexture||!this.blurViews||!this.statsOutput)return;const t=this.fieldTexture.createView();this.randomGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.randomize.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:this.simUniform}}]})),this.clearGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.clearBlue.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:this.simUniform}}]})),this.updateGroups=[0,1].map(e=>this.device.createBindGroup({layout:this.pipelines.update.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.spinBuffers[e]}},{binding:1,resource:{buffer:this.spinBuffers[1-e]}},{binding:2,resource:{buffer:this.simUniform}}]})),this.fieldGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.field.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:2,resource:{buffer:this.simUniform}},{binding:3,resource:this.fieldViews[0]}]})),this.selectGroups=this.spinBuffers.map(()=>this.device.createBindGroup({layout:this.pipelines.select.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}},{binding:15,resource:this.blurViews[1]}]})),this.paintGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.paint.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:e}},{binding:4,resource:{buffer:this.selectionBuffer}},{binding:5,resource:{buffer:this.brushUniform}}]})),this.statsGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.stats.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:6,resource:{buffer:this.statsOutput}},{binding:7,resource:{buffer:this.statsUniform}}]})),this.blurPrimaryHorizontalGroups=this.spinBuffers.map(e=>this.device.createBindGroup({layout:this.pipelines.blurSpinsHorizontal.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]})),this.blurPrimaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[0]}}]}),this.blurSecondaryHorizontalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureHorizontal.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[1]},{binding:13,resource:this.blurViews[0]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.blurSecondaryVerticalGroup=this.device.createBindGroup({layout:this.pipelines.blurTextureVertical.getBindGroupLayout(0),entries:[{binding:12,resource:this.blurViews[0]},{binding:13,resource:this.blurViews[1]},{binding:14,resource:{buffer:this.blurUniforms[1]}}]}),this.renderGroup=this.device.createBindGroup({layout:this.pipelines.render.getBindGroupLayout(0),entries:[{binding:4,resource:{buffer:this.selectionBuffer}},{binding:8,resource:t},{binding:10,resource:this.sampler},{binding:11,resource:{buffer:this.renderUniform}},{binding:15,resource:this.blurViews[1]}]}),this.regionGroup=this.device.createBindGroup({label:"Ising region sample bind group",layout:this.pipelines.regions.getBindGroupLayout(0),entries:[{binding:10,resource:this.sampler},{binding:15,resource:this.blurViews[1]},{binding:16,resource:{buffer:this.regionUniform}},{binding:17,resource:{buffer:this.regionStorage}}]})}writeSimParams(t,e,n,s,i=0,r=0){const o=new ArrayBuffer(32),l=new DataView(o);l.setUint32(0,this.width,!0),l.setUint32(4,this.height,!0),l.setUint32(8,t,!0),l.setUint32(12,e,!0),l.setFloat32(16,n,!0),l.setUint32(20,s,!0),l.setUint32(24,i,!0),l.setUint32(28,r,!0),this.device.queue.writeBuffer(this.simUniform,0,o)}writeBrushParams(t,e,n,s,i,r,o,l,u,d){const m=new ArrayBuffer(64),g=new DataView(m);g.setUint32(0,this.width,!0),g.setUint32(4,this.height,!0),g.setInt32(8,t,!0),g.setInt32(12,e,!0),g.setUint32(16,n,!0),g.setUint32(20,s,!0),g.setUint32(24,d?1:0,!0),g.setFloat32(32,i,!0),g.setFloat32(36,r,!0),g.setFloat32(40,o,!0),g.setFloat32(44,l,!0),g.setFloat32(48,u,!0),this.device.queue.writeBuffer(this.brushUniform,0,m)}writeBlurParams(t,e){this.device.queue.writeBuffer(t,0,new Uint32Array([this.width,this.height,e,0]))}writeRenderParams(t,e,n,s,i){const r=new Float32Array(16);r[0]=this.width,r[1]=this.height,r[2]=this.width,r[3]=this.height,r[4]=e,r[5]=t,r[6]=n,r[7]=i.active?1:0,r[8]=i.x*this.density,r[9]=i.y*this.density,r[10]=i.radius*this.density,r[11]=i.painting?1:0,r[12]=i.forceHot?1:0,r[13]=Math.max(.5,this.density*.5),r[14]=s,this.device.queue.writeBuffer(this.renderUniform,0,r)}randomSeed(){return Math.random()*4294967295>>>0}retire(t){const e=()=>{for(const n of t.buffers)n.destroy();for(const n of t.textures??[])n.destroy();t.readback&&(t.readback.mapState==="unmapped"?t.readback.destroy():window.setTimeout(()=>this.retire({buffers:[],readback:t.readback}),250))};this.device.queue.onSubmittedWorkDone().then(e)}}const Oe="aeiou",De="bcdfghklmnprstvw",Fe=(y,t)=>t[Math.floor(y()*t.length)]??"a",ut=(y,t)=>{for(let n=0;n<32;n+=1){const s=y()<.62?5:3;let i="";for(let r=0;r<s;r+=1)i+=Fe(y,r%2===0?De:Oe);if(!t?.has(i))return i}let e="";for(let n=0;n<7;n+=1)e+=Fe(y,n%2===0?De:Oe);return e},Ye=(y,t)=>{const e=`${t.charAt(0).toUpperCase()}${t.slice(1)}`;return y==="continent"?`${e}ia`:y==="sea"?`Sea of ${e}`:y==="lake"?`Lake ${e}`:`${e} island`},ct=15,dt=.0035,ht=.008,ft=.055,pt=.058,gt=.042,mt=.45,xt=.3,Xe=2.5,Ve=.75,yt=3.2,He=.12,bt=.28,_t=30,vt=48,we=120,wt=.85,j=1.35,he=24,St=150,Pt=14,It=20,Mt=8,We=8,zt=.625,qe=7,kt=8,Bt=.22,Et=.7,At=.35,Gt=.9,Ct=[-24,-12,0,12,24],Ut=1.05,Tt=.45,Nt=.22,$e=48,Lt='Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif',je=y=>y==="continent"||y==="island",Rt=y=>y==="continent"||y==="sea",$=(y,t,e)=>Math.min(e,Math.max(t,y)),ne=(y,t,e,n,s)=>{if(s)return t;const i=1-Math.exp(-e/n);return y+(t-y)*i},Ze=(y,t,e)=>{if(t<dt)return null;const s=(e?Rt(e):!1)?t>=gt:t>=(e?pt:ft),i=y>0?s?"continent":"island":s?"sea":"lake";return i==="island"&&t<ht?null:i},Ot=(y,t,e)=>{const n=y%t,s=Math.floor(y/t);return[(n+1)%t+s*t,(n-1+t)%t+s*t,n+(s+1)%e*t,n+(s-1+e)%e*t]},Dt=(y,t,e)=>{const n=y%t,s=Math.floor(y/t),i=[];return n>0&&i.push(y-1),n+1<t&&i.push(y+1),s>0&&i.push(y-t),s+1<e&&i.push(y+t),i},Ft=(y,t,e,n,s,i,r)=>{const o=new Int32Array(t),l=new Int32Array(t+1),u={any:null,wide:null,tall:null,centered:null,anyArea:0,wideArea:0,tallArea:0,centeredArea:0,centerDistance:Number.POSITIVE_INFINITY},d=a=>{const c=a.w*a.h,h=Math.hypot(a.x+a.w/2-i,a.y+a.h/2-r);c>u.anyArea&&(u.anyArea=c,u.any=a),a.w>=a.h*1.35&&c>u.wideArea&&(u.wideArea=c,u.wide=a),a.h>=a.w*1.35&&c>u.tallArea&&(u.tallArea=c,u.tall=a),(h<u.centerDistance-.25||Math.abs(h-u.centerDistance)<=.25&&c>u.centeredArea)&&(u.centerDistance=h,u.centeredArea=c,u.centered=a)};for(let a=0;a<e;a+=1){for(let h=0;h<t;h+=1)o[h]=y[h+a*t]===1?o[h]+1:0;let c=0;l[0]=-1;for(let h=0;h<=t;h+=1){const p=h===t?0:o[h];for(;c>0&&o[l[c]]>p;){const x=o[l[c]];c-=1;const P=h-l[c]-1;P>=n&&x>=s&&d({x:l[c]+1,y:a-x+1,w:P,h:x})}c+=1,l[c]=h}}const m=[],g=(a,c)=>a.x===c.x&&a.y===c.y&&a.w===c.w&&a.h===c.h;return u.any&&m.push(u.any),u.wide&&m.every(a=>!g(a,u.wide))&&m.push(u.wide),u.tall&&m.every(a=>!g(a,u.tall))&&m.push(u.tall),u.centered&&m.every(a=>!g(a,u.centered))&&m.push(u.centered),m},Yt=(y,t,e)=>{const n=t*e;if(y.length!==n||n===0)return[];const s=new Uint8Array(n),i=[];for(let r=0;r<n;r+=1){if(s[r]!==0)continue;const o=y[r]<0?-1:1,l=[],u=[r];for(s[r]=1;u.length>0;){const g=u.pop();l.push(g);for(const a of Ot(g,t,e))s[a]===0&&(y[a]<0?-1:1)===o&&(s[a]=1,u.push(a))}const d=l.length/n,m=Ze(o,d,null);m&&i.push({sign:o,area:l.length,fraction:d,kind:m,cells:l})}return i.sort((r,o)=>o.area-r.area),i.length>$e&&(i.length=$e),i},Ke=y=>y==="continent"?{min:22,max:64}:y==="sea"?{min:18,max:30}:{min:16,max:20},Xt=y=>[{x:y.x,y:y.y}];class Vt{measure;tracks=new Map;usedStems=new Set;owners=new Uint16Array(0);nextId=1;nextPlacementId=1;synced=!1;lastIngest=-1;viewport={width:1,height:1};sampleWidth=0;sampleHeight=0;constructor(){if(typeof document>"u"){this.measure=null;return}this.measure=document.createElement("canvas").getContext("2d")}reset(){this.tracks.clear(),this.usedStems.clear(),this.owners=new Uint16Array(0),this.synced=!1,this.lastIngest=-1,this.sampleWidth=0,this.sampleHeight=0}advance(t,e,n){this.viewport=n;const s=$(t,0,.5),i=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;e!=="map"&&(this.synced=!1);for(const o of this.tracks.values()){e!=="map"&&(o.confirmed=!1),e==="map"&&o.confirmed&&o.missing<.001&&(o.age+=s);const l=o.placements.some(d=>d.locked),u=e==="map"&&this.synced&&o.confirmed&&o.age>=ct&&o.missing<(l?2:Ve);for(const d of o.placements){d.alive&&d.locked&&this.glide(o,d,s),u&&d.alive&&(d.locked=!0);const m=u&&d.alive?1:0,g=e==="chaos"?Nt:m?Ut:Tt;d.opacity=$(ne(d.opacity,m,s,g,i),0,1)}o.placements=o.placements.filter(d=>d.alive||d.opacity>.02)}this.resolveCollisions(s,i);const r=this.collect();return e==="chaos"&&r.length===0&&this.reset(),r}ingest(t){if(t.signs.length!==t.width*t.height||t.width<2||t.height<2)return;const e=performance.now()/1e3,n=this.lastIngest<0?0:Math.min(2,e-this.lastIngest);if(this.lastIngest=e,t.width!==this.sampleWidth||t.height!==this.sampleHeight){const a=this.sampleWidth,c=this.sampleHeight;this.owners=this.regridOwners(this.owners,a,c,t.width,t.height);for(const h of this.tracks.values()){h.history=h.history.map(p=>this.regridMask(p,a,c,t.width,t.height));for(const p of h.placements)p.mask=p.mask?this.regridMask(p.mask,a,c,t.width,t.height):null}this.sampleWidth=t.width,this.sampleHeight=t.height}const s=Yt(t.signs,t.width,t.height),i=new Map,r=[];for(let a=0;a<s.length;a+=1){i.clear();for(const c of s[a].cells){const h=this.owners[c]??0;h!==0&&i.set(h,(i.get(h)??0)+1)}for(const[c,h]of i)r.push({regionIndex:a,trackId:c,overlap:h})}const o=new Map,l=new Set,u=new Map,d=new Map;for(const a of r){const c=this.tracks.get(a.trackId),h=s[a.regionIndex];if(!c||je(c.kind)!==je(h.kind)||a.overlap<mt*h.area||a.overlap<xt*c.area)continue;const p=h.area/c.area;if(p>Xe||p<1/Xe)continue;const x=d.get(c.id)??[];x.push(a),d.set(c.id,x)}for(const a of d.values()){a.sort((p,x)=>x.overlap-p.overlap);const c=a[0],h=u.get(c.regionIndex)??[];h.push(c),u.set(c.regionIndex,h)}for(const[a,c]of u){c.sort((p,x)=>{const P=this.tracks.get(p.trackId),w=(this.tracks.get(x.trackId)?.age??0)-(P?.age??0);return Math.abs(w)>.25?w:x.overlap-p.overlap});const h=this.tracks.get(c[0].trackId);h&&(o.set(a,h),l.add(h.id))}for(const[a,c]of o){const h=s[a],p=Ze(h.sign,h.fraction,c.kind)??h.kind;c.kind=p,c.text=Ye(p,c.stem),c.area=h.area,c.missing=0,c.confirmed=!0,this.rememberRegion(c,h.cells),this.place(c,h)}for(const a of this.tracks.values())l.has(a.id)||(a.missing+=n,a.missing>=Ve&&!a.placements.some(c=>c.locked)&&(a.age=0));for(const a of[...this.tracks.values()])a.missing<=yt||(this.tracks.delete(a.id),this.usedStems.delete(a.stem));const m=[];for(let a=0;a<s.length;a+=1){if(o.has(a))continue;const c=s[a],h=ut(Math.random,this.usedStems);this.usedStems.add(h);const p={id:this.nextId,stem:h,kind:c.kind,text:Ye(c.kind,h),area:c.area,age:0,missing:0,confirmed:!0,placements:[],history:[]};this.rememberRegion(p,c.cells),this.place(p,c),this.tracks.set(p.id,p),m.push({region:c,track:p}),this.nextId+=1,this.nextId>=65535&&(this.nextId=1)}const g=new Uint16Array(t.signs.length);if(this.owners.length===g.length)for(let a=0;a<g.length;a+=1){const c=this.owners[a];c!==0&&this.tracks.has(c)&&!l.has(c)&&(g[a]=c)}for(const[a,c]of o)for(const h of s[a].cells)g[h]=c.id;for(const a of m)for(const c of a.region.cells)g[c]=a.track.id;this.owners=g,this.synced=!0}place(t,e){const n=this.layouts(t,e.cells),s=new Set,i=new Set,r=[...t.placements].sort((o,l)=>l.opacity-o.opacity);for(const o of r){if(!o.alive)continue;let l=-1;const u=this.cellIndex(o.displayX,o.displayY);if(u>=0&&(l=n.findIndex((d,m)=>!s.has(m)&&d.mask[u]===1)),l<0){let d=Number.POSITIVE_INFINITY;for(let m=0;m<n.length;m+=1){if(s.has(m))continue;const g=n[m],a=this.planar(o.displayX,o.displayY,g.x,g.y);a<d&&(d=a,l=m)}}l<0||!this.adopt(t,o,n[l])||(s.add(l),i.add(o.id))}for(const o of t.placements)o.alive&&!i.has(o.id)&&this.retire(o);for(let o=0;o<n.length;o+=1){if(s.has(o))continue;if(t.placements.some(u=>u.alive))break;const l=n[o];this.spawn(t,l),s.add(o)}}layouts(t,e){const n=this.sampleWidth,s=this.sampleHeight,i=this.viewport.width,r=this.viewport.height;if(n<2||s<2||i<2||r<2||e.length===0)return[];const o=Ke(t.kind),l=i/n,u=r/s,d=o.min*j+6,m=d/l,g=d/u,a=new Uint8Array(n*s);for(const h of e)a[h]=1;const c=[];for(const h of this.screenPieces(a,n,s)){const p=this.temporalMask(h.mask,t.history),x=this.readInterior(p)??this.readInterior(h.mask);if(!x)continue;const P=Math.max(2,Math.ceil(kt/Math.min(l,u))),z=new Uint8Array(p.length);let w=0;for(let S=0;S<z.length;S+=1)p[S]!==1||x.dist[S]<P||(z[S]=1,w+=1);if(w===0)continue;const M=[],I=Math.max(1,Math.floor(x.max*.45));for(let S=0;S<h.mask.length;S+=1)h.mask[S]===1&&x.dist[S]>=I&&M.push(S);const T=this.preferredAngle(M.length>=4?M:x.cells);let C=0,O=0;for(const S of x.cells)C+=S%n+.5,O+=Math.floor(S/n)+.5;C/=x.cells.length,O/=x.cells.length;const U=C*l/i,B=O*u/r,L=new Uint8Array(p.length),D=Math.max(P,Math.floor(x.max*.35));for(let S=0;S<L.length;S+=1)z[S]===1&&x.dist[S]>=D&&(L[S]=1);let G=null;for(const S of[L,z]){const X=[];for(const N of Ft(S,n,s,m,g,C,O)){const V=this.chooseFit(t.text,t.kind,N,T);if(!V)continue;const q=this.limitsFor(N,t.text,V.fontSize,V.letterSpacing,V.angle);if(!q)continue;const Q=$(U,q.l,q.r),se=$(B,q.t,q.b);X.push({rect:N,fit:V,x:Q,y:se,distance:this.planar(Q,se,U,B)})}if(X.length===0)continue;const H=Math.max(...X.map(N=>N.fit.fontSize)),W=X.filter(N=>N.fit.fontSize>=H*.84);W.sort((N,V)=>N.distance-V.distance||V.fit.fontSize-N.fit.fontSize),G=W[0];break}G&&c.push({mask:z,regionMask:h.mask,area:h.area,rect:G.rect,x:G.x,y:G.y,fontSize:G.fit.fontSize,letterSpacing:G.fit.letterSpacing,angle:G.fit.angle})}return c.sort((h,p)=>p.area-h.area),c}rememberRegion(t,e){const n=new Uint8Array(this.sampleWidth*this.sampleHeight);for(const s of e)n[s]=1;t.history.unshift(n),t.history.length>We&&(t.history.length=We)}temporalMask(t,e){if(e.length<2)return t;const n=new Uint8Array(t.length),s=Math.ceil(e.length*zt);let i=0;for(let r=0;r<t.length;r+=1){if(t[r]!==1)continue;let o=0;for(const l of e)o+=l[r]??0;o<s||(n[r]=1,i+=1)}return i>0?n:t}regridOwners(t,e,n,s,i){const r=new Uint16Array(s*i);if(e<1||n<1||t.length!==e*n)return r;for(let o=0;o<i;o+=1){const l=Math.min(n-1,Math.floor((o+.5)*n/i));for(let u=0;u<s;u+=1){const d=Math.min(e-1,Math.floor((u+.5)*e/s));r[u+o*s]=t[d+l*e]}}return r}regridMask(t,e,n,s,i){const r=new Uint8Array(s*i);if(e<1||n<1||t.length!==e*n)return r;for(let o=0;o<i;o+=1){const l=Math.min(n-1,Math.floor((o+.5)*n/i));for(let u=0;u<s;u+=1){const d=Math.min(e-1,Math.floor((u+.5)*e/s));r[u+o*s]=t[d+l*e]}}return r}preferredAngle(t){const e=this.sampleWidth;if(t.length<4)return 0;let n=0,s=0;for(const c of t)n+=c%e+.5,s+=Math.floor(c/e)+.5;n/=t.length,s/=t.length;let i=0,r=0,o=0;for(const c of t){const h=c%e+.5-n,p=Math.floor(c/e)+.5-s;i+=h*h,r+=p*p,o+=h*p}const l=i+r,u=i*r-o*o,d=Math.sqrt(Math.max(0,l*l*.25-u)),m=l*.5-d,g=l*.5+d;if(m<=1||g/m<1.45)return 0;let a=Math.atan2(2*o,i-r)*.5*180/Math.PI;return a>90&&(a-=180),a<-90&&(a+=180),$(a,-he,he)}chooseFit(t,e,n,s){const i=[$(s,-he,he),...Ct];let r=null;for(const o of i){const l=this.fitInside(t,e,n,o);if(!l)continue;const u=r!==null&&Math.abs(o-s)<Math.abs(r.angle-s)-.1;(r===null||l.fontSize>r.fontSize+1||Math.abs(l.fontSize-r.fontSize)<=1&&u)&&(r={fontSize:l.fontSize,letterSpacing:l.letterSpacing,angle:o})}return r}fitInside(t,e,n,s){const i=this.viewport.width/this.sampleWidth,r=this.viewport.height/this.sampleHeight,o=n.w*i-6,l=n.h*r-6,u=Ke(e);if(o<8||l<u.min*j*.45)return null;const d=s*Math.PI/180,m=Math.abs(Math.cos(d)),g=Math.abs(Math.sin(d)),a=w=>{const M=w*j,I=w*He,T=this.boxWidth(t,w,I),C=this.extents(T,M,m,g);return C.w<=o&&C.h<=l};if(!a(u.min))return null;let c=u.min,h=u.max;for(let w=0;w<8;w+=1){const M=(c+h)/2;a(M)?c=M:h=M}const p=c,x=p*j;let P=p*He,z=p*bt;for(let w=0;w<6;w+=1){const M=(P+z)/2,I=this.extents(this.boxWidth(t,p,M),x,m,g);I.w<=o&&I.h<=l?P=M:z=M}return{fontSize:p,letterSpacing:P}}extents(t,e,n,s){return{w:t*n+e*s,h:t*s+e*n}}readInterior(t){const e=this.sampleWidth,n=this.sampleHeight,s=e*n;if(t.length!==s||s===0)return null;const i=new Int16Array(s),r=new Int32Array(s);let o=0,l=0,u=!1;for(let x=0;x<s;x+=1){if(t[x]===1){i[x]=-1,u=!0;continue}i[x]=0,r[l]=x,l+=1}if(!u)return null;const d=[];for(let x=0;x<s;x+=1)t[x]===1&&d.push(x);const m=this.viewport.width/e,g=this.viewport.height/n;if(l===0){const x=Math.min(e,n);let P=0,z=0;for(const w of d)i[w]=x,P+=w%e+.5,z+=Math.floor(w/e)+.5;return{dist:i,max:x,x:P/d.length*m,y:z/d.length*g,cells:d}}for(;o<l;){const x=r[o];o+=1;const P=i[x]+1,z=x%e,w=Math.floor(x/e),M=[z>0?x-1:-1,z+1<e?x+1:-1,w>0?x-e:-1,w+1<n?x+e:-1];for(const I of M)I<0||i[I]!==-1||(i[I]=P,r[l]=I,l+=1)}let a=0,c=0,h=0,p=0;for(const x of d){const P=i[x]<0?0:i[x];i[x]=P,P>a&&(a=P)}for(let x=0;x<s;x+=1)t[x]!==1||i[x]<a||(c+=x%e+.5,h+=Math.floor(x/e)+.5,p+=1);return p===0?null:{dist:i,max:a,x:c/p*m,y:h/p*g,cells:d}}adopt(t,e,n){const s=this.planar(e.displayX,e.displayY,n.x,n.y),i=this.cellIndex(e.displayX,e.displayY),r=i>=0&&n.regionMask[i]===1;if(e.locked&&(!r&&s>St||!r&&!this.pathFits(t.text,n,e.displayX,e.displayY)))return!1;if(e.alive=!0,e.mask=n.mask,!e.locked)return e.displayX=n.x,e.displayY=n.y,e.idealX=n.x,e.idealY=n.y,e.angle=n.angle,e.fontSize=n.fontSize,e.letterSpacing=n.letterSpacing,e.candidateX=n.x,e.candidateY=n.y,e.candidateFrames=0,!0;const o=n.fontSize<e.idealFont?.32:.2;return e.idealFont+=(n.fontSize-e.idealFont)*o,e.idealTracking+=(n.letterSpacing-e.idealTracking)*o,e.idealAngle+=(n.angle-e.idealAngle)*.18,this.geometryFits(n.mask,t.text,e.displayX,e.displayY,e.fontSize,e.letterSpacing,e.angle)?this.planar(e.idealX,e.idealY,n.x,n.y)<=Pt?(e.idealX+=(n.x-e.idealX)*.18,e.idealY+=(n.y-e.idealY)*.18,e.candidateFrames=0,!0):(this.planar(e.candidateX,e.candidateY,n.x,n.y)<=It?(e.candidateX+=(n.x-e.candidateX)*.35,e.candidateY+=(n.y-e.candidateY)*.35,e.candidateFrames+=1):(e.candidateX=n.x,e.candidateY=n.y,e.candidateFrames=1),e.candidateFrames>=Mt&&(e.idealX=e.candidateX,e.idealY=e.candidateY,e.candidateFrames=0),!0):(e.idealX=n.x,e.idealY=n.y,e.candidateFrames=0,!0)}spawn(t,e){t.placements.push({id:this.nextPlacementId,alive:!0,displayX:e.x,displayY:e.y,idealX:e.x,idealY:e.y,angle:e.angle,idealAngle:e.angle,fontSize:e.fontSize,idealFont:e.fontSize,letterSpacing:e.letterSpacing,idealTracking:e.letterSpacing,opacity:0,collisionOpacity:0,mask:e.mask,velocityX:0,velocityY:0,candidateX:e.x,candidateY:e.y,candidateFrames:0,collisionHidden:!1,collisionChangeSeconds:0,locked:!1}),this.nextPlacementId+=1,this.nextPlacementId>=1e6&&(this.nextPlacementId=1)}retire(t){t.alive=!1}glide(t,e,n){const s=e.idealFont<e.fontSize?.45:1.8,i=ne(e.fontSize,e.idealFont,n,s,!1),r=ne(e.letterSpacing,e.idealTracking,n,1.1,!1),o=ne(e.angle,e.idealAngle,n,1.25,!1);let l=e.mask?this.geometryViolations(e.mask,t.text,e.displayX,e.displayY,e.fontSize,e.letterSpacing,e.angle):0;const u=e.mask?this.geometryViolations(e.mask,t.text,e.displayX,e.displayY,i,r,o):0;Number.isFinite(u)&&u<=l&&(e.fontSize=i,e.letterSpacing=r,e.angle=o,l=u);const d=this.viewport.width,m=this.viewport.height;let g=e.displayX*d,a=e.displayY*m;const c=e.idealX*d,h=e.idealY*m,p=2/wt;let x=(c-g)*p*p-2*p*e.velocityX,P=(h-a)*p*p-2*p*e.velocityY;const z=Math.hypot(x,P);z>we&&(x*=we/z,P*=we/z),e.velocityX+=x*n,e.velocityY+=P*n;const w=Math.hypot(e.velocityX,e.velocityY),M=l>0?vt:_t;w>M&&(e.velocityX*=M/w,e.velocityY*=M/w),g+=e.velocityX*n,a+=e.velocityY*n,Math.hypot(c-g,h-a)<.3&&Math.hypot(e.velocityX,e.velocityY)<.5&&(g=c,a=h,e.velocityX=0,e.velocityY=0);const I=g/d,T=a/m,C=e.mask?this.geometryViolations(e.mask,t.text,I,T,e.fontSize,e.letterSpacing,e.angle):0;if(Number.isFinite(C)&&C<=l)e.displayX=I,e.displayY=T;else{const O=g-e.displayX*d,U=a-e.displayY*m;let B=null;for(const L of[30,-30,60,-60,90,-90]){const D=L*Math.PI/180,G=Math.cos(D),S=Math.sin(D),X=e.displayX+(O*G-U*S)/d,H=e.displayY+(O*S+U*G)/m,W=e.mask?this.geometryViolations(e.mask,t.text,X,H,e.fontSize,e.letterSpacing,e.angle):0;if(!Number.isFinite(W)||W>l)continue;const N=this.planar(X,H,e.idealX,e.idealY);(!B||N<B.distance)&&(B={x:X,y:H,distance:N})}if(B){const L=e.displayX,D=e.displayY;e.displayX=B.x,e.displayY=B.y,n>0&&(e.velocityX=(B.x-L)*d/n,e.velocityY=(B.y-D)*m/n)}else e.velocityX=0,e.velocityY=0}}geometryFits(t,e,n,s,i,r,o){return this.geometryViolations(t,e,n,s,i,r,o)===0}geometryViolations(t,e,n,s,i,r,o){if(this.sampleWidth<2||this.sampleHeight<2)return 0;const l=this.viewport.width,u=this.viewport.height,d=l/this.sampleWidth,m=u/this.sampleHeight,g=n*l,a=s*u,c=Math.max(1,this.boxWidth(e,i,r)/2-1),h=Math.max(1,i*j/2-1),p=o*Math.PI/180,x=Math.cos(p),P=Math.sin(p),z=this.extents(c*2,h*2,Math.abs(x),Math.abs(P));if(g-z.w/2<1||a-z.h/2<1||g+z.w/2>l-1||a+z.h/2>u-1)return Number.POSITIVE_INFINITY;const w=Math.max(2,Math.min(d,m)*.45),M=Math.max(2,Math.ceil(c*2/w)),I=Math.max(2,Math.ceil(h*2/w));let T=0;for(let C=0;C<=I;C+=1){const O=-h+C/I*h*2;for(let U=0;U<=M;U+=1){const B=-c+U/M*c*2,L=g+B*x-O*P,D=a+B*P+O*x,G=Math.floor(L/d),S=Math.floor(D/m);if(G<0||S<0||G>=this.sampleWidth||S>=this.sampleHeight){T+=1;continue}t[G+S*this.sampleWidth]!==1&&(T+=1)}}return T}pathFits(t,e,n,s){const i=this.planar(n,s,e.x,e.y),r=this.viewport.width/this.sampleWidth,o=this.viewport.height/this.sampleHeight,l=Math.max(4,Math.min(8,r,o)),u=Math.max(1,Math.ceil(i/l));for(let d=1;d<=u;d+=1){const m=d/u;if(!this.geometryFits(e.mask,t,n+(e.x-n)*m,s+(e.y-s)*m,e.fontSize,e.letterSpacing,e.angle))return!1}return!0}limitsFor(t,e,n,s,i){if(n<1||this.sampleWidth<2||this.sampleHeight<2)return null;const r=this.viewport.width,o=this.viewport.height,l=i*Math.PI/180,u=this.extents(this.boxWidth(e,n,s),n*j,Math.abs(Math.cos(l)),Math.abs(Math.sin(l))),d=r/this.sampleWidth,m=o/this.sampleHeight,g=3;let a=t.x*d+u.w/2+g,c=(t.x+t.w)*d-u.w/2-g,h=t.y*m+u.h/2+g,p=(t.y+t.h)*m-u.h/2-g;if(a=Math.max(a,u.w/2),c=Math.min(c,r-u.w/2),h=Math.max(h,u.h/2),p=Math.min(p,o-u.h/2),c<a){if(a-c>1)return null;const x=(a+c)/2;a=x,c=x}if(p<h){if(h-p>1)return null;const x=(h+p)/2;h=x,p=x}return{l:a/r,t:h/o,r:c/r,b:p/o}}cellIndex(t,e){const n=this.sampleWidth,s=this.sampleHeight;if(n<1||s<1)return-1;const i=Math.floor($(t,0,.999999)*n),r=Math.floor($(e,0,.999999)*s);return i+r*n}planar(t,e,n,s){return Math.hypot((t-n)*this.viewport.width,(e-s)*this.viewport.height)}boxWidth(t,e,n){return this.textWidth(t,e,n)*1.06+2}textWidth(t,e,n){const s=Math.max(0,t.length-1);return this.measure?(this.measure.font=`500 ${e}px ${Lt}`,this.measure.fontKerning="none",this.measure.measureText(t).width+n*s):e*.56*t.length+n*s}screenPieces(t,e,n){const s=new Uint8Array(t.length),i=[];for(let r=0;r<t.length;r+=1){if(t[r]!==1||s[r]!==0)continue;const o=new Uint8Array(t.length),l=[r];s[r]=1;let u=0;for(;l.length>0;){const d=l.pop();o[d]=1,u+=1;for(const m of Dt(d,e,n))s[m]!==0||t[m]!==1||(s[m]=1,l.push(m))}i.push({mask:o,area:u})}return i}collisionPriority(t){return t==="lake"?4:t==="island"?3:t==="continent"?2:1}placementCorners(t,e){const n=e.displayX*this.viewport.width,s=e.displayY*this.viewport.height,i=this.boxWidth(t.text,e.fontSize,e.letterSpacing)/2+qe,r=e.fontSize*j/2+qe,o=e.angle*Math.PI/180,l=Math.cos(o),u=Math.sin(o);return[{x:-i,y:-r},{x:i,y:-r},{x:i,y:r},{x:-i,y:r}].map(d=>({x:n+d.x*l-d.y*u,y:s+d.x*u+d.y*l}))}boxesOverlap(t,e){for(const n of[t,e])for(let s=0;s<2;s+=1){const i=n[s],r=n[(s+1)%n.length],o=-(r.y-i.y),l=r.x-i.x;let u=Number.POSITIVE_INFINITY,d=Number.NEGATIVE_INFINITY,m=Number.POSITIVE_INFINITY,g=Number.NEGATIVE_INFINITY;for(const a of t){const c=a.x*o+a.y*l;u=Math.min(u,c),d=Math.max(d,c)}for(const a of e){const c=a.x*o+a.y*l;m=Math.min(m,c),g=Math.max(g,c)}if(d<=m||g<=u)return!1}return!0}resolveCollisions(t,e){const n=[];for(const i of this.tracks.values())for(const r of i.placements)!r.alive&&r.opacity<=.02||r.fontSize<1||n.push({track:i,placement:r,corners:this.placementCorners(i,r)});n.sort((i,r)=>{const o=this.collisionPriority(r.track.kind)-this.collisionPriority(i.track.kind);if(o!==0)return o;const l=r.track.age-i.track.age;return Math.abs(l)>.25?l:i.track.id-r.track.id});const s=[];for(const i of n){const r=s.some(u=>u.track.id!==i.track.id&&this.boxesOverlap(i.corners,u.corners));if(r===i.placement.collisionHidden)i.placement.collisionChangeSeconds=0;else if(i.placement.opacity<.05&&r)i.placement.collisionHidden=!0,i.placement.collisionChangeSeconds=0;else{i.placement.collisionChangeSeconds+=t;const u=r?At:Gt;i.placement.collisionChangeSeconds>=u&&(i.placement.collisionHidden=r,i.placement.collisionChangeSeconds=0)}const o=i.placement.collisionHidden?0:1,l=i.placement.collisionHidden?Bt:Et;i.placement.collisionOpacity=$(ne(i.placement.collisionOpacity,o,t,l,e),0,1),r||s.push(i)}}collect(){const t=[],{width:e,height:n}=this.viewport;for(const s of this.tracks.values())for(const i of s.placements){const r=i.opacity*i.collisionOpacity;r<=.015||i.fontSize<1||t.push({id:i.id,kind:s.kind,text:s.text,x:i.displayX*e,y:i.displayY*n,width:this.boxWidth(s.text,i.fontSize,i.letterSpacing),height:i.fontSize*j,opacity:r,fontSize:i.fontSize,letterSpacing:i.letterSpacing,angle:i.angle})}return t}}const Je=2/Math.log(1+Math.sqrt(2)),Ht=30,Se=40,k=y=>{const t=document.getElementById(y);if(!t)throw new Error(`Missing #${y}`);return t},Y=k("field"),fe=k("scale"),J=k("temperature"),Pe=k("time-speed"),pe=k("brush-size"),Wt=k("scale-value"),qt=k("temperature-value"),$t=k("time-speed-value"),jt=k("brush-size-value"),Kt=k("explanation"),Ie=k("settings-toggle"),Qe=k("settings-panel"),ge=k("pause"),Jt=k("restart"),Qt=k("clear-blue"),me=k("freeze"),xe=k("heat"),Me=k("phase"),ze=k("magnetization"),ke=k("energy"),ye=k("fatal-error"),Zt=k("place-labels"),ei=["Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.","Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.","The bright zero contour is the coastline. Wider views add elevation lines across the orange land.","A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map."];async function ti(){const y=await rt();if(!y){ye.hidden=!1,ye.textContent="This experiment requires a browser with WebGPU enabled.";return}const t=new lt(y.device,y.format,Y);let e=Number(J.value),n=e,s=Number(fe.value),i=s,r=Number(Pe.value),o=Number(pe.value),l=!1,u=!0,d=!1,m=!1,g=!1,a=0,c=0,h=null,p=!0,x=0,P=performance.now(),z=0,w=!1,M=0;const I=new Map;let T=!1,C=0,O=s,U=!1,B=!1,L=0,D=0,G=!1,S=0;const X=new Vt,H=new Map,W=new Set,N=new Set,V=Je+.2,q=Number(J.min),Q=Number(J.max),se=1.35,et=.75,tt=()=>{const f=Math.max(1,window.innerWidth),b=Math.max(1,window.innerHeight),_=f<=720?Math.min(window.devicePixelRatio||1,2):1,E=Math.min(y.device.limits.maxTextureDimension2D/f,y.device.limits.maxTextureDimension2D/b),v=Math.sqrt(Number(y.device.limits.maxStorageBufferBindingSize)/4/(f*b)),R=Math.max(.25,Math.min(_,E,v)),F=Math.max(1,Math.round(f*R)),K=Math.max(1,Math.round(b*R));return{density:F/f,width:F,height:K}},Z=()=>Math.max(0,Math.round((2**s-1)*(Math.min(t.width,t.height)/65.64)))*2+1,re=()=>{const f=Z();fe.value=s.toFixed(2),Wt.textContent=f===1?"1 spin":`${f} × ${f}`,Kt.textContent=ei[Math.min(3,Math.floor(s+.25))],document.documentElement.style.setProperty("--noise-opacity",(.12*(1-s/3)**2).toFixed(3))},oe=()=>{J.value=e.toFixed(2),qt.textContent=`T = ${e.toFixed(2)}`;const f=Math.max(0,Math.min(1,(e-q)/(Q-q)));me.style.setProperty("--temperature-progress",(1-f).toFixed(4)),xe.style.setProperty("--temperature-progress",f.toFixed(4)),me.setAttribute("aria-label",`Freeze, current temperature ${e.toFixed(2)}`),xe.setAttribute("aria-label",`Heat, current temperature ${e.toFixed(2)}`);const b=e-Je;b<-.2?Me.textContent="ordered":b>.2?Me.textContent="disordered":Me.textContent="critical"},Be=()=>{const f=Number.isInteger(r)?0:1;$t.textContent=`${r.toFixed(f)}×`},be=()=>{pe.value=String(o),jt.textContent=`${o} px`},it=()=>({active:g&&!T&&!B,painting:d,forceHot:m,x:a,y:c,radius:o/2}),ee=()=>{const f=Z(),b=(f-1)/2,_=f===1?0:.14*(1-s/3)**2;t.draw(s,b,_,L,it()),p=!1},Ee=()=>{D+=1,X.reset(),Ae([])},Ae=f=>{const b=new Set;for(const _ of f){b.add(_.id);const E=Xt(_);let v=H.get(_.id);for(v||(v=[],H.set(_.id,v));v.length<E.length;){const R=document.createElement("span");R.className="place-label",Zt.append(R),v.push(R)}for(;v.length>E.length;)v.pop()?.remove();for(let R=0;R<E.length;R+=1){const F=v[R],K=E[R];F.dataset.kind!==_.kind&&(F.dataset.kind=_.kind),F.textContent!==_.text&&(F.textContent=_.text),F.style.opacity=_.opacity.toFixed(3),F.style.fontSize=`${_.fontSize.toFixed(2)}px`,F.style.letterSpacing=`${_.letterSpacing.toFixed(2)}px`,F.style.transform=`translate(${K.x.toFixed(2)}px, ${K.y.toFixed(2)}px) rotate(${_.angle.toFixed(2)}deg) translate(-50%, -50%)`}}for(const[_,E]of H)if(!b.has(_)){for(const v of E)v.remove();H.delete(_)}},Ge=(f=!0)=>{const b=tt();t.resize(b.width,b.height,b.density,f),re(),p=!0,ee(),M+=1,D+=1},ae=f=>{const b=Y.getBoundingClientRect(),_=(f.clientX-b.left)/b.width,E=(f.clientY-b.top)/b.height;return _<0||_>=1||E<0||E>=1?null:(a=f.clientX-b.left,c=f.clientY-b.top,{x:_*t.width,y:E*t.height})},le=(f,b)=>{const _=ae(f);if(!_){h=null;return}const E=h??_;t.paintSegment(E.x,E.y,_.x,_.y,o*t.density/2,b,m),h=_,p=!0},_e=f=>{d=!0,h=null,le(f,!0),m=!1},Ce=()=>{const f=[...I.values()];return f.length<2?0:Math.hypot(f[1].x-f[0].x,f[1].y-f[0].y)},te=()=>{if(w)return;w=!0;const f=M;t.readStats().then(b=>{if(f!==M)return;ze.textContent=b.magnetization.toFixed(3),ke.textContent=b.energy.toFixed(3);const _=b.signedMagnetization===-1;!d&&m!==_&&(m=_,p=!0)}).catch(b=>{console.warn("Could not read Ising statistics.",b)}).finally(()=>{w=!1})};fe.addEventListener("input",()=>{s=Number(fe.value),i=s,re(),p=!0}),J.addEventListener("input",()=>{n=Number(J.value),e=n,oe()});const Ue=(f,b)=>{const _=()=>{f.setAttribute("aria-pressed",String(b.size>0))},E=v=>{b.delete(`pointer:${v.pointerId}`),f.hasPointerCapture(v.pointerId)&&f.releasePointerCapture(v.pointerId),_()};f.addEventListener("pointerdown",v=>{v.pointerType==="mouse"&&v.button!==0||(v.preventDefault(),f.setPointerCapture(v.pointerId),b.add(`pointer:${v.pointerId}`),_())}),f.addEventListener("pointerup",E),f.addEventListener("pointercancel",E),f.addEventListener("lostpointercapture",v=>{b.delete(`pointer:${v.pointerId}`),_()}),f.addEventListener("keydown",v=>{v.code!=="Space"&&v.code!=="Enter"||(v.preventDefault(),b.add(`key:${v.code}`),_())}),f.addEventListener("keyup",v=>{v.code!=="Space"&&v.code!=="Enter"||(v.preventDefault(),b.delete(`key:${v.code}`),_())}),f.addEventListener("blur",()=>{for(const v of b)v.startsWith("key:")&&b.delete(v);_()})};Ue(me,W),Ue(xe,N),Pe.addEventListener("input",()=>{r=Number(Pe.value),Be()}),pe.addEventListener("input",()=>{o=Number(pe.value),be(),p=!0}),window.addEventListener("keydown",f=>{f.code!=="BracketLeft"&&f.code!=="BracketRight"||(f.preventDefault(),o=Math.max(4,Math.min(100,o+(f.code==="BracketLeft"?-4:4))),be(),p=!0)}),Ie.addEventListener("click",()=>{u=!u,Qe.classList.toggle("is-closed",!u),Qe.setAttribute("aria-hidden",String(!u)),Ie.setAttribute("aria-expanded",String(u)),Ie.setAttribute("aria-label",u?"Close settings":"Open settings")}),ge.addEventListener("click",()=>{l=!l;const f=l?"Resume simulation":"Pause simulation";ge.setAttribute("aria-pressed",String(l)),ge.setAttribute("aria-label",f),ge.title=f,x=0}),Jt.addEventListener("click",()=>{t.randomize(),m=!1,x=0,M+=1,Ee(),ze.textContent="0.000",ke.textContent="0.000",p=!0,ee(),te()}),Qt.addEventListener("click",()=>{t.clearBlue(),m=!0,x=0,M+=1,Ee(),ze.textContent="1.000",ke.textContent="-2.000",p=!0,ee(),te()}),Y.addEventListener("pointerdown",f=>{if(ae(f)){if(Y.setPointerCapture(f.pointerId),g=!0,f.pointerType==="touch"){I.set(f.pointerId,{x:f.clientX,y:f.clientY}),I.size===1?(U=!0,B=!1):I.size===2&&(d=!1,h=null,U=!1,B=!0,T=!0,C=Ce(),O=i),p=!0;return}_e(f)}}),Y.addEventListener("pointermove",f=>{if(ae(f),g=!0,p=!0,f.pointerType==="touch"){if(!I.has(f.pointerId))return;if(I.set(f.pointerId,{x:f.clientX,y:f.clientY}),T&&I.size>=2){const b=Ce();C>0&&b>0&&(i=Math.max(0,Math.min(3,O-Math.log2(b/C)*.9)));return}if(I.size===1&&!B){if(U)_e(f),U=!1;else if(d)for(const b of f.getCoalescedEvents())le(b,!1)}return}if(d){const b=f.getCoalescedEvents();if(b.length===0)le(f,!1);else for(const _ of b)le(_,!1)}});const nt=f=>{f.pointerType==="touch"&&(U&&!B&&_e(f),I.delete(f.pointerId),I.size<2&&(T=!1),I.size===0&&(U=!1,B=!1,g=!1)),d=!1,h=null,Y.hasPointerCapture(f.pointerId)&&Y.releasePointerCapture(f.pointerId),p=!0,te()};Y.addEventListener("pointerup",nt),Y.addEventListener("pointercancel",f=>{I.delete(f.pointerId),d=!1,g=!1,h=null,U=!1,T=!1,p=!0}),Y.addEventListener("pointerenter",()=>{g=!0,p=!0}),Y.addEventListener("pointerleave",()=>{d||(g=!1,p=!0)}),Y.addEventListener("wheel",f=>{f.preventDefault();const b=Math.max(-120,Math.min(120,f.deltaY));i=Math.max(0,Math.min(3,i+b*.00125)),ae(f),g=!0},{passive:!1}),window.addEventListener("blur",()=>{d=!1,g=!1,h=null,I.clear(),T=!1,U=!1,W.clear(),N.clear(),me.setAttribute("aria-pressed","false"),xe.setAttribute("aria-pressed","false"),p=!0}),window.addEventListener("resize",()=>Ge(!0)),Ge(!1),t.step(e,40),oe(),Be(),be(),p=!0,ee(),te();const Te=f=>{const b=Math.max(0,(f-P)/1e3),_=Math.min(.1,b);P=f;const E=i-s;Math.abs(E)>5e-4?(s+=E*(1-Math.exp(-_*10)),re(),p=!0):s!==i&&(s=i,re(),p=!0);const v=+(N.size>0)-+(W.size>0),R=v<0?q:v>0?Q:n,F=v===0?et:se,K=R-e;if(Math.abs(K)>5e-4?(e+=K*(1-Math.exp(-_/F)),oe()):e!==R&&(e=R,oe()),!l){x+=_*Ht*r;const ie=Math.min(8,Math.floor(x));ie>0&&(x-=ie,t.step(e,ie),p=!0)}const ve=Z()>=Se?1:0,Ne=ve-L;Math.abs(Ne)>.001?(L+=Ne*(1-Math.exp(-_*7)),p=!0):L!==ve&&(L=ve,p=!0);const Le=e>V?"chaos":Z()>=Se?"map":"hidden",Re=Y.getBoundingClientRect(),st=X.advance(Math.min(.5,b),Le,{width:Re.width,height:Re.height});if(Ae(st),p&&ee(),!G&&Le==="map"&&f-S>280){S=f,G=!0;const ie=D;t.readRegionSample().then(ue=>{ie!==D||!ue||e>V||Z()<Se||X.ingest(ue)}).catch(ue=>{console.warn("Could not read Ising regions.",ue)}).finally(()=>{G=!1})}f-z>750&&(z=f,te()),requestAnimationFrame(Te)};requestAnimationFrame(Te)}ti().catch(y=>{console.error(y),ye.hidden=!1,ye.textContent=y instanceof Error?y.message:"Could not start the WebGPU simulation."});
