import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';

const WIDTH = 112;
const HEIGHT = 80;
const CELL = 8;
const VIEW = { width: WIDTH * CELL, height: HEIGHT * CELL };
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const ellipseAt = (width: number, height: number, offset: number): { width: number; height: number; signs: Int8Array } => {
  const signs = new Int8Array(width * height).fill(-1);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = (x - width / 2 - offset) / (width * 30 / WIDTH);
      const dy = (y - height / 2) / (height * 23 / HEIGHT);
      if (dx * dx + dy * dy < 1) signs[x + y * width] = 1;
    }
  }
  return { width, height, signs };
};
const ellipse = (offset: number): { width: number; height: number; signs: Int8Array } =>
  ellipseAt(WIDTH, HEIGHT, offset);

const islands = (): { width: number; height: number; signs: Int8Array } => {
  const signs = new Int8Array(WIDTH * HEIGHT).fill(-1);
  for (let cy = 15; cy <= 65; cy += 25) {
    for (let cx = 12; cx <= 100; cx += 22) {
      for (let y = cy - 8; y <= cy + 8; y += 1) {
        for (let x = cx - 8; x <= cx + 8; x += 1) {
          if ((x - cx) ** 2 + (y - cy) ** 2 <= 64) signs[x + y * WIDTH] = 1;
        }
      }
    }
  }
  return { width: WIDTH, height: HEIGHT, signs };
};

const visible = (labels: PlaceLabel[]): PlaceLabel[] => labels.filter((label) => label.opacity > 0.5);
const tracker = new PlaceTracker();
tracker.advance(1 / 30, 'map', VIEW);
tracker.ingest(ellipse(0));
let baseline: PlaceLabel[] = [];
for (let frame = 0; frame < 600; frame += 1) baseline = visible(tracker.advance(1 / 30, 'map', VIEW));
assert(baseline.length === 1, `expected one stable ellipse label, got ${baseline.length}`);
const initial = baseline[0];
let previous = initial;
let maxStep = 0;
let minimumOpacity = 1;
const ingestTimes: number[] = [];
for (let sample = 0; sample < 32; sample += 1) {
  const start = performance.now();
  tracker.ingest(ellipse(sample % 2));
  ingestTimes.push(performance.now() - start);
  for (let frame = 0; frame < 8; frame += 1) {
    const labels = tracker.advance(1 / 30, 'map', VIEW);
    const label = labels.find((candidate) => candidate.id === initial.id);
    assert(label !== undefined, `coast jitter dropped the label at sample ${sample}`);
    assert(Number.isFinite(label.x) && Number.isFinite(label.y)
      && Number.isFinite(label.fontSize) && Number.isFinite(label.angle), 'nonfinite label pose');
    assert(label.fontSize >= 8 && label.fontSize <= 64, 'font left supported range');
    maxStep = Math.max(maxStep, Math.hypot(label.x - previous.x, label.y - previous.y));
    minimumOpacity = Math.min(minimumOpacity, label.opacity);
    previous = label;
  }
}
assert(maxStep <= 140 / 30 + 0.3, `coast jitter exceeded speed limit (${maxStep.toFixed(2)}px/frame)`);
assert(minimumOpacity > 0.8, `coast jitter blinked (${minimumOpacity.toFixed(2)})`);
assert(Math.hypot(previous.x - initial.x, previous.y - initial.y) < 24,
  `coast jitter drifted the label ${Math.hypot(previous.x - initial.x, previous.y - initial.y).toFixed(1)}px`);
ingestTimes.sort((a, b) => a - b);
const p95 = ingestTimes[Math.floor(ingestTimes.length * 0.95)];
console.log('112×80 changing coast', {
  maxStep: Number(maxStep.toFixed(2)),
  minimumOpacity: Number(minimumOpacity.toFixed(2)),
  finalDrift: Number(Math.hypot(previous.x - initial.x, previous.y - initial.y).toFixed(1)),
  ingestP95ms: Number(p95.toFixed(1)),
});

const resizedView = { width: VIEW.width * 1.125, height: VIEW.height * 1.125 };
const resized = tracker.advance(0, 'map', resizedView).find((label) => label.id === initial.id);
assert(resized !== undefined, 'viewport resize dropped the label');
assert(Math.abs(resized.x - previous.x * 1.125) < 0.01
  && Math.abs(resized.y - previous.y * 1.125) < 0.01,
  'viewport resize changed the normalized label position');
assert(Math.abs(resized.fontSize - Math.min(64, previous.fontSize * 1.125)) < 0.01,
  'viewport resize did not scale the font');
tracker.ingest(ellipseAt(96, 68, 0));
const regridded = tracker.advance(1 / 30, 'map', resizedView);
const sameLabel = regridded.find((label) => label.id === initial.id);
assert(sameLabel !== undefined && sameLabel.opacity > 0.8,
  'sample-grid resize replaced or blinked the label');
assert(Math.hypot(sameLabel.x - resized.x, sameLabel.y - resized.y) <= 140 / 30 + 0.3,
  'sample-grid resize jumped farther than the movement limit');
assert(regridded.filter((label) => label.opacity > 0.5).length === 1,
  'sample-grid resize duplicated the label');
console.log('viewport and sample grid resize preserves the label', {
  id: sameLabel.id,
  step: Number(Math.hypot(sameLabel.x - resized.x, sameLabel.y - resized.y).toFixed(2)),
});

const many = new PlaceTracker();
many.advance(1 / 30, 'map', VIEW);
const manyStart = performance.now();
many.ingest(islands());
const manyElapsed = performance.now() - manyStart;
let manyLabels: PlaceLabel[] = [];
for (let frame = 0; frame < 600; frame += 1) manyLabels = visible(many.advance(1 / 30, 'map', VIEW));
assert(manyLabels.length >= 8, `many islands produced only ${manyLabels.length} labels`);
assert(new Set(manyLabels.map((label) => label.id)).size === manyLabels.length, 'duplicate placement ID');
console.log('15 islands', { labels: manyLabels.length, ingestMs: Number(manyElapsed.toFixed(1)) });
console.log('ok');
