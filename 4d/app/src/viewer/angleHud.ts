import { DEFAULT_ANGLES } from '../math/constants';
import type { Angles } from '../math/types';
import { deviceOrbit, resetDeviceOrbit } from './deviceOrbit';

const STEP = Math.PI / 90;
const HOLD_DELAY_MS = 380;
const HOLD_EVERY_MS = 45;
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

export function bindAngleHud(angles: Angles): { sync: () => void } {
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
    angles[key] += dir * STEP;
    sync();
  }

  for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-dir]')) {
    const coord = button.closest<HTMLElement>('.coord');
    const key = coord?.dataset.plane;
    const dir = Number(button.dataset.dir);
    if (!isPlane(key) || !dir) continue;

    let holdTimer = 0;
    let holdInterval = 0;

    function stopHold(): void {
      window.clearTimeout(holdTimer);
      window.clearInterval(holdInterval);
      holdTimer = 0;
      holdInterval = 0;
    }

    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      event.preventDefault();
      nudge(key, dir);
      stopHold();
      holdTimer = window.setTimeout(() => {
        holdInterval = window.setInterval(() => nudge(key, dir), HOLD_EVERY_MS);
      }, HOLD_DELAY_MS);
      try {
        button.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    });
    button.addEventListener('pointerup', stopHold);
    button.addEventListener('pointercancel', stopHold);
    button.addEventListener('lostpointercapture', stopHold);
  }

  document.getElementById('angle-reset')?.addEventListener('click', (event) => {
    event.stopPropagation();
    Object.assign(angles, DEFAULT_ANGLES);
    resetDeviceOrbit();
    sync();
  });

  sync();
  return { sync };
}
