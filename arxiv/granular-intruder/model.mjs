import { clamp, rng } from '../shared/math.mjs';
import { makeDEM, body } from './dem.mjs';
export const defaults = { packing: .79, force: 12, frequency: .7 };
export const presets = [{ name: 'A hesitant passage', values: { ...defaults } }, { name: 'Loose ground', values: { packing: .75, force: 12, frequency: .7 } }, { name: 'Rapid rocking', values: { packing: .79, force: 12, frequency: 2.2 } }];
export const tools = [{ id: 'steer', label: 'Aim the applied force', hint: 'Drag to change the direction around which the intruder is rocked. The grains keep their positions and contact history.' }, { id: 'loosen', label: 'Disturb a few grains', hint: 'Press or drag to give nearby grains a bounded outward push. Holding keeps applying a local force.' }];
export function create(seed = 1, params = defaults) {
  const p = { ...defaults, ...params }, random = rng(seed), width = 30, height = 24, grains = [], intruder = body(0, 5, 12, 2, { large: true, mass: 12, inertia: 24, basal: .08, basalStatic: .12 });
  const rows = 22, cols = 26;
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const x = .65 + col * (width - 1.8) / (cols - 1) + (row % 2) * .25, y = .65 + row * (height - 1.3) / (rows - 1);
    if (Math.hypot(x - intruder.x, y - intruder.y) < 2.85) continue;
    grains.push(body(grains.length + 1, x + .045 * (random() - .5), y + .045 * (random() - .5), random() < .61 ? .5 : .625));
  }
  const area = grains.reduce((s, b) => s + Math.PI * b.r * b.r, 0), scale = Math.sqrt((clamp(p.packing, .72, .82) * width * height - Math.PI * intruder.r ** 2) / area);
  for (const b of grains) { b.r *= scale; b.mass = b.r * b.r; b.inertia = .5 * b.mass * b.r * b.r; }
  const bodies = [intruder, ...grains], dem = makeDEM(bodies, { width, height, basal: .3, basalStatic: .45, friction: .5 });
  let time = 0, axis = 0, held = null, forcing = true; const trail = [];
  // Initial packing is mechanically relaxed before switching on the labelled drive.
  for (let k = 0; k < 1000; k++) dem.step(.0015);
  function interact(x, y, tool = 'steer') {
    const px = clamp(x) * width, py = clamp(y) * height;
    if (tool === 'steer') { axis = Math.atan2(py - intruder.y, px - intruder.x); return; }
    if (held) { held.x = px; held.y = py; return; }
    for (const b of grains) { const dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy); if (d < 2.6 && d > 1e-6) { const s = .7 * (1 - d / 2.6); b.vx = (1 - s) * b.vx + s * dx / d; b.vy = (1 - s) * b.vy + s * dy / d; } }
  }
  return { kind: 'granular-intruder', params: p, bodies, grains, intruder, dem, width, height, trail,
    get time() { return time; }, get axis() { return axis; }, get held() { return held; },
    setParams(next) { Object.assign(p, next); },
    beginInteract(x, y, tool) { if (tool === 'loosen') held = { x: clamp(x) * width, y: clamp(y) * height }; interact(x, y, tool); }, interact, endInteract() { held = null; },
    step() { for (let k = 0; k < 20; k++) { dem.step(.0015, () => {
      const phase = 2 * Math.PI * clamp(p.frequency, .1, 3) * time, force = forcing ? clamp(p.force, 0, 35) : 0, fx = force * Math.abs(Math.cos(phase)), fy = force * Math.sin(phase);
      intruder.fx += fx * Math.cos(axis) - fy * Math.sin(axis); intruder.fy += fx * Math.sin(axis) + fy * Math.cos(axis);
      if (held) for (const b of grains) { const dx = b.x - held.x, dy = b.y - held.y, d = Math.hypot(dx, dy); if (d < 2.6 && d > 1e-6) { const f = 3 * (1 - d / 2.6) * b.mass; b.fx += f * dx / d; b.fy += f * dy / d; } }
    }); time += .0015; } if (!trail.length || Math.hypot(intruder.x - trail.at(-1).x, intruder.y - trail.at(-1).y) > .07) { trail.push({ x: intruder.x, y: intruder.y }); if (trail.length > 3000) trail.shift(); } },
    stopDrive() { forcing = false; },
    values() { return [...bodies.flatMap(b => [b.x, b.y, b.vx, b.vy, b.omega]), time, axis]; },
    metrics() { return { 'Applied rocking force': clamp(p.force, 0, 35).toFixed(1), 'Grain contacts': String(dem.bearing.length), 'Intruder speed': Math.hypot(intruder.vx, intruder.vy).toFixed(2) }; },
  };
}
