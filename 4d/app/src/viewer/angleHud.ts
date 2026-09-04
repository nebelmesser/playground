import { defaultAngles } from '../math/constants';
import type { Angles, ObjectId } from '../math/types';
import { nudgeAngle, resetAngleMotion, startHoldSpin, stopHoldSpin } from './angleMotion';
import { deviceOrbit, resetDeviceOrbit } from './deviceOrbit';
import { markPrefsDirty } from './prefs';

const TAP_MS = 280;
const PLANES: Array<keyof Angles> = ['xz', 'yz', 'xw', 'yw', 'zw'];

function isPlane(value: string | undefined): value is keyof Angles {
  return Boolean(value && (PLANES as string[]).includes(value));
}

function wrapPi(angle: number): number {
  const t = (angle + Math.PI) / (Math.PI * 2);
  return (t - Math.floor(t)) * Math.PI * 2 - Math.PI;
}

function formatDeg(radians: number): string {
  const deg = Math.round((wrapPi(radians) * 180) / Math.PI);
  return `${deg}°`;
}

export function bindAngleHud(angles: Angles, objectId: () => ObjectId): { sync: () => void } {
  const root = document.getElementById('angleCoords');
  if (!root) throw new Error('#angleCoords missing');

  const values = new Map<keyof Angles, HTMLElement>();
  for (const node of root.querySelectorAll<HTMLElement>('.coord')) {
    const key = node.dataset.plane;
    const valueEl = node.querySelector<HTMLElement>('.value');
    if (!isPlane(key) || !valueEl) continue;
    values.set(key, valueEl);
  }

  function displayedAngle(key: keyof Angles): number {
    const base = angles[key];
    const { mode, xz, yz } = deviceOrbit;
    if (mode === 'xyz') {
      if (key === 'xz') return base + xz;
      if (key === 'yz') return base + yz;
    } else if (mode === 'xw-yw') {
      if (key === 'xw') return base + xz;
      if (key === 'yw') return base + yz;
    } else if (mode === 'zw' && key === 'zw') {
      return base + yz;
    }
    return base;
  }

  function sync(): void {
    for (const [key, el] of values) {
      el.textContent = formatDeg(displayedAngle(key));
    }
  }

  function nudge(key: keyof Angles, dir: number): void {
    nudgeAngle(key, dir);
    sync();
  }

  for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-dir]')) {
    const coord = button.closest<HTMLElement>('.coord');
    const key = coord?.dataset.plane;
    const dir = Number(button.dataset.dir);
    if (!isPlane(key) || !dir) continue;
    const plane = key;

    let pressed = false;
    let pressedAt = 0;

    function endPress(): void {
      if (!pressed) return;
      const held = performance.now() - pressedAt;
      pressed = false;
      stopHoldSpin(plane);
      if (held < TAP_MS) nudge(plane, dir);
    }

    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      event.preventDefault();
      if (pressed) {
        pressed = false;
        stopHoldSpin(plane);
      }
      pressed = true;
      pressedAt = performance.now();
      startHoldSpin(plane, dir);
      try {
        button.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    });
    button.addEventListener('pointerup', endPress);
    button.addEventListener('pointercancel', endPress);
    button.addEventListener('lostpointercapture', endPress);
  }

  document.getElementById('angle-reset')?.addEventListener('click', (event) => {
    event.stopPropagation();
    resetAngleMotion();
    Object.assign(angles, defaultAngles(objectId()));
    resetDeviceOrbit();
    sync();
    markPrefsDirty();
  });

  sync();
  return { sync };
}
