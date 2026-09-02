import { CUBE_EDGES, CUBE_FACE_INDICES } from '../math/constants';
import type { Mesh3D, Vec3 } from '../math/types';

export function cubeCorner(index: number): Vec3 {
  return [
    (index & 1) ? 1 : -1,
    (index & 2) ? 1 : -1,
    (index & 4) ? 1 : -1,
  ];
}

export function createTesseractMesh(): Mesh3D {
  const positions = new Float32Array(8 * 3);
  for (let i = 0; i < 8; i++) {
    const [x, y, z] = cubeCorner(i);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return {
    id: 'tesseract',
    kind: 'polytope',
    label: 'Tesseract',
    positions,
    vertexCount: 8,
    indices: new Uint32Array(CUBE_FACE_INDICES),
    uvs: null,
    edges: CUBE_EDGES.map(([a, b]) => [a, b]),
    displayEdges: CUBE_EDGES.map(([a, b]) => [a, b]),
    wSpokes: [0, 1, 2, 3, 4, 5, 6, 7],
    texture: null,
  };
}
