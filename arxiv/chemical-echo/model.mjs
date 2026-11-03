import {clamp, rng} from '../shared/math.mjs';
import {generateEnvironment} from './maze.mjs';

export const defaults = {diffusion:12, response:48, layout:0};
export const presets = [
  {name:'Branching maze', values:{...defaults}},
  {name:'Looping passages', values:{diffusion:12, response:48, layout:2}},
  {name:'An open bath', values:{diffusion:12, response:48, layout:1}}
];
export const tools = [
  {id:'wall', label:'Build wall', hint:'Drag a wall across the water. The drop and its field stay.'},
  {id:'erase', label:'Open passage', hint:'Erase a wall. The chemical can spread through the new opening.'},
  {id:'move', label:'Move drop', hint:'Place the drop in clear water. Its chemical history remains.'}
];

const N=112, DT=.006, SUBSTEPS=20, EMISSION=12, INERTIA=.35, RADIUS=1.15;

export function create(seed=1, params=defaults) {
  const p={...defaults,...params}, random=rng(seed), n=N, count=n*n;
  const c=new Float64Array(count), next=c.slice(), geometry=generateEnvironment(seed,p.layout,n),walls=geometry.walls;
  const footprintCells=new Int32Array(49),footprintWeights=new Float64Array(49);
  let time=0, emitted=0, drained=0, tick=0, editCount=0;
  const drop={...geometry.start,vx:.3,vy:.012*(random()-.5)};
  const trail=[];
  const model={
    kind:'chemical-echo', n,c,walls,drop,trail,geometry, params:p, radius:RADIUS,
    get time(){return time;},
    get emitted(){return emitted;}, get drained(){return drained;},
    get edits(){return editCount;},
    setParams(values){Object.assign(p,values);p.diffusion=clamp(+p.diffusion,3,24);p.response=clamp(+p.response,0,100);},
    step(){
      for(let k=0;k<SUBSTEPS;k++)advance(DT);
      time+=DT*SUBSTEPS;
      if(tick++%3===0){trail.push({x:drop.x,y:drop.y,t:time});if(trail.length>8000)trail.shift();}
    },
    interact(x,y,toolId='wall'){
      const px=clamp(x)*n,py=clamp(y)*n;
      if(toolId==='move'){
        if(clearAt(px,py)){drop.x=px;drop.y=py;drop.vx=drop.vy=0;trail.push({x:px,y:py,t:time,break:true});}
        return;
      }
      if(toolId!=='wall'&&toolId!=='erase')return;
      const changed=[];let displaced=0;
      for(let yy=Math.max(2,Math.floor(py-2.3));yy<Math.min(n-2,Math.ceil(py+2.3));yy++)
        for(let xx=Math.max(2,Math.floor(px-2.3));xx<Math.min(n-2,Math.ceil(px+2.3));xx++){
          if((xx+.5-px)**2+(yy+.5-py)**2>2.3**2)continue;
          const i=xx+n*yy, build=toolId==='wall';
          if(build&&Math.hypot(xx+.5-drop.x,yy+.5-drop.y)<RADIUS+2.1)continue;
          if(walls[i]===+build)continue;
          if(build){displaced+=c[i];c[i]=0;}
          walls[i]=+build;changed.push(i);
        }
      // Inserting a wall displaces dissolved chemical into adjacent water, without deleting it.
      if(displaced){
        const recipients=new Set();
        for(const i of changed){const xx=i%n,yy=(i/n)|0;for(const j of [xx>0?i-1:-1,xx<n-1?i+1:-1,yy>0?i-n:-1,yy<n-1?i+n:-1])if(j>=0&&!walls[j])recipients.add(j);}
        if(!recipients.size){let best=-1,d=Infinity;for(let i=0;i<count;i++)if(!walls[i]){const q=(i%n+.5-px)**2+(((i/n)|0)+.5-py)**2;if(q<d){d=q;best=i;}}if(best>=0)recipients.add(best);}
        for(const i of recipients)c[i]+=displaced/recipients.size;
      }
      if(changed.length)editCount++;
    },
    mass(){let sum=0;for(let i=0;i<count;i++)sum+=c[i];return sum;},
    gradientAt(x,y){return gradient(x,y);},
    values(){return [...c,drop.x,drop.y,drop.vx,drop.vy,emitted,drained];},
    metrics(){const mass=this.mass();return {'Chemical in water':mass.toFixed(1),'Released / drained':`${emitted.toFixed(1)} / ${drained.toFixed(1)}`,'Drop speed':Math.hypot(drop.vx,drop.vy).toFixed(2)};}
  };
  model.setParams(p);
  trail.push({x:drop.x,y:drop.y,t:0,break:true});

  function clearAt(x,y){
    if(x<RADIUS+2||x>n-RADIUS||y<RADIUS+2||y>n-RADIUS-2)return false;
    for(let yy=Math.max(0,Math.floor(y-RADIUS));yy<=Math.min(n-1,Math.floor(y+RADIUS));yy++)
      for(let xx=Math.max(0,Math.floor(x-RADIUS));xx<=Math.min(n-1,Math.floor(x+RADIUS));xx++)if(walls[xx+n*yy]){
        const dx=x-clamp(x,xx,xx+1),dy=y-clamp(y,yy,yy+1);
        if(dx*dx+dy*dy<RADIUS*RADIUS)return false;
      }
    return true;
  }
  // A regularized source/sensor must not reach water behind even a one-cell wall.
  // Traverse every grid edge crossed by the ray to each candidate cell centre.
  function visible(x,y,tx,ty){
    let xx=Math.floor(x),yy=Math.floor(y);
    const endX=Math.floor(tx),endY=Math.floor(ty),vx=tx-x,vy=ty-y;
    if(walls[xx+n*yy])return false;
    const sx=Math.sign(vx),sy=Math.sign(vy),ax=Math.abs(vx),ay=Math.abs(vy);
    let edgeX=ax?(sx>0?xx+1-x:x-xx)/ax:Infinity;
    let edgeY=ay?(sy>0?yy+1-y:y-yy)/ay:Infinity;
    while(xx!==endX||yy!==endY){
      if(Math.abs(edgeX-edgeY)<1e-12){
        if(walls[xx+sx+n*yy]||walls[xx+n*(yy+sy)])return false;
        xx+=sx;yy+=sy;edgeX+=1/ax;edgeY+=1/ay;
      }else if(edgeX<edgeY){xx+=sx;edgeX+=1/ax;}
      else{yy+=sy;edgeY+=1/ay;}
      if(walls[xx+n*yy])return false;
    }
    return true;
  }
  function footprint(x,y){
    let length=0;
    for(let yy=Math.max(0,Math.floor(y-3));yy<=Math.min(n-1,Math.floor(y+3));yy++)
      for(let xx=Math.max(0,Math.floor(x-3));xx<=Math.min(n-1,Math.floor(x+3));xx++){
        const i=xx+n*yy;if(walls[i]||!visible(x,y,xx+.5,yy+.5))continue;
        const dx=xx+.5-x,dy=yy+.5-y;
        footprintCells[length]=i;footprintWeights[length]=Math.exp(-(dx*dx+dy*dy)/3.2);length++;
      }
    return length;
  }
  function gradient(x,y){
    let gx=0,gy=0,total=0;const length=footprint(x,y);
    for(let k=0;k<length;k++){
      const i=footprintCells[k],xx=i%n,yy=(i/n)|0,w=footprintWeights[k];
      const left=xx&&!walls[i-1]?c[i-1]:c[i],right=xx<n-1&&!walls[i+1]?c[i+1]:c[i];
      const up=yy&&!walls[i-n]?c[i-n]:c[i],down=yy<n-1&&!walls[i+n]?c[i+n]:c[i];
      gx+=w*(right-left)/2;gy+=w*(down-up)/2;total+=w;
    }
    return [gx/(total||1),gy/(total||1)];
  }
  function release(dt){
    let total=0;const length=footprint(drop.x,drop.y);
    for(let k=0;k<length;k++)total+=footprintWeights[k];
    const amount=EMISSION*dt/(total||1);
    for(let k=0;k<length;k++)c[footprintCells[k]]+=amount*footprintWeights[k];
    emitted+=EMISSION*dt;
  }
  function diffuse(dt){
    next.set(c);const a=dt*p.diffusion;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=x+n*y;if(walls[i])continue;
      if(x<n-1&&!walls[i+1]){const flux=a*(c[i+1]-c[i]);next[i]+=flux;next[i+1]-=flux;}
      if(y<n-1&&!walls[i+n]){const flux=a*(c[i+n]-c[i]);next[i]+=flux;next[i+n]-=flux;}
      if(x===n-1){const flux=a*c[i];next[i]-=flux;drained+=flux;}
    }
    c.set(next);
  }
  function advance(dt){
    release(dt/2);diffuse(dt);release(dt/2);
    const [gx,gy]=gradient(drop.x,drop.y),e=Math.exp(-dt/INERTIA);
    const ux=-p.response*gx,uy=-p.response*gy;
    const dx=INERTIA*(1-e)*drop.vx+(dt-INERTIA*(1-e))*ux;
    const dy=INERTIA*(1-e)*drop.vy+(dt-INERTIA*(1-e))*uy;
    drop.vx=drop.vx*e+ux*(1-e);drop.vy=drop.vy*e+uy*(1-e);
    // A swept, inelastic hard-wall contact replaces the paper's singular WCA wall force.
    const parts=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/.3));
    for(let k=0;k<parts;k++){
      if(clearAt(drop.x+dx/parts,drop.y))drop.x+=dx/parts;else drop.vx=0;
      if(clearAt(drop.x,drop.y+dy/parts))drop.y+=dy/parts;else drop.vy=0;
    }
  }
  return model;
}
