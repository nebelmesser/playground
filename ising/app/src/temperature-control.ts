const ACCELERATION_SECONDS = 0.7;
const RANGE_TRAVEL_SECONDS = 1.8;

export const advanceHeldTemperature = (
  temperature: number,
  direction: -1 | 1,
  heldSeconds: number,
  deltaSeconds: number,
  min: number,
  max: number,
): number => {
  if (deltaSeconds <= 0) return temperature;
  const start = Math.max(0, heldSeconds);
  const end = start + deltaSeconds;
  const maxRate = (max - min) / RANGE_TRAVEL_SECONDS;
  const distance = maxRate * (deltaSeconds - ACCELERATION_SECONDS * (
    Math.exp(-start / ACCELERATION_SECONDS) - Math.exp(-end / ACCELERATION_SECONDS)
  ));
  return Math.max(min, Math.min(max, temperature + direction * distance));
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
