import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { DEFAULT_ANGLES } from '../src/math/constants.ts';
import { rotate3Into } from '../src/math/transform.ts';
import { normalizePositions } from '../src/objects/mesh3d.ts';
import type { Vec3 } from '../src/math/types.ts';

const io = new NodeIO();
const doc = await io.read(fileURLToPath(new URL('../../models/matryoshka.glb', import.meta.url)));
const positions: number[] = [];
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    if (!pos) continue;
    const arr = pos.getArray();
    if (!arr) continue;
    for (let i = 0; i < arr.length; i++) positions.push(arr[i]);
  }
}
const buf = new Float32Array(positions);
normalizePositions(buf);
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (let i = 0; i < buf.length; i += 3) {
  minX = Math.min(minX, buf[i]); maxX = Math.max(maxX, buf[i]);
  minY = Math.min(minY, buf[i + 1]); maxY = Math.max(maxY, buf[i + 1]);
  minZ = Math.min(minZ, buf[i + 2]); maxZ = Math.max(maxZ, buf[i + 2]);
}
const ctx = {
  angles: DEFAULT_ANGLES,
  orbit: {
    mode: 'xw-yw' as const,
    invert: false,
    locked: false,
    listening: false,
    useGyro: false,
    xz: 0,
    yz: 0,
    targetXz: 0,
    targetYz: 0,
    lastMotionTime: 0,
    prevBeta: null,
    prevGamma: null,
    prevAlpha: null,
    prevRoll: null,
    prevPitch: null,
  },
  projectionDistance: 3,
};
const scratch: Vec3 = [0, 0, 0];
let halfW = 0, rMinY = 0, rMaxY = 0, maxR = 0;
for (const w of [-1, 1]) {
  for (let i = 0; i < buf.length; i += 3) {
    rotate3Into(buf[i], buf[i + 1], buf[i + 2], w, ctx, scratch);
    halfW = Math.max(halfW, Math.abs(scratch[0]));
    rMinY = Math.min(rMinY, scratch[1]);
    rMaxY = Math.max(rMaxY, scratch[1]);
    maxR = Math.max(maxR, Math.hypot(scratch[0], scratch[1], scratch[2]));
  }
}
console.log(JSON.stringify({
  verts: buf.length / 3,
  raw: { minX, maxX, minY, maxY, minZ, maxZ },
  rotated: { halfW, rMinY, rMaxY, maxR, height: rMaxY - rMinY },
}, null, 2));
