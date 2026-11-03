import test from 'node:test';
import assert from 'node:assert/strict';
import { create, presets } from './model.mjs';

test('growth, fire and drag replay deterministically', () => {
  const a = create(41), b = create(41);
  for (let s = 0; s < 240; s++) { if (s % 31 === 0) { a.interact(s / 240, .4); b.interact(s / 240, .4); } a.step(); b.step(); }
  assert.deepEqual(a.values(), b.values()); assert.deepEqual(a.scars, b.scars); assert.equal(a.totalBurned, b.totalBurned);
});
test('a fire removes exactly the connected component, without diagonal crossing', () => {
  const m = create(3, { growth: 0, lightning: 0, initial: 0 }, 7);
  const component = [8, 9, 10, 17, 24]; for (const i of [...component, 32, 33]) m.state[i] = 1;
  m.ignite(8); let wave = 0;
  while (m.front.length && wave++ < 50) { m.step(); assert.equal(m.growthTicks, 0); }
  assert.equal(m.totalBurned, component.length); assert.equal(m.lastFire, component.length);
  for (const i of component) { assert.equal(m.state[i], 0); assert.equal(m.scars[i], 1); }
  assert.equal(m.state[32], 1); assert.equal(m.state[33], 1);
});
test('tree accounting and repeated burning are exact over long stochastic runs', () => {
  for (const p of [...presets.map(p => p.values), { growth: .025, lightning: .00006, initial: .75 }]) {
    const m = create(7, p, 48), initial = m.state.reduce((a, b) => a + b, 0);
    let checkpoint;
    for (let s = 0; s < 6000; s++) { if (s % 127 === 0) m.interact((s % 800) / 800, .5); m.step(); if (s === 5000) checkpoint = m.values(); }
    const existing = m.state.filter(v => v > 0).length;
    assert.equal(existing, initial + m.totalGrown - m.totalBurned); assert.ok(m.fires > 5);
    assert.notDeepEqual(m.values(), checkpoint); assert.ok(m.values().every(v => v === 0 || v === 1 || v === 2));
  }
});
test('parameter updates retain the closure and never create invalid states', () => {
  const m = create(9, { growth: 0, lightning: 0, initial: 0 }, 20); m.setParams({ growth: 1 }); m.step(); assert.ok(m.state.every(v => v === 1));
  m.setParams({ growth: 0, lightning: 1 }); m.step(); assert.ok(m.front.length === 400);
  m.step(); assert.equal(m.totalBurned, 400); assert.ok(m.state.every(v => v === 0));
});
