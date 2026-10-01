import {
  advanceInkOpacity, advanceInkTransition, blendedInkColor, inkColor, inkTransitionFrame,
  labelInkContrast, updateLabelInk,
  type InkState,
} from '../src/label-ink.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const viewport = { width: 400, height: 400 };
const label = { kind: 'island' as const, x: 200, y: 200, width: 180, height: 16, angle: 0 };
const uniform = (luminance: number) => ({
  width: 100, height: 100, luminance: new Float32Array(100 * 100).fill(luminance),
});
const choose = (luminance: number, current?: InkState) => (
  updateLabelInk(current, labelInkContrast(label, uniform(luminance), viewport))
);

// The neutral map color is almost black; orange and blue full-strength pixels
// each have about 0.32 relative luminance. Their signs may cancel spatially,
// but the displayed pixels remain bright and need dark letters.
const neutral = choose(0.008);
const orange = choose(0.317);
const blue = choose(0.318);
assert(neutral.mode === 'light' && neutral.lightContrast > 12, 'neutral field needs readable light ink');
assert(orange.mode === 'dark' && orange.darkContrast > 5, 'bright orange needs dark ink');
assert(blue.mode === 'dark' && blue.darkContrast > 5, 'bright blue needs dark ink');
assert(inkColor('island', 'dark') === '#050302', 'land dark ink is no longer black');
assert(inkColor('island', 'light') === '#ffd5a6', 'dark land needs light orange, never white');
assert(inkColor('lake', 'dark') === '#06132e', 'bright water needs dark blue');
assert(inkColor('lake', 'light') === '#c4eaff', 'dark water needs light blue');
assert(orange.opacity < neutral.opacity && orange.opacity >= 0.82,
  'dark ink should soften only on a high-contrast background');
for (const size of [16, 64, 256]) {
  const field = { width: size, height: size, luminance: new Float32Array(size * size).fill(0.317) };
  assert(updateLabelInk(undefined, labelInkContrast(label, field, viewport)).mode === 'dark',
    `bright terrain chose light land ink at ${size}×${size}`);
  assert(updateLabelInk(undefined, labelInkContrast({ ...label, kind: 'lake' }, field, viewport)).mode === 'dark',
    `bright water chose light blue ink at ${size}×${size}`);
}
const minimumContrasts: number[] = [];
for (const kind of ['island', 'lake'] as const) {
  let minimumContrast = Infinity;
  for (let step = 0; step <= 1000; step += 1) {
    const sample = labelInkContrast({ ...label, kind }, uniform(step / 1000), viewport);
    minimumContrast = Math.min(minimumContrast, Math.max(sample.dark, sample.light));
  }
  assert(minimumContrast > 3.7, `${kind} ink loses contrast at an intermediate shade (${minimumContrast.toFixed(2)})`);
  minimumContrasts.push(minimumContrast);
}

let state = orange;
for (const nearThreshold of [0.17, 0.19, 0.16, 0.20, 0.18, 0.17]) {
  state = choose(nearThreshold, state);
  assert(state.mode === 'dark', 'minor changes around the contrast boundary made the ink blink');
}
for (let sample = 0; sample < 4; sample += 1) {
  state = choose(0.008, state);
  assert(state.mode === 'dark', 'brief dark fluctuation recolored the label');
}
for (let sample = 0; sample < 8; sample += 1) state = choose(0.008, state);
assert(state.mode === 'light', 'ink failed to adapt after the background became dark');
for (let sample = 0; sample < 4; sample += 1) {
  state = choose(0.317, state);
  assert(state.mode === 'light', 'brief bright fluctuation recolored the label');
}
for (let sample = 0; sample < 8; sample += 1) state = choose(0.317, state);
assert(state.mode === 'dark', 'ink failed to recover after the background became bright');

let opacity = orange.opacity;
let largestAlphaStep = 0;
for (let frame = 0; frame < 120; frame += 1) {
  const next = advanceInkOpacity(opacity, neutral.opacity, 1 / 60);
  largestAlphaStep = Math.max(largestAlphaStep, Math.abs(next - opacity));
  opacity = next;
}
assert(largestAlphaStep < 0.01 && Math.abs(opacity - neutral.opacity) < 0.02,
  `ink opacity did not ease (${largestAlphaStep.toFixed(3)} per frame)`);

const diagonalField = uniform(0.008);
for (let y = 0; y < 100; y += 1) {
  for (let x = 0; x < 100; x += 1) {
    if (Math.abs(y - x) < 3) diagonalField.luminance[y * 100 + x] = 0.317;
  }
}
const horizontal = updateLabelInk(undefined, labelInkContrast(label, diagonalField, viewport));
const diagonal = updateLabelInk(undefined, labelInkContrast({ ...label, angle: 45 }, diagonalField, viewport));
assert(horizontal.mode === 'light', 'horizontal text should sample the dark area along its own footprint');
assert(diagonal.mode === 'dark', 'diagonal text should sample the bright area along its own footprint');

let transition = advanceInkTransition(undefined, 'dark', 0);
let previousFrame = inkTransitionFrame(transition);
const channels = (css: string): number[] => [...css.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
const frameColor = (): number[] => channels(blendedInkColor('island', transition.from, transition.to, inkTransitionFrame(transition).blend));
let previousColor = frameColor();
let largestOpacityStep = 0;
let largestColorStep = 0;
let firstColorStep = 0;
let lastColorStep = 0;
let minimumOpacity = 1;
let crossedMidpoint = false;
for (let frame = 0; frame < 120; frame += 1) {
  transition = advanceInkTransition(transition, 'light', 1 / 60);
  const next = inkTransitionFrame(transition);
  const nextColor = frameColor();
  const colorStep = Math.max(...nextColor.map((channel, index) => Math.abs(channel - previousColor[index])));
  if (frame === 0) firstColorStep = colorStep;
  lastColorStep = colorStep;
  largestColorStep = Math.max(largestColorStep, colorStep);
  largestOpacityStep = Math.max(largestOpacityStep, Math.abs(next.opacity - previousFrame.opacity));
  minimumOpacity = Math.min(minimumOpacity, next.opacity);
  if (next.blend >= 0.45 && next.blend <= 0.55) crossedMidpoint = true;
  if (frame > 0) assert(next.blend + 1e-9 >= previousFrame.blend, 'ink color moved backward without a retarget');
  previousFrame = next;
  previousColor = nextColor;
}
assert(crossedMidpoint && transition.from === 'light' && transition.to === 'light'
  && previousFrame.opacity === 1, 'continuous ink transition did not finish');
assert(firstColorStep < largestColorStep * 0.3 && lastColorStep < largestColorStep * 0.3,
  'ink color did not ease at both ends');
assert(minimumOpacity === 1, `ink color transition dimmed the label (${minimumOpacity.toFixed(3)})`);
assert(largestColorStep < 12 && largestOpacityStep < 0.03,
  `color or opacity jerked in one frame (${largestColorStep.toFixed(2)}, ${largestOpacityStep.toFixed(3)})`);

transition = advanceInkTransition(undefined, 'dark', 0);
for (let frame = 0; frame < 4; frame += 1) transition = advanceInkTransition(transition, 'light', 1 / 60);
const beforeReverse = inkTransitionFrame(transition);
const beforeColor = frameColor();
transition = advanceInkTransition(transition, 'dark', 1 / 60);
const afterReverse = inkTransitionFrame(transition);
assert(Math.abs(afterReverse.opacity - beforeReverse.opacity) < 0.03
  && Math.max(...frameColor().map((channel, index) => Math.abs(channel - beforeColor[index]))) < 12,
  'reversing the desired ink restarted color or opacity abruptly');
for (let frame = 0; frame < 120; frame += 1) transition = advanceInkTransition(transition, 'dark', 1 / 60);
assert(transition.from === 'dark' && transition.to === 'dark' && inkTransitionFrame(transition).opacity === 1,
  'reversed ink transition did not settle back to the original color');

transition = advanceInkTransition(undefined, 'dark', 0);
for (let frame = 0; frame < 120; frame += 1) {
  transition = advanceInkTransition(transition, 'light', 1 / 60);
  if (inkTransitionFrame(transition).blend > 0.75) break;
}
previousFrame = inkTransitionFrame(transition);
previousColor = frameColor();
assert(previousFrame.blend > 0.75,
  'late reversal setup did not reach the new ink');
for (let frame = 0; frame < 120; frame += 1) {
  transition = advanceInkTransition(transition, 'dark', 1 / 60);
  const next = inkTransitionFrame(transition);
  const nextColor = frameColor();
  assert(Math.abs(next.opacity - previousFrame.opacity) < 0.03
    && Math.max(...nextColor.map((channel, index) => Math.abs(channel - previousColor[index]))) < 12,
  'a new color target interrupted the continuous ease');
  previousFrame = next;
  previousColor = nextColor;
}
assert(transition.from === 'dark' && transition.to === 'dark' && previousFrame.opacity === 1,
  'ink did not ease back after a late reversal');

for (const slowFrame of [1 / 30, 1 / 15, 0.5]) {
  transition = advanceInkTransition(undefined, 'dark', 0);
  let previousOpacity = 1;
  let previousChannels = frameColor();
  let maximumOpacityStep = 0;
  let maximumColorStep = 0;
  for (let frame = 0; frame < 180; frame += 1) {
    transition = advanceInkTransition(transition, 'light', slowFrame);
    const opacity = inkTransitionFrame(transition).opacity;
    const nextChannels = frameColor();
    maximumOpacityStep = Math.max(maximumOpacityStep, Math.abs(opacity - previousOpacity));
    maximumColorStep = Math.max(maximumColorStep,
      ...nextChannels.map((channel, index) => Math.abs(channel - previousChannels[index])));
    previousOpacity = opacity;
    previousChannels = nextChannels;
  }
  assert(maximumOpacityStep < 0.03 && maximumColorStep < 12 && inkTransitionFrame(transition).opacity === 1,
    `slow frames jerked ink (${maximumColorStep.toFixed(2)}, ${maximumOpacityStep.toFixed(3)})`);
}

console.log('Label ink: contrast, rotation, and temporal stability passed.', {
  minimumUniformContrast: Math.min(...minimumContrasts).toFixed(2),
  largestColorStep: largestColorStep.toFixed(2),
  largestOpacityStep: largestOpacityStep.toFixed(3),
});
