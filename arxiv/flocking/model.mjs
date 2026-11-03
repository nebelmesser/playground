import{rng,TAU,wrap,delta,CellList}from '../shared/math.mjs';
export const defaults={noise:3.2,radius:.075};
export const presets=[{name:'Near the transition',values:{noise:3.2,radius:.075}},{name:'Shared direction',values:{noise:.35,radius:.075}},{name:'Disorder',values:{noise:5.5,radius:.075}}];
export function create(seed=1,params=defaults,n=700){
  const random=rng(seed),x=new Float64Array(n),y=x.slice(),angle=x.slice(),next=x.slice(),cs=x.slice(),sn=x.slice(),sx=x.slice(),sy=x.slice(),cells=new CellList(n);let time=0;
  for(let i=0;i<n;i++){x[i]=random();y[i]=random();angle[i]=random()*TAU;}
  return{
    kind:'flock',n,x,y,angle,params:{...defaults,...params},get time(){return time;},
    step(){
      for(let i=0;i<n;i++){cs[i]=Math.cos(angle[i]);sn[i]=Math.sin(angle[i]);}
      sx.set(cs);sy.set(sn);
      cells.pairs(x,y,this.params.radius,(i,j)=>{sx[i]+=cs[j];sy[i]+=sn[j];sx[j]+=cs[i];sy[j]+=sn[i];});
      for(let i=0;i<n;i++){
        next[i]=Math.atan2(sy[i],sx[i])+this.params.noise*(random()-.5);
      }
      // Synchronous direction update; positions use the newly computed heading.
      for(let i=0;i<n;i++){angle[i]=wrap(next[i],TAU);x[i]=wrap(x[i]+.003*Math.cos(angle[i]));y[i]=wrap(y[i]+.003*Math.sin(angle[i]));}
      time++;
    },
    interact(px,py){for(let i=0;i<n;i++)if(Math.hypot(delta(x[i]-px),delta(y[i]-py))<.2)angle[i]=wrap(Math.atan2(delta(y[i]-py),delta(x[i]-px))+Math.PI/2,TAU);},
    values(){return[...x,...y,...angle];},
    metrics(){let sx=0,sy=0;for(const a of angle){sx+=Math.cos(a);sy+=Math.sin(a);}return{'Polarization':(Math.hypot(sx,sy)/n).toFixed(3),'Particles':n};}
  };
}
