import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';

let nameSeed = 0x19a5;
Math.random = () => {
  nameSeed = (Math.imul(nameSeed, 1664525) + 1013904223) >>> 0;
  return nameSeed / 0x100000000;
};
let nowMs = 1000;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => nowMs } });

const width = 48;
const height = 36;
const cell = 12;
const view = { width: width * cell, height: height * cell };
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
const sample = (rectangles: Array<[number, number, number, number]>) => {
  const signs = new Int8Array(width * height).fill(-1);
  for (const [x0, x1, y0, y1] of rectangles) {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) signs[x + y * width] = 1;
    }
  }
  return { width, height, signs };
};
const advance = (tracker: PlaceTracker, ticks = 90): PlaceLabel[] => {
  let labels: PlaceLabel[] = [];
  for (let tick = 0; tick < ticks; tick += 1) labels = tracker.advance(1 / 30, 'map', view);
  return labels.filter((label) => label.opacity > 0.5);
};
const ingest = (tracker: PlaceTracker, rectangles: Array<[number, number, number, number]>, seconds = 0.3): void => {
  nowMs += seconds * 1000;
  tracker.ingest(sample(rectangles));
};

// A larger, younger continent joins an older island. The joined region keeps
// the oldest name even though its cell overlap is smaller.
const merged = new PlaceTracker();
merged.advance(0.016, 'map', view);
ingest(merged, [[4, 16, 10, 26]]);
const elder = advance(merged)[0];
assert(elder !== undefined, 'older region has no name');
ingest(merged, [[4, 16, 10, 26], [28, 44, 8, 28]]);
const separate = advance(merged);
assert(separate.length === 2, 'younger region has no distinct name');
const younger = separate.find((label) => label.text !== elder.text);
assert(younger !== undefined, 'younger region reused the old name before joining');
ingest(merged, [[4, 16, 10, 26], [16, 28, 17, 19], [28, 44, 8, 28]]);
const joined = advance(merged);
assert(joined.some((label) => label.text === elder.text && label.opacity > 0.8),
  `joined region lost its oldest name (${joined.map((label) => label.text)})`);
assert(!joined.some((label) => label.text === younger.text && label.opacity > 0.8),
  'younger merged name remained fully visible');
console.log('merge keeps oldest name', { elder: elder.text, younger: younger.text });

// A narrow island moves to adjacent cells with zero mask overlap. Its old
// inscription is carried along rather than replaced by a random new stem.
const adjacent = new PlaceTracker();
adjacent.advance(0.016, 'map', view);
ingest(adjacent, [[6, 26, 6, 12]]);
const first = advance(adjacent)[0];
assert(first !== undefined, 'adjacent setup has no label');
ingest(adjacent, [[6, 26, 12, 18]]);
const moved = advance(adjacent, 150);
assert(moved.some((label) => label.text === first.text),
  `adjacent continuation invented a new name (${first.text} -> ${moved.map((label) => label.text)})`);
console.log('adjacent continuation keeps name', first.text);

// The 5-second cooldown remembers a briefly absent region; after it expires
// a genuinely new region may receive a fresh name.
const returning = new PlaceTracker();
returning.advance(0.016, 'map', view);
ingest(returning, [[10, 26, 10, 26]]);
const original = advance(returning)[0];
assert(original !== undefined, 'returning setup has no label');
for (let seconds = 0; seconds < 4; seconds += 1) ingest(returning, [], 1);
ingest(returning, [[11, 27, 10, 26]], 0.5);
const recalled = advance(returning);
assert(recalled.some((label) => label.text === original.text), 'name was forgotten before the cooldown ended');
for (let seconds = 0; seconds < 6; seconds += 1) ingest(returning, [], 1);
ingest(returning, [[11, 27, 10, 26]], 0.5);
const renewed = advance(returning);
assert(renewed.length === 1 && renewed[0].text !== original.text,
  'name remained reserved after its spatial cooldown expired');
console.log('cooldown', { recalled: recalled[0].text, renewed: renewed[0].text });

// Lake is a cartographic category, not a printed word.
const lake = new PlaceTracker();
const lakeWidth = 112;
const lakeHeight = 80;
const lakeView = { width: lakeWidth * cell, height: lakeHeight * cell };
lake.advance(0.016, 'map', lakeView);
const lakeSigns = new Int8Array(lakeWidth * lakeHeight).fill(-1);
for (let y = 6; y < 74; y += 1) {
  for (let x = 8; x < 104; x += 1) lakeSigns[x + y * lakeWidth] = 1;
}
for (let y = 16; y < 28; y += 1) {
  for (let x = 18; x < 30; x += 1) lakeSigns[x + y * lakeWidth] = -1;
}
nowMs += 300;
lake.ingest({ width: lakeWidth, height: lakeHeight, signs: lakeSigns });
let lakeLabels: PlaceLabel[] = [];
for (let tick = 0; tick < 90; tick += 1) lakeLabels = lake.advance(1 / 30, 'map', lakeView);
const lakeLabel = lakeLabels.find((label) => label.kind === 'lake');
assert(lakeLabel !== undefined && !lakeLabel.text.toLowerCase().includes('lake'),
  `lake category leaked into its name (${lakeLabel?.text})`);
console.log('lake name', lakeLabel.text);
console.log('ok');
