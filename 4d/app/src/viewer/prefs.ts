import type { Angles, ObjectId, TiltMode, ViewMode } from '../math/types';

const KEY = '4d-viewer';

export type StoredPrefs = {
  viewMode: ViewMode;
  objectId: ObjectId;
  objectSize: number;
  eyeSep: number;
  stereoGap: number;
  projectionDistance: number;
  sliceCount: number;
  meshOpacity: number;
  angles: Angles;
  tiltMode: TiltMode;
  tiltInvert: boolean;
  parallaxPan: number;
  parallaxZoom: number;
};

const VIEW_MODES = new Set<ViewMode>(['mono', 'cross', 'parallel']);
const OBJECT_IDS = new Set<ObjectId>(['tesseract', 'matryoshka']);
const TILT_MODES = new Set<TiltMode>(['off', 'xyz', 'xw-yw', 'zw']);
const ANGLE_KEYS: Array<keyof Angles> = ['xy', 'xz', 'yz', 'xw', 'yw', 'zw'];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function consumeResetQuery(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.get('reset') !== '1') return false;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore quota / private mode */
  }
  params.delete('reset');
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  return true;
}

export function loadPrefs(): Partial<StoredPrefs> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object') return null;
    return sanitize(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

function sanitize(data: Record<string, unknown>): Partial<StoredPrefs> {
  const out: Partial<StoredPrefs> = {};
  if (typeof data.viewMode === 'string' && VIEW_MODES.has(data.viewMode as ViewMode)) {
    out.viewMode = data.viewMode as ViewMode;
  }
  if (typeof data.objectId === 'string' && OBJECT_IDS.has(data.objectId as ObjectId)) {
    out.objectId = data.objectId as ObjectId;
  }
  const objectSize = num(data.objectSize);
  if (objectSize !== null) out.objectSize = clamp(objectSize, 0.4, 2.2);
  const eyeSep = num(data.eyeSep);
  if (eyeSep !== null) out.eyeSep = clamp(eyeSep, 0.12, 1.4);
  const stereoGap = num(data.stereoGap);
  if (stereoGap !== null) out.stereoGap = clamp(stereoGap, 0, 1);
  const projectionDistance = num(data.projectionDistance);
  if (projectionDistance !== null) out.projectionDistance = clamp(projectionDistance, 2.2, 10);
  const sliceCount = num(data.sliceCount);
  if (sliceCount !== null) out.sliceCount = Math.round(clamp(sliceCount, 0, 6));
  const meshOpacity = num(data.meshOpacity);
  if (meshOpacity !== null) out.meshOpacity = clamp(meshOpacity, 0, 1);
  if (data.angles && typeof data.angles === 'object') {
    const src = data.angles as Record<string, unknown>;
    const angles = {} as Angles;
    let ok = true;
    for (const key of ANGLE_KEYS) {
      const value = num(src[key]);
      if (value === null) {
        ok = false;
        break;
      }
      angles[key] = value;
    }
    if (ok) out.angles = angles;
  }
  if (typeof data.tiltMode === 'string' && TILT_MODES.has(data.tiltMode as TiltMode)) {
    out.tiltMode = data.tiltMode as TiltMode;
  }
  if (typeof data.tiltInvert === 'boolean') out.tiltInvert = data.tiltInvert;
  const parallaxPan = num(data.parallaxPan);
  if (parallaxPan !== null) out.parallaxPan = clamp(parallaxPan, 0, 4);
  const parallaxZoom = num(data.parallaxZoom);
  if (parallaxZoom !== null) out.parallaxZoom = clamp(parallaxZoom, 0, 2);
  return out;
}

let snapshot: (() => StoredPrefs) | null = null;
let writeTimer = 0;

export function bindPrefs(get: () => StoredPrefs): void {
  snapshot = get;
  window.addEventListener('pagehide', flushPrefs);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushPrefs();
  });
}

export function markPrefsDirty(): void {
  if (!snapshot) return;
  window.clearTimeout(writeTimer);
  writeTimer = window.setTimeout(flushPrefs, 250);
}

export function flushPrefs(): void {
  if (!snapshot) return;
  window.clearTimeout(writeTimer);
  writeTimer = 0;
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()));
  } catch {
    /* ignore quota / private mode */
  }
}
