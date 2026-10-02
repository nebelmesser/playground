import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';
import { FITTING_NAME, fixtureName } from './helpers/name-fixture.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const width = 56;
const height = 42;
const viewport = { width: 672, height: 504 };
let now = 1000;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => now } });
let seed = 1;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);

// The long, thin region pivots around its center. Its label can fit both
// orientations, but no legal in-place turn exists between them.
const rotated = (degrees: number, wobble = 0) => {
  const signs = new Int8Array(width * height).fill(-1);
  const radians = degrees * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - 28;
      const dy = y - 21;
      const along = dx * cos + dy * sin;
      const across = -dx * sin + dy * cos;
      const radius = 2.7 + Math.sin(along * 0.7 + wobble) * 0.2;
      if ((along / 20) ** 2 + (across / radius) ** 2 < 1) signs[x + y * width] = 1;
    }
  }
  return { width, height, signs };
};

const tracker = new PlaceTracker();
tracker.advance(0.016, 'map', viewport);
tracker.ingest(rotated(-70));
fixtureName(tracker, FITTING_NAME);
tracker.ingest(rotated(-70));
let labels: PlaceLabel[] = [];
for (let frame = 0; frame < 100; frame += 1) labels = tracker.advance(1 / 30, 'map', viewport);
assert(labels.length === 1 && labels[0].opacity > 0.9, 'initial label did not settle');
const first = labels[0];
assert(first.angle < -40, `setup did not produce a diagonal label (${first.angle.toFixed(1)}°)`);

let maximumMove = 0;
let maximumTurn = 0;
let minimumOpacity = first.opacity;
let previous = first;
for (let sample = 0; sample < 30; sample += 1) {
  now += 100;
  tracker.ingest(rotated(sample % 2 === 0 ? 70 : -70, sample * 0.25));
  for (let frame = 0; frame < 3; frame += 1) {
    labels = tracker.advance(1 / 30, 'map', viewport);
    const sameName = labels.filter((label) => label.text === first.text);
    assert(sameName.length === 1, `same-place turn produced ${sameName.length} copies`);
    const next = sameName[0];
    assert(next.id === first.id, `same-place turn replaced placement ${first.id} with ${next.id}`);
    maximumMove = Math.max(maximumMove, Math.hypot(next.x - previous.x, next.y - previous.y));
    maximumTurn = Math.max(maximumTurn, Math.abs(next.angle - previous.angle));
    minimumOpacity = Math.min(minimumOpacity, next.opacity);
    previous = next;
  }
}
assert(maximumMove < 6, `label jumped ${maximumMove.toFixed(1)}px in a frame`);
assert(maximumTurn < 10, `label turned ${maximumTurn.toFixed(1)}° in a frame`);
assert(minimumOpacity > 0.25, `same-place retarget faded label to ${minimumOpacity.toFixed(2)}`);

// A gradual coast rotation must still find a continuous turn; the guard may
// hold an impossible abrupt turn, but it must not freeze every local update.
const turning = new PlaceTracker();
turning.advance(0.016, 'map', viewport);
turning.ingest(rotated(-70));
fixtureName(turning, FITTING_NAME);
turning.ingest(rotated(-70));
for (let frame = 0; frame < 100; frame += 1) labels = turning.advance(1 / 30, 'map', viewport);
const turningId = labels[0].id;
for (let degrees = -65; degrees <= 70; degrees += 5) {
  now += 300;
  turning.ingest(rotated(degrees));
  for (let frame = 0; frame < 9; frame += 1) {
    labels = turning.advance(1 / 30, 'map', viewport);
    assert(labels.length === 1 && labels[0].id === turningId, 'gradual coast rotation replaced the label');
  }
}
assert(labels[0].angle > 20, `gradual coast rotation did not turn the label (${labels[0].angle.toFixed(1)}°)`);
console.log('Same-place rotating region keeps one continuous label.', {
  placement: first.id,
  maxMove: maximumMove.toFixed(2),
  maxTurn: maximumTurn.toFixed(2),
  minOpacity: minimumOpacity.toFixed(2),
  gradualTurn: labels[0].angle.toFixed(1),
});
