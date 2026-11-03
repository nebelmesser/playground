import { clamp } from '../shared/math.mjs';

function layout(v) { const size = Math.max(100, Math.min(v.w - 40, v.h - 112)); return { x: (v.w - size) / 2, y: 22 + Math.max(0, (v.h - 112 - size) / 2), w: size, h: size }; }
export function point(v, x, y) { const r = layout(v); return { x: clamp((x - r.x) / r.w), y: clamp((y - r.y) / r.h) }; }
export function draw(v, m) {
  const { ctx } = v, r = layout(v), points = m.projected;
  ctx.save(); ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w * .49, 0, Math.PI * 2); ctx.fillStyle = '#15111c'; ctx.fill(); ctx.clip();
  for (const p of points) {
    const age = clamp((points.length - 1 - p.index) / 70), s = p.size * r.w, x = r.x + p.x * r.w, y = r.y + p.y * r.h, angle = p.theta + .5;
    const shine = 1 - age;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.fillStyle = `rgb(${Math.round(101 + 126 * shine)},${Math.round(75 + 113 * shine)},${Math.round(126 + 94 * shine)})`;
    ctx.beginPath(); ctx.ellipse(0, 0, s * .92, s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(35,21,44,${.5 + .2 * age})`; ctx.lineWidth = Math.max(.6, s * .13); ctx.stroke();
    ctx.strokeStyle = `rgba(242,220,237,${.08 + .26 * shine})`; ctx.lineWidth = Math.max(.6, s * .1); ctx.beginPath(); ctx.moveTo(-s * .45, -.1 * s); ctx.quadraticCurveTo(0, -s * .25, s * .5, -.1 * s); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  ctx.font = '10px ui-monospace, monospace'; ctx.fillStyle = '#9b87a8'; ctx.textAlign = 'center';
  ctx.fillText(m.complete ? 'THIS FINITE HEAD HAS FINISHED GROWING' : 'NO ANGLE IS TOLD TO THE NEXT ORGAN', r.x + r.w / 2, r.y + r.h + 24);
  ctx.textAlign = 'left';
}
