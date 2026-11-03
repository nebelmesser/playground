import {clamp, point, identity} from './geometry.mjs';

export function defaultRegions(region,ratio){
  return [{id:'automatic',x:0,y:region==='ground'?.3*ratio:0,w:1,h:region==='ground'?.7*ratio:ratio}];
}
export function fitRegion(region,ratio){
  const w=clamp(region.w,.02,1),h=clamp(region.h,.02*ratio,ratio);
  return {...region,x:clamp(region.x,0,1-w),y:clamp(region.y,0,ratio-h),w,h};
}
export function moveRegion(region,dx,dy,ratio){return fitRegion({...region,x:region.x+dx,y:region.y+dy},ratio);}
export function resizeRegion(region,corner,dx,dy,ratio){
  const west=corner.includes('w'),north=corner.includes('n');
  const x=west?clamp(region.x+dx,0,region.x+region.w-.02):region.x;
  const y=north?clamp(region.y+dy,0,region.y+region.h-.02*ratio):region.y;
  const right=west?region.x+region.w:clamp(region.x+region.w+dx,x+.02,1);
  const bottom=north?region.y+region.h:clamp(region.y+region.h+dy,y+.02*ratio,ratio);
  return {...region,x,y,w:right-x,h:bottom-y};
}
export function regionFromDrag(id,start,end,ratio){
  const x=clamp(Math.min(start[0],end[0]),0,1),y=clamp(Math.min(start[1],end[1]),0,ratio);
  const right=clamp(Math.max(start[0],end[0]),0,1),bottom=clamp(Math.max(start[1],end[1]),0,ratio);
  return right-x>=.02&&bottom-y>=.02*ratio?{id,x,y,w:right-x,h:bottom-y}:null;
}
export const inRegions=(x,y,regions,margin=0)=>regions.some(r=>x>=r.x-margin&&x<=r.x+r.w+margin&&y>=r.y-margin&&y<=r.y+r.h+margin);

// The source mask follows the last known alignment. Extra source-side margin lets
// descriptors find shifted objects; candidate targets are restricted to exact regions.
export function regionMask(width,height,regions,matrix=identity(),margin=0){
  const mask=new Uint8Array(width*height),[a,b,c,d,tx,ty]=matrix,det=a*d-b*c;
  if(Math.abs(det)<1e-8)return mask;
  for(const region of regions){
    const r={x:region.x-margin,y:region.y-margin,w:region.w+2*margin,h:region.h+2*margin};
    const inverse=[d/det,-b/det,-c/det,a/det,(c*ty-d*tx)/det,(b*tx-a*ty)/det];
    const corners=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]].map(([x,y])=>point(inverse,x,y));
    const x0=clamp(Math.floor(Math.min(...corners.map(p=>p[0]))*width),0,width),x1=clamp(Math.ceil(Math.max(...corners.map(p=>p[0]))*width),0,width);
    const y0=clamp(Math.floor(Math.min(...corners.map(p=>p[1]))*width),0,height),y1=clamp(Math.ceil(Math.max(...corners.map(p=>p[1]))*width),0,height);
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const u=a*(x+.5)/width+c*(y+.5)/width+tx,v=b*(x+.5)/width+d*(y+.5)/width+ty;
      if(u>=r.x&&u<=r.x+r.w&&v>=r.y&&v<=r.y+r.h)mask[y*width+x]=255;
    }
  }
  return mask;
}
