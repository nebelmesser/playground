import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';

let seed = 0x19a5;
Math.random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
};

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
const settle = (tracker: PlaceTracker, view: { width: number; height: number }): PlaceLabel[] => {
  let labels: PlaceLabel[] = [];
  for (let frame = 0; frame < 90; frame += 1) labels = tracker.advance(1 / 30, 'map', view);
  return labels;
};

// The inscription follows the long local axis of a diagonal landmass and
// stays near its middle. A circular or wide region still prefers horizontal.
const diagonalWidth = 48;
const diagonalHeight = 36;
const diagonalView = { width: diagonalWidth * 12, height: diagonalHeight * 12 };
const diagonalSigns = new Int8Array(diagonalWidth * diagonalHeight).fill(-1);
const a = { x: 8, y: 28 };
const b = { x: 41, y: 8 };
for (let y = 0; y < diagonalHeight; y += 1) {
  for (let x = 0; x < diagonalWidth; x += 1) {
    const lengthSquared = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    const along = Math.max(0, Math.min(1,
      ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / lengthSquared));
    const centerX = a.x + along * (b.x - a.x);
    const centerY = a.y + along * (b.y - a.y);
    if (Math.hypot(x - centerX, y - centerY) <= 5) diagonalSigns[x + y * diagonalWidth] = 1;
  }
}
const diagonal = new PlaceTracker();
diagonal.advance(0.016, 'map', diagonalView);
diagonal.ingest({ width: diagonalWidth, height: diagonalHeight, signs: diagonalSigns });
const diagonalLabel = settle(diagonal, diagonalView).find((label) => label.kind === 'continent');
assert(diagonalLabel !== undefined && diagonalLabel.angle <= -15 && diagonalLabel.angle >= -60,
  `diagonal area was forced horizontal (${diagonalLabel?.angle})`);
assert(diagonalLabel !== undefined && diagonalLabel.x > 0.4 * diagonalView.width
  && diagonalLabel.x < 0.65 * diagonalView.width,
`diagonal inscription was stranded in an end lobe (${diagonalLabel?.x})`);
console.log('diagonal land', { x: Math.round(diagonalLabel.x), angle: diagonalLabel.angle });

const waterWidth = 112;
const waterHeight = 80;
const waterView = { width: waterWidth * 12, height: waterHeight * 12 };
const waterMap = (box: [number, number, number, number], open = false) => {
  const signs = new Int8Array(waterWidth * waterHeight).fill(-1);
  for (let y = 6; y < 74; y += 1) {
    for (let x = 8; x < 104; x += 1) signs[x + y * waterWidth] = 1;
  }
  const [x0, x1, y0, y1] = box;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) signs[x + y * waterWidth] = -1;
  }
  if (open) {
    for (let y = 6; y < y0; y += 1) signs[24 + y * waterWidth] = -1;
  }
  return { width: waterWidth, height: waterHeight, signs };
};
type TrackProbe = { tracks: Map<number, { kind: string;
  genome: { syllables: unknown[] }; suffix: string;
  placement: { mask: Uint8Array; regionMask: Uint8Array; route: unknown[] } | null }> };
const waterWithIsland = (islandSize: number) => {
  const map = waterMap([18, 36, 16, 29]);
  for (let y = 20; y < 20 + islandSize; y += 1) {
    for (let x = 25; x < 25 + islandSize; x += 1) map.signs[x + y * waterWidth] = 1;
  }
  return map;
};
const shorelineOwner = (islandSize: number): boolean => {
  const tracker = new PlaceTracker();
  tracker.advance(0.016, 'map', waterView);
  tracker.ingest(waterWithIsland(islandSize));
  return [...(tracker as unknown as TrackProbe).tracks.values()].some((track) => track.kind === 'lake');
};
const classifiedAsLake = (box: [number, number, number, number]): boolean => {
  const tracker = new PlaceTracker();
  tracker.advance(0.016, 'map', waterView);
  tracker.ingest(waterMap(box));
  return [...(tracker as unknown as TrackProbe).tracks.values()].some((track) => track.kind === 'lake');
};
const lake = new PlaceTracker();
lake.advance(0.016, 'map', waterView);
lake.ingest(waterMap([18, 30, 16, 28]));
const first = settle(lake, waterView).find((label) => label.kind === 'lake');
assert(first !== undefined, 'small enclosed water did not receive a label');
assert([...(lake as unknown as TrackProbe).tracks.values()].some((track) =>
  track.kind === 'lake' && track.genome.syllables.length === 2),
  'medium lake did not receive a two-syllable name');

// These footprints were below the old area cutoffs. A short inscription must
// actually become visible; classification alone is not enough.
const tinyLake = new PlaceTracker();
tinyLake.advance(0.016, 'map', waterView);
tinyLake.ingest(waterMap([18, 23, 16, 21])); // 25 cells; old cutoff was 32.
const tinyLakeLabel = settle(tinyLake, waterView).find((label) => label.kind === 'lake');
assert(tinyLakeLabel !== undefined && tinyLakeLabel.opacity > 0.8,
  'newly admitted 5×5 lake did not show a label');
assert([...(tinyLake as unknown as TrackProbe).tracks.values()].some((track) =>
  track.kind === 'lake' && track.genome.syllables.length === 1 && track.suffix === ''),
  'tiny lake did not receive a one-syllable name');
for (let trial = 0; trial < 12; trial += 1) {
  const candidate = new PlaceTracker();
  candidate.advance(0.016, 'map', waterView);
  candidate.ingest(waterMap([18, 23, 16, 21]));
  const label = settle(candidate, waterView).find((entry) => entry.kind === 'lake');
  assert(label !== undefined && label.opacity > 0.8,
    `one-syllable lake variant ${trial} failed to fit its 5×5 shore`);
}

// If the old text no longer fits after a shrink, shorten it at once and keep
// the same moving inscription instead of fading it out and respawning nearby.
const shrinkingLake = new PlaceTracker();
shrinkingLake.advance(0.016, 'map', waterView);
shrinkingLake.ingest(waterMap([18, 30, 16, 28]));
const beforeShrink = settle(shrinkingLake, waterView).find((label) => label.kind === 'lake');
assert(beforeShrink !== undefined, 'shrinking lake setup had no label');
const shrinkingTrack = [...(shrinkingLake as unknown as TrackProbe).tracks.values()]
  .find((track) => track.kind === 'lake');
assert(shrinkingTrack !== undefined, 'shrinking lake lost its tracked identity');
shrinkingLake.ingest(waterMap([21, 27, 19, 24]));
const afterShrink = settle(shrinkingLake, waterView).find((label) => label.kind === 'lake');
assert([...((shrinkingLake as unknown as TrackProbe).tracks.values())].includes(shrinkingTrack)
  && shrinkingTrack.genome.syllables.length === 1 && shrinkingTrack.suffix === ''
  && afterShrink !== undefined && afterShrink.id === beforeShrink.id
  && afterShrink.text.length < beforeShrink.text.length && afterShrink.opacity > 0.8,
  'shrinking lake failed to keep and shorten its own name');

const tinyIslandSigns = new Int8Array(waterWidth * waterHeight).fill(-1);
for (let y = 30; y < 37; y += 1) {
  for (let x = 40; x < 47; x += 1) tinyIslandSigns[x + y * waterWidth] = 1;
}
const tinyIsland = new PlaceTracker();
tinyIsland.advance(0.016, 'map', waterView);
tinyIsland.ingest({ width: waterWidth, height: waterHeight, signs: tinyIslandSigns });
const tinyIslandLabel = settle(tinyIsland, waterView).find((label) => label.kind === 'island');
assert(tinyIslandLabel !== undefined && tinyIslandLabel.opacity > 0.8,
  'newly admitted 7×7 island did not show a label');
assert([...(tinyIsland as unknown as TrackProbe).tracks.values()].some((track) =>
  track.kind === 'island' && track.genome.syllables.length === 1 && track.suffix === ''),
  'tiny island did not receive a one-syllable name');

const mediumIslandSigns = new Int8Array(waterWidth * waterHeight).fill(-1);
for (let y = 30; y < 42; y += 1) {
  for (let x = 40; x < 52; x += 1) mediumIslandSigns[x + y * waterWidth] = 1;
}
const mediumIsland = new PlaceTracker();
mediumIsland.advance(0.016, 'map', waterView);
mediumIsland.ingest({ width: waterWidth, height: waterHeight, signs: mediumIslandSigns });
assert(settle(mediumIsland, waterView).some((label) => label.kind === 'island'),
  'medium island did not show its label');
assert([...(mediumIsland as unknown as TrackProbe).tracks.values()].some((track) =>
  track.kind === 'island' && track.genome.syllables.length === 2 && track.suffix === ''),
  'medium island did not receive a two-syllable name');

// A water body becomes sea only if both spans exceed half of the
// frame. One long dimension alone still permits a named lake.
for (const box of [
  [18, 57, 12, 40], // 39×28: formerly too large, now a lake
  [18, 88, 16, 26], // 70×10: long and horizontal
  [18, 30, 16, 66], // 12×50: long and vertical
  [18, 74, 16, 56], // 56×40: exactly half in both dimensions
  [18, 75, 16, 56], // 57×40: only width exceeds half
  [18, 74, 16, 57], // 56×41: only height exceeds half
] as [number, number, number, number][]) {
  assert(classifiedAsLake(box), `lake with at most one oversized span lost its name (${box})`);
}
const broadSea = waterMap([18, 75, 16, 57]); // 57×41: both exceed half.
const broadSeaTracker = new PlaceTracker();
broadSeaTracker.advance(0.016, 'map', waterView);
broadSeaTracker.ingest(broadSea);
assert(![...(broadSeaTracker as unknown as TrackProbe).tracks.values()].some((track) => track.kind === 'lake'),
  'water larger than half the frame in both dimensions kept its lake name');
const broadSeaComponents = (broadSeaTracker as unknown as { components(signs: Int8Array):
  Array<{ area: number; role: string }> }).components(broadSea.signs);
assert(broadSeaComponents.some((component) => component.area === 57 * 41 && component.role === 'sea'),
  'water larger than half the frame in both dimensions was not classified as sea');
for (const box of [[18, 57, 12, 40], [18, 88, 16, 26], [18, 30, 16, 66],
  [18, 74, 16, 56], [18, 75, 16, 56], [18, 74, 16, 57]] as [number, number, number, number][]) {
  const tracker = new PlaceTracker();
  tracker.advance(0.016, 'map', waterView);
  tracker.ingest(waterMap(box));
  assert(settle(tracker, waterView).some((label) => label.kind === 'lake'),
    `one-dimensionally long lake did not show its name (${box})`);
}
// The outer continent owns 62 shoreline edges. An inner 3×3 island adds 12
// edges (62/74 > 80%); a 4×4 island adds 16 (62/78 < 80%).
assert(shorelineOwner(3), 'lake with one dominant shore was rejected');
assert(!shorelineOwner(4), 'water with less than 80% of its shore on one landmass was called a lake');

// The same lake loses its western shore. The inscription must move inside the
// new water footprint instead of remaining pinned to its first position.
lake.ingest(waterMap([21, 30, 16, 28]));
const shifted = settle(lake, waterView).find((label) => label.kind === 'lake');
assert(shifted !== undefined && shifted.id === first.id && shifted.text === first.text,
  'moving shore replaced the lake inscription');
assert(shifted.x > first.x + 15 && shifted.opacity > 0.85,
  `lake label did not respond to its shore (${first.x.toFixed(0)} → ${shifted.x.toFixed(0)})`);
const shiftedTrack = [...(lake as unknown as TrackProbe).tracks.values()].find((track) => track.kind === 'lake');
assert(shiftedTrack?.placement?.route.length === 0
  && shiftedTrack.placement.mask === shiftedTrack.placement.regionMask,
  'position and angle morph stalled in an obsolete shoreline corridor');
console.log('moving lake shore', { from: Math.round(first.x), to: Math.round(shifted.x) });

lake.ingest(waterMap([23, 30, 16, 28]));
const shiftedAgain = settle(lake, waterView).find((label) => label.kind === 'lake');
assert(shiftedAgain !== undefined && shiftedAgain.id === first.id && shiftedAgain.x > shifted.x + 7,
  'second shore change did not carry the same inscription farther inward');
const lakeTrack = [...(lake as unknown as TrackProbe).tracks.values()].find((track) => track.kind === 'lake');
assert(lakeTrack?.placement?.mask[18 + 20 * waterWidth] === 0,
  'the transition corridor retained a shoreline from two samples ago');

// Once both dimensions pass half of the frame, its existing inscription
// fades promptly instead of staying visible for the name cooldown.
lake.ingest(broadSea);
let afterGrowth: PlaceLabel[] = [];
for (let frame = 0; frame < 45; frame += 1) afterGrowth = lake.advance(1 / 30, 'map', waterView);
assert(afterGrowth.every((label) => label.kind !== 'lake' || label.opacity < 0.1),
  `oversized lake kept its label (${afterGrowth.filter((label) => label.kind === 'lake').map((label) => label.opacity)})`);

// Even a small water shape connected to the outer sea is not a lake.
const open = new PlaceTracker();
open.advance(0.016, 'map', waterView);
open.ingest(waterMap([18, 30, 16, 28], true));
assert(settle(open, waterView).every((label) => label.kind !== 'lake'),
  'sea inlet received a lake name');
console.log('lake geometry', { acceptedBoxes: '39×28 / 70×10 / 12×50 / 56×40 / 57×40 / 56×41',
  rejectedBox: '57×41',
  acceptedShore: '62/74', rejectedShore: '62/78' });
console.log('ok');
