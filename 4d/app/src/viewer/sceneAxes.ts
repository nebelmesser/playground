import {
  ArrowHelper,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { rotate4 } from '../math/rotate4';
import type { TransformContext, Vec4 } from '../math/types';

const AXIS_DEFS: Array<{ v: Vec4; label: string; color: number }> = [
  { v: [1, 0, 0, 0], label: 'X', color: 0xff4d6d },
  { v: [0, 1, 0, 0], label: 'Y', color: 0x3ddc84 },
  { v: [0, 0, 1, 0], label: 'Z', color: 0x4d8dff },
  { v: [0, 0, 0, 1], label: 'W', color: 0xf5c542 },
];

function makeLabel(label: string, color: number): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.font = '700 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.fillText(label, 32, 34);
  const texture = new CanvasTexture(canvas);
  const sprite = new Sprite(new SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  return sprite;
}

function makeRing(color: number): Line {
  const pts = new Float32Array(33 * 3);
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    pts[i * 3] = Math.cos(a);
    pts[i * 3 + 1] = Math.sin(a);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(pts, 3));
  return new Line(geometry, new LineBasicMaterial({
    color,
    transparent: true,
    depthWrite: false,
  }));
}

export class SceneAxes {
  readonly group = new Group();
  private readonly arrows: ArrowHelper[] = [];
  private readonly labels: Sprite[] = [];
  private readonly rings: Line[] = [];
  private readonly dir = new Vector3();

  constructor() {
    this.group.renderOrder = 2;
    for (const def of AXIS_DEFS) {
      const arrow = new ArrowHelper(
        new Vector3(1, 0, 0),
        new Vector3(0, 0, 0),
        1,
        new Color(def.color),
        0.22,
        0.14,
      );
      const ring = makeRing(def.color);
      const label = makeLabel(def.label, def.color);
      ring.visible = false;
      this.group.add(arrow, ring, label);
      this.arrows.push(arrow);
      this.rings.push(ring);
      this.labels.push(label);
    }
  }

  static layout(modelRadius: number): { scale: number; originY: number; reach: number } {
    const scale = Math.max(0.16, modelRadius * 0.26);
    const gap = modelRadius * 0.16;
    const originY = -(modelRadius + scale + gap);
    return { scale, originY, reach: Math.abs(originY) + scale };
  }

  update(ctx: TransformContext, modelRadius: number): void {
    const { scale, originY } = SceneAxes.layout(modelRadius);
    this.group.position.set(0, originY, 0);

    for (let i = 0; i < AXIS_DEFS.length; i++) {
      const r = rotate4(AXIS_DEFS[i].v, ctx.angles, ctx.orbit);
      const planar = Math.hypot(r[0], r[1]);
      this.dir.set(r[0], r[1], r[2]);
      const len = this.dir.length();
      const arrow = this.arrows[i];
      const ring = this.rings[i];
      const label = this.labels[i];
      const labelScale = scale * 0.42;
      label.scale.set(labelScale, labelScale, labelScale);

      if (len > 0.06) {
        arrow.visible = true;
        arrow.setDirection(this.dir.normalize());
        arrow.setLength(scale * Math.min(1, 0.45 + len), scale * 0.22, scale * 0.13);
        label.position.set(r[0], r[1], r[2]).multiplyScalar((scale * 1.2) / Math.max(len, 0.06));
      } else {
        arrow.visible = false;
        label.position.set(0.18 * scale, 0.16 * scale, 0);
      }

      if (planar < 0.55) {
        const radius = (0.14 + (0.55 - planar) * 0.32) * scale;
        ring.visible = true;
        ring.scale.setScalar(radius);
        const material = ring.material as LineBasicMaterial;
        material.opacity = r[2] >= 0 ? 0.95 : 0.4;
      } else {
        ring.visible = false;
      }
    }
  }
}
