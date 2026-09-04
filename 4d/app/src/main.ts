import './style.css';
import {
  MathUtils,
  Group,
  PerspectiveCamera,
  Scene,
  StereoCamera,
  WebGLRenderer,
} from 'three';
import { DEFAULT_OPACITY, DEFAULT_STEREO_DISTANCE, VIEW_OFFSET_Y, defaultAngles, defaultObjectSize, defaultSliceCount } from './math/constants';
import type { ObjectId, TransformContext } from './math/types';
import { CATALOG, loadObject } from './objects/catalog';
import { HyperView } from './objects/hyperView';
import { bindAngleHud } from './viewer/angleHud';
import { SceneAxes } from './viewer/sceneAxes';
import {
  deviceOrbit,
  needsMotionPermission,
  resetDeviceOrbit,
  setTiltMode,
  startDeviceOrbitListeners,
  tickDeviceOrbit,
  deviceTiltOn,
} from './viewer/deviceOrbit';
import { resetAngleMotion, tickAngleMotion } from './viewer/angleMotion';
import { bindInput } from './viewer/input';
import { bindMenu, type ViewerControls } from './viewer/menu';
import { applyFaceParallax, bindFaceParallax, getParallaxPan, getParallaxZoom, setParallaxPan, setParallaxZoom } from './viewer/faceParallax';
import { bindPrefs, consumeResetQuery, loadPrefs, markPrefsDirty, type StoredPrefs } from './viewer/prefs';

function objectFromQuery(): ObjectId | null {
  const raw = new URLSearchParams(window.location.search).get('object')?.trim().toLowerCase();
  return CATALOG.some((entry) => entry.id === raw) ? raw as ObjectId : null;
}

consumeResetQuery();
const stored = loadPrefs();
const queryObject = objectFromQuery();
const initialObject = queryObject ?? stored?.objectId ?? 'matryoshka';
const reusePose = Boolean(stored && (!queryObject || queryObject === stored.objectId));

const angles = { ...(reusePose && stored?.angles ? stored.angles : defaultAngles(initialObject)) };

const controls: ViewerControls = {
  viewMode: stored?.viewMode ?? 'mono',
  objectSize: reusePose && stored?.objectSize !== undefined ? stored.objectSize : defaultObjectSize(initialObject),
  eyeSep: stored?.eyeSep ?? 1,
  stereoGap: stored?.stereoGap ?? DEFAULT_STEREO_DISTANCE,
  projectionDistance: stored?.projectionDistance ?? 3,
  objectId: initialObject,
  display: {
    fillCaps: true,
    showCage: false,
    sliceCount: reusePose && stored?.sliceCount !== undefined ? stored.sliceCount : defaultSliceCount(initialObject),
    meshOpacity: stored?.meshOpacity ?? DEFAULT_OPACITY,
  },
};

if (stored?.tiltMode) setTiltMode(stored.tiltMode);
if (stored?.tiltInvert !== undefined) deviceOrbit.invert = stored.tiltInvert;
if (stored?.parallaxPan !== undefined) setParallaxPan(stored.parallaxPan);
if (stored?.parallaxZoom !== undefined) setParallaxZoom(stored.parallaxZoom);

const scene = new Scene();

const camera = new PerspectiveCamera(55, (window.innerWidth / 2) / window.innerHeight, 0.1, 500);
camera.position.set(0, 0, 5.4);
camera.lookAt(0, 0, 0);
camera.focus = camera.position.z;

const renderer = new WebGLRenderer({
  antialias: window.devicePixelRatio < 2,
  alpha: false,
  failIfMajorPerformanceCaveat: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.autoClear = false;
renderer.domElement.classList.add('main-view');
document.body.appendChild(renderer.domElement);

const stereoCamera = new StereoCamera();
stereoCamera.eyeSep = controls.eyeSep;

const stage = new Group();
scene.add(stage);
const hyperView = new HyperView(stage);
const sceneAxes = new SceneAxes();
stage.add(sceneAxes.group);
const angleHud = bindAngleHud(angles, () => controls.objectId);

function transformCtx(): TransformContext {
  return {
    angles,
    orbit: deviceOrbit,
    projectionDistance: controls.projectionDistance,
  };
}

function viewSize() {
  return {
    width: renderer.domElement.clientWidth || window.innerWidth,
    height: renderer.domElement.clientHeight || window.innerHeight,
  };
}

function stereoLayout() {
  const { width, height } = viewSize();
  const pane = Math.max(1, width / 2);
  return { width, height, pane };
}

function applyCameraAspect(): void {
  const stereo = controls.viewMode !== 'mono';
  const { width, height, pane } = stereoLayout();
  const split = document.getElementById('stereo-split');
  if (split) split.style.left = `${pane}px`;
  const aspect = Math.max(0.08, stereo ? pane / height : width / height);
  camera.fov = 55;
  camera.aspect = aspect;
  const modelR = hyperView.extentRadius(transformCtx());
  const radius = Math.max(modelR, SceneAxes.layout(modelR).reach) * 1.12 / controls.objectSize;
  const vHalf = Math.tan(MathUtils.degToRad(camera.fov * 0.5));
  const hHalf = vHalf * aspect;
  const dist = radius / Math.min(vHalf, hHalf);
  camera.position.set(0, 0, Number.isFinite(dist) ? Math.min(120, Math.max(1.4, dist)) : 5.4);
  camera.lookAt(0, 0, 0);
  camera.focus = camera.position.z;
  camera.updateProjectionMatrix();
}

function onResize(): void {
  const canvas = renderer.domElement;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  applyCameraAspect();
}

function maxInwardShift(halfW: number): number {
  const vHalf = Math.tan(MathUtils.degToRad(camera.fov * 0.5));
  const worldHalfW = Math.abs(camera.position.z) * vHalf * camera.aspect;
  const ndcHalf = Math.min(0.95, halfW / Math.max(1e-6, worldHalfW));
  return Math.max(0, 1 - ndcHalf - 0.02);
}

function renderEye(left: boolean, viewCamera: PerspectiveCamera, halfW: number): void {
  const { height, pane } = stereoLayout();
  const x = left ? 0 : pane;
  const inward = (1 - controls.stereoGap) * maxInwardShift(halfW);
  const proj = viewCamera.projectionMatrix.elements;
  const saved = proj[8];
  proj[8] = saved + (left ? -1 : 1) * inward;
  renderer.setScissor(x, 0, pane, height);
  renderer.setViewport(x, 0, pane, height);
  renderer.render(scene, viewCamera);
  proj[8] = saved;
}

function renderFrame(): void {
  const ctx = transformCtx();
  hyperView.update(ctx, controls.display);
  const modelR = hyperView.extentRadius(ctx);
  sceneAxes.update(ctx, modelR);
  applyCameraAspect();
  applyFaceParallax(camera, modelR);
  const radius = Math.max(modelR, SceneAxes.layout(modelR).reach) * 1.12 / controls.objectSize;
  stage.position.y = VIEW_OFFSET_Y * radius;
  hyperView.setDepthFade(camera.position.z, modelR, controls.display.meshOpacity);
  const halfW = hyperView.projectedHalfWidth(ctx);
  renderer.clear();
  camera.focus = camera.position.z;

  if (controls.viewMode === 'mono') {
    const { width, height } = viewSize();
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.render(scene, camera);
    return;
  }

  stereoCamera.eyeSep = controls.eyeSep * (camera.position.z / 5.4);
  stereoCamera.update(camera);

  renderer.setScissorTest(true);
  if (controls.viewMode === 'cross') {
    renderEye(true, stereoCamera.cameraR, halfW);
    renderEye(false, stereoCamera.cameraL, halfW);
  } else {
    renderEye(true, stereoCamera.cameraL, halfW);
    renderEye(false, stereoCamera.cameraR, halfW);
  }
  renderer.setScissorTest(false);
}

function snapshotPrefs(): StoredPrefs {
  return {
    viewMode: controls.viewMode,
    objectId: controls.objectId,
    objectSize: controls.objectSize,
    eyeSep: controls.eyeSep,
    stereoGap: controls.stereoGap,
    projectionDistance: controls.projectionDistance,
    sliceCount: controls.display.sliceCount,
    meshOpacity: controls.display.meshOpacity,
    angles: { ...angles },
    tiltMode: deviceOrbit.mode,
    tiltInvert: deviceOrbit.invert,
    parallaxPan: getParallaxPan(),
    parallaxZoom: getParallaxZoom(),
  };
}

function animate(): void {
  tickDeviceOrbit();
  if (tickAngleMotion(angles)) markPrefsDirty();
  renderFrame();
  angleHud.sync();
  requestAnimationFrame(animate);
}

let loading = false;

async function setObject(id: ViewerControls['objectId']): Promise<void> {
  if (loading) return;
  const switched = id !== controls.objectId;
  loading = true;
  controls.objectId = id;
  if (switched) {
    resetAngleMotion();
    Object.assign(angles, defaultAngles(id));
    resetDeviceOrbit();
    controls.display.sliceCount = defaultSliceCount(id);
    controls.objectSize = defaultObjectSize(id);
  }
  try {
    const mesh = await loadObject(id);
    hyperView.setMesh(mesh, controls.display);
    syncObjectUi(mesh);
    markPrefsDirty();
  } catch (err) {
    console.error(err);
    if (id !== 'tesseract') {
      loading = false;
      await setObject('tesseract');
      return;
    }
  }
  loading = false;
}

const syncObjectUi = bindMenu(controls, (id) => {
  void setObject(id);
});

bindInput(angles, renderer.domElement);
bindFaceParallax();
bindPrefs(snapshotPrefs);
window.addEventListener('resize', onResize);
window.visualViewport?.addEventListener('resize', onResize);

if (deviceTiltOn() && !needsMotionPermission()) startDeviceOrbitListeners();

onResize();
requestAnimationFrame(animate);
void setObject(initialObject);
