export type Point = { x: number; y: number };

/** Row-major 3 × 3 matrix. */
export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number,
];

export const UNIT_SQUARE: readonly Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

export function polygonArea(points: readonly Point[]): number {
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    twiceArea += point.x * next.y - next.x * point.y;
  }
  return Math.abs(twiceArea) * 0.5;
}

export function polygonCentroid(points: readonly Point[]): Point {
  const sum = points.reduce(
    (value, point) => ({ x: value.x + point.x, y: value.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function isConvex(points: readonly Point[], minimumArea = 0.008): boolean {
  if (points.length !== 4 || polygonArea(points) < minimumArea) return false;

  let sign = 0;
  for (let index = 0; index < 4; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % 4];
    const c = points[(index + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-5) return false;
    const currentSign = Math.sign(cross);
    if (sign === 0) sign = currentSign;
    if (currentSign !== sign) return false;
  }
  return sign > 0;
}

export function scalePolygon(points: readonly Point[], scale: number): Point[] {
  const center = polygonCentroid(points);
  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
  }));
}

export function interpolatePolygon(
  from: readonly Point[],
  to: readonly Point[],
  amount: number,
): Point[] {
  return from.map((point, index) => ({
    x: point.x + (to[index].x - point.x) * amount,
    y: point.y + (to[index].y - point.y) * amount,
  }));
}

/** Closed-form DLT for a unit square projected onto an arbitrary convex quad. */
export function homographyFromUnitSquare(points: readonly Point[]): Mat3 {
  const [p0, p1, p2, p3] = points;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;

  let g = 0;
  let h = 0;
  const denominator = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(dx3) > 1e-10 || Math.abs(dy3) > 1e-10) {
    if (Math.abs(denominator) < 1e-10) {
      throw new Error('Degenerate quadrilateral');
    }
    g = (dx3 * dy2 - dx2 * dy3) / denominator;
    h = (dx1 * dy3 - dx3 * dy1) / denominator;
  }

  return [
    p1.x - p0.x + g * p1.x,
    p3.x - p0.x + h * p3.x,
    p0.x,
    p1.y - p0.y + g * p1.y,
    p3.y - p0.y + h * p3.y,
    p0.y,
    g,
    h,
    1,
  ];
}

export function invertMat3(matrix: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  const A = e * i - f * h;
  const B = c * h - b * i;
  const C = b * f - c * e;
  const D = f * g - d * i;
  const E = a * i - c * g;
  const F = c * d - a * f;
  const G = d * h - e * g;
  const H = b * g - a * h;
  const I = a * e - b * d;
  const determinant = a * A + b * D + c * G;
  if (Math.abs(determinant) < 1e-12) throw new Error('Singular homography');
  const inverse = 1 / determinant;
  return [
    A * inverse, B * inverse, C * inverse,
    D * inverse, E * inverse, F * inverse,
    G * inverse, H * inverse, I * inverse,
  ];
}

export function multiplyMat3(left: Mat3, right: Mat3): Mat3 {
  const result = new Array<number>(9).fill(0);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      for (let offset = 0; offset < 3; offset += 1) {
        result[row * 3 + column] += left[row * 3 + offset] * right[offset * 3 + column];
      }
    }
  }
  return result as Mat3;
}

const IDENTITY_MAT3: Mat3 = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
];

function addMat3(left: Mat3, right: Mat3): Mat3 {
  return left.map((value, index) => value + right[index]) as Mat3;
}

function subtractMat3(left: Mat3, right: Mat3): Mat3 {
  return left.map((value, index) => value - right[index]) as Mat3;
}

function scaleMat3(matrix: Mat3, scale: number): Mat3 {
  return matrix.map((value) => value * scale) as Mat3;
}

function mat3Norm(matrix: Mat3): number {
  let maximum = 0;
  for (let row = 0; row < 3; row += 1) {
    let sum = 0;
    for (let column = 0; column < 3; column += 1) sum += Math.abs(matrix[row * 3 + column]);
    maximum = Math.max(maximum, sum);
  }
  return maximum;
}

function determinantMat3(matrix: Mat3): number {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

function squareRootMat3(matrix: Mat3): Mat3 {
  // Denman-Beavers iteration. Recursion homographies are nonsingular and
  // orientation preserving, so their determinant-normalised real principal
  // square root exists for the editor's valid nested frames.
  let root = matrix;
  let inverseRoot = [...IDENTITY_MAT3] as Mat3;
  for (let iteration = 0; iteration < 18; iteration += 1) {
    const nextRoot = scaleMat3(addMat3(root, invertMat3(inverseRoot)), 0.5);
    const nextInverseRoot = scaleMat3(addMat3(inverseRoot, invertMat3(root)), 0.5);
    const change = mat3Norm(subtractMat3(nextRoot, root));
    root = nextRoot;
    inverseRoot = nextInverseRoot;
    if (change < 1e-12) break;
  }
  return root;
}

function logarithmMat3(matrix: Mat3): Mat3 {
  let reduced = matrix;
  let roots = 0;
  while (mat3Norm(subtractMat3(reduced, IDENTITY_MAT3)) > 0.35 && roots < 12) {
    reduced = squareRootMat3(reduced);
    roots += 1;
  }

  const offset = subtractMat3(reduced, IDENTITY_MAT3);
  let term = offset;
  let result = [...offset] as Mat3;
  for (let order = 2; order <= 36; order += 1) {
    term = multiplyMat3(term, offset);
    result = addMat3(result, scaleMat3(term, (order % 2 === 0 ? -1 : 1) / order));
  }
  return scaleMat3(result, 2 ** roots);
}

function exponentialMat3(matrix: Mat3): Mat3 {
  const squarings = Math.max(0, Math.ceil(Math.log2(Math.max(1, mat3Norm(matrix) / 0.5))));
  const reduced = scaleMat3(matrix, 1 / (2 ** squarings));
  let result = [...IDENTITY_MAT3] as Mat3;
  let term = [...IDENTITY_MAT3] as Mat3;
  for (let order = 1; order <= 30; order += 1) {
    term = scaleMat3(multiplyMat3(term, reduced), 1 / order);
    result = addMat3(result, term);
  }
  for (let iteration = 0; iteration < squarings; iteration += 1) {
    result = multiplyMat3(result, result);
  }
  return result;
}

/**
 * Continuous projective group step H^amount.
 *
 * Unlike corner-wise interpolation, this obeys H^(t + 1) = H · H^t, so a
 * recursion fold at the end of a phase preserves both position and velocity.
 */
export function fractionalMat3(matrix: Mat3, amount: number): Mat3 {
  if (amount <= 0) return [...IDENTITY_MAT3] as Mat3;
  if (amount >= 1) return [...matrix] as Mat3;

  let normalized = [...matrix] as Mat3;
  let determinant = determinantMat3(normalized);
  if (determinant < 0) {
    normalized = scaleMat3(normalized, -1);
    determinant = -determinant;
  }
  if (!Number.isFinite(determinant) || determinant < 1e-12) {
    throw new Error('Singular recursion homography');
  }
  normalized = scaleMat3(normalized, 1 / Math.cbrt(determinant));
  return exponentialMat3(scaleMat3(logarithmMat3(normalized), amount));
}

export function projectPoint(matrix: Mat3, point: Point): Point {
  const denominator = matrix[6] * point.x + matrix[7] * point.y + matrix[8];
  return {
    x: (matrix[0] * point.x + matrix[1] * point.y + matrix[2]) / denominator,
    y: (matrix[3] * point.x + matrix[4] * point.y + matrix[5]) / denominator,
  };
}

export function projectiveFixedPoint(transform: Mat3, seed: Point): Point {
  let point = seed;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    point = projectPoint(transform, point);
  }
  return point;
}

/** Geometric-mean scale of a homography's local derivative in image space. */
export function homographyScaleAtPoint(transform: Mat3, point: Point, imageAspect: number): number {
  const epsilon = 1e-4;
  const origin = projectPoint(transform, point);
  const alongX = projectPoint(transform, { x: point.x + epsilon / imageAspect, y: point.y });
  const alongY = projectPoint(transform, { x: point.x, y: point.y + epsilon });
  const j00 = (alongX.x - origin.x) * imageAspect / epsilon;
  const j10 = (alongX.y - origin.y) / epsilon;
  const j01 = (alongY.x - origin.x) * imageAspect / epsilon;
  const j11 = (alongY.y - origin.y) / epsilon;
  return Math.sqrt(Math.abs(j00 * j11 - j01 * j10));
}

export function recursionScaleFactor(
  outer: readonly Point[],
  inner: readonly Point[],
  imageAspect: number,
): number {
  const outerToInner = multiplyMat3(
    homographyFromUnitSquare(inner),
    invertMat3(homographyFromUnitSquare(outer)),
  );
  const fixedPoint = projectiveFixedPoint(outerToInner, polygonCentroid(inner));
  const localShrink = homographyScaleAtPoint(outerToInner, fixedPoint, imageAspect);
  if (Number.isFinite(localShrink) && localShrink > 1e-4 && localShrink < 0.9999) {
    return 1 / localShrink;
  }
  return Math.sqrt(polygonArea(outer) / polygonArea(inner));
}

/** Convert row-major JS storage to WebGL's column-major uniform layout. */
export function toWebGlMatrix(matrix: Mat3): Float32Array {
  return new Float32Array([
    matrix[0], matrix[3], matrix[6],
    matrix[1], matrix[4], matrix[7],
    matrix[2], matrix[5], matrix[8],
  ]);
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}
