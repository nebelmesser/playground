import test from 'node:test';
import assert from 'node:assert/strict';
import { create, defaults, presets, tools } from './model.mjs';
test('deterministic crystal replay and complete parameter presets', () => {
  for (const preset of presets) assert.deepEqual(Object.keys(preset.values).sort(), Object.keys(defaults).sort());
  const a = create(8, defaults, 36), b = create(8, defaults, 36);
  for (let k = 0; k < 50; k++) { if (k === 20) { a.interact(.4, .6, 'raise'); b.interact(.4, .6, 'raise'); } a.step(); b.step(); }
  assert.deepEqual(a.values(), b.values()); assert.equal(a.time, b.time);
});
test('a compatible uniform flat lattice is a fixed point and has neutral topology', () => {
  const m = create(1, { relief: 0 }, 36);
  for (let k = 0; k < 3; k++) { m.real[k].fill(m.baseAmplitude); m.imaginary[k].fill(0); }
  const initial = m.values(); for (let k = 0; k < 40; k++) m.step();
  const after = m.values(); for (let i = 0; i < initial.length; i++) assert.ok(Math.abs(initial[i] - after[i]) < 1e-12);
  assert.equal(m.defects.length, 0);
  for (const [kx, ky] of m.vectors) { assert.ok(Math.abs(Math.sin(kx * m.dx * m.n / 2)) < 1e-12); assert.ok(Math.abs(Math.sin(ky * m.dy * m.n / 2)) < 1e-12); }
});
test('fixed-support amplitude evolution decreases its actual surface free energy', () => {
  for (const p of [{ ...defaults }, { relief: 2, elasticity: 2, mobility: 2 }]) {
    const m = create(4, p, 36); let previous = m.energy();
    for (let k = 0; k < 200; k++) { m.step(); const e = m.energy(); assert.ok(e <= previous + 1e-8); previous = e; assert.equal(m.defects.reduce((sum, d) => sum + d.charge, 0), 0); }
    assert.ok(m.values().every(Number.isFinite));
  }
});
test('writing a support changes defect motion and annihilation rather than only the displayed height', () => {
  const flat = create(9, defaults, 48), raised = create(9, defaults, 48);
  for (let k = 0; k < 12; k++) raised.interact(.25, .32, 'raise');
  for (let k = 0; k < 3; k++) { assert.deepEqual(flat.real[k], raised.real[k]); assert.deepEqual(flat.imaginary[k], raised.imaginary[k]); }
  for (let k = 0; k < 180; k++) { flat.step(); raised.step(); }
  assert.equal(flat.defects.length, 0); assert.ok(raised.defects.length >= 2, 'the raised support delays an actual pair meeting');
  assert.notDeepEqual(flat.real[0], raised.real[0]);
});
test('bounded tools, explicit neutral pair insertion and live coefficients remain finite at all corners', () => {
  const m = create(5, defaults, 36);
  for (let k = 0; k < 80; k++) m.interact(.5, .5, 'raise');
  assert.ok(m.rawHeight.every(h => h >= 0 && h <= 8));
  for (const tool of tools) m.interact(.4, .4, tool.id);
  assert.equal(m.defects.reduce((sum, d) => sum + d.charge, 0), 0);
  for (const relief of [0, 2]) for (const elasticity of [.4, 2]) for (const mobility of [.4, 2]) {
    m.setParams({ relief, elasticity, mobility }); for (let k = 0; k < 50; k++) m.step(); assert.ok(m.values().every(Number.isFinite));
  }
});
