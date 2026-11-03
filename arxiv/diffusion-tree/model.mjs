import {rng, clamp, TAU} from '../shared/math.mjs';

export const defaults = {sticking: 1, supply: 18};
export const presets = [
  {name:'Branching crystal', values:{sticking:1, supply:18}},
  {name:'Porous stone', values:{sticking:.12, supply:18}},
  {name:'Faraway rain', values:{sticking:1, supply:42}}
];

// One walker at a time. A simulation tick is exactly 12,000 lattice hops.
// The launch/kill circles are finite approximations to supply from infinity.
export function create(seed=1, params=defaults) {
  const random=rng(seed), n=257, c=(n-1)/2, birth=new Uint32Array(n*n);
  const parents=new Int32Array(n*n); parents.fill(-2);
  const x=[], y=[], seeds=[]; let time=0, radius=0, wx=c, wy=c, alive=false, hops=0;
  function add(px,py,parent=-1) {
    const i=px+n*py; if(birth[i])return false;
    birth[i]=x.length+1; parents[i]=parent; x.push(px);y.push(py);
    if(parent===-1)seeds.push(i);
    radius=Math.max(radius,Math.hypot(px-c,py-c)); return true;
  }
  add(c,c);
  const state={
    kind:'diffusion-tree', n, birth, parents, x,y,seeds, params:{...defaults,...params},
    get time(){return time;},get radius(){return radius;},get walker(){return alive?[wx,wy]:null;},
    get stopped(){return radius>=112||x.length>=6500;},get hops(){return hops;},
    step(){
      time++;
      if(this.stopped)return;
      const sticking=clamp(this.params.sticking,.02,1), gap=clamp(this.params.supply,8,45);
      for(let k=0;k<12000&&!this.stopped;k++) {
        if(!alive){const a=random()*TAU,r=Math.min(121,radius+gap);wx=Math.round(c+r*Math.cos(a));wy=Math.round(c+r*Math.sin(a));alive=true;}
        if(birth[wx+n*wy]){alive=false;continue;}
        const i=wx+n*wy, adjacent=[i-1,i+1,i-n,i+n].find(j=>birth[j]>0);
        if(adjacent!==undefined&&random()<sticking){add(wx,wy,adjacent);alive=false;continue;}
        const d=Math.floor(random()*4), nx=wx+(d===0?1:d===1?-1:0),ny=wy+(d===2?1:d===3?-1:0);
        hops++;
        if(nx<2||ny<2||nx>n-3||ny>n-3||Math.hypot(nx-c,ny-c)>Math.min(124,radius+gap+35)){alive=false;continue;}
        if(!birth[nx+n*ny]){wx=nx;wy=ny;}
      }
    },
    interact(px,py){
      const ix=Math.round(clamp(px)*256),iy=Math.round(clamp(py)*256);
      if(Math.hypot(ix-c,iy-c)<=105)add(ix,iy);
    },
    values(){return [...birth, wx,wy,radius];},
    metrics(){return {'Attached particles':x.length,'Cluster radius':radius.toFixed(1),'Seeds':seeds.length,'Growth':this.stopped?'Boundary reached':'Diffusing'};}
  };return state;
}
