export const identity = () => [1, 0, 0, 1, 0, 0];
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function multiply(a, b) {
  return [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
}
export const point = (m, x, y) => [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]];
export function frameMatrix(frame, ratio, aligned = true) {
  const p = frame.adjust, angle = p.rotation * Math.PI / 180, s = p.scale / 100;
  const manual = [s*Math.cos(angle), s*Math.sin(angle), -s*Math.sin(angle), s*Math.cos(angle), 0, 0];
  manual[4] = .5 + p.x/100 - manual[0]*.5 - manual[2]*ratio/2;
  manual[5] = ratio/2 + p.y*ratio/100 - manual[1]*.5 - manual[3]*ratio/2;
  return multiply(manual, aligned ? frame.matrix : identity());
}

// A similarity has four degrees of freedom: uniform scale, rotation and translation.
// RANSAC rejects moving foliage, clouds and ambiguous repeated field textures.
export function fitSimilarity(matches, threshold = 3, iterations = 1400) {
  if (matches.length < 4) return null;
  let seed = 8491;
  const random = () => { seed = (Math.imul(seed, 1664525)+1013904223)>>>0; return seed/4294967296; };
  let best = [], bestError = Infinity;
  for (let k=0; k<iterations; k++) {
    const p=matches[Math.floor(random()*matches.length)], q=matches[Math.floor(random()*matches.length)];
    const dx=q.x-p.x, dy=q.y-p.y, d=dx*dx+dy*dy;
    if (d < 900) continue;
    const ux=q.u-p.u, uy=q.v-p.v, a=(dx*ux+dy*uy)/d, b=(dx*uy-dy*ux)/d;
    if (a*a+b*b < .36 || a*a+b*b > 2.56 || Math.abs(Math.atan2(b,a)) > .5) continue;
    const tx=p.u-a*p.x+b*p.y, ty=p.v-b*p.x-a*p.y;
    const inliers=[]; let error=0;
    for (const m of matches) {
      const e=(a*m.x-b*m.y+tx-m.u)**2+(b*m.x+a*m.y+ty-m.v)**2;
      if (e < threshold*threshold) { inliers.push(m); error+=e; }
    }
    if (inliers.length>best.length || (inliers.length===best.length && error<bestError)) { best=inliers; bestError=error; }
  }
  if (best.length<4) return null;
  let matrix;
  for (let pass=0;pass<3;pass++) {
    const n=best.length, means=best.reduce((r,p)=>[r[0]+p.x/n,r[1]+p.y/n,r[2]+p.u/n,r[3]+p.v/n],[0,0,0,0]);
    let d=0, aa=0, bb=0;
    for (const p of best) { const x=p.x-means[0], y=p.y-means[1], u=p.u-means[2], v=p.v-means[3]; d+=x*x+y*y; aa+=x*u+y*v; bb+=x*v-y*u; }
    if (d<1) return null;
    const a=aa/d, b=bb/d;
    matrix=[a,b,-b,a,means[2]-a*means[0]+b*means[1],means[3]-b*means[0]-a*means[1]];
    const refined=matches.filter(p=>{const [u,v]=point(matrix,p.x,p.y);return (u-p.u)**2+(v-p.v)**2<threshold*threshold;});
    if (refined.length<4) break;
    best=refined;
  }
  const xs=best.map(p=>p.x), ys=best.map(p=>p.y);
  return {matrix, inlierMatches:best, inliers:best.length, matches:matches.length, spread:Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)), error:Math.sqrt(best.reduce((sum,p)=>{const [u,v]=point(matrix,p.x,p.y);return sum+(u-p.u)**2+(v-p.v)**2;},0)/best.length)};
}

const cross = (a,b,p) => (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
export function commonArea(matrices, ratio) {
  let poly=[[0,0],[1,0],[1,ratio],[0,ratio]];
  for (const m of matrices) {
    const bounds=[[0,0],[1,0],[1,ratio],[0,ratio]].map(([x,y])=>point(m,x,y));
    for(let j=0;j<4;j++) {
      const a=bounds[j], b=bounds[(j+1)%4], next=[];
      for(let i=0;i<poly.length;i++) {
        const p=poly[i], q=poly[(i+1)%poly.length], cp=cross(a,b,p), cq=cross(a,b,q);
        if(cp>=-1e-10) next.push(p);
        if((cp>=0)!==(cq>=0)) {const t=cp/(cp-cq);next.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
      }
      poly=next;
      if(poly.length<3) return [];
    }
  }
  return poly;
}
export function commonCrop(matrices, ratio) {
  const poly=commonArea(matrices,ratio);
  if(poly.length<3)return null;
  const cx=poly.reduce((s,p)=>s+p[0],0)/poly.length, cy=poly.reduce((s,p)=>s+p[1],0)/poly.length;
  const inside=p=>poly.every((a,i)=>cross(a,poly[(i+1)%poly.length],p)>=-1e-9);
  let lo=0,hi=1;
  for(let k=0;k<35;k++) { const s=(lo+hi)/2; const fits=[[-1,-1],[1,-1],[1,1],[-1,1]].every(([x,y])=>inside([cx+x*s/2,cy+y*s*ratio/2])); if(fits)lo=s;else hi=s; }
  if(lo<.02) return null;
  return {x:cx-lo/2,y:cy-lo*ratio/2,w:lo,h:lo*ratio};
}

// Crop coordinates use the reference image width as their unit, just like frame transforms.
// Keep the reference aspect ratio and constrain the selection to its visible bounds.
export function fitCrop(crop, ratio) {
  if(!crop||![crop.x,crop.y,crop.w].every(Number.isFinite))return {x:0,y:0,w:1,h:ratio};
  const w=clamp(crop.w,.05,1),h=w*ratio;
  return {x:clamp(crop.x,0,1-w),y:clamp(crop.y,0,ratio-h),w,h};
}
export function moveCrop(crop, dx, dy, ratio) {
  return fitCrop({...crop,x:crop.x+dx,y:crop.y+dy},ratio);
}
export function resizeCrop(crop, corner, dx, dy, ratio) {
  const sx=corner.includes('w')?-1:1,sy=corner.includes('n')?-1:1;
  const ax=sx<0?crop.x+crop.w:crop.x,ay=sy<0?crop.y+crop.h:crop.y;
  const limit=Math.min(sx<0?ax:1-ax,(sy<0?ay:ratio-ay)/ratio);
  const w=clamp(crop.w+(sx*dx+sy*dy*ratio)/(1+ratio*ratio),.05,limit);
  return {x:sx<0?ax-w:ax,y:sy<0?ay-w*ratio:ay,w,h:w*ratio};
}

export function stripPolygon(index, count, width, height, degrees) {
  // Angle describes the stripes themselves; projection uses their normal.
  const angle=(90-degrees)*Math.PI/180, nx=Math.cos(angle), ny=Math.sin(angle), tx=-ny, ty=nx;
  const reach=Math.abs(nx)*width+Math.abs(ny)*height;
  const lo=-reach/2+reach*index/count, hi=-reach/2+reach*(index+1)/count;
  const extent=Math.hypot(width,height);
  return [[lo,-extent],[hi,-extent],[hi,extent],[lo,extent]].map(([n,t])=>[width/2+nx*n+tx*t,height/2+ny*n+ty*t]);
}
