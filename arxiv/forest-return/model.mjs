import { rng, clamp } from '../shared/math.mjs';

export const defaults = { growth: .008, lightning: .000006, initial: .52 };
export const presets = [
  { name: 'After the fire', values: { growth: .008, lightning: .000006, initial: .52 } },
  { name: 'Long quiet', values: { growth: .004, lightning: .000001, initial: .42 } },
  { name: 'Small clearings', values: { growth: .013, lightning: .000035, initial: .35 } }
];

// Fast fire and slow regrowth are deliberately separated: while fire travels
// through the connected component, growth and lightning wait. This resolves
// the instantaneous cluster-burning event of the source into visible waves.
export function create(seed = 1, params = defaults, n = 128) {
  const random = rng(seed), state = new Uint8Array(n * n), born = new Float64Array(n * n), burned = new Float64Array(n * n).fill(-10000), scars = new Uint16Array(n * n), texture = new Float32Array(n * n);
  let time = 0, fires = 0, totalBurned = 0, totalGrown = 0, growthTicks = 0, lastFire = 0, front = [], eventSize = 0, eventOpen = false;
  const neighbours = i => { const x = i % n, y = Math.floor(i / n), out = []; if (x) out.push(i - 1); if (x < n - 1) out.push(i + 1); if (y) out.push(i - n); if (y < n - 1) out.push(i + n); return out; };
  function ignite(indices) {
    let count = 0;
    for (const i of indices) if (state[i] === 1) { state[i] = 2; front.push(i); count++; }
    if (count && !eventOpen) { fires++; eventSize = 0; eventOpen = true; }
    return count;
  }
  const model = {
    kind: 'forest-return', n, state, born, burned, scars, texture, params: { ...defaults, ...params },
    get time() { return time; }, get fires() { return fires; }, get totalBurned() { return totalBurned; }, get totalGrown() { return totalGrown; }, get growthTicks() { return growthTicks; }, get front() { return front; }, get lastFire() { return lastFire; },
    setParams(next) { Object.assign(this.params, next); },
    ignite(i) { return ignite([i]); },
    step() {
      time++;
      if (front.length) {
        const oldFront = front; front = [];
        for (const i of oldFront) {
          state[i] = 0; burned[i] = time; scars[i] = Math.min(65535, scars[i] + 1); totalBurned++; eventSize++;
          ignite(neighbours(i));
        }
        if (!front.length) { lastFire = eventSize; eventOpen = false; }
        return;
      }
      growthTicks++;
      const p = clamp(this.params.growth), f = clamp(this.params.lightning);
      const strikes = [];
      // Parallel slow update: only trees already present can be struck.
      for (let i = 0; i < state.length; i++) {
        if (state[i] === 0) { if (random() < p) { state[i] = 1; born[i] = time; totalGrown++; } }
        else if (random() < f) strikes.push(i);
      }
      ignite(strikes);
    },
    interact(x, y) {
      const cx = clamp(x) * (n - 1), cy = clamp(y) * (n - 1), targets = [];
      for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
        const px = Math.round(cx) + ox, py = Math.round(cy) + oy;
        if (px >= 0 && px < n && py >= 0 && py < n && ox * ox + oy * oy <= 4) targets.push(px + py * n);
      }
      ignite(targets);
    },
    values() { return Array.from(state); },
    metrics() {
      let trees = 0; for (const s of state) if (s === 1) trees++;
      return { 'Tree cover': `${(100 * trees / state.length).toFixed(1)}%`, 'Fire front': front.length, 'Last fire': `${lastFire} trees`, 'Slow growth ticks': growthTicks };
    }
  };
  for (let i = 0; i < state.length; i++) { state[i] = +(random() < clamp(model.params.initial)); texture[i] = .78 + random() * .35; born[i] = -random() * 140; }
  return model;
}
