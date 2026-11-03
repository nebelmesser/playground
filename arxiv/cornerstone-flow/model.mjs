import { clamp, rng } from '../shared/math.mjs';
import { makeDEM, body } from '../granular-intruder/dem.mjs';
export const defaults = { outlet: 3.2, friction: .55, cornerstone: 0 };
export const presets = [{ name: 'An uncertain opening', values: { ...defaults } }, { name: 'A wider passage', values: { outlet: 6.2, friction: .55, cornerstone: 0 } }, { name: 'A cornerstone nearer the gap', values: { outlet: 3.2, friction: .55, cornerstone: 1 } }];
export const tools = [{ id: 'pin', label: 'Move the cornerstone', hint: 'Drag the green grain horizontally along the outlet rim. It remains mechanically held; the other grains respond through contact.' }, { id: 'tap', label: 'Disturb the arch', hint: 'Press near a supporting grain to give the arch a bounded upward nudge. Holding applies the local exciter force.' }];
export function create(seed = 1, params = defaults) {
  const p = { ...defaults, ...params }, random = rng(seed), width = 20, height = 27, grains = [], cornerstone = body(0, (width - clamp(p.outlet, 3.2, 7)) / 2 - .85 + clamp(p.cornerstone, 0, 1) * 1.05, .617, .617, { fixed: true });
  for (let row = 0; row < 17; row++) for (let col = 0; col < 15; col++) {
    const r = [.5, .617, .717][Math.floor(random() * 3)], x = 1 + col * 1.27 + (row % 2) * .25, y = 1.6 + row * 1.14;
    if (Math.hypot(x - cornerstone.x, y - cornerstone.y) < r + cornerstone.r + .1) continue;
    grains.push(body(grains.length + 1, x + .025 * (random() - .5), y, r));
  }
  const bodies = [cornerstone, ...grains], dem = makeDEM(bodies, { width, height, gravity: 1.3, ceiling: false, friction: clamp(p.friction, .1, .8), outlet: clamp(p.outlet, 3.2, 7), stiffness: 6500, tangential: 3200, damping: 35 });
  let time = 0, discharged = 0, recycledMass = 0, held = null, lastExit = 0; const feeder = [];
  function interact(x, y, tool = 'pin') {
    const px = clamp(x) * width, py = clamp(y) * height;
    if (tool === 'pin') {
      const edge = (width - clamp(p.outlet, 3.2, 7)) / 2;
      cornerstone.x = clamp(px, edge - 2.0, edge + 1.1); cornerstone.y = cornerstone.r; return;
    }
    if (held) { held.x = px; held.y = py; return; }
    for (const b of grains) { const d = Math.hypot(b.x - px, b.y - py); if (d < 2.7) b.vy = .6 * b.vy + 2.5 * (1 - d / 2.7); }
  }
  return { kind: 'cornerstone-flow', params: p, width, height, bodies, grains, cornerstone, dem,
    get time() { return time; }, get discharged() { return discharged; }, get recycledMass() { return recycledMass; }, get held() { return held; }, get secondsSinceExit() { return time - lastExit; }, get feederCount() { return feeder.length; },
    setParams(next) { Object.assign(p, next); dem.options.outlet = clamp(p.outlet, 3.2, 7); dem.options.friction = clamp(p.friction, .1, .8); },
    beginInteract(x, y, tool) { if (tool === 'tap') held = { x: clamp(x) * width, y: clamp(y) * height }; interact(x, y, tool); }, interact, endInteract() { held = null; },
    step() {
      for (let k = 0; k < 60; k++) {
        dem.step(.0006, () => { if (held) for (const b of grains) if (!b.inTransit) { const d = Math.hypot(b.x - held.x, b.y - held.y); if (d < 2.7) b.fy += 80 * b.mass * (1 - d / 2.7); } });
        for (const b of grains) if (!b.inTransit && b.y < -2) { discharged++; recycledMass += b.mass; lastExit = time; b.inTransit = true; b.x = width + 4; b.y = height; b.vx = b.vy = b.omega = 0; feeder.push(b); }
        if (feeder.length && k % 10 === 0) { const b = feeder[0], x = 1.5 + random() * (width - 3), y = height + 1; if (bodies.every(other => other === b || other.inTransit || Math.hypot(other.x - x, other.y - y) > other.r + b.r + .07)) { b.x = x; b.y = y; b.inTransit = false; feeder.shift(); } }
        time += .0006;
      }
    },
    values() { return [...bodies.flatMap(b => [b.x, b.y, b.vx, b.vy, b.omega]), discharged, recycledMass, time]; },
    metrics() { return { 'Grains discharged': String(discharged), 'Since the last exit': `${(time - lastExit).toFixed(1)} s`, 'Contact load links': String(dem.bearing.length) }; },
  };
}
