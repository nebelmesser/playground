import { createPlaceStem, placeLabel, type PlaceKind } from './place-name';

export type RegionSample = {
  width: number;
  height: number;
  signs: Int8Array;
};

export type PlaceLabel = {
  id: number;
  kind: PlaceKind;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  fontSize: number;
  letterSpacing: number;
  angle: number;
};

export type LabelMode = 'map' | 'hidden' | 'chaos';

type Viewport = {
  width: number;
  height: number;
};

type Region = {
  sign: 1 | -1;
  area: number;
  fraction: number;
  kind: PlaceKind;
  cells: number[];
};

type Placement = {
  id: number;
  alive: boolean;
  displayX: number;
  displayY: number;
  idealX: number;
  idealY: number;
  angle: number;
  idealAngle: number;
  fontSize: number;
  idealFont: number;
  letterSpacing: number;
  idealTracking: number;
  opacity: number;
  collisionOpacity: number;
  mask: Uint8Array | null;
  velocityX: number;
  velocityY: number;
  candidateX: number;
  candidateY: number;
  candidateFrames: number;
  collisionHidden: boolean;
  collisionChangeSeconds: number;
  locked: boolean;
};

type PieceLayout = {
  mask: Uint8Array;
  area: number;
  rect: SolidRect;
  x: number;
  y: number;
  fontSize: number;
  letterSpacing: number;
  angle: number;
};

type Track = {
  id: number;
  stem: string;
  kind: PlaceKind;
  text: string;
  area: number;
  age: number;
  missing: number;
  confirmed: boolean;
  placements: Placement[];
  history: Uint8Array[];
};

type SolidRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const STABLE_SECONDS = 15;
const MIN_AREA_FRACTION = 0.0035;
const MIN_ISLAND_AREA_FRACTION = 0.008;
const LARGE_AREA_FRACTION = 0.055;
const LARGE_ENTER_FRACTION = 0.058;
const LARGE_EXIT_FRACTION = 0.042;
const MATCH_OF_NEW = 0.45;
const MATCH_OF_OLD = 0.3;
const MAX_AREA_RATIO = 2.5;
const MISSING_FADE_SECONDS = 0.75;
const MISSING_DROP_SECONDS = 3.2;
const MIN_TRACKING_EM = 0.12;
const MAX_TRACKING_EM = 0.28;
const MAX_SPEED_PX = 30;
const MAX_ACCELERATION_PX = 120;
const POSITION_RESPONSE_SECONDS = 0.85;
const TEXT_HEIGHT_EM = 1.35;
const MAX_ABS_ANGLE = 24;
const MAX_GLIDE_DISTANCE_PX = 150;
const ANCHOR_ACCEPT_PX = 14;
const ANCHOR_CANDIDATE_PX = 20;
const ANCHOR_CANDIDATE_FRAMES = 8;
const TEMPORAL_HISTORY_LENGTH = 8;
const TEMPORAL_OCCUPANCY = 0.625;
const LABEL_COLLISION_PAD_PX = 7;
const COLLISION_FADE_SECONDS = 0.22;
const COLLISION_REVEAL_SECONDS = 0.7;
const COLLISION_HIDE_DWELL_SECONDS = 0.35;
const COLLISION_SHOW_DWELL_SECONDS = 0.9;
const ANGLE_SAMPLES = [-24, -12, 0, 12, 24];
const FADE_IN_SECONDS = 1.05;
const FADE_OUT_SECONDS = 0.45;
const CHAOS_FADE_SECONDS = 0.22;
const MAX_TRACKS = 48;
const LABEL_FONT_FAMILY = 'Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif';

const isLand = (kind: PlaceKind): boolean => kind === 'continent' || kind === 'island';

const isLarge = (kind: PlaceKind): boolean => kind === 'continent' || kind === 'sea';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const approach = (current: number, target: number, deltaSeconds: number, responseSeconds: number, snap: boolean): number => {
  if (snap) return target;
  const factor = 1 - Math.exp(-deltaSeconds / responseSeconds);
  return current + (target - current) * factor;
};

type Point = { x: number; y: number };

const kindForFraction = (sign: number, fraction: number, previous: PlaceKind | null): PlaceKind | null => {
  if (fraction < MIN_AREA_FRACTION) return null;
  const wasLarge = previous ? isLarge(previous) : false;
  const large = wasLarge ? fraction >= LARGE_EXIT_FRACTION : fraction >= (previous ? LARGE_ENTER_FRACTION : LARGE_AREA_FRACTION);
  const kind: PlaceKind = sign > 0
    ? large ? 'continent' : 'island'
    : large ? 'sea' : 'lake';
  if (kind === 'island' && fraction < MIN_ISLAND_AREA_FRACTION) return null;
  return kind;
};

const neighborsOf = (index: number, width: number, height: number): number[] => {
  const x = index % width;
  const y = Math.floor(index / width);
  return [
    ((x + 1) % width) + y * width,
    ((x - 1 + width) % width) + y * width,
    x + ((y + 1) % height) * width,
    x + ((y - 1 + height) % height) * width,
  ];
};

const openNeighbors = (index: number, width: number, height: number): number[] => {
  const x = index % width;
  const y = Math.floor(index / width);
  const next: number[] = [];
  if (x > 0) next.push(index - 1);
  if (x + 1 < width) next.push(index + 1);
  if (y > 0) next.push(index - width);
  if (y + 1 < height) next.push(index + width);
  return next;
};

const candidateRects = (
  mask: Uint8Array,
  width: number,
  height: number,
  minW: number,
  minH: number,
): SolidRect[] => {
  const heights = new Int32Array(width);
  const stack = new Int32Array(width + 1);
  const best = {
    any: null as SolidRect | null,
    wide: null as SolidRect | null,
    tall: null as SolidRect | null,
    anyArea: 0,
    wideArea: 0,
    tallArea: 0,
  };
  const consider = (rect: SolidRect): void => {
    const area = rect.w * rect.h;
    if (area > best.anyArea) {
      best.anyArea = area;
      best.any = rect;
    }
    if (rect.w >= rect.h * 1.35 && area > best.wideArea) {
      best.wideArea = area;
      best.wide = rect;
    }
    if (rect.h >= rect.w * 1.35 && area > best.tallArea) {
      best.tallArea = area;
      best.tall = rect;
    }
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) heights[x] = mask[x + y * width] === 1 ? heights[x] + 1 : 0;
    let top = 0;
    stack[0] = -1;
    for (let x = 0; x <= width; x += 1) {
      const here = x === width ? 0 : heights[x];
      while (top > 0 && heights[stack[top]] > here) {
        const h = heights[stack[top]];
        top -= 1;
        const w = x - stack[top] - 1;
        if (w >= minW && h >= minH) consider({ x: stack[top] + 1, y: y - h + 1, w, h });
      }
      top += 1;
      stack[top] = x;
    }
  }
  const rects: SolidRect[] = [];
  const same = (a: SolidRect, b: SolidRect): boolean => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
  if (best.any) rects.push(best.any);
  if (best.wide && rects.every((rect) => !same(rect, best.wide as SolidRect))) rects.push(best.wide);
  if (best.tall && rects.every((rect) => !same(rect, best.tall as SolidRect))) rects.push(best.tall);
  return rects;
};

const extractRegions = (signs: Int8Array, width: number, height: number): Region[] => {
  const count = width * height;
  if (signs.length !== count || count === 0) return [];
  const seen = new Uint8Array(count);
  const regions: Region[] = [];

  for (let start = 0; start < count; start += 1) {
    if (seen[start] !== 0) continue;
    const sign = signs[start] < 0 ? -1 : 1;
    const cells: number[] = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length > 0) {
      const index = stack.pop() as number;
      cells.push(index);
      for (const next of neighborsOf(index, width, height)) {
        if (seen[next] !== 0) continue;
        if ((signs[next] < 0 ? -1 : 1) !== sign) continue;
        seen[next] = 1;
        stack.push(next);
      }
    }
    const fraction = cells.length / count;
    const kind = kindForFraction(sign, fraction, null);
    if (!kind) continue;
    regions.push({ sign, area: cells.length, fraction, kind, cells });
  }

  regions.sort((a, b) => b.area - a.area);
  if (regions.length > MAX_TRACKS) regions.length = MAX_TRACKS;
  return regions;
};

const fontFor = (kind: PlaceKind): { min: number; max: number } => {
  if (kind === 'continent') return { min: 22, max: 38 };
  if (kind === 'sea') return { min: 18, max: 30 };
  return { min: 16, max: 20 };
};

export const labelPositions = (label: PlaceLabel): Array<{ x: number; y: number }> => (
  [{ x: label.x, y: label.y }]
);

export class PlaceTracker {
  private readonly measure: CanvasRenderingContext2D | null;
  private readonly tracks = new Map<number, Track>();
  private readonly usedStems = new Set<string>();
  private owners: Uint16Array<ArrayBufferLike> = new Uint16Array(0);
  private nextId = 1;
  private nextPlacementId = 1;
  private synced = false;
  private lastIngest = -1;
  private viewport: Viewport = { width: 1, height: 1 };
  private sampleWidth = 0;
  private sampleHeight = 0;

  constructor() {
    if (typeof document === 'undefined') {
      this.measure = null;
      return;
    }
    this.measure = document.createElement('canvas').getContext('2d');
  }

  reset(): void {
    this.tracks.clear();
    this.usedStems.clear();
    this.owners = new Uint16Array(0);
    this.synced = false;
    this.lastIngest = -1;
    this.sampleWidth = 0;
    this.sampleHeight = 0;
  }

  advance(deltaSeconds: number, mode: LabelMode, viewport: Viewport): PlaceLabel[] {
    this.viewport = viewport;
    const dt = clamp(deltaSeconds, 0, 0.5);
    const snap = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (mode !== 'map') this.synced = false;

    for (const track of this.tracks.values()) {
      if (mode !== 'map') track.confirmed = false;
      if (mode === 'map' && track.confirmed && track.missing < 0.001) track.age += dt;
      const settled = track.placements.some((placement) => placement.locked);
      const shown = mode === 'map'
        && this.synced
        && track.confirmed
        && track.age >= STABLE_SECONDS
        && track.missing < (settled ? 2 : MISSING_FADE_SECONDS);
      for (const placement of track.placements) {
        if (placement.alive && placement.locked) this.glide(track, placement, dt);
        if (shown && placement.alive) placement.locked = true;
        const target = shown && placement.alive ? 1 : 0;
        const response = mode === 'chaos' ? CHAOS_FADE_SECONDS : target ? FADE_IN_SECONDS : FADE_OUT_SECONDS;
        placement.opacity = clamp(approach(placement.opacity, target, dt, response, snap), 0, 1);
      }
      track.placements = track.placements.filter((placement) => placement.alive || placement.opacity > 0.02);
    }

    this.resolveCollisions(dt, snap);
    const labels = this.collect();
    if (mode === 'chaos' && labels.length === 0) this.reset();
    return labels;
  }

  ingest(sample: RegionSample): void {
    if (sample.signs.length !== sample.width * sample.height || sample.width < 2 || sample.height < 2) return;
    const now = performance.now() / 1000;
    const gap = this.lastIngest < 0 ? 0 : Math.min(2, now - this.lastIngest);
    this.lastIngest = now;
    if (sample.width !== this.sampleWidth || sample.height !== this.sampleHeight) {
      const oldWidth = this.sampleWidth;
      const oldHeight = this.sampleHeight;
      this.owners = this.regridOwners(this.owners, oldWidth, oldHeight, sample.width, sample.height);
      for (const track of this.tracks.values()) {
        track.history = track.history.map((mask) => (
          this.regridMask(mask, oldWidth, oldHeight, sample.width, sample.height)
        ));
        for (const placement of track.placements) {
          placement.mask = placement.mask
            ? this.regridMask(placement.mask, oldWidth, oldHeight, sample.width, sample.height)
            : null;
        }
      }
      this.sampleWidth = sample.width;
      this.sampleHeight = sample.height;
    }

    const regions = extractRegions(sample.signs, sample.width, sample.height);
    const tally = new Map<number, number>();
    const candidates: Array<{ regionIndex: number; trackId: number; overlap: number }> = [];
    for (let regionIndex = 0; regionIndex < regions.length; regionIndex += 1) {
      tally.clear();
      for (const cell of regions[regionIndex].cells) {
        const trackId = this.owners[cell] ?? 0;
        if (trackId === 0) continue;
        tally.set(trackId, (tally.get(trackId) ?? 0) + 1);
      }
      for (const [trackId, overlap] of tally) candidates.push({ regionIndex, trackId, overlap });
    }

    const assigned = new Map<number, Track>();
    const matched = new Set<number>();
    const proposals = new Map<number, Array<{ regionIndex: number; trackId: number; overlap: number }>>();
    const candidatesByTrack = new Map<number, Array<{ regionIndex: number; trackId: number; overlap: number }>>();
    for (const candidate of candidates) {
      const track = this.tracks.get(candidate.trackId);
      const region = regions[candidate.regionIndex];
      if (!track || isLand(track.kind) !== isLand(region.kind)) continue;
      if (candidate.overlap < MATCH_OF_NEW * region.area) continue;
      if (candidate.overlap < MATCH_OF_OLD * track.area) continue;
      const ratio = region.area / track.area;
      if (ratio > MAX_AREA_RATIO || ratio < 1 / MAX_AREA_RATIO) continue;
      const list = candidatesByTrack.get(track.id) ?? [];
      list.push(candidate);
      candidatesByTrack.set(track.id, list);
    }
    for (const list of candidatesByTrack.values()) {
      list.sort((a, b) => b.overlap - a.overlap);
      const proposal = list[0];
      const regionProposals = proposals.get(proposal.regionIndex) ?? [];
      regionProposals.push(proposal);
      proposals.set(proposal.regionIndex, regionProposals);
    }
    for (const [regionIndex, regionProposals] of proposals) {
      regionProposals.sort((a, b) => {
        const aTrack = this.tracks.get(a.trackId);
        const bTrack = this.tracks.get(b.trackId);
        const ageDifference = (bTrack?.age ?? 0) - (aTrack?.age ?? 0);
        return Math.abs(ageDifference) > 0.25 ? ageDifference : b.overlap - a.overlap;
      });
      const track = this.tracks.get(regionProposals[0].trackId);
      if (!track) continue;
      assigned.set(regionIndex, track);
      matched.add(track.id);
    }

    for (const [regionIndex, track] of assigned) {
      const region = regions[regionIndex];
      const kind = kindForFraction(region.sign, region.fraction, track.kind) ?? region.kind;
      track.kind = kind;
      track.text = placeLabel(kind, track.stem);
      track.area = region.area;
      track.missing = 0;
      track.confirmed = true;
      this.rememberRegion(track, region.cells);
      this.place(track, region);
    }

    for (const track of this.tracks.values()) {
      if (matched.has(track.id)) continue;
      track.missing += gap;
      if (track.missing >= MISSING_FADE_SECONDS && !track.placements.some((placement) => placement.locked)) {
        track.age = 0;
      }
    }
    for (const track of [...this.tracks.values()]) {
      if (track.missing <= MISSING_DROP_SECONDS) continue;
      this.tracks.delete(track.id);
      this.usedStems.delete(track.stem);
    }

    const created: Array<{ region: Region; track: Track }> = [];
    for (let regionIndex = 0; regionIndex < regions.length; regionIndex += 1) {
      if (assigned.has(regionIndex)) continue;
      const region = regions[regionIndex];
      const stem = createPlaceStem(Math.random, this.usedStems);
      this.usedStems.add(stem);
      const track: Track = {
        id: this.nextId,
        stem,
        kind: region.kind,
        text: placeLabel(region.kind, stem),
        area: region.area,
        age: 0,
        missing: 0,
        confirmed: true,
        placements: [],
        history: [],
      };
      this.rememberRegion(track, region.cells);
      this.place(track, region);
      this.tracks.set(track.id, track);
      created.push({ region, track });
      this.nextId += 1;
      if (this.nextId >= 65535) this.nextId = 1;
    }

    const nextOwners = new Uint16Array(sample.signs.length);
    if (this.owners.length === nextOwners.length) {
      for (let cell = 0; cell < nextOwners.length; cell += 1) {
        const trackId = this.owners[cell];
        if (trackId !== 0 && this.tracks.has(trackId) && !matched.has(trackId)) nextOwners[cell] = trackId;
      }
    }
    for (const [regionIndex, track] of assigned) {
      for (const cell of regions[regionIndex].cells) nextOwners[cell] = track.id;
    }
    for (const entry of created) {
      for (const cell of entry.region.cells) nextOwners[cell] = entry.track.id;
    }
    this.owners = nextOwners;
    this.synced = true;
  }

  private place(track: Track, region: Region): void {
    const layouts = this.layouts(track, region.cells);
    const claimed = new Set<number>();
    const adopted = new Set<number>();
    const ordered = [...track.placements].sort((a, b) => b.opacity - a.opacity);
    for (const placement of ordered) {
      if (!placement.alive) continue;
      let match = -1;
      const index = this.cellIndex(placement.displayX, placement.displayY);
      if (index >= 0) {
        match = layouts.findIndex((piece, pieceIndex) => !claimed.has(pieceIndex) && piece.mask[index] === 1);
      }
      if (match < 0) {
        let bestDist = Number.POSITIVE_INFINITY;
        for (let pieceIndex = 0; pieceIndex < layouts.length; pieceIndex += 1) {
          if (claimed.has(pieceIndex)) continue;
          const piece = layouts[pieceIndex];
          const dist = this.planar(placement.displayX, placement.displayY, piece.x, piece.y);
          if (dist < bestDist) {
            bestDist = dist;
            match = pieceIndex;
          }
        }
      }
      if (match < 0 || !this.adopt(track, placement, layouts[match])) continue;
      claimed.add(match);
      adopted.add(placement.id);
    }

    for (const placement of track.placements) {
      if (placement.alive && !adopted.has(placement.id)) this.retire(placement);
    }

    for (let pieceIndex = 0; pieceIndex < layouts.length; pieceIndex += 1) {
      if (claimed.has(pieceIndex)) continue;
      if (track.placements.some((placement) => placement.alive)) break;
      const piece = layouts[pieceIndex];
      this.spawn(track, piece);
      claimed.add(pieceIndex);
    }
  }

  private layouts(track: Track, cells: number[]): PieceLayout[] {
    const width = this.sampleWidth;
    const height = this.sampleHeight;
    const viewW = this.viewport.width;
    const viewH = this.viewport.height;
    if (width < 2 || height < 2 || viewW < 2 || viewH < 2 || cells.length === 0) return [];
    const limits = fontFor(track.kind);
    const cellX = viewW / width;
    const cellY = viewH / height;
    const thickness = limits.min * TEXT_HEIGHT_EM + 6;
    const minW = thickness / cellX;
    const minH = thickness / cellY;
    const member = new Uint8Array(width * height);
    for (const cell of cells) member[cell] = 1;
    const layouts: PieceLayout[] = [];
    for (const piece of this.screenPieces(member, width, height)) {
      const stableMask = this.temporalMask(piece.mask, track.history);
      const interior = this.readInterior(stableMask) ?? this.readInterior(piece.mask);
      if (!interior) continue;
      const thick: number[] = [];
      const floor = Math.max(1, Math.floor(interior.max * 0.45));
      for (let index = 0; index < piece.mask.length; index += 1) {
        if (piece.mask[index] === 1 && interior.dist[index] >= floor) thick.push(index);
      }
      const preferred = this.preferredAngle(thick.length >= 4 ? thick : interior.cells);
      const eroded = new Uint8Array(stableMask.length);
      const inset = Math.max(1, Math.floor(interior.max * 0.35));
      if (inset > 1) {
        for (let index = 0; index < eroded.length; index += 1) {
          if (stableMask[index] === 1 && interior.dist[index] >= inset) eroded[index] = 1;
        }
      }
      let best: { rect: SolidRect; fit: { fontSize: number; letterSpacing: number; angle: number } } | null = null;
      for (const candidate of inset > 1 ? [eroded, stableMask, piece.mask] : [stableMask, piece.mask]) {
        for (const rect of candidateRects(candidate, width, height, minW, minH)) {
          const fit = this.chooseFit(track.text, track.kind, rect, preferred);
          if (!fit) continue;
          const better = !best
            || fit.fontSize > best.fit.fontSize + 1
            || (Math.abs(fit.fontSize - best.fit.fontSize) <= 1 && rect.w * rect.h > best.rect.w * best.rect.h);
          if (better) best = { rect, fit };
        }
        if (best) break;
      }
      if (!best) continue;
      const aimX = interior.x / viewW;
      const aimY = interior.y / viewH;
      const bounds = this.limitsFor(best.rect, track.text, best.fit.fontSize, best.fit.letterSpacing, best.fit.angle);
      layouts.push({
        mask: piece.mask,
        area: piece.area,
        rect: best.rect,
        x: bounds ? clamp(aimX, bounds.l, bounds.r) : aimX,
        y: bounds ? clamp(aimY, bounds.t, bounds.b) : aimY,
        fontSize: best.fit.fontSize,
        letterSpacing: best.fit.letterSpacing,
        angle: best.fit.angle,
      });
    }
    layouts.sort((a, b) => b.area - a.area);
    return layouts;
  }

  private rememberRegion(track: Track, cells: number[]): void {
    const mask = new Uint8Array(this.sampleWidth * this.sampleHeight);
    for (const cell of cells) mask[cell] = 1;
    track.history.unshift(mask);
    if (track.history.length > TEMPORAL_HISTORY_LENGTH) track.history.length = TEMPORAL_HISTORY_LENGTH;
  }

  private temporalMask(current: Uint8Array, history: Uint8Array[]): Uint8Array {
    if (history.length < 2) return current;
    const stable = new Uint8Array(current.length);
    const required = Math.ceil(history.length * TEMPORAL_OCCUPANCY);
    let stableCells = 0;
    for (let index = 0; index < current.length; index += 1) {
      if (current[index] !== 1) continue;
      let occupied = 0;
      for (const mask of history) occupied += mask[index] ?? 0;
      if (occupied < required) continue;
      stable[index] = 1;
      stableCells += 1;
    }
    return stableCells > 0 ? stable : current;
  }

  private regridOwners(
    source: Uint16Array,
    oldWidth: number,
    oldHeight: number,
    newWidth: number,
    newHeight: number,
  ): Uint16Array {
    const target = new Uint16Array(newWidth * newHeight);
    if (oldWidth < 1 || oldHeight < 1 || source.length !== oldWidth * oldHeight) return target;
    for (let y = 0; y < newHeight; y += 1) {
      const sourceY = Math.min(oldHeight - 1, Math.floor(((y + 0.5) * oldHeight) / newHeight));
      for (let x = 0; x < newWidth; x += 1) {
        const sourceX = Math.min(oldWidth - 1, Math.floor(((x + 0.5) * oldWidth) / newWidth));
        target[x + y * newWidth] = source[sourceX + sourceY * oldWidth];
      }
    }
    return target;
  }

  private regridMask(
    source: Uint8Array,
    oldWidth: number,
    oldHeight: number,
    newWidth: number,
    newHeight: number,
  ): Uint8Array {
    const target = new Uint8Array(newWidth * newHeight);
    if (oldWidth < 1 || oldHeight < 1 || source.length !== oldWidth * oldHeight) return target;
    for (let y = 0; y < newHeight; y += 1) {
      const sourceY = Math.min(oldHeight - 1, Math.floor(((y + 0.5) * oldHeight) / newHeight));
      for (let x = 0; x < newWidth; x += 1) {
        const sourceX = Math.min(oldWidth - 1, Math.floor(((x + 0.5) * oldWidth) / newWidth));
        target[x + y * newWidth] = source[sourceX + sourceY * oldWidth];
      }
    }
    return target;
  }

  private preferredAngle(cells: number[]): number {
    const width = this.sampleWidth;
    if (cells.length < 4) return 0;
    let meanX = 0;
    let meanY = 0;
    for (const index of cells) {
      meanX += (index % width) + 0.5;
      meanY += Math.floor(index / width) + 0.5;
    }
    meanX /= cells.length;
    meanY /= cells.length;
    let xx = 0;
    let yy = 0;
    let xy = 0;
    for (const index of cells) {
      const dx = (index % width) + 0.5 - meanX;
      const dy = Math.floor(index / width) + 0.5 - meanY;
      xx += dx * dx;
      yy += dy * dy;
      xy += dx * dy;
    }
    const trace = xx + yy;
    const det = xx * yy - xy * xy;
    const disc = Math.sqrt(Math.max(0, trace * trace * 0.25 - det));
    const minor = trace * 0.5 - disc;
    const major = trace * 0.5 + disc;
    if (minor <= 1 || major / minor < 1.45) return 0;
    let angle = Math.atan2(2 * xy, xx - yy) * 0.5 * 180 / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;
    return clamp(angle, -MAX_ABS_ANGLE, MAX_ABS_ANGLE);
  }

  private chooseFit(
    text: string,
    kind: PlaceKind,
    rect: SolidRect,
    preferred: number,
  ): { fontSize: number; letterSpacing: number; angle: number } | null {
    const angles = [clamp(preferred, -MAX_ABS_ANGLE, MAX_ABS_ANGLE), ...ANGLE_SAMPLES];
    let best: { fontSize: number; letterSpacing: number; angle: number } | null = null;
    for (const angle of angles) {
      const fit = this.fitInside(text, kind, rect, angle);
      if (!fit) continue;
      const closer = best !== null && Math.abs(angle - preferred) < Math.abs(best.angle - preferred) - 0.1;
      const better = best === null
        || fit.fontSize > best.fontSize + 1
        || (Math.abs(fit.fontSize - best.fontSize) <= 1 && closer);
      if (better) best = { fontSize: fit.fontSize, letterSpacing: fit.letterSpacing, angle };
    }
    return best;
  }

  private fitInside(
    text: string,
    kind: PlaceKind,
    rect: SolidRect,
    angleDeg: number,
  ): { fontSize: number; letterSpacing: number } | null {
    const cellX = this.viewport.width / this.sampleWidth;
    const cellY = this.viewport.height / this.sampleHeight;
    const availableX = rect.w * cellX - 6;
    const availableY = rect.h * cellY - 6;
    const limits = fontFor(kind);
    if (availableX < 8 || availableY < limits.min * TEXT_HEIGHT_EM * 0.45) return null;
    const radians = angleDeg * Math.PI / 180;
    const cosine = Math.abs(Math.cos(radians));
    const sine = Math.abs(Math.sin(radians));
    const fits = (fontSize: number): boolean => {
      const boxH = fontSize * TEXT_HEIGHT_EM;
      const minTracking = fontSize * MIN_TRACKING_EM;
      const minWidth = this.boxWidth(text, fontSize, minTracking);
      const minExtent = this.extents(minWidth, boxH, cosine, sine);
      return minExtent.w <= availableX && minExtent.h <= availableY;
    };
    if (!fits(limits.min)) return null;
    let fontLow = limits.min;
    let fontHigh = limits.max;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = (fontLow + fontHigh) / 2;
      if (fits(candidate)) fontLow = candidate;
      else fontHigh = candidate;
    }
    const fontSize = fontLow;
    const boxH = fontSize * TEXT_HEIGHT_EM;
    let trackingLow = fontSize * MIN_TRACKING_EM;
    let trackingHigh = fontSize * MAX_TRACKING_EM;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const letterSpacing = (trackingLow + trackingHigh) / 2;
      const spaced = this.extents(this.boxWidth(text, fontSize, letterSpacing), boxH, cosine, sine);
      if (spaced.w <= availableX && spaced.h <= availableY) trackingLow = letterSpacing;
      else trackingHigh = letterSpacing;
    }
    return { fontSize, letterSpacing: trackingLow };
  }

  private extents(boxW: number, boxH: number, cosine: number, sine: number): { w: number; h: number } {
    return {
      w: boxW * cosine + boxH * sine,
      h: boxW * sine + boxH * cosine,
    };
  }

  private readInterior(mask: Uint8Array): { dist: Int16Array; max: number; x: number; y: number; cells: number[] } | null {
    const width = this.sampleWidth;
    const height = this.sampleHeight;
    const count = width * height;
    if (mask.length !== count || count === 0) return null;
    const dist = new Int16Array(count);
    const queue = new Int32Array(count);
    let head = 0;
    let tail = 0;
    let any = false;
    for (let index = 0; index < count; index += 1) {
      if (mask[index] === 1) {
        dist[index] = -1;
        any = true;
        continue;
      }
      dist[index] = 0;
      queue[tail] = index;
      tail += 1;
    }
    if (!any) return null;
    const cells: number[] = [];
    for (let index = 0; index < count; index += 1) {
      if (mask[index] === 1) cells.push(index);
    }
    const cellX = this.viewport.width / width;
    const cellY = this.viewport.height / height;
    if (tail === 0) {
      const span = Math.min(width, height);
      let sx = 0;
      let sy = 0;
      for (const index of cells) {
        dist[index] = span;
        sx += (index % width) + 0.5;
        sy += Math.floor(index / width) + 0.5;
      }
      return {
        dist,
        max: span,
        x: (sx / cells.length) * cellX,
        y: (sy / cells.length) * cellY,
        cells,
      };
    }
    while (head < tail) {
      const index = queue[head];
      head += 1;
      const next = dist[index] + 1;
      const x = index % width;
      const y = Math.floor(index / width);
      const neighbors = [
        x > 0 ? index - 1 : -1,
        x + 1 < width ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y + 1 < height ? index + width : -1,
      ];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || dist[neighbor] !== -1) continue;
        dist[neighbor] = next;
        queue[tail] = neighbor;
        tail += 1;
      }
    }
    let max = 0;
    let sx = 0;
    let sy = 0;
    let seen = 0;
    for (const index of cells) {
      const distance = dist[index] < 0 ? 0 : dist[index];
      dist[index] = distance;
      if (distance > max) max = distance;
    }
    for (let index = 0; index < count; index += 1) {
      if (mask[index] !== 1 || dist[index] < max) continue;
      sx += (index % width) + 0.5;
      sy += Math.floor(index / width) + 0.5;
      seen += 1;
    }
    if (seen === 0) return null;
    return { dist, max, x: (sx / seen) * cellX, y: (sy / seen) * cellY, cells };
  }

  private adopt(track: Track, placement: Placement, piece: PieceLayout): boolean {
    const relocationDistance = this.planar(placement.displayX, placement.displayY, piece.x, piece.y);
    const centerIndex = this.cellIndex(placement.displayX, placement.displayY);
    const centerStillInside = centerIndex >= 0 && piece.mask[centerIndex] === 1;
    if (placement.locked) {
      if (!centerStillInside && relocationDistance > MAX_GLIDE_DISTANCE_PX) return false;
      if (!centerStillInside && !this.pathFits(track.text, piece, placement.displayX, placement.displayY)) return false;
    }

    placement.alive = true;
    placement.mask = piece.mask;
    if (!placement.locked) {
      placement.displayX = piece.x;
      placement.displayY = piece.y;
      placement.idealX = piece.x;
      placement.idealY = piece.y;
      placement.angle = piece.angle;
      placement.fontSize = piece.fontSize;
      placement.letterSpacing = piece.letterSpacing;
      placement.candidateX = piece.x;
      placement.candidateY = piece.y;
      placement.candidateFrames = 0;
      return true;
    }

    const styleBlend = piece.fontSize < placement.idealFont ? 0.32 : 0.2;
    placement.idealFont += (piece.fontSize - placement.idealFont) * styleBlend;
    placement.idealTracking += (piece.letterSpacing - placement.idealTracking) * styleBlend;
    placement.idealAngle += (piece.angle - placement.idealAngle) * 0.18;
    const targetDistance = this.planar(placement.idealX, placement.idealY, piece.x, piece.y);
    if (targetDistance <= ANCHOR_ACCEPT_PX) {
      placement.idealX += (piece.x - placement.idealX) * 0.18;
      placement.idealY += (piece.y - placement.idealY) * 0.18;
      placement.candidateFrames = 0;
      return true;
    }

    if (this.planar(placement.candidateX, placement.candidateY, piece.x, piece.y) <= ANCHOR_CANDIDATE_PX) {
      placement.candidateX += (piece.x - placement.candidateX) * 0.35;
      placement.candidateY += (piece.y - placement.candidateY) * 0.35;
      placement.candidateFrames += 1;
    } else {
      placement.candidateX = piece.x;
      placement.candidateY = piece.y;
      placement.candidateFrames = 1;
    }
    if (placement.candidateFrames >= ANCHOR_CANDIDATE_FRAMES) {
      placement.idealX = placement.candidateX;
      placement.idealY = placement.candidateY;
      placement.candidateFrames = 0;
    }
    return true;
  }

  private spawn(track: Track, piece: PieceLayout): void {
    track.placements.push({
      id: this.nextPlacementId,
      alive: true,
      displayX: piece.x,
      displayY: piece.y,
      idealX: piece.x,
      idealY: piece.y,
      angle: piece.angle,
      idealAngle: piece.angle,
      fontSize: piece.fontSize,
      idealFont: piece.fontSize,
      letterSpacing: piece.letterSpacing,
      idealTracking: piece.letterSpacing,
      opacity: 0,
      collisionOpacity: 0,
      mask: piece.mask,
      velocityX: 0,
      velocityY: 0,
      candidateX: piece.x,
      candidateY: piece.y,
      candidateFrames: 0,
      collisionHidden: false,
      collisionChangeSeconds: 0,
      locked: false,
    });
    this.nextPlacementId += 1;
    if (this.nextPlacementId >= 1000000) this.nextPlacementId = 1;
  }

  private retire(placement: Placement): void {
    placement.alive = false;
  }

  private glide(track: Track, placement: Placement, dt: number): void {
    const fontResponse = placement.idealFont < placement.fontSize ? 0.45 : 1.8;
    const nextFont = approach(placement.fontSize, placement.idealFont, dt, fontResponse, false);
    const nextTracking = approach(placement.letterSpacing, placement.idealTracking, dt, 1.1, false);
    const nextAngle = approach(placement.angle, placement.idealAngle, dt, 1.25, false);
    let currentViolations = placement.mask ? this.geometryViolations(
      placement.mask,
      track.text,
      placement.displayX,
      placement.displayY,
      placement.fontSize,
      placement.letterSpacing,
      placement.angle,
    ) : 0;
    const nextStyleViolations = placement.mask ? this.geometryViolations(
      placement.mask,
      track.text,
      placement.displayX,
      placement.displayY,
      nextFont,
      nextTracking,
      nextAngle,
    ) : 0;
    if (nextStyleViolations <= currentViolations) {
      placement.fontSize = nextFont;
      placement.letterSpacing = nextTracking;
      placement.angle = nextAngle;
      currentViolations = nextStyleViolations;
    }

    const width = this.viewport.width;
    const height = this.viewport.height;
    let x = placement.displayX * width;
    let y = placement.displayY * height;
    const targetX = placement.idealX * width;
    const targetY = placement.idealY * height;
    const omega = 2 / POSITION_RESPONSE_SECONDS;
    let accelerationX = (targetX - x) * omega * omega - 2 * omega * placement.velocityX;
    let accelerationY = (targetY - y) * omega * omega - 2 * omega * placement.velocityY;
    const acceleration = Math.hypot(accelerationX, accelerationY);
    if (acceleration > MAX_ACCELERATION_PX) {
      accelerationX *= MAX_ACCELERATION_PX / acceleration;
      accelerationY *= MAX_ACCELERATION_PX / acceleration;
    }
    placement.velocityX += accelerationX * dt;
    placement.velocityY += accelerationY * dt;
    const speed = Math.hypot(placement.velocityX, placement.velocityY);
    if (speed > MAX_SPEED_PX) {
      placement.velocityX *= MAX_SPEED_PX / speed;
      placement.velocityY *= MAX_SPEED_PX / speed;
    }
    x += placement.velocityX * dt;
    y += placement.velocityY * dt;
    if (Math.hypot(targetX - x, targetY - y) < 0.3 && Math.hypot(placement.velocityX, placement.velocityY) < 0.5) {
      x = targetX;
      y = targetY;
      placement.velocityX = 0;
      placement.velocityY = 0;
    }
    const nextX = x / width;
    const nextY = y / height;
    const nextPositionViolations = placement.mask ? this.geometryViolations(
      placement.mask,
      track.text,
      nextX,
      nextY,
      placement.fontSize,
      placement.letterSpacing,
      placement.angle,
    ) : 0;
    if (nextPositionViolations <= currentViolations) {
      placement.displayX = nextX;
      placement.displayY = nextY;
    } else {
      placement.velocityX = 0;
      placement.velocityY = 0;
    }
  }

  private geometryFits(
    mask: Uint8Array,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    letterSpacing: number,
    angle: number,
  ): boolean {
    return this.geometryViolations(mask, text, x, y, fontSize, letterSpacing, angle) === 0;
  }

  private geometryViolations(
    mask: Uint8Array,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    letterSpacing: number,
    angle: number,
  ): number {
    if (this.sampleWidth < 2 || this.sampleHeight < 2) return 0;
    const viewW = this.viewport.width;
    const viewH = this.viewport.height;
    const cellW = viewW / this.sampleWidth;
    const cellH = viewH / this.sampleHeight;
    const centerX = x * viewW;
    const centerY = y * viewH;
    const halfW = Math.max(1, this.boxWidth(text, fontSize, letterSpacing) / 2 - 1);
    const halfH = Math.max(1, fontSize * TEXT_HEIGHT_EM / 2 - 1);
    const radians = angle * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const extent = this.extents(halfW * 2, halfH * 2, Math.abs(cosine), Math.abs(sine));
    if (
      centerX - extent.w / 2 < 1
      || centerY - extent.h / 2 < 1
      || centerX + extent.w / 2 > viewW - 1
      || centerY + extent.h / 2 > viewH - 1
    ) return Number.POSITIVE_INFINITY;

    const sampleStep = Math.max(2, Math.min(cellW, cellH) * 0.45);
    const columns = Math.max(2, Math.ceil((halfW * 2) / sampleStep));
    const rows = Math.max(2, Math.ceil((halfH * 2) / sampleStep));
    let violations = 0;
    for (let row = 0; row <= rows; row += 1) {
      const localY = -halfH + (row / rows) * halfH * 2;
      for (let column = 0; column <= columns; column += 1) {
        const localX = -halfW + (column / columns) * halfW * 2;
        const sampleX = centerX + localX * cosine - localY * sine;
        const sampleY = centerY + localX * sine + localY * cosine;
        const cellX = Math.floor(sampleX / cellW);
        const cellY = Math.floor(sampleY / cellH);
        if (cellX < 0 || cellY < 0 || cellX >= this.sampleWidth || cellY >= this.sampleHeight) {
          violations += 1;
          continue;
        }
        if (mask[cellX + cellY * this.sampleWidth] !== 1) violations += 1;
      }
    }
    return violations;
  }

  private pathFits(text: string, piece: PieceLayout, startX: number, startY: number): boolean {
    const distance = this.planar(startX, startY, piece.x, piece.y);
    const cellW = this.viewport.width / this.sampleWidth;
    const cellH = this.viewport.height / this.sampleHeight;
    const pathStep = Math.max(4, Math.min(8, cellW, cellH));
    const steps = Math.max(1, Math.ceil(distance / pathStep));
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      if (!this.geometryFits(
        piece.mask,
        text,
        startX + (piece.x - startX) * progress,
        startY + (piece.y - startY) * progress,
        piece.fontSize,
        piece.letterSpacing,
        piece.angle,
      )) return false;
    }
    return true;
  }


  private limitsFor(
    rect: SolidRect,
    text: string,
    fontSize: number,
    letterSpacing: number,
    angle: number,
  ): { l: number; t: number; r: number; b: number } | null {
    if (fontSize < 1 || this.sampleWidth < 2 || this.sampleHeight < 2) return null;
    const viewW = this.viewport.width;
    const viewH = this.viewport.height;
    const radians = angle * Math.PI / 180;
    const extent = this.extents(
      this.boxWidth(text, fontSize, letterSpacing),
      fontSize * TEXT_HEIGHT_EM,
      Math.abs(Math.cos(radians)),
      Math.abs(Math.sin(radians)),
    );
    const cellX = viewW / this.sampleWidth;
    const cellY = viewH / this.sampleHeight;
    const pad = 3;
    let left = rect.x * cellX + extent.w / 2 + pad;
    let right = (rect.x + rect.w) * cellX - extent.w / 2 - pad;
    let top = rect.y * cellY + extent.h / 2 + pad;
    let bottom = (rect.y + rect.h) * cellY - extent.h / 2 - pad;
    left = Math.max(left, extent.w / 2);
    right = Math.min(right, viewW - extent.w / 2);
    top = Math.max(top, extent.h / 2);
    bottom = Math.min(bottom, viewH - extent.h / 2);
    if (right < left) {
      if (left - right > 1) return null;
      const mid = (left + right) / 2;
      left = mid;
      right = mid;
    }
    if (bottom < top) {
      if (top - bottom > 1) return null;
      const mid = (top + bottom) / 2;
      top = mid;
      bottom = mid;
    }
    return { l: left / viewW, t: top / viewH, r: right / viewW, b: bottom / viewH };
  }

  private cellIndex(x: number, y: number): number {
    const width = this.sampleWidth;
    const height = this.sampleHeight;
    if (width < 1 || height < 1) return -1;
    const cx = Math.floor(clamp(x, 0, 0.999999) * width);
    const cy = Math.floor(clamp(y, 0, 0.999999) * height);
    return cx + cy * width;
  }

  private planar(x0: number, y0: number, x1: number, y1: number): number {
    return Math.hypot((x0 - x1) * this.viewport.width, (y0 - y1) * this.viewport.height);
  }

  private boxWidth(text: string, fontSize: number, letterSpacing: number): number {
    return this.textWidth(text, fontSize, letterSpacing) * 1.06 + 2;
  }

  private textWidth(text: string, fontSize: number, letterSpacing: number): number {
    const gaps = Math.max(0, text.length - 1);
    if (!this.measure) return fontSize * 0.56 * text.length + letterSpacing * gaps;
    this.measure.font = `500 ${fontSize}px ${LABEL_FONT_FAMILY}`;
    this.measure.fontKerning = 'none';
    return this.measure.measureText(text).width + letterSpacing * gaps;
  }

  private screenPieces(member: Uint8Array, width: number, height: number): Array<{ mask: Uint8Array; area: number }> {
    const seen = new Uint8Array(member.length);
    const pieces: Array<{ mask: Uint8Array; area: number }> = [];
    for (let start = 0; start < member.length; start += 1) {
      if (member[start] !== 1 || seen[start] !== 0) continue;
      const mask = new Uint8Array(member.length);
      const stack = [start];
      seen[start] = 1;
      let area = 0;
      while (stack.length > 0) {
        const index = stack.pop() as number;
        mask[index] = 1;
        area += 1;
        for (const next of openNeighbors(index, width, height)) {
          if (seen[next] !== 0 || member[next] !== 1) continue;
          seen[next] = 1;
          stack.push(next);
        }
      }
      pieces.push({ mask, area });
    }
    return pieces;
  }

  private collisionPriority(kind: PlaceKind): number {
    if (kind === 'lake') return 4;
    if (kind === 'island') return 3;
    if (kind === 'continent') return 2;
    return 1;
  }

  private placementCorners(track: Track, placement: Placement): Point[] {
    const centerX = placement.displayX * this.viewport.width;
    const centerY = placement.displayY * this.viewport.height;
    const halfW = this.boxWidth(track.text, placement.fontSize, placement.letterSpacing) / 2 + LABEL_COLLISION_PAD_PX;
    const halfH = placement.fontSize * TEXT_HEIGHT_EM / 2 + LABEL_COLLISION_PAD_PX;
    const radians = placement.angle * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    return [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH },
    ].map((point) => ({
      x: centerX + point.x * cosine - point.y * sine,
      y: centerY + point.x * sine + point.y * cosine,
    }));
  }

  private boxesOverlap(first: Point[], second: Point[]): boolean {
    for (const polygon of [first, second]) {
      for (let edge = 0; edge < 2; edge += 1) {
        const here = polygon[edge];
        const next = polygon[(edge + 1) % polygon.length];
        const axisX = -(next.y - here.y);
        const axisY = next.x - here.x;
        let firstMin = Number.POSITIVE_INFINITY;
        let firstMax = Number.NEGATIVE_INFINITY;
        let secondMin = Number.POSITIVE_INFINITY;
        let secondMax = Number.NEGATIVE_INFINITY;
        for (const point of first) {
          const projection = point.x * axisX + point.y * axisY;
          firstMin = Math.min(firstMin, projection);
          firstMax = Math.max(firstMax, projection);
        }
        for (const point of second) {
          const projection = point.x * axisX + point.y * axisY;
          secondMin = Math.min(secondMin, projection);
          secondMax = Math.max(secondMax, projection);
        }
        if (firstMax <= secondMin || secondMax <= firstMin) return false;
      }
    }
    return true;
  }

  private resolveCollisions(deltaSeconds: number, snap: boolean): void {
    const items: Array<{ track: Track; placement: Placement; corners: Point[] }> = [];
    for (const track of this.tracks.values()) {
      for (const placement of track.placements) {
        if ((!placement.alive && placement.opacity <= 0.02) || placement.fontSize < 1) continue;
        items.push({ track, placement, corners: this.placementCorners(track, placement) });
      }
    }
    items.sort((a, b) => {
      const kindDifference = this.collisionPriority(b.track.kind) - this.collisionPriority(a.track.kind);
      if (kindDifference !== 0) return kindDifference;
      const ageDifference = b.track.age - a.track.age;
      if (Math.abs(ageDifference) > 0.25) return ageDifference;
      return a.track.id - b.track.id;
    });

    const accepted: typeof items = [];
    for (const item of items) {
      const blocked = accepted.some((other) => (
        other.track.id !== item.track.id && this.boxesOverlap(item.corners, other.corners)
      ));
      if (blocked === item.placement.collisionHidden) {
        item.placement.collisionChangeSeconds = 0;
      } else if (item.placement.opacity < 0.05 && blocked) {
        item.placement.collisionHidden = true;
        item.placement.collisionChangeSeconds = 0;
      } else {
        item.placement.collisionChangeSeconds += deltaSeconds;
        const dwell = blocked ? COLLISION_HIDE_DWELL_SECONDS : COLLISION_SHOW_DWELL_SECONDS;
        if (item.placement.collisionChangeSeconds >= dwell) {
          item.placement.collisionHidden = blocked;
          item.placement.collisionChangeSeconds = 0;
        }
      }
      const target = item.placement.collisionHidden ? 0 : 1;
      const response = item.placement.collisionHidden ? COLLISION_FADE_SECONDS : COLLISION_REVEAL_SECONDS;
      item.placement.collisionOpacity = clamp(approach(
        item.placement.collisionOpacity,
        target,
        deltaSeconds,
        response,
        snap,
      ), 0, 1);
      if (!blocked) accepted.push(item);
    }
  }

  private collect(): PlaceLabel[] {
    const labels: PlaceLabel[] = [];
    const { width, height } = this.viewport;
    for (const track of this.tracks.values()) {
      for (const placement of track.placements) {
        const opacity = placement.opacity * placement.collisionOpacity;
        if (opacity <= 0.015 || placement.fontSize < 1) continue;
        labels.push({
          id: placement.id,
          kind: track.kind,
          text: track.text,
          x: placement.displayX * width,
          y: placement.displayY * height,
          width: this.boxWidth(track.text, placement.fontSize, placement.letterSpacing),
          height: placement.fontSize * TEXT_HEIGHT_EM,
          opacity,
          fontSize: placement.fontSize,
          letterSpacing: placement.letterSpacing,
          angle: placement.angle,
        });
      }
    }
    return labels;
  }
}
