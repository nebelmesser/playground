export function draw(view,m){const r=view.rect(),{ctx}=view,point=i=>[r.x+m.x[i]*r.w,r.y+m.y[i]*r.h];
  function thread(a,b,color,width=1){const u=point(a),v=point(b),cx=r.x+r.w/2,cy=r.y+r.h/2;ctx.beginPath();ctx.moveTo(...u);ctx.bezierCurveTo(u[0]*.4+cx*.6,u[1]*.4+cy*.6,v[0]*.4+cx*.6,v[1]*.4+cy*.6,...v);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  for(let i=0;i<m.n;i++)if(m.partner[i]>i){const distance=m.partner[i]-i;thread(i,m.partner[i],`rgba(${Math.round(150+65*distance/m.n)},${Math.round(193-40*distance/m.n)},${Math.round(185+35*distance/m.n)},.55)`,Math.max(.7,r.w*.0015));}
  if(m.last){for(const [a,b] of m.last.old)if(a>=0&&b>=0)thread(a,b,'rgba(228,124,108,.35)',1.3);for(const [a,b] of m.last.made)thread(a,b,'#f4d7a4',2);}
  for(let i=0;i<m.n;i++){const p=point(i),active=m.last?.sites.includes(i);ctx.fillStyle=i===m.anchor?'#fff3ca':active?'#f4d7a4':m.partner[i]<0?'#62646e':'#abc8c3';ctx.beginPath();ctx.arc(...p,active?3.4:Math.max(1.7,r.w*.004),0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#8e9d9c';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('Two ends of one open chain',r.x+r.w*.5,r.y+r.h*.035);}
