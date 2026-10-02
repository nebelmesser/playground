import { PlaceTracker } from '../src/place-engine.ts';
import type { NameEvolution } from '../src/place-name.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
let nowMs = 1000;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => nowMs } });
const width = 80;
const height = 32;
const view = { width: 1600, height: 640 };
const signs = new Int8Array(width * height).fill(-1);
for (const left of [4, 31, 58]) {
  for (let y = 8; y < 24; y += 1) {
    for (let x = left; x < left + 18; x += 1) signs[x + y * width] = 1;
  }
}
const field = { width, height, signs };
type Track = { id: number; stem: string; name: NameEvolution; placement: { id: number } | null };
const tracks = (tracker: PlaceTracker): Track[] =>
  [...(tracker as unknown as { tracks: Map<number, Track> }).tracks.values()];
const setup = (temperature = 2.42) => {
  let seed = 0x641d;
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);
  nowMs = 1000;
  let simulated = 0;
  const tracker = new PlaceTracker();
  tracker.advance(1 / 30, 'map', view);
  tracker.ingest(field, temperature, simulated);
  const initial = tracks(tracker).map((track) => track.stem);
  const step = (speed: number, seconds = 0.2): void => {
    // Observation and presentation stay on wall time, independently of the
    // simulation clock captured with the GPU region sample.
    for (let frame = 0; frame < 6; frame += 1) {
      nowMs += seconds / 6 * 1000;
      simulated += seconds / 6 * speed;
      tracker.advance(seconds / 6, 'map', view);
    }
    tracker.ingest(field, temperature, simulated);
  };
  return { tracker, initial, step, time: () => simulated };
};
const cohort = (speed: number, temperature = 2.42) => {
  const run = setup(temperature);
  const founders = tracks(run.tracker);
  assert(founders.length === 3, 'speed cohort did not name all regions');
  const previous = new Map(founders.map((track) => [track.id, track.stem]));
  const lastChange = new Map(founders.map((track) => [track.id, nowMs / 1000]));
  const placements = new Map(founders.map((track) => [track.id, track.placement?.id]));
  let changes = 0;
  let minimumInterval = Infinity;
  for (let tick = 0; tick < 300; tick += 1) {
    const deadlines = new Map(tracks(run.tracker).map((track) => [track.id, track.name.nextChangeAt]));
    run.step(speed);
    const current = tracks(run.tracker);
    assert(current.length === founders.length, 'speed changed region identity');
    assert(new Set(current.map((track) => track.stem)).size === current.length, 'accelerated names collided');
    for (const track of current) {
      assert(track.placement?.id === placements.get(track.id), 'speed replaced the label placement');
      if (track.stem === previous.get(track.id)) continue;
      const interval = nowMs / 1000 - lastChange.get(track.id)!;
      assert(run.time() + 1e-8 >= deadlines.get(track.id)! && interval * speed >= 5 - 1e-8,
        'accelerated rename bypassed its simulation-time cooldown');
      minimumInterval = Math.min(minimumInterval, interval);
      previous.set(track.id, track.stem);
      lastChange.set(track.id, nowMs / 1000);
      changes += 1;
    }
  }
  return { speed, changes, minimumInterval, initial: run.initial };
};
const normal = cohort(1);
const faster = cohort(3);
const fastest = cohort(10);
const cold = cohort(10, 0.8);
assert(JSON.stringify(normal.initial) === JSON.stringify(faster.initial)
  && JSON.stringify(normal.initial) === JSON.stringify(fastest.initial), 'speed changed founder DNA');
assert(normal.changes > 0 && normal.changes < faster.changes && faster.changes < fastest.changes,
  `speed did not accelerate visible evolution (${normal.changes}, ${faster.changes}, ${fastest.changes})`);
assert(fastest.minimumInterval < 5, 'accelerated names still use a five-second wall-time cooldown');
assert(cold.changes < normal.changes, 'speed erased the independent temperature effect');

// Changing speed integrates the remaining wait; it must not multiply an
// absolute timestamp, reset a deadline, or age names while time is paused.
const switching = setup(4.5);
switching.step(1);
const waiting = tracks(switching.tracker).map((track) => ({
  id: track.id, stem: track.stem, deadline: track.name.nextChangeAt,
  pending: JSON.stringify(track.name.pending),
}));
assert(waiting.every((track) => track.pending !== 'null'), 'hot fixture did not prepare waiting mutations');
for (let tick = 0; tick < 30; tick += 1) switching.step(0, 1);
for (const before of waiting) {
  const track = tracks(switching.tracker).find((candidate) => candidate.id === before.id)!;
  assert(track.stem === before.stem && track.name.nextChangeAt === before.deadline
    && JSON.stringify(track.name.pending) === before.pending, 'pause aged a name or rewrote its pending mutation');
}
switching.step(10);
assert(tracks(switching.tracker).every((track) => waiting.some((before) =>
  track.id === before.id && track.stem === before.stem && track.name.nextChangeAt === before.deadline)),
'changing speed jumped the genetic clock or restarted its deadline');
for (let tick = 0; tick < 10; tick += 1) switching.step(1);
assert(tracks(switching.tracker).every((track) => waiting.some((before) =>
  track.id === before.id && track.stem === before.stem)), 'slowing down kept the old faster clock');
for (let tick = 0; tick < 4; tick += 1) switching.step(10);
assert(tracks(switching.tracker).some((track) => waiting.some((before) =>
  track.id === before.id && track.stem !== before.stem)), 'resume did not finish the accumulated waiting time');

console.log('Simulation speed accelerates names while pause, cooldown and temperature remain coherent.',
  [normal, faster, fastest, cold].map(({ initial: _, ...result }) => result));
