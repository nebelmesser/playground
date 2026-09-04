import type { PerspectiveCamera } from 'three';
import { markPrefsDirty } from './prefs';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/+esm';

const SHIFT_X = 0.85;
const SHIFT_Y = 0.64;
const Z_MIN = 0.86;
const Z_MAX = 1.18;
const TAU_CAM = 180;
const TAU_ZOOM = 560;
const TAU_BOX = 260;

const TIP_TITLE = 'Allow camera for head parallax';
const TIP_NOTE = 'Camera feed is local only';

export const DEFAULT_PARALLAX_PAN = 1.6;
export const DEFAULT_PARALLAX_ZOOM = 1;

type Box = { x: number; y: number; w: number; h: number };

type MpDetector = {
  detectForVideo: (image: CanvasImageSource, timestamp: number) => {
    detections: Array<{ boundingBox?: { originX: number; originY: number; width: number; height: number } }>;
  };
  detect?: (image: CanvasImageSource) => {
    detections: Array<{ boundingBox?: { originX: number; originY: number; width: number; height: number } }>;
  };
  close?: () => void;
};

const track = {
  nx: 0,
  ny: 0,
  z: 1,
  targetNx: 0,
  targetNy: 0,
  targetZ: 1,
  hasFace: false,
  restSize: 0,
  sizeEma: 0,
  lastFaceAt: 0,
};

let stream: MediaStream | null = null;
let video: HTMLVideoElement | null = null;
let detector: MpDetector | null = null;
let running = false;
let raf = 0;
let lastDetectAt = 0;
let lastTickAt = 0;
let lastCamAt = 0;
let restReadyAt = 0;
let lastBox: Box | null = null;
let smoothBox: Box | null = null;
let boxAlpha = 0;
let panStrength = DEFAULT_PARALLAX_PAN;
let zoomStrength = DEFAULT_PARALLAX_ZOOM;
let detectCanvas: HTMLCanvasElement | null = null;
let detectCtx: CanvasRenderingContext2D | null = null;
let lastStamp = -1;

function isDesktop(): boolean {
  return window.matchMedia('(min-width: 901px) and (min-height: 521px)').matches;
}

function cameraToggle(): HTMLElement | null {
  return document.getElementById('camera-toggle');
}

function banner(): HTMLButtonElement | null {
  return document.getElementById('parallax-banner') as HTMLButtonElement | null;
}

function preview(): HTMLElement | null {
  return document.getElementById('face-preview');
}

function canvas(): HTMLCanvasElement | null {
  return document.getElementById('face-preview-canvas') as HTMLCanvasElement | null;
}

function closeButton(): HTMLButtonElement | null {
  return document.getElementById('face-preview-close') as HTMLButtonElement | null;
}

function ease(current: number, target: number, dt: number, tau: number): number {
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

function setBanner(text: string, detail?: string, forceTip = false): void {
  const wrap = cameraToggle();
  const el = banner();
  if (!wrap) return;
  const title = wrap.querySelector('[data-title]');
  const note = wrap.querySelector('[data-note]');
  if (title) title.textContent = text;
  if (note && detail !== undefined) note.textContent = detail;
  el?.setAttribute('aria-label', text);
  wrap.hidden = !isDesktop();
  wrap.classList.toggle('is-on', running);
  wrap.classList.toggle('is-tip-on', forceTip && isDesktop() && !running);
}

function showPreview(on: boolean): void {
  const el = preview();
  if (el) el.hidden = !on || !isDesktop();
}

async function loadMpDetector(): Promise<MpDetector> {
  const importer = new Function('u', 'return import(u)') as (u: string) => Promise<{
    FilesetResolver: { forVisionTasks: (wasm: string) => Promise<unknown> };
    FaceDetector: {
      createFromOptions: (fileset: unknown, opts: {
        baseOptions: { modelAssetPath: string; delegate?: 'CPU' | 'GPU' };
        runningMode: 'VIDEO';
        minDetectionConfidence: number;
        minSuppressionThreshold?: number;
      }) => Promise<MpDetector>;
    };
  }>;
  const vision = await importer(VISION_URL);
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
  return vision.FaceDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
    runningMode: 'VIDEO',
    minDetectionConfidence: 0.3,
    minSuppressionThreshold: 0.3,
  });
}

function grabFrame(videoEl: HTMLVideoElement): HTMLCanvasElement | null {
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (vw < 2 || vh < 2) return null;
  const maxW = 640;
  const scale = Math.min(1, maxW / vw);
  const w = Math.max(2, Math.round(vw * scale));
  const h = Math.max(2, Math.round(vh * scale));
  if (!detectCanvas) {
    detectCanvas = document.createElement('canvas');
    detectCtx = detectCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!detectCtx) return null;
  if (detectCanvas.width !== w) detectCanvas.width = w;
  if (detectCanvas.height !== h) detectCanvas.height = h;
  detectCtx.drawImage(videoEl, 0, 0, w, h);
  return detectCanvas;
}

function pickFace(videoEl: HTMLVideoElement, now: number): Box | null {
  if (!detector || videoEl.readyState < 2) return null;
  const frame = grabFrame(videoEl);
  if (!frame) return null;
  const stamp = now <= lastStamp ? lastStamp + 1 : now;
  lastStamp = stamp;
  try {
    const out = detector.detectForVideo(frame, stamp);
    const raw = out.detections[0]?.boundingBox;
    if (!raw) return null;
    const box = asPixels(
      { x: raw.originX, y: raw.originY, w: raw.width, h: raw.height },
      frame.width,
      frame.height,
    );
    return {
      x: box.x * (videoEl.videoWidth / frame.width),
      y: box.y * (videoEl.videoHeight / frame.height),
      w: box.w * (videoEl.videoWidth / frame.width),
      h: box.h * (videoEl.videoHeight / frame.height),
    };
  } catch (err) {
    console.warn('Face detect failed', err);
    return null;
  }
}

function asPixels(box: Box, vw: number, vh: number): Box {
  if (box.w <= 1.5 && box.h <= 1.5) {
    return { x: box.x * vw, y: box.y * vh, w: box.w * vw, h: box.h * vh };
  }
  return box;
}

function updateTrack(box: Box | null, vw: number, vh: number): void {
  const now = performance.now();
  if (!box || vw < 2 || vh < 2) {
    if (now - track.lastFaceAt > 350) {
      lastBox = null;
      track.hasFace = false;
      track.targetNx = 0;
      track.targetNy = 0;
      track.targetZ = 1;
    }
    return;
  }
  lastBox = box;
  track.hasFace = true;
  track.lastFaceAt = now;
  const cx = box.x + box.w * 0.5;
  const cy = box.y + box.h * 0.5;
  // Mirrored selfie: user-left is preview-left.
  const nx = (0.5 - cx / vw) * 2;
  const ny = (cy / vh - 0.5) * 2;
  const size = box.w / vw;
  track.sizeEma = track.sizeEma <= 0 ? size : track.sizeEma * 0.9 + size * 0.1;
  if (track.restSize <= 0) {
    track.restSize = track.sizeEma;
    restReadyAt = now;
  } else if (now - restReadyAt > 800) {
    track.restSize += (track.sizeEma - track.restSize) * 0.004;
  }
  const z = Math.min(Z_MAX, Math.max(Z_MIN, track.restSize / Math.max(0.04, track.sizeEma)));
  track.targetNx = Math.min(1, Math.max(-1, nx));
  track.targetNy = Math.min(1, Math.max(-1, ny));
  track.targetZ = z;
}

function tickSmooth(dt: number): void {
  if (lastBox) {
    if (!smoothBox) {
      smoothBox = { ...lastBox };
    } else {
      smoothBox.x = ease(smoothBox.x, lastBox.x, dt, TAU_BOX);
      smoothBox.y = ease(smoothBox.y, lastBox.y, dt, TAU_BOX);
      smoothBox.w = ease(smoothBox.w, lastBox.w, dt, TAU_BOX);
      smoothBox.h = ease(smoothBox.h, lastBox.h, dt, TAU_BOX);
    }
    boxAlpha = ease(boxAlpha, 1, dt, 90);
    return;
  }
  boxAlpha = ease(boxAlpha, 0, dt, 140);
  if (boxAlpha < 0.03) {
    smoothBox = null;
    boxAlpha = 0;
  }
}

function drawPreview(): void {
  const cvs = canvas();
  const vid = video;
  if (!cvs || !vid || vid.readyState < 2) return;
  const ctx = cvs.getContext('2d');
  if (!ctx) return;
  const w = cvs.width;
  const h = cvs.height;
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(vid, 0, 0, w, h);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.strokeStyle = 'rgba(200, 200, 200, 0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  if (smoothBox && vid.videoWidth > 0 && boxAlpha > 0.03) {
    const sx = w / vid.videoWidth;
    const sy = h / vid.videoHeight;
    const fx = w - (smoothBox.x + smoothBox.w) * sx;
    const fy = smoothBox.y * sy;
    ctx.globalAlpha = boxAlpha;
    ctx.strokeStyle = '#cc9690';
    ctx.lineWidth = 2;
    ctx.strokeRect(fx, fy, smoothBox.w * sx, smoothBox.h * sy);
    ctx.globalAlpha = 1;
  }
}

function tickDetect(now: number): void {
  if (!running || !video) return;
  raf = requestAnimationFrame(tickDetect);
  if (!isDesktop()) {
    void stopParallax();
    return;
  }
  const dt = Math.min(50, lastTickAt ? now - lastTickAt : 16);
  lastTickAt = now;
  if (now - lastDetectAt >= 45) {
    lastDetectAt = now;
    updateTrack(pickFace(video, now), video.videoWidth, video.videoHeight);
  }
  tickSmooth(dt);
  drawPreview();
}

async function startParallax(): Promise<void> {
  if (running || !isDesktop()) return;
  if (!window.isSecureContext) {
    setBanner('Parallax needs HTTPS', TIP_NOTE, true);
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setBanner('Camera not available', TIP_NOTE, true);
    return;
  }
  setBanner('Starting camera…', TIP_NOTE, true);
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });
  } catch {
    setBanner('Permission denied', TIP_NOTE, true);
    return;
  }
  video = document.createElement('video');
  video.className = 'face-track-video';
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.srcObject = stream;
  document.body.appendChild(video);
  await video.play().catch(() => undefined);
  if (video.readyState < 2) {
    await new Promise<void>((resolve) => {
      video?.addEventListener('loadeddata', () => resolve(), { once: true });
    });
  }

  try {
    detector = await loadMpDetector();
  } catch (err) {
    console.error(err);
    stopStream();
    setBanner('Face tracking failed to load', TIP_NOTE, true);
    return;
  }

  running = true;
  track.restSize = 0;
  track.sizeEma = 0;
  lastBox = null;
  smoothBox = null;
  boxAlpha = 0;
  lastTickAt = 0;
  setBanner(TIP_TITLE, TIP_NOTE);
  showPreview(true);
  lastDetectAt = 0;
  raf = requestAnimationFrame(tickDetect);
}

function stopStream(): void {
  stream?.getTracks().forEach((mediaTrack) => mediaTrack.stop());
  stream = null;
  if (video) {
    video.srcObject = null;
    video.remove();
    video = null;
  }
  detector?.close?.();
  detector = null;
  lastStamp = -1;
}

async function stopParallax(): Promise<void> {
  running = false;
  cancelAnimationFrame(raf);
  raf = 0;
  stopStream();
  track.hasFace = false;
  track.targetNx = 0;
  track.targetNy = 0;
  track.targetZ = 1;
  track.restSize = 0;
  track.sizeEma = 0;
  lastBox = null;
  smoothBox = null;
  boxAlpha = 0;
  showPreview(false);
  syncParallaxUi();
}

export function syncParallaxUi(): void {
  if (!isDesktop()) {
    const wrap = cameraToggle();
    if (wrap) wrap.hidden = true;
    showPreview(false);
    if (running) void stopParallax();
    return;
  }
  if (running) {
    setBanner(TIP_TITLE, TIP_NOTE);
    showPreview(true);
    return;
  }
  setBanner(TIP_TITLE, TIP_NOTE);
}

function formatNum(value: number): string {
  return Number(value).toFixed(2);
}

function bindStrengthSliders(): void {
  const panSlider = document.getElementById('parallaxPanSlider') as HTMLInputElement | null;
  const zoomSlider = document.getElementById('parallaxZoomSlider') as HTMLInputElement | null;
  const panValue = document.getElementById('parallaxPanValue');
  const zoomValue = document.getElementById('parallaxZoomValue');
  if (!panSlider || !zoomSlider || !panValue || !zoomValue) return;

  const syncPan = (persist = true): void => {
    const value = Number(panSlider.value);
    setParallaxPan(value);
    panValue.textContent = formatNum(value);
    if (persist) markPrefsDirty();
  };
  const syncZoom = (persist = true): void => {
    const value = Number(zoomSlider.value);
    setParallaxZoom(value);
    zoomValue.textContent = formatNum(value);
    if (persist) markPrefsDirty();
  };

  panSlider.value = String(panStrength);
  zoomSlider.value = String(zoomStrength);
  syncPan(false);
  syncZoom(false);
  panSlider.addEventListener('input', () => syncPan());
  zoomSlider.addEventListener('input', () => syncZoom());
}

export function bindFaceParallax(): void {
  const el = banner();
  el?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (running) void stopParallax();
    else void startParallax();
  });
  closeButton()?.addEventListener('click', (event) => {
    event.stopPropagation();
    void stopParallax();
  });
  bindStrengthSliders();
  window.addEventListener('resize', syncParallaxUi);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) video?.pause();
    else if (running) void video?.play().catch(() => undefined);
  });
  syncParallaxUi();
}

export function applyFaceParallax(camera: PerspectiveCamera, radius: number): void {
  const now = performance.now();
  const dt = Math.min(50, lastCamAt ? now - lastCamAt : 16);
  lastCamAt = now;
  track.nx = ease(track.nx, track.targetNx, dt, TAU_CAM);
  track.ny = ease(track.ny, track.targetNy, dt, TAU_CAM);
  track.z = ease(track.z, track.targetZ, dt, TAU_ZOOM);
  const idle = Math.abs(track.nx) + Math.abs(track.ny) + Math.abs(track.z - 1) < 0.004;
  if (!running && idle) return;
  const baseZ = camera.position.z;
  camera.position.x = track.nx * radius * SHIFT_X * panStrength;
  camera.position.y = -track.ny * radius * SHIFT_Y * panStrength;
  camera.position.z = baseZ * (1 + (track.z - 1) * zoomStrength);
  camera.lookAt(0, 0, 0);
  camera.focus = camera.position.z;
}

export function getParallaxPan(): number {
  return panStrength;
}

export function getParallaxZoom(): number {
  return zoomStrength;
}

export function setParallaxPan(value: number): void {
  panStrength = Math.max(0, value);
}

export function setParallaxZoom(value: number): void {
  zoomStrength = Math.max(0, value);
}
