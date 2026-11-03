import {clamp} from '../shared/math.mjs';
const SITES=12;
function layout(v){const side=86,gap=23,size=Math.max(100,Math.min(v.w-32-side-gap,v.h-166)),width=size+side+gap,x=(v.w-width)/2,y=24+(v.h-166-size)/2;return{pair:{x,y,w:size,h:size},ladder:{x:x+size+gap,y,w:side,h:size},x,y,w:width,h:size};}
export function point(v,x,y){const r=layout(v);return{x:clamp((x-r.x)/r.w),y:clamp((y-r.y)/r.h),inside:x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h};}
export function draw(v,m){
  const {pair:r,ladder:l,x,y,w,h}=layout(v),c=v.ctx,rgb=[0,0,0],cell=r.w/SITES;
  v.image(SITES,SITES,i=>{const xx=i%SITES,yy=SITES-1-Math.floor(i/SITES),p=m.pair[xx+m.n*yy],s=clamp(Math.log1p(p*120)/Math.log(121));rgb[0]=10+221*s;rgb[1]=18+210*s;rgb[2]=31+157*s;return rgb;},r,true);
  // Fixed cell and exclusion geometry makes even a narrow wave packet readable.
  c.strokeStyle='#7d9aaf28';c.lineWidth=.6;c.beginPath();for(let j=0;j<=SITES;j++){c.moveTo(r.x+j*cell,r.y);c.lineTo(r.x+j*cell,r.y+r.h);c.moveTo(r.x,r.y+j*cell);c.lineTo(r.x+r.w,r.y+j*cell);}c.stroke();
  c.strokeStyle='#738b9d88';c.setLineDash([3,5]);c.beginPath();c.moveTo(r.x,r.y+r.h);c.lineTo(r.x+r.w,r.y);c.stroke();c.setLineDash([]);
  c.strokeStyle='#4b6577';c.lineWidth=.7;c.strokeRect(r.x,r.y,r.w,r.h);
  c.font='10px ui-monospace,monospace';c.fillStyle='#92a7b5';c.textAlign='center';for(const j of [0,3,6,9]){c.fillText(String(j),r.x+(j+.5)*cell,r.y+r.h+14);c.fillText(String(j),r.x-10,r.y+r.h-(j+.5)*cell+3);}c.textAlign='left';
  c.fillText('PAIR SITES',r.x,r.y-11);c.fillText('LAB SITES',l.x,l.y-11);

  // This is an absolute physical ladder, not a clock-driven scroll. The viewport
  // pages only when the true wall leaves its current twelve-site block.
  const base=Math.max(0,12*Math.floor((m.wall-4)/12))-2,range=24,dy=l.h/range,Y=j=>l.y+l.h-(j-base+.5)*dy,wallY=Y(m.wall-.5);
  c.fillStyle='#101c27';c.fillRect(l.x,l.y,l.w,l.h);c.save();c.beginPath();c.rect(l.x,l.y,l.w,l.h);c.clip();
  c.fillStyle='#6e533c45';c.fillRect(l.x,wallY,l.w,l.y+l.h-wallY);
  c.strokeStyle='#6e889c55';c.lineWidth=.8;
  for(let j=base;j<base+range;j++){const yy=Y(j);c.beginPath();c.moveTo(l.x+22,yy);c.lineTo(l.x+l.w-2,yy);c.stroke();if(j>=0&&j%4===0){c.fillStyle='#7c94a5';c.fillText(String(j),l.x+2,yy+3);}}
  // Old wall levels are actual measured positions; no interpolation creates ascent.
  c.strokeStyle='#d7ac6555';c.lineWidth=1;for(const q of m.history){const yy=Y(q.wall-.5);if(yy>=l.y&&yy<=l.y+l.h){c.beginPath();c.moveTo(l.x+l.w-13,yy);c.lineTo(l.x+l.w-2,yy);c.stroke();}}
  const centre=l.x+53;
  for(let j=0;j<m.n;j++){const yy=Y(m.wall+j);if(yy<l.y-dy||yy>l.y+l.h+dy)continue;const p=clamp(m.density[j]),rr=(l.w-34)*.47*Math.sqrt(p);if(p<1e-5)continue;
    c.fillStyle=`rgba(140,205,229,${.2+.8*Math.sqrt(p)})`;c.beginPath();c.ellipse(centre,yy,Math.max(1.1,rr),Math.max(1.1,dy*.39),0,0,Math.PI*2);c.fill();}
  c.strokeStyle='#f0cd8b';c.lineWidth=3;c.beginPath();c.moveTo(l.x+20,wallY);c.lineTo(l.x+l.w-1,wallY);c.stroke();c.restore();
  c.fillStyle='#d5bd8b';c.fillText('WALL',l.x,l.y+l.h+14);

  const stripY=y+h+32,stripH=21;c.fillStyle='#111e2a';c.fillRect(x,stripY,r.w,stripH);
  let visible=0;for(let j=0;j<SITES;j++){const a=clamp(m.density[j]);visible+=m.density[j];c.fillStyle=`rgba(154,206,223,${.08+.92*a})`;c.fillRect(x+j*r.w/SITES,stripY+1,r.w/SITES-1,stripH-2);}
  c.fillStyle='#92a7b5';c.fillText(`OCCUPATION · ${(100*visible/2).toFixed(0)}% IN VIEW`,x,stripY+stripH+15);
  c.fillStyle=m.held?'#f5d49c':'#7897a7';const status=m.held?'SPREADING · RELEASE TO READ':m.mode===2?'NO READINGS':m.mode===1?'FULL POSITION READINGS':'EDGE-ONLY READINGS';c.fillText(status,x,stripY+stripH+31);
}
