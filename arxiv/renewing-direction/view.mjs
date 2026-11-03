function field(view){const r=view.rect();return {x:r.x,y:r.y+24,w:r.w,h:r.h-42};}
export function point(view,x,y){const r=field(view);return{x:(x-r.x)/r.w,y:(y-r.y)/r.h,inside:x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h};}
export function draw(view,m){
  const {ctx}=view,r=field(view),Y=id=>r.y+(id+.5)/m.n*r.h,X=x=>r.x+x/m.length*r.w;
  ctx.save();ctx.strokeStyle='#294044';ctx.lineWidth=.7;ctx.setLineDash([2,5]);
  for(const site of m.sites){ctx.beginPath();ctx.moveTo(X(site),r.y);ctx.lineTo(X(site),r.y+r.h);ctx.stroke();}ctx.setLineDash([]);
  for(const f of m.filaments){
    const y=Y(f.id),minus=X(f.minus),plus=X(f.plus),color=f.original?'#d6d7c7':f.dir>0?'#dfaa79':'#7daabf';
    ctx.strokeStyle=color;ctx.globalAlpha=f.pg?.85:.45;ctx.lineWidth=Math.max(1.3,Math.min(2.5,r.h/m.n*.38));
    ctx.beginPath();ctx.moveTo(minus,y);ctx.lineTo(plus,y);ctx.stroke();
    const s=Math.min(4,Math.abs(plus-minus)*.4);ctx.globalAlpha=f.pg?1:.5;ctx.beginPath();ctx.moveTo(plus-f.dir*s,y-s*.65);ctx.lineTo(plus,y);ctx.lineTo(plus-f.dir*s,y+s*.65);ctx.stroke();
    ctx.globalAlpha=.65;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(minus,y-2);ctx.lineTo(minus,y+2);ctx.stroke();
  }
  ctx.restore();ctx.fillStyle='#899d9d';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText('SAME BUNDLE · EACH ROW IS ONE FILAMENT',r.x,r.y-10);
  ctx.fillText('0',r.x,r.y+r.h+17);ctx.textAlign='right';ctx.fillText('70 μm',r.x+r.w,r.y+r.h+17);ctx.textAlign='left';
}
