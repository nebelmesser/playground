import{rng,fft,TAU,mean}from '../shared/math.mjs';
export const defaults={length:100};
export const presets=[{name:'Chaos',values:{length:100}},{name:'Small world',values:{length:35}},{name:'Many scales',values:{length:160}}];
export function create(seed=1,params=defaults,n=256){
  const random=rng(seed),u=new Float64Array(n),re=u.slice(),im=u.slice(),dr=u.slice(),di=u.slice(),nr=u.slice(),ni=u.slice();let time=0;
  for(let i=0;i<n;i++)u[i]=.5*Math.sin(TAU*i/n)+.2*Math.cos(6*TAU*i/n)+(random()-.5)*.1;
  const initialMean=mean(u);for(let i=0;i<n;i++)u[i]-=initialMean;
  re.set(u);im.fill(0);fft(re,im);
  return{
    kind:'surface',n,u,params:{...defaults,...params},get time(){return time;},
    step(){
      const dt=.04,L=this.params.length;
      for(let i=0;i<n;i++){const m=i<n/2?i:i-n,k=TAU*m/L;dr[i]=-k*im[i];di[i]=k*re[i];}
      fft(dr,di,true);
      for(let i=0;i<n;i++){nr[i]=u[i]*dr[i];ni[i]=0;}
      fft(nr,ni);
      for(let i=0;i<n;i++){
        const m=i<n/2?i:i-n,k=TAU*m/L,den=1-dt*(k*k-k**4);
        if(Math.abs(m)>=n/3){re[i]=0;im[i]=0;}else{re[i]=(re[i]-dt*nr[i])/den;im[i]=(im[i]-dt*ni[i])/den;}
      }
      // Roundoff must not seed an unphysical complex component in unstable modes.
      // Project back to the Fourier subspace of a real-valued field every step.
      for(let i=1;i<n/2;i++){
        const real=.5*(re[i]+re[n-i]),imag=.5*(im[i]-im[n-i]);
        re[i]=re[n-i]=real;im[i]=imag;im[n-i]=-imag;
      }
      // Explicitly preserve the zero Fourier mode of the slope field.
      re[0]=0;im[0]=0;dr.set(re);di.set(im);fft(dr,di,true);u.set(dr);time+=dt;
    },
    interact(x){
      for(let i=0;i<n;i++){let d=i/n-x;d-=Math.round(d);u[i]+=.8*Math.exp(-d*d/.001);}
      const avg=mean(u);for(let i=0;i<n;i++)u[i]-=avg;re.set(u);im.fill(0);fft(re,im);
    },
    values(){return Array.from(u);},
    metrics(){return{'Mean u':mean(u).toFixed(6),'Slope RMS':Math.sqrt(mean(u.map(x=>x*x))).toFixed(3),'World length L':this.params.length};}
  };
}
