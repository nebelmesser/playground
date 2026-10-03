import { DEFAULT_OPTIONS } from './url-options';

export const advanceHeldTemperature = (
  temperature: number,
  direction: -1 | 1,
  heldSeconds: number,
  deltaSeconds: number,
  min: number,
  max: number,
  duration = DEFAULT_OPTIONS.temperatureDuration,
): number => {
  if (deltaSeconds <= 0) return temperature;
  const target = direction < 0 ? min : max;
  const start = Math.min(1, Math.max(0, heldSeconds) / duration);
  const end = Math.min(1, (Math.max(0, heldSeconds) + deltaSeconds) / duration);
  if (end >= 1) return target;
  // Remaining distance of smoothstep(t) = 3t² - 2t³, factored to avoid
  // cancellation near the endpoint. Ratios compose independently of FPS and
  // start from the current temperature when a hold changes direction.
  const remaining = (t: number): number => (1 - t) ** 2 * (1 + 2 * t);
  return Math.max(min, Math.min(max, target + (temperature - target) * remaining(end) / remaining(start)));
};

export const temperaturePaddleProgress = (
  temperature: number,
  base: number,
  min: number,
  max: number,
): { freeze: number; heat: number } => ({
  freeze: base > min ? Math.max(0, Math.min(1, (base - temperature) / (base - min))) : 0,
  heat: base < max ? Math.max(0, Math.min(1, (temperature - base) / (max - base))) : 0,
});
