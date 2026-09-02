import type { Mesh3D, Vec4 } from '../math/types';

/** A 3D mesh extruded along W as a prism: Mesh × [-1, +1]. */
export function extrudedVertex(mesh: Mesh3D, index: number, w: number): Vec4 {
  const o = index * 3;
  return [mesh.positions[o], mesh.positions[o + 1], mesh.positions[o + 2], w];
}
