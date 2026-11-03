import{experiments}from './catalog.mjs';
const requested=process.argv.slice(2);
for(const slug of requested)if(!experiments.some(e=>e.slug===slug))throw new Error(`Unknown experiment: ${slug}`);
const selected=requested.length?experiments.filter(e=>requested.includes(e.slug)):experiments;
const report=[];
for(const e of selected){
  const{create,presets,defaults}=await import(`./${e.slug}/model.mjs`);
  for(const preset of presets){
    const m=create(1,preset.values),steps=e.validationSteps??(e.kind==='active'||e.kind==='flock'?2500:e.kind==='surface'?100000:20000);
    for(let i=0;i<steps;i++)m.step();const a=m.values();
    const summary={slug:e.slug,preset:preset.name,steps,time:m.time,finite:a.every(Number.isFinite),min:a.reduce((v,x)=>Math.min(v,x),Infinity),max:a.reduce((v,x)=>Math.max(v,x),-Infinity),metrics:m.metrics()};
    report.push(summary);console.log(JSON.stringify(summary));
    if(!summary.finite)process.exitCode=1;
  }
  for(const high of e.controls.length?[false,true]:[]){
    const params={...defaults,...Object.fromEntries(e.controls.map(c=>[c.key,high?c.max:c.min]))},m=create(3,params);
    const steps=e.validationSteps??(e.kind==='surface'?100000:4000);
    for(let i=0;i<steps;i++)m.step();const a=m.values();
    const summary={slug:e.slug,extreme:high?'maximum':'minimum',steps,finite:a.every(Number.isFinite),maxAbs:a.reduce((v,x)=>Math.max(v,Math.abs(x)),0)};
    report.push(summary);console.log(JSON.stringify(summary));if(!summary.finite)process.exitCode=1;
  }
}
console.log(JSON.stringify({summary:{runs:report.length,finite:report.filter(x=>x.finite).length}}));
