import test from 'node:test';
import assert from 'node:assert/strict';
import {experiments} from './catalog.mjs';
import {fft,mean,CellList,rng,delta} from './shared/math.mjs';

const advance=(m,steps)=>{for(let i=0;i<steps;i++)m.step();return m;};
const finite=m=>assert.ok(m.values().every(Number.isFinite),'all numerical state is finite');
const distance=(a,b)=>Math.sqrt(mean(a.map((v,i)=>(v-b[i])**2)));

test('catalog presets fit the visible controls and preserve hidden URL parameters',async()=>{
  for(const e of experiments){
    const {defaults,presets}=await import(`./${e.slug}/model.mjs`);
    for(const preset of [{name:'defaults',values:defaults},...presets]){
      for(const key of Object.keys(defaults))assert.ok(Number.isFinite(preset.values[key]),`${e.slug}: ${preset.name} has ${key}`);
      for(const c of e.controls){
        const value=preset.values[c.key],ticks=(value-c.min)/c.step;
        assert.ok(value>=c.min-1e-12&&value<=c.max+1e-12,`${e.slug}: ${preset.name} ${c.key} is in range`);
        assert.ok(Math.abs(ticks-Math.round(ticks))<1e-7,`${e.slug}: ${preset.name} ${c.key} fits slider steps`);
      }
    }
  }
});

test('FFT round trip and Parseval normalization',()=>{
  const a=Float64Array.from({length:128},(_,i)=>Math.sin(i*.7)+.3*Math.cos(i*.4)),b=a.slice(),im=new Float64Array(128);
  fft(b,im);const energy=mean(b.map((v,i)=>v*v+im[i]*im[i]));
  assert.ok(Math.abs(energy-a.reduce((s,v)=>s+v*v,0))<1e-9);
  fft(b,im,true);assert.ok(distance(a,b)<1e-12);
});
test('periodic spatial cells find exactly the same pairs as the direct algorithm',()=>{
  const random=rng(3),x=Float64Array.from({length:100},random),y=Float64Array.from({length:100},random);
  x[0]=.001;x[1]=.999;y[0]=y[1]=.5;
  for(const radius of[.025,.055,.075,.13]){
    const direct=[],cells=[];
    new CellList(100).pairs(x,y,radius,(i,j)=>cells.push(`${i},${j}`));
    for(let i=0;i<100;i++)for(let j=i+1;j<100;j++)if(delta(x[i]-x[j])**2+delta(y[i]-y[j])**2<radius**2)direct.push(`${i},${j}`);
    assert.deepEqual(cells.sort(),direct.sort());
  }
});

for(const e of experiments)test(`${e.slug}: deterministic worlds and finite perturbations`,async()=>{
  const{create,defaults}=await import(`./${e.slug}/model.mjs`);
  const a=advance(create(31,defaults),14),b=advance(create(31,defaults),14);
  assert.deepEqual(a.values(),b.values());
  const before=a.values();a.interact(.47,.53);advance(a,8);finite(a);
  assert.notDeepEqual(a.values(),before);
});

test('Gray–Scott preserves its trivial equilibrium and has late evolution',async()=>{
  const{create,defaults}=await import('./gray-scott/model.mjs');
  const uniform=create();uniform.u.fill(1);uniform.v.fill(0);advance(uniform,100);
  assert.ok(uniform.u.every(v=>v===1));assert.ok(uniform.v.every(v=>v===0));
  const m=advance(create(1,defaults),10000),a=m.v.slice();advance(m,500);finite(m);
  assert.ok(distance(a,m.v)>1e-4);assert.ok(m.values().every(v=>v>=0&&v<=1.01));
});

test('density-dependent motility accumulates particles relative to the same-seed gas',async()=>{
  const{create,presets}=await import('./active-matter/model.mjs');
  const crowded=advance(create(1,presets[0].values),2000),gas=advance(create(1,presets[1].values),2000);
  const fraction=m=>m.density.filter(v=>v>4).length/m.n;
  finite(crowded);assert.ok(fraction(crowded)>fraction(gas)+.15);
  assert.ok(crowded.x.every(x=>x>=0&&x<1));assert.ok(crowded.y.every(x=>x>=0&&x<1));
});

test('cyclic life preserves the density simplex and propagates without new noise',async()=>{
  const{create}=await import('./cyclic-life/model.mjs');const m=advance(create(),12000),a=m.a.slice();
  advance(m,300);finite(m);assert.ok(m.values().every(v=>v>=0&&v<=1));
  for(let i=0;i<m.a.length;i++)assert.ok(m.a[i]+m.b[i]+m.c[i]<=1+1e-10);
  assert.ok(distance(a,m.a)>.01);assert.ok(mean(m.a)>.05&&mean(m.b)>.05&&mean(m.c)>.05);
});

test('Vicsek alignment responds to noise and uses periodic positions',async()=>{
  const{create,presets}=await import('./flocking/model.mjs');
  const ordered=advance(create(1,presets[1].values),1200),disordered=advance(create(1,presets[2].values),1200);
  assert.ok(Number(ordered.metrics()['Polarization'])>.9);assert.ok(Number(disordered.metrics()['Polarization'])<.2);
  assert.ok(ordered.x.every(v=>v>=0&&v<1));assert.ok(ordered.y.every(v=>v>=0&&v<1));
});

test('KS remains real, bounded, mean-zero and dynamic far beyond transient time',async()=>{
  const{create,presets}=await import('./chaotic-surface/model.mjs');
  for(const p of presets){
    const m=advance(create(1,p.values),80000),a=m.u.slice();advance(m,400);finite(m);
    assert.ok(Math.max(...m.u.map(Math.abs))<8);assert.ok(Math.abs(mean(m.u))<1e-12);assert.ok(distance(a,m.u)>.01);
  }
});
