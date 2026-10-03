import type { PlaceLabel } from './place-engine';
import { DEFAULT_OPTIONS, type IsingOptions, type Rgb } from './url-options';

export type LuminanceField = { width: number; height: number; luminance: Float32Array };
export type InkMode = 'dark' | 'light';
export type InkMeasurement = { dark: number; light: number; darkOpacity: number; lightOpacity: number };
export type InkState = InkMeasurement & {
  mode: InkMode; darkContrast: number; lightContrast: number; weakSamples: number;
};
export type InkOpacity = { value: number; velocity: number };
export type InkTransition = { from: InkMode; to: InkMode; progress: number; velocity: number };

export type InkPalette = Record<'land' | 'water', Record<InkMode, string>>;

const deriveInk = (base: Rgb): Record<InkMode, string> => {
  const tint = (baseWeight: number, neutral: number): string => '#' + base.map((channel) => (
    Math.round((channel * baseWeight + neutral * (1 - baseWeight)) * 255)
      .toString(16).padStart(2, '0')
  )).join('');
  // The same shade/tint rule preserves each area's hue, including neutral
  // palettes, while keeping the two inks far enough apart for contrast choice.
  return { dark: tint(0.1, 0), light: tint(0.15, 1) };
};

export const createInkPalette = (colors: Pick<IsingOptions, 'terrainColor' | 'waterColor'>): InkPalette => ({
  land: deriveInk(colors.terrainColor),
  water: deriveInk(colors.waterColor),
});

const DEFAULT_INKS = createInkPalette(DEFAULT_OPTIONS);

const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));

const linearChannel = (channel: number): number => (
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
);

export const colorLuminance = (hex: string): number => {
  const channels = [1, 3, 5].map((offset) => linearChannel(parseInt(hex.slice(offset, offset + 2), 16) / 255));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrast = (first: number, second: number): number => (
  (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
);

export const inkColor = (kind: PlaceLabel['kind'], mode: InkMode, palette: InkPalette = DEFAULT_INKS): string => (
  palette[kind === 'lake' ? 'water' : 'land'][mode]
);

export const blendedInkColor = (
  kind: PlaceLabel['kind'], from: InkMode, to: InkMode, blend: number,
  palette: InkPalette = DEFAULT_INKS,
): string => {
  const start = inkColor(kind, from, palette);
  const end = inkColor(kind, to, palette);
  const channels = [1, 3, 5].map((offset) => {
    const first = parseInt(start.slice(offset, offset + 2), 16);
    const last = parseInt(end.slice(offset, offset + 2), 16);
    return (first + (last - first) * blend).toFixed(2);
  });
  return `rgb(${channels.join(', ')})`;
};

const encodedChannel = (linear: number): number => (
  linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055
);

export const labelTargetContrast = (fontSize: number): number => (
  // Larger letterforms need less contrast: one continuous rule for every label.
  1.6 + 1.6 / (1 + (Math.max(0, fontSize) / 24) ** 2)
);

export const contrastOpacity = (background: number, ink: number, target: number): number => {
  const desired = ink < background
    ? (background + 0.05) / target - 0.05
    : (background + 0.05) * target - 0.05;
  // CSS alpha blends encoded channels. Equivalent-gray luminance approximates
  // that composition using the existing small GPU luminance readback.
  const start = encodedChannel(background);
  const end = encodedChannel(ink);
  if (Math.abs(end - start) < 1e-6) return 1;
  return clamp((encodedChannel(clamp(desired, 0, 1)) - start) / (end - start), 0, 1);
};

export const labelInkContrast = (
  label: Pick<PlaceLabel, 'kind' | 'x' | 'y' | 'width' | 'height' | 'angle' | 'fontSize'>,
  field: LuminanceField,
  viewport: { width: number; height: number },
  palette: InkPalette = DEFAULT_INKS,
): InkMeasurement => {
  const radians = label.angle * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const darkLuminance = colorLuminance(inkColor(label.kind, 'dark', palette));
  const lightLuminance = colorLuminance(inkColor(label.kind, 'light', palette));
  const dark: number[] = [];
  const light: number[] = [];
  const darkOpacity: number[] = [];
  const lightOpacity: number[] = [];
  const target = labelTargetContrast(label.fontSize);
  // Sample the rotated text footprint, rather than just its center. The low
  // contrast quartile discounts narrow contour lines without ignoring a dark
  // stretch that crosses several letters.
  for (let row = -1; row <= 1; row += 1) {
    for (let column = -4; column <= 4; column += 1) {
      const localX = column * label.width * 0.105;
      const localY = row * label.height * 0.28;
      const x = label.x + localX * cosine - localY * sine;
      const y = label.y + localX * sine + localY * cosine;
      const cellX = Math.max(0, Math.min(field.width - 1, Math.floor(x / viewport.width * field.width)));
      const cellY = Math.max(0, Math.min(field.height - 1, Math.floor(y / viewport.height * field.height)));
      const background = field.luminance[cellY * field.width + cellX];
      dark.push(contrast(background, darkLuminance));
      light.push(contrast(background, lightLuminance));
      darkOpacity.push(contrastOpacity(background, darkLuminance, target));
      lightOpacity.push(contrastOpacity(background, lightLuminance, target));
    }
  }
  dark.sort((a, b) => a - b);
  light.sort((a, b) => a - b);
  const lowQuartile = Math.floor((dark.length - 1) * 0.25);
  darkOpacity.sort((a, b) => a - b);
  lightOpacity.sort((a, b) => a - b);
  const highQuartile = dark.length - 1 - lowQuartile;
  return {
    dark: dark[lowQuartile], light: light[lowQuartile],
    darkOpacity: darkOpacity[highQuartile], lightOpacity: lightOpacity[highQuartile],
  };
};

export const updateLabelInk = (
  current: InkState | undefined,
  measured: InkMeasurement,
): InkState => {
  // Keep the established ink while it remains legible. A locally better
  // alternative is not a reason to recolor a drifting inscription.
  const darkContrast = current ? current.darkContrast * 0.55 + measured.dark * 0.45 : measured.dark;
  const lightContrast = current ? current.lightContrast * 0.55 + measured.light * 0.45 : measured.light;
  let mode = current?.mode ?? (darkContrast >= 2.5 || lightContrast < 4.5 ? 'dark' : 'light');
  const alternate = mode === 'dark' ? lightContrast : darkContrast;
  const selected = mode === 'dark' ? darkContrast : lightContrast;
  const weakSamples = selected < (mode === 'dark' ? 2.5 : 3)
    && alternate > 4.5 ? (current?.weakSamples ?? 0) + 1 : 0;
  const switchInk = weakSamples >= 5;
  if (switchInk) mode = mode === 'dark' ? 'light' : 'dark';
  return {
    ...measured, mode, darkContrast, lightContrast, weakSamples: switchInk ? 0 : weakSamples,
  };
};

export const advanceInkOpacity = (
  current: InkOpacity | undefined, target: number, seconds: number,
): InkOpacity => {
  if (!current) return { value: target, velocity: 0 };
  // A critically damped spring eases both ends and preserves velocity when
  // the background, size, or selected ink changes during an existing ease.
  const dt = clamp(seconds, 0, 1 / 60);
  const frequency = 5;
  const offset = current.value - target;
  const motion = current.velocity + frequency * offset;
  const decay = Math.exp(-frequency * dt);
  return {
    value: target + (offset + motion * dt) * decay,
    velocity: (current.velocity - frequency * motion * dt) * decay,
  };
};

export const advanceInkTransition = (
  current: InkTransition | undefined,
  desired: InkMode,
  seconds: number,
): InkTransition => {
  if (!current) return { from: desired, to: desired, progress: 1, velocity: 0 };
  let state = current;
  if (state.from === state.to) {
    if (desired === state.to) return state;
    state = { from: state.to, to: desired, progress: 0, velocity: 0 };
  }
  const target = desired === state.to ? 1 : 0;
  const dt = Math.max(0, Math.min(seconds, 1 / 60));
  const frequency = 5;
  const offset = state.progress - target;
  const motion = state.velocity + frequency * offset;
  const decay = Math.exp(-frequency * dt);
  const progress = Math.max(0, Math.min(1, target + (offset + motion * dt) * decay));
  const velocity = (state.velocity - frequency * motion * dt) * decay;
  if (Math.abs(progress - target) < 0.001 && Math.abs(velocity) < 0.02) {
    return { from: desired, to: desired, progress: 1, velocity: 0 };
  }
  return { ...state, progress, velocity };
};

export const inkTransitionFrame = (state: InkTransition): { blend: number; opacity: number } => {
  if (state.from === state.to) return { blend: 1, opacity: 1 };
  const eased = state.progress * state.progress * (3 - 2 * state.progress);
  return {
    blend: eased,
    opacity: 1,
  };
};
