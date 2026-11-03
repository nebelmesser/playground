import test from 'node:test';import assert from 'node:assert/strict';
import {create,pathLength,relaxPath,presets} from './model.mjs';
function valid(m){
  assert.ok(m.values().every(Number.isFinite));
  for(const c of m.particles.values())assert.ok(c.r>0&&c.r<=.023);
  for(const g of m.grains)for(const path of g.parts){
    assert.ok(path.nodes.length>=2);
    for(const u of path.nodes){assert.ok(u.x>=0&&u.x<=1&&u.y>=0&&u.y<=1);if(u.pin>=0){const c=m.particles.get(u.pin);assert.ok(c);assert.ok(Math.abs(Math.hypot(u.x-c.x,u.y-c.y)-c.r)<1e-9);}}
    for(let i=1;i<path.nodes.length;i++)for(const c of m.particles.values()){
      const a=path.nodes[i-1],b=path.nodes[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((c.x-a.x)*dx+(c.y-a.y)*dy)/(dx*dx+dy*dy)));
      assert.ok(Math.hypot(a.x+t*dx-c.x,a.y+t*dy-c.y)>=c.r-2e-7,'no grain boundary through a particle');
    }
  }
}
test('a finite disk removes the interior interface and release really reconnects it',()=>{
  const m=create(3,{pins:0}),g=m.grains[0],u=g.parts[0].nodes[15],before=m.energy();const id=m.insertParticle(u.x,u.y);
  assert.equal(g.parts.length,1);assert.equal(g.parts[0].closed,false);assert.equal(g.parts[0].nodes[0].pin,id);assert.equal(g.parts[0].nodes.at(-1).pin,id);assert.ok(m.energy()<before-.01);valid(m);
  const cut=m.energy();m.removeParticle(id);assert.equal(g.parts[0].closed,true);assert.ok(g.parts[0].nodes.every(u=>u.pin===-1));assert.ok(m.energy()>cut+.01);valid(m);
});
test('free movement and radial projection seek the 90-degree grain/particle contact',()=>{
  const left={id:1,x:.25,y:.5,r:.035},right={id:2,x:.75,y:.5,r:.035},particles=new Map([[1,left],[2,right]]);
  let path={closed:false,nodes:[{x:left.x+left.r*Math.cos(1),y:.5+left.r*Math.sin(1),pin:1},{x:right.x-right.r*Math.cos(1),y:.5+right.r*Math.sin(1),pin:2}]};
  const before=pathLength(path);
  for(let i=0;i<16000;i++)path=relaxPath(path,particles,.002,.002);
  assert.ok(pathLength(path)<before-.025);
  for(let i=0;i<2;i++){const u=path.nodes[i],v=path.nodes[1-i],c=i?right:left;assert.ok(Math.abs(Math.hypot(u.x-c.x,u.y-c.y)-c.r)<1e-14);
    const d=Math.hypot(v.x-u.x,v.y-u.y),dot=Math.abs(((v.x-u.x)*(u.x-c.x)+(v.y-u.y)*(u.y-c.y))/(d*c.r));assert.ok(dot>.9999);}
});
test('unconstrained curvature shrinks grain area at the isotropic 2πμ rate, within mesh error',()=>{
  const m=create(1,{pins:0});m.grains=m.grains.slice(0,1);const before=m.area();let energy=m.energy();
  for(let i=0;i<300;i++){m.step();assert.ok(m.energy()<=energy+1e-10);energy=m.energy();}
  const expected=2*Math.PI*.000035*m.time;assert.ok(Math.abs((before-m.area())/expected-1)<.09);valid(m);
});
test('releasing particles changes subsequent area loss while fixed contacts dissipate energy',()=>{
  const a=create(1),b=create(1);for(const c of [...a.particles.values()])if(c.x<.25&&c.y<.35)a.interact(c.x,c.y,'release');
  assert.equal(a.released,3);let energy=b.energy();for(let i=0;i<1200;i++){a.step();b.step();assert.ok(b.energy()<=energy+1e-9);energy=b.energy();}
  assert.ok(a.area()<b.area()-.002);assert.notDeepEqual(a.values(),b.values());valid(a);valid(b);
});
test('dissolution and parameter corners retain deterministic finite contact geometry',()=>{
  const a=create(11,presets[2].values),b=create(11,presets[2].values);a.setParams({mobility:3,dissolve:.0002});b.setParams({mobility:3,dissolve:.0002});
  for(let i=0;i<1800;i++){a.step();b.step();}assert.deepEqual(a.values(),b.values());assert.ok(a.released>0);valid(a);
  for(let i=0;i<120;i++){a.interact((i%11)/10,Math.floor(i/11)/11);}
  assert.ok(a.particles.size<=100);a.setParams({mobility:.25,dissolve:0});for(let i=0;i<200;i++)a.step();valid(a);
});
