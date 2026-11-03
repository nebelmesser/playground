import test from 'node:test';
import assert from 'node:assert/strict';
import { create, defaults, presets } from './model.mjs';
import { makeDEM, body } from './dem.mjs';
const run = (m, steps) => { for (let i = 0; i < steps; i++) m.step(); };
test('free binary contact conserves linear momentum, obeys Coulomb load and dissipates impact energy', () => {
  const a = body(0, 40, 40, 1, { vx: .7, vy: .15 }), b = body(1, 42.02, 40, 1, { vx: -.7, vy: -.15 });
  const dem = makeDEM([a, b], { width: 100, height: 100, floor: false, ceiling: false, friction: .4 });
  const initial = dem.kinetic(); let contact = false;
  for (let k = 0; k < 2500; k++) { dem.step(.001); assert.ok(Math.abs(a.mass * a.vx + b.mass * b.vx) < 1e-12); assert.ok(Math.abs(a.mass * a.vy + b.mass * b.vy) < 1e-12); for (const c of dem.bearing) { contact = true; assert.ok(Math.abs(c.tangent) <= .4 * c.force + 1e-12); } }
  assert.ok(contact); assert.ok(dem.kinetic() < initial); assert.ok(dem.dissipated > 0); assert.ok(a.x < b.x);
});
test('packing, forcing and interventions replay deterministically', () => {
  for (const preset of presets) assert.deepEqual(Object.keys(preset.values).sort(), Object.keys(defaults).sort());
  const a = create(3), b = create(3);
  for (let k = 0; k < 130; k++) { if (k === 60) { a.interact(.8, .85, 'steer'); b.interact(.8, .85, 'steer'); } a.step(); b.step(); }
  assert.deepEqual(a.values(), b.values()); assert.equal(a.bodies.length, b.bodies.length);
});
test('the contact packing advances under applied force, and steering changes its later route', () => {
  const forward = create(1), turned = create(1), passive = create(1, { force: 0 });
  turned.interact(.18, .95, 'steer');
  run(forward, 350); run(turned, 350); run(passive, 350);
  assert.ok(forward.intruder.x > passive.intruder.x + 1); assert.ok(turned.intruder.y > forward.intruder.y + 1);
  assert.ok(forward.dem.bearing.length > 50); assert.ok(turned.values().every(Number.isFinite));
});
test('held local forces stop on release and grain identities survive late parameter changes', () => {
  const m = create(9, { packing: .82, force: 35, frequency: 3 }), ids = m.bodies.map(b => b.id);
  m.beginInteract(.35, .5, 'loosen'); run(m, 100); assert.ok(m.held); m.endInteract({ cancelled: true }); assert.equal(m.held, null);
  m.setParams({ force: 0, frequency: .1 }); run(m, 250);
  assert.deepEqual(m.bodies.map(b => b.id), ids); assert.ok(m.values().every(Number.isFinite));
  for (const b of m.bodies) { assert.ok(b.x > -b.r && b.x < m.width + b.r); assert.ok(b.y > -b.r && b.y < m.height + b.r); }
});
