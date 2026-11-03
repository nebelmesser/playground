import {identity, clamp, point, frameMatrix, commonArea, commonCrop, fitCrop, moveCrop, resizeCrop, stripPolygon} from './geometry.mjs';
import {defaultRegions,fitRegion,moveRegion,resizeRegion,regionFromDrag,inRegions} from './anchors.mjs';

const $=id=>document.getElementById(id);
const canvas=$('preview');
const defaults={mode:'frame',align:true,crop:true,manualCrop:null,region:'ground',anchorRegions:null,showAnchorPoints:true,autoExposure:false,strength:1,fps:4,resolution:'1920',angle:90,reverseStrips:false,compare:false,selected:null,reference:null};
const adjustments=()=>({ev:0,contrast:1,saturation:1,x:0,y:0,rotation:0,scale:100});
let settings={...defaults}, photos=[], db, busy=false, cancelled=false, playing=false, playTime=0, playStart=0, playbackFrame=null;
let worker, sequence=0, requests=new Map(), prepared=false, saveQueue=Promise.resolve(), drawPending=false;
let cropEditing=false,cropDrag=null;
let anchorEditing=false,anchorDrawMode=false,anchorDrag=null,anchorDraft=null,activeAnchor=null,referencePoints=[],referencePointStamp=null;
const number=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
const exampleNames=['0194','0215','0230','0341','0393','0547','0582','1013','1083','1159','1217','1259','1292','1315','1329','1430','1431','1439','1466','1562','1570','1904','2029','2069'].map(n=>`IMG_${n}.jpeg`);
const current=()=>photos.find(p=>p.id===settings.selected)||photos[0];
const reference=()=>photos.find(p=>p.id===settings.reference)||photos[0];
const ratio=()=>reference()?reference().height/reference().width:4/3;
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function progress(value){$('progress').value=value;}
function checkCancel(){if(cancelled)throw new Error('Cancelled');}
function openDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('timelapse-editor',1);request.onupgradeneeded=()=>{const d=request.result;d.createObjectStore('photos',{keyPath:'id'});d.createObjectStore('project');};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function transaction(store,mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const result=fn(tx.objectStore(store));tx.oncomplete=()=>resolve(result?.result);tx.onabort=()=>reject(tx.error||new Error('Could not save the project'));tx.onerror=()=>reject(tx.error);});}
function metadata(){return {version:1,settings:{...settings},photos:photos.map(({id,name,width,height,matrix,adjust,autoEv,status,quality,via,anchorPoints,anchorStamp})=>({id,name,width,height,matrix,adjust,autoEv,status,quality,via,anchorPoints,anchorStamp}))};}
function save(){
  if(!db)return Promise.resolve();
  const snapshot=structuredClone(metadata());$('save-state').textContent='Saving…';
  const task=saveQueue.catch(()=>{}).then(()=>transaction('project','readwrite',s=>s.put(snapshot,'current')));
  saveQueue=task;
  task.then(()=>{if(saveQueue===task)$('save-state').textContent='Saved in this browser';},()=>{$('save-state').textContent='Could not save';notice('Browser storage is full. Free up space so the project can be restored after a reload.',true);});
  return task.catch(()=>{});
}
async function makePreview(blob){
  const original=await createImageBitmap(blob,{imageOrientation:'from-image'});
  const width=original.width,height=original.height,scale=Math.min(1,1400/Math.max(width,height));
  const surface=new OffscreenCanvas(Math.round(width*scale),Math.round(height*scale));
  surface.getContext('2d').drawImage(original,0,0,surface.width,surface.height);original.close();
  const previewBlob=await surface.convertToBlob({type:'image/jpeg',quality:.92});
  return {width,height,previewBlob,image:await createImageBitmap(previewBlob),thumbUrl:URL.createObjectURL(previewBlob)};
}
async function restore(){
  try {
    db=await openDB();
    const project=await transaction('project','readonly',s=>s.get('current'));
    if(project?.version===1){
      settings={...defaults,...project.settings};let missing=0;
      for(const p of project.photos){
        const record=await transaction('photos','readonly',s=>s.get(p.id));
        if(!record){missing++;continue;}
        const image=await createImageBitmap(record.previewBlob);
        photos.push({...p,blob:record.blob,previewBlob:record.previewBlob,image,thumbUrl:URL.createObjectURL(record.previewBlob)});
      }
      if(photos.length)notice(missing?`Project restored. Could not read ${missing} frames.`:`Project restored · ${photos.length} frames.`,!!missing);
    }
  } catch(e){notice(`Browser storage is unavailable: ${e.message}. Changes may not be saved.`,true);}
  refresh();
}
function cropRect(){
  const r=ratio(),full={x:0,y:0,w:1,h:r};
  if(!settings.crop)return full;
  if(settings.manualCrop)return fitCrop(settings.manualCrop,r);
  if(photos.length<2)return full;
  return commonCrop(photos.map(p=>frameMatrix(p,r,settings.align)),r)||full;
}
function cropEditView(){
  const r=ratio(),corners=[[0,0],[1,0],[1,r],[0,r]];
  const points=[...corners,...photos.flatMap(p=>corners.map(([x,y])=>point(frameMatrix(p,r,settings.align),x,y)))];
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),padding=Math.max(right-left,bottom-top)*.02;
  return {x:left-padding,y:top-padding,w:right-left+padding*2,h:bottom-top+padding*2};
}
const anchorRegions=()=>settings.anchorRegions===null?defaultRegions(settings.region,ratio()):settings.anchorRegions.map(r=>fitRegion(r,ratio()));
const anchorStamp=()=>JSON.stringify([settings.reference,settings.region,anchorRegions()]);
const anchorView=()=>({x:-.025,y:-.025*ratio(),w:1.05,h:1.05*ratio()});
function paintAnchorPoints(ctx,view,width,height){
  const regions=anchorRegions(),stamp=anchorStamp(),p=current(),unit=width/Math.max(1,canvas.getBoundingClientRect().width);
  const dot=([x,y],radius)=>{if(!inRegions(x,y,regions))return;ctx.beginPath();ctx.arc((x-view.x)/view.w*width,(y-view.y)/view.h*height,radius*unit,0,2*Math.PI);ctx.fill();};
  ctx.save();ctx.resetTransform();ctx.filter='none';
  if(settings.showAnchorPoints&&referencePointStamp===stamp){ctx.fillStyle='rgba(255,202,118,.45)';for(const p of referencePoints)dot(p,.9);}
  if(p?.anchorStamp===stamp){ctx.fillStyle='#d4ed9b';for(const q of p.anchorPoints||[])dot(q,2.2);}
  ctx.restore();
}
function positionAnchorOverlay(){
  const overlay=$('anchor-overlay');overlay.hidden=!anchorEditing||!photos.length;
  if(overlay.hidden)return;
  const image=canvas.getBoundingClientRect(),stage=$('stage'),bounds=stage.getBoundingClientRect(),view=anchorView();
  overlay.style.left=`${image.left-bounds.left-stage.clientLeft}px`;overlay.style.top=`${image.top-bounds.top-stage.clientTop}px`;
  overlay.style.width=`${image.width}px`;overlay.style.height=`${image.height}px`;overlay.classList.toggle('drawing',anchorDrawMode);
  const regions=[...anchorRegions(),...(anchorDraft?[anchorDraft]:[])],ids=new Set(regions.map(r=>r.id));
  for(const child of [...overlay.children])if(!ids.has(child.dataset.anchor))child.remove();
  regions.forEach((region,i)=>{
    let box=[...overlay.children].find(e=>e.dataset.anchor===region.id);
    if(!box){
      box=document.createElement('div');box.className='anchor-box';box.dataset.anchor=region.id;box.role='group';box.tabIndex=0;
      const label=document.createElement('span');label.className='anchor-label';box.append(label);
      for(const corner of ['nw','ne','sw','se']){const handle=document.createElement('button');handle.type='button';handle.className=`crop-handle ${corner}`;handle.dataset.corner=corner;handle.setAttribute('aria-label',`Resize alignment region ${i+1} from ${corner}`);box.append(handle);}
      overlay.append(box);
    }
    box.classList.toggle('active',region.id===activeAnchor);box.classList.toggle('draft',anchorDraft?.id===region.id);
    box.setAttribute('aria-label',`Alignment region ${i+1}. Drag to move or use arrow keys.`);
    box.querySelector('.anchor-label').textContent=settings.anchorRegions===null&&region.id==='automatic'?'1 · Auto':String(i+1);
    box.style.left=`${(region.x-view.x)/view.w*image.width}px`;box.style.top=`${(region.y-view.y)/view.h*image.height}px`;
    box.style.width=`${region.w/view.w*image.width}px`;box.style.height=`${region.h/view.h*image.height}px`;
  });
}
function syncAnchorControls(){
  const regions=anchorRegions(),stamp=anchorStamp(),p=current();
  if(!regions.some(r=>r.id===activeAnchor))activeAnchor=regions[0]?.id||null;
  $('region').value=settings.anchorRegions===null?settings.region:'custom';
  $('edit-anchors').textContent=anchorEditing?'Done editing anchors':'Edit anchors';$('edit-anchors').setAttribute('aria-pressed',String(anchorEditing));
  for(const id of ['edit-anchors','add-anchor','reset-anchors'])$(id).disabled=busy||!photos.length;
  $('remove-anchor').disabled=busy||!activeAnchor;$('anchor-tools').hidden=!anchorEditing;
  $('show-anchor-points').checked=settings.showAnchorPoints;
  $('add-anchor').textContent=anchorDrawMode?'Cancel drawing':'＋ Draw region';$('add-anchor').setAttribute('aria-pressed',String(anchorDrawMode));
  const list=document.createDocumentFragment();
  regions.forEach((region,i)=>{const b=document.createElement('button');b.type='button';b.className='region-chip';b.textContent=`Region ${i+1}`;b.disabled=busy;b.setAttribute('aria-pressed',String(activeAnchor===region.id));b.onclick=()=>{activeAnchor=region.id;syncAnchorControls();};list.append(b);});
  $('anchor-list').replaceChildren(list);
  let summary=settings.anchorRegions===null?`Automatic search area · ${settings.region==='ground'?'lower 70%':'whole image'}`:`${regions.length} custom ${regions.length===1?'region':'regions'}`;
  if(anchorEditing&&referencePointStamp===stamp)summary+=` · ${referencePoints.length} detected points`;
  if(anchorEditing&&p?.anchorStamp===stamp)summary+=` · ${p.anchorPoints?.length||0} used matches for this frame`;
  else if(anchorEditing&&p?.id!==settings.reference)summary+=' · Align frames to update used matches';
  if(!regions.length)summary='Draw at least one region before aligning.';
  $('anchor-summary').textContent=summary;
  $('anchor-legend').hidden=!anchorEditing||!photos.length;$('stage').classList.toggle('editing-anchors',anchorEditing);
  positionAnchorOverlay();
}
function changedAnchors(persist=true){
  prepared=false;referencePointStamp=null;syncAnchorControls();$('align').disabled=busy||photos.length<2||!anchorRegions().length;draw();if(persist)save();
}
function anchorPointer(event){
  const image=canvas.getBoundingClientRect(),view=anchorView();
  return [clamp(view.x+(event.clientX-image.left)/image.width*view.w,0,1),clamp(view.y+(event.clientY-image.top)/image.height*view.h,0,ratio())];
}
function paintCoverage(ctx,view,width,height){
  const r=ratio(),matrices=photos.map(p=>frameMatrix(p,r,settings.align));
  const unit=width/Math.max(1,canvas.getBoundingClientRect().width);
  const toPixel=([x,y])=>[(x-view.x)/view.w*width,(y-view.y)/view.h*height];
  const path=polygon=>{ctx.beginPath();polygon.map(toPixel).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();};
  ctx.save();ctx.resetTransform();ctx.filter='none';ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(165,200,229,.8)';ctx.lineWidth=unit;ctx.setLineDash([4*unit,4*unit]);
  for(const matrix of matrices){path([[0,0],[1,0],[1,r],[0,r]].map(([x,y])=>point(matrix,x,y)));ctx.stroke();}
  const shared=commonArea(matrices,r);
  if(shared.length>=3){path(shared);ctx.fillStyle='rgba(212,237,155,.1)';ctx.fill();ctx.strokeStyle='#d4ed9b';ctx.lineWidth=1.5*unit;ctx.setLineDash([7*unit,4*unit]);ctx.stroke();}
  ctx.restore();
}
function dimensions(maxSide,crop=cropRect()){
  const originalMax=Math.max(reference()?.width||1920,reference()?.height||1440)*crop.w;
  const side=maxSide==='original'?originalMax:Math.min(Number(maxSide),originalMax);
  const scale=side/Math.max(crop.w,crop.h);
  const even=n=>Math.max(2,Math.floor(n/2+1e-7)*2);
  return [even(crop.w*scale),even(crop.h*scale)];
}
function drawCover(ctx,image,w,h){
  const ir=image.width/image.height,or=w/h;
  const sw=ir>or?image.height*or:image.width,sh=ir>or?image.height:image.width/or;
  ctx.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,0,0,w,h);
}
function paintPhoto(ctx,p,image,crop,w,h,alpha=1,raw=false){
  ctx.save();ctx.globalAlpha=alpha;
  const a=p.adjust;
  const ev=raw?0:a.ev+(settings.autoExposure?p.autoEv*settings.strength:0);
  ctx.filter=raw?'none':`brightness(${2**ev}) contrast(${a.contrast}) saturate(${a.saturation})`;
  ctx.scale(w/crop.w,h/crop.h);ctx.translate(-crop.x,-crop.y);
  ctx.transform(...(raw?identity():frameMatrix(p,ratio(),settings.align)));
  drawCover(ctx,image,1,ratio());ctx.restore();
}
async function render(target,{full=false,collage=settings.mode==='strips',frame=current(),compare=false,view=cropRect(),coverage=false,anchors=false}={}){
  const ctx=target.getContext('2d'),w=target.width,h=target.height,crop=view;
  ctx.resetTransform();ctx.filter='none';ctx.fillStyle='#111411';ctx.fillRect(0,0,w,h);
  if(!photos.length)return;
  if(anchors){paintPhoto(ctx,reference(),reference().image,view,w,h,1,true);paintAnchorPoints(ctx,view,w,h);return;}
  const list=collage?(settings.reverseStrips?[...photos].reverse():photos):[frame];
  for(let i=0;i<list.length;i++){
    if(full)checkCancel();const p=list[i];let image=p.image;
    if(full)image=await createImageBitmap(p.blob,{imageOrientation:'from-image'});
    try {
      ctx.save();
      if(collage){const polygon=stripPolygon(i,list.length,w,h,settings.angle);ctx.beginPath();polygon.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();}
      paintPhoto(ctx,p,image,crop,w,h);ctx.restore();
    } finally {if(full)image.close();}
    if(full&&collage)progress((i+1)/list.length);
  }
  if(compare&&!collage&&frame.id!==reference().id)paintPhoto(ctx,reference(),reference().image,crop,w,h,.5);
  if(coverage)paintCoverage(ctx,view,w,h);
}
function draw(){
  if(drawPending)return;drawPending=true;
  requestAnimationFrame(()=>{
    drawPending=false;
    const view=anchorEditing?anchorView():cropEditing?cropEditView():cropRect();
    const [w,h]=dimensions(1400,view);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    render(canvas,{view,anchors:anchorEditing,coverage:cropEditing,collage:!cropEditing&&settings.mode==='strips',compare:$('compare').checked}).catch(e=>notice(e.message,true));
    positionCropOverlay();positionAnchorOverlay();
  });
}
function positionCropOverlay(){
  const overlay=$('crop-frame');overlay.hidden=!cropEditing||!photos.length||busy;
  if(overlay.hidden)return;
  const image=canvas.getBoundingClientRect(),stage=$('stage').getBoundingClientRect(),crop=cropRect(),view=cropEditView();
  overlay.style.left=`${image.left-stage.left-$('stage').clientLeft+(crop.x-view.x)/view.w*image.width}px`;
  overlay.style.top=`${image.top-stage.top-$('stage').clientTop+(crop.y-view.y)/view.h*image.height}px`;
  overlay.style.width=`${crop.w/view.w*image.width}px`;overlay.style.height=`${crop.h/view.h*image.height}px`;
}
function syncCropControls(){
  const crop=cropRect();
  $('crop').checked=settings.crop;
  $('edit-crop').textContent=cropEditing?'Done cropping':'Edit crop';$('edit-crop').setAttribute('aria-pressed',String(cropEditing));
  $('edit-crop').disabled=busy||!photos.length;$('reset-crop').disabled=busy||!photos.length;
  $('crop-size').disabled=busy||!photos.length||!settings.crop;$('crop-size').value=crop.w*100;
  $('crop-size-value').textContent=`${number.format(crop.w*100)}%`;
  $('crop-summary').textContent=!settings.crop?'Crop disabled':settings.manualCrop?`Custom · X ${number.format(crop.x*100)}% · Y ${number.format(crop.y/ratio()*100)}%`:'Automatic · shared area';
  $('stage').classList.toggle('editing-crop',cropEditing);
  $('coverage-legend').hidden=!cropEditing||!photos.length;
  positionCropOverlay();
}
function updateOutputMeta(){
  const [w,h]=dimensions(settings.resolution);
  $('canvas-meta').textContent=photos.length?`${w} × ${h} · ${anchorEditing?'EDIT ANCHORS':cropEditing?'EDIT CROP':settings.mode==='strips'?'COLLAGE':`${number.format(settings.fps)} FPS`}`:'NO FRAMES';
}
function setCustomCrop(crop,persist=true){
  settings.crop=true;settings.manualCrop=fitCrop(crop,ratio());
  syncCropControls();updateOutputMeta();draw();if(persist)save();
}
function refreshTimeline(){
  const fragment=document.createDocumentFragment();
  photos.forEach((p,i)=>{
    const item=document.createElement('div');item.className='photo';item.role='listitem';item.draggable=true;item.dataset.id=p.id;item.setAttribute('aria-current',String(p.id===settings.selected));
    const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`Frame ${i+1}: ${p.name}`);button.disabled=busy;
    const img=document.createElement('img');img.src=p.thumbUrl;img.alt='';img.draggable=false;button.append(img);
    const index=document.createElement('span');index.className='photo-number';index.textContent=String(i+1).padStart(2,'0');button.append(index);
    const state=document.createElement('span');state.className='photo-state';
    state.textContent=p.id===settings.reference?'REF':p.status==='aligned'?'✓':p.status==='failed'?'!': '·';state.classList.toggle('failed',p.status==='failed');
    state.title=p.id===settings.reference?'Reference frame':p.status==='aligned'?`${p.quality.inliers} matching points · error ${number.format(p.quality.error)} px`:p.status==='failed'?'Could not align reliably. Adjust the position manually.':'Waiting for alignment';button.append(state);
    const caption=document.createElement('div');caption.className='photo-caption';caption.textContent=p.name;item.append(button,caption);
    button.addEventListener('click',()=>selectPhoto(p.id));
    item.addEventListener('dragstart',event=>{if(busy){event.preventDefault();return;}event.dataTransfer.setData('text/plain',p.id);event.dataTransfer.effectAllowed='move';item.classList.add('dragging');});
    item.addEventListener('dragend',()=>item.classList.remove('dragging'));
    item.addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='move';item.classList.add('over');});
    item.addEventListener('dragleave',()=>item.classList.remove('over'));
    item.addEventListener('drop',event=>{event.preventDefault();event.stopPropagation();const source=photos.findIndex(f=>f.id===event.dataTransfer.getData('text/plain')),dest=photos.findIndex(f=>f.id===p.id);if(source>=0&&source!==dest){const [moved]=photos.splice(source,1);photos.splice(dest,0,moved);refresh();save();}});
    fragment.append(item);
  });
  $('timeline').replaceChildren(fragment);
}
function syncSelected(){
  const p=current(),a=p?.adjust||adjustments();
  $('selected-name').textContent=p?p.name:'No frame selected';
  const mapping={'ev':'ev','contrast':'contrast','saturation':'saturation','shift-x':'x','shift-y':'y','rotation':'rotation','scale':'scale'};
  for(const [id,key]of Object.entries(mapping))$(id).value=a[key];
  $('ev-value').textContent=`${a.ev>0?'+':''}${number.format(a.ev)} EV`;
  $('contrast-value').textContent=`${Math.round(a.contrast*100)}%`;$('saturation-value').textContent=`${Math.round(a.saturation*100)}%`;
  $('exposure-summary').textContent=p&&settings.autoExposure?`Auto correction: ${p.autoEv>=0?'+':''}${number.format(p.autoEv*settings.strength)} EV · manual exposure is added to this.`:'Based on shared areas of the reference frame.';
}
function refresh(){
  if(!photos.some(p=>p.id===settings.selected))settings.selected=photos[0]?.id||null;
  if(!photos.some(p=>p.id===settings.reference))settings.reference=photos[0]?.id||null;
  document.body.classList.toggle('busy',busy);
  $('empty').hidden=!!photos.length;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.mode===settings.mode)));
  $('align-enabled').checked=settings.align;$('crop').checked=settings.crop;$('region').value=settings.region;$('auto-exposure').checked=settings.autoExposure;$('exposure-strength').value=settings.strength;$('exposure-strength-value').textContent=`${Math.round(settings.strength*100)}%`;
  $('fps').value=settings.fps;$('resolution').value=settings.resolution;$('angle').value=settings.angle;$('angle-value').textContent=`${settings.angle}°`;$('reverse-strips').checked=settings.reverseStrips;
  $('direction').value=[0,45,90,135].includes(settings.angle)?String(settings.angle):'custom';$('angle-field').hidden=$('direction').value!=='custom';
  const index=photos.findIndex(p=>p.id===settings.selected);
  $('frame-counter').textContent=`${String(index+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;
  $('photo-count').textContent=`${photos.length} frames`;$('duration').textContent=`${photos.length} frames · ${number.format(photos.length/settings.fps)} s`;
  updateOutputMeta();
  const failed=photos.filter(p=>p.status==='failed').length,aligned=photos.filter(p=>p.status==='aligned').length;
  $('alignment-summary').textContent=photos.length?`Reference: ${reference().name}${aligned?` · ${aligned} aligned`:''}${failed?` · ${failed} need adjustment`:''}`:'The first photo becomes the reference.';
  const p=current();$('stage-badge').hidden=!p;
  $('stage-badge').textContent=anchorEditing?`Reference: ${reference()?.name||''}`:cropEditing?'Edit crop · drag to move':settings.mode==='strips'?`${photos.length} stripes · ${settings.angle}°`:p?.status==='failed'?'! Check this frame’s alignment':p?.id===settings.reference?'Reference frame':p?.status==='aligned'?`${p.quality.inliers} matching points`:p?.name||'';
  $('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'Pause':'Play');
  for(const id of ['align','export-video','export-collage','previous','next','play','sort','reverse','clear','make-reference','reset-frame','move-left','move-right','remove'])$(id).disabled=busy||!photos.length;
  $('make-reference').disabled=busy||!p||p.id===settings.reference;$('align').disabled=busy||photos.length<2||!anchorRegions().length;
  $('move-left').disabled=busy||index<=0;$('move-right').disabled=busy||index<0||index===photos.length-1;
  for(const id of ['add','empty-add','empty-examples','examples'])$(id).disabled=busy;
  document.querySelectorAll('.controls input,.controls select').forEach(el=>el.disabled=busy);
  $('compare').checked=settings.compare;$('compare').disabled=busy||!p||settings.mode==='strips'||anchorEditing;$('cancel').hidden=!busy;$('progress').hidden=!busy;
  syncCropControls();syncAnchorControls();syncSelected();refreshTimeline();draw();
}
function selectPhoto(id,scroll=false){stop();settings.selected=id;refresh();save();if(scroll)$('timeline').querySelector(`[data-id="${id}"]`)?.scrollIntoView({block:'nearest',inline:'nearest'});}
function stop(){
  playing=false;
  if(playbackFrame!==null){cancelAnimationFrame(playbackFrame);playbackFrame=null;}
  $('play').textContent='▶';$('play').setAttribute('aria-label','Play');
}
function startPlayback(){
  stop();
  if(!photos.length||busy)return;
  cropEditing=false;anchorEditing=false;anchorDrawMode=false;
  settings.mode='video';playing=true;playTime=performance.now();playStart=Math.max(0,photos.findIndex(p=>p.id===settings.selected));refresh();
  const animate=now=>{
    playbackFrame=null;
    if(!playing||!photos.length){stop();return;}
    const index=(playStart+Math.floor((now-playTime)/1000*settings.fps))%photos.length;
    const frame=photos[index];
    if(frame.id!==settings.selected){settings.selected=frame.id;refresh();}
    playbackFrame=requestAnimationFrame(animate);
  };
  playbackFrame=requestAnimationFrame(animate);
}
function step(offset){if(!photos.length||busy)return;const index=photos.findIndex(p=>p.id===settings.selected);selectPhoto(photos[(index+offset+photos.length)%photos.length].id,true);}
async function job(fn,{keepAnchors=false}={}){
  if(busy)return;stop();cropEditing=false;if(!keepAnchors){anchorEditing=false;anchorDrawMode=false;}busy=true;cancelled=false;progress(0);refresh();
  try {await fn();}catch(e){if(cancelled||e.message==='Cancelled')notice('Cancelled. Photos already added have been saved.');else notice(`Could not complete: ${e.message}`,true);}
  finally {busy=false;refresh();await save();}
}
function getWorker(){
  if(!worker){
    worker=new Worker(new URL('./align-worker.js',import.meta.url));
    worker.onmessage=({data})=>{const p=requests.get(data.id);if(!p)return;requests.delete(data.id);clearTimeout(p.timer);data.ok?p.resolve(data):p.reject(new Error(data.error));};
    worker.onerror=e=>resetWorker(new Error(e.message||'Alignment module error'));
  }
  return worker;
}
function resetWorker(error=new Error('Cancelled')){worker?.terminate();worker=null;prepared=false;for(const p of requests.values()){clearTimeout(p.timer);p.reject(error);}requests.clear();}
function callWorker(data,transfer=[]){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>resetWorker(new Error('Alignment took too long. Please try again.')),90000);requests.set(id,{resolve,reject,timer});getWorker().postMessage({...data,request:id},transfer);});}
async function photoFeatures(p,ctx){
  const {width,height}=ctx.canvas;drawCover(ctx,p.image,width,height);const image=ctx.getImageData(0,0,width,height),isReference=p.id===settings.reference;
  const data=await callWorker({type:'features',id:p.id,image,regions:anchorRegions(),matrix:isReference?identity():p.matrix,margin:isReference?0:.08},[image.data.buffer]);
  if(isReference){referencePoints=data.positions;referencePointStamp=anchorStamp();}
  return data;
}
async function detectReferencePoints(){
  if(!photos.length||referencePointStamp===anchorStamp())return;
  notice('Detecting anchor points inside the selected regions…');
  const surface=new OffscreenCanvas(1000,Math.round(1000*ratio()));
  await photoFeatures(reference(),surface.getContext('2d',{willReadFrequently:true}));progress(1);
  notice('Edit the highlighted search areas on the reference photo. Click Align frames to apply them to the sequence.');
}
async function prepare(){
  if(prepared)return;
  if(worker)worker.postMessage({type:'clear'});
  const width=1000,height=Math.round(width*ratio()),surface=new OffscreenCanvas(width,height),ctx=surface.getContext('2d',{willReadFrequently:true});
  for(let i=0;i<photos.length;i++){
    checkCancel();notice(`Finding matching details · ${i+1} / ${photos.length}`);
    await photoFeatures(photos[i],ctx);progress((i+1)/photos.length*.35);
  }
  prepared=true;
}
async function alignPhotos(){
  if(photos.length<2)return;
  if(!anchorRegions().length)throw new Error('Draw at least one alignment region.');
  await prepare();checkCancel();const ref=reference();ref.matrix=identity();ref.autoEv=0;ref.status='reference';
  const stamp=anchorStamp();ref.anchorPoints=[];ref.anchorStamp=stamp;
  const known=[ref];const pending=photos.filter(p=>p.id!==ref.id);
  for(let i=0;i<pending.length;i++){
    checkCancel();const p=pending[i];notice(`Aligning matching details · ${i+1} / ${pending.length}`);
    const index=photos.indexOf(p);
    const neighbors=known.filter(k=>k.id!==ref.id).sort((a,b)=>Math.abs(photos.indexOf(a)-index)-Math.abs(photos.indexOf(b)-index)).slice(0,3);
    const data=await callWorker({type:'match',source:p.id,reference:ref.id,region:settings.region,regions:anchorRegions(),custom:settings.anchorRegions!==null,candidates:[ref,...neighbors].map(k=>({id:k.id,matrix:k.matrix}))});
    p.autoEv=data.ev;
    p.anchorPoints=data.result?.anchors||[];p.anchorStamp=stamp;
    if(data.result){p.matrix=data.result.matrix;p.status='aligned';p.quality={inliers:data.result.inliers,error:data.result.error};p.via=data.result.via;known.push(p);}
    else {p.matrix=identity();p.status='failed';p.quality=null;}
    progress(.35+(i+1)/pending.length*.65);draw();
  }
  const failures=photos.filter(p=>p.status==='failed').length;
  notice(failures?`Alignment complete. ${failures} frames could not be aligned reliably and are marked “!”. Select them to adjust their position manually.`:`Aligned ${photos.length} frames. Enable reference comparison to check the details.`,!!failures);
}
async function updateExposure(){
  if(photos.length<2)return;
  await prepare();
  for(let i=0;i<photos.length;i++){
    checkCancel();const p=photos[i];notice(`Matching exposure · ${i+1} / ${photos.length}`);
    p.autoEv=p.id===settings.reference?0:(await callWorker({type:'exposure',source:p.id,reference:settings.reference,matrix:frameMatrix(p,ratio(),settings.align),region:settings.region})).ev;progress((i+1)/photos.length);
  }
  notice('Exposure matched using shared areas. You can add a manual exposure adjustment to each frame.');
}
async function importPhotos(files){
  if(!files.length)return;
  let skipped=0,added=0;
  for(let i=0;i<files.length;i++){
    checkCancel();const file=files[i];notice(`Adding photos · ${i+1} / ${files.length}`);
    if(file.type&&!file.type.startsWith('image/')){skipped++;continue;}
    let preview;
    try {preview=await makePreview(file);}catch{skipped++;continue;}
    const id=crypto.randomUUID();
    if(db)await transaction('photos','readwrite',s=>s.put({id,blob:file,previewBlob:preview.previewBlob}));
    photos.push({id,name:file.name||`Frame ${photos.length+1}`,blob:file,...preview,matrix:identity(),adjust:adjustments(),autoEv:0,status:'pending',quality:null});added++;
    settings.selected=id;settings.reference||=id;prepared=false;progress((i+1)/files.length);refresh();
    await save();
  }
  if(added&&settings.align&&photos.length>1)await alignPhotos();
  else if(added&&settings.autoExposure)await updateExposure();
  else notice(`Added ${added} frames.`);
  if(skipped)notice(`Added ${added} frames. Could not read ${skipped} files. Supported formats: JPEG, PNG, WebP and AVIF.`,true);
}
async function examples(){
  await job(async()=>{
    const files=[];const existing=new Set(photos.map(p=>p.name));
    for(let i=0;i<exampleNames.length;i++){
      checkCancel();const name=exampleNames[i];if(existing.has(name))continue;
      notice(`Loading examples · ${i+1} / ${exampleNames.length}`);
      const response=await fetch(new URL(`./examples/${name}`,import.meta.url));if(!response.ok)throw new Error(`Could not find ${name}`);
      files.push(new File([await response.blob()],name,{type:'image/jpeg'}));progress((i+1)/exampleNames.length*.2);
    }
    if(!files.length){notice('All example photos have already been added.');return;}
    await importPhotos(files);
  });
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function exportCollage(){
  await job(async()=>{
    const [w,h]=dimensions(settings.resolution),target=document.createElement('canvas');target.width=w;target.height=h;
    notice(`Creating collage · ${w} × ${h}`);await render(target,{full:true,collage:true});checkCancel();
    const blob=await new Promise(resolve=>target.toBlob(resolve,'image/jpeg',.96));if(!blob)throw new Error('Could not create the JPEG');
    download(blob,'timelapse-collage.jpg');progress(1);notice(`Collage saved · ${w} × ${h} · ${photos.length} stripes.`);
  });
}
async function exportVideo(){
  await job(async()=>{
    if(typeof VideoEncoder==='undefined')throw new Error('MP4 export requires a recent version of Chrome, Edge or Safari with WebCodecs support.');
    const {Output,Mp4OutputFormat,BufferTarget,CanvasSource,Quality,canEncodeVideo}=await import('./vendor/mediabunny.mjs');
    const [w,h]=dimensions(settings.resolution),target=document.createElement('canvas');target.width=w;target.height=h;
    const fps=settings.fps;
    if(!await canEncodeVideo('avc',{width:w,height:h,bitrate:Math.max(2000000,w*h*4)}))throw new Error('H.264 encoding is unavailable at this size. Select a smaller longest side.');
    const output=new Output({format:new Mp4OutputFormat({fastStart:'in-memory'}),target:new BufferTarget()});
    const source=new CanvasSource(target,{codec:'avc',quality:new Quality('high'),keyFrameInterval:2});
    output.addVideoTrack(source,{frameRate:fps});
    try {
      await output.start();
      for(let i=0;i<photos.length;i++){
        checkCancel();notice(`Creating MP4 · frame ${i+1} / ${photos.length}`);
        await render(target,{full:true,collage:false,frame:photos[i]});
        await source.add(i/fps,1/fps,{keyFrame:i===0});progress((i+1)/photos.length);
      }
      source.close();await output.finalize();checkCancel();
      download(new Blob([output.target.buffer],{type:'video/mp4'}),'timelapse.mp4');
      notice(`MP4 saved · ${w} × ${h} · ${number.format(fps)} FPS · ${number.format(photos.length/fps)} s.`);
    } catch(e){try{await output.cancel();}catch{}throw e;}
  });
}

for(const id of ['add','empty-add'])$(id).onclick=()=>{if(!busy)$('files').click();};
for(const id of ['examples','empty-examples'])$(id).onclick=examples;
$('files').onchange=e=>{const files=[...e.target.files];e.target.value='';job(()=>importPhotos(files));};
$('align').onclick=()=>job(alignPhotos,{keepAnchors:anchorEditing});
$('cancel').onclick=()=>{cancelled=true;resetWorker();notice('Cancelling…');};
$('export-video').onclick=exportVideo;$('export-collage').onclick=exportCollage;
$('previous').onclick=()=>step(-1);$('next').onclick=()=>step(1);
$('compare').onchange=e=>{settings.compare=e.target.checked;draw();save();};
document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
  if(button.dataset.mode==='video')startPlayback();
  else {stop();settings.mode=button.dataset.mode;refresh();}
  save();
});
$('play').onclick=()=>{
  if(playing){stop();save();return;}
  startPlayback();
};
const settingBindings={'align-enabled':'align','crop':'crop','auto-exposure':'autoExposure','reverse-strips':'reverseStrips'};
for(const [id,key]of Object.entries(settingBindings))$(id).onchange=async e=>{settings[key]=e.target.checked;if(key==='crop'&&!settings.crop)cropEditing=false;refresh();await save();if(key==='autoExposure'&&settings.autoExposure)await job(updateExposure);};
$('edit-crop').onclick=()=>{
  if(busy||!photos.length)return;
  stop();anchorEditing=false;anchorDrawMode=false;cropEditing=!cropEditing;
  if(cropEditing){settings.crop=true;notice('Drag inside the crop box to move it. Drag a corner or reduce Crop size to make room.');}
  refresh();save();
};
$('reset-crop').onclick=()=>{if(busy||!photos.length)return;settings.crop=true;settings.manualCrop=null;refresh();save();};
$('crop-size').oninput=e=>{
  if(busy||!photos.length)return;
  stop();const crop=cropRect(),w=Number(e.target.value)/100,h=w*ratio();
  if(!cropEditing){anchorEditing=false;anchorDrawMode=false;cropEditing=true;refresh();}
  setCustomCrop({x:crop.x+(crop.w-w)/2,y:crop.y+(crop.h-h)/2,w,h});
};
$('crop-frame').addEventListener('pointerdown',e=>{
  if(busy||!cropEditing||e.button!==0)return;
  e.preventDefault();e.stopPropagation();
  cropDrag={id:e.pointerId,x:e.clientX,y:e.clientY,crop:cropRect(),corner:e.target.closest('[data-corner]')?.dataset.corner};
  $('crop-frame').setPointerCapture(e.pointerId);$('crop-frame').focus({preventScroll:true});
});
$('crop-frame').addEventListener('pointermove',e=>{
  if(!cropDrag||cropDrag.id!==e.pointerId)return;
  const rect=canvas.getBoundingClientRect(),view=cropEditView(),dx=(e.clientX-cropDrag.x)/rect.width*view.w,dy=(e.clientY-cropDrag.y)/rect.height*view.h;
  setCustomCrop(cropDrag.corner?resizeCrop(cropDrag.crop,cropDrag.corner,dx,dy,ratio()):moveCrop(cropDrag.crop,dx,dy,ratio()),false);
});
function finishCropDrag(e){
  if(!cropDrag||cropDrag.id!==e.pointerId)return;
  cropDrag=null;if($('crop-frame').hasPointerCapture(e.pointerId))$('crop-frame').releasePointerCapture(e.pointerId);save();
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('crop-frame').addEventListener(event,finishCropDrag);
$('crop-frame').addEventListener('keydown',e=>{
  if(busy||!cropEditing||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();
  const distance=(e.shiftKey?10:1)/reference().width,dx=e.key==='ArrowLeft'?-distance:e.key==='ArrowRight'?distance:0,dy=e.key==='ArrowUp'?-distance:e.key==='ArrowDown'?distance:0;
  const corner=e.target.closest('[data-corner]')?.dataset.corner;
  setCustomCrop(corner?resizeCrop(cropRect(),corner,dx,dy,ratio()):moveCrop(cropRect(),dx,dy,ratio()));
});
new ResizeObserver(()=>{positionCropOverlay();positionAnchorOverlay();}).observe($('stage'));
$('edit-anchors').onclick=()=>{
  if(busy||!photos.length)return;
  stop();cropEditing=false;anchorEditing=!anchorEditing;anchorDrawMode=false;refresh();
  if(anchorEditing)job(detectReferencePoints,{keepAnchors:true});
};
$('add-anchor').onclick=()=>{anchorDrawMode=!anchorDrawMode;syncAnchorControls();notice(anchorDrawMode?'Drag on the reference photo to draw a new alignment region.':'Drag a highlighted region to move it, or drag a corner to resize.');};
$('reset-anchors').onclick=()=>{settings.anchorRegions=null;activeAnchor=null;changedAnchors();job(detectReferencePoints,{keepAnchors:true});};
$('remove-anchor').onclick=()=>{
  if(busy||!activeAnchor)return;
  settings.anchorRegions=anchorRegions().filter(r=>r.id!==activeAnchor);activeAnchor=null;changedAnchors();job(detectReferencePoints,{keepAnchors:true});
};
$('show-anchor-points').onchange=e=>{settings.showAnchorPoints=e.target.checked;draw();save();};
$('anchor-overlay').addEventListener('pointerdown',e=>{
  if(busy||!anchorEditing||e.button!==0)return;
  e.preventDefault();e.stopPropagation();const box=e.target.closest('.anchor-box'),regions=anchorRegions();
  const region=box?regions.find(r=>r.id===box.dataset.anchor):null;
  anchorDrag={pointer:e.pointerId,start:anchorPointer(e),regions,region,corner:e.target.closest('[data-corner]')?.dataset.corner,draw:anchorDrawMode||!region,newId:crypto.randomUUID()};
  if(!anchorDrag.draw){activeAnchor=region.id;syncAnchorControls();box.focus({preventScroll:true});}
  $('anchor-overlay').setPointerCapture(e.pointerId);
});
$('anchor-overlay').addEventListener('pointermove',e=>{
  if(!anchorDrag||anchorDrag.pointer!==e.pointerId)return;
  const end=anchorPointer(e),dx=end[0]-anchorDrag.start[0],dy=end[1]-anchorDrag.start[1];
  if(anchorDrag.draw){anchorDraft=regionFromDrag(anchorDrag.newId,anchorDrag.start,end,ratio());positionAnchorOverlay();}
  else {
    const updated=anchorDrag.corner?resizeRegion(anchorDrag.region,anchorDrag.corner,dx,dy,ratio()):moveRegion(anchorDrag.region,dx,dy,ratio());
    settings.anchorRegions=anchorDrag.regions.map(r=>r.id===updated.id?updated:r);changedAnchors(false);
  }
});
function finishAnchorDrag(e){
  if(!anchorDrag||anchorDrag.pointer!==e.pointerId)return;
  const drag=anchorDrag;anchorDrag=null;
  if(drag.draw&&anchorDraft&&e.type!=='pointercancel'){
    settings.anchorRegions=[...(settings.anchorRegions===null?[]:anchorRegions()),anchorDraft];activeAnchor=anchorDraft.id;anchorDrawMode=false;changedAnchors(false);
  }
  anchorDraft=null;
  if($('anchor-overlay').hasPointerCapture(e.pointerId))$('anchor-overlay').releasePointerCapture(e.pointerId);
  syncAnchorControls();save();job(detectReferencePoints,{keepAnchors:true});
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('anchor-overlay').addEventListener(event,finishAnchorDrag);
$('anchor-overlay').addEventListener('keydown',e=>{
  if(busy||!anchorEditing)return;
  const box=e.target.closest('.anchor-box');if(!box)return;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Delete','Backspace'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();activeAnchor=box.dataset.anchor;
  if(e.key==='Delete'||e.key==='Backspace'){$('remove-anchor').click();return;}
  const region=anchorRegions().find(r=>r.id===activeAnchor),distance=(e.shiftKey?10:1)/reference().width;
  const dx=e.key==='ArrowLeft'?-distance:e.key==='ArrowRight'?distance:0,dy=e.key==='ArrowUp'?-distance:e.key==='ArrowDown'?distance:0,corner=e.target.closest('[data-corner]')?.dataset.corner;
  const updated=corner?resizeRegion(region,corner,dx,dy,ratio()):moveRegion(region,dx,dy,ratio());
  settings.anchorRegions=anchorRegions().map(r=>r.id===activeAnchor?updated:r);changedAnchors();job(detectReferencePoints,{keepAnchors:true});
});
$('exposure-strength').oninput=e=>{settings.strength=Number(e.target.value);$('exposure-strength-value').textContent=`${Math.round(settings.strength*100)}%`;syncSelected();draw();save();};
$('region').onchange=e=>{
  if(e.target.value==='custom'){settings.anchorRegions=anchorRegions();stop();cropEditing=false;anchorEditing=true;}
  else {settings.region=e.target.value;settings.anchorRegions=null;}
  changedAnchors();refresh();notice('Search regions changed. Click “Align frames” to apply them.');
  if(anchorEditing)job(detectReferencePoints,{keepAnchors:true});
};
$('fps').oninput=e=>{
  const fps=Number(e.target.value);if(!Number.isFinite(fps)||fps<.2||fps>60)return;
  settings.fps=fps;stop();$('duration').textContent=`${photos.length} frames · ${number.format(photos.length/fps)} s`;save();
};
$('fps').onchange=e=>{settings.fps=clamp(Number(e.target.value)||4,.2,60);stop();refresh();save();};
$('resolution').onchange=e=>{settings.resolution=e.target.value;refresh();save();};
$('direction').onchange=e=>{if(e.target.value==='custom'){$('angle-field').hidden=false;return;}settings.angle=Number(e.target.value);refresh();save();};
$('angle').oninput=e=>{settings.angle=Number(e.target.value);$('angle-value').textContent=`${settings.angle}°`;if(settings.mode==='strips')$('stage-badge').textContent=`${photos.length} stripes · ${settings.angle}°`;draw();save();};
const adjustmentBindings={'ev':'ev','contrast':'contrast','saturation':'saturation','shift-x':'x','shift-y':'y','rotation':'rotation','scale':'scale'};
for(const [id,key]of Object.entries(adjustmentBindings))$(id).addEventListener('input',e=>{
  const p=current();if(!p||busy)return;const value=Number(e.target.value);if(e.target.value===''||!Number.isFinite(value))return;
  p.adjust[key]=clamp(value,Number(e.target.min),Number(e.target.max));
  $('ev-value').textContent=`${p.adjust.ev>0?'+':''}${number.format(p.adjust.ev)} EV`;$('contrast-value').textContent=`${Math.round(p.adjust.contrast*100)}%`;$('saturation-value').textContent=`${Math.round(p.adjust.saturation*100)}%`;
  draw();save();
});
$('reset-frame').onclick=()=>{if(current()){current().adjust=adjustments();refresh();save();}};
$('make-reference').onclick=()=>job(async()=>{
  settings.reference=current().id;for(const p of photos){p.matrix=identity();p.autoEv=0;p.status='pending';p.quality=null;}prepared=false;await alignPhotos();
});
function reorder(fn){if(busy||!photos.length)return;stop();fn();refresh();save();}
$('sort').onclick=()=>reorder(()=>photos.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})));
$('reverse').onclick=()=>reorder(()=>photos.reverse());
function move(offset){reorder(()=>{const index=photos.indexOf(current()),dest=index+offset;if(dest>=0&&dest<photos.length)[photos[index],photos[dest]]=[photos[dest],photos[index]];});}
$('move-left').onclick=()=>move(-1);$('move-right').onclick=()=>move(1);
async function removePhotos(list){
  const resume=playing,selectedIndex=photos.indexOf(current());
  stop();const ids=new Set(list.map(p=>p.id)),lostReference=ids.has(settings.reference);photos=photos.filter(p=>!ids.has(p.id));
  if(ids.has(settings.selected))settings.selected=photos[Math.min(selectedIndex,photos.length-1)]?.id||null;
  if(lostReference){settings.reference=photos[0]?.id||null;for(const p of photos){p.matrix=identity();p.autoEv=0;p.status='pending';p.quality=null;}notice(photos.length?'Reference frame removed. Align the sequence using the new reference.':'Add photos or load the examples to get started.');}
  prepared=false;
  if(!photos.length){cropEditing=false;anchorEditing=false;anchorDrawMode=false;settings.manualCrop=null;referencePoints=[];referencePointStamp=null;}
  if(resume&&photos.length)startPlayback();else refresh();
  await save();
  for(const p of list){p.image.close();URL.revokeObjectURL(p.thumbUrl);if(db)await transaction('photos','readwrite',s=>s.delete(p.id));}
}
$('remove').onclick=()=>{if(current()&&!busy)removePhotos([current()]);};
$('clear').onclick=()=>{if(!busy&&photos.length&&confirm('Remove all frames from this project? Original files on your computer will be kept.'))removePhotos([...photos]);};
let dragDepth=0;
document.addEventListener('dragenter',e=>{if([...e.dataTransfer.types].includes('Files')&&!busy){e.preventDefault();dragDepth++;$('drop-overlay').hidden=false;}});
document.addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;$('drop-overlay').hidden=true;}});
document.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files'))e.preventDefault();});
document.addEventListener('drop',e=>{if(e.dataTransfer.files.length){e.preventDefault();dragDepth=0;$('drop-overlay').hidden=true;if(!busy)job(()=>importPhotos([...e.dataTransfer.files]));}});
document.addEventListener('keydown',e=>{if(e.target.closest('input,select,button,summary')||busy)return;if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.code==='Space'&&photos.length){e.preventDefault();$('play').click();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();save();}});
await restore();
