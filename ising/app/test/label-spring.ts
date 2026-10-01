import { PlaceTracker } from '../src/place-engine.ts';

type Pose = { x: number; y: number; font: number; angle: number };
type Placement = {
  position: { x: number; y: number }; font: number; angle: number;
  target: Pose; route: Pose[]; regionMask: Uint8Array;
};
type MotionProbe = {
  remember(mask: Uint8Array): void;
  spawn(pose: Pose, mask: Uint8Array): Placement;
  glide(track: { text: string }, placement: Placement, seconds: number): void;
  fitsPose(mask: Uint8Array, text: string, pose: Pose): boolean;
};
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const tracker = new PlaceTracker();
const width = 48;
const height = 36;
const view = { width: width * 12, height: height * 12 };
tracker.advance(0.016, 'map', view);
tracker.ingest({ width, height, signs: new Int8Array(width * height).fill(1) });
const motion = tracker as unknown as MotionProbe;
const mask = new Uint8Array(width * height).fill(1);
motion.remember(mask);
const from = { x: 210, y: 210, font: 18, angle: 0 };
const to = { x: 258, y: 210, font: 22, angle: 40 };
const placement = motion.spawn(from, mask);
placement.target = to;
placement.route = [to];
const steps: number[] = [];
let previous = from;
for (let frame = 0; frame < 240; frame += 1) {
  motion.glide({ text: 'Testia' }, placement, 1 / 60);
  const pose = { ...placement.position, font: placement.font, angle: placement.angle };
  assert(motion.fitsPose(mask, 'Testia', pose), `spring left its legal route at frame ${frame}`);
  const progress = (pose.x - from.x) / (to.x - from.x);
  assert(Math.abs(progress - (pose.font - from.font) / (to.font - from.font)) < 1e-6
    && Math.abs(progress - (pose.angle - from.angle) / (to.angle - from.angle)) < 1e-6,
  `position, font and angle left the same checked path at frame ${frame}`);
  steps.push(pose.x - previous.x);
  previous = pose;
}
const moving = steps.filter((step) => step > 0.03);
const maximum = Math.max(...steps);
const maxStepChange = Math.max(...steps.map((step, index) => Math.abs(step - (steps[index - 1] ?? 0))));
assert(moving.length > 10, 'spring path did not move');
assert(steps[0] < maximum * 0.5,
  `motion started at full speed (${steps[0].toFixed(2)} vs ${maximum.toFixed(2)} px/frame)`);
assert(moving.at(-1)! < maximum * 0.5,
  `motion stopped abruptly (${moving.at(-1)!.toFixed(2)} vs ${maximum.toFixed(2)} px/frame)`);
assert(maximum <= 140 / 60 + 0.1, `spring exceeded the speed cap (${maximum.toFixed(2)} px/frame)`);
assert(maximum < 1.2, `interior inscription is still too restless (${maximum.toFixed(2)} px/frame)`);
assert(maxStepChange < 0.4, `spring changed speed abruptly (${maxStepChange.toFixed(2)} px/frame²)`);
assert(Math.abs(placement.position.x - to.x) < 0.5
  && Math.abs(placement.font - to.font) < 0.1
  && Math.abs(placement.angle - to.angle) < 0.1,
  'spring did not settle at the target pose');
const interiorFirstSecond = steps.slice(0, 60).reduce((total, step) => total + step, 0);
const band = (top: number, bottom: number): Uint8Array => {
  const result = new Uint8Array(width * height);
  for (let y = top; y < bottom; y += 1) {
    for (let x = 6; x < 42; x += 1) result[x + y * width] = 1;
  }
  motion.remember(result);
  return result;
};
const travelInBand = (mask: Uint8Array): number => {
  const start = { x: 210, y: 216, font: 18, angle: 0 };
  const goal = { ...start, x: 258 };
  const body = motion.spawn(start, mask);
  body.target = goal;
  body.route = [goal];
  for (let frame = 0; frame < 30; frame += 1) {
    motion.glide({ text: 'Testia' }, body, 1 / 60);
    assert(motion.fitsPose(mask, 'Testia', { ...body.position, font: body.font, angle: body.angle }),
      `band inscription crossed its coast at frame ${frame}`);
  }
  return body.position.x - start.x;
};
const openTravel = travelInBand(mask);
const clearBand = travelInBand(band(14, 22));
const nearShoreBand = travelInBand(band(15, 21));
assert(clearBand <= openTravel * 1.2,
  `viscosity fell before the inscription touched a coast (${clearBand.toFixed(1)}px)`);
assert(nearShoreBand <= openTravel * 1.2,
  `viscosity fell near a shore before the inscription touched it (${nearShoreBand.toFixed(1)}px)`);
const escapeShrinkingCoast = (shore: Uint8Array): number => {
  const start = { x: 210, y: 193, font: 18, angle: 0 };
  const goal = { ...start, y: 216 };
  const body = motion.spawn(start, mask);
  body.target = goal;
  body.route = [goal];
  body.regionMask = shore;
  for (let frame = 0; frame < 20; frame += 1) motion.glide({ text: 'Testia' }, body, 1 / 60);
  assert(motion.fitsPose(shore, 'Testia', { ...body.position, font: body.font, angle: body.angle }),
    'inscription did not clear the advancing shore');
  return body.position.y - start.y;
};
const normalEscape = escapeShrinkingCoast(mask);
const coastEscape = escapeShrinkingCoast(band(15, 21));
assert(coastEscape > normalEscape * 1.8,
  `inscription did not loosen when the shore reached it (${coastEscape.toFixed(1)} vs ${normalEscape.toFixed(1)}px)`);

// A new orientation may arrive while the text is already turning. It must
// brake before reversing, just as its position does when a target moves.
const turning = motion.spawn({ x: 250, y: 210, font: 18, angle: 0 }, mask);
turning.target = { x: 250, y: 210, font: 18, angle: 60 };
turning.route = [turning.target];
const turnSteps: number[] = [];
for (let frame = 0; frame < 36; frame += 1) {
  const oldAngle = turning.angle;
  motion.glide({ text: 'Testia' }, turning, 1 / 60);
  turnSteps.push(turning.angle - oldAngle);
}
const beforeRetarget = turnSteps.at(-1)!;
turning.target = { ...turning.target, angle: -40 };
turning.route = [turning.target];
const oldAngle = turning.angle;
motion.glide({ text: 'Testia' }, turning, 1 / 60);
const afterRetarget = turning.angle - oldAngle;
assert(turnSteps[0] < Math.max(...turnSteps) * 0.5,
  'rotation started without easing');
assert(Math.abs(afterRetarget - beforeRetarget) < 0.25,
  `rotation reversed abruptly (${beforeRetarget.toFixed(2)}° → ${afterRetarget.toFixed(2)}° per frame)`);
let previousTurnStep = afterRetarget;
for (let frame = 0; frame < 360; frame += 1) {
  const angle = turning.angle;
  motion.glide({ text: 'Testia' }, turning, 1 / 60);
  const step = turning.angle - angle;
  assert(Math.abs(step - previousTurnStep) < 0.25,
    `turning speed jumped during reversal at frame ${frame}`);
  assert(motion.fitsPose(mask, 'Testia', { ...turning.position, font: turning.font, angle: turning.angle }),
    `turning left its legal pose at frame ${frame}`);
  previousTurnStep = step;
}
assert(Math.abs(turning.angle + 40) < 0.1, 'retargeted rotation did not settle');

const translating = motion.spawn({ x: 210, y: 210, font: 18, angle: 0 }, mask);
translating.target = { x: 258, y: 210, font: 18, angle: 0 };
translating.route = [translating.target];
for (let frame = 0; frame < 36; frame += 1) motion.glide({ text: 'Testia' }, translating, 1 / 60);
const beforeMove = translating.position.x - 210;
motion.glide({ text: 'Testia' }, translating, 1 / 60);
const previousMoveStep = translating.position.x - 210 - beforeMove;
translating.target = { ...translating.target, x: 180 };
translating.route = [translating.target];
const xBeforeRetarget = translating.position.x;
motion.glide({ text: 'Testia' }, translating, 1 / 60);
assert(Math.abs(translating.position.x - xBeforeRetarget - previousMoveStep) < 0.25,
  'translation reversed abruptly when its target moved');
console.log('spring path', {
  firstStep: Number(steps[0].toFixed(2)), maxStep: Number(maximum.toFixed(2)),
  lastMovingStep: Number(moving.at(-1)!.toFixed(2)), maxStepChange: Number(maxStepChange.toFixed(2)),
});
console.log('coast-dependent viscosity', { interior: Number(interiorFirstSecond.toFixed(1)),
  openTravel: Number(openTravel.toFixed(1)),
  clearBand: Number(clearBand.toFixed(1)), nearShoreBand: Number(nearShoreBand.toFixed(1)),
  normalEscape: Number(normalEscape.toFixed(1)), coastEscape: Number(coastEscape.toFixed(1)) });
console.log('rotation retarget', { before: Number(beforeRetarget.toFixed(2)),
  after: Number(afterRetarget.toFixed(2)) });
console.log('ok');
