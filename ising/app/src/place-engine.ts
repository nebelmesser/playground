import { createPlaceStem, placeLabel, type PlaceKind } from './place-name';

export type RegionSample = { width: number; height: number; signs: Int8Array };
export type PlaceLabel = {
  id: number; kind: PlaceKind; text: string;
  x: number; y: number; width: number; height: number;
  opacity: number; fontSize: number; letterSpacing: number; angle: number;
};
export type LabelMode = 'map' | 'hidden' | 'chaos';

type Point = { x: number; y: number };
type Pose = Point & { font: number; angle: number };
type Component = {
  sign: number; kind: PlaceKind | null; area: number; cells: number[];
  center: Point; bounds: { x0: number; y0: number; x1: number; y1: number };
  role: 'place' | 'hole' | 'sea';
};
type Seat = { pose: Pose; quality: number };
type Landscape = {
  quality: Float32Array;
  centerX: Float32Array;
  centerY: Float32Array;
  axis: Float32Array;
  elongation: Float32Array;
  candidates: number[];
  radius: number;
};
type Placement = {
  id: number; position: Point; velocity: Point;
  font: number; fontVelocity: number; angle: number; angleVelocity: number;
  target: Pose; opacity: number; collisionOpacity: number;
  mask: Uint8Array; regionMask: Uint8Array; alive: boolean;
  route: Pose[];
};
type Track = {
  id: number; stem: string; kind: PlaceKind; text: string; area: number;
  stability: number; agreement: number; missing: number; confirmed: boolean; present: boolean;
  center: Point; bounds: Component['bounds']; lastMask: Uint8Array | null;
  soft: Float32Array | null; placement: Placement | null; ghosts: Placement[];
  styleFont: number;
};

const STABILITY_RESPONSE = 0.7;
const NAME_COOLDOWN_SECONDS = 5;
const MIN_REGION_FRACTION = 0.0035;
const MIN_ISLAND_FRACTION = 0.008;
const LARGE_FRACTION = 0.055;
const MAX_LAKE_SIDE_FRACTION = 1 / 4;
const MAX_TRACKS = 48;
const TEXT_HEIGHT_EM = 1.35;
const TRACKING_EM = 0.16;
const COAST_MARGIN_PX = 9;
const MIN_FONT = 8;
const MAX_FONT = 64;
const MAX_ANGLE = 80;
const ANGLE_STEP = 20;
const ORIENTATION_COST = 0.12;
const AXIS_COST = 0.22;
const SEAT_ORIENTATION_COST = 0.05;
const SEAT_AXIS_COST = 0.12;
const SPRING_RESPONSE = 0.85;
const PATH_SPRING_RESPONSE = 0.25;
const INTERIOR_VISCOSITY = 3;
const MAX_PATH_ACCEL = 8;
const FIELD_RESPONSE = 1.8;
const MAX_GLIDE_SPEED = 140;
const MAX_FONT_SPEED = 28;
const MAX_ANGLE_SPEED = 160;
const SWITCH_GAIN = 2;
const FONT_FAMILY = 'Iowan Old Style, Palatino, "Palatino Linotype", Georgia, serif';

const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
const ease = (current: number, target: number, seconds: number, response: number): number =>
  current + (target - current) * (1 - Math.exp(-seconds / response));
const isLand = (kind: PlaceKind): boolean => kind === 'island' || kind === 'continent';
const trackingOf = (font: number): number => font * TRACKING_EM;
const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;
const axisDistance = (a: number, b: number): number => {
  const difference = Math.abs(a - b) % 180;
  return Math.min(difference, 180 - difference);
};

const springTo = (current: number, velocity: number, target: number, seconds: number): { value: number; velocity: number } => {
  const omega = 2 / SPRING_RESPONSE;
  const acceleration = (target - current) * omega * omega - 2 * omega * velocity;
  const nextVelocity = velocity + acceleration * seconds;
  return { value: current + nextVelocity * seconds, velocity: nextVelocity };
};

export const labelPositions = (label: PlaceLabel): Point[] => [{ x: label.x, y: label.y }];

export class PlaceTracker {
  private readonly measure = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  private readonly textMetrics = new Map<string, number>();
  private readonly distanceFields = new WeakMap<Uint8Array, Int16Array>();
  private readonly prefixFields = new WeakMap<Uint8Array, Int32Array>();
  private readonly tracks = new Map<number, Track>();
  private readonly usedStems = new Set<string>();
  private owners = new Uint16Array(0);
  private nextTrackId = 1;
  private nextPlacementId = 1;
  private width = 0;
  private height = 0;
  private viewport = { width: 1, height: 1 };
  private synced = false;
  private lastIngest = -1;

  reset(): void {
    this.tracks.clear();
    this.usedStems.clear();
    this.owners = new Uint16Array(0);
    this.width = 0;
    this.height = 0;
    this.synced = false;
    this.lastIngest = -1;
  }

  advance(seconds: number, mode: LabelMode, viewport: { width: number; height: number }): PlaceLabel[] {
    this.applyViewport(viewport);
    const dt = clamp(seconds, 0, 0.5);
    if (mode !== 'map') this.synced = false;
    for (const track of this.tracks.values()) {
      const observed = mode === 'map' && track.confirmed && track.missing === 0;
      track.agreement = ease(track.agreement, observed ? 1 : 0, dt, STABILITY_RESPONSE);
      track.stability = ease(track.stability, observed ? track.agreement : 0, dt, STABILITY_RESPONSE);
      const placement = track.placement;
      if (placement?.alive && track.present) this.glide(track, placement, dt);
      const bodies = placement ? [placement, ...track.ghosts] : track.ghosts;
      for (const body of bodies) {
        const visible = mode === 'map' && this.synced && track.present && track.confirmed
          && track.missing < 0.75 && body.alive;
        body.opacity = ease(body.opacity, visible ? track.stability : 0, dt, visible ? 0.25 : 0.45);
      }
      if (placement && !placement.alive && placement.opacity < 0.02) track.placement = null;
      track.ghosts = track.ghosts.filter((ghost) => ghost.opacity >= 0.02);
    }
    const labels = this.collect(dt);
    if (mode === 'chaos' && labels.length === 0) this.reset();
    return labels;
  }

  ingest(sample: RegionSample): void {
    if (sample.width < 2 || sample.height < 2 || sample.signs.length !== sample.width * sample.height) return;
    const now = performance.now() / 1000;
    const gap = this.lastIngest < 0 ? 0 : Math.min(2, now - this.lastIngest);
    this.lastIngest = now;
    for (const track of this.tracks.values()) track.present = false;
    if (sample.width !== this.width || sample.height !== this.height) {
      this.owners = this.regrid(this.owners, this.width, this.height, sample.width, sample.height);
      const remappedMasks: Uint8Array[] = [];
      for (const track of this.tracks.values()) {
        if (track.soft) track.soft = this.regridFloat(track.soft, this.width, this.height, sample.width, sample.height);
        if (track.lastMask) track.lastMask = this.regrid(track.lastMask, this.width, this.height, sample.width, sample.height);
        const bodies = track.placement ? [track.placement, ...track.ghosts] : track.ghosts;
        for (const placement of bodies) {
          const shared = placement.mask === placement.regionMask;
          placement.mask = this.regrid(placement.mask, this.width, this.height, sample.width, sample.height);
          placement.regionMask = shared ? placement.mask
            : this.regrid(placement.regionMask, this.width, this.height, sample.width, sample.height);
          remappedMasks.push(placement.mask);
          if (!shared) remappedMasks.push(placement.regionMask);
        }
      }
      this.width = sample.width;
      this.height = sample.height;
      for (const mask of remappedMasks) this.remember(mask);
    }
    const found = this.components(sample.signs);
    const places = found.filter((component) => component.role === 'place')
      .sort((a, b) => b.area - a.area)
      .slice(0, MAX_TRACKS);
    type Offer = { region: number; track: Track; overlap: number; distance: number };
    const offers: Offer[] = [];
    const offerFor = (region: number, track: Track, overlap: number): Offer => {
      const anchor = track.placement?.alive
        ? { x: track.placement.position.x / this.viewport.width, y: track.placement.position.y / this.viewport.height }
        : track.center;
      return { region, track, overlap, distance: this.distance(anchor, places[region].center) };
    };
    for (let i = 0; i < places.length; i += 1) {
      const overlaps = new Map<number, number>();
      for (const cell of places[i].cells) {
        const owner = this.owners[cell];
        if (owner) overlaps.set(owner, (overlaps.get(owner) ?? 0) + 1);
      }
      for (const [id, overlap] of overlaps) {
        const track = this.tracks.get(id);
        if (!track || isLand(track.kind) !== (places[i].sign > 0) || overlap <= 0) continue;
        offers.push(offerFor(i, track, overlap));
      }
    }
    const matchedRegions = new Set<number>();
    const matchedTracks = new Set<number>();
    const assignments: Array<{ track: Track; region: Component; overlap: number }> = [];
    const assign = (candidates: Offer[]): void => {
      candidates.sort((a, b) => a.track.id - b.track.id
        || a.distance - b.distance || b.overlap - a.overlap);
      for (const offer of candidates) {
        if (matchedRegions.has(offer.region) || matchedTracks.has(offer.track.id)) continue;
        matchedRegions.add(offer.region);
        matchedTracks.add(offer.track.id);
        assignments.push({ track: offer.track, region: places[offer.region], overlap: offer.overlap });
      }
    };
    assign(offers);
    // Keep a recently vanished name at its last footprint. The latest owners
    // map cannot represent a region during a brief disappearance or merge.
    const remembered: Offer[] = [];
    for (const track of this.tracks.values()) {
      if (matchedTracks.has(track.id) || !track.lastMask || track.missing >= NAME_COOLDOWN_SECONDS) continue;
      for (let i = 0; i < places.length; i += 1) {
        if (matchedRegions.has(i) || isLand(track.kind) !== (places[i].sign > 0)) continue;
        const bounds = places[i].bounds;
        if (track.bounds.x1 <= bounds.x0 || bounds.x1 <= track.bounds.x0
          || track.bounds.y1 <= bounds.y0 || bounds.y1 <= track.bounds.y0) continue;
        let overlap = 0;
        for (const cell of places[i].cells) overlap += track.lastMask[cell] ?? 0;
        if (overlap > 0) remembered.push(offerFor(i, track, overlap));
      }
    }
    assign(remembered);
    // Nearby continuation is used only after exact footprints have been
    // assigned. A distinct far region still receives a new identity.
    const nearby: Offer[] = [];
    for (const track of this.tracks.values()) {
      if (matchedTracks.has(track.id) || track.missing >= NAME_COOLDOWN_SECONDS) continue;
      for (let i = 0; i < places.length; i += 1) {
        const region = places[i];
        if (matchedRegions.has(i) || isLand(track.kind) !== (region.sign > 0)) continue;
        const balance = Math.min(track.area, region.area) / Math.max(track.area, region.area);
        const dx = Math.max(0, track.bounds.x0 - region.bounds.x1, region.bounds.x0 - track.bounds.x1) * this.width;
        const dy = Math.max(0, track.bounds.y0 - region.bounds.y1, region.bounds.y0 - track.bounds.y1) * this.height;
        const centerDistance = Math.hypot((track.center.x - region.center.x) * this.width,
          (track.center.y - region.center.y) * this.height);
        const radius = Math.sqrt(Math.min(track.area, region.area) / Math.PI);
        if (balance >= 0.5 && Math.hypot(dx, dy) <= 1.5
          && centerDistance <= Math.max(3, radius * 1.25)) nearby.push(offerFor(i, track, 0));
      }
    }
    assign(nearby);
    for (let i = 0; i < places.length; i += 1) {
      if (matchedRegions.has(i)) continue;
      const region = places[i];
      if (!region.kind) continue;
      const stem = createPlaceStem(Math.random, this.usedStems);
      this.usedStems.add(stem);
      const track: Track = {
        id: this.nextTrackId++, stem, kind: region.kind, text: placeLabel(region.kind, stem),
        area: region.area, stability: 0.15, agreement: 1, missing: 0, confirmed: true, present: false,
        center: region.center, bounds: region.bounds, lastMask: null,
        soft: null, placement: null, ghosts: [], styleFont: 0,
      };
      this.tracks.set(track.id, track);
      assignments.push({ track, region, overlap: 0 });
    }
    const nextOwners = new Uint16Array(sample.signs.length);
    for (const { track, region, overlap } of assignments) {
      track.present = true;
      if (overlap > 0) {
        const continuity = overlap / Math.min(track.area, region.area);
        track.agreement = Math.min(track.agreement, 0.65 + 0.35 * continuity);
      }
      // A track's name is immutable. Size-classification changes do not mint
      // a second name for the same place.
      track.area = region.area;
      track.center = region.center;
      track.bounds = region.bounds;
      track.missing = 0;
      track.confirmed = true;
      for (const cell of region.cells) nextOwners[cell] = track.id;
    }
    this.owners = nextOwners;
    for (const track of [...this.tracks.values()]) {
      if (assignments.some((entry) => entry.track === track)) continue;
      track.missing += gap;
      track.confirmed = false;
      if (track.missing > NAME_COOLDOWN_SECONDS) {
        this.tracks.delete(track.id);
        this.usedStems.delete(track.stem);
      }
    }
    if (this.viewport.width < 2 || this.viewport.height < 2) {
      this.synced = true;
      return;
    }
    for (const { track, region } of assignments) {
      const mask = this.allowedMask(region);
      track.lastMask = mask;
      this.remember(mask);
      this.smooth(track, mask, gap);
      this.aim(track, mask, gap);
    }
    this.synced = true;
  }

  private aim(track: Track, mask: Uint8Array, elapsed: number): void {
    const cellArea = this.viewport.width * this.viewport.height / mask.length;
    const naturalFont = clamp(Math.sqrt(track.area * cellArea / (Math.max(4, track.text.length) * 3.2)), MIN_FONT, MAX_FONT);
    track.styleFont = track.styleFont === 0 ? naturalFont : ease(track.styleFont, naturalFont, elapsed, 2.5);
    const field = this.landscape(mask, this.distanceFields.get(mask) as Int16Array,
      track.soft ?? Float32Array.from(mask), track.styleFont, track.area);
    const alive = track.placement?.alive ? track.placement : null;
    const prefer = alive?.angle ?? 0;
    const seats: Seat[] = [];
    const seatQuality = (index: number, pose: Pose): number => Math.max(0.01, field.quality[index]
      + 0.12 * pose.font / track.styleFont
      - SEAT_ORIENTATION_COST * Math.abs(pose.angle) / MAX_ANGLE
      - SEAT_AXIS_COST * field.elongation[index] * axisDistance(pose.angle, field.axis[index]) / MAX_ANGLE);
    for (const index of field.candidates) {
      const point = this.cellPoint(index);
      if (seats.some((seat) => this.distance(seat.pose, point) < field.radius * 0.55)) continue;
      const pose = this.poseAt(track.text, mask, point, track.styleFont, prefer,
        field.axis[index], field.elongation[index]);
      if (!pose) continue;
      seats.push({ pose, quality: seatQuality(index, pose) });
      if (seats.length >= 24) break;
    }
    if (alive) {
      const index = this.index(alive.position);
      if (index >= 0 && field.centerX[index] > 0) {
        const center = { x: field.centerX[index], y: field.centerY[index] };
        const seatIndex = this.index(center);
        const pose = seatIndex < 0 ? null : this.poseAt(track.text, mask, center, track.styleFont, prefer,
          field.axis[seatIndex], field.elongation[seatIndex]);
        if (pose && seatIndex >= 0) seats.push({ pose, quality: seatQuality(seatIndex, pose) });
      }
    }
    if (seats.length === 0) {
      if (alive) this.release(track);
      return;
    }
    seats.sort((a, b) => b.quality - a.quality);
    const global = seats[0];
    if (!alive) {
      track.placement = this.spawn(global.pose, mask);
      return;
    }
    const local = seats.filter((seat) => this.distance(seat.pose, alive.position) <= field.radius * 1.5)
      .sort((a, b) => (b.quality - this.distance(b.pose, alive.position) / (field.radius * 16))
        - (a.quality - this.distance(a.pose, alive.position) / (field.radius * 16)))[0];
    const here = this.index(alive.position);
    const homeQuality = local?.quality ?? (here >= 0 ? field.quality[here] : 0);
    const superior = global.quality > homeQuality * SWITCH_GAIN;
    const choice: Seat = local && global.quality <= local.quality * 1.08 ? local : global;
    const current = this.snapshot(alive);
    const nearbyMorph = this.distance(current, choice.pose) <= field.radius * 1.5;
    let travelMask = mask;
    let usedCurrentCorridor = false;
    if (!this.fitsPose(mask, track.text, current)) {
      // A changing coastline has swept over the old pose. Its recent union is
      // a temporal corridor, never a new destination or a permanent land mask.
      travelMask = this.union(alive.regionMask, mask);
      this.remember(travelMask);
      if (!this.fitsPose(travelMask, track.text, current)
        && nearbyMorph && alive.mask !== alive.regionMask) {
        // A body partway along a verified route can lag one observation behind.
        // Carry that route forward only while the destination is still local.
        travelMask = this.union(alive.mask, mask);
        this.remember(travelMask);
        usedCurrentCorridor = true;
      }
      if (!this.fitsPose(travelMask, track.text, current)) {
        this.relight(track, choice.pose, mask);
        return;
      }
    }
    let route = this.planRoute(track.text, travelMask, current, choice.pose);
    if (!route && travelMask !== mask && nearbyMorph && !usedCurrentCorridor
      && alive.mask !== alive.regionMask) {
      const continuedMask = this.union(alive.mask, mask);
      this.remember(continuedMask);
      if (this.fitsPose(continuedMask, track.text, current)) {
        const continuedRoute = this.planRoute(track.text, continuedMask, current, choice.pose);
        if (continuedRoute) {
          travelMask = continuedMask;
          route = continuedRoute;
        }
      }
    }
    if (!route) {
      // A better nearby seat is not a reason to blink. Keep the legal pose
      // until a continuous route opens; only a drowned pose needs relocation.
      if (travelMask !== mask
        || (superior && this.distance(current, choice.pose) > field.radius * 1.5)) {
        this.relight(track, choice.pose, mask);
      }
      return;
    }
    alive.mask = travelMask;
    alive.regionMask = mask;
    alive.target = choice.pose;
    alive.route = route;
  }

  private poseAt(text: string, mask: Uint8Array, point: Point, desiredFont: number,
    prefer: number, axis: number, elongation: number): Pose | null {
    const index = this.index(point);
    if (index < 0 || !mask[index]) return null;
    let best: Pose | null = null;
    let bestScore = -Infinity;
    const horizontalCapacity = this.maxFont(mask, text, point, 0);
    if (horizontalCapacity >= MIN_FONT) {
      const font = Math.min(desiredFont, Math.max(MIN_FONT, horizontalCapacity * 0.9));
      best = { x: point.x, y: point.y, font, angle: 0 };
      bestScore = font / desiredFont - AXIS_COST * elongation * axisDistance(0, axis) / MAX_ANGLE
        - 0.02 * axisDistance(0, prefer) / MAX_ANGLE;
    }
    for (let tilt = ANGLE_STEP; tilt <= MAX_ANGLE; tilt += ANGLE_STEP) {
      // A larger tilt pays more readability cost. Once even its maximum font
      // cannot win, every remaining angle is dominated by the current pose.
      const ceiling = Math.min(desiredFont, MAX_FONT * 0.9) / desiredFont
        - ORIENTATION_COST * tilt / MAX_ANGLE;
      if (bestScore >= ceiling) break;
      for (const angle of [-tilt, tilt]) {
        const capacity = this.maxFont(mask, text, point, angle);
        if (capacity < MIN_FONT) continue;
        const font = Math.min(desiredFont, Math.max(MIN_FONT, capacity * 0.9));
        const score = font / desiredFont - ORIENTATION_COST * tilt / MAX_ANGLE
          - AXIS_COST * elongation * axisDistance(angle, axis) / MAX_ANGLE
          - 0.02 * axisDistance(angle, prefer) / MAX_ANGLE;
        if (score > bestScore) {
          best = { x: point.x, y: point.y, font, angle };
          bestScore = score;
        }
      }
    }
    return best;
  }

  private landscape(mask: Uint8Array, depth: Int16Array, soft: Float32Array, font: number, area: number): Landscape {
    const stride = this.width + 1;
    const length = stride * (this.height + 1);
    const mass = new Float64Array(length);
    const momentX = new Float64Array(length);
    const momentY = new Float64Array(length);
    const momentXX = new Float64Array(length);
    const momentYY = new Float64Array(length);
    const momentXY = new Float64Array(length);
    const quality = new Float32Array(mask.length);
    const centerX = new Float32Array(mask.length);
    const centerY = new Float32Array(mask.length);
    const axis = new Float32Array(mask.length);
    const elongation = new Float32Array(mask.length);
    const cell = Math.min(this.viewport.width / this.width, this.viewport.height / this.height);
    const radius = Math.min(Math.min(this.viewport.width, this.viewport.height) * 0.32,
      Math.max(font * 3.5, Math.sqrt(area * cell * cell) * 0.33, cell * 3));
    const rx = Math.max(1, Math.ceil(radius * this.width / this.viewport.width));
    const ry = Math.max(1, Math.ceil(radius * this.height / this.viewport.height));
    for (let y = 0; y < this.height; y += 1) {
      let rowMass = 0;
      let rowX = 0;
      let rowY = 0;
      let rowXX = 0;
      let rowYY = 0;
      let rowXY = 0;
      for (let x = 0; x < this.width; x += 1) {
        const index = x + y * this.width;
        const weight = mask[index] * (0.85 + 0.15 * soft[index])
          * clamp(depth[index] * cell / (font * 2), 0, 1);
        const point = this.cellPoint(index);
        rowMass += weight;
        rowX += weight * point.x;
        rowY += weight * point.y;
        rowXX += weight * point.x * point.x;
        rowYY += weight * point.y * point.y;
        rowXY += weight * point.x * point.y;
        const at = (y + 1) * stride + x + 1;
        mass[at] = mass[at - stride] + rowMass;
        momentX[at] = momentX[at - stride] + rowX;
        momentY[at] = momentY[at - stride] + rowY;
        momentXX[at] = momentXX[at - stride] + rowXX;
        momentYY[at] = momentYY[at - stride] + rowYY;
        momentXY[at] = momentXY[at - stride] + rowXY;
      }
    }
    const sum = (field: Float64Array, x0: number, y0: number, x1: number, y1: number): number =>
      field[y1 * stride + x1] - field[y0 * stride + x1] - field[y1 * stride + x0] + field[y0 * stride + x0];
    const total = mass[length - 1];
    const globalCenter = total > 0
      ? { x: momentX[length - 1] / total, y: momentY[length - 1] / total }
      : { x: this.viewport.width / 2, y: this.viewport.height / 2 };
    const ranked: number[] = [];
    for (let index = 0; index < mask.length; index += 1) {
      if (!mask[index]) continue;
      const x = index % this.width;
      const y = Math.floor(index / this.width);
      const x0 = Math.max(0, x - rx);
      const y0 = Math.max(0, y - ry);
      const x1 = Math.min(this.width, x + rx + 1);
      const y1 = Math.min(this.height, y + ry + 1);
      const nearby = sum(mass, x0, y0, x1, y1);
      if (nearby <= 0) continue;
      centerX[index] = sum(momentX, x0, y0, x1, y1) / nearby;
      centerY[index] = sum(momentY, x0, y0, x1, y1) / nearby;
      const varianceX = Math.max(0, sum(momentXX, x0, y0, x1, y1) / nearby - centerX[index] ** 2);
      const varianceY = Math.max(0, sum(momentYY, x0, y0, x1, y1) / nearby - centerY[index] ** 2);
      const covariance = sum(momentXY, x0, y0, x1, y1) / nearby - centerX[index] * centerY[index];
      const separation = Math.hypot(varianceX - varianceY, 2 * covariance);
      axis[index] = 0.5 * Math.atan2(2 * covariance, varianceX - varianceY) * 180 / Math.PI;
      elongation[index] = clamp(separation / (varianceX + varianceY + 1), 0, 1);
      const density = nearby / ((rx * 2 + 1) * (ry * 2 + 1));
      const clearance = clamp(depth[index] * cell / (font * 2), 0, 1);
      quality[index] = 0.7 * density + 0.3 * clearance
        - 0.08 * this.distance(this.cellPoint(index), globalCenter) / radius;
      ranked.push(index);
    }
    ranked.sort((a, b) => quality[b] - quality[a]);
    return { quality, centerX, centerY, axis, elongation, candidates: ranked, radius };
  }

  private union(left: Uint8Array, right: Uint8Array): Uint8Array {
    const result = new Uint8Array(right.length);
    for (let index = 0; index < result.length; index += 1) result[index] = left[index] | right[index];
    return result;
  }

  /** Route the entire inscription through legal poses, shrinking only if the corridor requires it. */
  private planRoute(text: string, mask: Uint8Array, from: Pose, to: Pose): Pose[] | null {
    if (this.posesFit(mask, text, from, to)) return [to];
    let font = Math.min(from.font, to.font);
    for (let attempt = 0; attempt < 9; attempt += 1) {
      font = Math.max(MIN_FONT, font);
      for (const angle of [...new Set([from.angle, to.angle, 0])]) {
        const shrink: Pose = { ...from, font };
        const start: Pose = { ...shrink, angle };
        const goal: Pose = { ...to, font, angle };
        const turnAtGoal: Pose = { ...to, font };
        if (!this.posesFit(mask, text, from, shrink)
          || !this.posesFit(mask, text, shrink, start)
          || !this.posesFit(mask, text, goal, turnAtGoal)
          || !this.posesFit(mask, text, turnAtGoal, to)) continue;
        const route: Pose[] = [];
        if (Math.abs(from.font - font) > 0.05) route.push(shrink);
        if (Math.abs(from.angle - angle) > 0.05) route.push(start);
        if (this.posesFit(mask, text, start, goal)) {
          route.push(goal);
          if (Math.abs(to.angle - angle) > 0.05) route.push(turnAtGoal);
          route.push(to);
          return route;
        }
        const cells = this.legalPath(text, mask, start, goal);
        if (!cells) continue;
        let anchor = start;
        let valid = true;
        for (let position = 0; position < cells.length;) {
          let furthest = -1;
          for (let next = cells.length - 1; next >= position; next -= 1) {
            const point = this.cellPoint(cells[next]);
            const candidate = { ...point, font, angle };
            if (this.posesFit(mask, text, anchor, candidate)) {
              furthest = next;
              break;
            }
          }
          if (furthest < 0) {
            valid = false;
            break;
          }
          const waypoint = { ...this.cellPoint(cells[furthest]), font, angle };
          if (this.distance(anchor, waypoint) > 0.5) route.push(waypoint);
          anchor = waypoint;
          position = furthest + 1;
        }
        if (!valid || !this.posesFit(mask, text, anchor, goal)) continue;
        if (this.distance(anchor, goal) > 0.5) route.push(goal);
        if (Math.abs(to.angle - angle) > 0.05) route.push(turnAtGoal);
        route.push(to);
        return route;
      }
      if (font <= MIN_FONT) break;
      font = Math.max(MIN_FONT, font * 0.82);
    }
    return null;
  }

  private legalPath(text: string, mask: Uint8Array, from: Pose, to: Pose): number[] | null {
    const state = new Uint8Array(mask.length);
    const legal = (index: number): boolean => {
      if (state[index] === 0) {
        const pose = { ...this.cellPoint(index), font: from.font, angle: from.angle };
        state[index] = mask[index] && this.fitsPose(mask, text, pose) ? 1 : 2;
      }
      return state[index] === 1;
    };
    const endpoint = (pose: Pose): number => {
      const cell = this.index(pose);
      if (cell < 0) return -1;
      const x = cell % this.width;
      const y = Math.floor(cell / this.width);
      for (let radius = 0; radius <= 3; radius += 1) {
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
            const index = nx + ny * this.width;
            if (legal(index) && this.posesFit(mask, text, pose,
              { ...this.cellPoint(index), font: from.font, angle: from.angle })) return index;
          }
        }
      }
      return -1;
    };
    const start = endpoint(from);
    const goal = endpoint(to);
    if (start < 0 || goal < 0) return null;
    const previous = new Int32Array(mask.length).fill(-1);
    const queue = new Int32Array(mask.length);
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    previous[start] = start;
    while (head < tail && previous[goal] < 0) {
      const index = queue[head++];
      const x = index % this.width;
      const y = Math.floor(index / this.width);
      for (const next of [x > 0 ? index - 1 : -1, x + 1 < this.width ? index + 1 : -1,
        y > 0 ? index - this.width : -1, y + 1 < this.height ? index + this.width : -1]) {
        if (next < 0 || previous[next] >= 0 || !legal(next)) continue;
        previous[next] = index;
        queue[tail++] = next;
      }
    }
    if (previous[goal] < 0) return null;
    const path: number[] = [];
    for (let index = goal; index !== start; index = previous[index]) path.push(index);
    path.push(start);
    path.reverse();
    return path;
  }

  private glide(track: Track, placement: Placement, dt: number): void {
    if (dt <= 0) return;
    const from = this.snapshot(placement);
    if (!this.fitsPose(placement.mask, track.text, from)) {
      const legal = this.maxFont(placement.mask, track.text, placement.position, placement.angle);
      placement.velocity = { x: 0, y: 0 };
      placement.angleVelocity = 0;
      if (legal < MIN_FONT) {
        placement.fontVelocity = 0;
        return;
      }
      const font = springTo(placement.font, placement.fontVelocity, Math.min(placement.target.font, legal), dt);
      placement.font = Math.max(legal, Math.min(placement.font, font.value));
      placement.fontVelocity = placement.font <= legal ? 0 : font.velocity;
      return;
    }
    while (placement.route.length > 1 && this.distance(from, placement.route[0]) < 0.75
      && Math.abs(from.font - placement.route[0].font) < 0.15
      && Math.abs(from.angle - placement.route[0].angle) < 0.3) placement.route.shift();
    const aim = placement.route[0] ?? placement.target;
    if (this.posesFit(placement.mask, track.text, from, aim)
      && this.distance(from, aim) < 0.2
      && Math.abs(from.font - aim.font) < 0.05
      && Math.abs(from.angle - aim.angle) < 0.05) {
      placement.position = { x: aim.x, y: aim.y };
      placement.font = aim.font;
      placement.angle = aim.angle;
      placement.velocity = { x: 0, y: 0 };
      placement.fontVelocity = 0;
      placement.angleVelocity = 0;
      if (placement.route.length > 0) placement.route.shift();
      if (placement.route.length === 0 && this.fitsPose(placement.regionMask, track.text, this.snapshot(placement))) {
        placement.mask = placement.regionMask;
      }
      return;
    }
    // Route segments were checked by posesFit as one interpolation in pose
    // space. Advance position, font and angle with the same parameter so the
    // rendered body stays on that checked path.
    const touchingCoast = !this.fitsPose(placement.regionMask, track.text, from);
    const viscosity = touchingCoast ? 1 : INTERIOR_VISCOSITY;
    const glideSpeed = MAX_GLIDE_SPEED / viscosity;
    const fontSpeed = MAX_FONT_SPEED / viscosity;
    const angleSpeed = MAX_ANGLE_SPEED / viscosity;
    const displacement = this.distance(from, aim);
    const moveDuration = displacement / glideSpeed;
    const fontDuration = Math.abs(aim.font - from.font) / fontSpeed;
    const turnDuration = Math.abs(aim.angle - from.angle) / angleSpeed;
    const duration = Math.max(moveDuration, fontDuration, turnDuration);
    let pathSpeed = 0;
    if (duration === moveDuration && displacement > 0) {
      pathSpeed = ((aim.x - from.x) * placement.velocity.x
        + (aim.y - from.y) * placement.velocity.y) / displacement / glideSpeed;
    } else if (duration === fontDuration && fontDuration > 0) {
      pathSpeed = Math.sign(aim.font - from.font) * placement.fontVelocity / fontSpeed;
    } else if (turnDuration > 0) {
      pathSpeed = Math.sign(aim.angle - from.angle) * placement.angleVelocity / angleSpeed;
    }
    // A retarget may put the new aim behind the current motion. Keep that
    // signed momentum so turning and translation brake before reversing.
    pathSpeed = clamp(pathSpeed, -1, 1);
    const omega = 2 / (PATH_SPRING_RESPONSE * viscosity);
    const acceleration = clamp(omega * omega * duration - 2 * omega * pathSpeed,
      -MAX_PATH_ACCEL, MAX_PATH_ACCEL);
    const nextSpeed = clamp(pathSpeed + acceleration * dt, -1, 1);
    const progress = Math.min(duration, (pathSpeed + nextSpeed) * dt / 2);
    let pose = this.lerpPose(from, aim, duration > 0 ? progress / duration : 1);
    if (!(progress < 0
      ? this.posesFit(placement.mask, track.text, from, pose)
      : this.fitsPose(placement.mask, track.text, pose))) {
      const fitted = this.longestLegal(track.text, placement.mask, from, pose);
      if (!fitted) {
        placement.velocity = { x: 0, y: 0 };
        placement.fontVelocity = 0;
        placement.angleVelocity = 0;
        return;
      }
      pose = fitted;
    }
    const scale = dt > 0 ? 1 / dt : 0;
    placement.position = { x: pose.x, y: pose.y };
    placement.velocity = { x: (pose.x - from.x) * scale, y: (pose.y - from.y) * scale };
    placement.font = pose.font;
    placement.fontVelocity = (pose.font - from.font) * scale;
    placement.angle = pose.angle;
    placement.angleVelocity = (pose.angle - from.angle) * scale;
  }

  private collect(dt: number): PlaceLabel[] {
    const entries: Array<{ track: Track; placement: Placement }> = [];
    for (const track of this.tracks.values()) {
      const bodies = track.placement ? [track.placement, ...track.ghosts] : track.ghosts;
      for (const placement of bodies) {
        if (placement.opacity < 0.015) continue;
        if (!this.fitsPose(placement.mask, track.text, this.snapshot(placement))) continue;
        entries.push({ track, placement });
      }
    }
    entries.sort((a, b) => b.track.area - a.track.area);
    const accepted: typeof entries = [];
    const labels: PlaceLabel[] = [];
    for (const item of entries) {
      const { track, placement } = item;
      const blocked = accepted.some((other) => other.track !== track && this.overlaps(
        track.text, this.snapshot(placement), other.track.text, this.snapshot(other.placement),
      ));
      placement.collisionOpacity = ease(placement.collisionOpacity, blocked ? 0 : 1, dt, blocked ? 0.3 : 0.7);
      if (!blocked) accepted.push(item);
      const opacity = placement.opacity * placement.collisionOpacity;
      if (opacity < 0.015) continue;
      labels.push({
        id: placement.id, kind: track.kind, text: track.text,
        x: placement.position.x, y: placement.position.y,
        width: this.boxWidth(track.text, placement.font, trackingOf(placement.font)),
        height: placement.font * TEXT_HEIGHT_EM,
        opacity, fontSize: placement.font, letterSpacing: trackingOf(placement.font), angle: placement.angle,
      });
    }
    return labels;
  }

  private relight(track: Track, pose: Pose, mask: Uint8Array): void {
    const current = track.placement;
    if (current) {
      const oldPose = this.snapshot(current);
      // Two renderings whose footprints intersect are the same visual place.
      // If its shape cannot accommodate the turn yet, wait at the last legal
      // pose instead of fading out and respawning at a different angle there.
      if (this.fitsPose(current.mask, track.text, oldPose)
        && this.overlaps(track.text, oldPose, track.text, pose)) {
        current.target = oldPose;
        current.route = [];
        current.velocity = { x: 0, y: 0 };
        current.fontVelocity = 0;
        current.angleVelocity = 0;
        current.regionMask = mask;
        return;
      }
      current.alive = false;
      track.ghosts.push(current);
    }
    track.placement = this.spawn(pose, mask);
  }

  private release(track: Track): void {
    if (track.placement) {
      track.placement.alive = false;
      track.ghosts.push(track.placement);
    }
    track.placement = null;
  }

  private spawn(pose: Pose, mask: Uint8Array): Placement {
    return {
      id: this.nextPlacementId++,
      position: { x: pose.x, y: pose.y },
      velocity: { x: 0, y: 0 },
      font: pose.font,
      fontVelocity: 0,
      angle: pose.angle,
      angleVelocity: 0,
      target: { ...pose },
      opacity: 0,
      collisionOpacity: 1,
      mask,
      regionMask: mask,
      alive: true,
      route: [],
    };
  }

  private smooth(track: Track, mask: Uint8Array, seconds: number): void {
    if (!track.soft || track.soft.length !== mask.length) {
      track.soft = Float32Array.from(mask);
      return;
    }
    const alpha = 1 - Math.exp(-seconds / FIELD_RESPONSE);
    const soft = track.soft;
    for (let index = 0; index < mask.length; index += 1) soft[index] += (mask[index] - soft[index]) * alpha;
  }

  private allowedMask(region: Component): Uint8Array {
    const mask = new Uint8Array(this.width * this.height);
    for (const cell of region.cells) mask[cell] = 1;
    return mask;
  }

  private components(signs: Int8Array): Component[] {
    const seen = new Uint8Array(signs.length);
    const componentAt = new Int32Array(signs.length);
    const found: Component[] = [];
    for (let start = 0; start < signs.length; start += 1) {
      if (seen[start]) continue;
      const componentId = found.length;
      const sign = signs[start] < 0 ? -1 : 1;
      const cells: number[] = [];
      let sumX = 0;
      let sumY = 0;
      let minX = this.width;
      let minY = this.height;
      let maxX = 0;
      let maxY = 0;
      const stack = [start];
      seen[start] = 1;
      while (stack.length) {
        const index = stack.pop() as number;
        cells.push(index);
        componentAt[index] = componentId;
        const x = index % this.width;
        const y = Math.floor(index / this.width);
        sumX += x + 0.5;
        sumY += y + 0.5;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + 1);
        maxY = Math.max(maxY, y + 1);
        for (const next of this.neighbors(index)) {
          if (seen[next] || (signs[next] < 0 ? -1 : 1) !== sign) continue;
          seen[next] = 1;
          stack.push(next);
        }
      }
      const fraction = cells.length / signs.length;
      let kind: PlaceKind | null = null;
      let role: Component['role'] = 'hole';
      if (sign > 0) {
        if (fraction >= LARGE_FRACTION) {
          kind = 'continent';
          role = 'place';
        } else if (fraction >= MIN_ISLAND_FRACTION) {
          kind = 'island';
          role = 'place';
        }
      } else if ((maxX - minX > this.width * MAX_LAKE_SIDE_FRACTION
        && maxY - minY > this.height * MAX_LAKE_SIDE_FRACTION)
        || minX === 0 || minY === 0 || maxX === this.width || maxY === this.height) {
        role = 'sea';
      } else if (fraction >= MIN_REGION_FRACTION) {
        kind = 'lake';
        role = 'place';
      }
      found.push({ sign, area: cells.length, cells, kind, role,
        center: { x: sumX / cells.length / this.width, y: sumY / cells.length / this.height },
        bounds: { x0: minX / this.width, y0: minY / this.height,
          x1: maxX / this.width, y1: maxY / this.height } });
    }
    for (const component of found) {
      if (component.kind !== 'lake') continue;
      const shore = new Map<number, number>();
      let total = 0;
      for (const cell of component.cells) {
        for (const neighbor of this.neighbors(cell)) {
          const owner = componentAt[neighbor];
          if (found[owner].sign < 0) continue;
          shore.set(owner, (shore.get(owner) ?? 0) + 1);
          total += 1;
        }
      }
      // A lake belongs to one landmass. Water between several equally sized
      // shores is a strait or sea, even when its footprint is small.
      if (total === 0 || Math.max(...shore.values()) * 5 < total * 4) {
        component.kind = null;
        component.role = 'sea';
      }
    }
    return found;
  }

  private remember(mask: Uint8Array): void {
    this.distanceFields.set(mask, this.depth(mask));
    this.prefixFields.set(mask, this.prefix(mask));
  }

  private depth(mask: Uint8Array): Int16Array {
    const distances = new Int16Array(mask.length).fill(-1);
    const queue = new Int32Array(mask.length);
    let tail = 0;
    for (let index = 0; index < mask.length; index += 1) {
      const x = index % this.width;
      const y = Math.floor(index / this.width);
      if (!mask[index] || x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
        distances[index] = 0;
        queue[tail++] = index;
      }
    }
    for (let head = 0; head < tail; head += 1) {
      const index = queue[head];
      const x = index % this.width;
      const y = Math.floor(index / this.width);
      for (const next of [
        x > 0 ? index - 1 : -1,
        x + 1 < this.width ? index + 1 : -1,
        y > 0 ? index - this.width : -1,
        y + 1 < this.height ? index + this.width : -1,
      ]) {
        if (next < 0 || distances[next] >= 0) continue;
        distances[next] = distances[index] + 1;
        queue[tail++] = next;
      }
    }
    return distances;
  }

  private prefix(mask: Uint8Array): Int32Array {
    const stride = this.width + 1;
    const sums = new Int32Array(stride * (this.height + 1));
    for (let y = 0; y < this.height; y += 1) {
      let row = 0;
      for (let x = 0; x < this.width; x += 1) {
        row += mask[x + y * this.width];
        sums[(y + 1) * stride + x + 1] = sums[y * stride + x + 1] + row;
      }
    }
    return sums;
  }

  private maxFont(mask: Uint8Array, text: string, point: Point, angle: number): number {
    if (!this.fits(mask, text, point, MIN_FONT, trackingOf(MIN_FONT), angle)) return 0;
    if (this.fits(mask, text, point, MAX_FONT, trackingOf(MAX_FONT), angle)) return MAX_FONT;
    let low = MIN_FONT;
    let high = MAX_FONT;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const middle = (low + high) / 2;
      if (this.fits(mask, text, point, middle, trackingOf(middle), angle)) low = middle;
      else high = middle;
    }
    return low;
  }

  private fitsPose(mask: Uint8Array, text: string, pose: Pose): boolean {
    return Math.abs(pose.angle) <= MAX_ANGLE
      && this.fits(mask, text, pose, pose.font, trackingOf(pose.font), pose.angle);
  }

  private posesFit(mask: Uint8Array, text: string, from: Pose, to: Pose): boolean {
    if (!this.fitsPose(mask, text, from) || !this.fitsPose(mask, text, to)) return false;
    const steps = Math.max(1, Math.ceil(Math.max(
      this.distance(from, to) / 4,
      Math.abs(from.font - to.font),
      Math.abs(from.angle - to.angle) / 2,
    )));
    for (let step = 1; step < steps; step += 1) {
      if (!this.fitsPose(mask, text, this.lerpPose(from, to, step / steps))) return false;
    }
    return true;
  }

  private longestLegal(text: string, mask: Uint8Array, from: Pose, to: Pose): Pose | null {
    if (!this.fitsPose(mask, text, from)) return null;
    let low = 0;
    let high = 1;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const middle = (low + high) / 2;
      if (this.posesFit(mask, text, from, this.lerpPose(from, to, middle))) low = middle;
      else high = middle;
    }
    if (low <= 0) return null;
    return this.lerpPose(from, to, low);
  }

  private fits(mask: Uint8Array, text: string, point: Point, font: number, tracking: number, angle: number): boolean {
    if (mask.length !== this.width * this.height || this.width < 2 || this.height < 2) return false;
    const cell = Math.min(this.viewport.width / this.width, this.viewport.height / this.height);
    const margin = Math.max(COAST_MARGIN_PX, cell * 1.25);
    const halfW = this.boxWidth(text, font, tracking) / 2 + margin;
    const halfH = font * TEXT_HEIGHT_EM / 2 + margin;
    const radians = angle * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const extentX = Math.abs(halfW * cos) + Math.abs(halfH * sin);
    const extentY = Math.abs(halfW * sin) + Math.abs(halfH * cos);
    if (point.x - extentX < 0 || point.y - extentY < 0
      || point.x + extentX > this.viewport.width || point.y + extentY > this.viewport.height) return false;
    const sums = this.prefixFields.get(mask);
    if (sums) {
      const x0 = Math.floor((point.x - extentX) * this.width / this.viewport.width);
      const y0 = Math.floor((point.y - extentY) * this.height / this.viewport.height);
      const x1 = Math.min(this.width, Math.ceil((point.x + extentX) * this.width / this.viewport.width));
      const y1 = Math.min(this.height, Math.ceil((point.y + extentY) * this.height / this.viewport.height));
      const stride = this.width + 1;
      const total = sums[y1 * stride + x1] - sums[y0 * stride + x1] - sums[y1 * stride + x0] + sums[y0 * stride + x0];
      if (total === (x1 - x0) * (y1 - y0)) return true;
    }
    const field = this.distanceFields.get(mask);
    const center = this.index(point);
    if (field && center >= 0) {
      const cell = Math.min(this.viewport.width / this.width, this.viewport.height / this.height);
      const safeRadius = Math.max(0, (field[center] - 2) * cell / Math.SQRT2);
      if (safeRadius >= Math.hypot(halfW, halfH)) return true;
    }
    const step = Math.max(1, Math.min(this.viewport.width / this.width, this.viewport.height / this.height) * 0.25);
    const columns = Math.max(2, Math.ceil(halfW * 2 / step));
    const rows = Math.max(2, Math.ceil(halfH * 2 / step));
    for (let row = 0; row <= rows; row += 1) {
      const y = -halfH + row * halfH * 2 / rows;
      for (let column = 0; column <= columns; column += 1) {
        const x = -halfW + column * halfW * 2 / columns;
        const sx = Math.floor((point.x + x * cos - y * sin) * this.width / this.viewport.width);
        const sy = Math.floor((point.y + x * sin + y * cos) * this.height / this.viewport.height);
        if (sx < 0 || sy < 0 || sx >= this.width || sy >= this.height || !mask[sx + sy * this.width]) return false;
      }
    }
    return true;
  }

  private overlaps(textA: string, a: Pose, textB: string, b: Pose): boolean {
    const extent = (text: string, pose: Pose): Point => {
      const radians = pose.angle * Math.PI / 180;
      const w = this.boxWidth(text, pose.font, trackingOf(pose.font)) / 2 + 7;
      const h = pose.font * TEXT_HEIGHT_EM / 2 + 7;
      return {
        x: Math.abs(w * Math.cos(radians)) + Math.abs(h * Math.sin(radians)),
        y: Math.abs(w * Math.sin(radians)) + Math.abs(h * Math.cos(radians)),
      };
    };
    const ea = extent(textA, a);
    const eb = extent(textB, b);
    return Math.abs(a.x - b.x) < ea.x + eb.x && Math.abs(a.y - b.y) < ea.y + eb.y;
  }

  private applyViewport(viewport: { width: number; height: number }): void {
    const previous = this.viewport;
    if (previous.width > 1 && previous.height > 1
      && (previous.width !== viewport.width || previous.height !== viewport.height)) {
      const sx = viewport.width / previous.width;
      const sy = viewport.height / previous.height;
      const sf = (sx + sy) / 2;
      for (const track of this.tracks.values()) {
        track.styleFont = clamp(track.styleFont * sf, MIN_FONT, MAX_FONT);
        const bodies = track.placement ? [track.placement, ...track.ghosts] : track.ghosts;
        for (const placement of bodies) this.scalePlacement(placement, sx, sy, sf);
      }
    }
    this.viewport = viewport;
  }

  private scalePlacement(placement: Placement, sx: number, sy: number, sf: number): void {
    placement.position = { x: placement.position.x * sx, y: placement.position.y * sy };
    placement.velocity = { x: placement.velocity.x * sx, y: placement.velocity.y * sy };
    placement.font = clamp(placement.font * sf, MIN_FONT, MAX_FONT);
    placement.fontVelocity *= sf;
    placement.target = {
      x: placement.target.x * sx,
      y: placement.target.y * sy,
      font: clamp(placement.target.font * sf, MIN_FONT, MAX_FONT),
      angle: placement.target.angle,
    };
    placement.route = placement.route.map((pose) => ({
      x: pose.x * sx, y: pose.y * sy, font: clamp(pose.font * sf, MIN_FONT, MAX_FONT), angle: pose.angle,
    }));
  }

  private regrid<T extends Uint8Array | Uint16Array>(source: T, oldW: number, oldH: number, newW: number, newH: number): T {
    const target = new (source.constructor as { new(length: number): T })(newW * newH);
    if (source.length !== oldW * oldH || oldW < 1 || oldH < 1) return target;
    for (let y = 0; y < newH; y += 1) {
      for (let x = 0; x < newW; x += 1) {
        target[x + y * newW] = source[
          Math.min(oldW - 1, Math.floor((x + 0.5) * oldW / newW))
          + Math.min(oldH - 1, Math.floor((y + 0.5) * oldH / newH)) * oldW
        ];
      }
    }
    return target;
  }

  private regridFloat(source: Float32Array, oldW: number, oldH: number, newW: number, newH: number): Float32Array {
    const target = new Float32Array(newW * newH);
    if (source.length !== oldW * oldH || oldW < 1 || oldH < 1) return target;
    for (let y = 0; y < newH; y += 1) {
      for (let x = 0; x < newW; x += 1) {
        target[x + y * newW] = source[
          Math.min(oldW - 1, Math.floor((x + 0.5) * oldW / newW))
          + Math.min(oldH - 1, Math.floor((y + 0.5) * oldH / newH)) * oldW
        ];
      }
    }
    return target;
  }

  private neighbors(index: number): number[] {
    const x = index % this.width;
    const y = Math.floor(index / this.width);
    return [
      ((x + 1) % this.width) + y * this.width,
      ((x - 1 + this.width) % this.width) + y * this.width,
      x + ((y + 1) % this.height) * this.width,
      x + ((y - 1 + this.height) % this.height) * this.width,
    ];
  }

  private snapshot(placement: Placement): Pose {
    return { x: placement.position.x, y: placement.position.y, font: placement.font, angle: placement.angle };
  }

  private lerpPose(from: Pose, to: Pose, t: number): Pose {
    return {
      x: lerp(from.x, to.x, t),
      y: lerp(from.y, to.y, t),
      font: lerp(from.font, to.font, t),
      angle: lerp(from.angle, to.angle, t),
    };
  }

  private index(point: Point): number {
    const x = Math.floor(point.x * this.width / this.viewport.width);
    const y = Math.floor(point.y * this.height / this.viewport.height);
    return x >= 0 && x < this.width && y >= 0 && y < this.height ? x + y * this.width : -1;
  }

  private cellPoint(index: number): Point {
    return {
      x: ((index % this.width) + 0.5) * this.viewport.width / this.width,
      y: (Math.floor(index / this.width) + 0.5) * this.viewport.height / this.height,
    };
  }

  private distance(a: Point, b: Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private boxWidth(text: string, font: number, tracking: number): number {
    const italic = text.startsWith('Lake ');
    if (!this.measure) return text.length * (font * (italic ? 0.58 : 0.56) + tracking) + 4;
    const key = italic ? `i:${text}` : text;
    let unitWidth = this.textMetrics.get(key);
    if (unitWidth === undefined) {
      this.measure.font = `${italic ? 'italic ' : ''}500 100px ${FONT_FAMILY}`;
      this.measure.fontKerning = 'none';
      unitWidth = this.measure.measureText(text).width / 100;
      this.textMetrics.set(key, unitWidth);
    }
    return unitWidth * font + text.length * tracking + 4;
  }
}
