import { clamp, rng } from '../shared/math.mjs';
export const defaults = { relief: 1, elasticity: 1, mobility: 1 };
export const presets = [{ name: 'Two uneven meetings', values: { ...defaults } }, { name: 'A flat support', values: { relief: 0, elasticity: 1, mobility: 1 } }, { name: 'A steeper support', values: { relief: 1.8, elasticity: 1, mobility: 1 } }];
export const tools = [{ id: 'raise', label: 'Raise the support', hint: 'Build a bounded smooth rise under the crystal. Its amplitudes and defects respond after resuming.' }, { id: 'flatten', label: 'Flatten the support', hint: 'Lower the local supporting relief. This preserves the current crystal rather than returning it to an earlier state.' }, { id: 'pair', label: 'Introduce a defect pair', hint: 'Insert opposite Burgers charges as an explicit disturbance. They may approach, bend their paths and annihilate.' }];
const vectors = [[-Math.sqrt(3) / 2, -.5], [0, 1], [Math.sqrt(3) / 2, -.5]], B = -.12, t = .5, v = 1, baseAmplitude = (t + Math.sqrt(t * t - 15 * v * B)) / (15 * v);
const smooth = x => { const s = clamp(x); return s * s * (3 - 2 * s); };
export function create(seed = 1, params = defaults, n = 72) {
  const p = { ...defaults, ...params }, random = rng(seed), N = n * n, dx = Math.max(2, Math.round(n / 6)) * 4 * Math.PI / Math.sqrt(3) / n, dy = Math.max(2, Math.round(n / 10)) * 4 * Math.PI / n, real = Array.from({ length: 3 }, () => new Float64Array(N).fill(baseAmplitude)), imaginary = real.map(a => new Float64Array(N));
  const rawHeight = new Float64Array(N), height = rawHeight.slice(), area = rawHeight.slice(), edges = [], weights = new Float64Array(3 * N), mobility = real.map(a => a.slice());
  const firstR = real.map(a => a.slice()), firstI = real.map(a => a.slice()), secondR = real.map(a => a.slice()), secondI = real.map(a => a.slice()), gradientR = real.map(a => a.slice()), gradientI = real.map(a => a.slice()), nextR = real.map(a => a.slice()), nextI = real.map(a => a.slice());
  let time = 0, lastPair = null, defects = [], iterations = 0;
  const index = (x, y) => ((x + n) % n) + n * ((y + n) % n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = index(x, y);
    rawHeight[i] = 3.2 * (Math.exp(-(((y / n - .33) / .085) ** 2) / 2) + Math.exp(-(((y / n - .7) / .085) ** 2) / 2));
    edges.push([i, index(x + 1, y), 0], [i, index(x, y + 1), 1], [i, index(x + 1, y + 1), 2]);
  }
  const phases = vectors.map(([kx, ky]) => [kx * dx, ky * dy, kx * dx + ky * dy].map(a => [Math.cos(a), Math.sin(a)]));
  const q = vectors.map(([kx, ky]) => 4 * (Math.sin(kx * dx / 2) ** 2 / (dx * dx) + Math.sin(ky * dy / 2) ** 2 / (dy * dy)));
  function triangle(a, b, c, pa, pb, pc, ab, bc, ca) {
    const u = pb.map((x, k) => x - pa[k]), z = pc.map((x, k) => x - pa[k]);
    const cross = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]], twiceArea = Math.hypot(...cross), dot = u.reduce((s, x, k) => s + x * z[k], 0), uu = u.reduce((s, x) => s + x * x, 0), zz = z.reduce((s, x) => s + x * x, 0);
    const cotA = dot / twiceArea, cotB = (uu - dot) / twiceArea, cotC = (zz - dot) / twiceArea;
    weights[ab] += .5 * cotC; weights[bc] += .5 * cotA; weights[ca] += .5 * cotB;
    area[a] += twiceArea / 6; area[b] += twiceArea / 6; area[c] += twiceArea / 6;
  }
  function rebuildSurface() {
    const relief = clamp(p.relief, 0, 2); for (let i = 0; i < N; i++) height[i] = rawHeight[i] * relief;
    area.fill(0); weights.fill(0);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = index(x, y), r = index(x + 1, y), d = index(x, y + 1), rd = index(x + 1, y + 1);
      const a = [0, 0, height[i]], b = [dx, 0, height[r]], c = [dx, dy, height[rd]], e = [0, dy, height[d]];
      triangle(i, r, rd, a, b, c, 3 * i, 3 * r + 1, 3 * i + 2);
      triangle(i, rd, d, a, c, e, 3 * i + 2, 3 * d, 3 * i + 1);
      const hx = (height[r] - height[index(x - 1, y)]) / (2 * dx), hy = (height[d] - height[index(x, y - 1)]) / (2 * dy), g = 1 + hx * hx + hy * hy;
      for (let k = 0; k < 3; k++) mobility[k][i] = 1 - (vectors[k][0] * hx + vectors[k][1] * hy) ** 2 / g;
    }
  }
  // G=e^{-ik·x} Δ_surface e^{ik·x}+|k|². Cotangent weights make
  // this operator Hermitian in the vertex-area inner product, also on a rise.
  function applyG(re, im, outR, outI, mode) {
    outR.fill(0); outI.fill(0);
    for (let edge = 0; edge < edges.length; edge++) {
      const [i, j, direction] = edges[edge], w = weights[edge], [c, s] = phases[mode][direction];
      const rj = c * re[j] - s * im[j], ij = s * re[j] + c * im[j], ri = c * re[i] + s * im[i], ii = -s * re[i] + c * im[i];
      outR[i] += w * (rj - re[i]) / area[i]; outI[i] += w * (ij - im[i]) / area[i];
      outR[j] += w * (ri - re[j]) / area[j]; outI[j] += w * (ii - im[j]) / area[j];
    }
    for (let i = 0; i < N; i++) { outR[i] += q[mode] * re[i]; outI[i] += q[mode] * im[i]; }
  }
  function energy(re = real, im = imaginary) {
    let total = 0; const A = clamp(p.elasticity, .4, 2);
    for (let k = 0; k < 3; k++) applyG(re[k], im[k], firstR[k], firstI[k], k);
    for (let i = 0; i < N; i++) {
      const r = re.map((a, k) => a[i] * a[i] + im[k][i] * im[k][i]), S = r[0] + r[1] + r[2];
      const prodR = (re[0][i] * re[1][i] - im[0][i] * im[1][i]) * re[2][i] - (re[0][i] * im[1][i] + im[0][i] * re[1][i]) * im[2][i];
      let density = B * S - 4 * t * prodR + 3 * v * S * S - 1.5 * v * (r[0] * r[0] + r[1] * r[1] + r[2] * r[2]);
      for (let k = 0; k < 3; k++) density += A * (firstR[k][i] ** 2 + firstI[k][i] ** 2);
      total += area[i] * density;
    }
    return total;
  }
  function advance(remaining) {
    const before = energy(), A = clamp(p.elasticity, .4, 2), M = clamp(p.mobility, .4, 2);
    for (let k = 0; k < 3; k++) applyG(firstR[k], firstI[k], secondR[k], secondI[k], k);
    for (let i = 0; i < N; i++) {
      const r = real.map((a, k) => a[i] ** 2 + imaginary[k][i] ** 2), S = r[0] + r[1] + r[2];
      for (let k = 0; k < 3; k++) {
        const j = (k + 1) % 3, l = (k + 2) % 3, cr = real[j][i] * real[l][i] - imaginary[j][i] * imaginary[l][i], ci = -(real[j][i] * imaginary[l][i] + imaginary[j][i] * real[l][i]), local = B + 6 * v * S - 3 * v * r[k];
        gradientR[k][i] = -M * mobility[k][i] * (A * secondR[k][i] + local * real[k][i] - 2 * t * cr);
        gradientI[k][i] = -M * mobility[k][i] * (A * secondI[k][i] + local * imaginary[k][i] - 2 * t * ci);
      }
    }
    let dt = Math.min(remaining, .025 / (A * M));
    for (let attempt = 0; attempt < 20; attempt++) {
      for (let k = 0; k < 3; k++) for (let i = 0; i < N; i++) { nextR[k][i] = real[k][i] + dt * gradientR[k][i]; nextI[k][i] = imaginary[k][i] + dt * gradientI[k][i]; }
      const after = energy(nextR, nextI);
      if (Number.isFinite(after) && after <= before + 1e-11) { for (let k = 0; k < 3; k++) { real[k].set(nextR[k]); imaginary[k].set(nextI[k]); } iterations++; return dt; }
      dt *= .5;
    }
    throw Error('Surface crystal failed its free-energy descent check');
  }
  function seedPair(cx, cy, separation = .15 * n) {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let xx = x - cx, yy = y - cy; xx -= Math.round(xx / n) * n; yy -= Math.round(yy / n) * n;
      const r1 = Math.hypot(xx + separation / 2, yy), r2 = Math.hypot(xx - separation / 2, yy), angle = Math.atan2(Math.sin(Math.atan2(yy, xx + separation / 2) - Math.atan2(yy, xx - separation / 2)), Math.cos(Math.atan2(yy, xx + separation / 2) - Math.atan2(yy, xx - separation / 2)));
      const envelope = 1 - smooth((Math.hypot(xx, yy) / n - .22) / .18), phase = angle * envelope, core = Math.tanh(r1 / 1.7) * Math.tanh(r2 / 1.7), i = index(x, y);
      for (const [k, sign] of [[0, 1], [2, -1]]) { const c = Math.cos(sign * phase), s = Math.sin(sign * phase), a = real[k][i], b = imaginary[k][i]; real[k][i] = core * (a * c - b * s); imaginary[k][i] = core * (a * s + b * c); }
    }
  }
  function findDefects() {
    const phase = Float64Array.from(real[0], (a, i) => Math.atan2(imaginary[0][i], a)); defects = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const list = [index(x, y), index(x + 1, y), index(x + 1, y + 1), index(x, y + 1)], winding = list.reduce((sum, i, k) => { const d = phase[list[(k + 1) % 4]] - phase[i]; return sum + d - 2 * Math.PI * Math.round(d / (2 * Math.PI)); }, 0), charge = Math.round(winding / (2 * Math.PI)); if (charge) defects.push({ x: (x + .5) / n, y: (y + .5) / n, charge }); }
  }
  rebuildSurface(); seedPair(n * (.28 + .02 * (random() - .5)), n * .31); seedPair(n * .7, n * (.69 + .02 * (random() - .5)), .17 * n); findDefects();
  return { kind: 'curved-crystal', params: p, n, real, imaginary, rawHeight, height, area, vectors, dx, dy, baseAmplitude,
    get time() { return time; }, get defects() { return defects; }, get iterations() { return iterations; },
    setParams(next) { Object.assign(p, next); rebuildSurface(); }, energy,
    step() { let elapsed = 0; while (elapsed < .075 - 1e-12) elapsed += advance(.075 - elapsed); time += elapsed; findDefects(); },
    interact(px, py, tool = 'raise') {
      const cx = clamp(px) * n, cy = clamp(py) * n;
      if (tool === 'pair') { if (lastPair && Math.hypot(cx - lastPair.x, cy - lastPair.y) < .12 * n && time - lastPair.time < 1) return; seedPair(cx, cy, .12 * n); lastPair = { x: cx, y: cy, time }; findDefects(); return; }
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let xx = x - cx, yy = y - cy; xx -= Math.round(xx / n) * n; yy -= Math.round(yy / n) * n; const w = Math.exp(-(xx * xx + yy * yy) / (.055 * n) ** 2), i = index(x, y); rawHeight[i] = tool === 'flatten' ? rawHeight[i] * (1 - .5 * w) : rawHeight[i] + .65 * w * (1 - rawHeight[i] / 8); }
      rebuildSurface();
    },
    values() { return [...real.flatMap(a => [...a]), ...imaginary.flatMap(a => [...a]), ...height]; },
    metrics() { return { 'Dislocation cores': String(defects.length), 'Free energy': energy().toFixed(3), 'Highest support': Math.max(...height).toFixed(2) }; },
  };
}
