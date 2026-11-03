import {clamp} from '../shared/math.mjs';

export const defaults={diffusion:1,recovery:.01,layout:0};
export const presets=[{name:'Two sources',values:{...defaults}},{name:'A slower recovery',values:{diffusion:1,recovery:.007,layout:0}},{name:'One broken front',values:{diffusion:1,recovery:.01,layout:1}}];
export const tools=[
  {id:'wall',label:'Build boundary',hint:'Draw a reflecting boundary. Watch the sources change their paths.'},
  {id:'open',label:'Open boundary',hint:'Return a painted boundary to resting, excitable tissue.'},
  {id:'excite',label:'Excite tissue',hint:'Press to stimulate. Hold to supply a small sustained current.'},
  {id:'rest',label:'Make refractory',hint:'Leave a temporary recovering strip. It becomes excitable again.'}
];

export function create(seed=1,params=defaults){
  const p={...defaults,...params},n=192,N=n*n,dx=.6,dt=.008,substeps=12;
  const u=new Float64Array(N),v=u.slice(),du=u.slice(),dv=u.slice(),pu=u.slice(),pv=u.slice(),walls=new Uint8Array(N),trails=[];
  let time=0,tick=0,held=null,cores=[];
  const offset=((seed>>>0)%17-8)*.002*n;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=x+n*y;
    u[i]=+(x<(p.layout===1?n*.48:n*.85)&&x>(p.layout===1?-1:n*.15));
    v[i]=y>n*.51+offset?2.5:0;
  }
  const m={kind:'spiral-territories',n,u,v,walls,trails,params:p,dx,
    get time(){return time;},get cores(){return cores;},
    setParams(next){Object.assign(p,next);p.diffusion=clamp(+p.diffusion,.7,1.3);p.recovery=clamp(+p.recovery,.007,.02);},
    beginInteract(x,y,tool='wall'){held={x,y,tool};},
    endInteract(){held=null;},
    interact(x,y,tool='wall'){
      if(!Number.isFinite(x)||!Number.isFinite(y))return;
      if(held)held={x:clamp(x),y:clamp(y),tool};
      stamp(x,y,tool);
    },
    step(){
      for(let k=0;k<substeps;k++)advance();time+=dt*substeps;
      if(++tick%10===0){cores=locateCores();for(const c of cores){let best=null,d=36;for(const t of trails){const q=t.points.at(-1),dd=(q.x-c.x)**2+(q.y-c.y)**2;if(t.charge===c.charge&&time-q.time<2&&dd<d){d=dd;best=t;}}if(!best){best={charge:c.charge,points:[]};trails.push(best);}best.points.push({...c,time});if(best.points.length>220)best.points.shift();}for(let i=trails.length-1;i>=0;i--)if(time-trails[i].points.at(-1).time>80)trails.splice(i,1);}
    },
    values(){return [...u,...v,...walls];},
    metrics(){let active=0,recovering=0;for(let i=0;i<N;i++){if(u[i]>.5)active++;if(v[i]>.5)recovering++;}return {'Active tissue':`${(100*active/N).toFixed(1)}%`,'Recovering tissue':`${(100*recovering/N).toFixed(1)}%`,'Spiral centres':cores.length};}
  };
  function stamp(x,y,tool){
    const cx=clamp(x)*n,cy=clamp(y)*n,r=tool==='wall'||tool==='open'?2.7:5;
    for(let yy=Math.max(0,Math.floor(cy-r));yy<Math.min(n,Math.ceil(cy+r));yy++)for(let xx=Math.max(0,Math.floor(cx-r));xx<Math.min(n,Math.ceil(cx+r));xx++){
      if((xx+.5-cx)**2+(yy+.5-cy)**2>r*r)continue;const i=xx+n*yy;
      if(tool==='wall'){walls[i]=1;u[i]=v[i]=0;}else if(tool==='open'){walls[i]=0;u[i]=v[i]=0;}
      else if(!walls[i]&&tool==='excite')u[i]=Math.max(u[i],.98);
      else if(!walls[i]&&tool==='rest'){u[i]=0;v[i]=Math.max(v[i],1.5);}
    }
  }
  function rates(a,b,outU,outV){
    const f=p.diffusion/(dx*dx),cx=(held?.x??-9)*n,cy=(held?.y??-9)*n;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=x+n*y;if(walls[i]){outU[i]=outV[i]=0;continue;}
      const q=a[i],w=b[i],left=x&&!walls[i-1]?a[i-1]:q,right=x<n-1&&!walls[i+1]?a[i+1]:q,up=y&&!walls[i-n]?a[i-n]:q,down=y<n-1&&!walls[i+n]?a[i+n]:q;
      const current=held?.tool==='excite'&&(x+.5-cx)**2+(y+.5-cy)**2<25?.2:0;
      outU[i]=f*(left+right+up+down-4*q)-8*q*(q-.08)*(q-1)-q*w+current;
      outV[i]=(p.recovery+.2*w/(q+.3))*(-w-8*q*(q-1.1));
    }
  }
  // The predictor must stay immutable while the second RK stage reads neighbours.
  const ku=u.slice(),kv=u.slice();
  function advance(){rates(u,v,du,dv);for(let i=0;i<N;i++){pu[i]=u[i]+dt*du[i];pv[i]=v[i]+dt*dv[i];}rates(pu,pv,ku,kv);for(let i=0;i<N;i++){u[i]+=dt*.5*(du[i]+ku[i]);v[i]+=dt*.5*(dv[i]+kv[i]);}}
  function locateCores(){
    const found=[],phase=i=>Math.atan2(v[i]-.6,u[i]-.35),wrap=a=>a-Math.round(a/(2*Math.PI))*2*Math.PI;
    for(let y=1;y<n-2;y++)for(let x=1;x<n-2;x++){
      const i=x+n*y,ids=[i,i+1,i+n+1,i+n];if(ids.some(j=>walls[j]))continue;
      let sum=0;for(let k=0;k<4;k++)sum+=wrap(phase(ids[(k+1)%4])-phase(ids[k]));
      if(Math.abs(sum)>5)found.push({x:x+1,y:y+1,charge:Math.sign(sum)});
    }return found;
  }
  m.setParams(p);return m;
}
