import { PlaceTracker, type PlaceLabel, type RegionSample } from '../src/place-engine.ts';
import type { NameEvolution } from '../src/place-name.ts';

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
const temperature = 0.8;
const sampleSeconds = 0.3;
type Rect = [number, number, number, number];
type Track = { id: number; kind: string; stem: string; present: boolean; name: NameEvolution };
const tracks = (tracker: PlaceTracker): Track[] => [
  ...(tracker as unknown as { tracks: Map<number, Track> }).tracks.values(),
];
const islandTrack = (tracker: PlaceTracker): Track =>
  tracks(tracker).find((track) => track.present && track.kind === 'island')!;
const sample = (rectangles: Rect[]): RegionSample => {
  const signs = new Int8Array(width * height).fill(-1);
  for (const [x0, x1, y0, y1] of rectangles) {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) signs[x + y * width] = 1;
    }
  }
  return { width, height, signs };
};
const lakeSample = (box: Rect): RegionSample => {
  const field = sample([[8, 104, 6, 74]]);
  const [x0, x1, y0, y1] = box;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) field.signs[x + y * width] = -1;
  }
  return field;
};
// Sample and animate the same amount of elapsed time. A single large clock
// jump is insufficient because adaptation integrates successive observations.
const observe = (tracker: PlaceTracker, field: RegionSample): PlaceLabel[] => {
  nowMs += sampleSeconds * 1000;
  tracker.ingest(field, temperature);
  let labels: PlaceLabel[] = [];
  for (let frame = 0; frame < 9; frame += 1) labels = tracker.advance(1 / 30, 'map', view);
  const stems = tracks(tracker).map((track) => track.stem);
  assert(new Set(stems).size === stems.length, 'two tracked places acquired the same name');
  return labels.filter((label) => label.opacity > 0.8);
};
const settle = (tracker: PlaceTracker, field: RegionSample): PlaceLabel[] => {
  let labels: PlaceLabel[] = [];
  for (let index = 0; index < 12; index += 1) labels = observe(tracker, field);
  return labels;
};
const waitFor = (
  tracker: PlaceTracker, field: RegionSample, predicate: (labels: PlaceLabel[]) => boolean,
  failure: string, maximumSamples = 80,
): PlaceLabel[] => {
  for (let index = 0; index < maximumSamples; index += 1) {
    const labels = observe(tracker, field);
    if (predicate(labels)) return labels;
  }
  throw new Error(failure);
};
const islandLabel = (labels: PlaceLabel[]): PlaceLabel | undefined =>
  labels.find((label) => label.kind === 'island');
const lakeLabel = (labels: PlaceLabel[]): PlaceLabel | undefined =>
  labels.find((label) => label.kind === 'lake');

const grow = new PlaceTracker();
grow.advance(0.016, 'map', view);
const small = sample([[40, 48, 30, 38]]); // 64 cells: one syllable.
const medium = sample([[38, 50, 28, 40]]); // 144 cells: two syllables.
const large = sample([[34, 54, 26, 42]]); // 320 cells: three syllables.
const first = islandLabel(settle(grow, small))!;
const originalTrackId = islandTrack(grow).id;
const inheritedGenes = JSON.stringify(islandTrack(grow).name.genes);
assert(first !== undefined && islandTrack(grow).name.genome.syllables.length === 1,
  'small island had no one-syllable label');
const beforeCooldown = islandLabel(observe(grow, medium));
assert(beforeCooldown?.id === first.id && beforeCooldown.text === first.text,
  'one growth observation replaced the name before its cooldown');
const second = islandLabel(waitFor(grow, medium, (labels) =>
  islandTrack(grow).name.genome.syllables.length === 2 && islandLabel(labels) !== undefined,
  'growth did not express the next inherited syllable'))!;
assert(second.id === first.id && second.text.startsWith(first.text),
  `growth did not append one sound in place (${first.text} -> ${second.text})`);
const third = islandLabel(waitFor(grow, large, (labels) =>
  islandTrack(grow).name.genome.syllables.length === 3 && islandLabel(labels) !== undefined,
  'further growth did not express the third inherited syllable'))!;
assert(third.id === first.id && third.text.startsWith(second.text),
  `further growth did not retain the old name as a prefix (${second.text} -> ${third.text})`);
assert(JSON.stringify(islandTrack(grow).name.genes) === inheritedGenes,
  'growth replaced the latent chromosome instead of exposing it');

const contractionStartedAt = nowMs;
observe(grow, small);
assert(islandTrack(grow).name.genome.syllables.length === 3,
  'contraction bypassed the inherited expression cooldown');
for (let cycle = 0; cycle < 6; cycle += 1) {
  observe(grow, cycle % 2 === 0 ? medium : small);
  assert(islandTrack(grow).name.genome.syllables.length === 3,
    'size oscillation changed the name inside its cooldown');
}
const contracted = islandLabel(waitFor(grow, small, (labels) =>
  islandTrack(grow).name.genome.syllables.length === 1 && islandLabel(labels) !== undefined,
  'contraction did not recover the short inherited form'))!;
assert(nowMs - contractionStartedAt >= 5000 && contracted.text === first.text,
  `contraction did not preserve cooldown and short form (${first.text} -> ${contracted.text})`);
const regrown = islandLabel(waitFor(grow, medium, (labels) =>
  islandTrack(grow).name.genome.syllables.length === 2 && islandLabel(labels) !== undefined,
  'regrowth did not recover the medium inherited form'))!;
assert(regrown.text === second.text,
  `regrowth invented another continuation (${second.text} -> ${regrown.text})`);
const restored = islandLabel(waitFor(grow, large, (labels) =>
  islandTrack(grow).name.genome.syllables.length === 3 && islandLabel(labels) !== undefined,
  'later growth did not recover the long inherited form'))!;
assert(restored.text === third.text && islandTrack(grow).id === originalTrackId
  && JSON.stringify(islandTrack(grow).name.genes) === inheritedGenes,
  `shrink/regrow lost identity or hereditary sounds (${third.text} -> ${restored.text})`);

const lake = new PlaceTracker();
lake.advance(0.016, 'map', view);
const littleLake = lakeSample([18, 23, 16, 21]);
const grownLake = lakeSample([15, 27, 13, 25]);
const little = lakeLabel(settle(lake, littleLake))!;
assert(little !== undefined, 'little lake had no short label');
const lakeGenes = JSON.stringify(tracks(lake).find((track) => track.kind === 'lake')!.name.genes);
const longer = lakeLabel(waitFor(lake, grownLake, (labels) => {
  const label = lakeLabel(labels);
  return label !== undefined && label.text.length > little.text.length;
}, 'lake growth did not express another syllable'))!;
assert(longer.id === little.id && longer.text.startsWith(little.text)
  && JSON.stringify(tracks(lake).find((track) => track.kind === 'lake')!.name.genes) === lakeGenes,
  `lake growth did not expose its inherited name (${little.text} -> ${longer.text})`);

const merge = new PlaceTracker();
merge.advance(0.016, 'map', view);
const separate: Rect[] = [[33, 41, 30, 38], [49, 57, 30, 38]];
const connected = sample([...separate, [41, 49, 33, 35]]); // 144 cells: two syllables.
const parents = settle(merge, sample(separate)).filter((label) => label.kind === 'island')
  .sort((a, b) => a.x - b.x);
const parentTracks = tracks(merge).filter((track) => track.kind === 'island');
assert(parents.length === 2 && parentTracks.every((track) => track.name.genome.syllables.length === 1),
  'merge setup did not produce two short parent names');
const parentalSounds = parentTracks.map((track) => {
  const syllable = track.name.genome.syllables[0];
  return syllable.onset + syllable.vowel;
});
const parentalTrackIds = parentTracks.map((track) => track.id);
const hasBothParents = (): boolean => {
  const track = islandTrack(merge);
  const sounds = track.name.genome.syllables.map((syllable) => syllable.onset + syllable.vowel);
  return track.name.pending === null && sounds.length === 2
    && parentalSounds.every((sound) => sounds.includes(sound));
};
const descendant = islandLabel(waitFor(merge, connected, (labels) =>
  hasBothParents() && islandLabel(labels) !== undefined,
  'merged name did not inherit a syllable sound from each comparable parent'))!;
assert(parents.some((parent) => parent.id === descendant.id)
  && parentalTrackIds.includes(islandTrack(merge).id),
  'merge replaced the surviving label or track identity');
const literalJoins = [parents[0].text + parents[1].text, parents[1].text + parents[0].text]
  .map((name) => name.toLowerCase());
assert(!literalJoins.includes(descendant.text.toLowerCase()),
  'merge concatenated both full parent labels instead of recombining syllable sounds');

console.log('name growth and sound inheritance', {
  small: first.text, medium: second.text, large: third.text,
  regrown: restored.text, lake: `${little.text} -> ${longer.text}`,
  parents: parents.map((parent) => parent.text), merged: descendant.text,
});
