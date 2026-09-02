import { rotate4 } from './rotate4';
import type { TransformContext, Vec3, Vec4 } from './types';

export function transform4(vertex: Vec4, ctx: TransformContext): Vec3 {
  const [x, y, z, w] = rotate4(vertex, ctx.angles, ctx.orbit);
  const wFactor = 1 / Math.max(0.2, ctx.projectionDistance - w);
  return [x * wFactor, y * wFactor, z * wFactor];
}

export function transform4Into(
  x0: number,
  y0: number,
  z0: number,
  w0: number,
  ctx: TransformContext,
  out: Vec3,
): Vec3 {
  const [x, y, z, w] = rotate4([x0, y0, z0, w0], ctx.angles, ctx.orbit);
  const wFactor = 1 / Math.max(0.2, ctx.projectionDistance - w);
  out[0] = x * wFactor;
  out[1] = y * wFactor;
  out[2] = z * wFactor;
  return out;
}
