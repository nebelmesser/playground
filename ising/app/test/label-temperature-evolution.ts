import { nameMutationMobility, nameThermalRates, PlaceTracker } from '../src/place-engine.ts';
import { borrowPlaceGenomeGene, placeStem, type PlaceGenome } from '../src/place-name.ts';
import { advanceHeldTemperature } from '../src/temperature-control.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
const loci = (genome: PlaceGenome): string[] => [
  ...genome.syllables.flatMap(({ onset, vowel }) => [onset, vowel]), genome.coda,
];
const resemblance = (a: PlaceGenome, b: PlaceGenome): number => {
  const left = loci(a);
  const right = loci(b);
  return left.reduce((count, allele, index) => {
    const source = index === left.length - 1 ? right.length - 1
      : Math.min(Math.floor(index / 2), b.syllables.length - 1) * 2 + index % 2;
    return count + Number(allele === right[source]);
  }, 0);
};
const rates = [2.12, 2.22, 2.27, 2.29, 2.32, 2.42].map(nameThermalRates);
assert(rates[2].heat === 0 && rates[2].cold === 0, 'default temperature drives spontaneous name changes');
assert(rates[0].cold > rates[1].cold && rates[1].cold > 0,
  'cooling does not increase linguistic assimilation');
assert(rates[5].heat > rates[4].heat && rates[4].heat > rates[3].heat && rates[3].heat > 0,
  'small temperature increases do not raise the mutation rate');
assert(nameMutationMobility(40, 3200) > nameMutationMobility(192, 3200)
  && nameMutationMobility(192, 3200) > nameMutationMobility(1118, 3200),
  'name mutation pressure does not decrease with area');

const donor: PlaceGenome = {
  syllables: [{ onset: 's', vowel: 'o' }, { onset: 'r', vowel: 'a' }], coda: 'n',
};
const receiver: PlaceGenome = {
  syllables: [{ onset: 'm', vowel: 'e' }, { onset: 't', vowel: 'i' }], coda: 's',
};
const borrowed = borrowPlaceGenomeGene(receiver, donor, 0,
  new Set([placeStem(receiver), placeStem(donor)]));
assert(borrowed !== null && resemblance(borrowed, donor) === resemblance(receiver, donor) + 1,
  'cold transfer did not copy exactly one donor gene');
assert(placeStem(borrowed).length === placeStem(receiver).length,
  'cold transfer changed label length');

let randomSeed = 0x641d;
Math.random = () => ((randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0)
  / 0x100000000);
let nowMs = 1000;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => nowMs } });
const width = 80;
const height = 40;
const view = { width: 960, height: 480 };
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
type NamedTrack = {
  id: number; stem: string; genome: PlaceGenome; area: number; lastNameChange: number;
  placement: { id: number; alive: boolean } | null;
};
const tracksOf = (tracker: PlaceTracker): NamedTrack[] => [
  ...(tracker as unknown as { tracks: Map<number, NamedTrack> }).tracks.values(),
].sort((a, b) => b.area - a.area);
const make = (rectangles: Rect[], temperature: number) => {
  const tracker = new PlaceTracker();
  const field = sample(rectangles);
  tracker.advance(1 / 30, 'map', view);
  nowMs += 300;
  tracker.ingest(field, temperature);
  for (let frame = 0; frame < 90; frame += 1) tracker.advance(1 / 30, 'map', view);
  return { tracker, field };
};
const run = (tracker: PlaceTracker, field: ReturnType<typeof sample>, temperature: number,
  seconds: number): number => {
  let changes = 0;
  let previous = tracksOf(tracker).map((track) => track.stem).join('|');
  const placements = new Map(tracksOf(tracker).map((track) => [track.id, track.placement?.id]));
  for (let tick = 0; tick < seconds * 4; tick += 1) {
    nowMs += 250;
    tracker.ingest(field, temperature);
    const current = tracksOf(tracker).map((track) => track.stem).join('|');
    if (current !== previous) changes += 1;
    previous = current;
    for (const track of tracksOf(tracker)) {
      assert(track.placement?.alive && track.placement.id === placements.get(track.id),
        'temperature-driven spelling change blinked or replaced a stable label');
    }
  }
  return changes;
};

const largeIsland: Rect[] = [[10, 53, 7, 33]];
const mediumIsland: Rect[] = [[20, 36, 14, 26]];
const smallIsland: Rect[] = [[20, 32, 14, 24]];
const quiet = make(largeIsland, 2.27);
assert(run(quiet.tracker, quiet.field, 2.27, 45) === 0,
  'unchanged region changed its name at the reference temperature');
const barelyWarm = make(largeIsland, 2.29);
assert(run(barelyWarm.tracker, barelyWarm.field, 2.29, 30) >= 1,
  'a small increase of 0.02 did not eventually affect stable text');
const holdHeatOneSecond = (start: number, rectangles: Rect[]) => {
  const pulse = make(rectangles, start);
  run(pulse.tracker, pulse.field, start, 5.25);
  const before = tracksOf(pulse.tracker)[0];
  const genome = before.genome;
  const placement = before.placement?.id;
  let temperature = start;
  for (let frame = 0; frame < 60; frame += 1) {
    temperature = advanceHeldTemperature(temperature, 1, frame / 60, 1 / 60, 0.8, 4.5);
    pulse.tracker.advance(1 / 60, 'map', view, true);
    nowMs += 1000 / 60;
    if ((frame + 1) % 15 === 0) pulse.tracker.ingest(pulse.field, temperature);
  }
  const after = tracksOf(pulse.tracker)[0];
  assert(after.placement?.alive && after.placement.id === placement,
    'short heating replaced the existing label instead of changing its text');
  return { temperature,
    changedGenes: loci(after.genome).filter((gene, index) => gene !== loci(genome)[index]).length };
};
const pulse = holdHeatOneSecond(2.27, mediumIsland);
assert(pulse.temperature < 2.39, 'one-second heating already drove the map toward chaos');
assert(pulse.changedGenes >= 2, 'one-second heating did not noticeably morph a medium name');
const frozenPulse = holdHeatOneSecond(1.9, mediumIsland);
assert(frozenPulse.temperature < 2.1 && frozenPulse.changedGenes >= 2,
  'short heating of a frozen map moved temperature too far');
assert(holdHeatOneSecond(2.27, largeIsland).changedGenes === 0,
  'a large region mutated as quickly as a medium one under a short heat pulse');
const slightlyWarm = make(largeIsland, 2.32);
assert(run(slightlyWarm.tracker, slightlyWarm.field, 2.32, 4.75) === 0,
  'heat bypassed the five-second name cooldown');
const mildChanges = run(slightlyWarm.tracker, slightlyWarm.field, 2.32, 35);
assert(mildChanges >= 2, `small heating did not animate stable text (${mildChanges})`);
const interrupted = make(largeIsland, 2.32);
assert(run(interrupted.tracker, interrupted.field, 2.32, 5.75) === 0,
  'thermal mutation occurred before its dose had accumulated');
run(interrupted.tracker, interrupted.field, 2.27, 2);
assert(run(interrupted.tracker, interrupted.field, 2.32, 2) === 0,
  'old heat dose fired after cooling back to the reference temperature');
const hot = make(largeIsland, 2.42);
const hotChanges = run(hot.tracker, hot.field, 2.42, 39.75);
assert(hotChanges > mildChanges, `stronger heating did not vary names more (${hotChanges} vs ${mildChanges})`);
const smallWarm = make(smallIsland, 2.32);
const smallChanges = run(smallWarm.tracker, smallWarm.field, 2.32, 30);
const largeWarm = make(largeIsland, 2.32);
const largeChanges = run(largeWarm.tracker, largeWarm.field, 2.32, 30);
assert(smallChanges > largeChanges,
  `larger region did not mutate less under the same heat (${smallChanges} vs ${largeChanges})`);

const neighbours: Rect[] = [[3, 36, 8, 32], [40, 56, 12, 28]];
const cooling = make(neighbours, 2.07);
const before = tracksOf(cooling.tracker);
assert(before.length === 2, 'cold-neighbour test did not produce two regions');
const donorName = before[0].stem;
const resemblanceBefore = resemblance(before[1].genome, before[0].genome);
assert(run(cooling.tracker, cooling.field, 2.07, 4.75) === 0,
  'cold transfer bypassed the five-second name cooldown');
run(cooling.tracker, cooling.field, 2.07, 30);
const after = tracksOf(cooling.tracker);
assert(after[0].stem === donorName, 'larger regional name was replaced by its smaller neighbour');
assert(resemblance(after[1].genome, after[0].genome) > resemblanceBefore,
  `freezing did not make nearby names more alike (${resemblanceBefore} -> ${resemblance(after[1].genome, after[0].genome)}, ${after[0].stem}/${after[1].stem})`);
assert(after[0].stem !== after[1].stem, 'cold transfer created duplicate map names');
const distant = make([[2, 17, 11, 26], [63, 78, 11, 26]], 2.07);
const distantNames = tracksOf(distant.tracker).map((track) => track.stem).join('|');
run(distant.tracker, distant.field, 2.07, 30);
assert(tracksOf(distant.tracker).map((track) => track.stem).join('|') === distantNames,
  'freezing copied a name across unrelated distant regions');

console.log('Temperature-driven place-name evolution passed.', {
  mildChanges, hotChanges, smallChanges, largeChanges, resemblanceBefore,
  resemblanceAfter: resemblance(after[1].genome, after[0].genome),
});
