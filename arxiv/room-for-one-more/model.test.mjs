import test from 'node:test';
import assert from 'node:assert/strict';
import { create, presets } from './model.mjs';

function packing(m) {
  for (let i = 0; i < m.organs.length; i++) {
    const a = m.organs[i]; assert.ok(a.x >= 0 && a.x < 1 && a.y >= 0 && a.r > 0);
    for (let j = i + 1; j < m.organs.length; j++) assert.ok(m.separation(a, m.organs[j]) >= a.r + m.organs[j].r - 2e-8);
  }
}
test('sequential packing is deterministic, nonoverlapping and supported at birth', () => {
  const a = create(19), b = create(19);
  for (let k = 0; k < 280; k++) {
    const before = a.organs.length; a.step(); b.step(); assert.equal(a.organs.length, before + 1);
    const q = a.organs.at(-1); for (const id of a.lastSupports) { const support = a.organs.find(p => p.id === id); assert.ok(Math.abs(a.separation(q, support) - q.r - support.r) < 1e-7); }
  }
  assert.deepEqual(a.values(), b.values()); packing(a); assert.equal(a.blocked, false);
});
test('packing remains valid through changing organ size and repeated removal', () => {
  for (const p of [...presets.map(p => p.values), { taper: .11, smallest: .025, budget: 550 }, { taper: .008, smallest: .14, budget: 450 }]) {
    const m = create(4, p);
    for (let k = 0; k < 650; k++) {
      if (k === 290) m.setParams({ taper: .11, smallest: .14 });
      if (k % 47 === 0 && m.organs.length > 10) { const q = m.projected.at(-1); m.interact(q.x, q.y); }
      m.step();
    }
    packing(m); assert.equal(m.blocked, false); assert.ok(m.values().every(Number.isFinite));
    assert.ok(m.projected.every(p => p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1 && p.size > 0));
  }
});
test('growth changes the actual front late in a run and stops at a finite budget', () => {
  const m = create(1, { taper: .045, smallest: .045, budget: 420 });
  for (let k = 0; k < 350; k++) m.step(); const before = m.values(); for (let k = 0; k < 30; k++) m.step(); assert.notDeepEqual(m.values(), before);
  for (let k = 0; k < 100; k++) m.step(); assert.equal(m.organs.length, 420); assert.equal(m.complete, true);
  const done = m.values(); m.step(); assert.deepEqual(m.values(), done);
  const q = m.projected.at(-1); m.interact(q.x, q.y); assert.ok(m.organs.length < 420); assert.equal(m.complete, false); m.step(); packing(m);
});

test('the chosen birth height is a global minimum of the exclusion envelope', () => {
  const m = create(31);
  for (let k = 0; k < 100; k++) {
    if (k % 7) { m.step(); continue; }
    const old = m.organs.slice(), floor = Math.max(...old.map(p => p.y)); m.step(); const q = m.organs.at(-1);
    let sampled = Infinity;
    for (let j = 0; j < 2048; j++) {
      const x = j / 2048; let y = floor;
      for (const p of old) { const raw = x - p.x, dx = raw - Math.round(raw), r = q.r + p.r; if (Math.abs(dx) < r) y = Math.max(y, p.y + Math.sqrt(r * r - dx * dx)); }
      sampled = Math.min(sampled, y);
    }
    assert.ok(q.y <= sampled + 1e-7); assert.ok(sampled - q.y < .004);
  }
});
