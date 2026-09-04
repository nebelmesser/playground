import { MathUtils } from 'three';
import type { DeviceOrbitState, TiltMode } from '../math/types';

type PermissionedSensor = {
  requestPermission?: () => Promise<PermissionState | string>;
};

export const deviceOrbit: DeviceOrbitState = {
  mode: 'xw-yw',
  invert: false,
  locked: false,
  listening: false,
  useGyro: false,
  xz: 0,
  yz: 0,
  targetXz: 0,
  targetYz: 0,
  lastMotionTime: 0,
  prevBeta: null,
  prevGamma: null,
  prevAlpha: null,
  prevRoll: null,
  prevPitch: null,
};

export function deviceTiltOn(): boolean {
  return deviceOrbit.mode !== 'off';
}

export function resetDeviceOrbit(): void {
  deviceOrbit.locked = false;
  deviceOrbit.xz = 0;
  deviceOrbit.yz = 0;
  deviceOrbit.targetXz = 0;
  deviceOrbit.targetYz = 0;
  forgetDevicePrev();
}

export function forgetDevicePrev(): void {
  deviceOrbit.prevBeta = null;
  deviceOrbit.prevGamma = null;
  deviceOrbit.prevAlpha = null;
  deviceOrbit.prevRoll = null;
  deviceOrbit.prevPitch = null;
  deviceOrbit.lastMotionTime = 0;
}

export function lockTiltAxis(): void {
  if (deviceOrbit.locked) return;
  if (deviceOrbit.mode === 'off') return;
  deviceOrbit.locked = true;
  deviceOrbit.targetXz = deviceOrbit.xz;
  deviceOrbit.targetYz = deviceOrbit.yz;
}

export function unlockTiltAxis(): void {
  if (!deviceOrbit.locked) return;
  deviceOrbit.targetXz = deviceOrbit.xz;
  deviceOrbit.targetYz = deviceOrbit.yz;
  forgetDevicePrev();
  deviceOrbit.locked = false;
}

export function setTiltMode(mode: TiltMode): void {
  deviceOrbit.mode = mode;
  resetDeviceOrbit();
}

function shortestAngle(delta: number): number {
  return Math.atan2(Math.sin(delta), Math.cos(delta));
}

function screenAngleDeg(): number {
  if (screen.orientation && Number.isFinite(screen.orientation.angle)) {
    return screen.orientation.angle;
  }
  const legacy = (window as Window & { orientation?: number }).orientation;
  if (Number.isFinite(legacy)) return legacy as number;
  return 0;
}

function addDeviceOrbitDelta(dXz: number, dYz: number): void {
  let dx = dXz;
  let dy = dYz;
  if (deviceOrbit.mode === 'xyz') {
    dx = -dx;
    dy = -dy;
  }
  if (deviceOrbit.invert) {
    dx = -dx;
    dy = -dy;
  }
  const turn = -MathUtils.degToRad(screenAngleDeg());
  const cs = Math.cos(turn);
  const sn = Math.sin(turn);
  deviceOrbit.targetXz += dx * cs - dy * sn;
  deviceOrbit.targetYz += dx * sn + dy * cs;
}

function applyOrientationDelta(beta: number, gamma: number, alpha: number | null): void {
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return;
  if (deviceOrbit.prevBeta == null) {
    deviceOrbit.prevBeta = beta;
    deviceOrbit.prevGamma = gamma;
    deviceOrbit.prevAlpha = alpha;
    return;
  }
  const dBeta = shortestAngle(MathUtils.degToRad(beta - deviceOrbit.prevBeta));
  const dGamma = shortestAngle(MathUtils.degToRad(gamma - (deviceOrbit.prevGamma as number)));
  const dAlpha = Number.isFinite(alpha) && Number.isFinite(deviceOrbit.prevAlpha)
    ? shortestAngle(MathUtils.degToRad((alpha as number) - (deviceOrbit.prevAlpha as number)))
    : 0;
  deviceOrbit.prevBeta = beta;
  deviceOrbit.prevGamma = gamma;
  deviceOrbit.prevAlpha = alpha;
  if (deviceOrbit.locked) return;
  if (Math.abs(dBeta) > 1 || Math.abs(dGamma) > 1 || Math.abs(dAlpha) > 1) return;
  addDeviceOrbitDelta(dGamma + dAlpha, -dBeta);
}

function applyGravitySample(x: number, y: number, z: number): void {
  const len = Math.hypot(x, y, z);
  if (len < 4) return;
  const roll = Math.atan2(x / len, Math.max(0.12, -y / len));
  const pitch = Math.atan2(z / len, Math.max(0.12, -y / len));
  if (deviceOrbit.prevRoll == null) {
    deviceOrbit.prevRoll = roll;
    deviceOrbit.prevPitch = pitch;
    return;
  }
  const dRoll = shortestAngle(roll - deviceOrbit.prevRoll);
  const dPitch = shortestAngle(pitch - (deviceOrbit.prevPitch as number));
  deviceOrbit.prevRoll = roll;
  deviceOrbit.prevPitch = pitch;
  if (deviceOrbit.locked) return;
  if (Math.abs(dRoll) > 1 || Math.abs(dPitch) > 1) return;
  addDeviceOrbitDelta(dRoll, -dPitch);
}

function sensorCtor(name: 'DeviceOrientationEvent' | 'DeviceMotionEvent'): PermissionedSensor | undefined {
  const ctor = (globalThis as Record<string, unknown>)[name];
  return typeof ctor === 'function' ? ctor as PermissionedSensor : undefined;
}

function onDeviceOrientation(event: DeviceOrientationEvent): void {
  if (event.beta == null || event.gamma == null) return;
  deviceOrbit.useGyro = false;
  applyOrientationDelta(event.beta, event.gamma, event.alpha);
}

function onDeviceMotion(event: DeviceMotionEvent): void {
  if (!deviceOrbit.useGyro && deviceOrbit.prevBeta != null) return;
  const g = event.accelerationIncludingGravity;
  if (!g || g.x == null || g.y == null || g.z == null) return;
  applyGravitySample(g.x, g.y, g.z);
}

const tiltStateListeners = new Set<() => void>();

export function onTiltStateChange(fn: () => void): () => void {
  tiltStateListeners.add(fn);
  return () => tiltStateListeners.delete(fn);
}

function notifyTiltState(): void {
  for (const fn of tiltStateListeners) fn();
}

export function startDeviceOrbitListeners(): void {
  if (deviceOrbit.listening) return;
  deviceOrbit.listening = true;
  window.addEventListener('deviceorientation', onDeviceOrientation, true);
  window.addEventListener('deviceorientationabsolute', onDeviceOrientation as EventListener, true);
  window.addEventListener('devicemotion', onDeviceMotion, true);
  window.addEventListener('orientationchange', forgetDevicePrev);
  notifyTiltState();
}

export function sensorsAvailable(): boolean {
  return Boolean(sensorCtor('DeviceOrientationEvent') || sensorCtor('DeviceMotionEvent'));
}

export function tiltNeedsHttps(): boolean {
  return !window.isSecureContext && !sensorsAvailable();
}

export function lanHttpsUrl(): string {
  if (location.protocol === 'https:') return location.href;
  const port = location.port && location.port !== '80' ? `:${location.port}` : '';
  return `https://${location.hostname}${port}${location.pathname}${location.search}${location.hash}`;
}

export function needsMotionPermission(): boolean {
  const orientation = sensorCtor('DeviceOrientationEvent');
  const motion = sensorCtor('DeviceMotionEvent');
  return typeof orientation?.requestPermission === 'function'
    || typeof motion?.requestPermission === 'function';
}

export async function enableDeviceOrbit(): Promise<boolean> {
  if (!deviceTiltOn()) return false;
  if (deviceOrbit.listening) return true;
  if (needsMotionPermission()) {
    try {
      const motion = sensorCtor('DeviceMotionEvent');
      const orientation = sensorCtor('DeviceOrientationEvent');
      const asks = [
        motion?.requestPermission?.bind(motion),
        orientation?.requestPermission?.bind(orientation),
      ].filter((fn): fn is () => Promise<PermissionState | string> => typeof fn === 'function');
      const results = await Promise.all(asks.map((fn) => fn()));
      if (!results.some((state) => state === 'granted')) {
        notifyTiltState();
        return false;
      }
    } catch {
      notifyTiltState();
      return false;
    }
  }
  startDeviceOrbitListeners();
  return true;
}

export function tickDeviceOrbit(): void {
  deviceOrbit.xz += (deviceOrbit.targetXz - deviceOrbit.xz) * 0.18;
  deviceOrbit.yz += (deviceOrbit.targetYz - deviceOrbit.yz) * 0.18;
}
