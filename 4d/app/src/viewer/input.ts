import {
  DRAG_SENSITIVITY,
  WHEEL_PAN_SENSITIVITY,
  WHEEL_SENSITIVITY,
} from '../math/constants';
import type { Angles } from '../math/types';
import {
  enableDeviceOrbit,
  lockTiltAxis,
  unlockTiltAxis,
} from './deviceOrbit';
import {
  beginAngleDrag,
  endAngleDrag,
  noteAngleImpulse,
} from './angleMotion';
import { closeMenu } from './menu';
import { markPrefsDirty } from './prefs';

function isPhone(): boolean {
  return window.matchMedia('(max-width: 900px), (max-height: 520px)').matches;
}

function isUiEvent(event: Event): boolean {
  return event.target instanceof Element && Boolean(
    event.target.closest('#ui-container')
    || event.target.closest('#chrome-center')
    || event.target.closest('#camera-toggle')
    || event.target.closest('#face-preview')
    || event.target.closest('#menu-toggle')
    || event.target.closest('#menu-backdrop')
    || event.target.closest('#axes-hud')
  );
}

function rotate3D(angles: Angles, dx: number, dy: number, dt: number): void {
  const rx = dx * DRAG_SENSITIVITY;
  const ry = -dy * DRAG_SENSITIVITY;
  angles.xz += rx;
  angles.yz += ry;
  noteAngleImpulse('xz', rx, dt);
  noteAngleImpulse('yz', ry, dt);
  markPrefsDirty();
}

function rotate4D(angles: Angles, dx: number, dy: number, dt: number): void {
  const rx = dx * DRAG_SENSITIVITY;
  const ry = dy * DRAG_SENSITIVITY;
  angles.xw += rx;
  angles.yw += ry;
  noteAngleImpulse('xw', rx, dt);
  noteAngleImpulse('yw', ry, dt);
  markPrefsDirty();
}

export function bindInput(angles: Angles, canvas: HTMLCanvasElement): void {
  const activePointers = new Map<number, { x: number; y: number }>();
  let lastMidpoint: { x: number; y: number } | null = null;
  let lastPinchDist = 0;
  let lastGestureScale = 1;
  let lastMoveAt = 0;

  window.addEventListener('selectstart', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
  });
  window.addEventListener('contextmenu', (event) => {
    if (isUiEvent(event)) return;
    event.preventDefault();
  });

  function pinchPair() {
    const pts = [...activePointers.values()];
    if (pts.length < 2) return null;
    return {
      mid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
      dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
    };
  }

  window.addEventListener('pointerdown', (event) => {
    if (isUiEvent(event)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    void enableDeviceOrbit();
    event.preventDefault();
    if (activePointers.size === 0) {
      beginAngleDrag(angles);
      lastMoveAt = 0;
    }
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.classList.add('is-dragging');
    if (event.target === canvas) {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    const pair = pinchPair();
    if (pair) {
      lastMidpoint = pair.mid;
      lastPinchDist = pair.dist;
    }
    lockTiltAxis();
  });

  window.addEventListener('pointermove', (event) => {
    if (!activePointers.has(event.pointerId)) return;
    const prev = activePointers.get(event.pointerId);
    if (!prev) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const now = performance.now();
    const dt = lastMoveAt ? Math.min(48, now - lastMoveAt) : 16;
    lastMoveAt = now;

    if (activePointers.size >= 2) {
      const pair = pinchPair();
      if (!pair) return;
      if (lastMidpoint) {
        rotate4D(angles, pair.mid.x - lastMidpoint.x, pair.mid.y - lastMidpoint.y, dt);
        closeMenu();
      }
      if (!isPhone() && lastPinchDist > 0) {
        const dZw = (pair.dist - lastPinchDist) * 0.012;
        angles.zw += dZw;
        noteAngleImpulse('zw', dZw, dt);
        closeMenu();
        markPrefsDirty();
      }
      lastMidpoint = pair.mid;
      lastPinchDist = pair.dist;
      return;
    }

    const dx = event.clientX - prev.x;
    const dy = event.clientY - prev.y;
    if (dx === 0 && dy === 0) return;
    if (event.shiftKey) rotate4D(angles, dx, dy, dt);
    else rotate3D(angles, dx, dy, dt);
    closeMenu();
  });

  function endPointer(event: PointerEvent): void {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) {
      lastMidpoint = null;
      lastPinchDist = 0;
    }
    if (activePointers.size === 0) {
      canvas.classList.remove('is-dragging');
      unlockTiltAxis();
      endAngleDrag();
    }
  }

  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  window.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') endPointer(event);
  });

  window.addEventListener('wheel', (event) => {
    if (isUiEvent(event)) return;
    event.preventDefault();

    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const dx = event.deltaX * unit;
    const dy = event.deltaY * unit;

    if (event.ctrlKey) {
      if (lastGestureScale === 1) {
        angles.zw += dy * WHEEL_SENSITIVITY;
        closeMenu();
        markPrefsDirty();
      }
      return;
    }

    if (event.shiftKey) {
      angles.zw += dy * WHEEL_SENSITIVITY;
      closeMenu();
      markPrefsDirty();
      return;
    }

    angles.xw += dx * WHEEL_PAN_SENSITIVITY;
    angles.yw += dy * WHEEL_PAN_SENSITIVITY;
    closeMenu();
    markPrefsDirty();
  }, { passive: false });

  window.addEventListener('gesturestart', (event) => {
    if (isUiEvent(event)) return;
    event.preventDefault();
    lastGestureScale = (event as GestureEvent).scale || 1;
  });

  window.addEventListener('gesturechange', (event) => {
    if (isUiEvent(event)) return;
    event.preventDefault();
    const scale = (event as GestureEvent).scale || 1;
    if (!isPhone()) {
      const dZw = (scale - lastGestureScale) * 1.4;
      const now = performance.now();
      const dt = lastMoveAt ? Math.min(48, now - lastMoveAt) : 16;
      lastMoveAt = now;
      angles.zw += dZw;
      noteAngleImpulse('zw', dZw, dt);
      closeMenu();
      markPrefsDirty();
    }
    lastGestureScale = scale;
  });

  window.addEventListener('gestureend', (event) => {
    lastGestureScale = 1;
    if (isUiEvent(event)) return;
    event.preventDefault();
  });
}
