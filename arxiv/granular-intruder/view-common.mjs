import { clamp } from '../shared/math.mjs';
function frame(view, width, height) { const scale = Math.max(2, Math.min((view.w - 36) / width, (view.h - 118) / height)); return { x: (view.w - width * scale) / 2, y: 28 + (view.h - 118 - height * scale) / 2, w: width * scale, h: height * scale, scale }; }
export function point(view, x, y) { const [w, h] = view._granularDimensions || [30, 24], r = frame(view, w, h); return { x: clamp((x - r.x) / r.w), y: clamp(1 - (y - r.y) / r.h), inside: x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h }; }
export function drawGranular(view, m, hopper = false) {
  view._granularDimensions = [m.width, m.height]; const r = frame(view, m.width, m.height), ctx = view.ctx, sx = x => r.x + x * r.scale, sy = y => r.y + r.h - y * r.scale;
  ctx.fillStyle = hopper ? '#181b19' : '#131b23'; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  const force = new Map();
  for (const contact of m.dem.bearing) { force.set(contact.a, (force.get(contact.a) || 0) + contact.force); force.set(contact.b, (force.get(contact.b) || 0) + contact.force); }
  const byId = new Map(m.bodies.map(b => [b.id, b]));
  for (const b of m.bodies) {
    const load = clamp(Math.log1p(force.get(b.id) || 0) / 5), marked = b === m.intruder || b === m.cornerstone;
    ctx.fillStyle = marked ? (hopper ? '#74bba4' : '#dfb37c') : hopper ? `rgb(${111 + 63 * b.r},${102 + 51 * b.r},${76 + 43 * b.r})` : `rgb(${31 + 35 * b.r},${44 + 35 * b.r},${52 + 37 * b.r})`;
    ctx.beginPath(); ctx.arc(sx(b.x), sy(b.y), Math.max(.8, b.r * r.scale - .3), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = marked ? '#f8e6bd' : `rgba(224,236,219,${.12 + .55 * load})`; ctx.lineWidth = marked ? 1.3 : .5; ctx.stroke();
    if (marked) { ctx.strokeStyle = '#334737'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(sx(b.x), sy(b.y)); ctx.lineTo(sx(b.x + .72 * b.r * Math.cos(b.angle)), sy(b.y + .72 * b.r * Math.sin(b.angle))); ctx.stroke(); }
  }
  for (const c of m.dem.bearing) { const a = byId.get(c.a), b = byId.get(c.b); if (!a || !b) continue; const strength = clamp(Math.log1p(c.force / .15) / 3.5); ctx.strokeStyle = hopper ? `rgba(255,219,145,${.12 + .55 * strength})` : `rgba(190,239,229,${.25 + .75 * strength})`; ctx.lineWidth = .5 + 1.8 * strength; ctx.beginPath(); ctx.moveTo(sx(a.x), sy(a.y)); ctx.lineTo(sx(b.x), sy(b.y)); ctx.stroke(); }
  if (m.trail) { ctx.strokeStyle = '#e0b27f99'; ctx.lineWidth = 1.1; ctx.beginPath(); for (let i = 0; i < m.trail.length; i++) { const p = m.trail[i]; if (i) ctx.lineTo(sx(p.x), sy(p.y)); else ctx.moveTo(sx(p.x), sy(p.y)); } ctx.stroke(); }
  if (m.intruder) { const b = m.intruder, length = b.r + 1.4; ctx.strokeStyle = '#fff2c5'; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(sx(b.x), sy(b.y)); ctx.lineTo(sx(b.x + length * Math.cos(m.axis)), sy(b.y + length * Math.sin(m.axis))); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#64716d'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h); ctx.lineTo(r.x, r.y); if (!hopper) ctx.lineTo(r.x + r.w, r.y); else { ctx.moveTo(r.x + r.w, r.y); } ctx.lineTo(r.x + r.w, r.y + r.h); ctx.stroke();
  if (hopper) { const gap = m.params.outlet * r.scale; ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h); ctx.lineTo(r.x + (r.w - gap) / 2, r.y + r.h); ctx.moveTo(r.x + (r.w + gap) / 2, r.y + r.h); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.stroke(); }
  ctx.font = '10px ui-monospace,monospace'; ctx.fillStyle = '#9bab9e'; ctx.textAlign = 'left';
  ctx.fillText(hopper ? (r.w < 250 ? 'GRAVITY ↓ · FED FROM ABOVE' : 'GRAVITY ↓ · THE GRAINS RETURN AT THE TOP') : 'THE MARKED DISK IS EXTERNALLY ROCKED', r.x, r.y - 10);
  ctx.fillStyle = '#91a19a'; ctx.fillText('CONTACT LINES CARRY LOAD', r.x, r.y + r.h + 20);
  if (hopper) { ctx.fillStyle = '#76b39b'; ctx.fillText(r.w < 220 ? 'GREEN GRAIN IS HELD' : 'GREEN GRAIN = HELD CORNERSTONE', r.x, r.y + r.h + 36); }
  else { ctx.fillStyle = '#bd9d78'; ctx.fillText('SMALL GRAINS KEEP THEIR CONTACT HISTORY', r.x, r.y + r.h + 36); }
}
