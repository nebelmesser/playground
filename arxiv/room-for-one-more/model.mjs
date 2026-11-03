import { rng, clamp, wrap } from '../shared/math.mjs';

export const defaults = { taper: .045, smallest: .045, budget: 900 };
export const presets = [
  { name: 'A slowly opening head', values: { taper: .045, smallest: .045, budget: 900 } },
  { name: 'A hurried opening', values: { taper: .095, smallest: .04, budget: 900 } },
  { name: 'A few large organs', values: { taper: .025, smallest: .09, budget: 600 } }
];
const EPS = 1e-8;
const separation = (a, b) => Math.hypot((a.x - b.x) - Math.round(a.x - b.x), a.y - b.y);

// Schwendener/Snow packing takes place on the unrolled cylinder x mod 1.
// The next exclusion disk goes at the lowest non-overlapping position above
// the last disk. Its centre is therefore at an intersection of two expanded
// obstacle circles, or of one such circle with the current top-height floor
// (periodic images included). No divergence angle is supplied.
export function create(seed = 1, params = defaults) {
  const random = rng(seed), origin = random(), handed = random() < .5 ? 1 : -1, organs = [{ x: origin, y: 0, r: .5, id: 0 }];
  let time = 0, serial = 1, blocked = false, projected = [], dirty = true, lastSupports = [];
  function nextPosition(radius) {
    const floor = Math.max(...organs.map(o => o.y)), near = organs.filter(o => o.y >= floor - (.5 + radius) - EPS);
    let best = null;
    function check(x, y, supports) {
      if (y < floor - EPS || (best && y > best.y + EPS)) return;
      x = wrap(x);
      for (const o of near) { const dx = x - o.x, d = Math.hypot(dx - Math.round(dx), y - o.y); if (d < radius + o.r - EPS) return; }
      const tie = wrap(handed * (x - origin));
      if (!best || y < best.y - EPS || (Math.abs(y - best.y) <= EPS && tie < best.tie)) best = { x, y: Math.max(floor, y), r: radius, tie, supports };
    }
    // After an ablation or a live size change there may be room at exactly
    // the current top height. That active floor constraint must be included;
    // pairwise tangencies alone would falsely report a blocked front.
    for (const a of near) {
      const dy = floor - a.y, reach2 = (a.r + radius) ** 2 - dy * dy;
      if (reach2 >= -EPS) { const reach = Math.sqrt(Math.max(0, reach2)); check(a.x - reach, floor, [a.id]); check(a.x + reach, floor, [a.id]); }
    }
    for (let i = 0; i < near.length; i++) for (let j = i; j < near.length; j++) for (let shift = -1; shift <= 1; shift++) {
      if (i === j && shift === 0) continue;
      const a = near[i], b = near[j], dx = b.x + shift - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), ra = radius + a.r, rb = radius + b.r;
      if (d < EPS || d > ra + rb + EPS || d < Math.abs(ra - rb) - EPS) continue;
      const along = (ra * ra - rb * rb + d * d) / (2 * d), h2 = ra * ra - along * along;
      if (h2 < -EPS) continue;
      const height = Math.sqrt(Math.max(0, h2)), mx = a.x + along * dx / d, my = a.y + along * dy / d;
      check(mx - height * dy / d, my + height * dx / d, [a.id, b.id]);
      check(mx + height * dy / d, my - height * dx / d, [a.id, b.id]);
    }
    return best;
  }
  const model = {
    kind: 'room-for-one-more', organs, params: { ...defaults, ...params },
    get time() { return time; }, get blocked() { return blocked; }, get complete() { return organs.length >= this.params.budget || blocked; }, get lastSupports() { return lastSupports; },
    get projected() {
      if (!dirty) return projected;
      const maxY = Math.max(1, ...organs.map(o => o.y));
      projected = organs.map((o, index) => { const theta = o.x * Math.PI * 2, radius = .46 * Math.sqrt(o.y / maxY); return { x: .5 + radius * Math.cos(theta), y: .5 + radius * Math.sin(theta), theta, radius, index, size: .02, id: o.id }; });
      // Displayed seed glyphs are sized to their projected gaps. They are not
      // the cylinder's circular exclusion disks, which the mapping distorts.
      for (let i = 0; i < projected.length; i++) {
        let d = 1;
        for (let j = 0; j < projected.length; j++) if (i !== j) d = Math.min(d, Math.hypot(projected[i].x - projected[j].x, projected[i].y - projected[j].y));
        projected[i].size = Math.max(.001, .44 * d);
      }
      dirty = false; return projected;
    },
    setParams(next) { Object.assign(this.params, next); blocked = false; },
    step() {
      time++;
      if (this.complete) return;
      const top = Math.max(...organs.map(o => o.y)), radius = clamp(.5 - Math.max(0, this.params.taper) * top, clamp(this.params.smallest, .025, .2), .5), position = nextPosition(radius);
      if (!position) { blocked = true; return; }
      organs.push({ x: position.x, y: position.y, r: radius, id: serial++ }); lastSupports = position.supports; dirty = true;
    },
    interact(x, y) {
      const positions = this.projected, removed = new Set();
      for (const p of positions) if (p.index > 0 && p.index >= organs.length - 100 && Math.hypot(p.x - x, p.y - y) < Math.max(.035, p.size * 2)) removed.add(p.id);
      if (!removed.size) return;
      for (let i = organs.length - 1; i > 0; i--) if (removed.has(organs[i].id)) organs.splice(i, 1);
      blocked = false; dirty = true;
    },
    values() { return organs.flatMap(o => [o.x, o.y, o.r]); },
    metrics() {
      const a = organs.at(-1), b = organs.at(-2), divergence = b ? Math.abs((a.x - b.x) - Math.round(a.x - b.x)) * 360 : 0;
      return { 'Organs': organs.length, 'Latest gap angle': `${divergence.toFixed(1)}°`, 'New exclusion radius': a.r.toFixed(3), 'Growth': blocked ? 'No valid placement' : this.complete ? 'Finite head complete' : 'One organ at a time' };
    },
    separation
  };
  return model;
}
