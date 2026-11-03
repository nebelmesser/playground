import {rng,fft,clamp} from '../shared/math.mjs';
export const defaults={resistivity:.0008,prandtl:1};
export const presets=[
  {name:'Two islands',values:{...defaults}},
  {name:'Viscous meeting',values:{resistivity:.0008,prandtl:8}},
  {name:'Easier reconnection',values:{resistivity:.002,prandtl:1}}
];
export const tools=[
  {id:'push',label:'Push the plasma',hint:'Drag to give the conducting fluid a local impulse. Field lines move with it, then reconnect through resistivity.'},
  {id:'stir',label:'Turn the plasma',hint:'Draw a small vortex. The magnetic field reacts back on the fluid.'}
];

// DST-I diagonalises the five-point Dirichlet Laplacian. Both fields vanish
// on conducting, impermeable, free-slip walls; no iterative pressure residual.
export function poisson(omega,n){
  const N=n-1,size=2*N,tmp=new Float64Array(n*n),out=tmp.slice(),re=new Float64Array(size),im=re.slice();
  const sine=(source,target,vertical,divide=false)=>{
    for(let row=1;row<N;row++){
      re.fill(0);im.fill(0);
      for(let k=1;k<N;k++){const v=source[vertical?row+k*n:k+row*n];re[k]=v;re[size-k]=-v;}
      fft(re,im);
      for(let k=1;k<N;k++){
        let v=-.5*im[k];
        if(divide)v/=4*N*N*(Math.sin(Math.PI*k/(2*N))**2+Math.sin(Math.PI*row/(2*N))**2);
        target[vertical?row+k*n:k+row*n]=v;
      }
    }
  };
  sine(omega,tmp,false);sine(tmp,out,true,true);sine(out,tmp,true);sine(tmp,out,false);
  for(let i=0;i<out.length;i++)out[i]*=4/(N*N);
  return out;
}
export function laplace(a,n){
  const out=new Float64Array(n*n),d=(n-1)**2;
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){const i=x+y*n;out[i]=d*(a[i-1]+a[i+1]+a[i-n]+a[i+n]-4*a[i]);}
  return out;
}
// Arakawa's three stencils preserve the antisymmetries of the ideal bracket.
export function bracket(f,g,n){
  const o=new Float64Array(n*n),d=(n-1)**2/12;
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
    const i=x+y*n,l=i-1,r=i+1,u=i-n,b=i+n;
    const j1=(f[r]-f[l])*(g[b]-g[u])-(f[b]-f[u])*(g[r]-g[l]);
    const j2=f[r]*(g[r+n]-g[r-n])-f[l]*(g[l+n]-g[l-n])-f[b]*(g[b+1]-g[b-1])+f[u]*(g[u+1]-g[u-1]);
    const j3=g[b]*(f[b+1]-f[b-1])-g[u]*(f[u+1]-f[u-1])-g[r]*(f[r+n]-f[r-n])+g[l]*(f[l+n]-f[l-n]);
    o[i]=(j1+j2+j3)*d;
  }
  return o;
}
export function create(seed=1,settings=defaults){
  const params={...defaults,...settings},n=65,N=n-1,count=n*n,random=rng(seed);
  const a=new Float64Array(count),omega=a.slice(),ux=a.slice(),uy=a.slice(),bx=a.slice(),by=a.slice();
  let psi=a.slice(),current=a.slice(),time=0,previous=null,steps=0,externalWork=0;
  const phase=(random()-.5)*.5;
  for(let y=1;y<N;y++)for(let x=1;x<N;x++){
    const X=x/N-.5,Y=y/N-.5;
    a[x+y*n]=Math.tanh(X/.035)*Math.cos(Math.PI*Y)*Math.sin(2*Math.PI*X)/(2*Math.PI);
    a[x+y*n]+=.0003*Math.sin(2*Math.PI*x/N+phase)*Math.sin(Math.PI*y/N);
  }
  function fields(){
    psi=poisson(omega,n);current=laplace(a,n);const scale=N/2;
    for(let y=1;y<N;y++)for(let x=1;x<N;x++){
      const i=x+y*n;ux[i]=(psi[i+n]-psi[i-n])*scale;uy[i]=-(psi[i+1]-psi[i-1])*scale;
      bx[i]=(a[i+n]-a[i-n])*scale;by[i]=-(a[i+1]-a[i-1])*scale;current[i]*=-1;
    }
  }
  function rhs(A,W){
    const P=poisson(W,n),LA=laplace(A,n),LW=laplace(W,n),advA=bracket(P,A,n),advW=bracket(P,W,n),force=bracket(A,LA,n);
    const eta=params.resistivity,nu=eta*params.prandtl;
    for(let i=0;i<count;i++){advA[i]+=eta*LA[i];advW[i]+=force[i]+nu*LW[i];}
    return [advA,advW];
  }
  function energy(){
    let magnetic=0,kinetic=0;
    for(let i=0;i<count;i++){magnetic+=a[i]*current[i];kinetic+=psi[i]*omega[i];}
    return {magnetic:magnetic/(2*N*N),kinetic:kinetic/(2*N*N)};
  }
  fields();const initial=energy();
  const trail=Array.from({length:190},()=>({x:.025+.95*random(),y:.025+.95*random(),tail:[]}));
  function sample(f,x,y){
    const X=clamp(x,.001,.999)*N,Y=clamp(y,.001,.999)*N,i=Math.floor(X),j=Math.floor(Y),tx=X-i,ty=Y-j;
    return (1-ty)*((1-tx)*f[i+j*n]+tx*f[i+1+j*n])+ty*((1-tx)*f[i+(j+1)*n]+tx*f[i+1+(j+1)*n]);
  }
  function interact(x,y,tool='push'){
    x=clamp(x,.06,.94);y=clamp(y,.06,.94);
    const impulse=new Float64Array(count),radius=.075;
    const dx=previous?clamp(x-previous.x,-.018,.018):.007*(x<.5?1:-1),dy=previous?clamp(y-previous.y,-.018,.018):0;
    for(let j=1;j<N;j++)for(let i=1;i<N;i++){
      const X=i/N-x,Y=j/N-y,fall=Math.exp(-(X*X+Y*Y)/(2*radius*radius));
      impulse[i+j*n]=tool==='stir'?.00065*fall:(dx*Y-dy*X)*fall*.4;
    }
    const before=energy(),dW=laplace(impulse,n);
    for(let i=0;i<count;i++)omega[i]-=dW[i];
    fields();const after=energy();externalWork+=after.kinetic-before.kinetic;
    previous={x,y};
  }
  return {
    kind:'rejoining-fields',n,params,a,omega,ux,uy,bx,by,trail,
    get current(){return current;},get psi(){return psi;},get time(){return time;},
    get initialEnergy(){return initial.magnetic+initial.kinetic;},get externalWork(){return externalWork;},energy,
    setParams(next){Object.assign(params,next);},
    beginInteract(){previous=null;},interact,endInteract(){previous=null;},
    step(){
      let remaining=.002;
      while(remaining>1e-12){
        let speed=1;for(let i=0;i<count;i++)speed=Math.max(speed,Math.hypot(ux[i],uy[i])+Math.hypot(bx[i],by[i]));
        const dt=Math.min(remaining,.14/(N*speed),.16/(N*N*Math.max(params.resistivity,params.resistivity*params.prandtl,1e-8)));
        const [dA,dW]=rhs(a,omega),A=a.slice(),W=omega.slice();
        for(let i=0;i<count;i++){A[i]+=dt*dA[i];W[i]+=dt*dW[i];}
        const [eA,eW]=rhs(A,W);
        for(let i=0;i<count;i++){a[i]+=dt*.5*(dA[i]+eA[i]);omega[i]+=dt*.5*(dW[i]+eW[i]);}
        remaining-=dt;time+=dt;fields();
        for(const p of trail){
          const u=sample(ux,p.x,p.y),v=sample(uy,p.x,p.y),mx=p.x+.5*dt*u,my=p.y+.5*dt*v;
          p.x=clamp(p.x+dt*sample(ux,mx,my),.003,.997);p.y=clamp(p.y+dt*sample(uy,mx,my),.003,.997);
        }
      }
      steps++;if(steps%4===0)for(const p of trail){p.tail.push([p.x,p.y]);if(p.tail.length>12)p.tail.shift();}
    },
    values(){return Array.from(a).concat(Array.from(omega));},
    metrics(){
      const e=energy();let peak=0;for(const v of current)peak=Math.max(peak,Math.abs(v));
      let centre=0,side=0;for(let i=1;i<N;i++){centre=Math.max(centre,a[N/2+i*n]);side=Math.max(side,a[i+N/2*n]);}
      return {'Magnetic energy':e.magnetic.toFixed(4),'Fluid energy':e.kinetic.toFixed(4),'Island flux':Math.max(0,side-centre).toFixed(4),'Peak current':peak.toFixed(1)};
    }
  };
}
