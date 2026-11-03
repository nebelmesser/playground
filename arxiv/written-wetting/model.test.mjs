import test from 'node:test';
import assert from 'node:assert/strict';
import { create, defaults, presets, tools } from './model.mjs';

function paintLine(m, tool) { for (let y = .2; y <= .8; y += .018) m.interact(.5, y, tool); }
function middleVolume(m) {
  let volume = 0, count = 0;
  for (let y = 0; y < m.n; y++) for (let x = 0; x < m.n; x++) if (Math.abs((x + .5) / m.n - .5) < .035 && (y + .5) / m.n > .25 && (y + .5) / m.n < .75) { volume += m.h[x + y * m.n]; count++; }
  return volume / count;
}

test('seed, written chemistry, parameter changes and relaxation replay exactly', () => {
  assert.equal(presets.length, 3); assert.equal(tools.length, 3);
  for (const preset of presets) assert.deepEqual(Object.keys(preset.values).sort(), Object.keys(defaults).sort());
  const a = create(83, defaults, 32), b = create(83, defaults, 32);
  for (let k = 0; k < 150; k++) {
    if (k % 17 === 0) { const tool = tools[(k / 17 | 0) % 3].id; a.interact(k / 150, .37, tool); b.interact(k / 150, .37, tool); }
    if (k === 71) { a.setParams({ sharpness: .8 }); b.setParams({ sharpness: .8 }); }
    a.step(); b.step();
  }
  assert.deepEqual(a.values(), b.values()); assert.equal(a.time, b.time);
});

test('the brush changes only substrate chemistry, is bounded, restores, and works while paused', () => {
  const m = create(2, defaults, 48), initial = [...m.h], initialTime = m.time, volume = m.mass(), centre = 24 + 24 * 48;
  const theta = m.theta[centre];
  for (let k = 0; k < 150; k++) m.interact(.51, .51, 'wet');
  assert.ok(m.theta[centre] < theta - 1); assert.equal(m.theta[centre], 12); assert.equal(m.chemistry[centre], -1);
  assert.deepEqual([...m.h], initial); assert.equal(m.mass(), volume); assert.equal(m.time, initialTime);
  for (let k = 0; k < 150; k++) m.interact(.51, .51, 'dry');
  assert.equal(m.chemistry[centre], 1); assert.ok(m.theta[centre] > theta + 10);
  m.interact(.51, .51, 'restore'); assert.ok(Math.abs(m.chemistry[centre] - m.original[centre]) < 1e-15);
  for (const tool of tools) for (const [x, y] of [[0, 0], [1, 1], [-4, 5]]) m.interact(x, y, tool.id);
  assert.ok(m.chemistry.every(v => v >= -1 && v <= 1)); assert.deepEqual([...m.h], initial);
  m.setParams({ thickness: .75 }); assert.deepEqual([...m.h], initial, 'initial thickness waits for restart');
});

test('finite-volume flow conserves liquid and descends its actual free energy', () => {
  const m = create(6, defaults, 48), mass = m.mass(); let previous = m.energy(), opened = false;
  for (let k = 0; k < 700; k++) {
    m.step(); const energy = m.energy();
    assert.ok(energy <= previous + 1e-8, `energy rose at ${k}: ${previous} → ${energy}`); previous = energy;
    assert.ok(Math.abs(m.mass() - mass) < 1e-9 * mass); assert.ok(m.h.every(h => h > 0));
    if (m.h.some(h => h < m.precursor * 1.15)) opened = true;
  }
  assert.ok(opened, 'the sheet truly ruptures to its precursor rather than merely changing colour');
  assert.ok(Math.max(...m.h) > defaults.thickness * 1.8, 'withdrawal collects a raised rim/pool');
});

test('wet and repellent writing cause opposite future transport without adding volume', () => {
  const reference = create(7, defaults, 64), wet = create(7, defaults, 64), dry = create(7, defaults, 64);
  paintLine(wet, 'wet'); paintLine(dry, 'dry');
  assert.deepEqual([...reference.h], [...wet.h]); assert.deepEqual([...reference.h], [...dry.h]);
  for (let k = 0; k < 300; k++) { reference.step(); wet.step(); dry.step(); }
  const unchanged = middleVolume(reference);
  assert.ok(middleVolume(wet) > unchanged + .10, 'wettable writing gathers liquid');
  assert.ok(middleVolume(dry) < unchanged - .04, 'repellent writing withdraws liquid');
  assert.ok(Math.abs(wet.mass() - reference.mass()) < 1e-8); assert.ok(Math.abs(dry.mass() - reference.mass()) < 1e-8);
});

test('preset, low and high corners stay positive, finite and conservative through late repeated drawing', () => {
  const runs = [...presets.map(p => p.values), { contrast: .2, sharpness: 0, thickness: .44 }, { contrast: 1.35, sharpness: 1, thickness: .75 }];
  for (const p of runs) {
    const m = create(11, p, 32), mass = m.mass();
    for (let k = 0; k < 1000; k++) {
      if (k % 83 === 0) m.interact((k % 13) / 12, (k % 17) / 16, tools[(k / 83 | 0) % 3].id);
      if (k === 600) m.setParams({ contrast: 1.35 - p.contrast + .2, sharpness: 1 - p.sharpness });
      m.step();
    }
    assert.ok(m.values().every(Number.isFinite)); assert.ok(m.h.every(h => h > m.precursor * .65));
    assert.ok(Math.abs(m.mass() - mass) < 1e-8 * mass); assert.ok(m.time > 179);
  }
});
