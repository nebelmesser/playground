function geom(v){const size=Math.min(v.w-42,v.h-70);return{x:(v.w-size)/2,y:(v.h-size)/2-8,w:size,h:size};}
export function draw(view,m){const {ctx:c}=view,r=geom(view),px=x=>r.x+r.w*(.5+x/5),py=y=>r.y+r.h*(.5+y/5);c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();
 for(let k=m.history.length-2;k>=0;k--){const a=m.history[k],b=m.history[k+1];c.strokeStyle=`rgba(107,155,182,${.03+.17*(1-k/m.history.length)})`;c.lineWidth=.65;c.beginPath();for(let i=0;i<m.n;i++){c.moveTo(px(a.x[i]),py(a.y[i]));c.lineTo(px(b.x[i]),py(b.y[i]));}c.stroke();}
 for(let i=0;i<m.n;i++){const speed=Math.hypot(m.vx[i],m.vy[i]),t=Math.min(1,speed/1.2);c.fillStyle=`rgb(${Math.round(141+109*t)},${Math.round(178+28*t)},${Math.round(192-42*t)})`;c.beginPath();c.arc(px(m.x[i]),py(m.y[i]),1.4+.45*t,0,Math.PI*2);c.fill();}c.restore();
 c.strokeStyle='#22323c';c.lineWidth=1;c.strokeRect(r.x,r.y,r.w,r.h);c.font='11px ui-monospace,monospace';c.fillStyle='#8293a1';c.fillText('OPEN BOUNDARY · DIRECT PAIR GRAVITY',r.x,r.y+r.h+20);
}
export function point(view,x,y){const r=geom(view);return{x:Math.max(0,Math.min(1,(x-r.x)/r.w)),y:Math.max(0,Math.min(1,(y-r.y)/r.h))};}
