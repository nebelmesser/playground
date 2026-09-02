import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  InterleavedBufferAttribute,
  LoadingManager,
  Mesh as ThreeMesh,
  Texture,
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import sharp from 'sharp';

if (!('self' in globalThis)) {
  (globalThis as Record<string, unknown>).self = globalThis;
}

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fourD = resolve(appRoot, '..');
const fbxPath = join(fourD, 'matryoshka-doll/source/matroska.fbx');
const texturePath = join(fourD, 'matryoshka-doll/textures/Matroska_BaseColor.png');

class SkipTextureLoader {
  load(_url: string, onLoad?: (texture: Texture) => void): Texture {
    const texture = new Texture();
    onLoad?.(texture);
    return texture;
  }
}

function attrArray(
  attr: BufferAttribute | InterleavedBufferAttribute,
  itemSize: number,
): Float32Array {
  const out = new Float32Array(attr.count * itemSize);
  for (let i = 0; i < attr.count; i++) {
    for (let k = 0; k < itemSize; k++) {
      out[i * itemSize + k] = attr.getComponent(i, k);
    }
  }
  return out;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max / 255;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, v];
}

function isWood(h: number, s: number, v: number): boolean {
  // Desaturated brown / tan grain. Painted reds, greens, blacks, gold stay.
  if (v < 0.12) return false; // black pattern
  if (s > 0.55 && (h < 25 || h > 340)) return false; // saturated red
  if (s > 0.35 && h > 70 && h < 170) return false; // greens
  if (s > 0.45 && h >= 35 && h <= 70) return false; // gold
  const brownHue = h >= 15 && h <= 55;
  const tan = s >= 0.12 && s <= 0.62 && v >= 0.28 && v <= 0.92;
  return brownHue && tan;
}

async function main(): Promise<void> {
  const fbx = await readFile(fbxPath);
  const arrayBuffer = fbx.buffer.slice(fbx.byteOffset, fbx.byteOffset + fbx.byteLength);
  const manager = new LoadingManager();
  manager.addHandler(/\.(png|jpe?g|tga|tif|tiff|bmp)$/i, new SkipTextureLoader() as never);
  const loader = new FBXLoader(manager);
  const group = loader.parse(arrayBuffer, dirname(fbxPath) + '/');

  console.log('FBX tree:');
  group.traverse((obj) => {
    const mesh = obj as ThreeMesh;
    const extra = mesh.isMesh && mesh.geometry
      ? ` verts=${mesh.geometry.getAttribute('position')?.count} idx=${mesh.geometry.index?.count}`
      : '';
    console.log(`  ${obj.type} name=${JSON.stringify(obj.name)}${extra}`);
  });

  const geometries: BufferGeometry[] = [];
  group.updateMatrixWorld(true);
  group.traverse((obj) => {
    if (!(obj instanceof ThreeMesh) || !obj.geometry) return;
    const geo = obj.geometry.clone();
    geo.applyMatrix4(obj.matrixWorld);
    geometries.push(geo);
  });
  const merged = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
  if (!merged) throw new Error('merge failed');
  const positions = attrArray(merged.getAttribute('position')!, 3);
  const uvs = attrArray(merged.getAttribute('uv')!, 2);
  const indices = merged.index
    ? Uint32Array.from(merged.index.array as ArrayLike<number>)
    : Uint32Array.from({ length: positions.length / 3 }, (_, i) => i);

  const tex = await sharp(texturePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const tw = tex.info.width;
  const th = tex.info.height;
  const data = tex.data;

  function sample(u: number, v: number): [number, number, number] {
    const x = Math.min(tw - 1, Math.max(0, Math.floor(((u % 1) + 1) % 1 * tw)));
    const y = Math.min(th - 1, Math.max(0, Math.floor((1 - (((v % 1) + 1) % 1)) * th)));
    const o = (y * tw + x) * 4;
    return [data[o], data[o + 1], data[o + 2]];
  }

  const faceCount = indices.length / 3;
  let woodFaces = 0;
  const uvBuckets = new Map<string, { n: number; wood: number }>();
  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 2;
    const ib = indices[i + 1] * 2;
    const ic = indices[i + 2] * 2;
    const u = (uvs[ia] + uvs[ib] + uvs[ic]) / 3;
    const v = (uvs[ia + 1] + uvs[ib + 1] + uvs[ic + 1]) / 3;
    const [r, g, b] = sample(u, v);
    const [h, s, val] = rgbToHsv(r, g, b);
    const wood = isWood(h, s, val);
    if (wood) woodFaces++;
    const key = `${Math.floor(u * 8)},${Math.floor(v * 8)}`;
    const bucket = uvBuckets.get(key) ?? { n: 0, wood: 0 };
    bucket.n++;
    if (wood) bucket.wood++;
    uvBuckets.set(key, bucket);
  }

  console.log(`faces=${faceCount} verts=${positions.length / 3} woodFaces=${woodFaces} (${(woodFaces / faceCount * 100).toFixed(1)}%)`);
  console.log('UV 8x8 buckets (col,row from bottom-left of glTF UV after we would flip V — here raw FBX V):');
  for (const [key, b] of [...uvBuckets.entries()].sort()) {
    console.log(`  ${key}: n=${b.n} wood=${b.wood} (${(b.wood / b.n * 100).toFixed(0)}%)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
