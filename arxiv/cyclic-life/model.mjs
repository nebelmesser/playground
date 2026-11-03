import {rng,grid,lap,stamp,mean,TAU,delta} from '../shared/math.mjs';
export const defaults={mobility:.3,selection:1};
export const presets=[{name:'Spirals',values:{mobility:.3,selection:1}},{name:'Small waves',values:{mobility:.1,selection:1.2}},{name:'Mixing',values:{mobility:.65,selection:.7}}];
export function create(seed=1,params=defaults,n=112){
  const random=rng(seed),g=grid(n),centers=Array.from({length:12},()=>[random(),random(),random()*TAU]);
  let a=new Float64Array(n*n),b=a.slice(),c=a.slice(),na=a.slice(),nb=a.slice(),nc=a.slice(),time=0;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    let best=2,p=0;
    for(const [cx,cy,angle]of centers){const dx=delta(x/n-cx),dy=delta(y/n-cy),d=dx*dx+dy*dy;if(d<best){best=d;p=Math.atan2(dy,dx)+angle;}}
    const i=x+y*n;a[i]=.12+.4*Math.max(0,Math.cos(p));b[i]=.12+.4*Math.max(0,Math.cos(p+TAU/3));c[i]=.12+.4*Math.max(0,Math.cos(p-TAU/3));
  }
  return {
    kind:'cyclic',n,params:{...defaults,...params},get a(){return a;},get b(){return b;},get c(){return c;},get time(){return time;},
    step(){
      const dt=.16,D=this.params.mobility,s=this.params.selection;
      for(let i=0;i<a.length;i++){
        const vacancy=1-a[i]-b[i]-c[i];
        na[i]=a[i]+dt*(D*lap(a,i,g)+a[i]*(vacancy-s*c[i]));
        nb[i]=b[i]+dt*(D*lap(b,i,g)+b[i]*(vacancy-s*a[i]));
        nc[i]=c[i]+dt*(D*lap(c,i,g)+c[i]*(vacancy-s*b[i]));
      }
      [a,na]=[na,a];[b,nb]=[nb,b];[c,nc]=[nc,c];time+=dt;
    },
    interact(x,y){const species=Math.floor(random()*3),arrays=[a,b,c];for(let j=0;j<3;j++)stamp(arrays[j],n,x,y,6,()=>j===species?.75:.025);},
    values(){return [...a,...b,...c];},
    metrics(){return {'A · coral':mean(a).toFixed(3),'B · jade':mean(b).toFixed(3),'C · blue':mean(c).toFixed(3)};}
  };
}
