import { rng, gaussian, TAU, wrap, delta, CellList } from '../shared/math.mjs';
export const defaults={ slowdown: .98, persistence: .06 };
export const presets=[
  {name:'Clusters',values:{slowdown:.98,persistence:.06}},
  {name:'Gas',values:{slowdown:0,persistence:.06}},
  {name:'Short memory',values:{slowdown:.98,persistence:1.2}}
];
export function create(seed=1,params=defaults,n=640){
  const random=rng(seed),x=new Float64Array(n),y=x.slice(),angle=x.slice(),density=x.slice(),vx=x.slice(),vy=x.slice();
  let time=0;const cells=new CellList(n);
  for(let i=0;i<n;i++){x[i]=random();y[i]=random();angle[i]=random()*TAU;}
  return {
    kind:'active',n,params:{...defaults,...params},x,y,angle,density,get time(){return time;},
    step(){
      density.fill(0);vx.fill(0);vy.fill(0);
      // Quorum-sensing motility, not an excluded-volume ABP simulation.
      cells.pairs(x,y,.055,(i,j,dx,dy,d2)=>{
        const r=Math.sqrt(d2),w=1-r/.055;density[i]+=w;density[j]+=w;
        if(r<.011&&r>1e-8){ const f=.12*(.011-r)/r;vx[i]+=f*dx;vy[i]+=f*dy;vx[j]-=f*dx;vy[j]-=f*dy; }
      });
      const dt=.04;
      for(let i=0;i<n;i++){
        angle[i]=wrap(angle[i]+Math.sqrt(2*this.params.persistence*dt)*gaussian(random),TAU);
        const speed=.055*(1-this.params.slowdown*(1-Math.exp(-density[i]/2.2)));
        x[i]=wrap(x[i]+dt*(speed*Math.cos(angle[i])+vx[i]));
        y[i]=wrap(y[i]+dt*(speed*Math.sin(angle[i])+vy[i]));
      }
      time+=dt;
    },
    interact(px,py){for(let i=0;i<n;i++)if(Math.hypot(delta(x[i]-px),delta(y[i]-py))<.16)angle[i]=Math.atan2(delta(y[i]-py),delta(x[i]-px));},
    values(){return [...x,...y,...angle,...density];},
    metrics(){return {'In dense regions':`${(100*density.filter(v=>v>4).length/n).toFixed(0)}%`,'Particles':n};}
  };
}
