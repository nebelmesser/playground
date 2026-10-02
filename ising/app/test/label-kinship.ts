import { PlaceTracker, type PlaceLabel, type RegionSample } from '../src/place-engine.ts';
import { NameEvolution, placeStem, type PlaceGenome, type PlaceKind } from '../src/place-name.ts';

const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };
const seeded = (seed: number) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);
let nowMs = 1000;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => nowMs } });
const width = 112;
const height = 80;
const view = { width: width * 12, height: height * 12 };
type Rect = [number, number, number, number];
type NamedTrack = {
  id: number; kind: PlaceKind; stem: string; text: string; name: NameEvolution; present: boolean;
};
const tracks = (tracker: PlaceTracker): NamedTrack[] =>
  [...(tracker as unknown as { tracks: Map<number, NamedTrack> }).tracks.values()];
const left: Rect = [10, 30, 20, 50];
const right: Rect = [34, 46, 27, 39];
const bridge: Rect = [30, 34, 32, 34];
const whole = [left, right, bridge];
const pieces = [left, right];
const sample = (rectangles: Rect[], lake: boolean): RegionSample => {
  const signs = new Int8Array(width * height).fill(lake ? 1 : -1);
  for (const [x0, x1, y0, y1] of rectangles) {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) signs[x + y * width] = lake ? -1 : 1;
    }
  }
  return { width, height, signs };
};
const visible = (tracker: PlaceTracker, frames = 60): PlaceLabel[] => {
  let labels: PlaceLabel[] = [];
  for (let frame = 0; frame < frames; frame += 1) labels = tracker.advance(1 / 30, 'map', view);
  return labels.filter((label) => label.opacity > 0.5);
};
const belongs = (track: NamedTrack, lake: boolean): boolean => lake ? track.kind === 'lake' : track.kind !== 'lake';
const observe = (tracker: PlaceTracker, rectangles: Rect[], lake: boolean, seconds = 0.25): PlaceLabel[] => {
  nowMs += seconds * 1000;
  tracker.ingest(sample(rectangles, lake), 0.8);
  return visible(tracker, 30);
};
const core = (genome: PlaceGenome): string[] => genome.syllables.map((part) => part.onset + part.vowel);
const orderedDifferences = (original: PlaceGenome, current: PlaceGenome): number =>
  current.syllables.reduce((count, part, index) => count
    + Number(part.onset !== original.syllables[index].onset)
    + Number(part.vowel !== original.syllables[index].vowel), 0);
const expectFamily = (original: PlaceGenome, current: PlaceGenome, context: string): void => {
  assert(current.syllables.length === 3 && orderedDifferences(original, current) <= 1,
    `${context}: reunion duplicated or reordered family sounds (${core(original)} -> ${core(current)})`);
  assert(new Set(core(current)).size === 3,
    `${context}: a homologous sound was copied twice (${core(current)})`);
  assert(current.ending === original.ending, `${context}: reunion replaced the family's inherited ending`);
};

const results: Array<{ kind: string; original: string; child: string; reunited: string }> = [];
for (const lake of [false, true]) {
  // Pick a deterministic founder whose three distinct cores make a duplicated
  // homolog distinguishable from an ordinary one-allele spelling mutation.
  // Single vowels also avoid cutting a cluster+diphthong into a short form.
  let tracker!: PlaceTracker;
  let ancestor!: NamedTrack;
  let random!: () => number;
  for (let attempt = 0; attempt < 64; attempt += 1) {
    random = seeded(0x137a + attempt * 1337);
    Math.random = random;
    tracker = new PlaceTracker();
    tracker.advance(1 / 30, 'map', view);
    observe(tracker, whole, lake);
    ancestor = tracks(tracker).find((track) => track.present && belongs(track, lake))!;
    const syllables = ancestor?.name.genes.chromosome.syllables;
    if (syllables?.length === 3 && syllables.every((part) => part.vowel.length === 1)
      && new Set(syllables.map((part) => part.onset)).size === 3
      && new Set(syllables.map((part) => part.vowel)).size === 3) break;
    ancestor = undefined!;
  }
  assert(ancestor !== undefined, 'could not construct a distinct-core kinship fixture');
  const original = ancestor.name.genes.chromosome;
  const originalSnapshot = JSON.stringify(ancestor.name.genes);
  const originalText = ancestor.text;
  const originalId = ancestor.id;
  const birthDeadline = ancestor.name.nextChangeAt;
  assert(visible(tracker).some((label) => label.id === originalId),
    `${lake ? 'lake' : 'island'} ancestor was not visibly placed`);

  // The small right lobe is sibling index1. Its two-syllable fragment starts at
  // the parent's second sound, so its chromosome has a different storage order.
  Math.random = () => 0.5; // Ordinary one-locus offspring mutation, never saltation.
  observe(tracker, pieces, lake);
  Math.random = random;
  const children = tracks(tracker).filter((track) => track.present && belongs(track, lake));
  const child = children.find((track) => track.id !== originalId)!;
  assert(children.length === 2 && child !== undefined && child.name.genome.syllables.length === 2,
    'split did not create a two-syllable right-hand descendant');
  assert(child.name.genes.generation === ancestor.name.genes.generation + 1,
    'split offspring lost its hereditary generation');
  assert(JSON.stringify(ancestor.name.genes) === originalSnapshot,
    'splitting edited the ancestor chromosome');
  assert(visible(tracker).filter((label) => children.some((track) => track.id === label.id)).length === 2,
    'split descendants were not both visibly placed');
  const childText = child.text;

  observe(tracker, whole, lake);
  ancestor = tracks(tracker).find((track) => track.present && belongs(track, lake))!;
  assert(ancestor.id === originalId && ancestor.text === originalText && ancestor.name.nextChangeAt === birthDeadline,
    'reunion changed region identity, visible text or hereditary deadline during cooldown');
  expectFamily(original, ancestor.name.hereditary.genes.chromosome, 'first queued reunion');

  // Repeated short-lived bridges should recall the same child and repeatedly
  // align homologous sounds, never compound a name with another copy of itself.
  for (let cycle = 0; cycle < 3; cycle += 1) {
    observe(tracker, pieces, lake);
    const recalled = tracks(tracker).find((track) => track.id === child.id);
    assert(recalled?.present && recalled.text === childText,
      'short topology cycle invented another descendant instead of recalling its name');
    observe(tracker, whole, lake);
    ancestor = tracks(tracker).find((track) => track.present && belongs(track, lake))!;
    assert(ancestor.id === originalId && ancestor.text === originalText
      && ancestor.name.nextChangeAt === birthDeadline,
      'topology jitter changed a visible name or reset its cooldown');
    expectFamily(original, ancestor.name.hereditary.genes.chromosome, `queued reunion ${cycle + 2}`);
  }

  let lastVisibleChange = birthDeadline - ancestor.name.genes.cooldown;
  let previousText = ancestor.text;
  for (let tick = 0; tick < 64; tick += 1) {
    observe(tracker, whole, lake);
    ancestor = tracks(tracker).find((track) => track.present && belongs(track, lake))!;
    assert(ancestor.id === originalId, 'settled reunion replaced the survivor identity');
    if (ancestor.text !== previousText) {
      assert(nowMs / 1000 - lastVisibleChange >= 5 - 1e-8,
        'a reunion changed visible text before five seconds');
      lastVisibleChange = nowMs / 1000;
      previousText = ancestor.text;
    }
    expectFamily(original, ancestor.name.hereditary.genes.chromosome, 'settled family inheritance');
  }
  expectFamily(original, ancestor.name.genes.chromosome, 'expressed reunion');
  assert(visible(tracker).some((label) => label.id === originalId && label.text === ancestor.text),
    'reunited family label disappeared after expression');
  assert(JSON.stringify(original) === JSON.stringify(JSON.parse(originalSnapshot).chromosome),
    'reunion mutated the original chromosome snapshot');
  results.push({ kind: lake ? 'lake' : 'island', original: originalText, child: childText, reunited: ancestor.text });
}
// Matching sounds do not prove kinship. Independent founders made from the
// same random stream must still undergo an ordinary area-weighted crossover.
const unrelatedFirst = new NameEvolution({ areaFraction: 0.08, now: 0, rng: seeded(4953) });
const unrelatedSecond = new NameEvolution({ areaFraction: 0.08, now: 0, rng: seeded(4953) });
const unrelatedOriginal = core(unrelatedFirst.genome);
assert(placeStem(unrelatedFirst.genome) === placeStem(unrelatedSecond.genome)
  && new Set(unrelatedOriginal).size === 3,
  'unrelated identical-sounding founder fixture is not valid');
unrelatedFirst.recombine([
  { genes: unrelatedFirst.genes, genome: unrelatedFirst.genome, weight: 60 },
  { genes: unrelatedSecond.genes, genome: unrelatedSecond.genome, weight: 40 },
], 0.08);
const unrelatedCross = core(unrelatedFirst.hereditary.genome);
assert(unrelatedCross[0] === unrelatedOriginal[0] && unrelatedCross[1] === unrelatedOriginal[1]
  && unrelatedCross[2] === unrelatedOriginal[0],
  `independent matching names were mistaken for homologous ancestry (${unrelatedOriginal} -> ${unrelatedCross})`);
console.log('Related island/lake fragments reunite in inherited order without repeated homologs.', results);
