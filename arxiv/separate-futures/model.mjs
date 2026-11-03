import {rng,clamp} from '../shared/math.mjs';

export const defaults={range:5,threshold:.8,mutation:.0005,genome:1500,capacity:780};
export const presets=[
  {name:'Nearby futures',values:{...defaults}},
  {name:'Stricter pairings',values:{...defaults,threshold:.9}},
  {name:'Infinite genome',values:{...defaults,genome:0}}
];
export const tools=[
  {id:'move',label:'Move a population',hint:'Pick up a small neighbourhood and carry its unchanged genomes elsewhere.'},
  {id:'thin',label:'Make a clearing',hint:'Remove the population under your hand; later generations must recolonize it.'}
];
const L=80;
const popcount=v=>{v-=(v>>>1)&0x55555555;v=(v&0x33333333)+((v>>>2)&0x33333333);return (((v+(v>>>4))&0x0f0f0f0f)*0x01010101)>>>24;};
const reflect=v=>{v=((v%(2*(L-1)))+2*(L-1))%(2*(L-1));return Math.round(v<=L-1?v:2*(L-1)-v);};

// Equation (5): exact independent-locus infinite-genome update.
export function inheritSimilarity(q,n,parents,mu){
  const m=parents.length,out=new Float64Array(m*m),decay=Math.exp(-4*mu)/4;
  for(let i=0;i<m;i++){
    out[i*m+i]=1;const [a,b]=parents[i];
    for(let j=0;j<i;j++){
      const [c,d]=parents[j],v=decay*(q[a*n+c]+q[a*n+d]+q[b*n+c]+q[b*n+d]);
      out[i*m+j]=out[j*m+i]=v;
    }
  }return out;
}

export function create(seed=1,params=defaults){
  const p={...defaults,...params},random=rng(seed),B=p.genome===0?0:1500,W=Math.ceil(B/32);
  let time=0,nextColour=1,held=null;
  const m={kind:'separate-futures',params:p,L,B,people:[],q:null,species:1,selected:[],events:[],
    ledger:{parents:0,births:0,unmated:0,crowded:0,extra:0,removed:0,moved:0},get time(){return time;}};
  const N=Math.round(clamp(p.capacity,60,1300));p.capacity=N;
  for(let i=0;i<N;i++)m.people.push({x:Math.floor(random()*L),y:Math.floor(random()*L),genes:B?new Uint32Array(W):null,colour:1,tag:0});
  if(!B)m.q=new Float64Array(N*N).fill(1);
  function compatible(a,b){
    if(!B)return m.q[a*m.people.length+b]>=p.threshold-1e-12;
    const ga=m.people[a].genes,gb=m.people[b].genes,limit=(1-p.threshold)*B/2+1e-9;
    let d=0;for(let k=0;k<W;k++){d+=popcount(ga[k]^gb[k]);if(d>limit)return false;}return true;
  }
  m.compatible=compatible;
  function species(){
    const a=m.people,n=a.length,root=new Int32Array(n);for(let i=0;i<n;i++)root[i]=i;
    const find=i=>{while(root[i]!==i){root[i]=root[root[i]];i=root[i];}return i;};
    // A genetic species is a GLOBAL compatibility component, not a spatial cluster.
    for(let i=0;i<n;i++)for(let j=0;j<i;j++)if(find(i)!==find(j)&&compatible(i,j))root[find(i)]=find(j);
    const groups=new Map();for(let i=0;i<n;i++){const r=find(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(i);}
    const ordered=[...groups.values()].sort((a,b)=>b.length-a.length),used=new Set();
    for(const g of ordered){const votes=new Map();for(const i of g)votes.set(a[i].colour,(votes.get(a[i].colour)||0)+1);
      let c=[...votes].sort((a,b)=>b[1]-a[1]).find(([v])=>!used.has(v))?.[0];
      if(c===undefined)c=++nextColour;used.add(c);for(const i of g)a[i].colour=c;
    }m.species=groups.size;
  }
  m.updateSpecies=species;
  m.setParams=next=>{const old=p.threshold;Object.assign(p,next);p.range=clamp(p.range,3,9);p.threshold=clamp(p.threshold,.7,.96);p.mutation=clamp(p.mutation,0,.002);if(p.threshold!==old)species();};
  m.step=()=>{
    const a=m.people,n=a.length,out=[],parents=[],events=[],radius=p.range,r2=radius*radius;
    const cells=Math.ceil(L/radius),buckets=Array.from({length:cells*cells},()=>[]);
    for(let i=0;i<n;i++)buckets[Math.floor(a[i].x/radius)+cells*Math.floor(a[i].y/radius)].push(i);
    let unmated=0,crowded=0,extra=0;
    const birth=(i,j)=>{
      const angle=random()*2*Math.PI,dist=radius*Math.sqrt(random()),u={x:reflect(a[i].x+dist*Math.cos(angle)),y:reflect(a[i].y+dist*Math.sin(angle)),genes:null,colour:a[i].colour,tag:Math.max(a[i].tag,a[j].tag)*.97,carried:!!(a[i].carried||a[j].carried)};
      // A newly born carried descendant gets a baseline at its actual birth
      // position. Later pointer motion applies only displacement since birth.
      if(u.carried&&held){u.carryBaseX=u.x-held.dx;u.carryBaseY=u.y-held.dy;u.carryCounted=false;}
      if(B){
        u.genes=new Uint32Array(W);for(let k=0;k<W;k++){const mask=(random()*4294967296)>>>0;u.genes[k]=(a[i].genes[k]&mask)|(a[j].genes[k]&~mask);}
        if(p.mutation>0){const log=Math.log1p(-p.mutation);let locus=Math.floor(Math.log(Math.max(1e-15,1-random()))/log);
          while(locus<B){u.genes[locus>>>5]^=1<<(locus&31);locus+=1+Math.floor(Math.log(Math.max(1e-15,1-random()))/log);}}
        u.genes[W-1]&=0x0fffffff; // exactly 1500 loci (46 words + 28 bits).
      }out.push(u);parents.push([i,j]);
    };
    for(let i=0;i<n;i++){
      const cx=Math.floor(a[i].x/radius),cy=Math.floor(a[i].y/radius),mates=[];let neighbours=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const x=cx+dx,y=cy+dy;if(x<0||x>=cells||y<0||y>=cells)continue;
        for(const j of buckets[x+cells*y])if(j!==i&&(a[i].x-a[j].x)**2+(a[i].y-a[j].y)**2<=r2){neighbours++;if(compatible(i,j))mates.push(j);}
      }
      if(!mates.length){unmated++;if(events.length<100)events.push({x:a[i].x,y:a[i].y});continue;}
      if(n>p.capacity&&random()<.15*(1-p.capacity/n)){crowded++;continue;}
      const j=mates[Math.floor(random()*mates.length)];birth(i,j);
      // Density is compared with mean habitat density. The paper's printed
      // M0/(pi R²) denominator is inconsistent with its stated expected density.
      if(n<p.capacity&&(neighbours+1)/(Math.PI*r2)<=1.2*p.capacity/(L*L)&&random()<.5*(1-n/p.capacity)){birth(i,j);extra++;}
    }
    if(!B)m.q=inheritSimilarity(m.q,n,parents,p.mutation);
    m.people=out;m.events=events;m.ledger={parents:n,births:out.length,unmated,crowded,extra,removed:m.ledger.removed,moved:m.ledger.moved};time++;
    if(held){held.indices=[];for(let i=0;i<out.length;i++)if(out[i].carried)held.indices.push(i);m.selected=held.indices.slice();}
    if(time%5===0||out.length<10||Math.abs(out.length-n)>.1*Math.max(1,n))species();
  };
  function nearest(x,y){let best=-1,d=Infinity;for(let i=0;i<m.people.length;i++){const u=m.people[i],r=(u.x-x)**2+(u.y-y)**2;if(r<d){d=r;best=i;}}return best;}
  m.beginInteract=(x,y,tool='move')=>{
    if(tool!=='move')return;m.endInteract();const px=clamp(x)*(L-1),py=clamp(y)*(L-1);held={originX:px,originY:py,dx:0,dy:0,indices:[]};
    for(let i=0;i<m.people.length;i++)if((m.people[i].x-px)**2+(m.people[i].y-py)**2<49)held.indices.push(i);
    if(!held.indices.length){const i=nearest(px,py);if(i>=0)held.indices.push(i);}
    for(const i of held.indices){const u=m.people[i];u.carried=true;u.carryBaseX=u.x;u.carryBaseY=u.y;u.carryCounted=false;}m.selected=held.indices.slice();
  };
  m.interact=(x,y,tool='move')=>{
    const px=clamp(x)*(L-1),py=clamp(y)*(L-1);
    if(tool==='thin'){
      if(held)m.endInteract();
      const keep=[];for(let i=0;i<m.people.length;i++)if((m.people[i].x-px)**2+(m.people[i].y-py)**2>42.25)keep.push(i);
      if(!keep.length&&m.people.length>0)return;const old=m.people,n=old.length;
      if(!B){const q=new Float64Array(keep.length**2);for(let i=0;i<keep.length;i++)for(let j=0;j<keep.length;j++)q[i*keep.length+j]=m.q[keep[i]*n+keep[j]];m.q=q;}
      m.people=keep.map(i=>old[i]);m.ledger.removed+=n-keep.length;species();return;
    }
    const standalone=!held;if(standalone)m.beginInteract(x,y,'move');if(!held)return;
    // Preserve continuous TOTAL displacement. Quantizing each interpolated
    // delta would erase diagonal motion or exaggerate a nearly axial drag.
    // The one-site offset makes pointer-down itself a physical intervention.
    held.dx=px-held.originX+1;held.dy=py-held.originY;
    for(const i of held.indices){const u=m.people[i];if(!u)continue;const ox=u.x,oy=u.y;
      u.x=reflect(u.carryBaseX+held.dx);u.y=reflect(u.carryBaseY+held.dy);u.tag=1;
      if((u.x!==ox||u.y!==oy)&&!u.carryCounted){m.ledger.moved++;u.carryCounted=true;}
    }
    if(standalone)m.endInteract();
  };
  m.endInteract=()=>{held=null;m.selected=[];for(const u of m.people){u.carried=false;delete u.carryBaseX;delete u.carryBaseY;delete u.carryCounted;}};
  m.values=()=>{const out=[time,m.species,m.ledger.removed,m.ledger.moved];for(const u of m.people){out.push(u.x,u.y,u.colour);if(B)out.push(...u.genes);}if(!B)for(const v of m.q)out.push(v);return out;};
  m.metrics=()=>({'Population':m.people.length,'Genetic groups':m.species,'No mate':m.ledger.unmated,'Generation':time});
  return m;
}
