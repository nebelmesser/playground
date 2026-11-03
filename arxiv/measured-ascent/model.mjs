import {clamp,rng} from '../shared/math.mjs';
export const defaults={tilt:.15,cycle:1.9,protocol:0};
export const presets=[{name:'Read only the edge',values:{...defaults}},{name:'Read every position',values:{tilt:.15,cycle:1.9,protocol:1}},{name:'No measurements',values:{tilt:.15,cycle:1.9,protocol:2}}];
export const tools=[{id:'edge',label:'Read only the edge',hint:'Hold to let both fermions spread. Release once to measure their leftmost position and advance the wall.'},{id:'full',label:'Read every position',hint:'Hold, then release to measure both positions. This destroys coherence that an edge-only read can preserve.'},{id:'free',label:'Stop measuring',hint:'Leave the wave to evolve without measurements. No new wall steps are inserted.'}];
export const initialTool=params=>['edge','full','free'][params.protocol]??'edge';
const M=56,N=2,DT=.025;
export function create(seed=1,params=defaults){
  const p={...defaults,...params},random=rng(seed),re=new Float64Array(M*N),im=re.slice(),density=new Float64Array(M),pair=new Float64Array(M*M),survival=new Float64Array(M+1);
  const invR=new Float64Array(M),invI=invR.slice(),cpR=invR.slice(),cpI=invR.slice(),rhsR=invR.slice(),rhsI=invR.slice(),dpR=invR.slice(),dpI=invR.slice();
  re[0]=1;re[3*N+1]=1;
  let time=0,elapsed=0,wall=0,measurements=0,lastMinimum=0,record=0,held=false,heldTool='edge',mode=p.protocol;
  const history=[];
  const m={kind:'measured-ascent',n:M,particles:N,re,im,density,pair,history,params:p,
    get time(){return time;},get wall(){return wall;},get measurements(){return measurements;},get information(){return record;},get mode(){return mode;},get held(){return held;},get lastMinimum(){return lastMinimum;},
    setParams(next){const changed=next.protocol!==undefined&&next.protocol!==p.protocol;Object.assign(p,next);if(changed){mode=p.protocol;elapsed=0;}p.tilt=clamp(+p.tilt,.05,.4);p.cycle=clamp(+p.cycle,.7,4);factor();},
    selectTool(tool){choose(tool);},
    beginInteract(x,y,tool='edge'){held=true;heldTool=tool;},
    interact(x,y,tool='edge'){if(held){heldTool=tool;return;}if(tool==='free'){choose(tool);return;}choose(tool);measure(mode===1);elapsed=0;refresh();},
    endInteract({cancelled=false}={}){if(!held)return;held=false;if(cancelled)return;if(heldTool==='free')choose(heldTool);else{choose(heldTool);measure(mode===1);elapsed=0;}refresh();},
    step(){for(let k=0;k<2;k++){unitary();time+=DT;if(!held)elapsed+=DT;if(!held&&mode!==2&&elapsed>=p.cycle-1e-12){measure(mode===1);elapsed-=p.cycle;}}refresh();},
    measure(full=false){measure(full);elapsed=0;refresh();},
    refresh,
    coherence(){let q=N;for(const a of density)q-=a*a;return Math.max(0,q);},
    gram(){let a=0,b=0,c=0,d=0;for(let j=0;j<M;j++){const k=j*N;a+=re[k]**2+im[k]**2;b+=re[k+1]**2+im[k+1]**2;c+=re[k]*re[k+1]+im[k]*im[k+1];d+=re[k]*im[k+1]-im[k]*re[k+1];}return [a,b,c,d];},
    values(){return [...re,...im,wall,measurements,record,mode];},
    metrics(){return {'Wall ascent':`${wall} sites`,'Measurements':measurements,'Retained coherence':this.coherence().toFixed(3),'Recorded information':`${record.toFixed(2)} nat`};}
  };
  function choose(tool){const next=tool==='free'?2:tool==='full'?1:0;if(next!==mode)elapsed=0;mode=next;p.protocol=mode;}
  function factor(){
    const t=DT/2;
    for(let j=0;j<M;j++){
      const ar=j?1-t*cpI[j-1]:1,ai=t*p.tilt*j+(j?t*cpR[j-1]:0),q=ar*ar+ai*ai;
      invR[j]=ar/q;invI[j]=-ai/q;cpR[j]=t*invI[j];cpI[j]=-t*invR[j];
    }
  }
  function unitary(){
    const t=DT/2;
    for(let a=0;a<N;a++){
      for(let j=0;j<M;j++){const i=j*N+a,d=t*p.tilt*j;
        rhsR[j]=re[i]+d*im[i]-t*((j?im[i-N]:0)+(j<M-1?im[i+N]:0));
        rhsI[j]=im[i]-d*re[i]+t*((j?re[i-N]:0)+(j<M-1?re[i+N]:0));
      }
      for(let j=0;j<M;j++){const ar=rhsR[j]-(j?t*dpI[j-1]:0),ai=rhsI[j]+(j?t*dpR[j-1]:0);dpR[j]=ar*invR[j]-ai*invI[j];dpI[j]=ar*invI[j]+ai*invR[j];}
      for(let j=M-1;j>=0;j--){const i=j*N+a,br=j<M-1?re[i+N]:0,bi=j<M-1?im[i+N]:0;re[i]=dpR[j]-(cpR[j]*br-cpI[j]*bi);im[i]=dpI[j]-(cpR[j]*bi+cpI[j]*br);}
    }
  }
  function orthonormalize(){
    let norm=0;for(let j=0;j<M;j++)norm+=re[j*N]**2+im[j*N]**2;norm=Math.sqrt(norm);if(norm<1e-14)throw new Error('Zero-probability orbital projection');
    for(let j=0;j<M;j++){re[j*N]/=norm;im[j*N]/=norm;}
    let gr=0,gi=0;for(let j=0;j<M;j++){const i=j*N;gr+=re[i]*re[i+1]+im[i]*im[i+1];gi+=re[i]*im[i+1]-im[i]*re[i+1];}
    norm=0;for(let j=0;j<M;j++){const i=j*N;re[i+1]-=re[i]*gr-im[i]*gi;im[i+1]-=re[i]*gi+im[i]*gr;norm+=re[i+1]**2+im[i+1]**2;}
    norm=Math.sqrt(norm);if(norm<1e-14)throw new Error('Linearly dependent conditional orbitals');for(let j=0;j<M;j++){re[j*N+1]/=norm;im[j*N+1]/=norm;}
  }
  function probabilities(){
    let a=0,b=0,cr=0,ci=0;survival[M]=0;
    for(let j=M-1;j>=0;j--){const i=j*N;a+=re[i]**2+im[i]**2;b+=re[i+1]**2+im[i+1]**2;cr+=re[i]*re[i+1]+im[i]*im[i+1];ci+=re[i]*im[i+1]-im[i]*re[i+1];survival[j]=Math.max(0,a*b-cr*cr-ci*ci);}
  }
  function measure(full){
    let minimum=0,probability=1;
    if(full){
      refresh();let r=random(),sum=0,lastI=0,lastJ=1;outer:for(let i=0;i<M;i++)for(let j=i+1;j<M;j++){const q=pair[i+M*j];if(q>0){lastI=i;lastJ=j;sum+=q;if(r<=sum){lastI=i;lastJ=j;break outer;}}}
      minimum=lastI;probability=pair[lastI+M*lastJ];re.fill(0);im.fill(0);re[minimum*N]=1;re[lastJ*N+1]=1;
    }else{
      probabilities();const total=survival[0],r=random()*total;let cumulative=0,last=0,lastProbability=1;
      for(let j=0;j<M-1;j++){const q=Math.max(0,survival[j]-survival[j+1]);if(q>0){last=j;lastProbability=q/total;}cumulative+=q;minimum=last;probability=lastProbability;if(r<=cumulative)break;}
      for(let j=0;j<minimum;j++){re[j*N]=im[j*N]=re[j*N+1]=im[j*N+1]=0;}
      orthonormalize();
      const i=minimum*N,ar=re[i],ai=im[i],br=re[i+1],bi=im[i+1],norm=Math.sqrt(ar*ar+ai*ai+br*br+bi*bi);
      // The remaining orbital vanishes at the measured occupied site. The other becomes |m>.
      for(let j=0;j<M;j++){const k=j*N,xr=re[k],xi=im[k],yr=re[k+1],yi=im[k+1];re[k+1]=(-br*xr+bi*xi+ar*yr-ai*yi)/norm;im[k+1]=(-br*xi-bi*xr+ar*yi+ai*yr)/norm;re[k]=im[k]=0;}
      re[i]=1;
    }
    if(minimum){for(let j=0;j<M;j++)for(let a=0;a<N;a++){const k=j*N+a,q=(j+minimum)*N+a;re[k]=j+minimum<M?re[q]:0;im[k]=j+minimum<M?im[q]:0;}}
    wall+=minimum;lastMinimum=minimum;record-=Math.log(Math.max(1e-300,probability));measurements++;
    history.push({time,wall,minimum,full,information:record});if(history.length>240)history.shift();
  }
  function refresh(){
    for(let j=0;j<M;j++){const i=j*N;density[j]=re[i]**2+im[i]**2+re[i+1]**2+im[i+1]**2;}
    for(let y=0;y<M;y++)for(let x=0;x<M;x++){
      if(x>=y){pair[x+M*y]=0;continue;}
      const i=x*N,j=y*N,ar=re[i]*re[j+1]-im[i]*im[j+1]-re[i+1]*re[j]+im[i+1]*im[j],ai=re[i]*im[j+1]+im[i]*re[j+1]-re[i+1]*im[j]-im[i+1]*re[j];pair[x+M*y]=ar*ar+ai*ai;
    }
  }
  m.setParams(p);refresh();return m;
}
