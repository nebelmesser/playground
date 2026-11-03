import { clamp } from '../shared/math.mjs';
function rect(view) { const size = Math.max(100, Math.min(view.w - 34, view.h - 111)); return { x: (view.w - size) / 2, y: 27 + (view.h - 111 - size) / 2, w: size, h: size }; }
export function point(view, x, y) { const r = rect(view); return { x: clamp((x - r.x) / r.w), y: clamp((y - r.y) / r.h), inside: x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h }; }
function basis(n, dx, dy, vectors) {
  const size = n * 3, count = size * size, C = vectors.map(() => new Float64Array(count)), S = C.map(a => a.slice());
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = x + y * size; for (let k = 0; k < 3; k++) { const phase = vectors[k][0] * (x + .5) / 3 * dx + vectors[k][1] * (y + .5) / 3 * dy; C[k][i] = Math.cos(phase); S[k][i] = Math.sin(phase); } }
  return { n, size, C, S };
}
export function draw(view, m) {
  const r = rect(view), n = m.n;
  if (view._crystalBasis?.n !== n) view._crystalBasis = basis(n, m.dx, m.dy, m.vectors);
  const { size, C, S } = view._crystalBasis, rgb = [0, 0, 0];
  view.image(size, size, i => {
    const x = (i % size + .5) / 3, y = (Math.floor(i / size) + .5) / 3, ix = Math.floor(x) % n, iy = Math.floor(y) % n, fx = x - Math.floor(x), fy = y - Math.floor(y);
    const ids = [ix + iy * n, (ix + 1) % n + iy * n, ix + ((iy + 1) % n) * n, (ix + 1) % n + ((iy + 1) % n) * n], w = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy];
    let density = 0, height = 0, order = 0;
    for (let k = 0; k < 3; k++) { let re = 0, im = 0; for (let j = 0; j < 4; j++) { re += w[j] * m.real[k][ids[j]]; im += w[j] * m.imaginary[k][ids[j]]; } density += 2 * (re * C[k][i] - im * S[k][i]); order += re * re + im * im; }
    for (let j = 0; j < 4; j++) height += w[j] * m.height[ids[j]];
    const atoms = clamp((density / m.baseAmplitude + 3) / 9) ** 2.2, support = clamp(height / 10), core = clamp(order / (3 * m.baseAmplitude ** 2));
    rgb[0] = 23 + 198 * atoms + 25 * support; rgb[1] = 18 + 167 * atoms + 9 * core; rgb[2] = 30 + 119 * atoms + 29 * support;
    return rgb;
  }, r, true);
  const ctx = view.ctx;
  for (const d of m.defects) { ctx.strokeStyle = d.charge > 0 ? '#9ec5bd' : '#dcb09a'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(r.x + d.x * r.w, r.y + d.y * r.h, Math.max(4, r.w * .013), 0, Math.PI * 2); ctx.stroke(); }
  ctx.strokeStyle = '#605b66'; ctx.lineWidth = .8; ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.font = '10px ui-monospace,monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#b9a99e';
  ctx.fillText(r.w < 300 ? 'ATOMIC DENSITY · OPPOSITE DEFECTS' : 'ATOMIC DENSITY · CIRCLES MARK OPPOSITE DEFECTS', r.x, r.y - 10);
  ctx.fillStyle = '#a79aac'; ctx.fillText(view.w < 450 ? 'VIOLET = RAISED SUPPORT' : 'VIOLET = RAISED SUPPORT · LATTICE FOLLOWS ITS OWN ENERGY', r.x, r.y + r.h + 20);
  ctx.fillStyle = '#797280'; ctx.fillText(r.w < 300 ? 'FIXED SUPPORT · MOVING CRYSTAL' : 'FIXED SUPPORT · MOVING CRYSTAL · PERIODIC PATCH', r.x, r.y + r.h + 36);
}
