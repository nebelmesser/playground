import test from 'node:test';import assert from 'node:assert/strict';
import {create,defaults} from './model.mjs';
const advance=(m,n)=>{for(let i=0;i<n;i++)m.step();return m;};
test('new orientation samples actual crossing filaments; an empty site is unbiased',()=>{
  const m=create();for(const f of m.filaments){f.minus=9;f.plus=11;f.dir=1;}
  assert.equal(m.probability(10),1);assert.equal(m.probability(60),.5);
  m.setParams({feedback:0});assert.equal(m.probability(10),.5);
});
test('retraction changes growth states without turning or instantly deleting a filament',()=>{
  const m=create(),before=m.filaments.map(f=>[f.minus,f.plus,f.dir]);
  m.interact(.5,.5,'cut');assert.deepEqual(m.filaments.map(f=>[f.minus,f.plus,f.dir]),before);
  assert.ok(m.filaments.some(f=>!f.pg&&!f.mg));assert.ok(m.external>0);
});
test('material turns over while feedback retains directional memory',()=>{
  const a=advance(create(3,{...defaults,bias:1}),16000),b=advance(create(3,{...defaults,bias:1,feedback:0}),16000);
  assert.ok(a.filaments.every(f=>!f.original));assert.ok(a.births>100);
  const fraction=m=>m.filaments.filter(f=>f.dir>0).length/m.n;
  assert.ok(fraction(a)>.85);assert.ok(fraction(b)<.75);
  for(const f of a.filaments){assert.ok(f.minus>=0&&f.minus<=70);assert.ok(f.plus>=0&&f.plus<=70);assert.ok(f.dir*(f.plus-f.minus)>0);}
});
test('opposite seeds have descendants and alter later evolution',()=>{
  const a=advance(create(8),300),b=advance(create(8),300);
  for(let row=.1;row<1;row+=.08)a.interact(.43,row,'left');
  assert.ok(a.filaments.filter(f=>f.dir<0).length>b.filaments.filter(f=>f.dir<0).length);
  advance(a,7000);advance(b,7000);assert.notDeepEqual(a.values(),b.values());assert.ok(a.values().every(Number.isFinite));
});
test('a failed newborn cannot support the next newborn checkpoint',()=>{
  const m=create(584,{...defaults,checkpoint:1});
  // Two leftward newborns share site 10 with 58 rightward neighbours. For this
  // seed, the first autofails; the second passes autofail and would survive a
  // six-sample check only if the already failed first filament were still live.
  for(const f of m.filaments)Object.assign(f,{minus:0,plus:70,dir:1,pg:true,mg:true,checkpoint:false,generation:0});
  for(const f of m.filaments.slice(0,2))Object.assign(f,{minus:10.1,plus:10,dir:-1,checkpoint:true,site:10});
  m.step();
  assert.equal(m.deaths,2);
  assert.equal(m.births,2);
  for(const f of m.filaments.slice(0,2)){assert.equal(f.generation,1);assert.equal(f.dir,1);}
  assert.ok(m.filaments.slice(2).every(f=>f.generation===0));
});
