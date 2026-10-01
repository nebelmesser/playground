import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';

let nowMs = 1000;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => nowMs } });
let seed = 123;
Math.random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
};

const width = 48;
const height = 36;
const cell = 12;
const view = { width: width * cell, height: height * cell };
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
const movingRegion = (left: number) => {
  const signs = new Int8Array(width * height).fill(-1);
  for (let y = 5; y < 30; y += 1) {
    for (let x = left; x < left + 8; x += 1) signs[x + y * width] = 1;
  }
  return { width, height, signs };
};

// The coastline moves at 120 px/s, below the label's 140 px/s speed limit.
// With the old slow spring, the first route barely moved before the next
// sample; every second sample then crossfaded to a pose only ~45 px away.
const tracker = new PlaceTracker();
tracker.advance(0.016, 'map', view);
tracker.ingest(movingRegion(3));
let labels: PlaceLabel[] = [];
for (let frame = 0; frame < 60; frame += 1) labels = tracker.advance(1 / 30, 'map', view);
const first = labels.find((label) => label.kind === 'continent');
assert(first !== undefined && first.opacity > 0.8, 'moving-region fixture did not form a label');
let previous = first;
let maxStep = 0;
let minimumOpacity = first.opacity;
for (let sample = 1; sample <= 7; sample += 1) {
  nowMs += 200;
  tracker.ingest(movingRegion(3 + sample * 2));
  for (let frame = 0; frame < 6; frame += 1) {
    labels = tracker.advance(1 / 30, 'map', view);
    assert(labels.length === 1 && labels[0].id === first.id,
      `nearby coast change crossfaded the inscription at sample ${sample}: ${labels.map((label) => label.id)}`);
    const label = labels[0];
    maxStep = Math.max(maxStep, Math.hypot(label.x - previous.x, label.y - previous.y));
    minimumOpacity = Math.min(minimumOpacity, label.opacity);
    previous = label;
  }
}
assert(previous.x > first.x + 65, `inscription did not follow the moving region (${previous.x - first.x}px)`);
assert(maxStep <= 140 / 30 + 0.3, `inscription exceeded the glide speed (${maxStep}px/frame)`);
assert(minimumOpacity > 0.75, `inscription blinked while following the coast (${minimumOpacity})`);
console.log('nearby moving coast morphs', {
  from: Math.round(first.x), to: Math.round(previous.x),
  maxStep: Number(maxStep.toFixed(2)), minimumOpacity: Number(minimumOpacity.toFixed(2)),
});

// More frequent one-cell updates make the target only about 18 px from the
// still moving body. Its previous route remains legal even when the body no
// longer fits the union of the two most recent observed shorelines.
const rapid = new PlaceTracker();
rapid.advance(0.016, 'map', view);
rapid.ingest(movingRegion(3));
for (let frame = 0; frame < 60; frame += 1) labels = rapid.advance(1 / 30, 'map', view);
const rapidFirst = labels[0];
assert(rapidFirst !== undefined && rapidFirst.opacity > 0.8, 'rapid fixture did not form a label');
let rapidPrevious = rapidFirst;
for (let sample = 1; sample <= 8; sample += 1) {
  nowMs += 100;
  rapid.ingest(movingRegion(3 + sample));
  for (let frame = 0; frame < 3; frame += 1) {
    labels = rapid.advance(1 / 30, 'map', view);
    assert(labels.length === 1 && labels[0].id === rapidFirst.id,
      `one-cell coast change crossfaded only ${sample * cell}px away: ${labels.map((label) => label.id)}`);
    assert(Math.hypot(labels[0].x - rapidPrevious.x, labels[0].y - rapidPrevious.y) <= 140 / 30 + 0.3,
      'rapid shore change moved too far in one frame');
    rapidPrevious = labels[0];
  }
}
assert(rapidPrevious.x > rapidFirst.x + 65,
  `rapid shore samples stranded the old inscription (${rapidPrevious.x - rapidFirst.x}px)`);
console.log('frequent coast samples retain one body', { from: Math.round(rapidFirst.x), to: Math.round(rapidPrevious.x) });
console.log('ok');
