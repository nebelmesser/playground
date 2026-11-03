import { clamp, grid, rng } from '../shared/math.mjs';

export const defaults = { contrast: 1, sharpness: .45, thickness: .54 };
export const presets = [
  { name: 'A changing sheet', values: { ...defaults } },
  { name: 'Soft chemical borders', values: { contrast: 1, sharpness: 0, thickness: .54 } },
  { name: 'Thin over sharp borders', values: { contrast: 1.1, sharpness: 1, thickness: .46 } },
];
export const tools = [
  { id: 'wet', label: 'Draw wettable path', hint: 'Lower the contact angle beneath the liquid. The path can collect a rim; it does not add liquid.' },
  { id: 'dry', label: 'Draw repellent path', hint: 'Raise the contact angle beneath the liquid. Watch the sheet withdraw and carry liquid toward its edges.' },
  { id: 'restore', label: 'Restore surface', hint: 'Restore the original chemistry under the brush. The redistributed liquid stays where it is.' },
];

// Lateral coordinates and heights use the same reduced length unit. Periodic
// finite volumes integrate the source's Eq.(1); the wetting potential is Eq.(2).
const precursor = .22, dx = .7, gamma = 1, slip = .035, tick = .18;
const potential = h => { const z = precursor / h, z2 = z * z; return (8 * z2 - 2 * z2 ** 4) / 6; };
const potentialPrime = h => { const z = precursor / h, z2 = z * z; return (8 / 3) * (z2 ** 4 - z2) / h; };
const mobility = h => h * (2 * h * h + 6 * slip * h + 3 * slip * slip) / 6;

export function create(seed = 1, params = defaults, n = 96) {
  const random = rng(seed), N = n * n, g = grid(n), h = new Float64Array(N);
  const chemistry = h.slice(), original = h.slice(), surface = h.slice(), theta = h.slice();
  const pressure = h.slice(), Q = h.slice(), rightFlux = h.slice(), downFlux = h.slice(), next = h.slice();
  let time = 0, accepted = 0, rejected = 0, mass0 = 0, lastDt = 0;
  const p = { ...defaults, ...params };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = x + n * y, xx = (x + .5) / n, yy = (y + .5) / n;
    original[i] = chemistry[i] = .48 * Math.sin(6 * Math.PI * xx + .65 * Math.sin(4 * Math.PI * yy)) * Math.cos(4 * Math.PI * yy) + .18 * Math.cos(2 * Math.PI * xx - 4 * Math.PI * yy);
    h[i] = clamp(p.thickness, .44, .75) + .012 * (random() - .5);
    mass0 += h[i];
  }
  function updateSurface() {
    const sharp = .6 + 10 * clamp(p.sharpness), norm = Math.tanh(sharp), amplitude = 18 * clamp(p.contrast, .2, 1.35);
    for (let i = 0; i < N; i++) {
      const written = Math.tanh(sharp * chemistry[i]) / norm;
      theta[i] = clamp(30 + amplitude * written, 5, 60);
      surface[i] = gamma * (1 - Math.cos(theta[i] * Math.PI / 180));
    }
  }
  function energy(a = h) {
    let e = 0;
    for (let i = 0; i < N; i++) {
      const gx = (a[g.right[i]] - a[i]) / dx, gy = (a[g.down[i]] - a[i]) / dx;
      e += .5 * gamma * (gx * gx + gy * gy) - surface[i] * potential(a[i]);
    }
    return e * dx * dx;
  }
  function advance(remaining) {
    let maxQ = 0;
    for (let i = 0; i < N; i++) {
      const lap = (h[g.left[i]] + h[g.right[i]] + h[g.up[i]] + h[g.down[i]] - 4 * h[i]) / (dx * dx);
      pressure[i] = -gamma * lap - surface[i] * potentialPrime(h[i]);
      Q[i] = mobility(h[i]); maxQ = Math.max(maxQ, Q[i]);
    }
    let dt = Math.min(remaining, .018 * dx ** 4 / (gamma * maxQ + 1e-12));
    // Symmetric face mobility and opposite flux updates conserve volume exactly.
    for (let i = 0; i < N; i++) {
      const r = g.right[i], d = g.down[i];
      rightFlux[i] = .5 * (Q[i] + Q[r]) * (pressure[r] - pressure[i]) / (dx * dx);
      downFlux[i] = .5 * (Q[i] + Q[d]) * (pressure[d] - pressure[i]) / (dx * dx);
    }
    const oldEnergy = energy();
    for (let attempt = 0; attempt < 30; attempt++) {
      next.set(h); let good = true;
      for (let i = 0; i < N; i++) {
        const fr = dt * rightFlux[i], fd = dt * downFlux[i];
        next[i] += fr + fd; next[g.right[i]] -= fr; next[g.down[i]] -= fd;
      }
      for (let i = 0; i < N; i++) if (!(next[i] > precursor * .65) || !Number.isFinite(next[i])) { good = false; break; }
      if (good && energy(next) <= oldEnergy + 2e-12 * Math.max(1, Math.abs(oldEnergy))) {
        h.set(next); accepted++; lastDt = dt; return dt;
      }
      rejected++; dt *= .5;
    }
    throw new Error('Thin-film descent failed to find a positive, energy-decreasing step');
  }
  updateSurface();
  return {
    kind: 'written-wetting', n, h, chemistry, original, surface, theta, precursor, dx, params: p, initialMass: mass0,
    get time() { return time; }, get acceptedSteps() { return accepted; }, get rejectedSteps() { return rejected; }, get lastDt() { return lastDt; },
    setParams(nextParams) { Object.assign(p, nextParams); updateSurface(); },
    step() { let elapsed = 0; while (elapsed < tick - 1e-12) elapsed += advance(tick - elapsed); time += elapsed; },
    interact(px, py, toolId = 'wet') {
      if (!Number.isFinite(px) || !Number.isFinite(py)) return;
      const cx = clamp(px) * n, cy = clamp(py) * n, radius = .07 * n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        let xx = x + .5 - cx, yy = y + .5 - cy; xx -= Math.round(xx / n) * n; yy -= Math.round(yy / n) * n;
        const distance = Math.hypot(xx, yy) / radius; if (distance >= 1) continue;
        const i = x + y * n, t = clamp((1 - distance) / .3), weight = t * t * (3 - 2 * t);
        const target = toolId === 'restore' ? original[i] : toolId === 'dry' ? 1 : -1;
        chemistry[i] = clamp(chemistry[i] + weight * (target - chemistry[i]), -1, 1);
      }
      updateSurface();
    },
    energy, mass() { return h.reduce((s, v) => s + v, 0); },
    values() { return [...h, ...chemistry, ...surface]; },
    metrics() {
      let min = Infinity, max = 0, exposed = 0;
      for (const v of h) { min = Math.min(min, v); max = Math.max(max, v); if (v < precursor * 1.15) exposed++; }
      return { 'Volume retained': `${(100 * h.reduce((s, v) => s + v, 0) / mass0).toFixed(3)}%`, 'Exposed surface': `${(100 * exposed / N).toFixed(1)}%`, 'Height range': `${min.toFixed(2)}–${max.toFixed(2)}` };
    },
  };
}
