import {rng,clamp} from '../shared/math.mjs';
export const defaults={signal:8,nutrient:.02};
export const presets=[{name:'Two calls',values:{...defaults}},{name:'Stay together',values:{signal:12,nutrient:.02}},{name:'Food returns sooner',values:{signal:8,nutrient:.12}}];
export function create(seed=1,params=defaults){
  const random=rng(seed),n=88,N=n*n,dx=50/n,b=new Float64Array(N),a=b.slice(),food=b.slice(),next=b.slice(),rightFlux=b.slice(),downFlux=b.slice(),out=b.slice(),scale=b.slice();let time=0;
  const right=new Int32Array(N),down=right.slice(),left=right.slice(),up=right.slice();
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=x+n*y;right[i]=(x+1)%n+n*y;left[i]=(x+n-1)%n+n*y;down[i]=x+n*((y+1)%n);up[i]=x+n*((y+n-1)%n);b[i]=1+.08*(random()-.5);a[i]=food[i]=1;}
  const initialMass=b.reduce((s,v)=>s+v,0);
  const state={kind:'two-calls',n,b,a,food,initialMass,params:{...defaults,...params},get time(){return time;},setParams(p){Object.assign(this.params,p);},
    step(){for(let k=0;k<6;k++)advance(.015);time+=.09;},
    interact(px,py){const cx=clamp(px)*n,cy=clamp(py)*n;for(let y=0;y<n;y++)for(let x=0;x<n;x++){let xx=x-cx,yy=y-cy;xx-=Math.round(xx/n)*n;yy-=Math.round(yy/n)*n;const d=(xx*xx+yy*yy)/45;if(d<5)food[x+n*y]=Math.min(3,food[x+n*y]+.2*Math.exp(-d));}},
    values(){return [...b,...a,...food];},metrics(){return {'Cell mass':b.reduce((s,v)=>s+v,0).toFixed(2),'Peak density':Math.max(...b).toFixed(2),'Food remaining':(food.reduce((s,v)=>s+v,0)/N).toFixed(2)};}
  };
  function advance(dt){
    const ka=clamp(state.params.signal,0,18),beta=clamp(state.params.nutrient,.005,.2);out.fill(0);const f=dt/dx;
    for(let i=0;i<N;i++)for(let axis=0;axis<2;axis++){
      const j=axis?down[i]:right[i],v=(ka*(a[j]-a[i])+14*(food[j]-food[i]))/dx,donor=v>=0?b[i]:b[j],flux=-(b[j]-b[i])/dx+v*donor/(1+donor*donor);
      (axis?downFlux:rightFlux)[i]=flux;if(flux>0)out[i]+=f*flux;else out[j]-=f*flux;
    }
    for(let i=0;i<N;i++)scale[i]=out[i]>b[i]?b[i]/out[i]:1;
    next.set(b);
    for(let i=0;i<N;i++)for(let axis=0;axis<2;axis++){const j=axis?down[i]:right[i],flux=(axis?downFlux:rightFlux)[i],mass=f*flux*(flux>=0?scale[i]:scale[j]);next[i]-=mass;next[j]+=mass;}
    b.set(next);
    for(const [field,D,isFood] of [[a,2.5,false],[food,.75,true]]){
      for(let i=0;i<N;i++){
        const v=field[i]+dt*D/(dx*dx)*(field[left[i]]+field[right[i]]+field[up[i]]+field[down[i]]-4*field[i]);
        if(isFood){const decay=Math.exp(-beta*b[i]*dt);next[i]=b[i]>1e-10?v*decay+(1-decay)/b[i]:v+beta*dt;}
        else next[i]=v*Math.exp(-dt)+b[i]*(1-Math.exp(-dt));
      }field.set(next);
    }
  }return state;
}
