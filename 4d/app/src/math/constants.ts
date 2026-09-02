import type { Angles, ObjectId } from './types';

export const DEFAULT_ANGLES: Angles = {
  xy: 0,
  xz: -Math.PI / 2,
  yz: 0,
  xw: 0,
  yw: 0,
  zw: -Math.PI / 2,
};

export function defaultSliceCount(id: ObjectId): number {
  return id === 'matryoshka' ? 4 : 0;
}

export const DRAG_SENSITIVITY = 0.008;
export const WHEEL_SENSITIVITY = 0.0015;
export const WHEEL_PAN_SENSITIVITY = 0.006;
export const MAX_SLICES = 16;
export const SPOKE_COUNT = 32;
export const MAX_CAGE_EDGES = 140;
export const DEFAULT_OPACITY = 0.36;
export const BLUE: [number, number, number] = [0.24, 0.55, 1.0];
export const RED: [number, number, number] = [1.0, 0.30, 0.42];
export const CUBE_FACE_INDICES = [
  0, 2, 6, 0, 6, 4,
  1, 5, 7, 1, 7, 3,
  0, 4, 5, 0, 5, 1,
  2, 3, 7, 2, 7, 6,
  0, 1, 3, 0, 3, 2,
  4, 6, 7, 4, 7, 5,
];
export const CUBE_EDGES: Array<[number, number]> = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];
