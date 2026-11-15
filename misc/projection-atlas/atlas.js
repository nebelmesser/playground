import { COAST_RINGS } from './coastlines.mjs';
import { getSegment, getCaptionState, getMorphLimit } from './timeline.mjs';
import { DEFAULT_SETTINGS, readSettings, writeSettings } from './settings.mjs';
const DEFAULT_MASK_URL = new URL('./land-mask.png', import.meta.url).href;

/*--- projections.js ---*/
/*
 * PROJECTION REGISTRY
 * To add another projection, add one object to this array. Each object owns:
 *   id            stable programmatic name
 *   title, defect Russian/English explanatory captions
 *   project(lon,lat)  radians -> [x,y], both unitless, y increasing north
 *   glsl           the same calculation in GLSL for fast GPU morphs
 *   visibility     optional hidden-hemisphere / polar clipping rules
 *   glslVisibility optional equivalent GLSL visibility expression
 * The renderer, animation sequence, settings and video export read this registry.
 */
const PI = Math.PI;
const RAD = PI / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const ROBINSON_X = [1,.9986,.9954,.99,.9822,.973,.96,.9427,.9216,.8962,.8679,.835,.7986,.7597,.7186,.6732,.6213,.5722,.5322];
const ROBINSON_Y = [0,.062,.124,.186,.248,.31,.372,.434,.4958,.5571,.6176,.6769,.7346,.7903,.8435,.8936,.9394,.9761,1];
function robinsonLookup(values, lat) {
  const i = clamp(Math.floor(Math.abs(lat) / RAD / 5), 0, 17);
  return values[i] + (values[i + 1] - values[i]) * clamp((Math.abs(lat) / RAD - i * 5) / 5, 0, 1);
}
const robinsonGLSL = [
  ['robinsonX', ROBINSON_X], ['robinsonY', ROBINSON_Y]
].map(([name, vals]) => `float ${name}(int i) {\n` +
   vals.slice(0, -1).map((v, i) => `  if (i == ${i}) return ${v.toFixed(7)};`).join('\n') +
   `\n  return ${vals.at(-1).toFixed(7)};\n}`).join('\n');

const LAMBDA0 = 15 * RAD;
const PHI0 = 20 * RAD;
function azimuthalCore(lam, phi) {
  const dlam = lam - LAMBDA0;
  const cp = Math.cos(phi);
  const c = clamp(Math.sin(PHI0) * Math.sin(phi) + Math.cos(PHI0) * cp * Math.cos(dlam), -1, 1);
  const x = cp * Math.sin(dlam);
  const y = Math.cos(PHI0) * Math.sin(phi) - Math.sin(PHI0) * cp * Math.cos(dlam);
  return { x, y, cosc: c };
}
function mollTheta(phi) {
  const target = PI * Math.sin(phi);
  if (Math.abs(Math.abs(phi) - PI / 2) < 1e-9) return Math.sign(phi) * PI / 2;
  let t = phi;
  for (let i = 0; i < 7; i++) {
    const f = 2 * t + Math.sin(2 * t) - target;
    const df = 2 + 2 * Math.cos(2 * t);
    t = clamp(t - f / Math.max(0.001, df), -PI / 2, PI / 2);
  }
  return t;
}
const E1 = 1.340264, E2 = -0.081106, E3 = 0.000893, E4 = 0.003796;
function equalEarth(lam, phi) {
  const t = Math.asin(Math.sqrt(3) / 2 * Math.sin(phi));
  const t2 = t * t, t6 = t2 * t2 * t2;
  return [2 * Math.sqrt(3) * lam * Math.cos(t) /
    (3 * (E1 + 3 * E2 * t2 + 7 * E3 * t6 + 9 * E4 * t6 * t2)),
    E1 * t + E2 * t * t2 + E3 * t * t6 + E4 * t * t6 * t2];
}

const PROJECTIONS = [
  {
    id: 'equirectangular', title: {ru:'Равнопромежуточная', en:'Equirectangular'},
    defect: {ru:'Площади и формы растягиваются к полюсам. Точные расстояния — только вдоль меридианов и экватора.',
      en:'Area and shape distort increasingly toward the poles. Distances are true only along meridians and the equator.'},
    short: {ru:'Постоянный шаг по широте и долготе', en:'Uniform longitude and latitude spacing'},
    project: (lam,phi) => [lam, phi],
    glsl: 'vec2 proj_equirectangular(float lon, float lat) { return vec2(lon, lat); }',
  },
  {
    id: 'mercator', title: {ru:'Меркатора', en:'Mercator'},
    defect: {ru:'Сильно увеличивает площади у полюсов. Сами полюса показать невозможно.',
      en:'Greatly exaggerates areas near the poles. The poles themselves cannot be shown.'},
    short: {ru:'Сохраняет локальные углы', en:'Preserves local angles'},
    project: (lam,phi) => [lam, Math.log(Math.tan(PI/4 + clamp(phi,-85*RAD,85*RAD)/2))],
    // Polar rows collapse geometrically at 85°; fading them creates a stripe
    // while another projection still gives those rows a nonzero height.
    glsl: 'vec2 proj_mercator(float lon, float lat) { return vec2(lon, log(tan(PI / 4.0 + clamp(lat, -85.0 * DEG, 85.0 * DEG) / 2.0))); }',
  },
  {
    id: 'robinson', title: {ru:'Робинсона', en:'Robinson'},
    defect: {ru:'Компромиссная карта: искажает площади, углы и расстояния, зато распределяет искажения плавнее.',
      en:'A compromise: area, angles and distances all distort, but the distortions are spread more gently.'},
    short: {ru:'Компромисс для обзорной карты', en:'A compromise for a general world map'},
    project: (lam,phi) => [0.8487*lam*robinsonLookup(ROBINSON_X,phi),
      Math.sign(phi)*1.3523*robinsonLookup(ROBINSON_Y,phi)],
    glsl: `${robinsonGLSL}\nvec2 proj_robinson(float lon, float lat) {
      float v = abs(lat) / DEG / 5.0;
      int i = int(clamp(floor(v), 0.0, 17.0));
      float t = clamp(v - float(i), 0.0, 1.0);
      float x = mix(robinsonX(i), robinsonX(i+1), t);
      float y = mix(robinsonY(i), robinsonY(i+1), t);
      return vec2(0.8487 * lon * x, sign(lat) * 1.3523 * y);
    }`
  },
  {
    id: 'mollweide', title: {ru:'Мольвейде', en:'Mollweide'},
    defect: {ru:'Площади сохраняются, но формы и углы заметно искажаются, особенно ближе к краям.',
      en:'Area is preserved, while shapes and angles deform noticeably, especially near the edges.'},
    short: {ru:'Равновеликая эллиптическая карта', en:'Equal-area elliptical world map'},
    project: (lam,phi) => { const t=mollTheta(phi); return [2*Math.SQRT2/PI*lam*Math.cos(t),Math.SQRT2*Math.sin(t)]; },
    glsl: `vec2 proj_mollweide(float lon, float lat) {
      float theta = lat;
      for (int i = 0; i < 8; i++) {
        float delta = (2.0*theta+sin(2.0*theta)-PI*sin(lat)) / max(0.001,2.0+2.0*cos(2.0*theta));
        theta = clamp(theta-delta, -PI/2.0, PI/2.0);
      }
      return vec2(2.0*1.41421356237/PI*lon*cos(theta),1.41421356237*sin(theta));
    }`,
    shape:'ellipse'
  },
  {
    id: 'equalearth', title: {ru:'Equal Earth', en:'Equal Earth'},
    defect: {ru:'Площади правильные, но направления, формы и расстояния искажаются; особенно заметно у краёв.',
      en:'Areas are accurate, but angles, shapes and distances distort, particularly near the edges.'},
    short: {ru:'Современная равновеликая карта', en:'A modern equal-area world map'},
    project: equalEarth,
    glsl: `vec2 proj_equalearth(float lon, float lat) {
      float t=asin(0.86602540378*sin(lat));
      float t2=t*t, t6=t2*t2*t2;
      float den=1.340264+3.0*(-0.081106)*t2+7.0*0.000893*t6+9.0*0.003796*t6*t2;
      return vec2(2.0*1.73205080757*lon*cos(t)/(3.0*den),
        1.340264*t-0.081106*t*t2+0.000893*t*t6+0.003796*t*t6*t2);
    }`
  },
  {
    id: 'lambert', title: {ru:'Азимутальная Ламберта', en:'Lambert azimuthal'},
    defect: {ru:'Сохраняет площади, но формы сильно искажаются вдали от центра. Антипод растягивается в окружность.',
      en:'Preserves area, but shapes distort far from the center. The antipode spreads around the outer circle.'},
    short: {ru:'Равновеликая, центр — 15° в.д., 20° с.ш.', en:'Equal-area, centered at 15°E, 20°N'},
    project: (lam,phi) => { const {x,y,cosc}=azimuthalCore(lam,phi);
      const k=Math.sqrt(Math.max(0,2*(1-cosc)))/Math.max(0.0000001,Math.hypot(x,y));
      return [x*k,y*k]; },
    glsl: `vec2 proj_lambert(float lon, float lat) {
      float dlon=lon-15.0*DEG;
      float cosc=clamp(sin(20.0*DEG)*sin(lat)+cos(20.0*DEG)*cos(lat)*cos(dlon),-1.0,1.0);
      vec2 u=vec2(cos(lat)*sin(dlon),cos(20.0*DEG)*sin(lat)-sin(20.0*DEG)*cos(lat)*cos(dlon));
      return u*(sqrt(max(0.0,2.0*(1.0-cosc)))/max(0.0000001,length(u)));
    }`,
    shape:'disk'
  },
  {
    id: 'orthographic', title: {ru:'Ортографическая', en:'Orthographic'},
    defect: {ru:'Видно только одно полушарие. Площади и расстояния сжимаются к краю диска.',
      en:'Only one hemisphere is visible. Areas and distances become compressed near the rim.'},
    short: {ru:'Вид на планету издалека', en:'The planet as seen from far away'},
    project: (lam,phi) => {const {x,y}=azimuthalCore(lam,phi);return [x,y];},
    visibility: (lam,phi) => azimuthalCore(lam,phi).cosc >= 0 ? 1 : 0,
    glsl: `vec2 proj_orthographic(float lon, float lat) {
      float dlon=lon-15.0*DEG;
      return vec2(cos(lat)*sin(dlon),cos(20.0*DEG)*sin(lat)-sin(20.0*DEG)*cos(lat)*cos(dlon));
    }`,
    glslVisibility: `float dlon=lon-15.0*DEG;
      float cosc=sin(20.0*DEG)*sin(lat)+cos(20.0*DEG)*cos(lat)*cos(dlon);
      return smoothstep(-0.003,0.003,cosc);`,
    shape:'globe'
  },
];

const PROJECTION_BY_ID = Object.fromEntries(PROJECTIONS.map((p,i)=>{
  p.index = i;
  return [p.id,p];
}));

function fitProjection(p) {
  let maxX = 0, maxY = 0;
  // We fit around the geographical (0,0) display coordinate; all current
  // projections have a symmetric world outline about their central axis.
  for (let lat=-90;lat<=90;lat+=2) {
    for (let lon=-180;lon<=180;lon+=3) {
      const [x,y]=p.project(lon*RAD,lat*RAD);
      if(Number.isFinite(x) && Number.isFinite(y)) {
        maxX=Math.max(maxX,Math.abs(x));
        maxY=Math.max(maxY,Math.abs(y));
      }
    }
  }
  return {
    scale:Math.min(1610/(2*maxX),1030/(2*maxY))*.965,
    fullScale:Math.min(1920/(2*maxX),1920/(2*maxY))*.98
  };
}
for (const p of PROJECTIONS) Object.assign(p,fitProjection(p));

/*--- renderer.js ---*/
/* WebGL geographic mesh + 2D typography/grid compositing. No third-party JS. */
class ProjectionRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha:false, desynchronized:false });
    this.glCanvas = document.createElement('canvas');
    this.gl = this.glCanvas.getContext('webgl', {
      alpha:true, antialias:true, preserveDrawingBuffer:true,
      premultipliedAlpha:true, depth:false, stencil:false
    });
    this.cpuMode = !this.gl;
    this.size = 960;
    this.landSource = 'fallback';
    if (this.gl) this.prepareGL();
    this.resize(this.size);
  }
  createShader(type, source) {
    const gl=this.gl, shader=gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
      throw new Error('WebGL shader: ' + gl.getShaderInfoLog(shader) + '\n' + source);
    }
    return shader;
  }
  prepareGL() {
    const gl=this.gl;
    const projectionFns=PROJECTIONS.map(p=>p.glsl).join('\n');
    const projectionSwitch=PROJECTIONS.map(p=>`  if (id == ${p.index}) return proj_${p.id}(lon,lat);`).join('\n');
    const visibilitySwitch=PROJECTIONS.map(p=>p.glslVisibility?
      `  if (id == ${p.index}) { ${p.glslVisibility} }`:'').join('\n');
    const vs=`
      precision highp float;
      const float PI=3.141592653589793;
      const float DEG=0.017453292519943295;
      attribute vec2 aLonLat;
      attribute vec2 aUV;
      uniform int uFrom, uTo;
      uniform float uT, uScaleFrom, uScaleTo, uSize;
      uniform vec2 uCenter;
      varying highp vec2 vUV;
      varying highp float vVisibility;
      ${projectionFns}
      vec2 projectById(int id, float lon, float lat) {
        ${projectionSwitch}
        return vec2(lon,lat);
      }
      float visibleById(int id,float lon,float lat) {
        ${visibilitySwitch}
        return 1.0;
      }
      void main(){
        float lon=aLonLat.x, lat=aLonLat.y;
        vec2 p0=projectById(uFrom,lon,lat);
        vec2 p1=projectById(uTo,lon,lat);
        vec2 xy=mix(p0*uScaleFrom,p1*uScaleTo,uT);
        vec2 px=uCenter+vec2(xy.x,-xy.y);
        gl_Position=vec4(px.x*2.0/uSize-1.0,1.0-px.y*2.0/uSize,0.0,1.0);
        vUV=aUV;
        vVisibility=mix(visibleById(uFrom,lon,lat),visibleById(uTo,lon,lat),uT);
      }
    `;
    const fs=`
      precision mediump float;
      varying highp vec2 vUV;
      varying highp float vVisibility;
      uniform sampler2D uLand;
      uniform vec3 uColor;
      void main(){
        float coverage=texture2D(uLand,vUV).r;
        float opacity=coverage*clamp(vVisibility,0.0,1.0);
        if(opacity<0.006) discard;
        gl_FragColor=vec4(uColor,opacity);
      }
    `;
    const program=gl.createProgram();
    gl.attachShader(program,this.createShader(gl.VERTEX_SHADER,vs));
    gl.attachShader(program,this.createShader(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))
      throw new Error('WebGL link: '+gl.getProgramInfoLog(program));
    gl.useProgram(program);
    this.program=program;
    this.U={};
    for(const name of ['uFrom','uTo','uT','uScaleFrom','uScaleTo','uSize','uCenter','uLand','uColor'])
      this.U[name]=gl.getUniformLocation(program,name);
    const lonSteps=360, latSteps=180, vertex=[];
    for(let j=0;j<=latSteps;j++){
      const lat=-90+j;
      for(let i=0;i<=lonSteps;i++){
        const lon=-180+i;
        // UV y=0 is the top row of the source image (the northern pole).
        vertex.push(lon*RAD,lat*RAD,i/lonSteps,1-j/latSteps);
      }
    }
    const index=[];
    for(let j=0;j<latSteps;j++) for(let i=0;i<lonSteps;i++) {
      const a=j*(lonSteps+1)+i, b=a+(lonSteps+1);
      index.push(a,b,a+1,b,b+1,a+1);
    }
    this.indexCount=index.length;
    const vb=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vb);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertex),gl.STATIC_DRAW);
    const stride=4*Float32Array.BYTES_PER_ELEMENT;
    for(const [name,off] of [['aLonLat',0],['aUV',8]]){
      const location=gl.getAttribLocation(program,name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location,2,gl.FLOAT,false,stride,off);
    }
    const ib=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(index),gl.STATIC_DRAW);
    this.texture=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,this.texture);
    // 1x1 transparent pixel until the mask becomes available.
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,
      new Uint8Array([0,0,0,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.uniform1i(this.U.uLand,0);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  }
  resize(size) {
    this.size=size;
    this.canvas.width=this.canvas.height=size;
    this.glCanvas.width=this.glCanvas.height=size;
    if (this.gl) this.gl.viewport(0,0,size,size);
  }
  uploadMask(image, source='fallback') {
    if (this.cpuMode) {this.landSource='fallback';return;}
    const gl=this.gl;
    gl.bindTexture(gl.TEXTURE_2D,this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    this.landSource=source;
  }
  async loadMask(url) {
    const img=new Image();
    img.decoding='async';
    await new Promise((resolve,reject)=>{
      img.onload=resolve;
      img.onerror=()=>reject(new Error('Coastline mask could not be loaded'));
      img.src=url;
    });
    this.uploadMask(img);
  }
  async loadBlankMapSvg(svgText) {
    if(this.cpuMode) throw new Error('SVG reprojection requires WebGL; using built-in coastlines');
    const parser=new DOMParser();
    const xml=parser.parseFromString(svgText,'image/svg+xml');
    const svg=xml.documentElement;
    if(svg.tagName.toLowerCase()!=='svg' || xml.querySelector('parsererror'))
      throw new Error('Invalid SVG');
    svg.querySelectorAll('script,foreignObject,image,rect,line,circle,ellipse,text').forEach(n=>n.remove());
    svg.querySelectorAll('style').forEach(n=>n.remove());
    const shapes=svg.querySelectorAll('path,polygon');
    if(shapes.length<5) throw new Error('SVG contains too few geographic paths');
    for(const el of shapes) {
      el.setAttribute('fill','#ffffff');
      el.setAttribute('stroke','none');
      el.style.setProperty('fill','#ffffff','important');
      el.style.setProperty('stroke','none','important');
    }
    svg.setAttribute('viewBox','0 0 360 180');
    svg.setAttribute('width','4096');
    svg.setAttribute('height','2048');
    svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
    const objectUrl=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],
      {type:'image/svg+xml;charset=utf-8'}));
    try{
      const im=new Image();
      await new Promise((resolve,reject)=>{ im.onload=resolve; im.onerror=reject; im.src=objectUrl; });
      const c=document.createElement('canvas'); c.width=4096; c.height=2048;
      const g=c.getContext('2d');
      g.clearRect(0,0,c.width,c.height);
      g.drawImage(im,0,0,c.width,c.height);
      // WebGL reads RGB coverage, not alpha: convert alpha-only silhouettes
      // into white-on-black coverage for a texture.
      const img=g.getImageData(0,0,c.width,c.height);
      for(let i=0;i<img.data.length;i+=4){
        const a=img.data[i+3];
        img.data[i]=img.data[i+1]=img.data[i+2]=a;
        img.data[i+3]=255;
      }
      g.putImageData(img,0,0);
      this.uploadMask(c,'blankmap');
    }finally{URL.revokeObjectURL(objectUrl);}
  }
  blendPosition(lon,lat,from,to,t) {
    const a=from.project(lon*RAD,lat*RAD);
    const b=to.project(lon*RAD,lat*RAD);
    return [960+(a[0]*from.scale*(1-t)+b[0]*to.scale*t),
      this.centerY-(a[1]*from.scale*(1-t)+b[1]*to.scale*t)];
  }
  drawGraticule(ctx,from,to,t) {
    ctx.save();
    // One overlay stays light over the ocean and dark over the continents.
    ctx.globalCompositeOperation='difference';
    for(const fine of [true,false]) {
      ctx.beginPath();
      for(let lat=-85;lat<=85;lat+=5) {
        if(lat!==0 && (lat%30!==0)===fine)
          this.traceGeoLine(ctx,from,to,t,'parallel',lat);
      }
      for(let lon=-180;lon<=180;lon+=5) {
        if(lon!==0 && (lon%30!==0)===fine)
          this.traceGeoLine(ctx,from,to,t,'meridian',lon);
      }
      ctx.strokeStyle=fine?'rgba(150,150,150,.22)':'rgba(185,185,185,.48)';
      ctx.lineWidth=fine?.5:1.1;
      ctx.stroke();
    }
    ctx.beginPath();
    this.traceGeoLine(ctx,from,to,t,'parallel',0);
    this.traceGeoLine(ctx,from,to,t,'meridian',0);
    ctx.strokeStyle='rgba(200,200,200,.55)';
    ctx.lineWidth=1.4;
    ctx.stroke();
    // Close the geographic perimeter, including the northern polar edge.
    ctx.beginPath();
    this.traceGeoLine(ctx,from,to,t,'parallel',-90);
    this.traceGeoLine(ctx,from,to,t,'parallel',90);
    ctx.strokeStyle='rgba(185,185,185,.48)';
    ctx.lineWidth=1.1;
    ctx.stroke();
    ctx.restore();
  }
  traceGeoLine(ctx,from,to,t,kind,value) {
    const min=kind==='meridian'?-90:-180;
    const max=kind==='meridian'?90:180;
    const n=kind==='meridian'?180:360;
    let active=false, prev=null;
    for(let i=0;i<=n;i++){
      const q=min+(max-min)*i/n;
      const lon=kind==='meridian'?value:q;
      const lat=kind==='meridian'?q:value;
      const visible=(1-t)*(from.visibility?.(lon*RAD,lat*RAD)??1)+
        t*(to.visibility?.(lon*RAD,lat*RAD)??1);
      const [x,y]=this.blendPosition(lon,lat,from,to,t);
      const distant=prev&&Math.hypot(x-prev[0],y-prev[1])>130;
      if(visible<0.22 || !Number.isFinite(x) || !Number.isFinite(y)) { active=false;prev=null;continue; }
      if(!active||distant) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
      prev=[x,y]; active=true;
    }
  }
  renderLand(from,to,t) {
    if (this.cpuMode) return;
    const gl=this.gl, ratio=this.size/1920;
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniform1i(this.U.uFrom,from.index);
    gl.uniform1i(this.U.uTo,to.index);
    gl.uniform1f(this.U.uT,t);
    gl.uniform1f(this.U.uScaleFrom,from.scale*ratio);
    gl.uniform1f(this.U.uScaleTo,to.scale*ratio);
    gl.uniform1f(this.U.uSize,this.size);
    gl.uniform2f(this.U.uCenter,960*ratio,this.centerY*ratio);
    gl.uniform3f(this.U.uColor,0.89,0.89,0.89);
    gl.drawElements(gl.TRIANGLES,this.indexCount,gl.UNSIGNED_SHORT,0);
  }
  drawBackground(ctx) {
    ctx.fillStyle='#000000';
    ctx.fillRect(0,0,1920,1920);
  }
  fitText(ctx,text,maxWidth,size,minSize=48) {
    let font=size;
    do{
      ctx.font=`600 ${font}px "Helvetica Neue", Arial, sans-serif`;
      if(ctx.measureText(text).width<=maxWidth) break;
      font-=2;
    }while(font>minSize);
    return font;
  }
  drawProjectionCaption(ctx,p,language,alpha) {
    if(alpha<=0)return;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.textAlign='center';
    ctx.fillStyle='#EEEEEE';
    this.fitText(ctx,p.title[language],1570,82,54);
    ctx.fillText(p.title[language],960,256);
    ctx.restore();
  }
  wrapText(ctx,text,maxWidth,maxLines=3){
    const words=text.split(/\s+/),lines=[];
    let current='';
    for(const w of words){
      const tryLine=current?current+' '+w:w;
      if(ctx.measureText(tryLine).width>maxWidth && current) {
        lines.push(current);current=w;
      }else current=tryLine;
    }
    if(current)lines.push(current);
    return lines.slice(0,maxLines);
  }
  drawDefect(ctx,p,lang,alpha){
    if(alpha<=0)return;
    ctx.save();ctx.globalAlpha=alpha;
    ctx.textAlign='center';ctx.fillStyle='#D8D8D8';
    ctx.font='400 42px "Helvetica Neue", Arial, sans-serif';
    const lines=this.wrapText(ctx,p.defect[lang],1570,3);
    const lineH=59;
    lines.forEach((line,i)=>ctx.fillText(line,960,1638+i*lineH));
    ctx.restore();
  }
  drawTypography(ctx,from,to,progress,language) {
    const {id,alpha}=getCaptionState(from.id,to.id,progress);
    const projection=PROJECTION_BY_ID[id];
    this.drawProjectionCaption(ctx,projection,language,alpha);
    this.drawDefect(ctx,projection,language,alpha);
  }
  // Slower but fully independent fallback for browsers where WebGL is disabled.
  // Renders coastlines as vector paths, from the same GSHHS source as land-mask.png.
  drawCpuLand(ctx,from,to,t) {
    if(typeof COAST_RINGS==='undefined')return;
    const isClip=from.visibility||to.visibility;
    ctx.save();
    ctx.fillStyle='#E3E3E3';
    ctx.beginPath();
    const visible=(p)=>{
      if(!isClip)return 1;
      return (1-t)*(from.visibility?.(p[0]*RAD,p[1]*RAD)??1)+
        t*(to.visibility?.(p[0]*RAD,p[1]*RAD)??1);
    };
    for(const ring of COAST_RINGS){
      if(ring.length<3)continue;
      const coords=[];
      if(isClip){
        // Approximate spherical-horizon clipping by interpolating on the
        // geographic outline. Clipping only changes geometry near the rim.
        let prior=ring[ring.length-1],priorV=visible(prior)-.04;
        for(const curr of ring){
          const curV=visible(curr)-.04;
          if((priorV<0)!==(curV<0)){
            const a=priorV/(priorV-curV);
            coords.push([prior[0]+a*(curr[0]-prior[0]),prior[1]+a*(curr[1]-prior[1])]);
          }
          if(curV>=0)coords.push(curr);
          prior=curr;priorV=curV;
        }
      }else coords.push(...ring);
      if(coords.length<3)continue;
      for(let i=0;i<coords.length;i++){
        const [x,y]=this.blendPosition(coords[i][0],coords[i][1],from,to,t);
        if(i===0)ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }
  render(frame) {
    let {from,to,t,progress,language,showLabels}=frame;
    this.centerY=showLabels?918:960;
    if(!showLabels){
      from={...from,scale:from.fullScale};
      to={...to,scale:to.fullScale};
    }
    const scale=this.size/1920;
    if(!this.cpuMode) this.renderLand(from,to,t);
    const ctx=this.ctx;
    ctx.setTransform(scale,0,0,scale,0,0);
    this.drawBackground(ctx);
    if(this.cpuMode) this.drawCpuLand(ctx,from,to,t);
    else ctx.drawImage(this.glCanvas,0,0,1920,1920);
    this.drawGraticule(ctx,from,to,t);
    if(showLabels)this.drawTypography(ctx,from,to,progress,language);
  }
}

/*--- app.js ---*/
/* Application/UI, animation timeline, in-browser 1920×1920 recording. */
(()=>{
'use strict';
const BLANKMAP_URL='https://upload.wikimedia.org/wikipedia/commons/5/51/BlankMap-Equirectangular.svg';
const I18N={
  ru:{
    eyebrow:'ИНТЕРАКТИВНАЯ КАРТОГРАФИЯ',appTitle:'Атлас искажений',
    intro:'Одна Земля, несколько способов развернуть её на плоскость.',
    preview:'Предпросмотр',sequence:'Последовательность',add:'Добавить проекцию',
    instructions:'Перетаскивайте карточки или меняйте порядок стрелками. Можно повторять проекции.',
    settings:'Настройки ролика',total:'Общая длительность',seconds:'секунд',
    morph:'Длительность морфинга',morphHint:'На каждый переход. Максимум при текущей длительности: {max} с.',
    noMorph:'Для морфинга добавьте ещё одну проекцию.',
    hideLabels:'Скрыть все подписи',hideLabelsHint:'Только карта и координатная сетка на весь кадр.',
    videoLoop:'Зациклить видео',videoLoopHint:'Плавный переход от последней проекции к первой.',
    uiLang:'Язык интерфейса',videoLang:'Язык подписей в видео',
    output:'Экспорт',outputFormat:'Формат',auto:'Авто · MP4 / WebM',
    webm:'WebM',mp4:'MP4 (если поддерживается)',
    resolution:'Квадрат · 1920 × 1920 · до 30 кадров/с',exportBtn:'Сохранить видео',
    play:'Воспроизвести',pause:'Пауза',restart:'С начала',loop:'Зациклить',
    source:'Источник силуэтов',fallback:'Встроенная карта · офлайн',blankmap:'BlankMap · Wikimedia Commons',
    upload:'Загрузить SVG',uploadHint:'Можно использовать свой исходный BlankMap-Equirectangular.svg.',
    statusReady:'Готово к экспорту',statusExport:'Запись видео',
    statusDone:'Видео сохранено',statusError:'Не удалось сохранить видео',
    statusNoRecorder:'Этот браузер не поддерживает запись видео с Canvas.',
    statusNoMp4:'MP4 недоступен в этом браузере. Выберите «Авто» или WebM.',
    remove:'Удалить',moveUp:'Вверх',moveDown:'Вниз',drag:'Переместить',
    reset:'Сбросить порядок',videoRecording:'Во время записи не переключайте вкладку.',
    credit:'Плавный переход по географическим координатам · все расчёты локально в браузере',
    loading:'Загрузка карты…',unknownError:'Ошибка визуализации',loadingBlankMap:'Загружается BlankMap…'
  },
  en:{
    eyebrow:'INTERACTIVE CARTOGRAPHY',appTitle:'Atlas of distortion',
    intro:'One Earth, several ways to unfold it onto a plane.',
    preview:'Preview',sequence:'Projection sequence',add:'Add projection',
    instructions:'Drag cards or use the arrow buttons. Projections can appear more than once.',
    settings:'Video settings',total:'Total duration',seconds:'seconds',
    morph:'Morph duration',morphHint:'Per transition. Maximum for the current total duration: {max} s.',
    noMorph:'Add another projection to enable morphing.',
    hideLabels:'Hide all captions',hideLabelsHint:'Only the map and coordinate grid, scaled to fill the frame.',
    videoLoop:'Loop video',videoLoopHint:'Smoothly morph from the last projection back to the first.',
    uiLang:'Interface language',videoLang:'Video captions language',
    output:'Export',outputFormat:'Format',auto:'Auto · MP4 / WebM',
    webm:'WebM',mp4:'MP4 (if supported)',
    resolution:'Square · 1920 × 1920 · up to 30 fps',exportBtn:'Save video',
    play:'Play',pause:'Pause',restart:'Restart',loop:'Loop',
    source:'Coastline source',fallback:'Built-in map · offline',blankmap:'BlankMap · Wikimedia Commons',
    upload:'Load SVG',uploadHint:'You can supply your own BlankMap-Equirectangular.svg.',
    statusReady:'Ready for export',statusExport:'Recording video',
    statusDone:'Video saved',statusError:'Could not save video',
    statusNoRecorder:'This browser does not support canvas video recording.',
    statusNoMp4:'MP4 is unavailable in this browser. Choose Auto or WebM.',
    remove:'Remove',moveUp:'Move up',moveDown:'Move down',drag:'Drag to move',
    reset:'Reset order',videoRecording:'Keep this tab active while recording.',
    credit:'Geographic-coordinate morphing · all calculations run locally in your browser',
    loading:'Loading map…',unknownError:'Rendering error',loadingBlankMap:'Loading BlankMap…'
  }
};
const $=(id)=>document.getElementById(id);
const DEFAULT=DEFAULT_SETTINGS.sequence;
const initialSettings=readSettings(PROJECTIONS.map(p=>p.id));
let {sequence,uiLang,videoLang,seconds,morphSeconds,showLabels,videoLoop,previewTime,loop}=initialSettings;
let playing=false, recording=false;
let lastTick=0, dragIndex=-1, sourceName='fallback', messageKey='statusReady';
let renderer;
const canvas=$('mapCanvas');
function tr(key){return I18N[uiLang][key]??key;}
function persistSettings(){
  writeSettings({sequence,uiLang,videoLang,seconds,morphSeconds,showLabels,videoLoop,loop,previewTime,
    format:$('formatSelect').value,projectionToAdd:$('projectionToAdd').value});
}
function updateTimingUI(){
  const limit=getMorphLimit(seconds,sequence.length,videoLoop);
  const input=$('morphInput');
  const minimum=Math.min(.1,limit);
  morphSeconds=clamp(morphSeconds,minimum,limit);
  input.min=minimum;
  input.max=limit;
  input.step=limit<.1?'any':'.1';
  input.value=morphSeconds;
  input.disabled=recording||sequence.length<2;
  $('morphHelp').textContent=sequence.length<2?tr('noMorph'):
    tr('morphHint').replace('{max}',new Intl.NumberFormat(uiLang,{maximumFractionDigits:3}).format(limit));
}
function draw(time=previewTime){
  if(!renderer)return;
  const segment=getSegment(sequence,time,seconds,morphSeconds,videoLoop);
  renderer.render({...segment,from:PROJECTION_BY_ID[segment.from],to:PROJECTION_BY_ID[segment.to],language:videoLang,showLabels});
}
function formatTime(t){
  const m=Math.floor(t/60),s=Math.floor(t%60);
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function updatePlayback(){
  $('playIcon').textContent=playing?'Ⅱ':'▶';
  $('playBtn').setAttribute('title',tr(playing?'pause':'play'));
  $('loopBtn').classList.toggle('selected',loop);
  $('loopBtn').setAttribute('aria-pressed',String(loop));
  $('timeReadout').textContent=`${formatTime(previewTime)} / ${formatTime(seconds)}`;
  $('seek').value=Math.round(previewTime/seconds*1000);
  $('seek').style.setProperty('--pct',(previewTime/seconds*100)+'%');
}
function paint(time){
  if(recording)return;
  previewTime=Math.max(0,Math.min(seconds,time));
  draw();updatePlayback();persistSettings();
}
function frameLoop(now){
  const dt=lastTick?Math.min(.25,(now-lastTick)/1000):0;
  lastTick=now;
  if(playing && !recording){
    previewTime+=dt;
    if(previewTime>=seconds){
      if(loop)previewTime%=seconds;
      else{previewTime=seconds;playing=false;}
    }
    draw();updatePlayback();
  }
  requestAnimationFrame(frameLoop);
}
function createIconButton(icon,label,action,disabled=false){
  const b=document.createElement('button');
  b.type='button';b.className='step-button';b.textContent=icon;
  b.title=label;b.setAttribute('aria-label',label);b.disabled=disabled;
  b.addEventListener('click',action);
  return b;
}
function updateSequenceUI(){
  const list=$('sequenceList');list.replaceChildren();
  sequence.forEach((id,i)=>{
    const p=PROJECTION_BY_ID[id],item=document.createElement('li');
    item.className='sequence-item';item.draggable=!recording;
    item.dataset.index=i;
    const handle=document.createElement('span');handle.className='drag-grip';
    handle.textContent='⠿';handle.title=tr('drag');
    const n=document.createElement('span');n.className='sequence-number';
    n.textContent=String(i+1).padStart(2,'0');
    const summary=document.createElement('div');summary.className='sequence-summary';
    const title=document.createElement('strong');title.textContent=p.title[uiLang];
    const desc=document.createElement('small');desc.textContent=p.short[uiLang];
    summary.append(title,desc);
    const actions=document.createElement('div');actions.className='sequence-actions';
    actions.append(
      createIconButton('↑',tr('moveUp'),()=>move(i,i-1),i===0||recording),
      createIconButton('↓',tr('moveDown'),()=>move(i,i+1),i===sequence.length-1||recording),
      createIconButton('×',tr('remove'),()=>removeAt(i),sequence.length<=1||recording)
    );
    item.append(handle,n,summary,actions);
    item.addEventListener('dragstart',(e)=>{
      if(recording){e.preventDefault();return;}
      dragIndex=i;
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',String(i));
      item.classList.add('dragging');
    });
    item.addEventListener('dragend',()=>{
      dragIndex=-1;
      document.querySelectorAll('.sequence-item').forEach(el=>el.classList.remove('drag-over','dragging'));
    });
    item.addEventListener('dragover',(e)=>{
      if(recording)return;e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave',()=>item.classList.remove('drag-over'));
    item.addEventListener('drop',(e)=>{
      e.preventDefault();
      const from=Number(e.dataTransfer.getData('text/plain'));
      if(Number.isInteger(from))move(from,i);
    });
    list.append(item);
  });
  const select=$('projectionToAdd');
  const chosen=select.value;
  select.replaceChildren(...PROJECTIONS.map(p=>{
    const op=document.createElement('option');op.value=p.id;op.textContent=p.title[uiLang];return op;
  }));
  if(chosen && PROJECTION_BY_ID[chosen])select.value=chosen;
  $('sequenceCount').textContent=String(sequence.length).padStart(2,'0');
  updateTimingUI();
}
function move(from,to){
  if(recording||to<0||to>=sequence.length||from===to)return;
  const [id]=sequence.splice(from,1);sequence.splice(to,0,id);
  updateSequenceUI();paint(0);
}
function removeAt(i){
  if(recording||sequence.length<=1)return;
  sequence.splice(i,1);updateSequenceUI();paint(0);
}
function updateTranslations(){
  document.documentElement.lang=uiLang;
  document.title=tr('appTitle')+' — Projection Lab';
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.dataset.i18n;
    if(I18N[uiLang][key])el.textContent=tr(key);
  });
  const format=$('formatSelect').value;
  $('formatSelect').replaceChildren(...['auto','mp4','webm'].map(key=>{
    const opt=document.createElement('option');opt.value=key;opt.textContent=tr(key);return opt;
  }));
  $('formatSelect').value=format;
  updateSequenceUI();updatePlayback();updateSourceLabel();showStatus(messageKey);
  draw();
}
function showStatus(key,suffix=''){
  messageKey=key;
  const st=$('status');st.textContent=tr(key)+(suffix?' · '+suffix:'');
  st.classList.toggle('error',key==='statusError'||key==='statusNoRecorder'||key==='statusNoMp4');
}
function getRecorderMime(format){
  if(!window.MediaRecorder || !canvas.captureStream)return null;
  const support=(s)=>MediaRecorder.isTypeSupported(s);
  const mp4=['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1.4D402A','video/mp4'];
  const webm=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  const candidates=format==='mp4'?mp4:format==='webm'?webm:[...mp4,...webm];
  return candidates.find(support)||null;
}
function fileDownload(blob,name){
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;anchor.download=name;
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function exportVideo(){
  if(recording)return;
  const mime=getRecorderMime($('formatSelect').value);
  if(!mime){showStatus($('formatSelect').value==='mp4'?'statusNoMp4':'statusNoRecorder');return;}
  recording=true;playing=false;
  const exportBtn=$('exportBtn');
  exportBtn.disabled=true;
  $('exportProgress').classList.remove('hidden');
  $('exportProgressBar').style.width='0%';
  $('recordingNote').classList.remove('hidden');
  $('playBtn').disabled=true;
  $('restartBtn').disabled=true;
  $('seek').disabled=true;
  $('projectionToAdd').disabled=true;
  $('addProjectionBtn').disabled=true;
  $('resetSequence').disabled=true;
  $('durationInput').disabled=true;
  $('morphInput').disabled=true;
  $('hideLabels').disabled=true;
  $('videoLoop').disabled=true;
  $('formatSelect').disabled=true;
  $('uiLanguage').disabled=true;
  $('videoLanguage').disabled=true;
  updateSequenceUI();
  let recorder,stream;
  try{
    renderer.resize(1920);
    draw(0);
    stream=canvas.captureStream(30);
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:14000000});
    const chunks=[];
    const finish=new Promise((resolve,reject)=>{
      recorder.ondataavailable=(ev)=>{if(ev.data&&ev.data.size)chunks.push(ev.data);};
      recorder.onerror=(ev)=>reject(new Error(ev.error?.message||'Recorder error'));
      recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType||mime}));
    });
    showStatus('statusExport','0%');
    recorder.start(1000);
    const start=performance.now();
    await new Promise((resolve,reject)=>{
      function step(now){
        if(recorder.state!=='recording')return reject(new Error('Recorder interrupted'));
        const t=Math.min(seconds,(now-start)/1000);
        draw(t);
        const percent=Math.round(t/seconds*100);
        $('exportProgressBar').style.width=percent+'%';
        $('status').textContent=tr('statusExport')+' · '+percent+'%';
        if(t>=seconds){resolve();return;}
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    // Allow the capture stream to deliver its final 1920px frame.
    await new Promise(resolve=>requestAnimationFrame(resolve));
    recorder.stop();
    const blob=await finish;
    const isMP4=(recorder.mimeType||mime).includes('mp4');
    if(blob.size<2048) throw new Error('Recorded file is unexpectedly small');
    const ext=isMP4?'mp4':'webm';
    fileDownload(blob,`projection-atlas-${seconds}s-${showLabels?videoLang:'map'}${videoLoop?'-loop':''}-1920.${ext}`);
    showStatus('statusDone',`${(blob.size/1048576).toFixed(1)} MB · ${ext.toUpperCase()}`);
    previewTime=seconds;updatePlayback();
  }catch(e){
    console.error(e);showStatus('statusError',e.message||'');
    if(recorder && recorder.state==='recording')recorder.stop();
  }finally{
    if(stream)stream.getTracks().forEach(t=>t.stop());
    recording=false;
    renderer.resize(960);
    draw();
    exportBtn.disabled=false;
    $('exportProgress').classList.add('hidden');
    $('recordingNote').classList.add('hidden');
    for(const id of ['playBtn','restartBtn','seek','projectionToAdd','addProjectionBtn','resetSequence','durationInput','hideLabels','videoLoop','formatSelect','uiLanguage','videoLanguage'])
      $(id).disabled=false;
    updateSequenceUI();
  }
}
function bindEvents(){
  $('playBtn').addEventListener('click',()=>{
    if(previewTime>=seconds)previewTime=0;
    playing=!playing;lastTick=performance.now();updatePlayback();persistSettings();
  });
  $('restartBtn').addEventListener('click',()=>paint(0));
  $('loopBtn').addEventListener('click',()=>{loop=!loop;updatePlayback();persistSettings();});
  $('seek').addEventListener('input',e=>{playing=false;paint(Number(e.target.value)/1000*seconds);});
  $('durationInput').addEventListener('change',e=>{
    const v=Number(e.target.value);
    seconds=Number.isFinite(v)?clamp(Math.round(v),5,300):35;
    e.target.value=seconds;
    updateTimingUI();
    paint(Math.min(previewTime,seconds));
  });
  $('morphInput').addEventListener('change',e=>{
    const value=Number(e.target.value);
    if(Number.isFinite(value))morphSeconds=value;
    updateTimingUI();
    paint(previewTime);
  });
  $('hideLabels').addEventListener('change',e=>{
    showLabels=!e.target.checked;draw();persistSettings();
  });
  $('videoLoop').addEventListener('change',e=>{
    videoLoop=e.target.checked;updateTimingUI();paint(previewTime);
  });
  $('uiLanguage').addEventListener('change',e=>{uiLang=e.target.value;updateTranslations();persistSettings();});
  $('videoLanguage').addEventListener('change',e=>{videoLang=e.target.value;draw();persistSettings();});
  $('formatSelect').addEventListener('change',persistSettings);
  $('projectionToAdd').addEventListener('change',persistSettings);
  window.addEventListener('pagehide',persistSettings);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)persistSettings();
  });
  $('addProjectionBtn').addEventListener('click',()=>{
    sequence.push($('projectionToAdd').value);updateSequenceUI();paint(0);
  });
  $('resetSequence').addEventListener('click',()=>{
    sequence=DEFAULT.slice();updateSequenceUI();paint(0);
  });
  $('exportBtn').addEventListener('click',exportVideo);
  $('svgUpload').addEventListener('change',async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      await renderer.loadBlankMapSvg(await file.text());
      sourceName='blankmap';updateSourceLabel();draw();
    }catch(err){showStatus('statusError',err.message);}
  });
}
function updateSourceLabel(){
  $('sourceStatus').textContent=tr(sourceName==='blankmap'?'blankmap':'fallback');
}
async function tryOriginalSVG(){
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),11000);
    const response=await fetch(BLANKMAP_URL,{signal:controller.signal,mode:'cors'});
    clearTimeout(timer);
    if(!response.ok)throw new Error('Download failed');
    const svg=await response.text();
    if(recording)return;
    await renderer.loadBlankMapSvg(svg);
    sourceName='blankmap';updateSourceLabel();draw();
  }catch(_err){
    // The offline coastline mask is already loaded. An SVG can also be selected manually.
  }
}
async function start(){
  try{
    renderer=new ProjectionRenderer(canvas);
    bindEvents();
    $('durationInput').value=seconds;
    $('uiLanguage').value=uiLang;
    $('videoLanguage').value=videoLang;
    $('hideLabels').checked=!showLabels;
    $('videoLoop').checked=videoLoop;
    $('formatSelect').value=initialSettings.format;
    updateTranslations();
    $('projectionToAdd').value=initialSettings.projectionToAdd;
    updateSourceLabel();
    showStatus('loading');
    await renderer.loadMask(DEFAULT_MASK_URL);
    draw();showStatus('statusReady');
    requestAnimationFrame(frameLoop);
    tryOriginalSVG();
  }catch(err){
    console.error(err);
    showStatus('unknownError',err.message);
  }
}
start();
})();
