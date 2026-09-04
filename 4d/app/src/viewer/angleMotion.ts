import type { Angles } from '../math/types';

const KEYS: Array<keyof Angles> = ['xy', 'xz', 'yz', 'xw', 'yw', 'zw'];
const STEP = Math.PI / 18;
const TAU_COAST = 150;
const TAU_STEP = 100;
const VEL_GAIN = 0.5;
const MAX_VEL = 0.0032;
const VEL_CUTOFF = 1e-6;
const COAST_STOP_MS = 72;

const MAX_HOLD_RATE = (Math.PI * 2) / 1000;
const HOLD_RAMP_MS = 1600;

const vel: Angles = { xy: 0, xz: 0, yz: 0, xw: 0, yw: 0, zw: 0 };
const remain: Angles = { xy: 0, xz: 0, yz: 0, xw: 0, yw: 0, zw: 0 };
const holdDir: Angles = { xy: 0, xz: 0, yz: 0, xw: 0, yw: 0, zw: 0 };
const holdStarted: Angles = { xy: 0, xz: 0, yz: 0, xw: 0, yw: 0, zw: 0 };

let dragging = false;
let lastTick = 0;
let lastImpulseAt = 0;

function ease(dt: number, tau: number): number {
  return 1 - Math.exp(-dt / tau);
}

function zero(target: Angles): void {
  for (const key of KEYS) target[key] = 0;
}

export function resetAngleMotion(): void {
  zero(vel);
  zero(remain);
  zero(holdDir);
  zero(holdStarted);
}

export function beginAngleDrag(angles: Angles): void {
  for (const key of KEYS) {
    angles[key] += remain[key];
    remain[key] = 0;
    vel[key] = 0;
    holdDir[key] = 0;
    holdStarted[key] = 0;
  }
  dragging = true;
}

export function endAngleDrag(): void {
  dragging = false;
  if (performance.now() - lastImpulseAt > COAST_STOP_MS) zero(vel);
}

export function noteAngleImpulse(key: keyof Angles, delta: number, dt: number): void {
  if (dt < 4 || dt > 48) return;
  const next = vel[key] * 0.35 + (delta / dt) * VEL_GAIN * 0.65;
  vel[key] = Math.max(-MAX_VEL, Math.min(MAX_VEL, next));
  lastImpulseAt = performance.now();
}

export function nudgeAngle(key: keyof Angles, dir: number): void {
  remain[key] += dir * STEP;
  vel[key] = 0;
}

export function startHoldSpin(key: keyof Angles, dir: number): void {
  remain[key] = 0;
  vel[key] = 0;
  holdDir[key] = dir < 0 ? -1 : 1;
  holdStarted[key] = performance.now();
}

export function stopHoldSpin(key: keyof Angles): void {
  holdDir[key] = 0;
  holdStarted[key] = 0;
}

export function tickAngleMotion(angles: Angles): boolean {
  const now = performance.now();
  const dt = Math.min(48, lastTick ? now - lastTick : 16);
  lastTick = now;
  let moved = false;
  for (const key of KEYS) {
    if (holdDir[key] !== 0) {
      const age = Math.max(0, now - holdStarted[key]);
      const ramp = Math.min(1, age / HOLD_RAMP_MS);
      const rate = MAX_HOLD_RATE * ramp * ramp;
      angles[key] += holdDir[key] * rate * dt;
      moved = true;
      continue;
    }
    if (remain[key] !== 0) {
      const step = remain[key] * ease(dt, TAU_STEP);
      angles[key] += step;
      remain[key] -= step;
      if (Math.abs(remain[key]) < 1e-5) {
        angles[key] += remain[key];
        remain[key] = 0;
      }
      moved = true;
    }
    if (!dragging && vel[key] !== 0) {
      angles[key] += vel[key] * dt;
      vel[key] *= Math.exp(-dt / TAU_COAST);
      if (Math.abs(vel[key]) < VEL_CUTOFF) vel[key] = 0;
      moved = true;
    }
  }
  return moved;
}
