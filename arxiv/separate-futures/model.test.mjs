import test from 'node:test';import assert from 'node:assert/strict';
import {create,inheritSimilarity,presets} from './model.mjs';
function valid(m){
  for(const u of m.people){assert.ok(Number.isInteger(u.x)&&u.x>=0&&u.x<m.L);assert.ok(Number.isInteger(u.y)&&u.y>=0&&u.y<m.L);if(m.B)assert.equal(u.genes[46]>>>28,0);}
  const l=m.ledger;if(m.time)assert.equal(l.births,l.parents-l.unmated-l.crowded+l.extra);
  assert.ok(m.species<=Math.max(m.people.length,l.parents));assert.ok(m.values().every(Number.isFinite));
}
test('infinite genomes use the four parental similarities, with exact self similarity',()=>{
  const q=new Float64Array([1,.8,.3,.8,1,.5,.3,.5,1]);const out=inheritSimilarity(q,3,[[0,1],[1,2]],.01);
  assert.equal(out[0],1);assert.equal(out[3],1);assert.ok(Math.abs(out[1]-Math.exp(-.04)*(.8+.3+1+.5)/4)<1e-14);assert.equal(out[1],out[2]);
});
test('finite offspring inherit either parental allele at each locus; incompatible neighbours leave no offspring',()=>{
  const m=create(4,{...presets[0].values,capacity:60,mutation:0});
  m.people=m.people.slice(0,2);for(const u of m.people){u.x=40;u.y=40;u.genes.fill(0);}
  // Parents differ at 128 of 1500 loci: compatible at qmin=.8.
  m.people[1].genes.fill(0xffffffff,0,4);m.step();assert.ok(m.people.length>=2);
  for(const u of m.people){assert.ok(u.genes.slice(0,4).some(v=>v!==0&&v!==0xffffffff));assert.ok(u.genes.slice(4).every(v=>v===0));}
  valid(m);const n=create(5,{...presets[0].values,capacity:60,mutation:0});n.people=n.people.slice(0,2);
  n.people[0].x=n.people[1].x=40;n.people[0].y=n.people[1].y=40;n.people[1].genes.fill(0xffffffff);n.people[1].genes[46]=0x0fffffff;
  n.step();assert.equal(n.people.length,0);assert.equal(n.ledger.unmated,2);n.step();valid(n);
});
test('stricter mating changes an evolved population through actual failed pairings',()=>{
  const a=create(1),b=create(1);for(let i=0;i<650;i++){a.step();b.step();}assert.deepEqual(a.values(),b.values());
  a.setParams({threshold:.9});a.step();b.step();assert.ok(a.ledger.unmated>b.ledger.unmated+100);assert.ok(a.people.length<b.people.length/2);valid(a);valid(b);
});
test('transplant preserves every genome while moving a cohort, and the clearing is an actual demographic pulse',()=>{
  const a=create(8,{capacity:120}),b=create(8,{capacity:120});
  const genes=a.people.map(u=>[...u.genes]);a.beginInteract(.2,.2);a.interact(.2,.2);a.interact(.8,.8);a.endInteract({cancelled:true});
  assert.deepEqual(a.people.map(u=>[...u.genes]),genes);assert.ok(a.ledger.moved>0);assert.notDeepEqual(a.values(),b.values());
  const i=a.people.findIndex(u=>u.tag>0),u=a.people[i],old=a.people.length;a.interact(u.x/(a.L-1),u.y/(a.L-1),'thin');assert.ok(a.people.length<old);assert.equal(a.ledger.removed,old-a.people.length);
  for(let k=0;k<30;k++){a.step();b.step();}assert.notDeepEqual(a.values(),b.values());valid(a);valid(b);
});
test('interpolated diagonal transplantation equals a single total displacement, including reflection',()=>{
  const a=create(8,{capacity:120}),b=create(8,{capacity:120});
  for(const m of [a,b]){m.beginInteract(.2,.2,'move');m.interact(.2,.2,'move');}
  const starts=a.selected.map(i=>({i,x:a.people[i].x,y:a.people[i].y}));assert.ok(starts.length>0);
  const n=Math.ceil(Math.hypot(.5,.5)/.008);
  for(let k=1;k<=n;k++)a.interact(.2+.5*k/n,.2+.5*k/n,'move');b.interact(.7,.7,'move');
  assert.deepEqual(a.values(),b.values());for(const u of starts){assert.ok(a.people[u.i].x-u.x>=39);assert.ok(a.people[u.i].y-u.y>=39);}
  const stationary=a.values();for(let i=0;i<12;i++)a.interact(.7,.7,'move');assert.deepEqual(a.values(),stationary);
  // Crossing the reflecting edge and returning must not accumulate per-stamp
  // rounding or lose the orientation of the same unfolded displacement.
  for(const target of [[.99,.99],[.02,.03]]){for(let k=0;k<50;k++)a.interact(.7+(target[0]-.7)*(k+1)/50,.7+(target[1]-.7)*(k+1)/50,'move');b.interact(...target,'move');assert.deepEqual(a.values(),b.values());}
  a.endInteract({cancelled:true});b.endInteract({cancelled:false});assert.equal(a.selected.length,0);assert.ok(a.people.every(u=>!u.carried&&u.carryBaseX===undefined));
});
test('carried offspring start fresh displacement baselines at their actual birth positions',()=>{
  const m=create(6,{capacity:240,range:9});m.beginInteract(.4,.4,'move');m.interact(.4,.4,'move');m.interact(.5,.5,'move');m.step();
  const children=m.selected.map(i=>({i,x:m.people[i].x,y:m.people[i].y}));assert.ok(children.length>0);
  m.interact(.6,.6,'move');for(const u of children){assert.equal(m.people[u.i].x,u.x+8);assert.equal(m.people[u.i].y,u.y+8);}
  m.endInteract({cancelled:true});assert.ok(m.people.every(u=>!u.carried));valid(m);
});
test('finite and infinite live parameter corners remain bounded and deterministic',()=>{
  for(const genome of [1500,0]){const a=create(17,{genome,capacity:120}),b=create(17,{genome,capacity:120});
    for(const params of [{range:9,threshold:.7,mutation:0},{range:3,threshold:.96,mutation:.002}]){
      a.setParams(params);b.setParams(params);for(let i=0;i<180;i++){a.step();b.step();}valid(a);assert.deepEqual(a.values(),b.values());
    }
  }
});
