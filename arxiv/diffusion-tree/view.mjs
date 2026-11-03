export function draw(view,m){
  const {ctx}=view,r=view.rect(),c=(m.n-1)/2,s=r.w/m.n;
  ctx.save();ctx.strokeStyle='#1a2932';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(r.x+r.w/2,r.y+r.h/2,112*s,0,Math.PI*2);ctx.stroke();
  // Only matter that has actually attached is painted; brightness encodes age.
  for(let i=0;i<m.x.length;i++){
    const t=i/Math.max(1,m.x.length-1);
    ctx.fillStyle=`rgb(${Math.round(65+184*t)},${Math.round(99+102*t)},${Math.round(120+18*t)})`;
    const px=r.x+(m.x[i]+.5)*s,py=r.y+(m.y[i]+.5)*s;
    ctx.fillRect(px-s*.58,py-s*.58,s*1.16,s*1.16);
  }
  for(const i of m.seeds){ctx.fillStyle='#fff1ce';ctx.beginPath();ctx.arc(r.x+(i%m.n+.5)*s,r.y+(Math.floor(i/m.n)+.5)*s,Math.max(1.8,s*.9),0,Math.PI*2);ctx.fill();}
  if(m.walker){const [x,y]=m.walker;ctx.fillStyle='#a1d9d4';ctx.beginPath();ctx.arc(r.x+(x+.5)*s,r.y+(y+.5)*s,2.4,0,Math.PI*2);ctx.fill();}
  ctx.font='11px ui-monospace, monospace';ctx.fillStyle='#778391';ctx.textAlign='left';
  ctx.fillText('DIFFUSING FROM OUTSIDE',r.x,r.y+r.h+18);
  ctx.textAlign='right';ctx.fillText(m.stopped?'FINITE BOUNDARY REACHED':'OLD BLUE · NEW AMBER',r.x+r.w,r.y+r.h+18);
  ctx.restore();
}
