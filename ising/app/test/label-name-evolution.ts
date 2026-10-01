import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';
import { placeStem } from '../src/place-name.ts';
import type { NameEvolution } from '../src/place-name.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
let seed = 0x5311;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);
let nowMs = 1000;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => nowMs } });
const width = 48;
const height = 36;
const view = { width: width * 12, height: height * 12 };
type Rect = [number, number, number, number];
type NamedTrack = { id: number; stem: string; text: string; name: NameEvolution; present: boolean };
const tracks = (tracker: PlaceTracker) => (tracker as unknown as { tracks: Map<number, NamedTrack> }).tracks;
const sample = (rectangles: Rect[]) => {
  const signs = new Int8Array(width * height).fill(-1);
  for (const [x0, x1, y0, y1] of rectangles) {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) signs[x + y * width] = 1;
    }
  }
  return { width, height, signs };
};
const ingest = (tracker: PlaceTracker, rectangles: Rect[], seconds = 0.3): void => {
  nowMs += seconds * 1000;
  tracker.ingest(sample(rectangles), 0.8);
};
const settle = (tracker: PlaceTracker): PlaceLabel[] => {
  let labels: PlaceLabel[] = [];
  for (let frame = 0; frame < 60; frame += 1) labels = tracker.advance(1 / 30, 'map', view);
  return labels.filter((label) => label.opacity > 0.5);
};

const whole: Rect[] = [[4, 18, 12, 26], [21, 43, 8, 30], [18, 22, 18, 20]];
const pieces: Rect[] = [[4, 18, 12, 26], [21, 43, 8, 30]];
const split = new PlaceTracker();
split.advance(0.016, 'map', view);
ingest(split, whole);
const ancestor = settle(split)[0];
assert(ancestor !== undefined, 'connected ancestor was not named');
const originalDNA = JSON.stringify(tracks(split).get(ancestor.id)!.name.genes);
ingest(split, pieces);
const descendants = settle(split);
assert(descendants.length === 2, `split did not produce two labels (${descendants.length})`);
const inherited = descendants.find((label) => label.id !== ancestor.id)!;
assert(inherited !== undefined && inherited.text !== ancestor.text, 'split child has no distinct inherited name');
const parent = tracks(split).get(ancestor.id)!;
const child = tracks(split).get(inherited.id)!;
assert(child.name.genes.generation === parent.name.genes.generation + 1,
  'new descendant did not inherit a new genetic generation');
assert(JSON.stringify(parent.name.genes) === originalDNA, 'creating a child mutated the parent DNA');
const parentSounds = parent.name.genes.chromosome.syllables.flatMap(({ onset, vowel }) => [onset, vowel]);
const childSounds = child.name.genes.chromosome.syllables.flatMap(({ onset, vowel }) => [onset, vowel]);
assert(childSounds.filter((sound) => parentSounds.includes(sound)).length >= 3,
  'ordinary descendant lost its family sounds');

// Flickering bridges recover the remembered child, and never reset a naming
// deadline or make a surviving label change faster than its inherited clock.
ingest(split, whole, 0.5);
assert(settle(split).some((label) => label.id === ancestor.id && label.text === ancestor.text),
  'brief rejoining changed the surviving name during its cooldown');
ingest(split, pieces, 0.5);
assert(settle(split).some((label) => label.text === inherited.text),
  'brief repeated split invented another child name');
const deadlines = new Map([...tracks(split)].map(([id, track]) => [id, track.name.nextChangeAt]));
for (let cycle = 0; cycle < 6; cycle += 1) {
  ingest(split, cycle % 2 ? pieces : whole, 0.3);
  settle(split);
  for (const [id, deadline] of deadlines) {
    assert(tracks(split).get(id)?.name.nextChangeAt === deadline,
      'topology jitter restarted the hereditary cooldown');
  }
}

// A stable merger expresses the queued crossover after the clock permits it.
// No per-observation mutation is allowed to erase the parents before that.
const merge = new PlaceTracker();
merge.advance(0.016, 'map', view);
ingest(merge, pieces);
const founders = settle(merge);
assert(founders.length === 2, 'merge setup did not name both parents');
ingest(merge, whole);
const survivor = [...tracks(merge).values()].find((track) => track.present)!;
assert(survivor.name.pending?.cause === 'recombination', 'merged region has no genetic crossover');
const target = placeStem(survivor.name.pending!.genome);
const initial = survivor.text;
for (let tick = 0; tick < 48 && survivor.stem !== target; tick += 1) {
  const before = survivor.name.nextChangeAt;
  ingest(merge, whole, 0.25);
  settle(merge);
  if (nowMs / 1000 < before) assert(survivor.text === initial, 'merge ignored its expression cooldown');
}
assert(survivor.stem === target && survivor.name.genes.generation > 0,
  'stable merger failed to express inherited DNA');
assert(founders.some((label) => label.id === survivor.id), 'genetic merge replaced the region identity');
const names = [...tracks(merge).values()].map((track) => track.stem);
assert(new Set(names).size === names.length, 'merge produced duplicate reserved names');
console.log('Genetic split, brief reunion, topology cooldown and stable crossover passed.', {
  ancestor: ancestor.text, child: inherited.text, parents: founders.map((label) => label.text), merged: survivor.text,
});
