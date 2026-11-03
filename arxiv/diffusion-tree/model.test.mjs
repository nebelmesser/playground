import test from 'node:test';import assert from 'node:assert/strict';
import {create, presets} from './model.mjs';
test('growth adds only empty sites adjacent to older matter',()=>{
  const m=create(7);for(let i=0;i<220;i++)m.step();assert.ok(m.x.length>250);
  for(let i=0;i<m.birth.length;i++)if(m.birth[i]>1){const p=m.parents[i];assert.ok(p>=0);assert.ok(m.birth[p]<m.birth[i]);assert.ok([1,m.n].includes(Math.abs(i-p)));}
  assert.equal(m.x.length,new Set(m.x.map((x,i)=>x+m.n*m.y[i])).size);
});
test('seeded walkers are reproducible, while sticking changes morphology',()=>{
  const a=create(13),b=create(13),c=create(13,{sticking:.1});
  for(let i=0;i<130;i++){a.step();b.step();c.step();}
  assert.deepEqual(a.values(),b.values());assert.notDeepEqual(a.birth,c.birth);
});
test('all regimes and repeated seed interventions remain bounded',()=>{
  for(const p of presets){const m=create(2,p.values);for(let k=0;k<300;k++){if(k%5===0)m.interact(.5+.3*Math.sin(k),.5+.3*Math.cos(k));m.step();}assert.ok(m.values().every(Number.isFinite));assert.ok(m.radius<114);assert.ok(m.x.length<=6500);}
});
