import { clamp } from '../shared/math.mjs';

function rect(view) {
  const size = Math.max(100, Math.min(view.w - 32, view.h - 112));
  return { x: (view.w - size) / 2, y: 27 + (view.h - 112 - size) / 2, w: size, h: size };
}
export function point(view, x, y) {
  const r = rect(view); return { x: clamp((x - r.x) / r.w), y: clamp((y - r.y) / r.h), inside: x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h };
}
// Actual contact-angle contours remain visible while the hydraulic solver pauses.
function contours(ctx, m, r, level, colour) {
  const n = m.n, scale = r.w / n;
  ctx.beginPath();
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
    const i = x + y * n, vertices = [[x + .5, y + .5, m.theta[i]], [x + 1.5, y + .5, m.theta[i + 1]], [x + 1.5, y + 1.5, m.theta[i + n + 1]], [x + .5, y + 1.5, m.theta[i + n]]], crossing = [];
    for (let edge = 0; edge < 4; edge++) {
      const a = vertices[edge], b = vertices[(edge + 1) % 4];
      if ((a[2] < level) !== (b[2] < level)) {
        const t = (level - a[2]) / (b[2] - a[2]); crossing.push([r.x + (a[0] + t * (b[0] - a[0])) * scale, r.y + (a[1] + t * (b[1] - a[1])) * scale]);
      }
    }
    for (let j = 0; j + 1 < crossing.length; j += 2) { ctx.moveTo(...crossing[j]); ctx.lineTo(...crossing[j + 1]); }
  }
  ctx.strokeStyle = colour; ctx.lineWidth = .8; ctx.stroke();
}
export function draw(view, m) {
  const r = rect(view), n = m.n, rgb = [0, 0, 0];
  view.image(n, n, i => {
    const x = i % n, y = Math.floor(i / n), h = m.h[i];
    const left = m.h[(x + n - 1) % n + y * n], right = m.h[(x + 1) % n + y * n];
    const up = m.h[x + ((y + n - 1) % n) * n], down = m.h[x + ((y + 1) % n) * n];
    const gx = (right - left) / (2 * m.dx), gy = (down - up) / (2 * m.dx);
    const light = clamp((1 - 1.9 * gx - 2.3 * gy) / Math.sqrt(1 + 8 * (gx * gx + gy * gy)), .35, 1.65);
    const height = Math.max(0, h - m.precursor), liquid = 1 - Math.exp(-height * 3.1), relief = clamp(height / 1.1);
    const dry = clamp((m.theta[i] - 12) / 36), wet = 1 - dry;
    const substrate = [49 + 18 * dry, 38 + 19 * wet, 36 + 19 * wet];
    const film = [93 + 119 * relief + 11 * dry, 151 + 72 * relief + 6 * wet, 135 + 64 * relief + 20 * wet];
    for (let c = 0; c < 3; c++) rgb[c] = clamp(substrate[c] * (1 - liquid) + film[c] * liquid * (.72 + .28 * light), 0, 255);
    return rgb;
  }, r, true);
  const ctx = view.ctx;
  const contrast = clamp(m.params.contrast, .2, 1.35);
  contours(ctx, m, r, 30 - 10 * contrast, '#8bc2af88'); contours(ctx, m, r, 30 + 12 * contrast, '#d3a17399');
  ctx.strokeStyle = '#666556'; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.font = '10px ui-monospace,monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#8faaa0';
  ctx.fillText('WETTABLE', r.x, r.y - 10); ctx.fillStyle = '#bd9873'; ctx.textAlign = 'right'; ctx.fillText('REPELLENT', r.x + r.w, r.y - 10);
  ctx.textAlign = 'left'; ctx.fillStyle = '#8b968d';
  ctx.fillText(view.w < 450 ? 'BRIGHTER = DEEPER LIQUID' : 'BRIGHTER = DEEPER LIQUID · CONTOURS = SURFACE CHEMISTRY', r.x, r.y + r.h + 20);
  ctx.fillStyle = '#697770'; ctx.fillText('THE SAME VOLUME · PERIODIC EDGES', r.x, r.y + r.h + 36);
}
