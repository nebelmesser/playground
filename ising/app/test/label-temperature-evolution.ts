import { PlaceTracker } from '../src/place-engine.ts';
import type { NameEvolution } from '../src/place-name.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
let nowMs = 1000;
Object.defineProperty(globalThis, 'performance', {
  configurable: true, value: { now: () => nowMs },
});

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
type NamedTrack = {
  id: number; stem: string; name: NameEvolution;
  placement: { id: number; alive: boolean } | null;
};
const tracksOf = (tracker: PlaceTracker): NamedTrack[] => [
  ...(tracker as unknown as { tracks: Map<number, NamedTrack> }).tracks.values(),
];

// Reuse the same founders and initial geometry at every temperature, and run
// the actual presentation loop between observations. This catches changes
// which are genetically valid but blink or become unplaceable on the map.
const runCohort = (temperature: number) => {
  let seed = 0x641d;
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
    / 0x100000000);
  nowMs = 1000;
  const tracker = new PlaceTracker();
  tracker.advance(1 / 30, 'map', view);
  tracker.ingest(field, temperature);
  const founders = tracksOf(tracker);
  assert(founders.length === 3, 'temperature cohort did not create three regions');
  const initialNames = founders.map((track) => track.stem).join('|');
  const previousNames = new Map(founders.map((track) => [track.id, track.stem]));
  const lastChange = new Map(founders.map((track) => [track.id, nowMs / 1000]));
  const placements = new Map(founders.map((track) => [track.id, track.placement?.id]));
  let changes = 0;
  let minimumInterval = Infinity;
  let minimumOpacity = 1;
  for (let frame = 0; frame < 120 * 30; frame += 1) {
    nowMs += 1000 / 30;
    // Sampling at 5 Hz mirrors asynchronous map readback, independently of
    // the display's 30 Hz clock. Heating is only the sampled temperature.
    if ((frame + 1) % 6 === 0) tracker.ingest(field, temperature);
    const labels = tracker.advance(1 / 30, 'map', view);
    const tracks = tracksOf(tracker);
    assert(tracks.length === 3, 'fixed geography lost a named region');
    assert(new Set(tracks.map((track) => track.stem)).size === tracks.length,
      'mutation gave two live places the same name');
    for (const track of tracks) {
      assert(track.placement?.alive && track.placement.id === placements.get(track.id),
        'temperature-driven spelling change replaced a stable placement');
      if (track.stem !== previousNames.get(track.id)) {
        const interval = nowMs / 1000 - (lastChange.get(track.id) as number);
        assert(interval >= 5 - 1e-6,
          `temperature ${temperature} bypassed the five-second cooldown (${interval})`);
        minimumInterval = Math.min(minimumInterval, interval);
        lastChange.set(track.id, nowMs / 1000);
        previousNames.set(track.id, track.stem);
        changes += 1;
      }
      if (frame >= 150) {
        const label = labels.find((candidate) => candidate.id === track.id);
        assert(label !== undefined && label.opacity > 0.95,
          'mutation hid or faded an established label');
        minimumOpacity = Math.min(minimumOpacity, label.opacity);
      }
    }
  }
  return { temperature, changes, minimumInterval, minimumOpacity, initialNames };
};

const cold = runCohort(0.8);
const neutral = runCohort(2.27);
// This warming remains inside the application's visible-map temperature range.
const warm = runCohort(2.42);
// An extreme input separately stresses the model's cooldown saturation.
const hot = runCohort(4.5);
assert([cold, warm, hot].every((cohort) => cohort.initialNames === neutral.initialNames),
  'temperature comparison did not start with the same founders');
assert(cold.changes < neutral.changes && neutral.changes < warm.changes && warm.changes < hot.changes,
  `warming did not monotonically increase mutations (${cold.changes}, ${neutral.changes}, ${warm.changes}, ${hot.changes})`);
assert(neutral.changes > 0, 'ordinary temperature froze genetic variation completely');
console.log('Temperature-driven genetic evolution preserves placement and cooldown.',
  [cold, neutral, warm, hot].map(({ initialNames: _, ...result }) => result));
