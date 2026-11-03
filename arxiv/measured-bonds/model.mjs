import {rng,clamp,TAU} from '../shared/math.mjs';
export const defaults={reach:1.2,separate:.06};
export const presets=[{name:'Distant partners',values:{...defaults}},{name:'Mostly nearby',values:{reach:3,separate:.06}},{name:'More loose ends',values:{reach:1.2,separate:.3}}];
export const tools=[{id:'pair',label:'Join ends',hint:'Drag between sites. Their former partners join each other, even far away.'},{id:'cut',label:'Separate',hint:'Touch sites to measure them singly and leave both ends unpaired.'}];
export function create(seed=1,params=defaults){
  const random=rng(seed),n=96,partner=new Int16Array(n).fill(-1),x=new Float64Array(n),y=x.slice(),cdf=new Float64Array(n-1),p={...defaults,...params};let time=0,anchor=-1,anchorPrepared=false,last=null,operations=0;
  for(let i=0;i<n;i++){const a=.64+((TAU-1.28)*i/(n-1));x[i]=.5+.43*Math.sin(a);y[i]=.5-.43*Math.cos(a);}
  const state={kind:'measured-bonds',n,partner,x,y,params:p,get time(){return time;},get anchor(){return anchor;},get last(){return last;},get operations(){return operations;},
    setParams(next){Object.assign(p,next);let sum=0;for(let r=1;r<n;r++){sum+=(n-r)*r**(-clamp(p.reach,0,4));cdf[r-1]=sum;}for(let i=0;i<n-1;i++)cdf[i]/=sum;},
    pair(a,b){a=clamp(Math.round(a),0,n-1);b=clamp(Math.round(b),0,n-1);if(a===b||partner[a]===b)return false;const c=partner[a],d=partner[b];if(c>=0)partner[c]=-1;if(d>=0)partner[d]=-1;partner[a]=b;partner[b]=a;if(c>=0&&d>=0){partner[c]=d;partner[d]=c;}last={kind:'pair',sites:[a,b,c,d],old:[[a,c],[b,d]],made:[[a,b],...(c>=0&&d>=0?[[c,d]]:[])]};operations++;return true;},
    cut(i){i=clamp(Math.round(i),0,n-1);const j=partner[i];if(j<0)return false;partner[i]=partner[j]=-1;last={kind:'cut',sites:[i,j],old:[[i,j]],made:[]};operations++;return true;},
    step(){if(random()<clamp(p.separate,0,.6))this.cut(Math.floor(random()*n));else{const u=random();let r=1;while(r<n-1&&cdf[r-1]<u)r++;const i=Math.floor(random()*(n-r));this.pair(i,i+r);}time++;},
    beginInteract(px,py,tool='pair'){anchor=tool==='pair'?nearest(px,py):-1;anchorPrepared=false;},
    interact(px,py,tool='pair'){const i=nearest(px,py);if(tool==='cut'){this.cut(i);return;}if(anchor<0){let j=(i+1)%n;if(j===partner[i])j=(i+2)%n;this.pair(i,j);}else if(i!==anchor){anchorPrepared=true;this.pair(anchor,i);}else if(!anchorPrepared){anchorPrepared=true;let j=(i+1)%n;if(j===partner[i])j=(i+2)%n;this.pair(i,j);}},
    endInteract(){anchor=-1;anchorPrepared=false;},
    entropy(lo=0,hi=n/2){let count=0;for(let i=lo;i<hi;i++)if(partner[i]>=0&&(partner[i]<lo||partner[i]>=hi))count++;return count;},
    values(){return [...partner,operations];},metrics(){let loose=0;for(const q of partner)if(q<0)loose++;return {'Threads':(n-loose)/2,'Loose ends':loose,'Across the middle':this.entropy(),'Measurement events':time};}
  };
  function nearest(px,py){let d=Infinity,best=0;for(let i=0;i<n;i++){const z=(x[i]-px)**2+(y[i]-py)**2;if(z<d){d=z;best=i;}}return best;}
  state.setParams(p);return state;
}
