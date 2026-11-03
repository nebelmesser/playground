import {rng,TAU} from '../shared/math.mjs';
export const defaults={softening:.11,spin:.88,configuration:0};
export const presets=[{name:'A turning disc',values:defaults},{name:'A cold collapse',values:{softening:.14,spin:.24,configuration:0}},{name:'Two passing gardens',values:{softening:.1,spin:.8,configuration:1}}];
export function create(seed=1,params=defaults){const p={...defaults,...params},n=160,x=new Float64Array(n),y=x.slice(),vx=x.slice(),vy=x.slice(),ax=x.slice(),ay=x.slice(),history=[],random=rng(seed);let time=0,ticks=0,reference=0;const mass=1/n,dt=.008;
 for(let i=0;i<n;i++){const group=p.configuration===1?(i<n/2?-1:1):0,r=Math.sqrt(random())*(group?.65:1.4)+.05,a=random()*TAU;x[i]=r*Math.cos(a)+(group?group*.95:0);y[i]=r*Math.sin(a)+(group?group*.15:0);const enclosed=group?.5*(r/.7)**2:(r/1.45)**2,speed=p.spin*Math.sqrt(enclosed*r*r/(r*r+p.softening**2)**1.5);vx[i]=-speed*Math.sin(a)+(group?-group*.19:0);vy[i]=speed*Math.cos(a)+(group?group*.16:0);}
 const recenter=a=>{const avg=a.reduce((s,v)=>s+v,0)/n;for(let i=0;i<n;i++)a[i]-=avg;};[x,y,vx,vy].forEach(recenter);
 function force(){ax.fill(0);ay.fill(0);const e2=p.softening**2;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const dx=x[j]-x[i],dy=y[j]-y[i],r2=dx*dx+dy*dy+e2,f=mass/(r2*Math.sqrt(r2));ax[i]+=dx*f;ay[i]+=dy*f;ax[j]-=dx*f;ay[j]-=dy*f;}}
 function energy(){let e=0;for(let i=0;i<n;i++){e+=.5*mass*(vx[i]**2+vy[i]**2);for(let j=i+1;j<n;j++)e-=mass*mass/Math.sqrt((x[i]-x[j])**2+(y[i]-y[j])**2+p.softening**2);}return e;}
 function momentum(){return [vx.reduce((s,v)=>s+v,0)*mass,vy.reduce((s,v)=>s+v,0)*mass];}
 function angular(){let a=0;for(let i=0;i<n;i++)a+=mass*(x[i]*vy[i]-y[i]*vx[i]);return a;}
 force();reference=energy();return {kind:'gravity-garden',params:p,n,x,y,vx,vy,history,viewRadius:2.5,get time(){return time;},energy,momentum,angular,
 step(){for(let sub=0;sub<3;sub++){for(let i=0;i<n;i++){vx[i]+=.5*dt*ax[i];vy[i]+=.5*dt*ay[i];x[i]+=dt*vx[i];y[i]+=dt*vy[i];}force();for(let i=0;i<n;i++){vx[i]+=.5*dt*ax[i];vy[i]+=.5*dt*ay[i];}time+=dt;}if(++ticks%3===0){history.unshift({x:x.slice(),y:y.slice()});if(history.length>24)history.pop();}},
 interact(u,v){const cx=(u-.5)*5,cy=(v-.5)*5;let dxsum=0,dysum=0;const dxs=new Float64Array(n),dys=dxs.slice();for(let i=0;i<n;i++){const dx=x[i]-cx,dy=y[i]-cy,g=.11*Math.exp(-(dx*dx+dy*dy)/.25);dxs[i]=-dy*g;dys[i]=dx*g;dxsum+=dxs[i];dysum+=dys[i];}for(let i=0;i<n;i++){vx[i]+=dxs[i]-dxsum/n;vy[i]+=dys[i]-dysum/n;}reference=energy();},
 setParams(next){Object.assign(p,next);force();reference=energy();},
 values(){return [...x,...y,...vx,...vy];},metrics(){return {'Total energy':energy().toFixed(4),'Angular momentum':angular().toFixed(4),'Energy drift':`${(100*(energy()-reference)/Math.max(.01,Math.abs(reference))).toFixed(3)}%`};}
 };}
