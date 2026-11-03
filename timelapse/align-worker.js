let runtime;
async function opencv() {
  if (!runtime) runtime=new Promise((resolve,reject)=>{
    try {
      importScripts('./vendor/opencv.js');
      const ready=()=>{ delete self.cv.then; resolve(self.cv); };
      if(self.cv.Mat)ready();else self.cv.onRuntimeInitialized=ready;
    } catch(e) {reject(e);}
  });
  return runtime;
}
let features=new Map();
let cvModule;
let anchorHelpers;
function release() { for(const f of features.values())f.desc.delete();features.clear(); }
function extract(cv, image, maskData) {
  const mat=cv.matFromImageData(image), gray=new cv.Mat(), equalized=new cv.Mat(), mask=new cv.Mat(image.height,image.width,cv.CV_8UC1,new cv.Scalar(0));
  const keypoints=new cv.KeyPointVector(), desc=new cv.Mat(), orb=new cv.ORB(3200);
  try {
    cv.cvtColor(mat,gray,cv.COLOR_RGBA2GRAY);
    cv.equalizeHist(gray,equalized);
    mask.data.set(maskData);
    orb.detectAndCompute(equalized,mask,keypoints,desc);
    const points=[];
    for(let i=0;i<keypoints.size();i++){const p=keypoints.get(i).pt;points.push({x:p.x,y:p.y});}
    return {points,desc,gray:new Uint8Array(gray.data),width:image.width,height:image.height};
  } catch(e) {desc.delete();throw e;} finally {mat.delete();gray.delete();equalized.delete();mask.delete();keypoints.delete();orb.delete();}
}
function matches(cv, source, target) {
  if(source.desc.rows<2||target.desc.rows<2)return [];
  const matcher=new cv.BFMatcher(cv.NORM_HAMMING,false), pairs=new cv.DMatchVectorVector(), result=[];
  try {
    matcher.knnMatch(source.desc,target.desc,pairs,2);
    for(let i=0;i<pairs.size();i++) {
      const pair=pairs.get(i);
      try {if(pair.size()<2)continue;const a=pair.get(0),b=pair.get(1);if(a.distance<.76*b.distance&&a.distance<68){const p=source.points[a.queryIdx],q=target.points[a.trainIdx];result.push({x:p.x,y:p.y,u:q.x,v:q.y,dist:a.distance});}}finally{pair.delete();}
    }
    // Repeated textures must not vote multiple times for the same destination.
    const used=new Set();
    return result.sort((a,b)=>a.dist-b.dist).filter(p=>{const k=`${p.u},${p.v}`;if(used.has(k))return false;used.add(k);return true;});
  } finally {pairs.delete();matcher.delete();}
}
function regionTarget(cv,target,matrix,regions){
  const indices=[];
  for(let i=0;i<target.points.length;i++){
    const p=target.points[i],x=p.x/target.width,y=p.y/target.width;
    if(anchorHelpers.inRegions(matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5],regions))indices.push(i);
  }
  const desc=indices.length?new cv.Mat(indices.length,target.desc.cols,target.desc.type()):new cv.Mat();
  for(let i=0;i<indices.length;i++)desc.data.set(target.desc.data.subarray(indices[i]*target.desc.cols,(indices[i]+1)*target.desc.cols),i*target.desc.cols);
  return {...target,desc,points:indices.map(i=>target.points[i])};
}
function exposure(source,target,matrix,region) {
  const [a,b,c,d,tx,ty]=matrix, det=a*d-b*c, values=[];
  if(Math.abs(det)<.01)return 0;
  for(let y=Math.floor(target.height*(region==='ground'?.34:.08));y<target.height*.93;y+=9)for(let x=target.width*.07;x<target.width*.93;x+=9){
    const sx=Math.round((d*(x-tx)-c*(y-ty))/det), sy=Math.round((-b*(x-tx)+a*(y-ty))/det);
    if(sx<2||sy<2||sx>=source.width-2||sy>=source.height-2)continue;
    const s=source.gray[sy*source.width+sx],t=target.gray[Math.round(y)*target.width+Math.round(x)];
    if(s>16&&s<239&&t>16&&t<239)values.push(Math.log2(t/s));
  }
  values.sort((a,b)=>a-b);
  return values.length ? Math.max(-2,Math.min(2,values[Math.floor(values.length/2)])) : 0;
}
self.onmessage=async({data})=>{
  try {
    if(data.type==='clear'){release();return;}
    cvModule ||= await opencv();
    anchorHelpers ||= await import('./anchors.mjs');
    if(data.type==='features') {
      if(features.has(data.id))features.get(data.id).desc.delete();
      const mask=anchorHelpers.regionMask(data.image.width,data.image.height,data.regions,data.matrix,data.margin);
      let f=extract(cvModule,data.image,mask);
      if(data.margin===0){const filtered=regionTarget(cvModule,f,data.matrix,data.regions);f.desc.delete();f=filtered;}
      features.set(data.id,f);
      self.postMessage({id:data.request,ok:true,points:f.points.length,positions:f.points.map(p=>[p.x/f.width,p.y/f.width])});
    } else if(data.type==='match') {
      const {fitSimilarity,multiply,point}=await import('./geometry.mjs');
      const source=features.get(data.source), ref=features.get(data.reference);let best=null;
      for(const candidate of data.candidates){
        const target=regionTarget(cvModule,features.get(candidate.id),candidate.matrix,data.regions);
        let fit;
        try{fit=fitSimilarity(matches(cvModule,source,target));}finally{target.desc.delete();}
        if(!fit||fit.inliers<9||fit.spread<source.width*(data.custom?.05:.17)||fit.inliers/fit.matches<.14)continue;
        const score=fit.inliers*Math.min(1,fit.spread/source.width)/(1+fit.error*.2)*(candidate.id===data.reference?1.15:1);
        if(!best||score>best.score){
          const {inlierMatches,...quality}=fit,local=fit.matrix.slice();local[4]/=source.width;local[5]/=source.width;
          best={...quality,matrix:multiply(candidate.matrix,local),anchors:inlierMatches.map(p=>point(candidate.matrix,p.u/source.width,p.v/source.width)),via:candidate.id,score};
        }
      }
      const matrix=best?.matrix||[1,0,0,1,0,0], pixel=matrix.slice();pixel[4]*=source.width;pixel[5]*=source.width;
      self.postMessage({id:data.request,ok:true,result:best,ev:exposure(source,ref,pixel,data.region)});
    } else if(data.type==='exposure') {
      const source=features.get(data.source),ref=features.get(data.reference),pixel=data.matrix.slice();pixel[4]*=source.width;pixel[5]*=source.width;
      self.postMessage({id:data.request,ok:true,ev:exposure(source,ref,pixel,data.region)});
    }
  } catch(e) {self.postMessage({id:data.request,ok:false,error:e.message||String(e)});}
};
