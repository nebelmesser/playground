import { MAX_CAGE_EDGES, SPOKE_COUNT } from '../math/constants';
import type { Mesh3D } from '../math/types';

export function uniqueEdges(indices: Uint32Array): Array<[number, number]> {
  const seen = new Set<number>();
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];
    addEdge(seen, edges, a, b);
    addEdge(seen, edges, b, c);
    addEdge(seen, edges, c, a);
  }
  return edges;
}

function addEdge(
  seen: Set<number>,
  edges: Array<[number, number]>,
  a: number,
  b: number,
): void {
  const lo = a < b ? a : b;
  const hi = a < b ? b : a;
  const key = (lo * 0x100000) ^ hi;
  if (seen.has(key)) return;
  seen.add(key);
  edges.push([lo, hi]);
}

export function normalizePositions(positions: Float32Array, targetSize = 2): void {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1e-6);
  const scale = targetSize / size;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (positions[i] - cx) * scale;
    positions[i + 1] = (positions[i + 1] - cy) * scale;
    positions[i + 2] = (positions[i + 2] - cz) * scale;
  }
}

function fibonacciDirs(n: number): Array<[number, number, number]> {
  const dirs: Array<[number, number, number]> = [];
  const golden = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = 2 * Math.PI * i / golden;
    dirs.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return dirs;
}

export function pickSpokes(positions: Float32Array, count = SPOKE_COUNT): number[] {
  const n = positions.length / 3;
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  const chosen = new Set<number>();
  for (const dir of fibonacciDirs(count)) {
    let best = 0;
    let bestDot = -Infinity;
    for (let i = 0; i < n; i++) {
      const o = i * 3;
      const dot = positions[o] * dir[0] + positions[o + 1] * dir[1] + positions[o + 2] * dir[2];
      if (dot > bestDot) {
        bestDot = dot;
        best = i;
      }
    }
    chosen.add(best);
  }
  return [...chosen];
}

export function subsampleEdges(
  edges: Array<[number, number]>,
  maxEdges = MAX_CAGE_EDGES,
): Array<[number, number]> {
  if (edges.length <= maxEdges) return edges.slice();
  const stride = Math.max(1, Math.floor(edges.length / maxEdges));
  const out: Array<[number, number]> = [];
  for (let i = 0; i < edges.length && out.length < maxEdges; i += stride) {
    out.push(edges[i]);
  }
  return out;
}

export function dropInwardTriangles(positions: Float32Array, indices: Uint32Array): Uint32Array {
  const n = positions.length / 3;
  let centX = 0;
  let centY = 0;
  let centZ = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    centX += positions[o];
    centY += positions[o + 1];
    centZ += positions[o + 2];
  }
  centX /= n;
  centY /= n;
  centZ /= n;

  const kept: number[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 3;
    const ib = indices[i + 1] * 3;
    const ic = indices[i + 2] * 3;
    const ax = positions[ia];
    const ay = positions[ia + 1];
    const az = positions[ia + 2];
    const bx = positions[ib];
    const by = positions[ib + 1];
    const bz = positions[ib + 2];
    const cx = positions[ic];
    const cy = positions[ic + 1];
    const cz = positions[ic + 2];
    const e1x = bx - ax;
    const e1y = by - ay;
    const e1z = bz - az;
    const e2x = cx - ax;
    const e2y = cy - ay;
    const e2z = cz - az;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const mx = (ax + bx + cx) / 3 - centX;
    const my = (ay + by + cy) / 3 - centY;
    const mz = (az + bz + cz) / 3 - centZ;
    if (nx * mx + ny * my + nz * mz > 0) {
      kept.push(indices[i], indices[i + 1], indices[i + 2]);
    }
  }
  return Uint32Array.from(kept);
}

export function finishMesh(mesh: Omit<Mesh3D, 'edges' | 'displayEdges' | 'wSpokes' | 'vertexCount'>): Mesh3D {
  const edges = uniqueEdges(mesh.indices);
  return {
    ...mesh,
    vertexCount: mesh.positions.length / 3,
    edges,
    displayEdges: subsampleEdges(edges),
    wSpokes: pickSpokes(mesh.positions),
  };
}
