const colour=c=>`hsl(${(28+(c-1)*137.508)%360} 56% 65%)`;
export function draw(view,m){
  const {ctx}=view,r=view.rect(),a=m.people,s=r.w/(m.L-1);
  ctx.fillStyle='#151b19';ctx.fillRect(r.x,r.y,r.w,r.h);
  // The field records actual compatibility groups, not an ancestry label.
  const selected=new Set(m.selected);
  for(let i=0;i<a.length;i++){
    const u=a[i],x=r.x+u.x*s,y=r.y+u.y*s,rad=Math.max(1.25,r.w/270);
    ctx.fillStyle=colour(u.colour);ctx.globalAlpha=.18;
    ctx.beginPath();ctx.arc(x,y,rad*2.6,0,2*Math.PI);ctx.fill();ctx.globalAlpha=.92;
    ctx.beginPath();ctx.ellipse(x,y,rad,rad*1.4,((u.x*17+u.y*31)%180)*Math.PI/180,0,2*Math.PI);ctx.fill();
    if(u.tag>.06||selected.has(i)){ctx.strokeStyle=`rgba(255,243,202,${Math.max(.2,u.tag*.8)})`;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(x,y,rad+2,0,2*Math.PI);ctx.stroke();}
  }ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(222,116,114,.24)';ctx.lineWidth=.7;
  for(const u of m.events){ctx.beginPath();ctx.arc(r.x+u.x*s,r.y+u.y*s,Math.max(2,r.w/230),0,2*Math.PI);ctx.stroke();}
  ctx.strokeStyle='#4a5349';ctx.strokeRect(r.x,r.y,r.w,r.h);
}
