import test from 'node:test';
import assert from 'node:assert/strict';
import {create,poisson,laplace,bracket} from './model.mjs';
const advance=(m,n)=>{for(let i=0;i<n;i++)m.step();return m;};
test('Dirichlet Poisson solve resolves a discrete sine eigenmode',()=>{
  const n=17,w=new Float64Array(n*n);
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++)w[x+y*n]=Math.sin(3*Math.PI*x/(n-1))*Math.sin(2*Math.PI*y/(n-1));
  const p=poisson(w,n),lap=laplace(p,n);assert.ok(Math.max(...lap.map((v,i)=>Math.abs(v+w[i])))<1e-12);
});
test('ideal magnetic and fluid bracket exchanges cancel in the energy balance',()=>{
  const n=25,A=new Float64Array(n*n),P=A.slice();
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
    const X=Math.PI*x/(n-1),Y=Math.PI*y/(n-1);A[x+y*n]=Math.sin(X)*Math.sin(Y)+.1*Math.sin(3*X)*Math.sin(2*Y);P[x+y*n]=.2*Math.sin(2*X)*Math.sin(Y);
  }
  const LA=laplace(A,n),force=bracket(A,LA,n),dA=bracket(P,A,n);
  let residual=0;for(let i=0;i<A.length;i++)residual+=-LA[i]*dA[i]+P[i]*force[i];
  assert.ok(Math.abs(residual)<1e-10);
});
test('reconnection dissipates energy, respects walls, and changes central connectivity',()=>{
  const m=create(1),initial=m.initialEnergy,centre=m.a[32+32*65];advance(m,500);
  const e=m.energy();assert.ok(e.magnetic+e.kinetic<initial);assert.ok(e.kinetic>1e-6);
  assert.ok(m.a[32+32*65]>centre+.005);assert.ok(m.values().every(Number.isFinite));
  for(let k=0;k<65;k++)for(const i of[k,k*65,k+64*65,64+k*65]){assert.equal(m.a[i],0);assert.equal(m.omega[i],0);}
});
test('a fluid impulse changes the later magnetic field without painting flux',()=>{
  const a=advance(create(9),70),b=advance(create(9),70),before=a.a.slice();
  a.interact(.38,.51,'stir');assert.deepEqual(a.a,before);advance(a,100);advance(b,100);
  assert.ok(a.externalWork>0);assert.ok(a.a.some((v,i)=>Math.abs(v-b.a[i])>1e-4));
});
