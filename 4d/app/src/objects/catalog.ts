import type { Mesh3D, ObjectId } from '../math/types';
import { loadMatryoshkaMesh } from './matryoshka';
import { createTesseractMesh } from './tesseract';

export const CATALOG: Array<{ id: ObjectId; label: string }> = [
  { id: 'matryoshka', label: 'Matryoshka' },
  { id: 'tesseract', label: 'Tesseract' },
];

const cache = new Map<ObjectId, Mesh3D>();

export async function loadObject(id: ObjectId): Promise<Mesh3D> {
  const hit = cache.get(id);
  if (hit) return hit;
  const mesh = id === 'matryoshka'
    ? await loadMatryoshkaMesh()
    : createTesseractMesh();
  cache.set(id, mesh);
  return mesh;
}
