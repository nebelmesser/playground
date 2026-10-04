import test from 'node:test';
import assert from 'node:assert/strict';
import { World, W, H, cell, MAX_RADIUS, DEFAULTS } from '../src/simulation.ts';
import { roadField } from '../src/road-field.ts';
const run=(world,seconds)=>{for(let i=0;i<seconds*30;i++)world.step(1/30);};
function small(){const w=new World(91,{...DEFAULTS,agentCount:1});w.cities=[];w.addCity(30,80,3);w.addCity(90,80,3);w.terrain.fill(0);w.syncAgents();return w;}

test('larger cities participate in more pairs and newly added pairs receive agents',()=>{
 const w=new World(12),c=w.cities[0];w.syncAgents();
 const small=w.pairs().filter(p=>p.a===c.id||p.b===c.id).length;
 w.resizeCity(c,MAX_RADIUS);w.syncAgents();
 const large=w.pairs().filter(p=>p.a===c.id||p.b===c.id).length;
 assert(large>small);assert.equal(large,w.cities.length-1);
 assert(w.pairs().every(pair=>w.agents.some(a=>a.pair===pair.key)));
 assert.equal(w.agents.length,w.params.agentCount);
});

test('city editing respects bounds and removes agents assigned to deleted cities',()=>{
 const w=small(),c=w.cities[0],before=w.revision;
 w.moveCity(c,-50,H+50);assert.equal(c.x,c.radius);assert.equal(c.y,H-c.radius);
 w.resizeCity(c,100);assert(c.radius<=c.x&&c.y+c.radius<=H);assert(w.revision>before);
 w.removeCity(c.id);w.syncAgents();assert.deepEqual(w.pairs(),[]);assert.equal(w.agents.length,0);
});

test('footsteps create only local traces and a stationary agent cannot paint a road',()=>{
 const w=small(),a=w.agents[0];a.x=30.5;a.y=80.5;a.angle=0;
 w.moveAgent(a,0);assert(w.memory.every(v=>v===0));
 w.moveAgent(a,.2);assert(w.memory.some(v=>v>0));
 assert.equal(w.memory[cell(60,80)],0);
 assert.equal(w.memory[cell(90,80)],0);
 assert(w.memory.every((v,i)=>v===0||Math.hypot(i%W-30,Math.floor(i/W)-80)<2));
});

test('arriving improves future reinforcement without replaying an entire path',()=>{
 const w=small(),a=w.agents[0],target=w.cities.find(c=>c.id===a.target);
 a.x=target.x;a.y=target.y;a.wait=0;a.effort=90;
 w.step(1/30);assert.equal(w.journeys,1);assert(w.memory.every(v=>v===0));
 assert(a.confidence>0);
});

test('uphill and downhill slow agents according to separate costs',()=>{
 const w=small(),a=w.agents[0];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)w.terrain[y*W+x]=x/W;
 const up=w.travelCost(30,80,40,80),down=w.travelCost(40,80,30,80);
 assert(up>down&&down>10);
 a.x=30;a.y=80;a.angle=0;w.moveAgent(a,1);const climb=a.x-30;
 w.params.relief=0;a.x=30;w.moveAgent(a,1);assert(a.x-30>climb);
});

test('unused pheromone evaporates with the configured half-life',()=>{
 const w=small();w.params.agentCount=0;w.invalidate();w.memory[22]=1;
 run(w,w.params.evaporation);assert(Math.abs(w.memory[22]-.5)<1e-5);
 w.forget();assert(w.memory.every(v=>v===0));
});

test('soft paths spread continuously but are suppressed across a ridge',()=>{
 const w=small();w.memory[cell(50,80)]=1;
 const soft=roadField(w);const center=soft[cell(50,80)],neighbor=soft[cell(51,80)];
 assert(center>neighbor&&neighbor>0);
 w.terrain[cell(51,80)]=1;const shaped=roadField(w);assert(shaped[cell(51,80)]<neighbor*.01);
});

test('agents find city pairs and form trails through local movement',()=>{
 const w=new World(42);run(w,120);
 assert(w.journeys>100);assert(w.memory.some(v=>v>.1));
 assert(w.agents.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=0&&a.x<W&&a.y>=0&&a.y<H));
 console.log({journeys:w.journeys,agents:w.agents.length,peak:Math.max(...w.memory)});
});

test('terrain painting changes heights without discarding cities',()=>{
 const w=small(),count=w.cities.length,revision=w.revision;
 w.sculpt(50,80,1,5);assert(w.terrain[cell(50,80)]>0);assert(w.revision>revision);
 w.sculpt(0,0,-1,100);assert(w.terrain.every(v=>v>=0&&v<=1));assert.equal(w.cities.length,count);
});
