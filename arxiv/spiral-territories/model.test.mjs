import test from 'node:test';
import assert from 'node:assert/strict';
import {create,defaults,presets} from './model.mjs';
const advance=(m,n)=>{for(let i=0;i<n;i++)m.step();return m;};
const bounds=m=>{for(const a of m.u)assert.ok(Number.isFinite(a)&&a>=-1e-9&&a<1.2);for(const a of m.v)assert.ok(Number.isFinite(a)&&a>=-1e-9&&a<4);};

test('rest is an exact solution; refractoriness suppresses the same stimulus',()=>{
  const resting=create();resting.u.fill(0);resting.v.fill(0);advance(resting,20);
  assert.equal(resting.u.some(x=>x!==0),false);assert.equal(resting.v.some(x=>x!==0),false);
  const fresh=create(),recovering=create();for(const m of [fresh,recovering]){m.u.fill(0);m.v.fill(0);}
  recovering.interact(.5,.5,'rest');fresh.interact(.5,.5,'excite');recovering.interact(.5,.5,'excite');
  advance(fresh,30);advance(recovering,30);const k=96+192*96;
  assert.ok(fresh.u[k]>.8);assert.ok(recovering.u[k]<fresh.u[k]*.5);
});

test('a painted no-flux boundary prevents any excitation crossing',()=>{
  const m=create();m.u.fill(0);m.v.fill(0);const x=m.n/2;
  for(let y=0;y<m.n;y++)m.walls[x+y*m.n]=1;
  m.interact((x-12)/m.n,.5,'excite');advance(m,130);
  let left=0,right=0;for(let y=0;y<m.n;y++)for(let xx=0;xx<m.n;xx++){const q=m.u[xx+y*m.n];if(xx<x)left+=q;if(xx>x)right+=q;}
  assert.ok(left>5);assert.equal(right,0);bounds(m);
});

test('the default opposite spiral sources persist and move without pacing',()=>{
  const m=advance(create(1),500);assert.equal(m.cores.length,2);assert.equal(m.cores[0].charge,-m.cores[1].charge);
  const initial=m.cores.map(q=>({...q}));advance(m,1300);
  assert.equal(m.cores.length,2);assert.ok(m.u.some(x=>x>.8));assert.ok(m.trails.some(t=>t.points.length>100));
  assert.ok(m.cores.some((q,i)=>Math.hypot(q.x-initial[i].x,q.y-initial[i].y)>=1));bounds(m);
});

test('a boundary has a persistent causal effect; open and held interventions work',()=>{
  const a=advance(create(9),300),b=advance(create(9),300);
  for(let y=.3;y<.67;y+=.008)b.interact(.46,y,'wall');advance(a,160);advance(b,160);
  let difference=0;for(let i=0;i<a.u.length;i++)difference+=Math.abs(a.u[i]-b.u[i]);assert.ok(difference>100);
  const before=b.walls.reduce((s,x)=>s+x,0);b.interact(.46,.5,'open');assert.ok(b.walls.reduce((s,x)=>s+x,0)<before);
  b.beginInteract(.25,.25,'excite');for(let i=0;i<100;i++)b.interact(.25,.25,'excite');advance(b,20);b.endInteract({cancelled:true});
  for(const x of [0,1])for(const y of [0,1])for(const tool of ['wall','open','excite','rest'])b.interact(x,y,tool);
  advance(b,60);bounds(b);
});

test('deterministic fields, live coefficients and all preset/control corners stay finite',()=>{
  const a=advance(create(7),25),b=advance(create(7),25);assert.deepEqual(a.values(),b.values());
  b.setParams({diffusion:1.3,recovery:.02});advance(a,20);advance(b,20);assert.notDeepEqual(a.u,b.u);
  for(const preset of presets)assert.deepEqual(Object.keys(preset.values).sort(),Object.keys(defaults).sort());
  for(const [diffusion,recovery] of [[.7,.007],[.7,.02],[1.3,.007],[1.3,.02]]){
    const m=create(5,{diffusion,recovery});for(let k=0;k<80;k++)m.interact((k%11)/10,(k%7)/6,k%2?'excite':'rest');advance(m,220);bounds(m);
  }
  const solo=advance(create(4,{layout:1}),600);bounds(solo);assert.ok(solo.cores.length>0);
});
