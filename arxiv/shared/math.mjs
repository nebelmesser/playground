export const TAU = Math.PI * 2;
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const wrap = (x, n = 1) => ((x % n) + n) % n;
export const delta = (x, n = 1) => x - Math.round(x / n) * n;
export const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gaussian(random) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-12, random()))) * Math.cos(TAU * random());
}
export function grid(n) {
  const left = new Int32Array(n * n), right = left.slice(), up = left.slice(), down = left.slice();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = x + y * n;
    left[i] = wrap(x - 1, n) + y * n; right[i] = wrap(x + 1, n) + y * n;
    up[i] = x + wrap(y - 1, n) * n; down[i] = x + wrap(y + 1, n) * n;
  }
  return { n, left, right, up, down };
}
export function lap(a, i, g) {
  return a[g.left[i]] + a[g.right[i]] + a[g.up[i]] + a[g.down[i]] - 4 * a[i];
}
// In-place radix-2 FFT. Forward is unnormalised; inverse divides by N.
export function fft(re, im, inverse = false) {
  const n = re.length;
  if (n < 2 || (n & (n - 1))) throw new RangeError('FFT size must be a power of two');
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (inverse ? 1 : -1) * TAU / len, wr = Math.cos(angle), wi = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let ar = 1, ai = 0;
      for (let j = 0; j < len / 2; j++) {
        const p = i + j, q = p + len / 2;
        const br = re[q] * ar - im[q] * ai, bi = re[q] * ai + im[q] * ar;
        re[q] = re[p] - br; im[q] = im[p] - bi; re[p] += br; im[p] += bi;
        const nr = ar * wr - ai * wi; ai = ar * wi + ai * wr; ar = nr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
export function stamp(a, n, x, y, radius, fn) {
  const cx = x * n, cy = y * n;
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    if (dx * dx + dy * dy > radius * radius) continue;
    const i = wrap(Math.floor(cx + dx), n) + n * wrap(Math.floor(cy + dy), n);
    a[i] = fn(a[i], dx, dy);
  }
}
// Periodic linked cells; only neighbouring cells can contain a pair in range.
export class CellList {
  constructor(count){this.next=new Int32Array(count);this.head=new Int32Array(0);this.cells=0;}
  pairs(x,y,radius,visit){
    const cells=Math.max(3,Math.floor(1/radius)),r2=radius*radius;
    if(cells!==this.cells){this.cells=cells;this.head=new Int32Array(cells*cells);}
    const head=this.head,next=this.next;head.fill(-1);
    for(let i=0;i<x.length;i++){const c=Math.floor(x[i]*cells)+cells*Math.floor(y[i]*cells);next[i]=head[c];head[c]=i;}
    for(let i=0;i<x.length;i++){
      const cx=Math.floor(x[i]*cells),cy=Math.floor(y[i]*cells);
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        const c=wrap(cx+ox,cells)+cells*wrap(cy+oy,cells);
        for(let j=head[c];j>=0;j=next[j]){
          if(j<=i)continue;const dx=delta(x[i]-x[j]),dy=delta(y[i]-y[j]),d2=dx*dx+dy*dy;
          if(d2<r2)visit(i,j,dx,dy,d2);
        }
      }
    }
  }
}
