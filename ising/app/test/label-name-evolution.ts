import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';
import {
  mutatePlaceGenome, mutationMagnitude, placeLabel, placeStem,
  recombinePlaceGenomes, type PlaceGenome,
} from '../src/place-name.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
const loci = (genome: PlaceGenome): string[] => [
  ...genome.syllables.flatMap(({ onset, vowel }) => [onset, vowel]), genome.coda,
];

const first: PlaceGenome = {
  syllables: [{ onset: 's', vowel: 'o' }, { onset: 'r', vowel: 'a' }], coda: 'n',
};
const second: PlaceGenome = {
  syllables: [{ onset: 'm', vowel: 'e' }, { onset: 't', vowel: 'i' }], coda: 's',
};
const child = mutatePlaceGenome(first, 7, new Set([placeStem(first)]));
assert(loci(child).filter((gene, index) => gene !== loci(first)[index]).length === 1,
  'split descendant did not inherit all but one name gene');
assert(placeStem(child).length === placeStem(first).length, 'mutation changed inscription length');
const distantChild = mutatePlaceGenome(first, 77, new Set([placeStem(first)]), 4);
assert(loci(distantChild).filter((gene, index) => gene !== loci(first)[index]).length === 4,
  'rare descendant did not replace four distinct genes');
let magnitudeSeed = 0x7231;
const magnitudeRng = () => ((magnitudeSeed = (Math.imul(magnitudeSeed, 1664525) + 1013904223) >>> 0)
  / 0x100000000);
const magnitudes = [0, 0, 0, 0, 0];
for (let trial = 0; trial < 10000; trial += 1) {
  magnitudes[mutationMagnitude(magnitudeRng, 0.28)] += 1;
}
assert(magnitudes[1] > magnitudes[2] && magnitudes[2] > magnitudes[3]
  && magnitudes[3] > magnitudes[4] && magnitudes[4] > 100,
  `mutation strength is not rare-tailed (${magnitudes.join(',')})`);
const continentStems = ['soran', 'metis', 'furam', 'panor', 'valen', 'goris', 'tular', 'norem'];
const continentSuffixes = new Set(continentStems.map((stem) =>
  placeLabel('continent', stem).slice(stem.length)));
assert(continentSuffixes.size >= 3, 'new continents still all receive the same ending');
const dominant = recombinePlaceGenomes([
  { genome: first, weight: 80 }, { genome: second, weight: 20 },
]);
const balanced = recombinePlaceGenomes([
  { genome: first, weight: 50 }, { genome: second, weight: 50 },
]);
assert(loci(dominant).filter((gene, index) => gene === loci(first)[index]).length === 4,
  '80% parent did not contribute four of five name genes');
assert(loci(balanced).filter((gene, index) => gene === loci(second)[index]).length === 2,
  'balanced merge did not inherit two genes from the second parent');
const long: PlaceGenome = {
  syllables: [{ onset: 'f', vowel: 'a' }, { onset: 'l', vowel: 'e' }, { onset: 'r', vowel: 'i' }], coda: 'n',
};
const mixedLength = recombinePlaceGenomes([
  { genome: long, weight: 60 }, { genome: second, weight: 40 },
]);
assert(mixedLength.syllables.length === 3 && placeStem(mixedLength).length <= 8,
  'two- and three-syllable parents produced an invalid merged name');

let seed = 0x5311;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);
let nowMs = 1000;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => nowMs } });
const width = 48;
const height = 36;
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
const ingest = (tracker: PlaceTracker, rectangles: Rect[], seconds = 0.3): void => {
  nowMs += seconds * 1000;
  tracker.ingest(sample(rectangles));
};
const settle = (tracker: PlaceTracker): PlaceLabel[] => {
  let labels: PlaceLabel[] = [];
  for (let frame = 0; frame < 90; frame += 1) labels = tracker.advance(1 / 30, 'map', view);
  return labels.filter((label) => label.opacity > 0.5);
};

const whole: Rect[] = [[4, 18, 12, 26], [21, 43, 8, 30], [18, 22, 18, 20]];
const pieces: Rect[] = [[4, 18, 12, 26], [21, 43, 8, 30]];
const split = new PlaceTracker();
split.advance(0.016, 'map', view);
ingest(split, whole);
const ancestor = settle(split)[0];
assert(ancestor !== undefined, 'connected ancestor was not named');
ingest(split, pieces);
const descendants = settle(split);
assert(descendants.length === 2, `split did not produce two labels (${descendants.length})`);
const inherited = descendants.find((label) => label.id !== ancestor.id);
assert(inherited !== undefined && inherited.text !== ancestor.text, 'new region did not inherit a variant name');
const tracks = (split as unknown as { tracks: Map<number, { genome: PlaceGenome; lineage: number }> }).tracks;
const parent = tracks.get(ancestor.id);
const sibling = tracks.get(inherited.id);
assert(parent !== undefined && sibling !== undefined && parent.lineage === sibling.lineage,
  'split descendants lost their common lineage');
const splitDistance = loci(parent.genome).filter((gene, index) => gene !== loci(sibling.genome)[index]).length;
assert(splitDistance >= 1 && splitDistance <= 4,
  'split descendant lost its family resemblance');
ingest(split, whole, 0.5);
const reunited = settle(split);
assert(reunited.some((label) => label.id === ancestor.id && label.text === ancestor.text),
  'brief rejoining did not restore the ancestor name');
ingest(split, pieces, 0.5);
const resplit = settle(split);
assert(resplit.some((label) => label.text === inherited.text), 'brief repeated split invented another name');

const rareSplit = new PlaceTracker();
rareSplit.advance(0.016, 'map', view);
ingest(rareSplit, whole);
const rareAncestor = settle(rareSplit)[0];
const regularRandom = Math.random;
Math.random = () => 0; // The geometric tail reaches its rare, four-gene outcome.
ingest(rareSplit, pieces);
Math.random = regularRandom;
const rareChild = settle(rareSplit).find((label) => label.id !== rareAncestor.id);
assert(rareChild !== undefined, 'rare split did not create a descendant');
const rareTracks = (rareSplit as unknown as { tracks: Map<number, { genome: PlaceGenome }> }).tracks;
const rareParentGenome = rareTracks.get(rareAncestor.id)?.genome;
const rareChildGenome = rareTracks.get(rareChild.id)?.genome;
assert(rareParentGenome !== undefined && rareChildGenome !== undefined
  && loci(rareParentGenome).filter((gene, index) => gene !== loci(rareChildGenome)[index]).length >= 3,
  'rare split did not produce a distinctly named descendant');

const original: Rect[] = [[8, 30, 10, 26]];
const enlarged: Rect[] = [[8, 39, 10, 26]];
const evolving = new PlaceTracker();
evolving.advance(0.016, 'map', view);
ingest(evolving, original);
const initial = settle(evolving)[0];
assert(initial !== undefined, 'shape evolution setup had no label');
const evolvingTracks = (evolving as unknown as { tracks: Map<number, { genome: PlaceGenome }> }).tracks;
const initialGenome = evolvingTracks.get(initial.id)?.genome;
assert(initialGenome !== undefined, 'initial genome was lost');
for (let sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) ingest(evolving, enlarged);
assert(settle(evolving)[0].text === initial.text, 'shape mutation ignored its five-second cooldown');
ingest(evolving, original);
ingest(evolving, enlarged, 5.2);
ingest(evolving, original);
assert(settle(evolving)[0].text === initial.text, 'one transient shape excursion mutated the name');
for (let sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) ingest(evolving, enlarged);
const evolved = settle(evolving)[0];
assert(evolved.text !== initial.text, 'sustained shape change did not mutate one gene');
const evolvedTrack = (evolving as unknown as { tracks: Map<number, { genome: PlaceGenome }> }).tracks.get(evolved.id);
assert(evolvedTrack !== undefined, 'evolved track was lost');
const shapeDifference = loci(evolvedTrack.genome)
  .filter((gene, index) => gene !== loci(initialGenome)[index]).length;
assert(shapeDifference >= 1 && shapeDifference <= 4,
  'one sustained shape change did not produce a bounded mutation');
for (let sampleIndex = 0; sampleIndex < 20; sampleIndex += 1) ingest(evolving, enlarged, 0.3);
assert(settle(evolving)[0].text === evolved.text, 'unchanged shape kept mutating after its anchor was updated');

console.log('Place-name heredity, proportional crossover, stable mutation, and reunion passed.', {
  ancestor: ancestor.text, child: inherited.text, evolved: evolved.text,
});
