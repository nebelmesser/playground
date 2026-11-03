export function draw(view,m){
  const r=view.rect(),{ctx}=view,n=m.n;
  view.image(n,n,i=>{
    const v=Math.max(0,Math.min(1,(m.s[i]-.13)/.67)),t=(1-Math.exp(-4*v))/(1-Math.exp(-4));
    const rock=Math.max(0,Math.min(1,(m.base[i]-.58)/1.16)),ridge=Math.max(.15,Math.min(1,m.k[i]/m.base[i]));
    const oil=[49+24*rock,32+17*rock,29+12*rock],water=[174,223,200];
    return oil.map((a,j)=>(a*(1-t)+water[j]*t)*(.42+.58*ridge));
  },r,true);
  ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
  for(const p of m.flow.particles){
    if(p.wait>0||p.tail.length<2)continue;
    const i=Math.min(n-1,Math.max(0,Math.floor(p.x*n)))+n*Math.min(n-1,Math.max(0,Math.floor(p.y*n)));
    const amount=Math.max(0,Math.min(1,(m.s[i]-.145)/.16));if(amount<=0)continue;
    ctx.globalAlpha=amount;
    ctx.beginPath();for(let j=0;j<p.tail.length;j++){
      const q=p.tail[j],x=r.x+q.x*r.w,y=r.y+q.y*r.h;
      if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle='rgba(12,46,48,.72)';ctx.lineWidth=1.7;ctx.stroke();
    ctx.strokeStyle='rgba(246,253,228,.68)';ctx.lineWidth=.6;ctx.stroke();
    ctx.fillStyle='#f5ffe4';ctx.beginPath();ctx.arc(r.x+p.x*r.w,r.y+p.y*r.h,1.45,0,2*Math.PI);ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle='#b9ddd0';ctx.lineWidth=2;ctx.beginPath();
  for(let y=0;y<n;y++)if(m.inlet[y]>.05){
    const yy=r.y+(y+.5)/n*r.h;ctx.moveTo(r.x-5,yy);ctx.lineTo(r.x-2-Math.min(8,m.inlet[y]),yy);
  }
  ctx.stroke();ctx.fillStyle='#9ba7a5';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText('WATER IN',r.x,r.y-10);
  ctx.textAlign='right';ctx.fillText('FLUID OUT',r.x+r.w,r.y-10);
  ctx.textAlign='left';ctx.fillStyle='#879f98';ctx.fillText('MOVING MARKS FOLLOW WATER FLOW',r.x,r.y+r.h+18);
}
