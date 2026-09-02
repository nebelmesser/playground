import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO } from '@gltf-transform/core';
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

const execFileAsync = promisify(execFile);

if (!('self' in globalThis)) {
  (globalThis as Record<string, unknown>).self = globalThis;
}

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fourD = resolve(appRoot, '..');
const fbxPath = join(fourD, 'matryoshka-doll/source/matroska.fbx');
const texturePath = join(fourD, 'matryoshka-doll/textures/Matroska_BaseColor.png');
const outPath = join(appRoot, 'public/models/matryoshka.glb');

class SkipTextureLoader {
  load(_url: string, onLoad?: (texture: Texture) => void): Texture {
    const texture = new Texture();
    onLoad?.(texture);
    return texture;
  }
}

function collectGeometries(rootObj: Group): BufferGeometry[] {
  const geometries: BufferGeometry[] = [];
  rootObj.updateMatrixWorld(true);
  rootObj.traverse((obj) => {
    if (!(obj instanceof ThreeMesh) || !obj.geometry) return;
    const geo = obj.geometry.clone();
    geo.applyMatrix4(obj.matrixWorld);
    geometries.push(geo);
  });
  return geometries;
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

/** FBX stores V with origin at the top; glTF expects origin at the bottom. */
function flipUvV(uvs: Float32Array): void {
  for (let i = 1; i < uvs.length; i += 2) {
    uvs[i] = 1 - uvs[i];
  }
}

async function encodeBaseColor(inputPath: string): Promise<{ bytes: Uint8Array; mime: string }> {
  try {
    const sharp = (await import('sharp')).default;
    const bytes = await sharp(inputPath)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    return { bytes: new Uint8Array(bytes), mime: 'image/webp' };
  } catch (err) {
    console.warn('sharp unavailable, falling back to sips PNG:', err);
    const tmp = join(appRoot, 'public/models/_basecolor-1024.png');
    await mkdir(dirname(tmp), { recursive: true });
    await execFileAsync('sips', ['-Z', '1024', inputPath, '--out', tmp]);
    const png = await readFile(tmp);
    return { bytes: new Uint8Array(png), mime: 'image/png' };
  }
}

async function main(): Promise<void> {
  const fbx = await readFile(fbxPath);
  const arrayBuffer = fbx.buffer.slice(fbx.byteOffset, fbx.byteOffset + fbx.byteLength);

  const manager = new LoadingManager();
  manager.addHandler(/\.(png|jpe?g|tga|tif|tiff|bmp)$/i, new SkipTextureLoader() as never);
  const loader = new FBXLoader(manager);
  const group = loader.parse(arrayBuffer, dirname(fbxPath) + '/');
  const geometries = collectGeometries(group);
  if (geometries.length === 0) throw new Error('FBX has no meshes');

  const merged = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
  if (!merged) throw new Error('Failed to merge FBX meshes');
  const position = merged.getAttribute('position');
  const uv = merged.getAttribute('uv');
  if (!position) throw new Error('Mesh has no positions');

  const positions = attrArray(position, 3);
  const uvs = uv ? attrArray(uv, 2) : null;
  if (uvs) flipUvV(uvs);
  const indices = merged.index
    ? Uint32Array.from(merged.index.array as ArrayLike<number>)
    : Uint32Array.from({ length: positions.length / 3 }, (_, i) => i);

  const baseColor = await encodeBaseColor(texturePath);

  const doc = new Document();
  const buffer = doc.createBuffer();
  const positionAcc = doc.createAccessor('position')
    .setType('VEC3')
    .setArray(positions)
    .setBuffer(buffer);
  const indexAcc = doc.createAccessor('indices')
    .setType('SCALAR')
    .setArray(indices)
    .setBuffer(buffer);

  const prim = doc.createPrimitive()
    .setMode(4)
    .setAttribute('POSITION', positionAcc)
    .setIndices(indexAcc);

  if (uvs) {
    prim.setAttribute(
      'TEXCOORD_0',
      doc.createAccessor('texcoord_0').setType('VEC2').setArray(uvs).setBuffer(buffer),
    );
  }

  const texture = doc.createTexture('baseColor')
    .setImage(baseColor.bytes)
    .setMimeType(baseColor.mime);
  const material = doc.createMaterial('matryoshka')
    .setBaseColorTexture(texture)
    .setDoubleSided(true);
  material.getBaseColorTextureInfo()
    ?.setWrapS(33071)
    .setWrapT(33071);
  prim.setMaterial(material);

  const mesh = doc.createMesh('matryoshka').addPrimitive(prim);
  const node = doc.createNode('matryoshka').setMesh(mesh);
  doc.createScene('matryoshka').addChild(node);

  await mkdir(dirname(outPath), { recursive: true });
  const io = new NodeIO();
  const glb = await io.writeBinary(doc);
  await writeFile(outPath, glb);
  const published = join(fourD, 'models/matryoshka.glb');
  await mkdir(dirname(published), { recursive: true });
  await writeFile(published, glb);
  console.log(`Wrote ${outPath} and ${published} (${glb.byteLength} bytes, ${positions.length / 3} verts)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
