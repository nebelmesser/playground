import {
  advanceInkOpacity, advanceInkTransition, blendedInkColor, inkColor, inkTransitionFrame,
  labelInkContrast, updateLabelInk, colorLuminance, contrastOpacity, labelTargetContrast,
  createInkPalette, type InkState,
} from '../src/label-ink.ts';
import { readUrlOptions } from '../src/url-options.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const viewport = { width: 400, height: 400 };
const label = { kind: 'island' as const, x: 200, y: 200, width: 180, height: 16, fontSize: 16, angle: 0 };
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
// Check the derivation across saturated colors and neutral endpoints without
// tying it to the former hard-coded orange/blue label colors.
for (const hex of ['000000', 'ffffff', '808080', 'ff0000', '00ff00', '0000ff', 'ffff00', '00ffff', 'ff00ff', '55cc66', '6633cc']) {
  const palette = createInkPalette(readUrlOptions(`?terrain_color=${hex}&water_color=${hex}`));
  for (const mode of ['dark', 'light'] as const) {
    const ink = inkColor('island', mode, palette);
    assert(ink === inkColor('lake', mode, palette), 'identical area colors must produce identical inks');
    assert(/^#[0-9a-f]{6}$/.test(ink), `invalid derived color: ${ink}`);
    const channels = [1, 3, 5].map(offset => parseInt(ink.slice(offset, offset + 2), 16));
    const source = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        assert((channels[i] - channels[j]) * (source[i] - source[j]) >= 0, 'ink changed hue channel order');
        if (source[i] === source[j]) assert(channels[i] === channels[j], 'neutral acquired a color cast');
      }
    }
  }
  for (let step = 0; step <= 100; step += 1) {
    const measured = labelInkContrast(label, uniform(step / 100), viewport, palette);
    assert(Math.max(measured.dark, measured.light) > 3.7, `ink loses contrast for ${hex} at ${step}% luminance`);
  }
}
const custom = createInkPalette(readUrlOptions('?terrain_color=55cc66&water_color=6633cc'));
assert(custom.land.dark !== custom.water.dark && custom.land.light !== custom.water.light,
  'area colors did not reach their respective label inks');
assert(labelInkContrast(label, uniform(0.15), viewport, custom).dark
  !== labelInkContrast(label, uniform(0.15), viewport).dark, 'contrast calculation ignored the custom inks');
const rgbChannels = (hex: string) => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
for (const blend of [0, 0.25, 0.5, 0.75, 1]) {
  const css = blendedInkColor('lake', 'dark', 'light', blend, custom);
  const channels = [...css.matchAll(/\d+(?:\.\d+)?/g)].map(match => Number(match[0]));
  const from = rgbChannels(custom.water.dark);
  const to = rgbChannels(custom.water.light);
  assert(channels.every((channel, i) => Math.abs(channel - (from[i] + (to[i] - from[i]) * blend)) < 0.01),
    'color transition used a different palette from contrast calculation');
}
assert(orange.darkOpacity < 0.82 && neutral.lightOpacity < 0.65,
  'both light and dark ink must soften when the background provides ample contrast');
for (const kind of ['island', 'lake'] as const) {
  for (const mode of ['dark', 'light'] as const) {
    const background = mode === 'dark' ? 0.317 : 0.008;
    const ink = colorLuminance(inkColor(kind, mode));
    let previous = 1;
    for (const fontSize of [8, 16, 24, 40, 64]) {
      const measured = labelInkContrast({ ...label, kind, fontSize }, uniform(background), viewport);
      const opacity = measured[mode === 'dark' ? 'darkOpacity' : 'lightOpacity'];
      assert(opacity < previous, `${kind} ${mode}: larger text should be paler`);
      previous = opacity;
      const encode = (v: number) => v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
      const encoded = encode(background) * (1 - opacity) + encode(ink) * opacity;
      const luminance = encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4;
      const ratio = (Math.max(background, luminance) + 0.05) / (Math.min(background, luminance) + 0.05);
      assert(Math.abs(ratio - labelTargetContrast(fontSize)) < 0.001,
        `${kind} ${mode} did not meet the shared composited contrast target`);
    }
  }
}
assert(contrastOpacity(0.1, 0.1, 2) === 1, 'equal luminance must not produce invalid alpha');
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

let opacity = advanceInkOpacity(undefined, 0.25, 0);
let largestAlphaStep = 0;
let firstAlphaStep = 0;
let lastAlphaStep = 0;
for (let frame = 0; frame < 180; frame += 1) {
  const next = advanceInkOpacity(opacity, 0.85, 1 / 60);
  const step = Math.abs(next.value - opacity.value);
  if (frame === 0) firstAlphaStep = step;
  lastAlphaStep = step;
  largestAlphaStep = Math.max(largestAlphaStep, step);
  opacity = next;
}
assert(largestAlphaStep < 0.02 && Math.abs(opacity.value - 0.85) < 0.001,
  `ink opacity did not ease (${largestAlphaStep.toFixed(3)} per frame)`);
assert(firstAlphaStep < largestAlphaStep * 0.3 && lastAlphaStep < largestAlphaStep * 0.3,
  'opacity must ease in and out');
for (let frame = 0; frame < 18; frame += 1) opacity = advanceInkOpacity(opacity, 0.25, 1 / 60);
const retarget = advanceInkOpacity(opacity, 0.9, 0);
assert(retarget.value === opacity.value && retarget.velocity === opacity.velocity,
  'retargeting opacity must preserve both value and velocity');
for (let frame = 0; frame < 240; frame += 1) {
  const next = advanceInkOpacity(opacity, frame < 60 ? 0.9 : 0.2, frame % 2 ? 0.5 : 1 / 60);
  assert(Math.abs(next.value - opacity.value) < 0.025 && next.value >= 0 && next.value <= 1,
    'opacity jerked or overshot after retargeting / a stalled frame');
  opacity = next;
}

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
