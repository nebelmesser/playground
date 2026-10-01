import type { PlaceLabel } from './place-engine';

export type LuminanceField = { width: number; height: number; luminance: Float32Array };
export type InkMode = 'dark' | 'light';
export type InkState = { mode: InkMode; darkContrast: number; lightContrast: number };
export type InkTransition = { from: InkMode; to: InkMode; progress: number; velocity: number };

const INKS = {
  land: { dark: '#060403', light: '#fffefd' },
  water: { dark: '#020913', light: '#fcfeff' },
} as const;

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

export const inkColor = (kind: PlaceLabel['kind'], mode: InkMode): string => (
  INKS[kind === 'lake' ? 'water' : 'land'][mode]
);

export const blendedInkColor = (
  kind: PlaceLabel['kind'], from: InkMode, to: InkMode, blend: number,
): string => {
  const start = inkColor(kind, from);
  const end = inkColor(kind, to);
  const channels = [1, 3, 5].map((offset) => {
    const first = parseInt(start.slice(offset, offset + 2), 16);
    const last = parseInt(end.slice(offset, offset + 2), 16);
    return (first + (last - first) * blend).toFixed(2);
  });
  return `rgb(${channels.join(', ')})`;
};

export const labelInkContrast = (
  label: Pick<PlaceLabel, 'kind' | 'x' | 'y' | 'width' | 'height' | 'angle'>,
  field: LuminanceField,
  viewport: { width: number; height: number },
): { dark: number; light: number } => {
  const radians = label.angle * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const darkLuminance = colorLuminance(inkColor(label.kind, 'dark'));
  const lightLuminance = colorLuminance(inkColor(label.kind, 'light'));
  const dark: number[] = [];
  const light: number[] = [];
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
    }
  }
  dark.sort((a, b) => a - b);
  light.sort((a, b) => a - b);
  const lowQuartile = Math.floor((dark.length - 1) * 0.25);
  return { dark: dark[lowQuartile], light: light[lowQuartile] };
};

export const updateLabelInk = (
  current: InkState | undefined,
  measured: { dark: number; light: number },
): InkState => {
  // Filter changing terrain and require a clear contrast advantage before
  // retargeting the continuous ink animation.
  const darkContrast = current ? current.darkContrast * 0.55 + measured.dark * 0.45 : measured.dark;
  const lightContrast = current ? current.lightContrast * 0.55 + measured.light * 0.45 : measured.light;
  let mode = current?.mode ?? (darkContrast >= lightContrast ? 'dark' : 'light');
  const alternate = mode === 'dark' ? lightContrast : darkContrast;
  const selected = mode === 'dark' ? darkContrast : lightContrast;
  if (alternate > selected * 1.22) mode = mode === 'dark' ? 'light' : 'dark';
  return { mode, darkContrast, lightContrast };
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
    opacity: 1 - 0.2 * Math.sin(Math.PI * eased) ** 2,
  };
};
