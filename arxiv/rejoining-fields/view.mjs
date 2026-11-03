export function draw(view,m){
  const {ctx}=view,r=view.rect(),n=m.n,N=n-1;
  view.image(n,n,i=>{
    const j=m.current[i],t=Math.tanh(Math.abs(j)/18),warm=j>0;
    return [10+(warm?75:12)*t,18+(warm?30:41)*t,25+(warm?8:65)*t];
  },r,true);
  ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
  const map=(x,y)=>[r.x+x/N*r.w,r.y+y/N*r.h];
  // Fixed flux levels make changed connectivity legible without renormalising.
  for(let level=.009;level<.16;level+=.009){
    ctx.beginPath();
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const v=[m.a[x+y*n],m.a[x+1+y*n],m.a[x+1+(y+1)*n],m.a[x+(y+1)*n]],p=[];
      const vertices=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
      for(let k=0;k<4;k++){
        const l=(k+1)%4;
        if((v[k]<level)!==(v[l]<level)){
          const t=(level-v[k])/(v[l]-v[k]);p.push(map(vertices[k][0]+t*(vertices[l][0]-vertices[k][0]),vertices[k][1]+t*(vertices[l][1]-vertices[k][1])));
        }
      }
      for(let k=0;k+1<p.length;k+=2){ctx.moveTo(...p[k]);ctx.lineTo(...p[k+1]);}
    }
    ctx.strokeStyle=level<.03?'#90b4ac':'#c9d8be';ctx.globalAlpha=.65;ctx.lineWidth=.85;ctx.stroke();
  }
  ctx.globalAlpha=.8;ctx.strokeStyle='#e6a276';ctx.lineWidth=1.4;
  for(const p of m.trail){if(p.tail.length<2)continue;ctx.beginPath();p.tail.forEach(([x,y],i)=>{const X=r.x+x*r.w,Y=r.y+y*r.h;if(i)ctx.lineTo(X,Y);else ctx.moveTo(X,Y);});ctx.stroke();}
  ctx.restore();ctx.strokeStyle='#52625d';ctx.lineWidth=1;ctx.strokeRect(r.x,r.y,r.w,r.h);
  ctx.fillStyle='#899b98';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText('FLUX RECONNECTS · FLUID STAYS INSIDE',r.x,r.y+r.h+18);
}
