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
const lake = new PlaceTracker();
lake.advance(0.016, 'map', waterView);
lake.ingest(waterMap([18, 30, 16, 28]));
const first = settle(lake, waterView).find((label) => label.kind === 'lake');
assert(first !== undefined, 'small enclosed water did not receive a label');

// The same lake loses its western shore. The inscription must move inside the
// new water footprint instead of remaining pinned to its first position.
lake.ingest(waterMap([21, 30, 16, 28]));
const shifted = settle(lake, waterView).find((label) => label.kind === 'lake');
assert(shifted !== undefined && shifted.id === first.id && shifted.text === first.text,
  'moving shore replaced the lake inscription');
assert(shifted.x > first.x + 15 && shifted.opacity > 0.85,
  `lake label did not respond to its shore (${first.x.toFixed(0)} → ${shifted.x.toFixed(0)})`);
type TrackProbe = { tracks: Map<number, { kind: string;
  placement: { mask: Uint8Array; regionMask: Uint8Array; route: unknown[] } | null }> };
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

// An enlarged lake is no longer a small cartographic object. Its existing
// inscription fades promptly instead of staying visible for the name cooldown.
lake.ingest(waterMap([18, 38, 12, 32]));
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
console.log('lake size and enclosure', { smallArea: 144, largeArea: 400 });
console.log('ok');
