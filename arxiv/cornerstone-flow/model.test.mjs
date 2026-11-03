import test from 'node:test';
import assert from 'node:assert/strict';
import { create, defaults, presets } from './model.mjs';
import { makeDEM, body } from '../granular-intruder/dem.mjs';
const run = (m, steps) => { for (let i = 0; i < steps; i++) m.step(); };
test('a contact-supported arch balances gravity and collapses when a supporting grain moves', () => {
  const left = body(0, 3, 1, 1, { fixed: true }), right = body(1, 5, 1, 1, { fixed: true }), crown = body(2, 4, 2.75, 1);
  const dem = makeDEM([left, right, crown], { width: 8, height: 10, floor: false, ceiling: false, gravity: 1, stiffness: 3000, damping: 30, friction: .5 });
  for (let k = 0; k < 6000; k++) dem.step(.001);
  assert.ok(dem.kinetic() < 1e-8); assert.ok(Math.abs(crown.fy) < .001); assert.equal(dem.bearing.length, 2);
  for (const c of dem.bearing) assert.ok(Math.abs(c.tangent) <= .5 * c.force + 1e-12);
  left.x = 0; for (let k = 0; k < 3000; k++) dem.step(.001);
  assert.ok(crown.y < 1.3); assert.ok(crown.vy < -1);
});
test('seeded flow, complete presets and mechanically held cornerstone replay exactly', () => {
  for (const preset of presets) assert.deepEqual(Object.keys(preset.values).sort(), Object.keys(defaults).sort());
  const a = create(7), b = create(7);
  for (let k = 0; k < 140; k++) { if (k === 60) { a.interact(.38, .02, 'pin'); b.interact(.38, .02, 'pin'); } a.step(); b.step(); }
  assert.deepEqual(a.values(), b.values()); assert.equal(a.cornerstone.vx, 0); assert.equal(a.cornerstone.vy, 0);
});
test('a real default arch stops discharge; opening the outlet resumes the same grains', () => {
  const m = create(1), ids = m.grains.map(b => b.id), initialMass = m.grains.reduce((s, b) => s + b.mass, 0);
  run(m, 1200); assert.ok(m.secondsSinceExit > 8); assert.ok(m.dem.kinetic() < .02); const before = m.discharged;
  m.setParams({ outlet: 6.2 }); run(m, 350); assert.ok(m.discharged > before + 10);
  assert.deepEqual(m.grains.map(b => b.id), ids); assert.equal(m.grains.reduce((s, b) => s + b.mass, 0), initialMass);
  assert.ok(m.values().every(Number.isFinite));
});
test('pinned grain placement changes subsequent flow without replacing the packing', () => {
  const a = create(5), b = create(5); b.interact(.5, .01, 'pin');
  for (let i = 0; i < a.grains.length; i++) assert.equal(a.grains[i].x, b.grains[i].x);
  run(a, 300); run(b, 300); assert.notDeepEqual(a.values(), b.values());
  const displacement = a.grains.reduce((s, grain, i) => s + Math.hypot(grain.x - b.grains[i].x, grain.y - b.grains[i].y), 0);
  assert.ok(displacement > 1); assert.ok(b.values().every(Number.isFinite));
});
test('held exciter releases, and live extreme coefficients retain finite states', () => {
  const m = create(2, { outlet: 7, friction: .1 }); m.beginInteract(.5, .05, 'tap'); run(m, 20); m.endInteract({ cancelled: true }); assert.equal(m.held, null);
  m.setParams({ outlet: 3.2, friction: .8 }); run(m, 250); assert.ok(m.values().every(Number.isFinite));
  assert.ok(m.grains.every(b => b.r > 0 && b.mass > 0)); assert.ok(m.dem.maxOverlap < .25);
});
