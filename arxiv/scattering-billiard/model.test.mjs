import test from 'node:test';
import assert from 'node:assert/strict';
import { create, presets } from './model.mjs';

function outside(m) {
  for (let i = 0; i < m.n; i++) {
    assert.ok(m.x[i] >= 0 && m.x[i] < 1 && m.y[i] >= 0 && m.y[i] < 1);
    const cx = (Math.floor(m.x[i] * 4) + .5) / 4, cy = (Math.floor(m.y[i] * 4) + .5) / 4;
    assert.ok(Math.hypot(m.x[i] - cx, m.y[i] - cy) >= m.radius - 1e-10);
    assert.ok(Math.abs(Math.hypot(m.vx[i], m.vy[i]) - 1) < 1e-12);
  }
}
test('deterministic flights, collisions, and drag relaunches', () => {
  const a = create(64), b = create(64);
  for (let s = 0; s < 350; s++) { if (s % 27 === 0) { a.interact(s / 350, .4); b.interact(s / 350, .4); } a.step(); b.step(); }
  assert.deepEqual(a.values(), b.values()); assert.equal(a.bounces, b.bounces); assert.deepEqual(a.trails, b.trails);
});
test('a head-on circle collision reverses velocity at the exact impact point', () => {
  const m = create(1, { radius: .3, speed: .8 }, 2);
  // Centre .125, rim at .05. Launch .01 before the left rim toward the disk.
  m.x[0] = .04; m.y[0] = .125; m.vx[0] = 1; m.vy[0] = 0; m.step();
  assert.ok(Math.abs(m.vx[0] + 1) < 1e-12); assert.ok(Math.abs(m.vy[0]) < 1e-12);
  assert.ok(Math.abs(m.x[0] - .028) < 1e-9); assert.ok(Math.abs(m.y[0] - .125) < 1e-12); assert.equal(m.collisions[0], 1); outside(m);
});
test('free corridors wrap correctly without a spurious reflection', () => {
  const m = create(2, { radius: .31, speed: .8 }, 2);
  m.x[0] = .99; m.y[0] = 0; m.vx[0] = 1; m.vy[0] = 0; m.step();
  assert.ok(Math.abs(m.x[0] - .022) < 1e-12); assert.equal(m.collisions[0], 0); assert.equal(m.vx[0], 1);
});
test('all extremes conserve speed and prevent tunnelling for long runs and geometry edits', () => {
  const options = [...presets.map(p => p.values), { radius: .08, speed: .8 }, { radius: .46, speed: .8 }];
  for (const p of options) {
    const m = create(73, p, 18);
    for (let s = 0; s < 5000; s++) {
      if (s === 1500) m.params.radius = .46;
      if (s === 2700) m.params.radius = .08;
      if (s % 311 === 0) m.interact((s % 997) / 997, (s % 337) / 337);
      m.step(); if (s % 5 === 0) outside(m);
    }
    assert.equal(m.exhausted, 0); assert.ok(m.bounces > 100); assert.ok(m.values().every(Number.isFinite)); assert.ok(m.trails.length <= 160);
  }
});
test('specular map preserves tangential velocity at an oblique impact', () => {
  const m = create(4, { radius: .3, speed: .8 }, 2), r = m.radius;
  const nx = -.8, ny = -.6, cx = .125, cy = .125, ux = .95, uy = Math.sqrt(1 - .95 ** 2), dot = ux * nx + uy * ny;
  m.x[0] = cx + r * nx - ux * .003; m.y[0] = cy + r * ny - uy * .003; m.vx[0] = ux; m.vy[0] = uy;
  m.step();
  assert.ok(Math.abs(m.vx[0] - (ux - 2 * dot * nx)) < 1e-10); assert.ok(Math.abs(m.vy[0] - (uy - 2 * dot * ny)) < 1e-10); outside(m);
});
