import {rng,clamp} from '../shared/math.mjs';
export const defaults={feedback:1,checkpoint:0,bias:.85};
export const presets=[
  {name:'Direction outlasts material',values:{...defaults}},
  {name:'Without nucleation feedback',values:{feedback:0,checkpoint:0,bias:.85}},
  {name:'A divided beginning',values:{feedback:1,checkpoint:1,bias:.5}}
];
export const tools=[
  {id:'cut',label:'Trigger retraction',hint:'Drag across filaments to make both ends shrink. New material must borrow its direction from what remains.'},
  {id:'right',label:'Seed rightward',hint:'Plant a few short rightward filaments at the nearest nucleation site. Drag through more rows to introduce a larger minority.'},
  {id:'left',label:'Seed leftward',hint:'Plant a few short leftward filaments. Can they leave descendants before they disappear?'}
];
export function create(seed=1,settings=defaults){
  const params={...defaults,...settings},random=rng(seed),length=70,n=60,sites=[10,20,30,40,50,60],dt=1/60;
  let time=0,births=0,deaths=0,external=0,seeded=null;
  const filaments=Array.from({length:n},(_,id)=>{
    const dir=id<Math.round(n*params.bias)?1:-1,c=7.5+55*random();
    return {id,minus:c-dir*7.5,plus:c+dir*7.5,dir,pg:true,mg:true,birth:0,generation:0,original:true,checkpoint:false,site:0};
  });
  function content(x,exclude=-1){
    let right=0,left=0;
    for(const f of filaments)if(f.id!==exclude&&f.dir*(f.plus-f.minus)>0&&x>=Math.min(f.minus,f.plus)&&x<=Math.max(f.minus,f.plus)){if(f.dir>0)right++;else left++;}
    return {right,left};
  }
  function probability(x,exclude=-1){const c=content(x,exclude),total=c.right+c.left;return total?.5+(c.right/total-.5)*params.feedback:.5;}
  function nucleate(f,site=sites[Math.floor(random()*sites.length)],direction){
    f.dir=direction??(random()<probability(site,f.id)?1:-1);f.minus=site;f.plus=site+.1*f.dir;
    f.pg=f.mg=true;f.birth=time;f.generation++;f.original=false;f.checkpoint=true;f.site=site;births++;
  }
  function interact(x,y,tool='cut'){
    const target=clamp(x)*length,row=Math.round(clamp(y)*(n-1));
    if(tool==='cut'){
      // A local external catastrophe changes end states, not polarity or length.
      for(const f of filaments)if(Math.abs(f.id-row)<=7&&target>=Math.min(f.minus,f.plus)-1&&target<=Math.max(f.minus,f.plus)+1){f.pg=f.mg=false;f.checkpoint=false;external++;}
    }else{
      const site=sites.reduce((a,b)=>Math.abs(a-target)<Math.abs(b-target)?a:b);
      for(const f of filaments)if(Math.abs(f.id-row)<=2){const key=`${f.id}:${site}`;if(seeded?.has(key))continue;seeded?.add(key);nucleate(f,site,tool==='right'?1:-1);external++;}
    }
  }
  const m={kind:'renewing-direction',params,n,length,sites,filaments,
    get time(){return time;},get births(){return births;},get deaths(){return deaths;},get external(){return external;},
    content,probability,interact,beginInteract(){seeded=new Set();},endInteract(){seeded=null;},
    setParams(next){Object.assign(params,next);},
    step(){
      const lost=[];
      for(const f of filaments){
        const L=f.dir*(f.plus-f.minus);
        const catP=Math.max(.05,.5+.01*(L-20)),catM=Math.max(.05,.25+.01*(L-20));
        if(random()<1-Math.exp(-(f.pg?catP:.2811)*dt))f.pg=!f.pg;
        if(random()<1-Math.exp(-(f.mg?catM:.67)*dt))f.mg=!f.mg;
        f.plus=clamp(f.plus+f.dir*(f.pg?6:-6)*dt,0,length);
        f.minus=clamp(f.minus-f.dir*(f.mg?.75:-3.5)*dt,0,length);
        if(f.dir*(f.plus-f.minus)<=0){f.plus=f.minus;lost.push(f);}
      }
      // Source algorithm: polymerise all filaments, then check the previous
      // newborns. A failed filament is unavailable to the very next check.
      for(const f of filaments){
        if(!f.checkpoint)continue;f.checkpoint=false;
        if(params.checkpoint<.5||f.dir*(f.plus-f.minus)<=0)continue;
        const c=content(f.site,f.id),total=c.right+c.left,parallel=f.dir>0?c.right:c.left;
        if(random()<.25||(total>0&&random()>1-(1-parallel/total)**6)){f.plus=f.minus;lost.push(f);}
      }
      deaths+=lost.length;
      for(const f of lost)nucleate(f);
      time+=dt;
    },
    values(){return filaments.flatMap(f=>[f.minus,f.plus,f.dir,+f.pg,+f.mg,f.generation]);},
    metrics(){
      const right=filaments.filter(f=>f.dir>0).length,old=filaments.filter(f=>f.original).length,mean=filaments.reduce((s,f)=>s+Math.abs(f.plus-f.minus),0)/n;
      return {'Rightward filaments':`${Math.round(100*right/n)}%`,'Original filaments':`${old} / ${n}`,'Replacements':births,'Mean length':`${mean.toFixed(1)} μm`};
    }
  };return m;
}
