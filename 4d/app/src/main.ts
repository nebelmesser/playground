import './style.css';
import {
  MathUtils,
  PerspectiveCamera,
  Scene,
  StereoCamera,
  WebGLRenderer,
} from 'three';
import { DEFAULT_ANGLES, DEFAULT_OPACITY, defaultSliceCount } from './math/constants';
import type { TransformContext } from './math/types';
import { loadObject } from './objects/catalog';
import { HyperView } from './objects/hyperView';
import { bindAngleHud } from './viewer/angleHud';
import { SceneAxes } from './viewer/sceneAxes';
import {
  deviceOrbit,
  needsMotionPermission,
  startDeviceOrbitListeners,
  tickDeviceOrbit,
  deviceTiltOn,
} from './viewer/deviceOrbit';
import { bindInput } from './viewer/input';
import { bindMenu, type ViewerControls } from './viewer/menu';

const angles = { ...DEFAULT_ANGLES };

const controls: ViewerControls = {
  viewMode: 'cross',
  objectSize: 1,
  eyeSep: 1,
  stereoGap: 1,
  projectionDistance: 3,
  objectId: 'tesseract',
  display: {
    fillCaps: true,
    showCage: false,
    sliceCount: defaultSliceCount('tesseract'),
    meshOpacity: DEFAULT_OPACITY,
  },
};

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
renderer.setClearColor(0x111111, 1);
renderer.autoClear = false;
renderer.domElement.classList.add('main-view');
document.body.appendChild(renderer.domElement);

const stereoCamera = new StereoCamera();
stereoCamera.eyeSep = controls.eyeSep;

const hyperView = new HyperView(scene);
const sceneAxes = new SceneAxes();
scene.add(sceneAxes.group);
const angleHud = bindAngleHud(angles);

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
  const modelR = hyperView.projectedRadius(transformCtx());
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

function renderEye(left: boolean, viewCamera: PerspectiveCamera): void {
  const { height, pane } = stereoLayout();
  const x = left ? 0 : pane;
  const inward = 1 - controls.stereoGap;
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
  const modelR = hyperView.projectedRadius(ctx);
  sceneAxes.update(ctx, modelR);
  applyCameraAspect();
  hyperView.setDepthFade(camera.position.z, modelR, controls.display.meshOpacity);
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
    renderEye(true, stereoCamera.cameraR);
    renderEye(false, stereoCamera.cameraL);
  } else {
    renderEye(true, stereoCamera.cameraL);
    renderEye(false, stereoCamera.cameraR);
  }
  renderer.setScissorTest(false);
}

function animate(): void {
  tickDeviceOrbit();
  renderFrame();
  angleHud.sync();
  requestAnimationFrame(animate);
}

let loading = false;

async function setObject(id: ViewerControls['objectId']): Promise<void> {
  if (loading) return;
  loading = true;
  controls.objectId = id;
  try {
    const mesh = await loadObject(id);
    controls.display.sliceCount = defaultSliceCount(id);
    hyperView.setMesh(mesh, controls.display);
    syncObjectUi(mesh);
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
window.addEventListener('resize', onResize);
window.visualViewport?.addEventListener('resize', onResize);

if (deviceTiltOn() && !needsMotionPermission()) startDeviceOrbitListeners();

onResize();
requestAnimationFrame(animate);
void setObject('tesseract');
