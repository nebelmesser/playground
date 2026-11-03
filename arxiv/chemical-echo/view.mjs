import {clamp} from '../shared/math.mjs';

export function draw(view,m){
  const r=view.rect(),ctx=view.ctx,n=m.n,rgb=[0,0,0];
  // A concentration keeps the same colour after an edit or a remote new maximum.
  const scale=.2,den=Math.log1p(20/scale);
  view.image(n,n,i=>{
    if(m.walls[i]){rgb[0]=29;rgb[1]=35;rgb[2]=37;return rgb;}
    const s=clamp(Math.log1p(m.c[i]/scale)/den);
    rgb[0]=10+206*s;rgb[1]=20+121*s;rgb[2]=26+59*s;return rgb;
  },r,true);
  ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
  // Crisp geometry makes editable walls distinct from the interpolated chemical field.
  ctx.fillStyle='#1d2325';
  for(let y=0;y<n;y++){let from=-1;for(let x=0;x<=n;x++){
    const wall=x<n&&m.walls[x+n*y];if(wall&&from<0)from=x;
    if(!wall&&from>=0){ctx.fillRect(r.x+from*r.w/n,r.y+y*r.h/n,(x-from)*r.w/n,r.h/n+.3);from=-1;}
  }}
  ctx.strokeStyle='rgba(249,224,178,.34)';ctx.lineWidth=.9;ctx.beginPath();
  for(let k=0;k<m.trail.length;k++){const q=m.trail[k],x=r.x+q.x*r.w/n,y=r.y+q.y*r.h/n;if(!k||q.break)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
  ctx.stroke();
  const x=r.x+m.drop.x*r.w/n,y=r.y+m.drop.y*r.h/n,rad=Math.max(4,m.radius*r.w/n);
  ctx.shadowColor='#fff0c6';ctx.shadowBlur=11;ctx.fillStyle='#fff4d4';ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#101d26';ctx.lineWidth=1.1;ctx.stroke();
  const speed=Math.hypot(m.drop.vx,m.drop.vy);
  if(speed>.05){ctx.strokeStyle='#fff4d4';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+m.drop.vx/speed*(rad+8),y+m.drop.vy/speed*(rad+8));ctx.stroke();}
  ctx.restore();ctx.strokeStyle='#536064';ctx.lineWidth=.7;ctx.strokeRect(r.x,r.y,r.w,r.h);
  ctx.font='10px ui-monospace,monospace';ctx.fillStyle='#a8b1ad';
  ctx.fillText('REPELLENT c · FIXED LOG SCALE 0–20',r.x,r.y+r.h+17);
  ctx.fillStyle='#758786';ctx.fillText('RIGHT EDGE: OPEN RESERVOIR',r.x,r.y+r.h+33);
}
