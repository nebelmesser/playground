import {clamp, rng} from '../shared/math.mjs';

// Interpolate the staggered water-phase flux, then divide by the local water
// content. Coordinates and velocity use the unit square and pore-volume time.
export function waterVelocity(m, x, y) {
  const n=m.n;
  function interpolate(gx,gy,sample){
    const ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
    return (1-fy)*((1-fx)*sample(ix,iy)+fx*sample(ix+1,iy))
      +fy*((1-fx)*sample(ix,iy+1)+fx*sample(ix+1,iy+1));
  }
  const cx=clamp(x)*n,cy=clamp(y)*n;
  const ux=interpolate(cx,cy-.5,(i,j)=>{
    j=clamp(j,0,n-1);i=clamp(i,0,n);
    return i===0?m.inlet[j]:i===n?m.waterOut[j]:m.waterE[i-1+n*j];
  });
  const uy=interpolate(cx-.5,cy,(i,j)=>{
    i=clamp(i,0,n-1);j=clamp(j,0,n);
    return j===0||j===n?0:m.waterN[i+n*(j-1)];
  });
  const saturation=interpolate(cx-.5,cy-.5,(i,j)=>m.s[clamp(i,0,n-1)+n*clamp(j,0,n-1)]);
  return {x:ux/Math.max(.13,saturation),y:uy/Math.max(.13,saturation),saturation};
}

export function createFlow(seed,m,count=360){
  const random=rng((seed^0xa53c9e17)>>>0);
  const particles=Array.from({length:count},()=>({x:0,y:0,age:0,wait:random()*.28,tail:[]}));
  function release(p){
    let total=0;for(const q of m.inlet)total+=q;
    let pick=random()*total,row=0;
    while(row<m.n-1&&pick>m.inlet[row])pick-=m.inlet[row++];
    p.x=.001/m.n;p.y=(row+.15+.7*random())/m.n;p.age=0;p.wait=0;p.tail=[];
  }
  return {
    particles,
    advance(dt){
      if(!(dt>0))return;
      for(const p of particles){
        if(p.wait>0){p.wait-=dt;if(p.wait<=0)release(p);else continue;}
        p.age+=dt;
        let remaining=dt,exited=false;
        for(let k=0;remaining>1e-12&&k<80;k++){
          const v=waterVelocity(m,p.x,p.y),speed=Math.hypot(v.x,v.y);
          const step=Math.min(remaining,.35/(m.n*Math.max(speed,1e-9)));
          const mid=waterVelocity(m,p.x+.5*step*v.x,p.y+.5*step*v.y);
          p.x+=step*mid.x;p.y+=step*mid.y;remaining-=step;
          if(p.x>=1||p.x<0||p.y<0||p.y>1){exited=true;break;}
        }
        // Only the display markers are renewed; the water and oil are untouched.
        if(exited||p.age>.65){release(p);continue;}
        p.tail.push({x:p.x,y:p.y});if(p.tail.length>14)p.tail.shift();
      }
    }
  };
}
