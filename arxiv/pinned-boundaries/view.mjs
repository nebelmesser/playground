const colours=['#657a7c','#787e68','#6f7389','#7f6a70','#75877a','#77868e','#8b7f68','#777b93','#8b777f','#6e8580','#8b8b78','#808798'];
export function draw(view,m){
  const {ctx}=view,r=view.rect(),x=u=>r.x+u*r.w,y=u=>r.y+u*r.h;
  ctx.fillStyle='#232b30';ctx.fillRect(r.x,r.y,r.w,r.h);
  for(const g of m.grains){
    const pts=g.parts.flatMap(p=>p.nodes);if(!pts.length)continue;
    ctx.fillStyle=colours[g.id%colours.length];ctx.beginPath();ctx.moveTo(x(pts[0].x),y(pts[0].y));for(let i=1;i<pts.length;i++)ctx.lineTo(x(pts[i].x),y(pts[i].y));ctx.closePath();ctx.fill();
    ctx.strokeStyle='#d1d8cd';ctx.lineWidth=Math.max(1,r.w/620);ctx.lineJoin='round';ctx.lineCap='round';
    for(const path of g.parts){const a=path.nodes;ctx.beginPath();ctx.moveTo(x(a[0].x),y(a[0].y));for(let i=1;i<a.length;i++)ctx.lineTo(x(a[i].x),y(a[i].y));if(path.closed)ctx.closePath();ctx.stroke();}
  }
  for(const c of m.particles.values()){
    const rad=c.r*r.w;ctx.fillStyle='#baa575';ctx.beginPath();ctx.arc(x(c.x),y(c.y),rad,0,2*Math.PI);ctx.fill();
    ctx.strokeStyle='#e1cfa5';ctx.lineWidth=.8;ctx.stroke();ctx.fillStyle='#6b6250';ctx.beginPath();ctx.arc(x(c.x)-rad*.12,y(c.y)+rad*.12,rad*.55,0,2*Math.PI);ctx.fill();
  }
  ctx.strokeStyle='#465153';ctx.lineWidth=1;ctx.strokeRect(r.x,r.y,r.w,r.h);
}
