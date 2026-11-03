import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlow,waterVelocity} from './flow.mjs';

function field(ux=1,uy=0){
  const n=8,N=n*n;
  return {n,s:new Float64Array(N).fill(.5),waterE:new Float64Array(N).fill(ux),
    waterN:new Float64Array(N).fill(uy),inlet:new Float64Array(n).fill(ux),waterOut:new Float64Array(n).fill(ux)};
}
const positions=f=>f.particles.map(p=>[p.x,p.y,p.wait]);

test('water markers sample phase flux divided by water content, including inlet and no-flux edges',()=>{
  const m=field(2,1);
  assert.deepEqual(waterVelocity(m,.4,.6),{x:4,y:2,saturation:.5});
  assert.equal(waterVelocity(m,0,.5).x,4);
  assert.equal(waterVelocity(m,1,.5).x,4);
  assert.equal(waterVelocity(m,.5,0).y,0);
  assert.equal(waterVelocity(m,.5,1).y,0);
  m.s.fill(.25);assert.equal(waterVelocity(m,.4,.6).x,8);
});

test('a steady filled field keeps moving at the solved speed; zero steps and zero flux do not animate',()=>{
  const m=field(),a=createFlow(11,m,32),b=createFlow(11,m,32),water=[...m.s];
  for(let i=0;i<300;i++){a.advance(.001);b.advance(.001);}
  assert.deepEqual(positions(a),positions(b));
  const before=positions(a);a.advance(0);assert.deepEqual(positions(a),before);
  a.advance(.01);
  for(let i=0;i<a.particles.length;i++)assert.ok(Math.abs(a.particles[i].x-before[i][0]-.02)<1e-12);
  assert.deepEqual([...m.s],water,'display markers cannot fill or drain the water');
  m.waterE.fill(0);m.waterN.fill(0);m.inlet.fill(0);m.waterOut.fill(0);
  const stopped=positions(a);a.advance(.01);assert.deepEqual(positions(a),stopped);
});

test('a changed flow field bends existing trajectories and finite display lifetimes renew at the inlet',()=>{
  const m=field(),flow=createFlow(3,m,48);
  for(let i=0;i<300;i++)flow.advance(.001);
  const before=positions(flow);m.waterN.fill(.2);flow.advance(.01);
  assert.ok(flow.particles.some((p,i)=>p.y>before[i][1]+.003));
  for(let i=0;i<1500;i++)flow.advance(.001);
  assert.ok(flow.particles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<1&&p.y>=0&&p.y<=1));
  assert.ok(flow.particles.every(p=>p.tail.length<=14));
});
