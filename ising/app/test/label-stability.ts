import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';

let nameSeed = 0x5eed1234;
Math.random = () => {
  nameSeed = (Math.imul(nameSeed, 1664525) + 1013904223) >>> 0;
  return nameSeed / 0x100000000;
};

const width = 48;
const height = 36;
const cell = 12;
const viewport = { width: width * cell, height: height * cell };
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const rectangles = (areas: Array<[number, number, number, number]>) => {
  const signs = new Int8Array(width * height).fill(-1);
  for (const [x0, x1, y0, y1] of areas) {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) signs[x + y * width] = 1;
    }
  }
  return { width, height, signs };
};

const frame = (tracker: PlaceTracker, seconds: number): PlaceLabel[] => tracker.advance(seconds, 'map', viewport);

// No global 15-second gate: each region starts to appear on the first sample.
const tracker = new PlaceTracker();
frame(tracker, 0.016);
tracker.ingest(rectangles([[3, 17, 9, 27], [27, 39, 9, 27]]));
const early = frame(tracker, 0.2);
assert(early.length === 2 && early.every((label) => label.opacity > 0.05 && label.opacity < 0.5),
  `regions did not start forming immediately: ${early.map((label) => label.opacity.toFixed(2))}`);
let prompt = early;
for (let tick = 0; tick < 24; tick += 1) prompt = frame(tracker, 1 / 30);
assert(prompt.length === 2 && prompt.every((label) => label.opacity > 0.65),
  `stable regions were still faint after one second: ${prompt.map((label) => label.opacity.toFixed(2))}`);

// Disturb only the right region. Its confidence should recover more slowly
// while the unchanged left region completes its inscription.
let labels = early;
for (let repeat = 0; repeat < 16; repeat += 1) {
  const shift = repeat % 2 === 0 ? 0 : 5;
  tracker.ingest(rectangles([[3, 17, 9, 27], [27 + shift, 39 + shift, 9, 27]]));
  for (let tick = 0; tick < 9; tick += 1) labels = frame(tracker, 1 / 30);
}
const left = labels.find((label) => label.x < viewport.width / 2);
const right = labels.find((label) => label.x > viewport.width / 2);
assert(left !== undefined && right !== undefined, 'one of the independently observed regions disappeared');
assert(left.opacity > 0.95 && right.opacity < left.opacity - 0.05 && right.opacity > 0.7,
  `region stability did not control inscription opacity (${left.opacity.toFixed(2)}, ${right.opacity.toFixed(2)})`);
console.log('per-region formation', { earlyOpacity: Number(early[0].opacity.toFixed(2)),
  stableOpacity: Number(left.opacity.toFixed(2)), movingOpacity: Number(right.opacity.toFixed(2)) });

const island = new PlaceTracker();
frame(island, 0.016);
island.ingest(rectangles([[12, 21, 12, 21]]));
let islandLabels: PlaceLabel[] = [];
for (let tick = 0; tick < 30; tick += 1) islandLabels = frame(island, 0.2);
assert(islandLabels.length === 1 && islandLabels[0].kind === 'island'
  && !islandLabels[0].text.toLowerCase().includes('island'),
  `island suffix remained in the name (${JSON.stringify(islandLabels)})`);
console.log('island name', islandLabels[0].text);

const vertical = new PlaceTracker();
frame(vertical, 0.016);
vertical.ingest(rectangles([[21, 27, 3, 33]]));
let verticalLabels: PlaceLabel[] = [];
for (let tick = 0; tick < 30; tick += 1) verticalLabels = frame(vertical, 0.2);
assert(verticalLabels.length === 1 && Math.abs(verticalLabels[0].angle) > 45
  && Math.abs(verticalLabels[0].angle) <= 80,
`narrow region did not use the extended angle range (${verticalLabels[0]?.angle})`);
console.log('narrow region angle', verticalLabels[0].angle);

// Once the same region becomes wider than it is tall, the inscription should
// turn horizontally without losing its identity or blinking.
vertical.ingest(rectangles([[10, 38, 8, 28]]));
let widened = verticalLabels[0];
let leastOpacity = 1;
const turnTrail: number[] = [widened.angle];
for (let tick = 0; tick < 150; tick += 1) {
  if (tick > 0 && tick % 9 === 0) vertical.ingest(rectangles([[10, 38, 8, 28]]));
  const label = frame(vertical, 1 / 30).find((candidate) => candidate.id === verticalLabels[0].id);
  assert(label !== undefined, 'widening region replaced its inscription');
  leastOpacity = Math.min(leastOpacity, label.opacity);
  widened = label;
  turnTrail.push(label.angle);
}
assert(Math.abs(widened.angle) <= 10,
  `inscription stayed steep after horizontal room opened (${widened.angle.toFixed(1)}°)`);
assert(leastOpacity > 0.75, `inscription blinked while rotating (${leastOpacity.toFixed(2)})`);
const turnSteps = turnTrail.slice(1).map((angle, index) => Math.abs(angle - turnTrail[index]));
const maxTurnStep = Math.max(...turnSteps);
assert(turnSteps[0] < maxTurnStep * 0.4 && maxTurnStep < 2,
  `orientation did not ease into the turn (${turnSteps[0].toFixed(2)}° → ${maxTurnStep.toFixed(2)}°)`);
assert(Math.max(...turnSteps.slice(1).map((step, index) => Math.abs(step - turnSteps[index]))) < 0.5,
  'orientation changed speed abruptly');
console.log('wide region releases steep angle', { from: verticalLabels[0].angle,
  to: Number(widened.angle.toFixed(1)), minimumOpacity: Number(leastOpacity.toFixed(2)),
  maxTurnStep: Number(maxTurnStep.toFixed(2)) });

// Both full-sized poses fit the same narrow region. Direct simultaneous
// translation and rotation clips the coast, but shrinking, moving, turning,
// then growing is a continuous legal morph rather than a crossfade.
type Pose = { x: number; y: number; font: number; angle: number };
type GeometryProbe = {
  remember(mask: Uint8Array): void;
  fitsPose(mask: Uint8Array, text: string, pose: Pose): boolean;
  posesFit(mask: Uint8Array, text: string, from: Pose, to: Pose): boolean;
  planRoute(text: string, mask: Uint8Array, from: Pose, to: Pose): Pose[] | null;
  glide(track: { text: string }, placement: MotionPlacement, seconds: number): void;
};
type MotionPlacement = {
  id: number; position: { x: number; y: number }; velocity: { x: number; y: number };
  font: number; fontVelocity: number; angle: number; angleVelocity: number;
  target: Pose; opacity: number; collisionOpacity: number;
  mask: Uint8Array; regionMask: Uint8Array; alive: boolean;
  route: Pose[];
};
const passage = new PlaceTracker();
frame(passage, 0.016);
const passageSample = rectangles([[20, 28, 4, 32]]);
passage.ingest(passageSample);
const geometry = passage as unknown as GeometryProbe;
const mask = Uint8Array.from(passageSample.signs, (sign) => sign > 0 ? 1 : 0);
geometry.remember(mask);
const from = { x: 24 * cell, y: 13 * cell, font: 20, angle: -80 };
const to = { x: 24 * cell, y: 22 * cell, font: 20, angle: 80 };
assert(geometry.fitsPose(mask, 'Longoria', from) && geometry.fitsPose(mask, 'Longoria', to),
  'morph fixture endpoints do not fit');
assert(!geometry.posesFit(mask, 'Longoria', from, to), 'morph fixture does not require staging');
const route = geometry.planRoute('Longoria', mask, from, to);
assert(route !== null && route.length > 1, 'nearby legal poses would have crossfaded');
let previous = from;
for (const pose of route) {
  assert(geometry.posesFit(mask, 'Longoria', previous, pose), 'morph route crosses the coast');
  previous = pose;
}
assert(previous.x === to.x && previous.y === to.y && previous.angle === to.angle,
  'morph route does not reach the destination');
const moving: MotionPlacement = {
  id: 1, position: { x: from.x, y: from.y }, velocity: { x: 0, y: 0 },
  font: from.font, fontVelocity: 0, angle: from.angle, angleVelocity: 0,
  target: to, opacity: 1, collisionOpacity: 1,
  mask, regionMask: mask, alive: true, route: [...route],
};
let maxStep = 0;
for (let tick = 0; tick < 360; tick += 1) {
  const before = { ...moving.position };
  geometry.glide({ text: 'Longoria' }, moving, 1 / 30);
  const pose = { ...moving.position, font: moving.font, angle: moving.angle };
  assert(geometry.fitsPose(mask, 'Longoria', pose), `morph crossed the coast at tick ${tick}`);
  maxStep = Math.max(maxStep, Math.hypot(pose.x - before.x, pose.y - before.y));
}
assert(Math.hypot(moving.position.x - to.x, moving.position.y - to.y) < 2
  && Math.abs(moving.angle - to.angle) < 2 && Math.abs(moving.font - to.font) < 2,
  'staged morph did not converge on its destination');
assert(maxStep <= 140 / 30 + 0.3, `staged morph exceeded the speed cap (${maxStep.toFixed(2)})`);
console.log('staged near morph', { segments: route.length,
  smallestFont: Math.min(...route.map((pose) => pose.font)), maxStep: Number(maxStep.toFixed(2)) });
console.log('ok');
