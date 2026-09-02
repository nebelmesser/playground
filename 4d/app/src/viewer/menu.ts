import { DEFAULT_OPACITY } from '../math/constants';
import type { DisplayState, Mesh3D, ObjectId, TiltMode, ViewMode } from '../math/types';
import { CATALOG } from '../objects/catalog';
import {
  deviceOrbit,
  deviceTiltOn,
  enableDeviceOrbit,
  lanHttpsUrl,
  needsMotionPermission,
  onTiltStateChange,
  setTiltMode,
  tiltNeedsHttps,
} from './deviceOrbit';

export type ViewerControls = {
  viewMode: ViewMode;
  objectSize: number;
  eyeSep: number;
  stereoGap: number;
  projectionDistance: number;
  objectId: ObjectId;
  display: DisplayState;
};

function formatNum(value: number): string {
  return Number(value).toFixed(2);
}

function isCompactLayout(): boolean {
  return window.matchMedia('(max-width: 900px), (max-height: 520px)').matches;
}

export type SyncObjectUi = (mesh: Mesh3D | null) => void;

export function bindMenu(
  controls: ViewerControls,
  onObjectChange: (id: ObjectId) => void,
): SyncObjectUi {
  const stereoHint = document.getElementById('stereoHint');
  const eyeSepSlider = document.getElementById('eyeSepSlider') as HTMLInputElement;
  const stereoGapSlider = document.getElementById('stereoGapSlider') as HTMLInputElement;
  const focusSlider = document.getElementById('focusSlider') as HTMLInputElement;
  const sizeSlider = document.getElementById('cubeSizeSlider') as HTMLInputElement;
  const opacitySlider = document.getElementById('opacitySlider') as HTMLInputElement;
  const eyeSepValue = document.getElementById('eyeSepValue');
  const stereoGapValue = document.getElementById('stereoGapValue');
  const focusValue = document.getElementById('focusValue');
  const sizeValue = document.getElementById('cubeSizeValue');
  const opacityValue = document.getElementById('opacityValue');
  const sliceCountSlider = document.getElementById('sliceCountSlider') as HTMLInputElement;
  const sliceCountValue = document.getElementById('sliceCountValue');
  const sliceTicks = document.getElementById('sliceTicks');
  const menuToggle = document.getElementById('menu-toggle') as HTMLButtonElement;
  const menuBackdrop = document.getElementById('menu-backdrop') as HTMLElement;
  const uiContainer = document.getElementById('ui-container') as HTMLElement;
  const objectSelect = document.getElementById('objectSelect') as HTMLSelectElement;
  const tiltModeSelect = document.getElementById('tiltModeSelect') as HTMLSelectElement;
  const tiltInvert = document.getElementById('tiltInvert') as HTMLInputElement;
  const tiltInvertGroup = document.getElementById('tiltInvertGroup') as HTMLElement;
  const tiltBanner = document.getElementById('tilt-banner') as HTMLButtonElement | null;
  const objectCredit = document.getElementById('objectCredit');

  if (!stereoHint || !eyeSepValue || !stereoGapValue || !focusValue || !sizeValue || !opacityValue || !sliceCountValue) {
    throw new Error('Menu DOM is incomplete');
  }
  const hint = stereoHint;
  const sliceLabel = sliceCountValue;

  objectSelect.replaceChildren();
  for (const entry of CATALOG) {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.label;
    objectSelect.append(option);
  }
  objectSelect.value = controls.objectId;

  function setMenuOpen(open: boolean): void {
    uiContainer.classList.toggle('is-open', open);
    menuToggle.classList.toggle('is-open', open);
    menuBackdrop.classList.toggle('is-on', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  }

  function setViewMode(mode: ViewMode): void {
    controls.viewMode = mode;
    document.body.classList.toggle('is-mono', mode === 'mono');
    document.querySelectorAll('#mode-bar button').forEach((button) => {
      button.classList.toggle('is-active', (button as HTMLElement).dataset.mode === mode);
    });
    hint.textContent = mode === 'cross'
      ? 'Cross your eyes until the two images merge into one.'
      : mode === 'parallel'
        ? 'Look through the screen, as if into the distance — left eye on the left image.'
        : 'Single view.';
  }

  function syncTiltBanner(): void {
    if (!tiltBanner) return;
    if (!deviceTiltOn() || deviceOrbit.listening) {
      tiltBanner.hidden = true;
      return;
    }
    if (tiltNeedsHttps()) {
      tiltBanner.hidden = false;
      tiltBanner.textContent = 'Tilt needs HTTPS — tap to open';
      return;
    }
    if (needsMotionPermission()) {
      tiltBanner.hidden = false;
      tiltBanner.textContent = 'Tap to allow device tilt';
      return;
    }
    tiltBanner.hidden = true;
  }

  function syncTiltControls(): void {
    tiltModeSelect.value = deviceOrbit.mode;
    tiltInvert.checked = deviceOrbit.invert;
    tiltInvertGroup.style.display = deviceTiltOn() ? '' : 'none';
    syncTiltBanner();
  }

  function syncSliceUi(): void {
    sliceCountSlider.value = String(controls.display.sliceCount);
    sliceLabel.textContent = String(controls.display.sliceCount);
  }

  function syncObjectUi(mesh: Mesh3D | null): void {
    if (!mesh) return;
    objectSelect.value = mesh.id;
    if (objectCredit) objectCredit.hidden = mesh.id !== 'matryoshka';
    syncSliceUi();
  }

  tiltBanner?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (tiltNeedsHttps()) {
      location.assign(lanHttpsUrl());
      return;
    }
    void enableDeviceOrbit();
  });

  menuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    void enableDeviceOrbit();
    setMenuOpen(!uiContainer.classList.contains('is-open'));
  });

  menuBackdrop.addEventListener('click', () => setMenuOpen(false));

  document.getElementById('mode-bar')?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button[data-mode]');
    if (!button) return;
    setViewMode((button as HTMLElement).dataset.mode as ViewMode);
  });

  objectSelect.addEventListener('change', () => {
    onObjectChange(objectSelect.value as ObjectId);
  });
  objectSelect.addEventListener('input', () => {
    onObjectChange(objectSelect.value as ObjectId);
  });

  tiltModeSelect.addEventListener('change', () => {
    setTiltMode(tiltModeSelect.value as TiltMode);
    syncTiltControls();
    void enableDeviceOrbit();
  });

  tiltInvert.addEventListener('change', () => {
    deviceOrbit.invert = tiltInvert.checked;
  });

  sliceCountSlider.addEventListener('input', () => {
    controls.display.sliceCount = Number(sliceCountSlider.value);
    sliceLabel.textContent = String(controls.display.sliceCount);
  });

  sizeSlider.addEventListener('input', () => {
    controls.objectSize = Number(sizeSlider.value);
    sizeValue.textContent = formatNum(controls.objectSize);
  });

  opacitySlider.addEventListener('input', () => {
    controls.display.meshOpacity = Number(opacitySlider.value);
    opacityValue.textContent = formatNum(controls.display.meshOpacity);
  });

  eyeSepSlider.addEventListener('input', () => {
    controls.eyeSep = Number(eyeSepSlider.value);
    eyeSepValue.textContent = formatNum(controls.eyeSep);
  });

  stereoGapSlider.addEventListener('input', () => {
    controls.stereoGap = Number(stereoGapSlider.value);
    stereoGapValue.textContent = formatNum(controls.stereoGap);
  });

  focusSlider.addEventListener('input', () => {
    controls.projectionDistance = Number(focusSlider.value);
    focusValue.textContent = formatNum(controls.projectionDistance);
  });

  if (sliceTicks && sliceTicks.childElementCount === 0) {
    for (let i = 0; i <= 16; i++) {
      const mark = document.createElement('i');
      if (i % 4 === 0) mark.classList.add('is-major');
      sliceTicks.append(mark);
    }
  }

  opacitySlider.value = String(DEFAULT_OPACITY);
  opacityValue.textContent = formatNum(DEFAULT_OPACITY);
  stereoGapSlider.value = String(controls.stereoGap);
  stereoGapValue.textContent = formatNum(controls.stereoGap);
  syncSliceUi();

  setMenuOpen(!isCompactLayout());
  syncTiltControls();
  onTiltStateChange(syncTiltBanner);
  syncObjectUi(null);
  setViewMode(controls.viewMode);

  return syncObjectUi;
}
