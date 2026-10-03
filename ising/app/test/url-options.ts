import { DEFAULT_OPTIONS, readUrlOptions, cssColor } from '../src/url-options.ts';

const assert = (ok: boolean, message: string): void => { if (!ok) throw new Error(message); };
assert(JSON.stringify(readUrlOptions('')) === JSON.stringify(DEFAULT_OPTIONS), 'defaults changed');
for (const seconds of [0.1, 0.5, 4, 8, 30]) {
  assert(readUrlOptions(`?temperature_duration=${seconds}`).temperatureDuration === seconds,
    `invalid temperature duration ${seconds}`);
}
for (const value of ['', '0', '-1', 'NaN', 'Infinity', '4seconds']) {
  assert(readUrlOptions(`?temperature_duration=${value}`).temperatureDuration === 8,
    `invalid temperature duration accepted: ${value}`);
}
for (const percent of [0, 1, 37, 40, 50, 99.5, 100]) {
  assert(readUrlOptions(`?start_terrain=${percent}`).startTerrain === percent / 100, `invalid percentage ${percent}`);
}
for (const value of ['', 'NaN', 'Infinity', '-1', '101', '40percent', '0x28']) {
  assert(readUrlOptions(`?start_terrain=${value}`).startTerrain === 0.47, `invalid percentage accepted: ${value}`);
}
for (const [hex, expected] of [['abc', 'rgb(170, 187, 204)'], ['00ff80', 'rgb(0, 255, 128)'],
  ['%23Aa00FF', 'rgb(170, 0, 255)'], ['000000', 'rgb(0, 0, 0)'], ['ffffff', 'rgb(255, 255, 255)']]) {
  const options = readUrlOptions(`?terrain_color=${hex}&water_color=${hex}`);
  assert(cssColor(options.terrainColor) === expected && cssColor(options.waterColor) === expected, `hex failed: ${hex}`);
}
for (const value of ['', 'red', '12345', '12345678', 'ggg', 'rgb(1,2,3)']) {
  const options = readUrlOptions(`?terrain_color=${value}&water_color=${value}`);
  assert(options.terrainColor === DEFAULT_OPTIONS.terrainColor && options.waterColor === DEFAULT_OPTIONS.waterColor,
    `invalid color accepted: ${value}`);
}
const independent = readUrlOptions('?start_terrain=75&terrain_color=bad-color&water_color=fff');
assert(independent.startTerrain === 0.75 && independent.terrainColor === DEFAULT_OPTIONS.terrainColor
  && cssColor(independent.waterColor) === 'rgb(255, 255, 255)', 'invalid parameter affected the others');
console.log('URL options: defaults, percentages, hex colors and independent fallbacks passed.');
