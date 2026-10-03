export type Rgb = readonly [number, number, number];
export type IsingOptions = {
  startTerrain: number;
  terrainColor: Rgb;
  waterColor: Rgb;
  temperatureDuration: number;
};

export const DEFAULT_OPTIONS: IsingOptions = {
  startTerrain: 0.47,
  terrainColor: [1, 1, 1],
  waterColor: [1 / 255, 14 / 255, 134 / 255],
  temperatureDuration: 8,
};

const parseColor = (value: string | null, fallback: Rgb): Rgb => {
  const hex = value?.trim().replace(/^#/, '') ?? '';
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return fallback;
  const full = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex;
  const channel = (offset: number): number => parseInt(full.slice(offset, offset + 2), 16) / 255;
  return [channel(0), channel(2), channel(4)];
};

export const readUrlOptions = (search: string): IsingOptions => {
  const params = new URLSearchParams(search);
  const rawTerrain = params.get('start_terrain')?.trim() ?? '';
  const percent = /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(rawTerrain) ? Number(rawTerrain) : NaN;
  const rawDuration = params.get('temperature_duration')?.trim() ?? '';
  const duration = /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(rawDuration) ? Number(rawDuration) : NaN;
  return {
    startTerrain: Number.isFinite(percent) && percent >= 0 && percent <= 100
      ? percent / 100 : DEFAULT_OPTIONS.startTerrain,
    terrainColor: parseColor(params.get('terrain_color'), DEFAULT_OPTIONS.terrainColor),
    waterColor: parseColor(params.get('water_color'), DEFAULT_OPTIONS.waterColor),
    temperatureDuration: Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_OPTIONS.temperatureDuration,
  };
};

export const cssColor = (color: Rgb): string => `rgb(${color.map((channel) => channel * 255).join(', ')})`;
