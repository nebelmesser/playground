import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';
import type { PlaceGenome } from '../src/place-name.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
let randomSeed = 0x568e;
Math.random = () => ((randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0)
  / 0x100000000);
let nowMs = 1000;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => nowMs } });

const width = 112;
const height = 80;
const view = { width: width * 12, height: height * 12 };
type Rect = [number, number, number, number];
const sample = (rectangles: Rect[]) => {
  const signs = new Int8Array(width * height).fill(-1);
  for (const [x0, x1, y0, y1] of rectangles) {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) signs[x + y * width] = 1;
    }
  }
  return { width, height, signs };
};
const observe = (tracker: PlaceTracker, rectangles: Rect[], seconds = 0.3): PlaceLabel[] => {
  nowMs += seconds * 1000;
  tracker.ingest(sample(rectangles));
  let labels: PlaceLabel[] = [];
  for (let frame = 0; frame < 90; frame += 1) labels = tracker.advance(1 / 30, 'map', view);
  return labels.filter((label) => label.kind === 'island' && label.opacity > 0.8);
};
type Track = { kind: string; genome: PlaceGenome; suffix: string; pendingGenome: PlaceGenome | null };
const islandTracks = (tracker: PlaceTracker): Track[] => [
  ...(tracker as unknown as { tracks: Map<number, Track> }).tracks.values(),
].filter((track) => track.kind === 'island');
const lakeSample = (box: Rect) => {
  const signs = new Int8Array(width * height).fill(-1);
  for (let y = 6; y < 74; y += 1) {
    for (let x = 8; x < 104; x += 1) signs[x + y * width] = 1;
  }
  const [x0, x1, y0, y1] = box;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) signs[x + y * width] = -1;
  }
  return { width, height, signs };
};
const observeLake = (tracker: PlaceTracker, box: Rect, seconds = 0.3): PlaceLabel | undefined => {
  nowMs += seconds * 1000;
  tracker.ingest(lakeSample(box));
  let labels: PlaceLabel[] = [];
  for (let frame = 0; frame < 90; frame += 1) labels = tracker.advance(1 / 30, 'map', view);
  return labels.find((label) => label.kind === 'lake' && label.opacity > 0.8);
};

const grow = new PlaceTracker();
grow.advance(0.016, 'map', view);
const small: Rect[] = [[40, 48, 30, 38]]; // 64 cells: one syllable.
const medium: Rect[] = [[38, 50, 28, 40]]; // 144 cells: two syllables.
const large: Rect[] = [[34, 54, 26, 42]]; // 320 cells: three syllables.
const first = observe(grow, small)[0];
assert(first !== undefined && islandTracks(grow)[0].genome.syllables.length === 1,
  'small island had no one-syllable label');
const beforeCooldown = observe(grow, medium)[0];
assert(beforeCooldown?.id === first.id && beforeCooldown.text === first.text,
  'one growth observation replaced the name before its cooldown');
let second = observe(grow, medium, 5.1)[0];
for (let attempt = 0; attempt < 8 && islandTracks(grow)[0].genome.syllables.length < 2; attempt += 1) {
  second = observe(grow, medium)[0];
}
assert(second?.id === first.id && second.text.startsWith(first.text)
  && islandTracks(grow)[0].genome.syllables.length === 2 && second.opacity > 0.8,
  `growth did not append one sound in place (${first.text} -> ${second?.text})`);
observe(grow, large);
let third = observe(grow, large, 5.1)[0];
for (let attempt = 0; attempt < 8 && islandTracks(grow)[0].genome.syllables.length < 3; attempt += 1) {
  third = observe(grow, large)[0];
}
assert(third?.id === first.id && third.text.startsWith(second.text)
  && islandTracks(grow)[0].genome.syllables.length === 3 && third.opacity > 0.8,
  `further growth did not retain the old name as a prefix (${second.text} -> ${third?.text})`);
const contracted = observe(grow, small)[0];
assert(contracted?.id === first.id && contracted.text === first.text && contracted.opacity > 0.8,
  `contraction did not recover the original short name (${first.text} -> ${contracted?.text})`);
for (let cycle = 0; cycle < 6; cycle += 1) {
  const nearBoundary = observe(grow, cycle % 2 === 0 ? medium : small)[0];
  assert(nearBoundary?.id === first.id && nearBoundary.text === first.text,
    'size oscillation changed the name inside its cooldown');
}
let regrown = observe(grow, medium, 5.1)[0];
for (let attempt = 0; attempt < 8 && regrown?.text === first.text; attempt += 1) {
  regrown = observe(grow, medium)[0];
}
assert(regrown?.id === first.id && regrown.text === second.text,
  `regrowth invented another continuation (${second.text} -> ${regrown?.text})`);
observe(grow, large);
let restored = observe(grow, large, 5.1)[0];
for (let attempt = 0; attempt < 8 && restored?.text === second.text; attempt += 1) {
  restored = observe(grow, large)[0];
}
assert(restored?.id === first.id && restored.text === third.text,
  `later growth forgot the long inherited form (${third.text} -> ${restored?.text})`);

const lake = new PlaceTracker();
lake.advance(0.016, 'map', view);
const littleLake: Rect = [18, 23, 16, 21];
const grownLake: Rect = [15, 27, 13, 25];
const little = observeLake(lake, littleLake);
assert(little !== undefined, 'little lake had no short label');
observeLake(lake, grownLake);
let longer = observeLake(lake, grownLake, 5.1);
for (let attempt = 0; attempt < 8 && longer?.text === little.text; attempt += 1) {
  longer = observeLake(lake, grownLake);
}
assert(longer?.id === little.id && longer.text.startsWith(little.text)
  && longer.text.length > little.text.length && longer.opacity > 0.8,
  `lake growth did not append to its own name (${little.text} -> ${longer?.text})`);

const merge = new PlaceTracker();
merge.advance(0.016, 'map', view);
const separate: Rect[] = [[33, 41, 30, 38], [49, 57, 30, 38]];
const connected: Rect[] = [...separate, [41, 49, 33, 35]]; // 144 cells: two syllables.
const parents = observe(merge, separate).sort((a, b) => a.x - b.x);
assert(parents.length === 2 && islandTracks(merge).every((track) => track.genome.syllables.length === 1),
  'merge setup did not produce two short parent names');
const possibilities = [parents[0].text + parents[1].text, parents[1].text + parents[0].text]
  .map((name) => name.toLowerCase());
observe(merge, connected);
let descendant: PlaceLabel | undefined;
for (let sampleIndex = 0; sampleIndex < 24 && !descendant; sampleIndex += 1) {
  const labels = observe(merge, connected, 0.5);
  descendant = labels.find((label) => possibilities.includes(label.text.toLowerCase()));
}
assert(descendant !== undefined && parents.some((parent) => parent.id === descendant?.id)
  && descendant.opacity > 0.8 && islandTracks(merge).some((track) =>
    track.genome.syllables.length === 2 && track.pendingGenome === null),
  `two short parent names did not join on the surviving label (${parents.map((parent) => parent.text)})`);

console.log('name growth and merge', { small: first.text, medium: second.text, large: third.text,
  lake: `${little.text} -> ${longer.text}`,
  parents: parents.map((parent) => parent.text), merged: descendant.text });
