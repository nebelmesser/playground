import {clamp} from '../shared/math.mjs';
export function draw(view,m){
  const r=view.rect(),ctx=view.ctx,rgb=[0,0,0];
  view.image(m.n,m.n,i=>{if(m.walls[i]){rgb[0]=73;rgb[1]=76;rgb[2]=69;return rgb;}const a=clamp(m.u[i]),b=clamp(m.v[i]/1.8);rgb[0]=9+232*a+23*b;rgb[1]=24+205*a+25*b;rgb[2]=27+139*a+84*b;return rgb;},r,true);
  ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
  for(const t of m.trails){ctx.strokeStyle=t.charge>0?'#f5b578aa':'#91c6dbbb';ctx.lineWidth=1.4;ctx.beginPath();for(let k=0;k<t.points.length;k++){const q=t.points[k],x=r.x+q.x*r.w/m.n,y=r.y+q.y*r.h/m.n;if(k)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}
  for(const q of m.cores){ctx.strokeStyle=q.charge>0?'#ffcf92':'#bce8f4';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(r.x+q.x*r.w/m.n,r.y+q.y*r.h/m.n,4.5,0,Math.PI*2);ctx.stroke();}
  ctx.restore();ctx.strokeStyle='#536564';ctx.lineWidth=.7;ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.font='10px ui-monospace,monospace';ctx.fillStyle='#a5b1a7';ctx.fillText('CREAM: EXCITED · VIOLET: RECOVERING',r.x,r.y+r.h+17);ctx.fillStyle='#788e8a';ctx.fillText('CENTRE TRAILS RECORD SLOW DRIFT',r.x,r.y+r.h+33);
}
