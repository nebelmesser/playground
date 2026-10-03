import { advanceHeldTemperature, temperaturePaddleProgress } from '../src/temperature-control.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const min = 0.8;
const max = 4.5;
const base = 2.27;
const progress = (temperature: number) => temperaturePaddleProgress(temperature, base, min, max);
assert(progress(base).freeze === 0 && progress(base).heat === 0,
  'progress must start empty at the selected temperature');
assert(progress(min).freeze === 1 && progress(min).heat === 0,
  'freeze progress must reach full only at minimum temperature');
assert(progress(max).freeze === 0 && progress(max).heat === 1,
  'heat progress must reach full only at maximum temperature');
assert(Math.abs(progress((base + min) / 2).freeze - 0.5) < 1e-10,
  'freeze progress must track the actual intermediate temperature');
assert(Math.abs(progress((base + max) / 2).heat - 0.5) < 1e-10,
  'heat progress must track the actual intermediate temperature');

const trace = (direction: -1 | 1, frameSeconds: number, seconds: number): number[] => {
  const values = [base];
  let temperature = base;
  for (let held = 0; held < seconds - 1e-10; held += frameSeconds) {
    temperature = advanceHeldTemperature(temperature, direction, held, frameSeconds, min, max);
    values.push(temperature);
  }
  return values;
};

for (const direction of [-1, 1] as const) {
  const values = trace(direction, 1 / 60, 0.6);
  const first = Math.abs(values[12] - values[0]);
  const second = Math.abs(values[24] - values[12]);
  const third = Math.abs(values[36] - values[24]);
  assert(first < second && second < third,
    `${direction < 0 ? 'freezing' : 'heating'} did not accelerate (${first}, ${second}, ${third})`);
  const coarse = trace(direction, 1 / 30, 0.6);
  assert(Math.abs(values.at(-1)! - coarse.at(-1)!) < 1e-10,
    'temperature ramp depends on frame rate');
  const oneSecond = trace(direction, 1 / 60, 1).at(-1)!;
  assert(Math.abs(oneSecond - base) > 0.03 && Math.abs(oneSecond - base) < 0.12,
    'one-second hold should change temperature gently while still being measurable');
  const fiveSeconds = trace(direction, 1 / 60, 5).at(-1)!;
  assert(fiveSeconds > min && fiveSeconds < max,
    'temperature traversed its range too quickly');
  const end = trace(direction, 1 / 60, 30).at(-1)!;
  assert(end === (direction < 0 ? min : max), 'temperature passed its limit');

  const target = direction < 0 ? min : max;
  for (const duration of [0.5, 4, 8, 20]) {
    const at = (fraction: number): number => advanceHeldTemperature(base, direction, 0, duration * fraction, min, max, duration);
    assert(Math.abs(at(0.5) - (base + target) / 2) < 1e-10, 'half the duration must reach half the distance');
    assert(at(1) === target && at(2) === target, 'configured duration must reach and stop at the limit');
    const firstQuarter = Math.abs(at(0.25) - base);
    const middleQuarter = Math.abs(at(0.5) - at(0.25));
    const lastQuarter = Math.abs(at(1) - at(0.75));
    assert(firstQuarter < middleQuarter && Math.abs(firstQuarter - lastQuarter) < 1e-10,
      'S-curve must accelerate then decelerate symmetrically');
    let fine = base;
    for (let frame = 0; frame < 90; frame += 1) {
      fine = advanceHeldTemperature(fine, direction, frame * duration / 120, duration / 120, min, max, duration);
    }
    assert(Math.abs(fine - at(0.75)) < 1e-10, 'configured curve depends on frame rate');
  }
  const half = advanceHeldTemperature(base, direction, 0, 4, min, max, 8);
  const reversed = advanceHeldTemperature(half, direction === 1 ? -1 : 1, 0, 1 / 60, min, max, 8);
  assert(Math.abs(reversed - half) < 0.001, 'changing direction must begin gently at the current temperature');
}

console.log('temperature ramp and progress ok');
