import {
  BufferGeometry,
  ClampToEdgeWrapping,
  SRGBColorSpace,
  Texture,
  type BufferAttribute,
  type InterleavedBufferAttribute,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MATRYOSHKA_MESH_SCALE } from '../math/constants';
import type { Mesh3D } from '../math/types';
import { finishMesh, normalizePositions, dropInwardTriangles } from './mesh3d';

function textureFromMaterial(material: unknown): Texture | null {
  if (!material || Array.isArray(material)) return null;
  const map = (material as { map?: Texture | null }).map;
  if (!map) return null;
  map.colorSpace = SRGBColorSpace;
  map.wrapS = ClampToEdgeWrapping;
  map.wrapT = ClampToEdgeWrapping;
  map.flipY = false;
  return map;
}

function attrArray(attr: BufferAttribute | InterleavedBufferAttribute, itemSize: number): Float32Array {
  const out = new Float32Array(attr.count * itemSize);
  for (let i = 0; i < attr.count; i++) {
    for (let k = 0; k < itemSize; k++) {
      out[i * itemSize + k] = attr.getComponent(i, k);
    }
  }
  return out;
}

export async function loadMatryoshkaMesh(): Promise<Mesh3D> {
  const url = `${import.meta.env.BASE_URL}models/matryoshka.glb`;
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const geometries: BufferGeometry[] = [];
  let texture: Texture | null = null;

  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((obj) => {
    const mesh = obj as {
      isMesh?: boolean;
      geometry?: BufferGeometry;
      material?: unknown;
      matrixWorld: import('three').Matrix4;
    };
    if (!mesh.isMesh || !mesh.geometry) return;
    const geo = mesh.geometry.clone();
    geo.applyMatrix4(mesh.matrixWorld);
    geometries.push(geo);
    if (!texture) texture = textureFromMaterial(mesh.material);
  });

  if (geometries.length === 0) {
    throw new Error('Matryoshka GLB has no meshes');
  }

  const merged = geometries.length === 1
    ? geometries[0]
    : mergeGeometries(geometries, true);
  if (!merged) throw new Error('Could not merge matryoshka geometries');

  const positionAttr = merged.getAttribute('position');
  if (!positionAttr) throw new Error('Matryoshka mesh has no positions');

  const positions = attrArray(positionAttr, 3);
  normalizePositions(positions);
  for (let i = 0; i < positions.length; i++) {
    positions[i] *= MATRYOSHKA_MESH_SCALE;
  }

  const rawIndex = merged.index
    ? Uint32Array.from(merged.index.array as ArrayLike<number>)
    : Uint32Array.from({ length: positions.length / 3 }, (_, i) => i);
  const index = dropInwardTriangles(positions, rawIndex);

  const uvAttr = merged.getAttribute('uv');
  const uvs = uvAttr ? attrArray(uvAttr, 2) : null;

  return finishMesh({
    id: 'matryoshka',
    kind: 'surface',
    label: 'Matryoshka',
    positions,
    indices: index,
    uvs,
    texture,
  });
}
