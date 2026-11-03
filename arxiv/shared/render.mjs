import { clamp, TAU } from './math.mjs';
const INK='#080d13', MUTED='#778391';
const copper=[233,166,111], blue=[86,143,185];
function mix(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t);}
function css(c){return `rgb(${c.map(Math.round).join(',')})`;}
function label(ctx,text,x,y,align='left'){ctx.fillStyle=MUTED;ctx.font='11px ui-monospace, monospace';ctx.textAlign=align;ctx.fillText(text,x,y);}
export class Renderer {
  constructor(canvas, custom = {}) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
    this.buffer=document.createElement('canvas');this.bctx=this.buffer.getContext('2d');
    this.history=[];this.lastTime=-1;this.custom=custom;
  }
  reset(){this.history=[];this.lastTime=-1;}
  record(m){
    if(m.kind==='surface'&&Math.round(m.time/.04)%3===0)this.addHistory(m.u.slice(),m.time);
  }
  resize(w,h){this.w=w;this.h=h;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);}
  rect(){const size=Math.max(100,Math.min(this.w-32,this.h-84));return{x:(this.w-size)/2,y:24+(this.h-84-size)/2,w:size,h:size};}
  point(x,y){if(this.custom.point)return this.custom.point(this,x,y);const r=this.rect();return {x:clamp((x-r.x)/r.w),y:clamp((y-r.y)/r.h),inside:x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h};}
  draw(model){
    const ctx=this.ctx;ctx.fillStyle=INK;ctx.fillRect(0,0,this.w,this.h);
    if(this.custom.draw)return this.custom.draw(this,model);
    if(model.kind==='surface')return this.surface(model);
    if(model.kind==='active'||model.kind==='flock')return this.particles(model);
    this.field(model);
  }
  image(w,h,paint,rect,smoothing=true){
    if(this.buffer.width!==w||this.buffer.height!==h){this.buffer.width=w;this.buffer.height=h;this.pixels=this.bctx.createImageData(w,h);}
    const data=this.pixels.data;
    for(let i=0;i<w*h;i++){const c=paint(i);data[4*i]=c[0];data[4*i+1]=c[1];data[4*i+2]=c[2];data[4*i+3]=255;}
    this.bctx.putImageData(this.pixels,0,0);this.ctx.imageSmoothingEnabled=smoothing;
    this.ctx.drawImage(this.buffer,rect.x,rect.y,rect.w,rect.h);
  }
  field(m){
    const r=this.rect();
    this.image(m.n,m.n,i=>{
      if(m.kind==='gray'){
        const t=clamp(m.v[i]*3.3),edge=clamp(Math.abs(m.u[i]-.55)*1.5);
        return mix([8,14,23],mix([93,117,125],[245,191,126],clamp(t*1.4-.4)),Math.sqrt(t)).map(v=>v*(.8+.2*edge));
      }
      if(m.kind==='cyclic'){
        const a=m.a[i],b=m.b[i],c=m.c[i];
        return [12+225*a+55*b+53*c,16+93*a+191*b+112*c,22+65*a+155*b+236*c].map(v=>clamp(v,0,255));
      }
    },r);
    label(this.ctx,'PERIODIC BOUNDARIES',r.x,r.y+r.h+19);
    label(this.ctx,`${m.n} × ${m.n}`,r.x+r.w,r.y+r.h+19,'right');
  }
  particles(m){
    const r=this.rect(),ctx=this.ctx;
    ctx.strokeStyle='#202c37';ctx.lineWidth=1;ctx.strokeRect(r.x,r.y,r.w,r.h);
    for(let i=0;i<m.n;i++){
      const x=r.x+m.x[i]*r.w,y=r.y+m.y[i]*r.h,a=m.angle[i];
      if(m.kind==='active'){
        const t=clamp(m.density[i]/9);ctx.fillStyle=css(mix(blue,copper,t));
        ctx.beginPath();ctx.arc(x,y,Math.max(2,r.w*.0037),0,TAU);ctx.fill();
        ctx.strokeStyle=ctx.fillStyle;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*r.w*.006,y+Math.sin(a)*r.h*.006);ctx.stroke();
      }else{
        const dx=Math.cos(a),dy=Math.sin(a),s=Math.max(2.6,r.w*.005);
        ctx.fillStyle=css(mix(blue,copper,(Math.cos(a)+1)/2));
        ctx.beginPath();ctx.moveTo(x+dx*s*1.6,y+dy*s*1.6);ctx.lineTo(x-dx*s-dy*s*.55,y-dy*s+dx*s*.55);ctx.lineTo(x-dx*s+dy*s*.55,y-dy*s-dx*s*.55);ctx.closePath();ctx.fill();
      }
    }
    label(ctx,'RIGHT EXIT = LEFT ENTRY',r.x,r.y+r.h+19);
  }
  addHistory(row,time,max=240){if(time!==this.lastTime){this.history.unshift(row);if(this.history.length>max)this.history.pop();this.lastTime=time;}}
  surface(m){
    const ctx=this.ctx,pad=34,w=this.w-2*pad,top=48,hh=Math.max(80,this.h*.2),L=m.params.length;
    ctx.strokeStyle='#253341';ctx.beginPath();ctx.moveTo(pad,top+hh/2);ctx.lineTo(pad+w,top+hh/2);ctx.stroke();
    ctx.strokeStyle='#d1c5ad';ctx.lineWidth=1.4;ctx.beginPath();
    for(let i=0;i<m.n;i++){const x=pad+i/(m.n-1)*w,y=top+hh/2-clamp(m.u[i],-4,4)*hh/8;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();
    label(ctx,'u(x) · SLOPE',pad,24);label(ctx,'+4',5,top+8);label(ctx,'−4',5,top+hh);label(ctx,'0',pad,top+hh+17);label(ctx,`x = ${L}`,pad+w,top+hh+17,'right');
    const y0=top+hh+48;
    this.image(m.n,240,i=>{const row=Math.floor(i/m.n),v=this.history[row]?.[i%m.n]||0;return mix([11,18,26],v<0?blue:copper,clamp(Math.abs(v)/3));},{x:pad,y:y0,w,h:Math.max(20,this.h-y0-35)});
    label(ctx,'SPACE → · TIME ↓ · Δt = 0.12',pad,y0-12);
  }
}
