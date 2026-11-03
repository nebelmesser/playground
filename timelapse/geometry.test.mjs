import test from 'node:test';
import assert from 'node:assert/strict';
import {identity,point,fitSimilarity,commonArea,commonCrop,fitCrop,moveCrop,resizeCrop,frameMatrix,stripPolygon} from './geometry.mjs';

test('RANSAC recovers rotation, scale and translation with many false matches',()=>{
  const a=1.035*Math.cos(.027),b=1.035*Math.sin(.027),expected=[a,b,-b,a,23,-14];
  const matches=[];
  for(let y=0;y<8;y++)for(let x=0;x<10;x++){const px=40+x*73,py=80+y*65,[u,v]=point(expected,px,py);matches.push({x:px,y:py,u:u+Math.sin(x+y)*.2,v:v+Math.cos(x-y)*.2});}
  for(let i=0;i<100;i++)matches.push({x:i*31%900,y:i*73%700,u:i*53%900,v:i*19%700});
  const fit=fitSimilarity(matches);
  assert.ok(fit.inliers>=80);assert.ok(fit.error<.5);
  fit.matrix.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<.1));
});
test('Insufficient and degenerate matches cannot produce a transform',()=>{
  assert.equal(fitSimilarity([]),null);
  assert.equal(fitSimilarity(Array.from({length:20},()=>({x:10,y:10,u:20,v:20}))),null);
});
test('Common crop stays inside every rotated and translated source image',()=>{
  const r=4/3,m=frameMatrix({matrix:[1,0,0,1,.03,-.02],adjust:{x:0,y:0,rotation:2,scale:100}},r);
  const crop=commonCrop([identity(),m],r);assert.ok(crop.w>.8&&crop.w<1);
  for(const matrix of [identity(),m])for(const [x,y]of [[crop.x,crop.y],[crop.x+crop.w,crop.y],[crop.x,crop.y+crop.h],[crop.x+crop.w,crop.y+crop.h]]){
    const [a,b,c,d,tx,ty]=matrix,det=a*d-b*c,sx=(d*(x-tx)-c*(y-ty))/det,sy=(-b*(x-tx)+a*(y-ty))/det;
    assert.ok(sx>=-1e-8&&sx<=1+1e-8&&sy>=-1e-8&&sy<=r+1e-8);
  }
  assert.equal(commonCrop([[1,0,0,1,2,0]],r),null);
});
test('Strip directions cover correct horizontal and vertical bands',()=>{
  const vertical=stripPolygon(0,2,100,200,90),horizontal=stripPolygon(0,2,100,200,0);
  assert.ok(Math.abs(Math.max(...vertical.map(p=>p[0]))-50)<1e-8);
  assert.ok(Math.abs(Math.max(...horizontal.map(p=>p[1]))-100)<1e-8);
});

test('Moving the shared crop preserves its size and stops at the image bounds',()=>{
  const crop={x:.2,y:.3,w:.5,h:2/3};
  const shifted=moveCrop(crop,.1,-.1,4/3);
  assert.ok(Math.abs(shifted.x-.3)<1e-12);assert.ok(Math.abs(shifted.y-.2)<1e-12);
  assert.equal(shifted.w,crop.w);assert.equal(shifted.h,crop.h);
  assert.deepEqual(moveCrop(crop,100,-100,4/3),{x:.5,y:0,w:.5,h:2/3});
});
test('Shared coverage includes only areas covered by every aligned frame',()=>{
  const area=commonArea([identity(),[1,0,0,1,.1,-.2]],4/3);
  assert.equal(area.length,4);
  for(const [x,y]of area){assert.ok(x>=.1-1e-12&&x<=1+1e-12);assert.ok(y>=-1e-12&&y<=4/3-.2+1e-12);}
  assert.deepEqual(commonArea([[1,0,0,1,2,0]],4/3),[]);
});
test('Every crop handle preserves the opposite corner and the output aspect ratio',()=>{
  for(const ratio of [.75,1,4/3,2])for(const corner of ['nw','ne','sw','se']){
    const crop={x:.2,y:.2*ratio,w:.6,h:.6*ratio};
    const sx=corner.includes('w')?-1:1,sy=corner.includes('n')?-1:1;
    const resized=resizeCrop(crop,corner,-sx*.1,-sy*.1*ratio,ratio);
    assert.ok(Math.abs(resized.w-.5)<1e-12);assert.ok(Math.abs(resized.h/resized.w-ratio)<1e-12);
    assert.ok(Math.abs((sx<0?resized.x+resized.w:resized.x)-(sx<0?crop.x+crop.w:crop.x))<1e-12);
    assert.ok(Math.abs((sy<0?resized.y+resized.h:resized.y)-(sy<0?crop.y+crop.h:crop.y))<1e-12);
    for(const delta of [-100,100]){
      const bounded=resizeCrop(crop,corner,delta,delta,ratio);
      assert.ok(bounded.x>=-1e-12&&bounded.y>=-1e-12);
      assert.ok(bounded.x+bounded.w<=1+1e-12&&bounded.y+bounded.h<=ratio+1e-12);
      assert.ok(bounded.w>=.05-1e-12);
    }
  }
});
test('Restored crops adapt to reference dimensions and reject invalid values',()=>{
  const crop=fitCrop({x:.9,y:4,w:.4,h:.1},.75);
  assert.equal(crop.x,.6);assert.equal(crop.w,.4);
  assert.ok(Math.abs(crop.y-.45)<1e-12);assert.ok(Math.abs(crop.h-.3)<1e-12);
  assert.deepEqual(fitCrop({x:NaN,y:0,w:.4},4/3),{x:0,y:0,w:1,h:4/3});
});
