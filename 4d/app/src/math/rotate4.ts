import type { Angles, DeviceOrbitState, Vec4 } from './types';

export function rotatePlane(a: number, b: number, cos: number, sin: number): [number, number] {
  return [a * cos - b * sin, a * sin + b * cos];
}

export function rotate4(
  v: Vec4,
  angles: Angles,
  orbit: DeviceOrbitState,
): Vec4 {
  let x = v[0];
  let y = v[1];
  let z = v[2];
  let w = v[3];
  let c: number;
  let s: number;
  let r: [number, number];

  c = Math.cos(angles.xy);
  s = Math.sin(angles.xy);
  r = rotatePlane(x, y, c, s);
  x = r[0];
  y = r[1];

  const xz = angles.xz + (orbit.mode === 'xyz' ? orbit.xz : 0);
  const yz = angles.yz + (orbit.mode === 'xyz' ? orbit.yz : 0);

  c = Math.cos(xz);
  s = Math.sin(xz);
  r = rotatePlane(x, z, c, s);
  x = r[0];
  z = r[1];

  c = Math.cos(yz);
  s = Math.sin(yz);
  r = rotatePlane(y, z, c, s);
  y = r[0];
  z = r[1];

  if (orbit.mode === 'xw-yw') {
    c = Math.cos(orbit.xz);
    s = Math.sin(orbit.xz);
    r = rotatePlane(x, w, c, s);
    x = r[0];
    w = r[1];
    c = Math.cos(orbit.yz);
    s = Math.sin(orbit.yz);
    r = rotatePlane(y, w, c, s);
    y = r[0];
    w = r[1];
  } else if (orbit.mode === 'zw') {
    c = Math.cos(orbit.yz);
    s = Math.sin(orbit.yz);
    r = rotatePlane(z, w, c, s);
    z = r[0];
    w = r[1];
  }

  c = Math.cos(angles.xw);
  s = Math.sin(angles.xw);
  r = rotatePlane(x, w, c, s);
  x = r[0];
  w = r[1];

  c = Math.cos(angles.yw);
  s = Math.sin(angles.yw);
  r = rotatePlane(y, w, c, s);
  y = r[0];
  w = r[1];

  c = Math.cos(angles.zw);
  s = Math.sin(angles.zw);
  r = rotatePlane(z, w, c, s);
  z = r[0];
  w = r[1];

  return [x, y, z, w];
}
