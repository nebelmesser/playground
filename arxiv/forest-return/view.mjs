import { clamp } from '../shared/math.mjs';

function layout(v) { const pad = v.w < 450 ? 18 : 28; return { x: pad, y: 26, w: v.w - 2 * pad, h: Math.max(90, v.h - 104) }; }
export function point(v, x, y) { const r = layout(v); return { x: clamp((x - r.x) / r.w), y: clamp((y - r.y) / r.h) }; }
export function draw(v, m) {
  const r = layout(v), { ctx } = v;
  v.image(m.n, m.n, i => {
    const grain = m.texture[i], age = Math.min(1, (m.time - m.born[i]) / 150);
    if (m.state[i] === 2) return [255, 208 - 95 * (1 - grain), 84];
    if (m.state[i] === 1) return [(31 + 27 * age) * grain, (64 + 53 * age) * grain, (37 + 11 * age) * grain];
    const ember = Math.exp(-Math.max(0, m.time - m.burned[i]) / 20), scar = Math.min(1, m.scars[i] / 3);
    return [(22 - 10 * scar + 115 * ember) * grain, (26 - 12 * scar + 22 * ember) * grain, (21 - 9 * scar + 5 * ember) * grain];
  }, r, false);
  // A canopy is still a lattice of individual trees. The irregular shading is
  // fixed per site; all changing colour follows age, burning, or regrowth.
  ctx.strokeStyle = '#293c2c'; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#8c9a7e'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(m.front.length ? 'FIRE PASSES · GROWTH WAITS' : 'THE CLEARINGS GROW AGAIN', r.x, r.y + r.h + 23);
}
