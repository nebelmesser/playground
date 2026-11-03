import test from 'node:test';
import assert from 'node:assert/strict';
import {create, defaults, presets, tools} from './model.mjs';
import {draw} from './view.mjs';

const run=(m,n)=>{for(let i=0;i<n;i++)m.step();return m;};
const finite=m=>{
  assert(m.values().every(Number.isFinite));
  for(let i=0;i<m.c.length;i++){assert(m.c[i]>=-1e-13);if(m.walls[i])assert.equal(m.c[i],0);}
  assert(Math.abs(m.mass()-m.emitted+m.drained)<2e-6,'release, water and outlet ledger balance');
  assert(m.drop.x>0&&m.drop.x<m.n&&m.drop.y>0&&m.drop.y<m.n);
  assert(!m.walls[Math.floor(m.drop.x)+m.n*Math.floor(m.drop.y)]);
};

// A fixed physical-regression fixture, independent of the generated map.
function bentChannel(m){
  m.walls.fill(1);
  const box=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)m.walls[x+y*m.n]=0;};
  box(4,20,36,32);box(90,6,112,106);box(24,7,36,67);box(24,55,74,67);box(62,18,74,94);box(62,18,92,30);
  Object.assign(m.drop,{x:10,y:26,vx:.3});m.trail.splice(0,m.trail.length,{x:10,y:26,t:0,break:true});return m;
}

test('one agent moves through its own chemical feedback and reaches the reservoir',()=>{
  const moving=bentChannel(create(3)),passive=bentChannel(create(3,{response:0}));
  run(moving,1600);run(passive,1600);
  assert(moving.drop.x>100,'bent channel is crossed through chemical feedback');
  assert(Math.hypot(passive.drop.x-10,passive.drop.y-26)<.2,'without chemical response the initial kick damps out');
  assert(moving.trail.some(q=>q.y>55)&&moving.trail.some(q=>q.x>75&&q.y<30),'both turns are physically traversed');
  finite(moving);finite(passive);
});

test('painting displaces chemical, erasing and moving preserve mass and field history',()=>{
  const m=run(bentChannel(create(1)),180),before=m.mass(),field=m.c.slice();
  m.interact(18/m.n,26/m.n,'wall');
  assert(m.edits>0);assert(Math.abs(m.mass()-before)<1e-10);
  assert.notDeepEqual(m.c,field,'wall insertion redistributes its water content');
  const displaced=m.c.slice();m.interact(18/m.n,26/m.n,'erase');
  assert.deepEqual(m.c,displaced,'opening adds empty water, rather than erasing the old field');
  m.interact(30/m.n,44/m.n,'move');
  assert.equal(m.drop.x,30);assert.equal(m.drop.y,44);assert.equal(m.drop.vx,0);
  assert.deepEqual(m.c,displaced);assert(m.trail.at(-1).break);
  const old={...m.drop};m.interact(0,0,'move');assert.deepEqual(m.drop,old,'invalid wall placement is rejected');
  m.interact(30/m.n,44/m.n,'wall');
  assert(!m.walls[30+44*m.n],'wall brush protects the drop');
  run(m,300);finite(m);
});

function tunnel(m){
  m.walls.fill(1);
  for(let y=50;y<62;y++)for(let x=2;x<m.n;x++)m.walls[x+y*m.n]=+(x===56);
  Object.assign(m.drop,{x:10,y:56,vx:.3,vy:.001});
}
test('a reflecting wall blocks chemical exactly; opening a tunnel changes the route',()=>{
  const shut=create(1),open=create(1);tunnel(shut);tunnel(open);
  open.interact(.5,.5,'erase');run(shut,450);run(open,450);
  let shutMass=0,openMass=0;
  for(let i=0;i<shut.c.length;i++)if(i%shut.n>56){shutMass+=shut.c[i];openMass+=open.c[i];}
  assert.equal(shutMass,0,'no mass leaks across even a single-cell wall');
  assert(openMass>50,'chemical travels through the erased opening');
  assert(shut.drop.x<56&&open.drop.x>85,'the same initial drop passes only through the open route');
  finite(shut);finite(open);
});

test('emission and sensed force cannot reach through a thin wall next to the drop',()=>{
  const a=create(1,{response:0}),b=create(1,{response:0});
  for(const m of [a,b]){
    m.walls.fill(0);for(let y=0;y<m.n;y++)m.walls[56+y*m.n]=1;
    m.interact(54.7/m.n,56.1/m.n,'move');
    assert.equal(m.drop.x,54.7,'the finite-radius drop has valid wall clearance');
    run(m,25);
    let otherSide=0;for(let i=0;i<m.c.length;i++)if(i%m.n>56)otherSide+=m.c[i];
    assert.equal(otherSide,0,'the source footprint cannot deposit behind the wall');
    finite(m);
  }
  const before=b.gradientAt(b.drop.x,b.drop.y);
  // This field would supply both x and y forces if any remote footprint sample leaked through.
  for(let y=0;y<b.n;y++)for(let x=57;x<b.n;x++)b.c[x+y*b.n]=10+3*(x-57)+.7*y;
  assert.deepEqual(b.gradientAt(b.drop.x,b.drop.y),before,'sensed gradient ignores the other compartment');
  a.setParams({response:48});b.setParams({response:48});a.step();b.step();
  assert.deepEqual(a.drop,b.drop,'actual force and motion are independent of the occluded chemical');
});

test('fixed logarithmic brightness is unchanged by a remote concentration peak',()=>{
  const m=create(1),i=Math.floor(m.drop.x)+Math.floor(m.drop.y)*m.n,room=m.geometry.rooms.at(-1),j=room.x+room.y*m.n;
  m.c[i]=.2;
  const ctx={};for(const key of ['save','beginPath','rect','clip','fillRect','moveTo','lineTo','stroke','arc','fill','restore','strokeRect','fillText'])ctx[key]=()=>{};
  let colour;
  const view={ctx,w:350,h:430,rect:()=>({x:20,y:20,w:300,h:300}),image:(w,h,fn)=>{colour=[...fn(i)];}};
  draw(view,m);const original=colour;
  m.c[j]=200;draw(view,m);
  assert.deepEqual(colour,original,'a new maximum cannot brighten or dim unchanged water elsewhere');
});

test('the same geometry and drop placement retain a different future after a previous visit',()=>{
  const remembered=create(1),fresh=create(1);
  for(const m of [remembered,fresh]){m.walls.fill(0);Object.assign(m.drop,{x:45,y:50,vx:1,vy:0});}
  run(remembered,400);
  for(const m of [remembered,fresh])m.interact(45/m.n,50/m.n,'move');
  assert.deepEqual(remembered.walls,fresh.walls);assert.deepEqual(remembered.drop,fresh.drop);
  run(remembered,150);run(fresh,150);
  assert(Math.hypot(remembered.drop.x-fresh.drop.x,remembered.drop.y-fresh.drop.y)>.5,'the retained self-written field changes the subsequent trajectory');
  finite(remembered);finite(fresh);
});

test('determinism and live diffusion changes affect the continuing field',()=>{
  const a=create(9),b=create(9);run(a,100);run(b,100);assert.deepEqual(a.values(),b.values());
  const time=b.time,params=b.params;b.setParams({diffusion:24});assert.equal(b.time,time);assert.equal(b.params,params);
  a.step();b.step();assert.notDeepEqual(a.c,b.c,'the live coefficient changes the diffusion operator');
  const quiet=create(9),initialX=quiet.drop.x;quiet.setParams({response:0});run(quiet,300);assert(Math.abs(quiet.drop.x-initialX)<.2);
  finite(a);finite(b);finite(quiet);
});

test('presets, parameter corners, and repeated tools stay finite with an exact mass ledger',()=>{
  assert.equal(tools.length,3);
  for(const preset of presets)assert.deepEqual(Object.keys(preset.values).sort(),Object.keys(defaults).sort());
  const cases=[...presets.map(p=>p.values),{diffusion:3,response:0},{diffusion:3,response:100},{diffusion:24,response:0},{diffusion:24,response:100}];
  for(const params of cases){
    const m=create(4,params);
    for(let i=0;i<1200;i++){
      if(i%31===0){const x=.12+.72*((i*13%101)/101),y=.14+.72*((i*29%97)/97);m.interact(x,y,i%62===0?'wall':'erase');}
      if(i%211===0)m.interact(.28,.4,'move');
      m.step();
    }
    for(const tool of tools)for(const [x,y] of [[0,0],[1,1],[-1,2],[.5,.5]])m.interact(x,y,tool.id);
    finite(m);
  }
});
