import { rng, clamp, wrap, TAU } from '../shared/math.mjs';

export const defaults = { radius: .31, speed: .32 };
export const presets = [
  { name: 'Dispersing mirrors', values: { radius: .31, speed: .32 } },
  { name: 'Long free corridors', values: { radius: .13, speed: .36 } },
  { name: 'Narrow passages', values: { radius: .45, speed: .26 } }
];
const CELL = .25, EPS = 1e-11, DT = .04;

// Positions are local to the periodic unit square. During a flight, disk
// centres are extended periodically to the surrounding cells. Radius < CELL/2
// keeps all hard scatterers disjoint. Particles do not collide with each other.
export function create(seed = 1, params = defaults, n = 24) {
  const random = rng(seed), x = new Float64Array(n), y = new Float64Array(n), vx = new Float64Array(n), vy = new Float64Array(n);
  const flight = new Float64Array(n), collisions = new Uint32Array(n), diskFlash = new Float64Array(16).fill(-100), trails = [];
  let time = 0, radius = clamp(params.radius ?? defaults.radius, .08, .46) * CELL, bounces = 0, maxFlight = 0, geometryChanges = 0, exhausted = 0;
  function project(px, py) {
    px = wrap(px); py = wrap(py);
    const cx = (Math.floor(px / CELL) + .5) * CELL, cy = (Math.floor(py / CELL) + .5) * CELL;
    let dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy);
    if (d < radius + EPS) { if (d < EPS) { dx = 1; dy = 0; d = 1; } px = cx + dx / d * (radius + EPS); py = cy + dy / d * (radius + EPS); }
    return [wrap(px), wrap(py)];
  }
  function syncGeometry() {
    const nextRadius = clamp(model.params.radius, .08, .46) * CELL;
    if (nextRadius === radius) return;
    radius = nextRadius; geometryChanges++; trails.length = 0;
    for (let i = 0; i < n; i++) { [x[i], y[i]] = project(x[i], y[i]); flight[i] = 0; }
  }
  function advance(i, distance, segments) {
    let px = x[i], py = y[i], remaining = distance, iterations = 0;
    while (remaining > EPS && iterations++ < 32) {
      let hit = remaining + 1, hx = 0, hy = 0, disk = -1;
      const cellX = Math.floor(px / CELL), cellY = Math.floor(py / CELL);
      // A maximum step is 0.032 < CELL, so these neighbouring disks contain
      // every possible collision for this segment, also after a reflection.
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const ix = cellX + ox, iy = cellY + oy, cx = (ix + .5) * CELL, cy = (iy + .5) * CELL;
        const dx = px - cx, dy = py - cy, b = dx * vx[i] + dy * vy[i];
        if (b >= 0) continue;
        const c = dx * dx + dy * dy - radius * radius, disc = b * b - c;
        if (disc <= 1e-18) continue; // exact tangency does not reflect
        const t = -b - Math.sqrt(disc);
        if (t >= -EPS && t < hit && t <= remaining + EPS) { hit = Math.max(0, t); hx = cx; hy = cy; disk = wrap(ix, 4) + 4 * wrap(iy, 4); }
      }
      const length = Math.min(hit, remaining), nx = px + length * vx[i], ny = py + length * vy[i];
      segments.push([px, py, nx, ny, i]); flight[i] += length; maxFlight = Math.max(maxFlight, flight[i]);
      px = nx; py = ny; remaining -= length;
      if (disk < 0 || hit > distance) break;
      const normalX = (px - hx) / radius, normalY = (py - hy) / radius;
      const norm = Math.hypot(normalX, normalY), ux = normalX / norm, uy = normalY / norm;
      const dot = vx[i] * ux + vy[i] * uy;
      vx[i] -= 2 * dot * ux; vy[i] -= 2 * dot * uy;
      const speed = Math.hypot(vx[i], vy[i]); vx[i] /= speed; vy[i] /= speed;
      px = hx + ux * (radius + EPS); py = hy + uy * (radius + EPS);
      flight[i] = 0; collisions[i]++; bounces++; diskFlash[disk] = time + DT;
    }
    if (remaining > EPS && iterations >= 32) exhausted++;
    x[i] = wrap(px); y[i] = wrap(py);
  }
  const model = {
    kind: 'scattering-billiard', n, cells: 4, x, y, vx, vy, collisions, flight, diskFlash, trails,
    params: { ...defaults, ...params },
    get time() { return time; }, get radius() { return radius; }, get bounces() { return bounces; }, get maxFlight() { return maxFlight; }, get geometryChanges() { return geometryChanges; }, get exhausted() { return exhausted; },
    step() {
      syncGeometry(); const segments = [], distance = clamp(this.params.speed, .08, .8) * DT;
      for (let i = 0; i < n; i++) advance(i, distance, segments);
      time += DT; trails.push(segments); if (trails.length > 160) trails.shift();
    },
    interact(px, py) {
      syncGeometry(); const p = project(clamp(px), clamp(py)), a = Math.atan2(py - .5, px - .5) + .73;
      for (let i = 0; i < Math.min(2, n); i++) { x[i] = p[0]; y[i] = p[1]; vx[i] = Math.cos(a + i * .0001); vy[i] = Math.sin(a + i * .0001); flight[i] = 0; }
      for (let f = 0; f < trails.length; f++) trails[f] = trails[f].filter(s => s[4] > 1);
    },
    values() { return [...x, ...y, ...vx, ...vy]; },
    metrics() {
      const dx = x[0] - x[1], dy = y[0] - y[1], separation = Math.hypot(dx - Math.round(dx), dy - Math.round(dy));
      let error = 0; for (let i = 0; i < n; i++) error = Math.max(error, Math.abs(Math.hypot(vx[i], vy[i]) - 1));
      return { 'Twin separation': separation.toFixed(4), 'Reflections': bounces, 'Longest free flight': `${(maxFlight / CELL).toFixed(1)} cells`, 'Speed drift': error.toExponential(1) };
    }
  };
  for (let i = 0; i < n; i++) {
    let px, py;
    do { px = random(); py = random(); } while (Math.hypot(px - (Math.floor(px / CELL) + .5) * CELL, py - (Math.floor(py / CELL) + .5) * CELL) <= radius + EPS);
    x[i] = px; y[i] = py; const a = random() * TAU; vx[i] = Math.cos(a); vy[i] = Math.sin(a);
  }
  if (n > 1) { x[1] = x[0]; y[1] = y[0]; const a = Math.atan2(vy[0], vx[0]) + .0001; vx[1] = Math.cos(a); vy[1] = Math.sin(a); }
  return model;
}
