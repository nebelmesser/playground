import { clamp } from '../shared/math.mjs';

function layout(view) {
  const size = Math.max(80, Math.min(view.w - 48, view.h - 130));
  return { x: (view.w - size) / 2, y: 24 + Math.max(0, (view.h - 130 - size) / 2), w: size, h: size };
}
export function point(view, x, y) { const r = layout(view); return { x: clamp((x - r.x) / r.w), y: clamp((y - r.y) / r.h) }; }

export function draw(view, m) {
  const { ctx } = view, r = layout(view);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  // Each small stored segment is tiled across the periodic window. Unlike
  // connecting wrapped samples, this never draws a false line across a seam.
  for (let f = 0; f < m.trails.length; f++) {
    const opacity = .08 + .7 * (f + 1) / m.trails.length;
    for (const s of m.trails[f]) {
      const [x0, y0, x1, y1, i] = s;
      ctx.strokeStyle = i === 0 ? `rgba(244,184,113,${opacity})` : i === 1 ? `rgba(99,192,219,${opacity})` : `rgba(104,131,148,${opacity * .21})`;
      ctx.lineWidth = i < 2 ? 1.4 : .6;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        if (Math.max(x0, x1) + ox < 0 || Math.min(x0, x1) + ox > 1 || Math.max(y0, y1) + oy < 0 || Math.min(y0, y1) + oy > 1) continue;
        ctx.beginPath(); ctx.moveTo(r.x + (x0 + ox) * r.w, r.y + (y0 + oy) * r.h); ctx.lineTo(r.x + (x1 + ox) * r.w, r.y + (y1 + oy) * r.h); ctx.stroke();
      }
    }
  }
  for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
    const flash = clamp(1 - (m.time - m.diskFlash[cx + 4 * cy]) / .3), x = r.x + (cx + .5) * r.w / 4, y = r.y + (cy + .5) * r.h / 4;
    ctx.beginPath(); ctx.ellipse(x, y, m.radius * r.w, m.radius * r.h, 0, 0, Math.PI * 2); ctx.fillStyle = '#101b24'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = `rgb(${50 + 94 * flash},${70 + 78 * flash},${84 + 51 * flash})`; ctx.stroke();
    ctx.fillStyle = '#20313e'; ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  for (let i = m.n - 1; i >= 0; i--) {
    const x = r.x + m.x[i] * r.w, y = r.y + m.y[i] * r.h;
    ctx.fillStyle = i === 0 ? '#f4c585' : i === 1 ? '#85d5e9' : '#668393';
    ctx.beginPath(); ctx.arc(x, y, i < 2 ? 3 : 1.3, 0, Math.PI * 2); ctx.fill();
    if (i < 2) { ctx.strokeStyle = ctx.fillStyle; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + m.vx[i] * 11, y + m.vy[i] * 11); ctx.stroke(); }
  }
  ctx.restore(); ctx.strokeStyle = '#2b3d4a'; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#83949f'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left'; ctx.fillText('PERIODIC WINDOW · NO RANDOM KICKS', r.x, r.y + r.h + 22);
  ctx.fillText(r.w < 310 ? 'TWIN ANGLE GAP = 0.0001 RAD' : 'TWIN LAUNCH ANGLES DIFFER BY 0.0001 RAD', r.x, r.y + r.h + 38);
}
