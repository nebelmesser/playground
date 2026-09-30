import type { Point } from './math';

export type Raster = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

const MAX_SIDE = 420;

/**
 * Guess the dominant picture frame. Points are normalized, clockwise from the top-left.
 * Returns null when the photograph has no quadrilateral strong enough to trust.
 */
export function detectFrame(source: HTMLCanvasElement): Point[] | null {
  const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
  const width = Math.max(48, Math.round(source.width * scale));
  const height = Math.max(48, Math.round(source.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
  if (!context) return null;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, width, height);
  const image = context.getImageData(0, 0, width, height);
  return detectFrameRaster({ width, height, data: image.data });
}

type Line = { a: number; b: number; c: number };

type Candidate = {
  quad: Point[];
  score: number;
  area: number;
};

export function detectFrameRaster(image: Raster): Point[] | null {
  const { width, height } = image;
  if (width < 16 || height < 16) return null;
  const gray = grayscale(image);
  const radius = Math.max(1, Math.round(Math.min(width, height) * 0.012));
  const blurred = boxBlur(boxBlur(gray, width, height, radius), width, height, radius);
  const field = gradients(blurred, width, height);
  const high = strongMagnitude(field.mag);
  if (high < 8) return null;

  const edges = cannyMask(field.mag, width, height, high, high * 0.4);
  const candidates = [
    ...contourQuads(edges, width, height),
    ...rectangleQuads(field, width, height),
  ];
  const ranked = rankCandidates(candidates, field, width, height, high);
  if (!ranked.length) return null;

  let best = preferOpening(ranked);
  const opening = nestedOpening(best.quad, field, width, height);
  if (opening) {
    const refined = refineQuad(opening, field, width, height) ?? opening;
    const score = boundaryScore(refined, field.mag, width, height);
    if (score >= best.score * 0.62 && usableQuad(refined, width, height)) {
      best = { quad: refined, score, area: Math.abs(polygonArea(refined)) };
    }
  }

  return best.quad.map((point) => ({
    x: clamp(point.x / width, 0, 1),
    y: clamp(point.y / height, 0, 1),
  }));
}

function grayscale(image: Raster): Float32Array {
  const gray = new Float32Array(image.width * image.height);
  const { data } = image;
  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    gray[pixel] = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
  }
  return gray;
}

function boxBlur(source: Float32Array, width: number, height: number, radius: number): Float32Array {
  const horizontal = new Float32Array(source.length);
  const output = new Float32Array(source.length);
  const windowSize = radius * 2 + 1;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    let sum = 0;
    for (let offset = -radius; offset <= radius; offset += 1) {
      sum += source[row + clampIndex(offset, width)];
    }
    for (let x = 0; x < width; x += 1) {
      horizontal[row + x] = sum / windowSize;
      sum -= source[row + clampIndex(x - radius, width)];
      sum += source[row + clampIndex(x + radius + 1, width)];
    }
  }
  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let offset = -radius; offset <= radius; offset += 1) {
      sum += horizontal[clampIndex(offset, height) * width + x];
    }
    for (let y = 0; y < height; y += 1) {
      output[y * width + x] = sum / windowSize;
      sum -= horizontal[clampIndex(y - radius, height) * width + x];
      sum += horizontal[clampIndex(y + radius + 1, height) * width + x];
    }
  }
  return output;
}

function gradients(gray: Float32Array, width: number, height: number): {
  mag: Float32Array;
  gx: Float32Array;
  gy: Float32Array;
} {
  const mag = new Float32Array(gray.length);
  const gx = new Float32Array(gray.length);
  const gy = new Float32Array(gray.length);
  const border = 2;
  for (let y = border; y < height - border; y += 1) {
    for (let x = border; x < width - border; x += 1) {
      const index = y * width + x;
      const horizontal = (
        -gray[index - width - 1] + gray[index - width + 1]
        - 2 * gray[index - 1] + 2 * gray[index + 1]
        - gray[index + width - 1] + gray[index + width + 1]
      );
      const vertical = (
        -gray[index - width - 1] - 2 * gray[index - width] - gray[index - width + 1]
        + gray[index + width - 1] + 2 * gray[index + width] + gray[index + width + 1]
      );
      gx[index] = horizontal;
      gy[index] = vertical;
      mag[index] = Math.hypot(horizontal, vertical);
    }
  }
  suppressNonMaxima(mag, gx, gy, width, height);
  return { mag, gx, gy };
}

function suppressNonMaxima(
  mag: Float32Array,
  gx: Float32Array,
  gy: Float32Array,
  width: number,
  height: number,
): void {
  const kept = new Float32Array(mag.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const magnitude = mag[index];
      if (magnitude <= 0) continue;
      const horizontal = Math.abs(gx[index]) >= Math.abs(gy[index]);
      const before = horizontal ? mag[index - 1] : mag[index - width];
      const after = horizontal ? mag[index + 1] : mag[index + width];
      if (magnitude >= before && magnitude >= after) kept[index] = magnitude;
    }
  }
  mag.set(kept);
}

function cannyMask(
  mag: Float32Array,
  width: number,
  height: number,
  high: number,
  low: number,
): Uint8Array {
  const strong = new Uint8Array(mag.length);
  const queue = new Int32Array(mag.length);
  let head = 0;
  let tail = 0;
  for (let index = 0; index < mag.length; index += 1) {
    if (mag[index] >= high) {
      strong[index] = 1;
      queue[tail] = index;
      tail += 1;
    }
  }
  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = (index - x) / width;
    for (let oy = -1; oy <= 1; oy += 1) {
      for (let ox = -1; ox <= 1; ox += 1) {
        if (ox === 0 && oy === 0) continue;
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (strong[next] || mag[next] < low) continue;
        strong[next] = 1;
        queue[tail] = next;
        tail += 1;
      }
    }
  }

  const dilated = new Uint8Array(strong.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      if (!strong[y * width + x]) continue;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) dilated[(y + oy) * width + (x + ox)] = 1;
      }
    }
  }
  let filled = 0;
  for (let index = 0; index < dilated.length; index += 1) filled += dilated[index];
  return filled > width * height * 0.28 ? strong : dilated;
}

const NEIGHBORS: readonly (readonly [number, number])[] = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

function contourQuads(mask: Uint8Array, width: number, height: number): Point[][] {
  const seen = new Uint8Array(mask.length);
  const quads: Point[][] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const start = y * width + x;
      if (!mask[start] || seen[start] || mask[start - 1]) continue;
      const contour = traceContour(mask, seen, width, height, x, y);
      if (contour.length < 24) continue;
      const quad = quadFromContour(contour);
      if (quad && usableQuad(quad, width, height)) quads.push(quad);
      if (quads.length >= 16) return quads;
    }
  }
  return quads;
}

function traceContour(
  mask: Uint8Array,
  seen: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
): Point[] {
  const points: Point[] = [];
  let x = startX;
  let y = startY;
  let direction = 6;
  const limit = Math.min(mask.length, 12000);
  for (let step = 0; step < limit; step += 1) {
    points.push({ x, y });
    seen[y * width + x] = 1;
    let found = false;
    for (let turn = 0; turn < 8; turn += 1) {
      const nextDirection = (direction + turn) % 8;
      const nx = x + NEIGHBORS[nextDirection][0];
      const ny = y + NEIGHBORS[nextDirection][1];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!mask[ny * width + nx]) continue;
      direction = (nextDirection + 6) % 8;
      x = nx;
      y = ny;
      found = true;
      break;
    }
    if (!found || (x === startX && y === startY)) break;
  }
  return points;
}

function quadFromContour(contour: readonly Point[]): Point[] | null {
  const hull = convexHull(contour);
  if (hull.length < 4) return null;
  const length = perimeter(hull);
  let epsilon = length * 0.01;
  let approx = hull;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    approx = simplifyClosed(hull, epsilon);
    if (approx.length <= 4) break;
    epsilon *= 1.65;
  }
  const quad = approx.length === 4 ? approx : extremeQuad(hull);
  return quad ? orderQuad(quad) : null;
}

function rectangleQuads(
  field: { mag: Float32Array; gx: Float32Array; gy: Float32Array },
  width: number,
  height: number,
): Point[][] {
  const vertical = new Float32Array(width);
  const horizontal = new Float32Array(height);
  for (let y = 2; y < height - 2; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const index = y * width + x;
      vertical[x] += Math.abs(field.gx[index]);
      horizontal[y] += Math.abs(field.gy[index]);
    }
  }
  const gap = Math.max(4, Math.round(Math.min(width, height) * 0.03));
  const columns = peaks(vertical, gap, 8);
  const rows = peaks(horizontal, gap, 8);
  const quads: Point[][] = [];
  const minimumWidth = width * 0.12;
  const minimumHeight = height * 0.12;
  for (let leftIndex = 0; leftIndex < columns.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < columns.length; rightIndex += 1) {
      const left = columns[leftIndex];
      const right = columns[rightIndex];
      if (right - left < minimumWidth) continue;
      for (let topIndex = 0; topIndex < rows.length; topIndex += 1) {
        for (let bottomIndex = topIndex + 1; bottomIndex < rows.length; bottomIndex += 1) {
          const top = rows[topIndex];
          const bottom = rows[bottomIndex];
          if (bottom - top < minimumHeight) continue;
          quads.push(orderQuad([
            { x: left, y: top },
            { x: right, y: top },
            { x: right, y: bottom },
            { x: left, y: bottom },
          ]));
        }
      }
    }
  }
  quads.sort((a, b) => (
    quickBoundary(b, field.mag, width, height) - quickBoundary(a, field.mag, width, height)
  ));
  return quads.slice(0, 24);
}

function quickBoundary(quad: readonly Point[], mag: Float32Array, width: number, height: number): number {
  let total = 0;
  let count = 0;
  for (let index = 0; index < 4; index += 1) {
    const start = quad[index];
    const end = quad[(index + 1) % 4];
    for (let step = 1; step < 8; step += 1) {
      const t = step / 8;
      const x = Math.round(start.x + (end.x - start.x) * t);
      const y = Math.round(start.y + (end.y - start.y) * t);
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      total += mag[y * width + x];
      count += 1;
    }
  }
  return count ? total / count : 0;
}

function peaks(profile: Float32Array, minimumGap: number, limit: number): number[] {
  let peak = 0;
  for (let index = 0; index < profile.length; index += 1) peak = Math.max(peak, profile[index]);
  if (peak <= 0) return [];
  const cutoff = peak * 0.28;
  const ranked: number[] = [];
  for (let index = 1; index < profile.length - 1; index += 1) {
    if (profile[index] < cutoff) continue;
    if (profile[index] < profile[index - 1] || profile[index] < profile[index + 1]) continue;
    ranked.push(index);
  }
  ranked.sort((a, b) => profile[b] - profile[a]);
  const kept: number[] = [];
  for (const index of ranked) {
    if (kept.every((other) => Math.abs(other - index) >= minimumGap)) kept.push(index);
    if (kept.length >= limit) break;
  }
  return kept.sort((a, b) => a - b);
}

function rankCandidates(
  quads: readonly Point[][],
  field: { mag: Float32Array; gx: Float32Array; gy: Float32Array },
  width: number,
  height: number,
  high: number,
): Candidate[] {
  const ranked: Candidate[] = [];
  const seen: Point[][] = [];
  for (const quad of quads) {
    if (!usableQuad(quad, width, height) || touchesBorder(quad, width, height)) continue;
    if (seen.some((other) => sameQuad(other, quad))) continue;
    const refined = refineQuad(quad, field, width, height) ?? quad;
    const chosen = usableQuad(refined, width, height) && !touchesBorder(refined, width, height)
      ? refined
      : quad;
    const score = boundaryScore(chosen, field.mag, width, height);
    if (score < Math.max(16, high * 0.55)) continue;
    seen.push(chosen);
    ranked.push({ quad: chosen, score, area: Math.abs(polygonArea(chosen)) });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, 12);
}

function preferOpening(candidates: readonly Candidate[]): Candidate {
  let best = candidates[0];
  for (let pass = 0; pass < 3; pass += 1) {
    const inner = candidates.find((candidate) => candidate !== best
      && candidate.area < best.area * 0.9
      && candidate.area > best.area * 0.28
      && candidate.score >= best.score * 0.72
      && containsQuad(best.quad, candidate.quad));
    if (!inner) break;
    best = inner;
  }
  return best;
}

function nestedOpening(
  quad: readonly Point[],
  field: { mag: Float32Array; gx: Float32Array; gy: Float32Array },
  width: number,
  height: number,
): Point[] | null {
  const center = centroid(quad);
  const shortest = Math.min(
    Math.hypot(quad[1].x - quad[0].x, quad[1].y - quad[0].y),
    Math.hypot(quad[2].x - quad[1].x, quad[2].y - quad[1].y),
  );
  const minimumInset = Math.max(3, shortest * 0.035);
  const maximumInset = shortest * 0.3;
  if (maximumInset <= minimumInset + 2) return null;

  const lines: Line[] = [];
  const insets: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const start = quad[index];
    const end = quad[(index + 1) % 4];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 4) return null;
    let nx = -dy / length;
    let ny = dx / length;
    const midpoint = { x: (start.x + end.x) * 0.5, y: (start.y + end.y) * 0.5 };
    if ((center.x - midpoint.x) * nx + (center.y - midpoint.y) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const outer = lineStrength(start, end, 0, nx, ny, field.mag, width, height);
    let bestInset = 0;
    let best = 0;
    for (let inset = minimumInset; inset <= maximumInset; inset += 1) {
      const strength = lineStrength(start, end, inset, nx, ny, field.mag, width, height);
      if (strength > best) {
        best = strength;
        bestInset = inset;
      }
    }
    if (bestInset <= 0 || best < outer * 0.58) return null;
    insets.push(bestInset);
    const anchor = { x: start.x + nx * bestInset, y: start.y + ny * bestInset };
    lines.push({ a: nx, b: ny, c: -(nx * anchor.x + ny * anchor.y) });
  }

  const average = insets.reduce((sum, value) => sum + value, 0) / insets.length;
  if (insets.some((value) => Math.abs(value - average) > average * 0.6 + 2)) return null;
  const corners: Point[] = [];
  for (let index = 0; index < 4; index += 1) {
    const corner = intersectLines(lines[(index + 3) % 4], lines[index]);
    if (!corner) return null;
    corners.push(corner);
  }
  const ordered = orderQuad(corners);
  return usableQuad(ordered, width, height) ? ordered : null;
}

function lineStrength(
  start: Point,
  end: Point,
  inset: number,
  nx: number,
  ny: number,
  mag: Float32Array,
  width: number,
  height: number,
): number {
  let total = 0;
  let count = 0;
  for (let step = 1; step < 16; step += 1) {
    const t = step / 16;
    const x = Math.round(start.x + (end.x - start.x) * t + nx * inset);
    const y = Math.round(start.y + (end.y - start.y) * t + ny * inset);
    if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) continue;
    total += mag[y * width + x];
    count += 1;
  }
  return count ? total / count : 0;
}

function refineQuad(
  quad: readonly Point[],
  field: { mag: Float32Array; gx: Float32Array; gy: Float32Array },
  width: number,
  height: number,
): Point[] | null {
  const band = Math.max(3, Math.round(Math.min(width, height) * 0.028));
  const lines: Line[] = [];
  for (let index = 0; index < 4; index += 1) {
    const start = quad[index];
    const end = quad[(index + 1) % 4];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 4) return null;
    const nx = -dy / length;
    const ny = dx / length;
    const samples: Point[] = [];
    for (let step = 2; step <= 14; step += 1) {
      const t = step / 16;
      const px = start.x + dx * t;
      const py = start.y + dy * t;
      let best = 0;
      let chosen: Point | null = null;
      for (let offset = -band; offset <= band; offset += 1) {
        const x = Math.round(px + nx * offset);
        const y = Math.round(py + ny * offset);
        if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) continue;
        const magnitude = field.mag[y * width + x];
        if (magnitude > best) {
          best = magnitude;
          chosen = { x, y };
        }
      }
      if (chosen && best > 0) samples.push(chosen);
    }
    const line = fitLine(samples);
    if (!line) return null;
    lines.push(line);
  }

  const corners: Point[] = [];
  for (let index = 0; index < 4; index += 1) {
    const corner = intersectLines(lines[(index + 3) % 4], lines[index]);
    if (!corner) return null;
    const original = quad[index];
    if (Math.hypot(corner.x - original.x, corner.y - original.y) > band * 3.2) return null;
    corners.push(corner);
  }
  const ordered = orderQuad(corners);
  if (!usableQuad(ordered, width, height)) return null;
  const before = Math.abs(polygonArea(quad));
  const after = Math.abs(polygonArea(ordered));
  if (after < before * 0.72 || after > before * 1.28) return null;
  return ordered;
}

function boundaryScore(quad: readonly Point[], mag: Float32Array, width: number, height: number): number {
  const sides: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const start = quad[index];
    const end = quad[(index + 1) % 4];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 4) return 0;
    const nx = -dy / length;
    const ny = dx / length;
    let total = 0;
    const samples = 22;
    for (let step = 1; step < samples; step += 1) {
      const t = step / samples;
      const px = start.x + dx * t;
      const py = start.y + dy * t;
      let best = 0;
      for (let offset = -3; offset <= 3; offset += 1) {
        const x = Math.round(px + nx * offset);
        const y = Math.round(py + ny * offset);
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        best = Math.max(best, mag[y * width + x]);
      }
      total += best;
    }
    sides.push(total / (samples - 1));
  }
  const mean = sides.reduce((sum, value) => sum + value, 0) / sides.length;
  const weakest = Math.min(...sides);
  if (weakest < mean * 0.45) return 0;
  return mean * (1 - 0.28 * cornerSkew(quad).mean);
}

/** |cos| of a corner, and the longer/shorter ratio of each opposite-side pair. */
function cornerSkew(quad: readonly Point[]): { worst: number; mean: number; oppositeRatio: number } {
  let worst = 0;
  let total = 0;
  const lengths: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const previous = quad[(index + 3) % 4];
    const point = quad[index];
    const next = quad[(index + 1) % 4];
    const ax = point.x - previous.x;
    const ay = point.y - previous.y;
    const bx = next.x - point.x;
    const by = next.y - point.y;
    const al = Math.hypot(ax, ay);
    const bl = Math.hypot(bx, by);
    lengths.push(al);
    if (al < 1e-3 || bl < 1e-3) return { worst: 1, mean: 1, oppositeRatio: Infinity };
    const dot = Math.abs((ax * bx + ay * by) / (al * bl));
    worst = Math.max(worst, dot);
    total += dot;
  }
  const widthRatio = Math.max(lengths[1], lengths[3]) / Math.min(lengths[1], lengths[3]);
  const heightRatio = Math.max(lengths[0], lengths[2]) / Math.min(lengths[0], lengths[2]);
  return { worst, mean: total / 4, oppositeRatio: Math.max(widthRatio, heightRatio) };
}

function rectangularEnough(quad: readonly Point[]): boolean {
  const skew = cornerSkew(quad);
  // 0.5 is 30° off a right angle. A stronger taper than 2:1 is no longer a frame.
  return skew.worst <= 0.5 && skew.oppositeRatio <= 2;
}

function usableQuad(quad: readonly Point[], width: number, height: number): boolean {
  if (!clockwiseConvex(quad)) return false;
  const area = Math.abs(polygonArea(quad));
  const frame = width * height;
  if (area < frame * 0.045 || area > frame * 0.86) return false;
  if (!rectangularEnough(quad)) return false;
  const bounds = {
    minX: Math.min(...quad.map((point) => point.x)),
    maxX: Math.max(...quad.map((point) => point.x)),
    minY: Math.min(...quad.map((point) => point.y)),
    maxY: Math.max(...quad.map((point) => point.y)),
  };
  if (bounds.maxX - bounds.minX < width * 0.12) return false;
  if (bounds.maxY - bounds.minY < height * 0.12) return false;
  return true;
}

function touchesBorder(quad: readonly Point[], width: number, height: number): boolean {
  const margin = Math.min(width, height) * 0.015 + 1;
  let sides = 0;
  if (quad[0].y < margin && quad[1].y < margin) sides += 1;
  if (quad[1].x > width - 1 - margin && quad[2].x > width - 1 - margin) sides += 1;
  if (quad[2].y > height - 1 - margin && quad[3].y > height - 1 - margin) sides += 1;
  if (quad[3].x < margin && quad[0].x < margin) sides += 1;
  return sides >= 3;
}

function containsQuad(outer: readonly Point[], inner: readonly Point[]): boolean {
  return inner.every((point) => pointInConvex(point, outer));
}

function pointInConvex(point: Point, polygon: readonly Point[]): boolean {
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (cross < -1.5) return false;
  }
  return true;
}

function clockwiseConvex(points: readonly Point[]): boolean {
  if (points.length !== 4) return false;
  let sign = 0;
  for (let index = 0; index < 4; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % 4];
    const c = points[(index + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1) return false;
    const current = Math.sign(cross);
    if (sign === 0) sign = current;
    if (current !== sign) return false;
  }
  return sign > 0 && Math.abs(polygonArea(points)) > 0;
}

function orderQuad(points: readonly Point[]): Point[] {
  let topLeft = points[0];
  let topRight = points[0];
  let bottomRight = points[0];
  let bottomLeft = points[0];
  for (const point of points) {
    if (point.x + point.y < topLeft.x + topLeft.y) topLeft = point;
    if (point.x + point.y > bottomRight.x + bottomRight.y) bottomRight = point;
    if (point.y - point.x < topRight.y - topRight.x) topRight = point;
    if (point.y - point.x > bottomLeft.y - bottomLeft.x) bottomLeft = point;
  }
  return [topLeft, topRight, bottomRight, bottomLeft];
}

function extremeQuad(points: readonly Point[]): Point[] | null {
  const quad = orderQuad(points);
  const unique = new Set(quad.map((point) => `${point.x}:${point.y}`));
  return unique.size === 4 ? quad : null;
}

function sameQuad(a: readonly Point[], b: readonly Point[]): boolean {
  return a.every((point, index) => Math.hypot(point.x - b[index].x, point.y - b[index].y) < 4);
}

function centroid(points: readonly Point[]): Point {
  const sum = points.reduce(
    (value, point) => ({ x: value.x + point.x, y: value.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function polygonArea(points: readonly Point[]): number {
  let twice = 0;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    twice += point.x * next.y - next.x * point.y;
  }
  return twice * 0.5;
}

function perimeter(points: readonly Point[]): number {
  let length = 0;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    length += Math.hypot(next.x - point.x, next.y - point.y);
  }
  return length;
}

function convexHull(points: readonly Point[]): Point[] {
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const unique: Point[] = [];
  for (const point of sorted) {
    const last = unique[unique.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y) unique.push(point);
  }
  if (unique.length <= 3) return unique;
  const lower: Point[] = [];
  const upper: Point[] = [];
  for (const point of unique) {
    while (lower.length >= 2 && hullCross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }
  for (let index = unique.length - 1; index >= 0; index -= 1) {
    const point = unique[index];
    while (upper.length >= 2 && hullCross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function hullCross(origin: Point, a: Point, b: Point): number {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
}

function simplifyClosed(points: readonly Point[], epsilon: number): Point[] {
  if (points.length <= 4) return points.slice();
  let farthest = 1;
  let best = 0;
  for (let index = 1; index < points.length; index += 1) {
    const distance = (points[index].x - points[0].x) ** 2 + (points[index].y - points[0].y) ** 2;
    if (distance > best) {
      best = distance;
      farthest = index;
    }
  }
  const head = douglasPeucker(points.slice(0, farthest + 1), epsilon);
  const tail = douglasPeucker(points.slice(farthest).concat([points[0]]), epsilon);
  return head.slice(0, -1).concat(tail.slice(0, -1));
}

function douglasPeucker(points: readonly Point[], epsilon: number): Point[] {
  if (points.length < 3) return points.slice();
  const first = points[0];
  const last = points[points.length - 1];
  let maxDistance = 0;
  let index = 0;
  for (let cursor = 1; cursor < points.length - 1; cursor += 1) {
    const distance = pointLineDistance(points[cursor], first, last);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = cursor;
    }
  }
  if (maxDistance <= epsilon) return [first, last];
  const left = douglasPeucker(points.slice(0, index + 1), epsilon);
  const right = douglasPeucker(points.slice(index), epsilon);
  return left.slice(0, -1).concat(right);
}

function pointLineDistance(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return Math.hypot(point.x - start.x, point.y - start.y);
  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / length;
}

function fitLine(points: readonly Point[]): Line | null {
  if (points.length < 4) return null;
  let meanX = 0;
  let meanY = 0;
  for (const point of points) {
    meanX += point.x;
    meanY += point.y;
  }
  meanX /= points.length;
  meanY /= points.length;
  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }
  const angle = 0.5 * Math.atan2(2 * xy, xx - yy);
  const tx = Math.cos(angle);
  const ty = Math.sin(angle);
  const a = -ty;
  const b = tx;
  return { a, b, c: -(a * meanX + b * meanY) };
}

function intersectLines(first: Line, second: Line): Point | null {
  const determinant = first.a * second.b - second.a * first.b;
  if (Math.abs(determinant) < 1e-6) return null;
  return {
    x: (-first.c * second.b + first.b * second.c) / determinant,
    y: (-first.a * second.c + second.a * first.c) / determinant,
  };
}

function strongMagnitude(values: Float32Array): number {
  let peak = 0;
  const ridge: number[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value > peak) peak = value;
    if (value > 1) ridge.push(value);
  }
  if (ridge.length < 24 || peak < 8) return 0;
  ridge.sort((a, b) => a - b);
  const strongest = Math.max(24, Math.floor(values.length * 0.015));
  const fromPeak = ridge[Math.max(0, ridge.length - strongest)];
  return Math.max(peak * 0.2, fromPeak);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampIndex(value: number, size: number): number {
  return clamp(value, 0, size - 1);
}
