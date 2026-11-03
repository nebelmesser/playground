import test from 'node:test';
import assert from 'node:assert/strict';
import {create,defaults,presets,initialTool} from './model.mjs';
const advance=(m,n)=>{for(let i=0;i<n;i++)m.step();return m;};
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);
const energy=m=>{let q=0;for(let j=0;j<m.n;j++)for(let a=0;a<2;a++){const i=j*2+a;q+=m.params.tilt*j*(m.re[i]**2+m.im[i]**2);if(j+1<m.n)q-=2*(m.re[i]*m.re[i+2]+m.im[i]*m.im[i+2]);}return q;};
const conserved=m=>{const g=m.gram();near(g[0],1);near(g[1],1);near(g[2],0);near(g[3],0);near(m.density.reduce((a,b)=>a+b),2);near(m.pair.reduce((a,b)=>a+b),1);for(const x of m.density)assert.ok(x>=0&&x<=1+1e-10);assert.ok(m.values().every(Number.isFinite));};

test('complex Crank–Nicolson evolution conserves norm, orthogonality and energy',()=>{
  const m=create(1,{protocol:2});const e=energy(m);advance(m,3000);conserved(m);near(energy(m),e,1e-9);assert.equal(m.wall,0);assert.equal(m.measurements,0);
});

test('minimum-only Gaussian conditioning equals exact two-body Lüders projection',()=>{
  const m=advance(create(8,{protocol:2}),65),before=m.pair.slice(),oldWall=m.wall;
  m.measure(false);const minimum=m.lastMinimum;let probability=0,expectedPosition=0;
  for(let j=minimum+1;j<m.n;j++){const p=before[minimum+m.n*j];probability+=p;expectedPosition+=p*(minimum+j);}
  assert.ok(probability>0);near(m.information,-Math.log(probability));
  for(let y=0;y<m.n;y++)for(let x=0;x<m.n;x++)near(m.pair[x+m.n*y],x===0&&y+minimum<m.n?before[minimum+m.n*(y+minimum)]/probability:0);
  near(m.density[0],1);near(m.wall,oldWall+minimum);near(m.density.reduce((s,p,j)=>s+p*(j+m.wall),0),expectedPosition/probability+2*oldWall);conserved(m);
});

test('reading the complete configuration destroys coherence retained by an edge read',()=>{
  const coarse=advance(create(7,{protocol:2}),50),full=advance(create(7,{protocol:2}),50);
  coarse.measure(false);full.measure(true);assert.ok(coarse.coherence()>.2);near(full.coherence(),0);assert.equal(full.density.filter(x=>x===1).length,2);
  advance(coarse,16);advance(full,16);let difference=0;for(let j=0;j<full.n;j++)difference+=Math.abs(coarse.density[j]-full.density[j]);assert.ok(difference>.3);conserved(coarse);conserved(full);
});

test('holding defers all reads, release reads once, cancellation has no hidden backlog',()=>{
  const m=create();m.beginInteract(.3,.3,'edge');for(let j=0;j<1500;j++)m.interact(.3,.3,'edge');advance(m,200);
  assert.equal(m.measurements,0);m.endInteract({cancelled:true});assert.equal(m.measurements,0);advance(m,5);assert.equal(m.measurements,0);
  m.beginInteract(.5,.5,'full');advance(m,8);m.endInteract({cancelled:false});assert.equal(m.measurements,1);near(m.coherence(),0);m.endInteract();assert.equal(m.measurements,1);
  m.interact(.5,.5,'edge');assert.equal(m.measurements,2);m.interact(.5,.5,'free');advance(m,100);assert.equal(m.measurements,2);conserved(m);
});

test('the wall retains ascent, runs are deterministic, and live/corner parameters work',()=>{
  const a=advance(create(12),1800),b=advance(create(12),1800);assert.deepEqual(a.values(),b.values());assert.ok(a.wall>20);assert.equal(a.wall,a.history.reduce((s,q)=>s+q.minimum,0));conserved(a);
  b.setParams({tilt:.4,cycle:.7});advance(a,12);advance(b,12);assert.notDeepEqual(a.re,b.re);conserved(b);
  for(const preset of presets){assert.deepEqual(Object.keys(preset.values).sort(),Object.keys(defaults).sort());conserved(advance(create(1,preset.values),600));}
  for(const tilt of [.05,.4])for(const cycle of [.7,4])for(const protocol of [0,1,2])conserved(advance(create(9,{tilt,cycle,protocol}),1800));
});

test('tool selection and preset restart synchronize the protocol without a field gesture',()=>{
  for(const [protocol,tool] of [[0,'edge'],[1,'full'],[2,'free']]){assert.equal(initialTool({protocol}),tool);const m=create(1,{protocol});assert.equal(m.mode,protocol);}
  const m=create();m.selectTool('free');assert.equal(m.params.protocol,2);advance(m,100);assert.equal(m.measurements,0);m.selectTool('full');assert.equal(m.params.protocol,1);advance(m,1);assert.equal(m.measurements,0);advance(m,39);assert.ok(m.measurements>0);m.interact(.5,.5,'edge');assert.equal(m.params.protocol,0);m.setParams({protocol:2});assert.equal(m.mode,2);
});
