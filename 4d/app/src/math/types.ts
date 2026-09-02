export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

export type Angles = {
  xy: number;
  xz: number;
  yz: number;
  xw: number;
  yw: number;
  zw: number;
};

export type ViewMode = 'mono' | 'cross' | 'parallel';
export type TiltMode = 'off' | 'xyz' | 'xw-yw' | 'zw';
export type ObjectId = 'tesseract' | 'matryoshka';
export type ObjectKind = 'polytope' | 'surface';

export type DeviceOrbitState = {
  mode: TiltMode;
  invert: boolean;
  locked: boolean;
  listening: boolean;
  useGyro: boolean;
  xz: number;
  yz: number;
  targetXz: number;
  targetYz: number;
  lastMotionTime: number;
  prevBeta: number | null;
  prevGamma: number | null;
  prevAlpha: number | null;
  prevRoll: number | null;
  prevPitch: number | null;
};

export type TransformContext = {
  angles: Angles;
  orbit: DeviceOrbitState;
  projectionDistance: number;
};

export type DisplayState = {
  fillCaps: boolean;
  showCage: boolean;
  sliceCount: number;
  meshOpacity: number;
};

export type Mesh3D = {
  id: ObjectId;
  kind: ObjectKind;
  label: string;
  positions: Float32Array;
  vertexCount: number;
  indices: Uint32Array;
  uvs: Float32Array | null;
  edges: Array<[number, number]>;
  displayEdges: Array<[number, number]>;
  wSpokes: number[];
  texture: import('three').Texture | null;
};
