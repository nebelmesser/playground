import { BLUE, RED } from './constants';
import type { Vec3 } from './types';

export function colorForObjectW(w: number): Vec3 {
  return w < 0 ? [BLUE[0], BLUE[1], BLUE[2]] : [RED[0], RED[1], RED[2]];
}

export function lerpColor(t: number): Vec3 {
  return [
    BLUE[0] + (RED[0] - BLUE[0]) * t,
    BLUE[1] + (RED[1] - BLUE[1]) * t,
    BLUE[2] + (RED[2] - BLUE[2]) * t,
  ];
}

export function colorToHex(c: Vec3): number {
  const r = Math.round(c[0] * 255);
  const g = Math.round(c[1] * 255);
  const b = Math.round(c[2] * 255);
  return (r << 16) | (g << 8) | b;
}
