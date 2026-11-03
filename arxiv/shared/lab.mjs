import { experiments } from '../catalog.mjs';
import { Renderer } from './render.mjs';
const slug=document.body.dataset.experiment;
const item=experiments.find(x=>x.slug===slug),index=experiments.indexOf(item);
if(!item)throw new Error('Unknown experiment');
const source=`https://arxiv.org/abs/${item.paper.id}`;
document.title=`${item.title} · arXiv / Playground`;
document.body.innerHTML=`
<header class="topbar"><div class="identity"><a class="back" href="../">← ATLAS</a><h1>${item.title}</h1></div><nav aria-label="Browse visualizations"><button id="focus" aria-pressed="false">Field only</button><a href="../${experiments[(index-1+experiments.length)%experiments.length].slug}/" aria-label="Previous visualization">←</a><a href="../${experiments[(index+1)%experiments.length].slug}/" aria-label="Next visualization">→</a></nav></header>
<main class="lab"><section class="stage" aria-label="Visualization"><canvas id="field" tabindex="0" role="img" aria-label="${item.short}. Press the field, drag with the main button held down, or press Enter to intervene."></canvas><div class="stage-status" id="status" aria-live="off">Preparing the model…</div></section><aside class="sidebar"><div class="eyebrow">${item.short}</div><p class="hook">${item.hook}</p><div class="transport"><button id="pause">Pause</button><button id="reset">Restart</button><button id="step">Single step</button><button id="new">New seed</button></div><label class="control"><span class="control-line">Speed <output id="speed-value">1×</output></span><input id="speed" aria-label="Speed" type="range" min=".25" max="3" step=".25" value="1"></label><label class="control-line" for="preset">Preset</label><select class="preset" id="preset" aria-label="Preset"></select><div class="controls" id="controls"></div><div class="metrics" id="metrics" aria-live="off"></div><h2>How to watch</h2><p>${item.watch}</p><p>${item.gesture} You can also drag with the main mouse button held down, or draw with a finger.</p><p class="legend">${item.legend}</p><details><summary>Model and source</summary><pre>${item.equation}</pre><p>${item.limit}</p><a class="paper" href="${source}" target="_blank" rel="noreferrer">${item.paper.title} ↗<small>${item.paper.authors} · ${item.paper.year} · arXiv:${item.paper.id}</small></a></details><button id="snapshot" type="button">Save PNG</button><div class="seed" id="seed"></div><div class="seed">Space — pause · R — restart · H — field only</div></aside></main>`;
const $=id=>document.getElementById(id),canvas=$('field');
let renderer;
let model,module,params,seed,activeTool,speed=1,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,accumulator=0,last=0,lastStats=0,frames=0,observedFps=0;
let cancelGesture=()=>{},syncTools=()=>{};
const query=new URLSearchParams(location.search);
seed=(Number(query.get('seed'))||1)>>>0;
function updateURL(){const q=new URLSearchParams({seed});for(const [key,value] of Object.entries(params))q.set(key,value);history.replaceState(null,'',`?${q}`);}
function updateStats(){
  const metrics=model.metrics();
  $('metrics').innerHTML=Object.entries(metrics).map(([name,value])=>`<div class="metric"><span>${name}</span><strong>${value}</strong></div>`).join('');
  $('status').textContent=`${paused?'PAUSED':'RUNNING'} · t = ${Number(model.time).toFixed(item.rate>300||item.kind==='flock'?0:1)}`;
  canvas.dataset.time=String(model.time);canvas.dataset.paused=String(paused);canvas.dataset.fps=String(observedFps);
  $('seed').textContent=`seed ${seed} · ${item.slug}`;
}
function paint(){renderer.draw(model);updateStats();}
function setPaused(value){paused=value;accumulator=0;$('pause').textContent=paused?'Resume':'Pause';updateStats();}
function restart(){
  cancelGesture();
  model=module.create(seed,params);if(module.initialTool)activeTool=module.initialTool(params);syncTools();renderer.reset();for(let i=0;i<item.warmup;i++){model.step();renderer.record(model);}renderer.record(model);accumulator=0;
  updateURL();paint();
}
function syncControls(){for(const c of item.controls){$(`param-${c.key}`).value=params[c.key];$(`param-${c.key}-value`).value=String(params[c.key]);}}
function step(){model.step();renderer.record(model);}
try{
  module=await import(`../${slug}/model.mjs`);
  if(module.tools?.length){
    activeTool=module.tools[0].id;
    const fieldTools=document.createElement('div'),buttons=document.createElement('div'),hint=document.createElement('p');
    fieldTools.className='field-tools';buttons.className='tool-buttons';buttons.setAttribute('role','group');buttons.setAttribute('aria-label','Field tool');hint.id='tool-hint';hint.textContent=module.tools[0].hint;
    for(const tool of module.tools){
      const button=document.createElement('button');button.type='button';button.textContent=tool.label;button.dataset.tool=tool.id;button.setAttribute('aria-pressed',String(tool.id===activeTool));button.setAttribute('aria-describedby','tool-hint');
      button.onclick=()=>{cancelGesture();activeTool=tool.id;if(model.selectTool){model.selectTool(activeTool);Object.assign(params,model.params);$('preset').value='custom';updateURL();paint();}syncTools();};buttons.append(button);
    }
    syncTools=()=>{for(const other of buttons.children)other.setAttribute('aria-pressed',String(other.dataset.tool===activeTool));hint.textContent=module.tools.find(t=>t.id===activeTool)?.hint||'';};
    fieldTools.append(buttons,hint);document.querySelector('.transport').before(fieldTools);
  }
  renderer=new Renderer(canvas,item.customView?await import(`../${slug}/view.mjs`):{});
  params={...module.defaults};
  const visibleKeys=new Set(item.controls.map(c=>c.key));
  for(const key of Object.keys(module.defaults)){
    if(visibleKeys.has(key)||!query.has(key))continue;
    const value=Number(query.get(key)),allowed=[module.defaults[key],...module.presets.map(p=>p.values[key])];
    if(allowed.includes(value))params[key]=value;
  }
  for(const c of item.controls){const v=Number(query.get(c.key));if(query.has(c.key)&&Number.isFinite(v))params[c.key]=Math.max(c.min,Math.min(c.max,v));}
  $('preset').innerHTML=module.presets.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('')+'<option value="custom" disabled>Custom settings</option>';
  const matching=module.presets.findIndex(p=>Object.entries(p.values).every(([key,v])=>params[key]===v));$('preset').value=matching>=0?String(matching):'custom';
  $('controls').innerHTML=item.controls.map(c=>`<label class="control"><span class="control-line">${c.label}<output id="param-${c.key}-value"></output></span><input id="param-${c.key}" aria-label="${c.label}" type="range" min="${c.min}" max="${c.max}" step="${c.step}"></label>`).join('');
  syncControls();
  for(const c of item.controls)$(`param-${c.key}`).addEventListener('input',()=>{params[c.key]=Number($(`param-${c.key}`).value);if(model.setParams)model.setParams(params);else Object.assign(model.params,params);$(`param-${c.key}-value`).value=String(params[c.key]);$('preset').value='custom';updateURL();paint();});
  $('preset').addEventListener('change',()=>{params={...module.presets[Number($('preset').value)].values};syncControls();restart();});
  $('pause').onclick=()=>setPaused(!paused);$('reset').onclick=restart;
  $('snapshot').onclick=()=>{
    canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${slug}-seed-${seed}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
  };
  $('new').onclick=()=>{seed=crypto.getRandomValues(new Uint32Array(1))[0];restart();};
  $('step').onclick=()=>{setPaused(true);step();paint();};
  $('speed').oninput=()=>{speed=Number($('speed').value);$('speed-value').value=`${speed}×`;};
  $('focus').onclick=()=>{const on=document.body.classList.toggle('focus');$('focus').setAttribute('aria-pressed',on);$('focus').textContent=on?'Show controls':'Field only';};
  const observer=new ResizeObserver(([entry])=>{renderer.resize(entry.contentRect.width,entry.contentRect.height);if(model)paint();});observer.observe(canvas.parentElement);
  const r=canvas.parentElement.getBoundingClientRect();renderer.resize(r.width,r.height);restart();setPaused(paused);
  let drawingPointer=null,lastDrawPoint=null,gestureStarted=false;
  const disturb=event=>{
    const r=canvas.getBoundingClientRect(),p=renderer.point(event.clientX-r.left,event.clientY-r.top);
    if(module.tools?.length&&p.inside===false){lastDrawPoint=null;return;}
    if(!gestureStarted){model.beginInteract?.(p.x,p.y,activeTool);gestureStarted=true;}
    // Editable walls must remain continuous even when pointer samples are sparse.
    const from=module.tools?.length&&lastDrawPoint?lastDrawPoint:p;
    const stamps=Math.max(1,Math.ceil(Math.hypot(p.x-from.x,p.y-from.y)/.008));
    for(let i=1;i<=stamps;i++)model.interact(from.x+(p.x-from.x)*i/stamps,from.y+(p.y-from.y)*i/stamps,activeTool);
    lastDrawPoint=p;paint();
  };
  const stopDrawing=(e,cancelled=false)=>{
    if(e&&e.pointerId!==drawingPointer)return;
    const id=drawingPointer;drawingPointer=null;lastDrawPoint=null;
    if(gestureStarted){gestureStarted=false;model.endInteract?.({cancelled});paint();}
    if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  };
  cancelGesture=()=>stopDrawing(null,true);
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||drawingPointer!==null)return;
    e.preventDefault();canvas.focus({preventScroll:true});drawingPointer=e.pointerId;
    canvas.setPointerCapture(e.pointerId);disturb(e);
  });
  canvas.addEventListener('pointermove',e=>{
    if(e.pointerId!==drawingPointer)return;
    if(!(e.buttons&1)){stopDrawing(e);return;}
    const r=canvas.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>=r.right||e.clientY<r.top||e.clientY>=r.bottom){lastDrawPoint=null;return;}
    e.preventDefault();disturb(e);
  });
  canvas.addEventListener('pointerup',e=>stopDrawing(e));
  for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>stopDrawing(e,true));
  window.addEventListener('blur',cancelGesture);
  canvas.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.repeat&&drawingPointer===null){e.preventDefault();model.beginInteract?.(.5,.5,activeTool);model.interact(.5,.5,activeTool);model.endInteract?.({cancelled:false});paint();}});
  document.addEventListener('keydown',e=>{
    if(/INPUT|SELECT|BUTTON/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.code==='Space'){e.preventDefault();setPaused(!paused);}
    if(e.key.toLowerCase()==='r')restart();if(e.key.toLowerCase()==='h')$('focus').click();
    if(e.key==='Escape'&&document.body.classList.contains('focus'))$('focus').click();
  });
  document.addEventListener('visibilitychange',()=>{last=0;accumulator=0;if(document.hidden)cancelGesture();});
  function frame(now){
    const elapsed=last?Math.min(.1,(now-last)/1000):0;last=now;frames++;
    if(!paused&&!document.hidden){accumulator=Math.min(accumulator+elapsed*item.rate*speed,item.rate*.18);let budget=0;while(accumulator>=1&&budget++<80&&!paused){step();accumulator--;}}
    renderer.draw(model);
    if(now-lastStats>700){observedFps=Math.round(frames*1000/(now-lastStats));frames=0;lastStats=now;updateStats();}
    requestAnimationFrame(frame);
  }
  document.body.dataset.ready='true';requestAnimationFrame(frame);
}catch(error){console.error(error);$('status').textContent='Could not start the model';const message=document.createElement('p');message.className='error';message.textContent=error.message;document.querySelector('.sidebar').prepend(message);}
