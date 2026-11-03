import test from 'node:test';
import assert from 'node:assert/strict';
import {identity,point} from './geometry.mjs';
import {defaultRegions,fitRegion,moveRegion,resizeRegion,regionFromDrag,inRegions,regionMask} from './anchors.mjs';

test('Automatic regions describe the actual lower-70-percent and whole-image masks',()=>{
  const r=4/3,[ground]=defaultRegions('ground',r),[all]=defaultRegions('all',r);
  assert.ok(Math.abs(ground.y/r-.3)<1e-12);assert.ok(Math.abs(ground.h/r-.7)<1e-12);
  assert.deepEqual(all,{id:'automatic',x:0,y:0,w:1,h:r});
  assert.equal(inRegions(.5,.2*r,[ground]),false);assert.equal(inRegions(.5,.8*r,[ground]),true);
});
test('Regions move and resize independently without leaving the reference image',()=>{
  const r=4/3,rect={id:'a',x:.2,y:.3,w:.4,h:.5};
  const moved=moveRegion(rect,100,-100,r);assert.equal(moved.x,.6);assert.equal(moved.y,0);assert.equal(moved.w,.4);assert.equal(moved.h,.5);
  for(const corner of ['nw','ne','sw','se'])for(const delta of [-100,100]){
    const result=resizeRegion(rect,corner,delta,delta,r);
    assert.ok(result.x>=0&&result.y>=0&&result.w>=.02-1e-12&&result.h>=.02*r-1e-12);
    assert.ok(result.x+result.w<=1+1e-12&&result.y+result.h<=r+1e-12);
    assert.ok(Math.abs((corner.includes('w')?result.x+result.w:result.x)-(corner.includes('w')?rect.x+rect.w:rect.x))<1e-12);
  }
  const wide=resizeRegion(rect,'se',.15,0,r);assert.ok(Math.abs(wide.w-.55)<1e-12);assert.equal(wide.h,.5);
  assert.equal(fitRegion({id:'b',x:2,y:2,w:.1,h:.1},1).x,.9);
});
test('Drawing works in every direction and ignores accidental clicks',()=>{
  const region=regionFromDrag('a',[.8,.9],[.2,.3],1);
  assert.ok(Math.abs(region.x-.2)<1e-12&&Math.abs(region.w-.6)<1e-12);
  assert.equal(regionFromDrag('a',[.2,.3],[.201,.301],1),null);
  assert.deepEqual(regionFromDrag('b',[-1,-1],[2,2],1),{id:'b',x:0,y:0,w:1,h:1});
});
test('Descriptor masks include only the selected areas, including after rotation and translation',()=>{
  const regions=[{x:.2,y:.3,w:.2,h:.2}];
  for(const matrix of [identity(),[1,0,0,1,.1,.05],[0,1,-1,0,1,0]]){
    const mask=regionMask(100,100,regions,matrix);
    assert.equal(mask.filter(v=>v).length,400);
    for(let y=0;y<100;y++)for(let x=0;x<100;x++){
      const [u,v]=point(matrix,(x+.5)/100,(y+.5)/100);
      assert.equal(!!mask[y*100+x],inRegions(u,v,regions));
    }
  }
});
test('Multiple areas form a union and an empty list cannot silently search the whole image',()=>{
  const regions=[{x:.1,y:.1,w:.2,h:.2},{x:.6,y:.6,w:.2,h:.2}];
  assert.equal(regionMask(100,100,regions).filter(v=>v).length,800);
  assert.equal(regionMask(100,100,[]).some(Boolean),false);
  assert.ok(regionMask(100,100,regions,identity(),.05).filter(v=>v).length>800);
  assert.equal(inRegions(.5,.5,regions),false);
});
