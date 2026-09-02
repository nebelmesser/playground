import type { Vec3 } from './types';

export function project4to3(
  x: number,
  y: number,
  z: number,
  w: number,
  projectionDistance: number,
): Vec3 {
  const wFactor = 1 / Math.max(0.2, projectionDistance - w);
  return [x * wFactor, y * wFactor, z * wFactor];
}
