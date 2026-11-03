import { rng, grid, lap, stamp, mean } from '../shared/math.mjs';
export const defaults = { feed: .0367, kill: .0649 };
export const presets = [
  { name: 'Division', values: { feed: .0367, kill: .0649 } },
  { name: 'Coral', values: { feed: .0545, kill: .062 } },
  { name: 'Maze', values: { feed: .029, kill: .057 } }
];
export function create(seed = 1, params = defaults, n = 128) {
  const random = rng(seed), g = grid(n);
  let u = new Float64Array(n * n).fill(1), v = new Float64Array(n * n), nu = u.slice(), nv = v.slice(), time = 0;
  const model = {
    kind: 'gray', n, params: { ...defaults, ...params }, get u() { return u; }, get v() { return v; }, get time() { return time; },
    step() {
      const { feed: f, kill: k } = this.params;
      for (let i = 0; i < u.length; i++) {
        const reaction = u[i] * v[i] * v[i];
        nu[i] = u[i] + .16 * lap(u, i, g) - reaction + f * (1 - u[i]);
        nv[i] = v[i] + .08 * lap(v, i, g) + reaction - (f + k) * v[i];
      }
      [u, nu] = [nu, u]; [v, nv] = [nv, v]; time++;
    },
    interact(x, y) { stamp(u, n, x, y, 4, () => .5); stamp(v, n, x, y, 4, () => .25 + random() * .015); },
    values() { return [...u, ...v]; },
    metrics() { return { 'Mean V': mean(v).toFixed(3), 'Active area': `${(100 * v.filter(x => x > .15).length / v.length).toFixed(1)}%` }; }
  };
  for (let j = 0; j < 18; j++) model.interact(.12 + .76 * random(), .12 + .76 * random());
  return model;
}
