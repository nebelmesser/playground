import {
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  BackSide,
  DoubleSide,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  CanvasTexture,
  SRGBColorSpace,
  type Object3D,
  type Texture,
} from 'three';
import { colorForObjectW, colorToHex, lerpColor } from '../math/color';
import { CUBE_EDGES, MATRYOSHKA_MESH_SCALE, MAX_SLICES } from '../math/constants';
import { rotate3Into, transform4, transform4Into } from '../math/transform';
import type { DisplayState, Mesh3D, TransformContext, Vec3 } from '../math/types';
import { attachDepthFade, setDepthFade, type DepthFade } from '../viewer/depthFade';

const FILL_BASE = 0.62;

const scratch: Vec3 = [0, 0, 0];

function makeCircleTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function makeFillMaterial(
  hex: number,
  map: Texture | null,
  opacity: number,
  side: typeof DoubleSide | typeof BackSide = DoubleSide,
): MeshBasicMaterial {
  if (map) {
    map.colorSpace = SRGBColorSpace;
    map.wrapS = ClampToEdgeWrapping;
    map.wrapT = ClampToEdgeWrapping;
    map.flipY = false;
    map.needsUpdate = true;
  }
  return new MeshBasicMaterial({
    color: hex,
    map,
    transparent: true,
    opacity: FILL_BASE,
    depthWrite: false,
    side,
  });
}

function writeCap(
  target: Float32Array,
  mesh: Mesh3D,
  w: number,
  ctx: TransformContext,
): void {
  for (let i = 0; i < mesh.vertexCount; i++) {
    const o = i * 3;
    transform4Into(mesh.positions[o], mesh.positions[o + 1], mesh.positions[o + 2], w, ctx, scratch);
    target[o] = scratch[0];
    target[o + 1] = scratch[1];
    target[o + 2] = scratch[2];
  }
}

export class HyperView {
  private mesh: Mesh3D | null = null;
  private capNeg: Mesh | null = null;
  private capPos: Mesh | null = null;
  private sliceMeshes: Mesh[] = [];
  private cage: LineSegments | null = null;
  private spokes: LineSegments | null = null;
  private sliceLines: LineSegments | null = null;
  private points: Points | null = null;
  private readonly pointMap: CanvasTexture;
  private readonly materials: MeshBasicMaterial[] = [];
  private readonly fades: DepthFade[] = [];

  constructor(private readonly parent: Object3D) {
    this.pointMap = makeCircleTexture();
  }

  current(): Mesh3D | null {
    return this.mesh;
  }

  setMesh(mesh: Mesh3D, display: DisplayState): void {
    this.clear();
    this.mesh = mesh;
    const n = mesh.vertexCount;
    const makeGeo = (): BufferGeometry => {
      const geo = new BufferGeometry();
      geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
      if (mesh.uvs) geo.setAttribute('uv', new BufferAttribute(mesh.uvs.slice(), 2));
      geo.setIndex(new BufferAttribute(mesh.indices.slice(), 1));
      return geo;
    };

    const side = mesh.kind === 'surface' ? BackSide : DoubleSide;
    const capTint = mesh.kind === 'surface' ? 0xffffff : colorToHex(colorForObjectW(-1));
    const capTintPos = mesh.kind === 'surface' ? 0xffffff : colorToHex(colorForObjectW(1));
    const matNeg = makeFillMaterial(capTint, mesh.texture, FILL_BASE, side);
    const matPos = makeFillMaterial(capTintPos, mesh.texture, FILL_BASE, side);
    this.fades.push(attachDepthFade(matNeg), attachDepthFade(matPos));
    this.materials.push(matNeg, matPos);

    this.capNeg = new Mesh(makeGeo(), matNeg);
    this.capPos = new Mesh(makeGeo(), matPos);
    this.capNeg.renderOrder = 1;
    this.capPos.renderOrder = 1;
    this.parent.add(this.capNeg, this.capPos);

    this.sliceMeshes = [];
    if (mesh.kind === 'surface') {
      for (let i = 0; i < MAX_SLICES; i++) {
        const mat = makeFillMaterial(0xffffff, mesh.texture, FILL_BASE, BackSide);
        this.fades.push(attachDepthFade(mat));
        this.materials.push(mat);
        const slice = new Mesh(makeGeo(), mat);
        slice.renderOrder = 1;
        slice.visible = false;
        this.parent.add(slice);
        this.sliceMeshes.push(slice);
      }
    }

    const cageEdgeCount = mesh.displayEdges.length * 2;
    const cagePositions = new Float32Array(cageEdgeCount * 6);
    const cageColors = new Float32Array(cageEdgeCount * 6);
    const cageGeo = new BufferGeometry();
    cageGeo.setAttribute('position', new BufferAttribute(cagePositions, 3));
    cageGeo.setAttribute('color', new BufferAttribute(cageColors, 3));
    this.cage = new LineSegments(
      cageGeo,
      new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }),
    );
    this.cage.renderOrder = 2;
    this.parent.add(this.cage);

    if (mesh.kind === 'polytope') {
      const spokeCount = mesh.wSpokes.length;
      const spokePositions = new Float32Array(spokeCount * 6);
      const spokeColors = new Float32Array(spokeCount * 6);
      const spokeGeo = new BufferGeometry();
      spokeGeo.setAttribute('position', new BufferAttribute(spokePositions, 3));
      spokeGeo.setAttribute('color', new BufferAttribute(spokeColors, 3));
      this.spokes = new LineSegments(
        spokeGeo,
        new LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          depthTest: true,
        }),
      );
      this.spokes.renderOrder = 3;
      this.parent.add(this.spokes);

      const slicePositions = new Float32Array(MAX_SLICES * CUBE_EDGES.length * 6);
      const sliceColors = new Float32Array(MAX_SLICES * CUBE_EDGES.length * 6);
      const sliceGeo = new BufferGeometry();
      sliceGeo.setAttribute('position', new BufferAttribute(slicePositions, 3));
      sliceGeo.setAttribute('color', new BufferAttribute(sliceColors, 3));
      this.sliceLines = new LineSegments(
        sliceGeo,
        new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 }),
      );
      this.sliceLines.visible = false;
      this.parent.add(this.sliceLines);

      const pointPositions = new Float32Array(16 * 3);
      const pointColors = new Float32Array(16 * 3);
      const pointGeo = new BufferGeometry();
      pointGeo.setAttribute('position', new BufferAttribute(pointPositions, 3));
      pointGeo.setAttribute('color', new BufferAttribute(pointColors, 3));
      this.points = new Points(
        pointGeo,
        new PointsMaterial({
          vertexColors: true,
          size: 0.11,
          sizeAttenuation: true,
          map: this.pointMap,
          transparent: true,
          depthWrite: false,
        }),
      );
      this.parent.add(this.points);
    }
  }

  projectedRadius(ctx: TransformContext): number {
    const mesh = this.mesh;
    if (!mesh) return 0.35;
    let maxR = 0.35;
    for (const w of [-1, 1]) {
      for (let i = 0; i < mesh.vertexCount; i++) {
        const o = i * 3;
        transform4Into(mesh.positions[o], mesh.positions[o + 1], mesh.positions[o + 2], w, ctx, scratch);
        maxR = Math.max(maxR, Math.hypot(scratch[0], scratch[1], scratch[2]));
      }
    }
    return maxR;
  }

  extentRadius(ctx: TransformContext): number {
    const mesh = this.mesh;
    if (!mesh) return 0.35;
    let maxR = 0.35;
    for (const w of [-1, 1]) {
      for (let i = 0; i < mesh.vertexCount; i++) {
        const o = i * 3;
        rotate3Into(mesh.positions[o], mesh.positions[o + 1], mesh.positions[o + 2], w, ctx, scratch);
        maxR = Math.max(maxR, Math.hypot(scratch[0], scratch[1], scratch[2]));
      }
    }
    return mesh.id === 'matryoshka' ? maxR / MATRYOSHKA_MESH_SCALE : maxR;
  }

  projectedHalfWidth(ctx: TransformContext): number {
    const mesh = this.mesh;
    if (!mesh) return 0.2;
    let maxX = 0.2;
    for (const w of [-1, 1]) {
      for (let i = 0; i < mesh.vertexCount; i++) {
        const o = i * 3;
        transform4Into(mesh.positions[o], mesh.positions[o + 1], mesh.positions[o + 2], w, ctx, scratch);
        maxX = Math.max(maxX, Math.abs(scratch[0]));
      }
    }
    return maxX;
  }

  update(ctx: TransformContext, display: DisplayState): void {
    const mesh = this.mesh;
    if (!mesh || !this.capNeg || !this.capPos) return;

    for (const mat of this.materials) {
      mat.opacity = FILL_BASE;
    }

    const showCaps = display.fillCaps;
    this.capNeg.visible = showCaps;
    this.capPos.visible = showCaps;
    if (showCaps) {
      const negPos = this.capNeg.geometry.attributes.position.array as Float32Array;
      const posPos = this.capPos.geometry.attributes.position.array as Float32Array;
      writeCap(negPos, mesh, -1, ctx);
      writeCap(posPos, mesh, 1, ctx);
      this.capNeg.geometry.attributes.position.needsUpdate = true;
      this.capPos.geometry.attributes.position.needsUpdate = true;
      this.capNeg.geometry.computeBoundingSphere();
      this.capPos.geometry.computeBoundingSphere();
    }

    if (this.spokes) {
      const spokeMat = this.spokes.material as LineBasicMaterial;
      spokeMat.opacity = showCaps ? 0.7 : 0.9;
    }

    this.updateCage(mesh, ctx, display);
    this.updateSpokes(mesh, ctx);
    this.updateSliceMeshes(mesh, ctx, display);
    this.updateSliceLines(mesh, ctx, display);
    this.updatePoints(mesh, ctx);
  }

  setDepthFade(cameraZ: number, radius: number, strength: number): void {
    setDepthFade(
      this.fades,
      strength,
      Math.max(0.15, cameraZ - radius * 1.05),
      cameraZ + radius * 1.05,
    );
  }

  private updateCage(mesh: Mesh3D, ctx: TransformContext, display: DisplayState): void {
    if (!this.cage) return;
    const show = mesh.kind === 'polytope' || display.showCage;
    this.cage.visible = show;
    if (!show) return;

    const positions = this.cage.geometry.attributes.position.array as Float32Array;
    const colors = this.cage.geometry.attributes.color.array as Float32Array;
    const aOut: Vec3 = [0, 0, 0];
    const bOut: Vec3 = [0, 0, 0];
    let drawn = 0;
    for (const w of [-1, 1] as const) {
      const c = colorForObjectW(w);
      for (const [i, j] of mesh.displayEdges) {
        const ia = i * 3;
        const ib = j * 3;
        transform4Into(mesh.positions[ia], mesh.positions[ia + 1], mesh.positions[ia + 2], w, ctx, aOut);
        transform4Into(mesh.positions[ib], mesh.positions[ib + 1], mesh.positions[ib + 2], w, ctx, bOut);
        const o = drawn * 6;
        positions[o] = aOut[0];
        positions[o + 1] = aOut[1];
        positions[o + 2] = aOut[2];
        positions[o + 3] = bOut[0];
        positions[o + 4] = bOut[1];
        positions[o + 5] = bOut[2];
        colors[o] = colors[o + 3] = c[0];
        colors[o + 1] = colors[o + 4] = c[1];
        colors[o + 2] = colors[o + 5] = c[2];
        drawn++;
      }
    }
    this.cage.geometry.setDrawRange(0, drawn * 2);
    this.cage.geometry.attributes.position.needsUpdate = true;
    this.cage.geometry.attributes.color.needsUpdate = true;
    this.cage.geometry.computeBoundingSphere();
  }

  private updateSpokes(mesh: Mesh3D, ctx: TransformContext): void {
    if (!this.spokes || mesh.kind !== 'polytope') {
      if (this.spokes) this.spokes.visible = false;
      return;
    }
    this.spokes.visible = true;
    const positions = this.spokes.geometry.attributes.position.array as Float32Array;
    const colors = this.spokes.geometry.attributes.color.array as Float32Array;
    const aOut: Vec3 = [0, 0, 0];
    const bOut: Vec3 = [0, 0, 0];
    const ca = colorForObjectW(-1);
    const cb = colorForObjectW(1);
    for (let e = 0; e < mesh.wSpokes.length; e++) {
      const i = mesh.wSpokes[e];
      const o3 = i * 3;
      transform4Into(mesh.positions[o3], mesh.positions[o3 + 1], mesh.positions[o3 + 2], -1, ctx, aOut);
      transform4Into(mesh.positions[o3], mesh.positions[o3 + 1], mesh.positions[o3 + 2], 1, ctx, bOut);
      const o = e * 6;
      positions[o] = aOut[0];
      positions[o + 1] = aOut[1];
      positions[o + 2] = aOut[2];
      positions[o + 3] = bOut[0];
      positions[o + 4] = bOut[1];
      positions[o + 5] = bOut[2];
      colors[o] = ca[0];
      colors[o + 1] = ca[1];
      colors[o + 2] = ca[2];
      colors[o + 3] = cb[0];
      colors[o + 4] = cb[1];
      colors[o + 5] = cb[2];
    }
    this.spokes.geometry.attributes.position.needsUpdate = true;
    this.spokes.geometry.attributes.color.needsUpdate = true;
    this.spokes.geometry.computeBoundingSphere();
  }

  private updateSliceMeshes(mesh: Mesh3D, ctx: TransformContext, display: DisplayState): void {
    for (const slice of this.sliceMeshes) slice.visible = false;
    if (mesh.kind !== 'surface' || display.sliceCount <= 0) return;

    for (let s = 1; s <= display.sliceCount; s++) {
      const w = -1 + 2 * (s / (display.sliceCount + 1));
      const slice = this.sliceMeshes[s - 1];
      if (!slice) break;
      const pos = slice.geometry.attributes.position.array as Float32Array;
      writeCap(pos, mesh, w, ctx);
      slice.geometry.attributes.position.needsUpdate = true;
      slice.geometry.computeBoundingSphere();
      slice.visible = true;
    }
  }

  private updateSliceLines(mesh: Mesh3D, ctx: TransformContext, display: DisplayState): void {
    if (!this.sliceLines || mesh.kind !== 'polytope') return;
    this.sliceLines.visible = display.sliceCount > 0;
    if (display.sliceCount <= 0) return;

    const positions = this.sliceLines.geometry.attributes.position.array as Float32Array;
    const colors = this.sliceLines.geometry.attributes.color.array as Float32Array;
    let drawn = 0;
    for (let s = 1; s <= display.sliceCount; s++) {
      const w = -1 + 2 * (s / (display.sliceCount + 1));
      const color = lerpColor((w + 1) / 2);
      const corners: Vec3[] = [];
      for (let i = 0; i < 8; i++) {
        const o = i * 3;
        corners.push(
          transform4(
            [mesh.positions[o], mesh.positions[o + 1], mesh.positions[o + 2], w],
            ctx,
          ),
        );
      }
      for (const [a, b] of CUBE_EDGES) {
        const pa = corners[a];
        const pb = corners[b];
        const o = drawn * 6;
        positions[o] = pa[0];
        positions[o + 1] = pa[1];
        positions[o + 2] = pa[2];
        positions[o + 3] = pb[0];
        positions[o + 4] = pb[1];
        positions[o + 5] = pb[2];
        colors[o] = colors[o + 3] = color[0];
        colors[o + 1] = colors[o + 4] = color[1];
        colors[o + 2] = colors[o + 5] = color[2];
        drawn++;
      }
    }
    this.sliceLines.geometry.setDrawRange(0, drawn * 2);
    this.sliceLines.geometry.attributes.position.needsUpdate = true;
    this.sliceLines.geometry.attributes.color.needsUpdate = true;
    this.sliceLines.geometry.computeBoundingSphere();
  }

  private updatePoints(mesh: Mesh3D, ctx: TransformContext): void {
    if (!this.points || mesh.kind !== 'polytope') return;
    const positions = this.points.geometry.attributes.position.array as Float32Array;
    const colors = this.points.geometry.attributes.color.array as Float32Array;
    let k = 0;
    for (const w of [-1, 1] as const) {
      const c = colorForObjectW(w);
      for (let i = 0; i < 8; i++) {
        const o = i * 3;
        transform4Into(mesh.positions[o], mesh.positions[o + 1], mesh.positions[o + 2], w, ctx, scratch);
        const p = k * 3;
        positions[p] = scratch[0];
        positions[p + 1] = scratch[1];
        positions[p + 2] = scratch[2];
        colors[p] = c[0];
        colors[p + 1] = c[1];
        colors[p + 2] = c[2];
        k++;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
    this.points.geometry.computeBoundingSphere();
  }

  private clear(): void {
    const objects = [
      this.capNeg,
      this.capPos,
      this.cage,
      this.spokes,
      this.sliceLines,
      this.points,
      ...this.sliceMeshes,
    ];
    for (const obj of objects) {
      if (!obj) continue;
      this.parent.remove(obj);
      obj.geometry.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) {
        for (const m of mat) m.dispose();
      } else {
        mat.dispose();
      }
    }
    this.capNeg = null;
    this.capPos = null;
    this.cage = null;
    this.spokes = null;
    this.sliceLines = null;
    this.points = null;
    this.sliceMeshes = [];
    this.materials.length = 0;
    this.fades.length = 0;
    this.mesh = null;
  }
}
