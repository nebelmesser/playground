import {rng,clamp} from '../shared/math.mjs';

export const defaults={mobility:1,dissolve:0,radius:.014,pins:3};
export const presets=[
  {name:'Held grains',values:{...defaults}},
  {name:'Without particles',values:{...defaults,pins:0}},
  {name:'Dissolving particles',values:{...defaults,dissolve:.00008}}
];
export const tools=[
  {id:'pin',label:'Place particles',hint:'Add circular second-phase particles across moving fronts; their contact points can slide.'},
  {id:'release',label:'Release a boundary',hint:'Remove particles under your hand and reconnect the grain interfaces they interrupted.'}
];
const H=.0065,DT=.04,MU=.000035;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const node=(x,y,pin=-1)=>({x,y,pin});
export function pathLength(path){let s=0,a=path.nodes;for(let i=1;i<a.length;i++)s+=dist(a[i-1],a[i]);if(path.closed&&a.length>1)s+=dist(a.at(-1),a[0]);return s;}
function remesh(path){
  const a=path.nodes,n=a.length;if(n<2)return path;const edges=path.closed?n:n-1,s=[0];
  for(let i=0;i<edges;i++)s.push(s.at(-1)+dist(a[i],a[(i+1)%n]));
  const length=s.at(-1);if(length<1e-8)return path;
  const count=Math.max(path.closed?8:1,Math.ceil(length/H)),out=[];let k=0;
  for(let i=0;i<(path.closed?count:count+1);i++){
    if(!path.closed&&(i===0||i===count)){out.push({...a[i===0?0:n-1]});continue;}
    const t=length*i/count;while(k<edges-1&&s[k+1]<t)k++;const u=(t-s[k])/Math.max(1e-12,s[k+1]-s[k]),v=a[k],w=a[(k+1)%n];out.push(node(v.x+(w.x-v.x)*u,v.y+(w.y-v.y)*u));
  }return {closed:path.closed,nodes:out};
}
// Arclength-lumped gradient of gamma*length. With two neighbours this
// converges to -mu*gamma*kappa*n. Contact nodes move freely, then project.
export function relaxPath(path,particles,mobility,dt){
  const a=path.nodes,n=a.length,out=[];
  for(let i=0;i<n;i++){
    const u=a[i];let fx=0,fy=0,dual=0;
    for(const j of [i-1,i+1]){
      if(!path.closed&&(j<0||j>=n))continue;
      const v=a[(j+n)%n],d=dist(u,v);if(d<1e-10)continue;fx+=(v.x-u.x)/d;fy+=(v.y-u.y)/d;dual+=d*.5;
    }
    let x=u.x+mobility*dt*fx/Math.max(.001,dual),y=u.y+mobility*dt*fy/Math.max(.001,dual);
    if(u.pin>=0){const c=particles.get(u.pin);if(c){let dx=x-c.x,dy=y-c.y,d=Math.hypot(dx,dy);if(d<1e-12){dx=u.x-c.x;dy=u.y-c.y;d=Math.hypot(dx,dy)||1;}x=c.x+c.r*dx/d;y=c.y+c.r*dy/d;}}
    out.push(node(x,y,u.pin));
  }return {closed:path.closed,nodes:out};
}
function inside(u,c){return (u.x-c.x)**2+(u.y-c.y)**2<(c.r-1e-8)**2;}
function crossings(a,b,c){
  const dx=b.x-a.x,dy=b.y-a.y,ox=a.x-c.x,oy=a.y-c.y,A=dx*dx+dy*dy;
  if(A<1e-18)return [];const B=2*(dx*ox+dy*oy),C=ox*ox+oy*oy-c.r*c.r,D=B*B-4*A*C;
  if(D<=0)return [];const d=Math.sqrt(D);return [(-B-d)/(2*A),(-B+d)/(2*A)].filter(t=>t>1e-8&&t<1-1e-8).sort((a,b)=>a-b);
}
// Remove the grain-boundary portion INSIDE a particle. Each remaining end
// is a separate GB/particle contact, with no fictitious GB through the disk.
function cutPath(path,c){
  let a=path.nodes;if(a.length<2)return [path];
  if(path.closed){let k=a.findIndex(u=>!inside(u,c));if(k<0)return [];a=[...a.slice(k),...a.slice(0,k),a[k]];}
  let current=[],out=[],changed=false;
  for(let i=0;i<a.length-1;i++){
    const u=a[i],v=a[i+1],ts=[0,...crossings(u,v,c),1];
    for(let k=0;k<ts.length-1;k++){
      const t0=ts[k],t1=ts[k+1],mid=(t0+t1)/2;
      const external=!inside({x:u.x+(v.x-u.x)*mid,y:u.y+(v.y-u.y)*mid},c);
      if(!external){changed=true;if(current.length>1){out.push({closed:false,nodes:current});}current=[];continue;}
      const p0=t0===0?{...u}:node(u.x+(v.x-u.x)*t0,u.y+(v.y-u.y)*t0,c.id),p1=t1===1?{...v}:node(u.x+(v.x-u.x)*t1,u.y+(v.y-u.y)*t1,c.id);
      if(!current.length)current.push(p0);if(dist(current.at(-1),p1)>1e-10)current.push(p1);
    }
  }
  if(current.length>1)out.push({closed:false,nodes:current});
  if(!changed)return [path];
  if(path.closed&&out.length>1){const first=out[0],last=out.at(-1);if(dist(last.nodes.at(-1),first.nodes[0])<1e-7){out=[{closed:false,nodes:[...last.nodes,...first.nodes.slice(1)]},...out.slice(1,-1)];}}
  return out;
}
function polygon(grain){return grain.parts.flatMap(p=>p.nodes);}
function area(grain){const a=polygon(grain);let s=0;for(let i=0;i<a.length;i++){const u=a[i],v=a[(i+1)%a.length];s+=u.x*v.y-u.y*v.x;}return Math.abs(s)/2;}
export function create(seed=1,params=defaults){
  const p={...defaults,...params},random=rng(seed);let time=0,nextParticle=0;
  const m={kind:'pinned-boundaries',params:p,grains:[],particles:new Map(),added:0,released:0,vanished:0,get time(){return time;}};
  const initial=[];
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){
    const id=col+4*row,cx=.14+col*.24+(random()-.5)*.02,cy=.17+row*.33+(random()-.5)*.025,rx=.097+(random()-.5)*.014,ry=.13+(random()-.5)*.018,phase=random()*Math.PI*2,nodes=[];
    for(let i=0;i<120;i++){const t=i*Math.PI*2/120,f=1+.065*Math.sin(3*t+phase)+.035*Math.cos(5*t-phase);nodes.push(node(cx+rx*f*Math.cos(t),cy+ry*f*Math.sin(t)));}
    const g={id,parts:[remesh({closed:true,nodes})]};m.grains.push(g);initial.push({g,cx,cy,rx,ry,phase});
  }
  m.energy=()=>m.grains.reduce((s,g)=>s+g.parts.reduce((v,path)=>v+pathLength(path),0),0);
  m.area=()=>m.grains.reduce((s,g)=>s+area(g),0);
  m.insertParticle=(x,y,r=p.radius)=>{
    x=clamp(x,.025,.975);y=clamp(y,.025,.975);r=clamp(r,.006,.023);
    if(m.particles.size>=100||[...m.particles.values()].some(c=>Math.hypot(c.x-x,c.y-y)<c.r+r+.003))return -1;
    const c={id:nextParticle++,x,y,r};m.particles.set(c.id,c);m.added++;
    for(const g of m.grains)g.parts=g.parts.flatMap(path=>cutPath(path,c)).map(remesh);
    return c.id;
  };
  m.removeParticle=id=>{
    if(!m.particles.has(id))return false;m.particles.delete(id);m.released++;
    for(const g of m.grains){
      let parts=g.parts,changed=true;
      while(changed){changed=false;for(let i=0;i<parts.length;i++){
        const a=parts[i],j=(i+1)%parts.length,b=parts[j];
        if(a.closed||a.nodes.at(-1)?.pin!==id||b.nodes[0]?.pin!==id)continue;
        if(parts.length===1){for(const u of a.nodes)if(u.pin===id)u.pin=-1;a.closed=true;changed=false;break;}
        const rotated=[...parts.slice(i),...parts.slice(0,i)],joined=[...rotated[0].nodes,...rotated[1].nodes];
        joined[rotated[0].nodes.length-1].pin=-1;joined[rotated[0].nodes.length].pin=-1;
        parts=[{closed:false,nodes:joined},...rotated.slice(2)];changed=true;break;
      }}
      for(const path of parts)for(const u of path.nodes)if(u.pin===id)u.pin=-1;
      g.parts=parts.map(remesh);
    }return true;
  };
  // Some isolated grains have three strong particles; others have none.
  // This gives both arrest and ongoing curvature motion without forced renewal.
  if(p.pins>0)for(const {g,cx,cy,rx,ry,phase} of initial)if(g.id%4!==3){
    for(let j=0;j<Math.round(p.pins);j++){
      const t=(j/Math.round(p.pins))*2*Math.PI+.25+phase*.12,f=1+.065*Math.sin(3*t+phase)+.035*Math.cos(5*t-phase);
      m.insertParticle(cx+rx*f*Math.cos(t),cy+ry*f*Math.sin(t),p.radius);
    }
  }
  m.setParams=next=>{Object.assign(p,next);p.mobility=clamp(p.mobility,.25,3);p.dissolve=clamp(p.dissolve,0,.0002);};
  m.step=()=>{
    if(p.dissolve>0)for(const c of [...m.particles.values()]){c.r-=p.dissolve*DT;if(c.r<=.0015)m.removeParticle(c.id);}
    const mobility=MU*p.mobility;
    // Four fixed substeps keep the smallest resolved fronts stable.
    for(let k=0;k<4;k++)for(const g of m.grains)g.parts=g.parts.map(path=>relaxPath(path,m.particles,mobility,DT/4));
    for(const g of m.grains){
      g.parts=g.parts.map(remesh);
      for(const c of m.particles.values())g.parts=g.parts.flatMap(path=>cutPath(path,c));
      g.parts=g.parts.filter(path=>path.nodes.length>1&&pathLength(path)>1e-6).map(remesh);
    }
    const before=m.grains.length;m.grains=m.grains.filter(g=>g.parts.length&&area(g)>.000035);m.vanished+=before-m.grains.length;time+=DT;
  };
  m.interact=(x,y,tool='pin')=>{
    x=clamp(x);y=clamp(y);
    if(tool==='release'){for(const c of [...m.particles.values()])if(Math.hypot(c.x-x,c.y-y)<c.r+.025)m.removeParticle(c.id);}
    else m.insertParticle(x,y);
  };
  m.values=()=>{const out=[time,m.added,m.released,m.vanished];for(const c of m.particles.values())out.push(c.id,c.x,c.y,c.r);for(const g of m.grains)for(const path of g.parts)for(const u of path.nodes)out.push(u.x,u.y,u.pin);return out;};
  m.metrics=()=>({'Grains remaining':m.grains.length,'Particles':m.particles.size,'Boundary length':m.energy().toFixed(2),'Released':m.released});
  return m;
}
