(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=t(s);fetch(s.href,r)}})();const fc="170",rd=0,$c=1,od=2,Wu=1,ad=2,Cn=3,Bn=0,It=1,jt=2,ii=0,$i=1,Jc=2,Qc=3,el=4,cd=5,yi=100,ld=101,ud=102,hd=103,dd=104,fd=200,pd=201,md=202,gd=203,ma=204,ga=205,_d=206,xd=207,vd=208,Md=209,yd=210,Sd=211,Ed=212,Td=213,bd=214,_a=0,xa=1,va=2,is=3,Ma=4,ya=5,Sa=6,Ea=7,Xu=0,Ad=1,wd=2,si=0,Rd=1,Cd=2,Pd=3,Ld=4,Id=5,Dd=6,Ud=7,tl="attached",Nd="detached",qu=300,ss=301,rs=302,Ta=303,ba=304,po=306,os=1e3,Zt=1001,to=1002,Nt=1003,ju=1004,Bs=1005,Vt=1006,Gr=1007,Dn=1008,zn=1009,Yu=1010,Ku=1011,Ys=1012,pc=1013,bi=1014,cn=1015,tr=1016,mc=1017,gc=1018,as=1020,Zu=35902,$u=1021,Ju=1022,$t=1023,Qu=1024,eh=1025,Ji=1026,cs=1027,_c=1028,xc=1029,th=1030,vc=1031,Mc=1033,Wr=33776,Xr=33777,qr=33778,jr=33779,Aa=35840,wa=35841,Ra=35842,Ca=35843,Pa=36196,La=37492,Ia=37496,Da=37808,Ua=37809,Na=37810,Fa=37811,Oa=37812,Ba=37813,za=37814,ka=37815,Ha=37816,Va=37817,Ga=37818,Wa=37819,Xa=37820,qa=37821,Yr=36492,ja=36494,Ya=36495,nh=36283,Ka=36284,Za=36285,$a=36286,Ks=2300,Zs=2301,Eo=2302,nl=2400,il=2401,sl=2402,Fd=2500,Od=0,ih=1,Ja=2,Bd=3200,zd=3201,sh=0,kd=1,ti="",xt="srgb",Ft="srgb-linear",mo="linear",Qe="srgb",Ri=7680,rl=519,Hd=512,Vd=513,Gd=514,rh=515,Wd=516,Xd=517,qd=518,jd=519,Qa=35044,ol="300 es",Un=2e3,no=2001;class xs{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const s=this._listeners[e];if(s!==void 0){const r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}}const Ct=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let al=1234567;const Qi=Math.PI/180,ls=180/Math.PI;function ln(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ct[i&255]+Ct[i>>8&255]+Ct[i>>16&255]+Ct[i>>24&255]+"-"+Ct[e&255]+Ct[e>>8&255]+"-"+Ct[e>>16&15|64]+Ct[e>>24&255]+"-"+Ct[t&63|128]+Ct[t>>8&255]+"-"+Ct[t>>16&255]+Ct[t>>24&255]+Ct[n&255]+Ct[n>>8&255]+Ct[n>>16&255]+Ct[n>>24&255]).toLowerCase()}function Lt(i,e,t){return Math.max(e,Math.min(t,i))}function yc(i,e){return(i%e+e)%e}function Yd(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function Kd(i,e,t){return i!==e?(t-i)/(e-i):0}function Gs(i,e,t){return(1-t)*i+t*e}function Zd(i,e,t,n){return Gs(i,e,1-Math.exp(-t*n))}function $d(i,e=1){return e-Math.abs(yc(i,e*2)-e)}function Jd(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Qd(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function ef(i,e){return i+Math.floor(Math.random()*(e-i+1))}function tf(i,e){return i+Math.random()*(e-i)}function nf(i){return i*(.5-Math.random())}function sf(i){i!==void 0&&(al=i);let e=al+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function rf(i){return i*Qi}function of(i){return i*ls}function af(i){return(i&i-1)===0&&i!==0}function cf(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function lf(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function uf(i,e,t,n,s){const r=Math.cos,o=Math.sin,a=r(t/2),c=o(t/2),l=r((e+n)/2),u=o((e+n)/2),h=r((e-n)/2),d=o((e-n)/2),f=r((n-e)/2),g=o((n-e)/2);switch(s){case"XYX":i.set(a*u,c*h,c*d,a*l);break;case"YZY":i.set(c*d,a*u,c*h,a*l);break;case"ZXZ":i.set(c*h,c*d,a*u,a*l);break;case"XZX":i.set(a*u,c*g,c*f,a*l);break;case"YXY":i.set(c*f,a*u,c*g,a*l);break;case"ZYZ":i.set(c*g,c*f,a*u,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function an(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function $e(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const Ei={DEG2RAD:Qi,RAD2DEG:ls,generateUUID:ln,clamp:Lt,euclideanModulo:yc,mapLinear:Yd,inverseLerp:Kd,lerp:Gs,damp:Zd,pingpong:$d,smoothstep:Jd,smootherstep:Qd,randInt:ef,randFloat:tf,randFloatSpread:nf,seededRandom:sf,degToRad:rf,radToDeg:of,isPowerOfTwo:af,ceilPowerOfTwo:cf,floorPowerOfTwo:lf,setQuaternionFromProperEuler:uf,normalize:$e,denormalize:an};class Le{constructor(e=0,t=0){Le.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Lt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*s+e.x,this.y=r*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ue{constructor(e,t,n,s,r,o,a,c,l){Ue.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,c,l)}set(e,t,n,s,r,o,a,c,l){const u=this.elements;return u[0]=e,u[1]=s,u[2]=a,u[3]=t,u[4]=r,u[5]=c,u[6]=n,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],u=n[4],h=n[7],d=n[2],f=n[5],g=n[8],_=s[0],m=s[3],p=s[6],b=s[1],E=s[4],y=s[7],N=s[2],w=s[5],A=s[8];return r[0]=o*_+a*b+c*N,r[3]=o*m+a*E+c*w,r[6]=o*p+a*y+c*A,r[1]=l*_+u*b+h*N,r[4]=l*m+u*E+h*w,r[7]=l*p+u*y+h*A,r[2]=d*_+f*b+g*N,r[5]=d*m+f*E+g*w,r[8]=d*p+f*y+g*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-n*r*u+n*a*c+s*r*l-s*o*c}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=u*o-a*l,d=a*c-u*r,f=l*r-o*c,g=t*h+n*d+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=h*_,e[1]=(s*l-u*n)*_,e[2]=(a*n-s*o)*_,e[3]=d*_,e[4]=(u*t-s*c)*_,e[5]=(s*r-a*t)*_,e[6]=f*_,e[7]=(n*c-l*t)*_,e[8]=(o*t-n*r)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,o,a){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-s*l,s*c,-s*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(To.makeScale(e,t)),this}rotate(e){return this.premultiply(To.makeRotation(-e)),this}translate(e,t){return this.premultiply(To.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const To=new Ue;function oh(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function $s(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function hf(){const i=$s("canvas");return i.style.display="block",i}const cl={};function zs(i){i in cl||(cl[i]=!0,console.warn(i))}function df(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function ff(i){const e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function pf(i){const e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}const ke={enabled:!0,workingColorSpace:Ft,spaces:{},convert:function(i,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===Qe&&(i.r=On(i.r),i.g=On(i.g),i.b=On(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===Qe&&(i.r=es(i.r),i.g=es(i.g),i.b=es(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===ti?mo:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function On(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function es(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const ll=[.64,.33,.3,.6,.15,.06],ul=[.2126,.7152,.0722],hl=[.3127,.329],dl=new Ue().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),fl=new Ue().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);ke.define({[Ft]:{primaries:ll,whitePoint:hl,transfer:mo,toXYZ:dl,fromXYZ:fl,luminanceCoefficients:ul,workingColorSpaceConfig:{unpackColorSpace:xt},outputColorSpaceConfig:{drawingBufferColorSpace:xt}},[xt]:{primaries:ll,whitePoint:hl,transfer:Qe,toXYZ:dl,fromXYZ:fl,luminanceCoefficients:ul,outputColorSpaceConfig:{drawingBufferColorSpace:xt}}});let Ci;class mf{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Ci===void 0&&(Ci=$s("canvas")),Ci.width=e.width,Ci.height=e.height;const n=Ci.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=Ci}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=$s("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=On(r[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(On(t[n]/255)*255):t[n]=On(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let gf=0;class ah{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:gf++}),this.uuid=ln(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(bo(s[o].image)):r.push(bo(s[o]))}else r=bo(s);n.url=r}return t||(e.images[this.uuid]=n),n}}function bo(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?mf.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let _f=0;class yt extends xs{constructor(e=yt.DEFAULT_IMAGE,t=yt.DEFAULT_MAPPING,n=Zt,s=Zt,r=Vt,o=Dn,a=$t,c=zn,l=yt.DEFAULT_ANISOTROPY,u=ti){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:_f++}),this.uuid=ln(),this.name="",this.source=new ah(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new Le(0,0),this.repeat=new Le(1,1),this.center=new Le(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ue,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==qu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case os:e.x=e.x-Math.floor(e.x);break;case Zt:e.x=e.x<0?0:1;break;case to:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case os:e.y=e.y-Math.floor(e.y);break;case Zt:e.y=e.y<0?0:1;break;case to:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}yt.DEFAULT_IMAGE=null;yt.DEFAULT_MAPPING=qu;yt.DEFAULT_ANISOTROPY=1;class je{constructor(e=0,t=0,n=0,s=1){je.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r;const c=e.elements,l=c[0],u=c[4],h=c[8],d=c[1],f=c[5],g=c[9],_=c[2],m=c[6],p=c[10];if(Math.abs(u-d)<.01&&Math.abs(h-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+_)<.1&&Math.abs(g+m)<.1&&Math.abs(l+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const E=(l+1)/2,y=(f+1)/2,N=(p+1)/2,w=(u+d)/4,A=(h+_)/4,P=(g+m)/4;return E>y&&E>N?E<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(E),s=w/n,r=A/n):y>N?y<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),n=w/s,r=P/s):N<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(N),n=A/r,s=P/r),this.set(n,s,r,t),this}let b=Math.sqrt((m-g)*(m-g)+(h-_)*(h-_)+(d-u)*(d-u));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(h-_)/b,this.z=(d-u)/b,this.w=Math.acos((l+f+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class xf extends xs{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new je(0,0,e,t),this.scissorTest=!1,this.viewport=new je(0,0,e,t);const s={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Vt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new yt(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,s=e.textures.length;n<s;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new ah(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ai extends xf{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class ch extends yt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Nt,this.minFilter=Nt,this.wrapR=Zt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class vf extends yt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Nt,this.minFilter=Nt,this.wrapR=Zt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class oi{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,o,a){let c=n[s+0],l=n[s+1],u=n[s+2],h=n[s+3];const d=r[o+0],f=r[o+1],g=r[o+2],_=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=d,e[t+1]=f,e[t+2]=g,e[t+3]=_;return}if(h!==_||c!==d||l!==f||u!==g){let m=1-a;const p=c*d+l*f+u*g+h*_,b=p>=0?1:-1,E=1-p*p;if(E>Number.EPSILON){const N=Math.sqrt(E),w=Math.atan2(N,p*b);m=Math.sin(m*w)/N,a=Math.sin(a*w)/N}const y=a*b;if(c=c*m+d*y,l=l*m+f*y,u=u*m+g*y,h=h*m+_*y,m===1-a){const N=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=N,l*=N,u*=N,h*=N}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,s,r,o){const a=n[s],c=n[s+1],l=n[s+2],u=n[s+3],h=r[o],d=r[o+1],f=r[o+2],g=r[o+3];return e[t]=a*g+u*h+c*f-l*d,e[t+1]=c*g+u*d+l*h-a*f,e[t+2]=l*g+u*f+a*d-c*h,e[t+3]=u*g-a*h-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),u=a(s/2),h=a(r/2),d=c(n/2),f=c(s/2),g=c(r/2);switch(o){case"XYZ":this._x=d*u*h+l*f*g,this._y=l*f*h-d*u*g,this._z=l*u*g+d*f*h,this._w=l*u*h-d*f*g;break;case"YXZ":this._x=d*u*h+l*f*g,this._y=l*f*h-d*u*g,this._z=l*u*g-d*f*h,this._w=l*u*h+d*f*g;break;case"ZXY":this._x=d*u*h-l*f*g,this._y=l*f*h+d*u*g,this._z=l*u*g+d*f*h,this._w=l*u*h-d*f*g;break;case"ZYX":this._x=d*u*h-l*f*g,this._y=l*f*h+d*u*g,this._z=l*u*g-d*f*h,this._w=l*u*h+d*f*g;break;case"YZX":this._x=d*u*h+l*f*g,this._y=l*f*h+d*u*g,this._z=l*u*g-d*f*h,this._w=l*u*h-d*f*g;break;case"XZY":this._x=d*u*h-l*f*g,this._y=l*f*h-d*u*g,this._z=l*u*g+d*f*h,this._w=l*u*h+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],s=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],h=t[10],d=n+a+h;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-c)*f,this._y=(r-l)*f,this._z=(o-s)*f}else if(n>a&&n>h){const f=2*Math.sqrt(1+n-a-h);this._w=(u-c)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+l)/f}else if(a>h){const f=2*Math.sqrt(1+a-n-h);this._w=(r-l)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(c+u)/f}else{const f=2*Math.sqrt(1+h-n-a);this._w=(o-s)/f,this._x=(r+l)/f,this._y=(c+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Lt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,s=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=n*u+o*a+s*l-r*c,this._y=s*u+o*c+r*a-n*l,this._z=r*u+o*l+n*c-s*a,this._w=o*u-n*a-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,s=this._y,r=this._z,o=this._w;let a=o*e._w+n*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;const c=1-a*a;if(c<=Number.EPSILON){const f=1-t;return this._w=f*o+t*this._w,this._x=f*n+t*this._x,this._y=f*s+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}const l=Math.sqrt(c),u=Math.atan2(l,a),h=Math.sin((1-t)*u)/l,d=Math.sin(t*u)/l;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=s*h+this._y*d,this._z=r*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class C{constructor(e=0,t=0,n=0){C.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(pl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(pl.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(e){const t=this.x,n=this.y,s=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*s-a*n),u=2*(a*t-r*s),h=2*(r*n-o*t);return this.x=t+c*l+o*h-a*u,this.y=n+c*u+a*l-r*h,this.z=s+c*h+r*u-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,s=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=s*c-r*a,this.y=r*o-n*c,this.z=n*a-s*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Ao.copy(this).projectOnVector(e),this.sub(Ao)}reflect(e){return this.sub(Ao.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Lt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Ao=new C,pl=new oi;class kn{constructor(e=new C(1/0,1/0,1/0),t=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(tn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(tn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=tn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,tn):tn.fromBufferAttribute(r,o),tn.applyMatrix4(e.matrixWorld),this.expandByPoint(tn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),lr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),lr.copy(n.boundingBox)),lr.applyMatrix4(e.matrixWorld),this.union(lr)}const s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,tn),tn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(As),ur.subVectors(this.max,As),Pi.subVectors(e.a,As),Li.subVectors(e.b,As),Ii.subVectors(e.c,As),Gn.subVectors(Li,Pi),Wn.subVectors(Ii,Li),ci.subVectors(Pi,Ii);let t=[0,-Gn.z,Gn.y,0,-Wn.z,Wn.y,0,-ci.z,ci.y,Gn.z,0,-Gn.x,Wn.z,0,-Wn.x,ci.z,0,-ci.x,-Gn.y,Gn.x,0,-Wn.y,Wn.x,0,-ci.y,ci.x,0];return!wo(t,Pi,Li,Ii,ur)||(t=[1,0,0,0,1,0,0,0,1],!wo(t,Pi,Li,Ii,ur))?!1:(hr.crossVectors(Gn,Wn),t=[hr.x,hr.y,hr.z],wo(t,Pi,Li,Ii,ur))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,tn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(tn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(yn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),yn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),yn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),yn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),yn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),yn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),yn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),yn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(yn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const yn=[new C,new C,new C,new C,new C,new C,new C,new C],tn=new C,lr=new kn,Pi=new C,Li=new C,Ii=new C,Gn=new C,Wn=new C,ci=new C,As=new C,ur=new C,hr=new C,li=new C;function wo(i,e,t,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){li.fromArray(i,r);const a=s.x*Math.abs(li.x)+s.y*Math.abs(li.y)+s.z*Math.abs(li.z),c=e.dot(li),l=t.dot(li),u=n.dot(li);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}const Mf=new kn,ws=new C,Ro=new C;class gn{constructor(e=new C,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Mf.setFromPoints(e).getCenter(n);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ws.subVectors(e,this.center);const t=ws.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(ws,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ro.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ws.copy(e.center).add(Ro)),this.expandByPoint(ws.copy(e.center).sub(Ro))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Sn=new C,Co=new C,dr=new C,Xn=new C,Po=new C,fr=new C,Lo=new C;class go{constructor(e=new C,t=new C(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Sn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Sn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Sn.copy(this.origin).addScaledVector(this.direction,t),Sn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Co.copy(e).add(t).multiplyScalar(.5),dr.copy(t).sub(e).normalize(),Xn.copy(this.origin).sub(Co);const r=e.distanceTo(t)*.5,o=-this.direction.dot(dr),a=Xn.dot(this.direction),c=-Xn.dot(dr),l=Xn.lengthSq(),u=Math.abs(1-o*o);let h,d,f,g;if(u>0)if(h=o*c-a,d=o*a-c,g=r*u,h>=0)if(d>=-g)if(d<=g){const _=1/u;h*=_,d*=_,f=h*(h+o*d+2*a)+d*(o*h+d+2*c)+l}else d=r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;else d=-r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;else d<=-g?(h=Math.max(0,-(-o*r+a)),d=h>0?-r:Math.min(Math.max(-r,-c),r),f=-h*h+d*(d+2*c)+l):d<=g?(h=0,d=Math.min(Math.max(-r,-c),r),f=d*(d+2*c)+l):(h=Math.max(0,-(o*r+a)),d=h>0?r:Math.min(Math.max(-r,-c),r),f=-h*h+d*(d+2*c)+l);else d=o>0?-r:r,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,h),s&&s.copy(Co).addScaledVector(dr,d),f}intersectSphere(e,t){Sn.subVectors(e.center,this.origin);const n=Sn.dot(this.direction),s=Sn.dot(Sn)-n*n,r=e.radius*e.radius;if(s>r)return null;const o=Math.sqrt(r-s),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,o,a,c;const l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,s=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,s=(e.min.x-d.x)*l),u>=0?(r=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(r=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),h>=0?(a=(e.min.z-d.z)*h,c=(e.max.z-d.z)*h):(a=(e.max.z-d.z)*h,c=(e.min.z-d.z)*h),n>c||a>s)||((a>n||n!==n)&&(n=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,Sn)!==null}intersectTriangle(e,t,n,s,r){Po.subVectors(t,e),fr.subVectors(n,e),Lo.crossVectors(Po,fr);let o=this.direction.dot(Lo),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Xn.subVectors(this.origin,e);const c=a*this.direction.dot(fr.crossVectors(Xn,fr));if(c<0)return null;const l=a*this.direction.dot(Po.cross(Xn));if(l<0||c+l>o)return null;const u=-a*Xn.dot(Lo);return u<0?null:this.at(u/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class we{constructor(e,t,n,s,r,o,a,c,l,u,h,d,f,g,_,m){we.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,c,l,u,h,d,f,g,_,m)}set(e,t,n,s,r,o,a,c,l,u,h,d,f,g,_,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=c,p[2]=l,p[6]=u,p[10]=h,p[14]=d,p[3]=f,p[7]=g,p[11]=_,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new we().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,s=1/Di.setFromMatrixColumn(e,0).length(),r=1/Di.setFromMatrixColumn(e,1).length(),o=1/Di.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,s=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),l=Math.sin(s),u=Math.cos(r),h=Math.sin(r);if(e.order==="XYZ"){const d=o*u,f=o*h,g=a*u,_=a*h;t[0]=c*u,t[4]=-c*h,t[8]=l,t[1]=f+g*l,t[5]=d-_*l,t[9]=-a*c,t[2]=_-d*l,t[6]=g+f*l,t[10]=o*c}else if(e.order==="YXZ"){const d=c*u,f=c*h,g=l*u,_=l*h;t[0]=d+_*a,t[4]=g*a-f,t[8]=o*l,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=f*a-g,t[6]=_+d*a,t[10]=o*c}else if(e.order==="ZXY"){const d=c*u,f=c*h,g=l*u,_=l*h;t[0]=d-_*a,t[4]=-o*h,t[8]=g+f*a,t[1]=f+g*a,t[5]=o*u,t[9]=_-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){const d=o*u,f=o*h,g=a*u,_=a*h;t[0]=c*u,t[4]=g*l-f,t[8]=d*l+_,t[1]=c*h,t[5]=_*l+d,t[9]=f*l-g,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){const d=o*c,f=o*l,g=a*c,_=a*l;t[0]=c*u,t[4]=_-d*h,t[8]=g*h+f,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=f*h+g,t[10]=d-_*h}else if(e.order==="XZY"){const d=o*c,f=o*l,g=a*c,_=a*l;t[0]=c*u,t[4]=-h,t[8]=l*u,t[1]=d*h+_,t[5]=o*u,t[9]=f*h-g,t[2]=g*h-f,t[6]=a*u,t[10]=_*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(yf,e,Sf)}lookAt(e,t,n){const s=this.elements;return kt.subVectors(e,t),kt.lengthSq()===0&&(kt.z=1),kt.normalize(),qn.crossVectors(n,kt),qn.lengthSq()===0&&(Math.abs(n.z)===1?kt.x+=1e-4:kt.z+=1e-4,kt.normalize(),qn.crossVectors(n,kt)),qn.normalize(),pr.crossVectors(kt,qn),s[0]=qn.x,s[4]=pr.x,s[8]=kt.x,s[1]=qn.y,s[5]=pr.y,s[9]=kt.y,s[2]=qn.z,s[6]=pr.z,s[10]=kt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],u=n[1],h=n[5],d=n[9],f=n[13],g=n[2],_=n[6],m=n[10],p=n[14],b=n[3],E=n[7],y=n[11],N=n[15],w=s[0],A=s[4],P=s[8],S=s[12],M=s[1],R=s[5],k=s[9],O=s[13],G=s[2],j=s[6],W=s[10],$=s[14],H=s[3],Z=s[7],ne=s[11],xe=s[15];return r[0]=o*w+a*M+c*G+l*H,r[4]=o*A+a*R+c*j+l*Z,r[8]=o*P+a*k+c*W+l*ne,r[12]=o*S+a*O+c*$+l*xe,r[1]=u*w+h*M+d*G+f*H,r[5]=u*A+h*R+d*j+f*Z,r[9]=u*P+h*k+d*W+f*ne,r[13]=u*S+h*O+d*$+f*xe,r[2]=g*w+_*M+m*G+p*H,r[6]=g*A+_*R+m*j+p*Z,r[10]=g*P+_*k+m*W+p*ne,r[14]=g*S+_*O+m*$+p*xe,r[3]=b*w+E*M+y*G+N*H,r[7]=b*A+E*R+y*j+N*Z,r[11]=b*P+E*k+y*W+N*ne,r[15]=b*S+E*O+y*$+N*xe,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],h=e[6],d=e[10],f=e[14],g=e[3],_=e[7],m=e[11],p=e[15];return g*(+r*c*h-s*l*h-r*a*d+n*l*d+s*a*f-n*c*f)+_*(+t*c*f-t*l*d+r*o*d-s*o*f+s*l*u-r*c*u)+m*(+t*l*h-t*a*f-r*o*h+n*o*f+r*a*u-n*l*u)+p*(-s*a*u-t*c*h+t*a*d+s*o*h-n*o*d+n*c*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=e[9],d=e[10],f=e[11],g=e[12],_=e[13],m=e[14],p=e[15],b=h*m*l-_*d*l+_*c*f-a*m*f-h*c*p+a*d*p,E=g*d*l-u*m*l-g*c*f+o*m*f+u*c*p-o*d*p,y=u*_*l-g*h*l+g*a*f-o*_*f-u*a*p+o*h*p,N=g*h*c-u*_*c-g*a*d+o*_*d+u*a*m-o*h*m,w=t*b+n*E+s*y+r*N;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/w;return e[0]=b*A,e[1]=(_*d*r-h*m*r-_*s*f+n*m*f+h*s*p-n*d*p)*A,e[2]=(a*m*r-_*c*r+_*s*l-n*m*l-a*s*p+n*c*p)*A,e[3]=(h*c*r-a*d*r-h*s*l+n*d*l+a*s*f-n*c*f)*A,e[4]=E*A,e[5]=(u*m*r-g*d*r+g*s*f-t*m*f-u*s*p+t*d*p)*A,e[6]=(g*c*r-o*m*r-g*s*l+t*m*l+o*s*p-t*c*p)*A,e[7]=(o*d*r-u*c*r+u*s*l-t*d*l-o*s*f+t*c*f)*A,e[8]=y*A,e[9]=(g*h*r-u*_*r-g*n*f+t*_*f+u*n*p-t*h*p)*A,e[10]=(o*_*r-g*a*r+g*n*l-t*_*l-o*n*p+t*a*p)*A,e[11]=(u*a*r-o*h*r-u*n*l+t*h*l+o*n*f-t*a*f)*A,e[12]=N*A,e[13]=(u*_*s-g*h*s+g*n*d-t*_*d-u*n*m+t*h*m)*A,e[14]=(g*a*s-o*_*s-g*n*c+t*_*c+o*n*m-t*a*m)*A,e[15]=(o*h*s-u*a*s+u*n*c-t*h*c-o*n*d+t*a*d)*A,this}scale(e){const t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),s=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,u=r*a;return this.set(l*o+n,l*a-s*c,l*c+s*a,0,l*a+s*c,u*a+n,u*c-s*o,0,l*c-s*a,u*c+s*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,o){return this.set(1,n,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){const s=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,u=o+o,h=a+a,d=r*l,f=r*u,g=r*h,_=o*u,m=o*h,p=a*h,b=c*l,E=c*u,y=c*h,N=n.x,w=n.y,A=n.z;return s[0]=(1-(_+p))*N,s[1]=(f+y)*N,s[2]=(g-E)*N,s[3]=0,s[4]=(f-y)*w,s[5]=(1-(d+p))*w,s[6]=(m+b)*w,s[7]=0,s[8]=(g+E)*A,s[9]=(m-b)*A,s[10]=(1-(d+_))*A,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){const s=this.elements;let r=Di.set(s[0],s[1],s[2]).length();const o=Di.set(s[4],s[5],s[6]).length(),a=Di.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],nn.copy(this);const l=1/r,u=1/o,h=1/a;return nn.elements[0]*=l,nn.elements[1]*=l,nn.elements[2]*=l,nn.elements[4]*=u,nn.elements[5]*=u,nn.elements[6]*=u,nn.elements[8]*=h,nn.elements[9]*=h,nn.elements[10]*=h,t.setFromRotationMatrix(nn),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,s,r,o,a=Un){const c=this.elements,l=2*r/(t-e),u=2*r/(n-s),h=(t+e)/(t-e),d=(n+s)/(n-s);let f,g;if(a===Un)f=-(o+r)/(o-r),g=-2*o*r/(o-r);else if(a===no)f=-o/(o-r),g=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=f,c[14]=g,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,o,a=Un){const c=this.elements,l=1/(t-e),u=1/(n-s),h=1/(o-r),d=(t+e)*l,f=(n+s)*u;let g,_;if(a===Un)g=(o+r)*h,_=-2*h;else if(a===no)g=r*h,_=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-d,c[1]=0,c[5]=2*u,c[9]=0,c[13]=-f,c[2]=0,c[6]=0,c[10]=_,c[14]=-g,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const Di=new C,nn=new we,yf=new C(0,0,0),Sf=new C(1,1,1),qn=new C,pr=new C,kt=new C,ml=new we,gl=new oi;class mn{constructor(e=0,t=0,n=0,s=mn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const s=e.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],u=s[9],h=s[2],d=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(Lt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Lt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,r),this._z=0);break;case"ZXY":this._x=Math.asin(Lt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Lt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Lt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Lt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return ml.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ml,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return gl.setFromEuler(this),this.setFromQuaternion(gl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}mn.DEFAULT_ORDER="XYZ";class lh{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Ef=0;const _l=new C,Ui=new oi,En=new we,mr=new C,Rs=new C,Tf=new C,bf=new oi,xl=new C(1,0,0),vl=new C(0,1,0),Ml=new C(0,0,1),yl={type:"added"},Af={type:"removed"},Ni={type:"childadded",child:null},Io={type:"childremoved",child:null};class ct extends xs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ef++}),this.uuid=ln(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ct.DEFAULT_UP.clone();const e=new C,t=new mn,n=new oi,s=new C(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new we},normalMatrix:{value:new Ue}}),this.matrix=new we,this.matrixWorld=new we,this.matrixAutoUpdate=ct.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ct.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new lh,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ui.setFromAxisAngle(e,t),this.quaternion.multiply(Ui),this}rotateOnWorldAxis(e,t){return Ui.setFromAxisAngle(e,t),this.quaternion.premultiply(Ui),this}rotateX(e){return this.rotateOnAxis(xl,e)}rotateY(e){return this.rotateOnAxis(vl,e)}rotateZ(e){return this.rotateOnAxis(Ml,e)}translateOnAxis(e,t){return _l.copy(e).applyQuaternion(this.quaternion),this.position.add(_l.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(xl,e)}translateY(e){return this.translateOnAxis(vl,e)}translateZ(e){return this.translateOnAxis(Ml,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(En.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?mr.copy(e):mr.set(e,t,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Rs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?En.lookAt(Rs,mr,this.up):En.lookAt(mr,Rs,this.up),this.quaternion.setFromRotationMatrix(En),s&&(En.extractRotation(s.matrixWorld),Ui.setFromRotationMatrix(En),this.quaternion.premultiply(Ui.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(yl),Ni.child=e,this.dispatchEvent(Ni),Ni.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Af),Io.child=e,this.dispatchEvent(Io),Io.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),En.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),En.multiply(e.parent.matrixWorld)),e.applyMatrix4(En),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(yl),Ni.child=e,this.dispatchEvent(Ni),Ni.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rs,e,Tf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Rs,bf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const h=c[l];r(e.shapes,h)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];s.animations.push(r(e.animations,c))}}if(t){const a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),h=o(e.shapes),d=o(e.skeletons),f=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){const c=[];for(const l in a){const u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const s=e.children[n];this.add(s.clone())}return this}}ct.DEFAULT_UP=new C(0,1,0);ct.DEFAULT_MATRIX_AUTO_UPDATE=!0;ct.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const sn=new C,Tn=new C,Do=new C,bn=new C,Fi=new C,Oi=new C,Sl=new C,Uo=new C,No=new C,Fo=new C,Oo=new je,Bo=new je,zo=new je;class Yt{constructor(e=new C,t=new C,n=new C){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),sn.subVectors(e,t),s.cross(sn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){sn.subVectors(s,t),Tn.subVectors(n,t),Do.subVectors(e,t);const o=sn.dot(sn),a=sn.dot(Tn),c=sn.dot(Do),l=Tn.dot(Tn),u=Tn.dot(Do),h=o*l-a*a;if(h===0)return r.set(0,0,0),null;const d=1/h,f=(l*c-a*u)*d,g=(o*u-a*c)*d;return r.set(1-f-g,g,f)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,bn)===null?!1:bn.x>=0&&bn.y>=0&&bn.x+bn.y<=1}static getInterpolation(e,t,n,s,r,o,a,c){return this.getBarycoord(e,t,n,s,bn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,bn.x),c.addScaledVector(o,bn.y),c.addScaledVector(a,bn.z),c)}static getInterpolatedAttribute(e,t,n,s,r,o){return Oo.setScalar(0),Bo.setScalar(0),zo.setScalar(0),Oo.fromBufferAttribute(e,t),Bo.fromBufferAttribute(e,n),zo.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Oo,r.x),o.addScaledVector(Bo,r.y),o.addScaledVector(zo,r.z),o}static isFrontFacing(e,t,n,s){return sn.subVectors(n,t),Tn.subVectors(e,t),sn.cross(Tn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return sn.subVectors(this.c,this.b),Tn.subVectors(this.a,this.b),sn.cross(Tn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Yt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Yt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return Yt.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return Yt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Yt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,s=this.b,r=this.c;let o,a;Fi.subVectors(s,n),Oi.subVectors(r,n),Uo.subVectors(e,n);const c=Fi.dot(Uo),l=Oi.dot(Uo);if(c<=0&&l<=0)return t.copy(n);No.subVectors(e,s);const u=Fi.dot(No),h=Oi.dot(No);if(u>=0&&h<=u)return t.copy(s);const d=c*h-u*l;if(d<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(n).addScaledVector(Fi,o);Fo.subVectors(e,r);const f=Fi.dot(Fo),g=Oi.dot(Fo);if(g>=0&&f<=g)return t.copy(r);const _=f*l-c*g;if(_<=0&&l>=0&&g<=0)return a=l/(l-g),t.copy(n).addScaledVector(Oi,a);const m=u*g-f*h;if(m<=0&&h-u>=0&&f-g>=0)return Sl.subVectors(r,s),a=(h-u)/(h-u+(f-g)),t.copy(s).addScaledVector(Sl,a);const p=1/(m+_+d);return o=_*p,a=d*p,t.copy(n).addScaledVector(Fi,o).addScaledVector(Oi,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const uh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},jn={h:0,s:0,l:0},gr={h:0,s:0,l:0};function ko(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class Ae{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=xt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ke.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=ke.workingColorSpace){return this.r=e,this.g=t,this.b=n,ke.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=ke.workingColorSpace){if(e=yc(e,1),t=Lt(t,0,1),n=Lt(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=ko(o,r,e+1/3),this.g=ko(o,r,e),this.b=ko(o,r,e-1/3)}return ke.toWorkingColorSpace(this,s),this}setStyle(e,t=xt){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=xt){const n=uh[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=On(e.r),this.g=On(e.g),this.b=On(e.b),this}copyLinearToSRGB(e){return this.r=es(e.r),this.g=es(e.g),this.b=es(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=xt){return ke.fromWorkingColorSpace(Pt.copy(this),e),Math.round(Lt(Pt.r*255,0,255))*65536+Math.round(Lt(Pt.g*255,0,255))*256+Math.round(Lt(Pt.b*255,0,255))}getHexString(e=xt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ke.workingColorSpace){ke.fromWorkingColorSpace(Pt.copy(this),t);const n=Pt.r,s=Pt.g,r=Pt.b,o=Math.max(n,s,r),a=Math.min(n,s,r);let c,l;const u=(a+o)/2;if(a===o)c=0,l=0;else{const h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case n:c=(s-r)/h+(s<r?6:0);break;case s:c=(r-n)/h+2;break;case r:c=(n-s)/h+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=ke.workingColorSpace){return ke.fromWorkingColorSpace(Pt.copy(this),t),e.r=Pt.r,e.g=Pt.g,e.b=Pt.b,e}getStyle(e=xt){ke.fromWorkingColorSpace(Pt.copy(this),e);const t=Pt.r,n=Pt.g,s=Pt.b;return e!==xt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(jn),this.setHSL(jn.h+e,jn.s+t,jn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(jn),e.getHSL(gr);const n=Gs(jn.h,gr.h,t),s=Gs(jn.s,gr.s,t),r=Gs(jn.l,gr.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Pt=new Ae;Ae.NAMES=uh;let wf=0;class un extends xs{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:wf++}),this.uuid=ln(),this.name="",this.blending=$i,this.side=Bn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ma,this.blendDst=ga,this.blendEquation=yi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ae(0,0,0),this.blendAlpha=0,this.depthFunc=is,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=rl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ri,this.stencilZFail=Ri,this.stencilZPass=Ri,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==$i&&(n.blending=this.blending),this.side!==Bn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ma&&(n.blendSrc=this.blendSrc),this.blendDst!==ga&&(n.blendDst=this.blendDst),this.blendEquation!==yi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==is&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==rl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ri&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ri&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ri&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const o=[];for(const a in r){const c=r[a];delete c.metadata,o.push(c)}return o}if(t){const r=s(e.textures),o=s(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class Nn extends un{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new Ae(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new mn,this.combine=Xu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const _t=new C,_r=new Le;class tt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Qa,this.updateRanges=[],this.gpuType=cn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)_r.fromBufferAttribute(this,t),_r.applyMatrix3(e),this.setXY(t,_r.x,_r.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)_t.fromBufferAttribute(this,t),_t.applyMatrix3(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)_t.fromBufferAttribute(this,t),_t.applyMatrix4(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)_t.fromBufferAttribute(this,t),_t.applyNormalMatrix(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)_t.fromBufferAttribute(this,t),_t.transformDirection(e),this.setXYZ(t,_t.x,_t.y,_t.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=an(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=$e(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=an(t,this.array)),t}setX(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=an(t,this.array)),t}setY(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=an(t,this.array)),t}setZ(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=an(t,this.array)),t}setW(e,t){return this.normalized&&(t=$e(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),s=$e(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),s=$e(s,this.array),r=$e(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Qa&&(e.usage=this.usage),e}}class hh extends tt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class dh extends tt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Bt extends tt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Rf=0;const Xt=new we,Ho=new ct,Bi=new C,Ht=new kn,Cs=new kn,Tt=new C;class vt extends xs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Rf++}),this.uuid=ln(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(oh(e)?dh:hh)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Ue().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Xt.makeRotationFromQuaternion(e),this.applyMatrix4(Xt),this}rotateX(e){return Xt.makeRotationX(e),this.applyMatrix4(Xt),this}rotateY(e){return Xt.makeRotationY(e),this.applyMatrix4(Xt),this}rotateZ(e){return Xt.makeRotationZ(e),this.applyMatrix4(Xt),this}translate(e,t,n){return Xt.makeTranslation(e,t,n),this.applyMatrix4(Xt),this}scale(e,t,n){return Xt.makeScale(e,t,n),this.applyMatrix4(Xt),this}lookAt(e){return Ho.lookAt(e),Ho.updateMatrix(),this.applyMatrix4(Ho.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Bi).negate(),this.translate(Bi.x,Bi.y,Bi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let s=0,r=e.length;s<r;s++){const o=e[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Bt(n,3))}else{for(let n=0,s=t.count;n<s;n++){const r=e[n];t.setXYZ(n,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new kn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){const r=t[n];Ht.setFromBufferAttribute(r),this.morphTargetsRelative?(Tt.addVectors(this.boundingBox.min,Ht.min),this.boundingBox.expandByPoint(Tt),Tt.addVectors(this.boundingBox.max,Ht.max),this.boundingBox.expandByPoint(Tt)):(this.boundingBox.expandByPoint(Ht.min),this.boundingBox.expandByPoint(Ht.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new gn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new C,1/0);return}if(e){const n=this.boundingSphere.center;if(Ht.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){const a=t[r];Cs.setFromBufferAttribute(a),this.morphTargetsRelative?(Tt.addVectors(Ht.min,Cs.min),Ht.expandByPoint(Tt),Tt.addVectors(Ht.max,Cs.max),Ht.expandByPoint(Tt)):(Ht.expandByPoint(Cs.min),Ht.expandByPoint(Cs.max))}Ht.getCenter(n);let s=0;for(let r=0,o=e.count;r<o;r++)Tt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Tt));if(t)for(let r=0,o=t.length;r<o;r++){const a=t[r],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)Tt.fromBufferAttribute(a,l),c&&(Bi.fromBufferAttribute(e,l),Tt.add(Bi)),s=Math.max(s,n.distanceToSquared(Tt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new tt(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],c=[];for(let P=0;P<n.count;P++)a[P]=new C,c[P]=new C;const l=new C,u=new C,h=new C,d=new Le,f=new Le,g=new Le,_=new C,m=new C;function p(P,S,M){l.fromBufferAttribute(n,P),u.fromBufferAttribute(n,S),h.fromBufferAttribute(n,M),d.fromBufferAttribute(r,P),f.fromBufferAttribute(r,S),g.fromBufferAttribute(r,M),u.sub(l),h.sub(l),f.sub(d),g.sub(d);const R=1/(f.x*g.y-g.x*f.y);isFinite(R)&&(_.copy(u).multiplyScalar(g.y).addScaledVector(h,-f.y).multiplyScalar(R),m.copy(h).multiplyScalar(f.x).addScaledVector(u,-g.x).multiplyScalar(R),a[P].add(_),a[S].add(_),a[M].add(_),c[P].add(m),c[S].add(m),c[M].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:e.count}]);for(let P=0,S=b.length;P<S;++P){const M=b[P],R=M.start,k=M.count;for(let O=R,G=R+k;O<G;O+=3)p(e.getX(O+0),e.getX(O+1),e.getX(O+2))}const E=new C,y=new C,N=new C,w=new C;function A(P){N.fromBufferAttribute(s,P),w.copy(N);const S=a[P];E.copy(S),E.sub(N.multiplyScalar(N.dot(S))).normalize(),y.crossVectors(w,S);const R=y.dot(c[P])<0?-1:1;o.setXYZW(P,E.x,E.y,E.z,R)}for(let P=0,S=b.length;P<S;++P){const M=b[P],R=M.start,k=M.count;for(let O=R,G=R+k;O<G;O+=3)A(e.getX(O+0)),A(e.getX(O+1)),A(e.getX(O+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new tt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const s=new C,r=new C,o=new C,a=new C,c=new C,l=new C,u=new C,h=new C;if(e)for(let d=0,f=e.count;d<f;d+=3){const g=e.getX(d+0),_=e.getX(d+1),m=e.getX(d+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,m),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,_),l.fromBufferAttribute(n,m),a.add(u),c.add(u),l.add(u),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(_,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,r),h.subVectors(s,r),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Tt.fromBufferAttribute(e,t),Tt.normalize(),e.setXYZ(t,Tt.x,Tt.y,Tt.z)}toNonIndexed(){function e(a,c){const l=a.array,u=a.itemSize,h=a.normalized,d=new l.constructor(c.length*u);let f=0,g=0;for(let _=0,m=c.length;_<m;_++){a.isInterleavedBufferAttribute?f=c[_]*a.data.stride+a.offset:f=c[_]*u;for(let p=0;p<u;p++)d[g++]=l[f++]}return new tt(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new vt,n=this.index.array,s=this.attributes;for(const a in s){const c=s[a],l=e(c,n);t.setAttribute(a,l)}const r=this.morphAttributes;for(const a in r){const c=[],l=r[a];for(let u=0,h=l.length;u<h;u++){const d=l[u],f=e(d,n);c.push(f)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const s={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let h=0,d=l.length;h<d;h++){const f=l[h];u.push(f.toJSON(e.data))}u.length>0&&(s[c]=u,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const s=e.attributes;for(const l in s){const u=s[l];this.setAttribute(l,u.clone(t))}const r=e.morphAttributes;for(const l in r){const u=[],h=r[l];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let l=0,u=o.length;l<u;l++){const h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const El=new we,ui=new go,xr=new gn,Tl=new C,vr=new C,Mr=new C,yr=new C,Vo=new C,Sr=new C,bl=new C,Er=new C;class wt extends ct{constructor(e=new vt,t=new Nn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);const a=this.morphTargetInfluences;if(r&&a){Sr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const u=a[c],h=r[c];u!==0&&(Vo.fromBufferAttribute(h,e),o?Sr.addScaledVector(Vo,u):Sr.addScaledVector(Vo.sub(t),u))}t.add(Sr)}return t}raycast(e,t){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),xr.copy(n.boundingSphere),xr.applyMatrix4(r),ui.copy(e.ray).recast(e.near),!(xr.containsPoint(ui.origin)===!1&&(ui.intersectSphere(xr,Tl)===null||ui.origin.distanceToSquared(Tl)>(e.far-e.near)**2))&&(El.copy(r).invert(),ui.copy(e.ray).applyMatrix4(El),!(n.boundingBox!==null&&ui.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,ui)))}_computeIntersections(e,t,n){let s;const r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,u=r.attributes.uv1,h=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){const m=d[g],p=o[m.materialIndex],b=Math.max(m.start,f.start),E=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let y=b,N=E;y<N;y+=3){const w=a.getX(y),A=a.getX(y+1),P=a.getX(y+2);s=Tr(this,p,e,n,l,u,h,w,A,P),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{const g=Math.max(0,f.start),_=Math.min(a.count,f.start+f.count);for(let m=g,p=_;m<p;m+=3){const b=a.getX(m),E=a.getX(m+1),y=a.getX(m+2);s=Tr(this,o,e,n,l,u,h,b,E,y),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,_=d.length;g<_;g++){const m=d[g],p=o[m.materialIndex],b=Math.max(m.start,f.start),E=Math.min(c.count,Math.min(m.start+m.count,f.start+f.count));for(let y=b,N=E;y<N;y+=3){const w=y,A=y+1,P=y+2;s=Tr(this,p,e,n,l,u,h,w,A,P),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{const g=Math.max(0,f.start),_=Math.min(c.count,f.start+f.count);for(let m=g,p=_;m<p;m+=3){const b=m,E=m+1,y=m+2;s=Tr(this,o,e,n,l,u,h,b,E,y),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}}function Cf(i,e,t,n,s,r,o,a){let c;if(e.side===It?c=n.intersectTriangle(o,r,s,!0,a):c=n.intersectTriangle(s,r,o,e.side===Bn,a),c===null)return null;Er.copy(a),Er.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Er);return l<t.near||l>t.far?null:{distance:l,point:Er.clone(),object:i}}function Tr(i,e,t,n,s,r,o,a,c,l){i.getVertexPosition(a,vr),i.getVertexPosition(c,Mr),i.getVertexPosition(l,yr);const u=Cf(i,e,t,n,vr,Mr,yr,bl);if(u){const h=new C;Yt.getBarycoord(bl,vr,Mr,yr,h),s&&(u.uv=Yt.getInterpolatedAttribute(s,a,c,l,h,new Le)),r&&(u.uv1=Yt.getInterpolatedAttribute(r,a,c,l,h,new Le)),o&&(u.normal=Yt.getInterpolatedAttribute(o,a,c,l,h,new C),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a,b:c,c:l,normal:new C,materialIndex:0};Yt.getNormal(vr,Mr,yr,d.normal),u.face=d,u.barycoord=h}return u}class nr extends vt{constructor(e=1,t=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};const a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);const c=[],l=[],u=[],h=[];let d=0,f=0;g("z","y","x",-1,-1,n,t,e,o,r,0),g("z","y","x",1,-1,n,t,-e,o,r,1),g("x","z","y",1,1,e,n,t,s,o,2),g("x","z","y",1,-1,e,n,-t,s,o,3),g("x","y","z",1,-1,e,t,n,s,r,4),g("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new Bt(l,3)),this.setAttribute("normal",new Bt(u,3)),this.setAttribute("uv",new Bt(h,2));function g(_,m,p,b,E,y,N,w,A,P,S){const M=y/A,R=N/P,k=y/2,O=N/2,G=w/2,j=A+1,W=P+1;let $=0,H=0;const Z=new C;for(let ne=0;ne<W;ne++){const xe=ne*R-O;for(let Oe=0;Oe<j;Oe++){const et=Oe*M-k;Z[_]=et*b,Z[m]=xe*E,Z[p]=G,l.push(Z.x,Z.y,Z.z),Z[_]=0,Z[m]=0,Z[p]=w>0?1:-1,u.push(Z.x,Z.y,Z.z),h.push(Oe/A),h.push(1-ne/P),$+=1}}for(let ne=0;ne<P;ne++)for(let xe=0;xe<A;xe++){const Oe=d+xe+j*ne,et=d+xe+j*(ne+1),q=d+(xe+1)+j*(ne+1),te=d+(xe+1)+j*ne;c.push(Oe,et,te),c.push(et,q,te),H+=6}a.addGroup(f,H,S),f+=H,d+=$}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new nr(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function us(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function Ut(i){const e={};for(let t=0;t<i.length;t++){const n=us(i[t]);for(const s in n)e[s]=n[s]}return e}function Pf(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function fh(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ke.workingColorSpace}const Lf={clone:us,merge:Ut};var If=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Df=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ri extends un{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=If,this.fragmentShader=Df,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=us(e.uniforms),this.uniformsGroups=Pf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class ph extends ct{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new we,this.projectionMatrix=new we,this.projectionMatrixInverse=new we,this.coordinateSystem=Un}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Yn=new C,Al=new Le,wl=new Le;class At extends ph{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=ls*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Qi*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ls*2*Math.atan(Math.tan(Qi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Yn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Yn.x,Yn.y).multiplyScalar(-e/Yn.z),Yn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Yn.x,Yn.y).multiplyScalar(-e/Yn.z)}getViewSize(e,t){return this.getViewBounds(e,Al,wl),t.subVectors(wl,Al)}setViewOffset(e,t,n,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Qi*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,t-=o.offsetY*n/l,s*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const zi=-90,ki=1;class Uf extends ct{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new At(zi,ki,e,t);s.layers=this.layers,this.add(s);const r=new At(zi,ki,e,t);r.layers=this.layers,this.add(r);const o=new At(zi,ki,e,t);o.layers=this.layers,this.add(o);const a=new At(zi,ki,e,t);a.layers=this.layers,this.add(a);const c=new At(zi,ki,e,t);c.layers=this.layers,this.add(c);const l=new At(zi,ki,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,s,r,o,a,c]=t;for(const l of t)this.remove(l);if(e===Un)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===no)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,o,a,c,l,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,o),e.setRenderTarget(n,2,s),e.render(t,a),e.setRenderTarget(n,3,s),e.render(t,c),e.setRenderTarget(n,4,s),e.render(t,l),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,s),e.render(t,u),e.setRenderTarget(h,d,f),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class mh extends yt{constructor(e,t,n,s,r,o,a,c,l,u){e=e!==void 0?e:[],t=t!==void 0?t:ss,super(e,t,n,s,r,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Nf extends Ai{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new mh(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Vt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new nr(5,5,5),r=new ri({name:"CubemapFromEquirect",uniforms:us(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:It,blending:ii});r.uniforms.tEquirect.value=t;const o=new wt(s,r),a=t.minFilter;return t.minFilter===Dn&&(t.minFilter=Vt),new Uf(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,s){const r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(r)}}const Go=new C,Ff=new C,Of=new Ue;class xi{constructor(e=new C(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const s=Go.subVectors(n,t).cross(Ff.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Go),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Of.getNormalMatrix(e),s=this.coplanarPoint(Go).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const hi=new gn,br=new C;class Sc{constructor(e=new xi,t=new xi,n=new xi,s=new xi,r=new xi,o=new xi){this.planes=[e,t,n,s,r,o]}set(e,t,n,s,r,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Un){const n=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],c=s[3],l=s[4],u=s[5],h=s[6],d=s[7],f=s[8],g=s[9],_=s[10],m=s[11],p=s[12],b=s[13],E=s[14],y=s[15];if(n[0].setComponents(c-r,d-l,m-f,y-p).normalize(),n[1].setComponents(c+r,d+l,m+f,y+p).normalize(),n[2].setComponents(c+o,d+u,m+g,y+b).normalize(),n[3].setComponents(c-o,d-u,m-g,y-b).normalize(),n[4].setComponents(c-a,d-h,m-_,y-E).normalize(),t===Un)n[5].setComponents(c+a,d+h,m+_,y+E).normalize();else if(t===no)n[5].setComponents(a,h,_,E).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),hi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),hi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(hi)}intersectsSprite(e){return hi.center.set(0,0,0),hi.radius=.7071067811865476,hi.applyMatrix4(e.matrixWorld),this.intersectsSphere(hi)}intersectsSphere(e){const t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const s=t[n];if(br.x=s.normal.x>0?e.max.x:e.min.x,br.y=s.normal.y>0?e.max.y:e.min.y,br.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(br)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function gh(){let i=null,e=!1,t=null,n=null;function s(r,o){t(r,o),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Bf(i){const e=new WeakMap;function t(a,c){const l=a.array,u=a.usage,h=l.byteLength,d=i.createBuffer();i.bindBuffer(c,d),i.bufferData(c,l,u),a.onUploadCallback();let f;if(l instanceof Float32Array)f=i.FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=i.SHORT;else if(l instanceof Uint32Array)f=i.UNSIGNED_INT;else if(l instanceof Int32Array)f=i.INT;else if(l instanceof Int8Array)f=i.BYTE;else if(l instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,c,l){const u=c.array,h=c.updateRanges;if(i.bindBuffer(l,a),h.length===0)i.bufferSubData(l,0,u);else{h.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<h.length;f++){const g=h[d],_=h[f];_.start<=g.start+g.count+1?g.count=Math.max(g.count,_.start+_.count-g.start):(++d,h[d]=_)}h.length=d+1;for(let f=0,g=h.length;f<g;f++){const _=h[f];i.bufferSubData(l,_.start*u.BYTES_PER_ELEMENT,u,_.start,_.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);const c=e.get(a);c&&(i.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}class _o extends vt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};const r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(s),l=a+1,u=c+1,h=e/a,d=t/c,f=[],g=[],_=[],m=[];for(let p=0;p<u;p++){const b=p*d-o;for(let E=0;E<l;E++){const y=E*h-r;g.push(y,-b,0),_.push(0,0,1),m.push(E/a),m.push(1-p/c)}}for(let p=0;p<c;p++)for(let b=0;b<a;b++){const E=b+l*p,y=b+l*(p+1),N=b+1+l*(p+1),w=b+1+l*p;f.push(E,y,w),f.push(y,N,w)}this.setIndex(f),this.setAttribute("position",new Bt(g,3)),this.setAttribute("normal",new Bt(_,3)),this.setAttribute("uv",new Bt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new _o(e.width,e.height,e.widthSegments,e.heightSegments)}}var zf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,kf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Hf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Vf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Gf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Wf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Xf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,qf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,jf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Yf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Kf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Zf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,$f=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Jf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Qf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,ep=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,tp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,np=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ip=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,sp=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,rp=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,op=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,ap=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,cp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,lp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,up=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,hp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,dp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,fp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,pp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,mp="gl_FragColor = linearToOutputTexel( gl_FragColor );",gp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,_p=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,xp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,vp=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Mp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,yp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Sp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ep=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Tp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,bp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ap=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,wp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Rp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Cp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Pp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Lp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Ip=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Dp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Up=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Np=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Fp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Op=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Bp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,zp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,kp=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Hp=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Vp=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Gp=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Wp=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Xp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,qp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,jp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Yp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Kp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Zp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,$p=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Jp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Qp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,em=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,tm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,nm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,im=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,sm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,rm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,om=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,am=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,cm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,lm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,um=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,hm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,dm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,fm=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,pm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,mm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,gm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,_m=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,xm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,vm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Mm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,ym=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Sm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Em=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Tm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,bm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Am=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,wm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Rm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Cm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Pm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Lm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Im=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Dm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Um=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Nm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Fm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Om=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Bm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,zm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,km=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Hm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Vm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Gm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Wm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Xm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,qm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,jm=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Ym=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Km=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,$m=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Jm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Qm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,eg=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,tg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ng=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,ig=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,sg=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,rg=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,og=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ag=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cg=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,lg=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ug=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,hg=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,dg=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,fg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,pg=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mg=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,gg=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,_g=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Fe={alphahash_fragment:zf,alphahash_pars_fragment:kf,alphamap_fragment:Hf,alphamap_pars_fragment:Vf,alphatest_fragment:Gf,alphatest_pars_fragment:Wf,aomap_fragment:Xf,aomap_pars_fragment:qf,batching_pars_vertex:jf,batching_vertex:Yf,begin_vertex:Kf,beginnormal_vertex:Zf,bsdfs:$f,iridescence_fragment:Jf,bumpmap_pars_fragment:Qf,clipping_planes_fragment:ep,clipping_planes_pars_fragment:tp,clipping_planes_pars_vertex:np,clipping_planes_vertex:ip,color_fragment:sp,color_pars_fragment:rp,color_pars_vertex:op,color_vertex:ap,common:cp,cube_uv_reflection_fragment:lp,defaultnormal_vertex:up,displacementmap_pars_vertex:hp,displacementmap_vertex:dp,emissivemap_fragment:fp,emissivemap_pars_fragment:pp,colorspace_fragment:mp,colorspace_pars_fragment:gp,envmap_fragment:_p,envmap_common_pars_fragment:xp,envmap_pars_fragment:vp,envmap_pars_vertex:Mp,envmap_physical_pars_fragment:Lp,envmap_vertex:yp,fog_vertex:Sp,fog_pars_vertex:Ep,fog_fragment:Tp,fog_pars_fragment:bp,gradientmap_pars_fragment:Ap,lightmap_pars_fragment:wp,lights_lambert_fragment:Rp,lights_lambert_pars_fragment:Cp,lights_pars_begin:Pp,lights_toon_fragment:Ip,lights_toon_pars_fragment:Dp,lights_phong_fragment:Up,lights_phong_pars_fragment:Np,lights_physical_fragment:Fp,lights_physical_pars_fragment:Op,lights_fragment_begin:Bp,lights_fragment_maps:zp,lights_fragment_end:kp,logdepthbuf_fragment:Hp,logdepthbuf_pars_fragment:Vp,logdepthbuf_pars_vertex:Gp,logdepthbuf_vertex:Wp,map_fragment:Xp,map_pars_fragment:qp,map_particle_fragment:jp,map_particle_pars_fragment:Yp,metalnessmap_fragment:Kp,metalnessmap_pars_fragment:Zp,morphinstance_vertex:$p,morphcolor_vertex:Jp,morphnormal_vertex:Qp,morphtarget_pars_vertex:em,morphtarget_vertex:tm,normal_fragment_begin:nm,normal_fragment_maps:im,normal_pars_fragment:sm,normal_pars_vertex:rm,normal_vertex:om,normalmap_pars_fragment:am,clearcoat_normal_fragment_begin:cm,clearcoat_normal_fragment_maps:lm,clearcoat_pars_fragment:um,iridescence_pars_fragment:hm,opaque_fragment:dm,packing:fm,premultiplied_alpha_fragment:pm,project_vertex:mm,dithering_fragment:gm,dithering_pars_fragment:_m,roughnessmap_fragment:xm,roughnessmap_pars_fragment:vm,shadowmap_pars_fragment:Mm,shadowmap_pars_vertex:ym,shadowmap_vertex:Sm,shadowmask_pars_fragment:Em,skinbase_vertex:Tm,skinning_pars_vertex:bm,skinning_vertex:Am,skinnormal_vertex:wm,specularmap_fragment:Rm,specularmap_pars_fragment:Cm,tonemapping_fragment:Pm,tonemapping_pars_fragment:Lm,transmission_fragment:Im,transmission_pars_fragment:Dm,uv_pars_fragment:Um,uv_pars_vertex:Nm,uv_vertex:Fm,worldpos_vertex:Om,background_vert:Bm,background_frag:zm,backgroundCube_vert:km,backgroundCube_frag:Hm,cube_vert:Vm,cube_frag:Gm,depth_vert:Wm,depth_frag:Xm,distanceRGBA_vert:qm,distanceRGBA_frag:jm,equirect_vert:Ym,equirect_frag:Km,linedashed_vert:Zm,linedashed_frag:$m,meshbasic_vert:Jm,meshbasic_frag:Qm,meshlambert_vert:eg,meshlambert_frag:tg,meshmatcap_vert:ng,meshmatcap_frag:ig,meshnormal_vert:sg,meshnormal_frag:rg,meshphong_vert:og,meshphong_frag:ag,meshphysical_vert:cg,meshphysical_frag:lg,meshtoon_vert:ug,meshtoon_frag:hg,points_vert:dg,points_frag:fg,shadow_vert:pg,shadow_frag:mg,sprite_vert:gg,sprite_frag:_g},ie={common:{diffuse:{value:new Ae(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ue}},envmap:{envMap:{value:null},envMapRotation:{value:new Ue},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ue}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ue}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ue},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ue},normalScale:{value:new Le(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ue},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ue}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ue}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ue}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ae(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ae(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0},uvTransform:{value:new Ue}},sprite:{diffuse:{value:new Ae(16777215)},opacity:{value:1},center:{value:new Le(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}}},dn={basic:{uniforms:Ut([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.fog]),vertexShader:Fe.meshbasic_vert,fragmentShader:Fe.meshbasic_frag},lambert:{uniforms:Ut([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,ie.lights,{emissive:{value:new Ae(0)}}]),vertexShader:Fe.meshlambert_vert,fragmentShader:Fe.meshlambert_frag},phong:{uniforms:Ut([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,ie.lights,{emissive:{value:new Ae(0)},specular:{value:new Ae(1118481)},shininess:{value:30}}]),vertexShader:Fe.meshphong_vert,fragmentShader:Fe.meshphong_frag},standard:{uniforms:Ut([ie.common,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.roughnessmap,ie.metalnessmap,ie.fog,ie.lights,{emissive:{value:new Ae(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag},toon:{uniforms:Ut([ie.common,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.gradientmap,ie.fog,ie.lights,{emissive:{value:new Ae(0)}}]),vertexShader:Fe.meshtoon_vert,fragmentShader:Fe.meshtoon_frag},matcap:{uniforms:Ut([ie.common,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,{matcap:{value:null}}]),vertexShader:Fe.meshmatcap_vert,fragmentShader:Fe.meshmatcap_frag},points:{uniforms:Ut([ie.points,ie.fog]),vertexShader:Fe.points_vert,fragmentShader:Fe.points_frag},dashed:{uniforms:Ut([ie.common,ie.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Fe.linedashed_vert,fragmentShader:Fe.linedashed_frag},depth:{uniforms:Ut([ie.common,ie.displacementmap]),vertexShader:Fe.depth_vert,fragmentShader:Fe.depth_frag},normal:{uniforms:Ut([ie.common,ie.bumpmap,ie.normalmap,ie.displacementmap,{opacity:{value:1}}]),vertexShader:Fe.meshnormal_vert,fragmentShader:Fe.meshnormal_frag},sprite:{uniforms:Ut([ie.sprite,ie.fog]),vertexShader:Fe.sprite_vert,fragmentShader:Fe.sprite_frag},background:{uniforms:{uvTransform:{value:new Ue},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Fe.background_vert,fragmentShader:Fe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ue}},vertexShader:Fe.backgroundCube_vert,fragmentShader:Fe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Fe.cube_vert,fragmentShader:Fe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Fe.equirect_vert,fragmentShader:Fe.equirect_frag},distanceRGBA:{uniforms:Ut([ie.common,ie.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Fe.distanceRGBA_vert,fragmentShader:Fe.distanceRGBA_frag},shadow:{uniforms:Ut([ie.lights,ie.fog,{color:{value:new Ae(0)},opacity:{value:1}}]),vertexShader:Fe.shadow_vert,fragmentShader:Fe.shadow_frag}};dn.physical={uniforms:Ut([dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ue},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ue},clearcoatNormalScale:{value:new Le(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ue},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ue},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ue},sheen:{value:0},sheenColor:{value:new Ae(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ue},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ue},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ue},transmissionSamplerSize:{value:new Le},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ue},attenuationDistance:{value:0},attenuationColor:{value:new Ae(0)},specularColor:{value:new Ae(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ue},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ue},anisotropyVector:{value:new Le},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ue}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag};const Ar={r:0,b:0,g:0},di=new mn,xg=new we;function vg(i,e,t,n,s,r,o){const a=new Ae(0);let c=r===!0?0:1,l,u,h=null,d=0,f=null;function g(b){let E=b.isScene===!0?b.background:null;return E&&E.isTexture&&(E=(b.backgroundBlurriness>0?t:e).get(E)),E}function _(b){let E=!1;const y=g(b);y===null?p(a,c):y&&y.isColor&&(p(y,1),E=!0);const N=i.xr.getEnvironmentBlendMode();N==="additive"?n.buffers.color.setClear(0,0,0,1,o):N==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||E)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(b,E){const y=g(E);y&&(y.isCubeTexture||y.mapping===po)?(u===void 0&&(u=new wt(new nr(1,1,1),new ri({name:"BackgroundCubeMaterial",uniforms:us(dn.backgroundCube.uniforms),vertexShader:dn.backgroundCube.vertexShader,fragmentShader:dn.backgroundCube.fragmentShader,side:It,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(N,w,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),di.copy(E.backgroundRotation),di.x*=-1,di.y*=-1,di.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(di.y*=-1,di.z*=-1),u.material.uniforms.envMap.value=y,u.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(xg.makeRotationFromEuler(di)),u.material.toneMapped=ke.getTransfer(y.colorSpace)!==Qe,(h!==y||d!==y.version||f!==i.toneMapping)&&(u.material.needsUpdate=!0,h=y,d=y.version,f=i.toneMapping),u.layers.enableAll(),b.unshift(u,u.geometry,u.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new wt(new _o(2,2),new ri({name:"BackgroundMaterial",uniforms:us(dn.background.uniforms),vertexShader:dn.background.vertexShader,fragmentShader:dn.background.fragmentShader,side:Bn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.toneMapped=ke.getTransfer(y.colorSpace)!==Qe,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(h!==y||d!==y.version||f!==i.toneMapping)&&(l.material.needsUpdate=!0,h=y,d=y.version,f=i.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null))}function p(b,E){b.getRGB(Ar,fh(i)),n.buffers.color.setClear(Ar.r,Ar.g,Ar.b,E,o)}return{getClearColor:function(){return a},setClearColor:function(b,E=1){a.set(b),c=E,p(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(b){c=b,p(a,c)},render:_,addToRenderList:m}}function Mg(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let r=s,o=!1;function a(M,R,k,O,G){let j=!1;const W=h(O,k,R);r!==W&&(r=W,l(r.object)),j=f(M,O,k,G),j&&g(M,O,k,G),G!==null&&e.update(G,i.ELEMENT_ARRAY_BUFFER),(j||o)&&(o=!1,y(M,R,k,O),G!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(G).buffer))}function c(){return i.createVertexArray()}function l(M){return i.bindVertexArray(M)}function u(M){return i.deleteVertexArray(M)}function h(M,R,k){const O=k.wireframe===!0;let G=n[M.id];G===void 0&&(G={},n[M.id]=G);let j=G[R.id];j===void 0&&(j={},G[R.id]=j);let W=j[O];return W===void 0&&(W=d(c()),j[O]=W),W}function d(M){const R=[],k=[],O=[];for(let G=0;G<t;G++)R[G]=0,k[G]=0,O[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:R,enabledAttributes:k,attributeDivisors:O,object:M,attributes:{},index:null}}function f(M,R,k,O){const G=r.attributes,j=R.attributes;let W=0;const $=k.getAttributes();for(const H in $)if($[H].location>=0){const ne=G[H];let xe=j[H];if(xe===void 0&&(H==="instanceMatrix"&&M.instanceMatrix&&(xe=M.instanceMatrix),H==="instanceColor"&&M.instanceColor&&(xe=M.instanceColor)),ne===void 0||ne.attribute!==xe||xe&&ne.data!==xe.data)return!0;W++}return r.attributesNum!==W||r.index!==O}function g(M,R,k,O){const G={},j=R.attributes;let W=0;const $=k.getAttributes();for(const H in $)if($[H].location>=0){let ne=j[H];ne===void 0&&(H==="instanceMatrix"&&M.instanceMatrix&&(ne=M.instanceMatrix),H==="instanceColor"&&M.instanceColor&&(ne=M.instanceColor));const xe={};xe.attribute=ne,ne&&ne.data&&(xe.data=ne.data),G[H]=xe,W++}r.attributes=G,r.attributesNum=W,r.index=O}function _(){const M=r.newAttributes;for(let R=0,k=M.length;R<k;R++)M[R]=0}function m(M){p(M,0)}function p(M,R){const k=r.newAttributes,O=r.enabledAttributes,G=r.attributeDivisors;k[M]=1,O[M]===0&&(i.enableVertexAttribArray(M),O[M]=1),G[M]!==R&&(i.vertexAttribDivisor(M,R),G[M]=R)}function b(){const M=r.newAttributes,R=r.enabledAttributes;for(let k=0,O=R.length;k<O;k++)R[k]!==M[k]&&(i.disableVertexAttribArray(k),R[k]=0)}function E(M,R,k,O,G,j,W){W===!0?i.vertexAttribIPointer(M,R,k,G,j):i.vertexAttribPointer(M,R,k,O,G,j)}function y(M,R,k,O){_();const G=O.attributes,j=k.getAttributes(),W=R.defaultAttributeValues;for(const $ in j){const H=j[$];if(H.location>=0){let Z=G[$];if(Z===void 0&&($==="instanceMatrix"&&M.instanceMatrix&&(Z=M.instanceMatrix),$==="instanceColor"&&M.instanceColor&&(Z=M.instanceColor)),Z!==void 0){const ne=Z.normalized,xe=Z.itemSize,Oe=e.get(Z);if(Oe===void 0)continue;const et=Oe.buffer,q=Oe.type,te=Oe.bytesPerElement,_e=q===i.INT||q===i.UNSIGNED_INT||Z.gpuType===pc;if(Z.isInterleavedBufferAttribute){const re=Z.data,Te=re.stride,Pe=Z.offset;if(re.isInstancedInterleavedBuffer){for(let Be=0;Be<H.locationSize;Be++)p(H.location+Be,re.meshPerAttribute);M.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=re.meshPerAttribute*re.count)}else for(let Be=0;Be<H.locationSize;Be++)m(H.location+Be);i.bindBuffer(i.ARRAY_BUFFER,et);for(let Be=0;Be<H.locationSize;Be++)E(H.location+Be,xe/H.locationSize,q,ne,Te*te,(Pe+xe/H.locationSize*Be)*te,_e)}else{if(Z.isInstancedBufferAttribute){for(let re=0;re<H.locationSize;re++)p(H.location+re,Z.meshPerAttribute);M.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let re=0;re<H.locationSize;re++)m(H.location+re);i.bindBuffer(i.ARRAY_BUFFER,et);for(let re=0;re<H.locationSize;re++)E(H.location+re,xe/H.locationSize,q,ne,xe*te,xe/H.locationSize*re*te,_e)}}else if(W!==void 0){const ne=W[$];if(ne!==void 0)switch(ne.length){case 2:i.vertexAttrib2fv(H.location,ne);break;case 3:i.vertexAttrib3fv(H.location,ne);break;case 4:i.vertexAttrib4fv(H.location,ne);break;default:i.vertexAttrib1fv(H.location,ne)}}}}b()}function N(){P();for(const M in n){const R=n[M];for(const k in R){const O=R[k];for(const G in O)u(O[G].object),delete O[G];delete R[k]}delete n[M]}}function w(M){if(n[M.id]===void 0)return;const R=n[M.id];for(const k in R){const O=R[k];for(const G in O)u(O[G].object),delete O[G];delete R[k]}delete n[M.id]}function A(M){for(const R in n){const k=n[R];if(k[M.id]===void 0)continue;const O=k[M.id];for(const G in O)u(O[G].object),delete O[G];delete k[M.id]}}function P(){S(),o=!0,r!==s&&(r=s,l(r.object))}function S(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:P,resetDefaultState:S,dispose:N,releaseStatesOfGeometry:w,releaseStatesOfProgram:A,initAttributes:_,enableAttribute:m,disableUnusedAttributes:b}}function yg(i,e,t){let n;function s(l){n=l}function r(l,u){i.drawArrays(n,l,u),t.update(u,n,1)}function o(l,u,h){h!==0&&(i.drawArraysInstanced(n,l,u,h),t.update(u,n,h))}function a(l,u,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,u,0,h);let f=0;for(let g=0;g<h;g++)f+=u[g];t.update(f,n,1)}function c(l,u,h,d){if(h===0)return;const f=e.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<l.length;g++)o(l[g],u[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,l,0,u,0,d,0,h);let g=0;for(let _=0;_<h;_++)g+=u[_]*d[_];t.update(g,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function Sg(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){const A=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(A){return!(A!==$t&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(A){const P=A===tr&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==zn&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==cn&&!P)}function c(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const u=c(l);u!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);const h=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),b=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),E=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),N=g>0,w=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:h,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:_,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:b,maxVaryings:E,maxFragmentUniforms:y,vertexTextures:N,maxSamples:w}}function Eg(i){const e=this;let t=null,n=0,s=!1,r=!1;const o=new xi,a=new Ue,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const f=h.length!==0||d||n!==0||s;return s=d,n=h.length,f},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,f){const g=h.clippingPlanes,_=h.clipIntersection,m=h.clipShadows,p=i.get(h);if(!s||g===null||g.length===0||r&&!m)r?u(null):l();else{const b=r?0:n,E=b*4;let y=p.clippingState||null;c.value=y,y=u(g,d,E,f);for(let N=0;N!==E;++N)y[N]=t[N];p.clippingState=y,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=b}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,d,f,g){const _=h!==null?h.length:0;let m=null;if(_!==0){if(m=c.value,g!==!0||m===null){const p=f+_*4,b=d.matrixWorldInverse;a.getNormalMatrix(b),(m===null||m.length<p)&&(m=new Float32Array(p));for(let E=0,y=f;E!==_;++E,y+=4)o.copy(h[E]).applyMatrix4(b,a),o.normal.toArray(m,y),m[y+3]=o.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}function Tg(i){let e=new WeakMap;function t(o,a){return a===Ta?o.mapping=ss:a===ba&&(o.mapping=rs),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Ta||a===ba)if(e.has(o)){const c=e.get(o).texture;return t(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new Nf(c.height);return l.fromEquirectangularTexture(i,o),e.set(o,l),o.addEventListener("dispose",s),t(l.texture,o.mapping)}else return null}}return o}function s(o){const a=o.target;a.removeEventListener("dispose",s);const c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}class Ec extends ph{constructor(e=-1,t=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-e,o=n+e,a=s+t,c=s-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Ki=4,Rl=[.125,.215,.35,.446,.526,.582],Si=20,Wo=new Ec,Cl=new Ae;let Xo=null,qo=0,jo=0,Yo=!1;const vi=(1+Math.sqrt(5))/2,Hi=1/vi,Pl=[new C(-vi,Hi,0),new C(vi,Hi,0),new C(-Hi,0,vi),new C(Hi,0,vi),new C(0,vi,-Hi),new C(0,vi,Hi),new C(-1,1,-1),new C(1,1,-1),new C(-1,1,1),new C(1,1,1)];class Ll{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){Xo=this._renderer.getRenderTarget(),qo=this._renderer.getActiveCubeFace(),jo=this._renderer.getActiveMipmapLevel(),Yo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ul(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Dl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Xo,qo,jo),this._renderer.xr.enabled=Yo,e.scissorTest=!1,wr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ss||e.mapping===rs?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Xo=this._renderer.getRenderTarget(),qo=this._renderer.getActiveCubeFace(),jo=this._renderer.getActiveMipmapLevel(),Yo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Vt,minFilter:Vt,generateMipmaps:!1,type:tr,format:$t,colorSpace:Ft,depthBuffer:!1},s=Il(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Il(e,t,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=bg(r)),this._blurMaterial=Ag(r,e,t)}return s}_compileMaterial(e){const t=new wt(this._lodPlanes[0],e);this._renderer.compile(t,Wo)}_sceneToCubeUV(e,t,n,s){const a=new At(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(Cl),u.toneMapping=si,u.autoClear=!1;const f=new Nn({name:"PMREM.Background",side:It,depthWrite:!1,depthTest:!1}),g=new wt(new nr,f);let _=!1;const m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,_=!0):(f.color.copy(Cl),_=!0);for(let p=0;p<6;p++){const b=p%3;b===0?(a.up.set(0,c[p],0),a.lookAt(l[p],0,0)):b===1?(a.up.set(0,0,c[p]),a.lookAt(0,l[p],0)):(a.up.set(0,c[p],0),a.lookAt(0,0,l[p]));const E=this._cubeSize;wr(s,b*E,p>2?E:0,E,E),u.setRenderTarget(s),_&&u.render(g,a),u.render(e,a)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=h,e.background=m}_textureToCubeUV(e,t){const n=this._renderer,s=e.mapping===ss||e.mapping===rs;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ul()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Dl());const r=s?this._cubemapMaterial:this._equirectMaterial,o=new wt(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;const c=this._cubeSize;wr(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,Wo)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Pl[(s-r-1)%Pl.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,s,r){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,s,"latitudinal",r),this._halfBlur(o,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new wt(this._lodPlanes[s],l),d=l.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Si-1),_=r/g,m=isFinite(r)?1+Math.floor(u*_):Si;m>Si&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Si}`);const p=[];let b=0;for(let A=0;A<Si;++A){const P=A/_,S=Math.exp(-P*P/2);p.push(S),A===0?b+=S:A<m&&(b+=2*S)}for(let A=0;A<p.length;A++)p[A]=p[A]/b;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:E}=this;d.dTheta.value=g,d.mipInt.value=E-n;const y=this._sizeLods[s],N=3*y*(s>E-Ki?s-E+Ki:0),w=4*(this._cubeSize-y);wr(t,N,w,3*y,2*y),c.setRenderTarget(t),c.render(h,Wo)}}function bg(i){const e=[],t=[],n=[];let s=i;const r=i-Ki+1+Rl.length;for(let o=0;o<r;o++){const a=Math.pow(2,s);t.push(a);let c=1/a;o>i-Ki?c=Rl[o-i+Ki-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),u=-l,h=1+l,d=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,g=6,_=3,m=2,p=1,b=new Float32Array(_*g*f),E=new Float32Array(m*g*f),y=new Float32Array(p*g*f);for(let w=0;w<f;w++){const A=w%3*2/3-1,P=w>2?0:-1,S=[A,P,0,A+2/3,P,0,A+2/3,P+1,0,A,P,0,A+2/3,P+1,0,A,P+1,0];b.set(S,_*g*w),E.set(d,m*g*w);const M=[w,w,w,w,w,w];y.set(M,p*g*w)}const N=new vt;N.setAttribute("position",new tt(b,_)),N.setAttribute("uv",new tt(E,m)),N.setAttribute("faceIndex",new tt(y,p)),e.push(N),s>Ki&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Il(i,e,t){const n=new Ai(i,e,t);return n.texture.mapping=po,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function wr(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function Ag(i,e,t){const n=new Float32Array(Si),s=new C(0,1,0);return new ri({name:"SphericalGaussianBlur",defines:{n:Si,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Tc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ii,depthTest:!1,depthWrite:!1})}function Dl(){return new ri({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Tc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ii,depthTest:!1,depthWrite:!1})}function Ul(){return new ri({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Tc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ii,depthTest:!1,depthWrite:!1})}function Tc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function wg(i){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===Ta||c===ba,u=c===ss||c===rs;if(l||u){let h=e.get(a);const d=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return t===null&&(t=new Ll(i)),h=l?t.fromEquirectangular(a,h):t.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,e.set(a,h),h.texture;if(h!==void 0)return h.texture;{const f=a.image;return l&&f&&f.height>0||u&&f&&s(f)?(t===null&&(t=new Ll(i)),h=l?t.fromEquirectangular(a):t.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,e.set(a,h),a.addEventListener("dispose",r),h.texture):null}}}return a}function s(a){let c=0;const l=6;for(let u=0;u<l;u++)a[u]!==void 0&&c++;return c===l}function r(a){const c=a.target;c.removeEventListener("dispose",r);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function Rg(i){const e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const s=t(n);return s===null&&zs("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Cg(i,e,t,n){const s={},r=new WeakMap;function o(h){const d=h.target;d.index!==null&&e.remove(d.index);for(const g in d.attributes)e.remove(d.attributes[g]);for(const g in d.morphAttributes){const _=d.morphAttributes[g];for(let m=0,p=_.length;m<p;m++)e.remove(_[m])}d.removeEventListener("dispose",o),delete s[d.id];const f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(h,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,t.memory.geometries++),d}function c(h){const d=h.attributes;for(const g in d)e.update(d[g],i.ARRAY_BUFFER);const f=h.morphAttributes;for(const g in f){const _=f[g];for(let m=0,p=_.length;m<p;m++)e.update(_[m],i.ARRAY_BUFFER)}}function l(h){const d=[],f=h.index,g=h.attributes.position;let _=0;if(f!==null){const b=f.array;_=f.version;for(let E=0,y=b.length;E<y;E+=3){const N=b[E+0],w=b[E+1],A=b[E+2];d.push(N,w,w,A,A,N)}}else if(g!==void 0){const b=g.array;_=g.version;for(let E=0,y=b.length/3-1;E<y;E+=3){const N=E+0,w=E+1,A=E+2;d.push(N,w,w,A,A,N)}}else return;const m=new(oh(d)?dh:hh)(d,1);m.version=_;const p=r.get(h);p&&e.remove(p),r.set(h,m)}function u(h){const d=r.get(h);if(d){const f=h.index;f!==null&&d.version<f.version&&l(h)}else l(h);return r.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function Pg(i,e,t){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function c(d,f){i.drawElements(n,f,r,d*o),t.update(f,n,1)}function l(d,f,g){g!==0&&(i.drawElementsInstanced(n,f,r,d*o,g),t.update(f,n,g))}function u(d,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];t.update(m,n,1)}function h(d,f,g,_){if(g===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)l(d[p]/o,f[p],_[p]);else{m.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,_,0,g);let p=0;for(let b=0;b<g;b++)p+=f[b]*_[b];t.update(p,n,1)}}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function Lg(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(r/3);break;case i.LINES:t.lines+=a*(r/2);break;case i.LINE_STRIP:t.lines+=a*(r-1);break;case i.LINE_LOOP:t.lines+=a*r;break;case i.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Ig(i,e,t){const n=new WeakMap,s=new je;function r(o,a,c){const l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let d=n.get(a);if(d===void 0||d.count!==h){let M=function(){P.dispose(),n.delete(a),a.removeEventListener("dispose",M)};var f=M;d!==void 0&&d.texture.dispose();const g=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,m=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],b=a.morphAttributes.normal||[],E=a.morphAttributes.color||[];let y=0;g===!0&&(y=1),_===!0&&(y=2),m===!0&&(y=3);let N=a.attributes.position.count*y,w=1;N>e.maxTextureSize&&(w=Math.ceil(N/e.maxTextureSize),N=e.maxTextureSize);const A=new Float32Array(N*w*4*h),P=new ch(A,N,w,h);P.type=cn,P.needsUpdate=!0;const S=y*4;for(let R=0;R<h;R++){const k=p[R],O=b[R],G=E[R],j=N*w*4*R;for(let W=0;W<k.count;W++){const $=W*S;g===!0&&(s.fromBufferAttribute(k,W),A[j+$+0]=s.x,A[j+$+1]=s.y,A[j+$+2]=s.z,A[j+$+3]=0),_===!0&&(s.fromBufferAttribute(O,W),A[j+$+4]=s.x,A[j+$+5]=s.y,A[j+$+6]=s.z,A[j+$+7]=0),m===!0&&(s.fromBufferAttribute(G,W),A[j+$+8]=s.x,A[j+$+9]=s.y,A[j+$+10]=s.z,A[j+$+11]=G.itemSize===4?s.w:1)}}d={count:h,texture:P,size:new Le(N,w)},n.set(a,d),a.addEventListener("dispose",M)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else{let g=0;for(let m=0;m<l.length;m++)g+=l[m];const _=a.morphTargetsRelative?1:1-g;c.getUniforms().setValue(i,"morphTargetBaseInfluence",_),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function Dg(i,e,t,n){let s=new WeakMap;function r(c){const l=n.render.frame,u=c.geometry,h=e.get(c,u);if(s.get(h)!==l&&(e.update(h),s.set(h,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),s.get(c)!==l&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){const d=c.skeleton;s.get(d)!==l&&(d.update(),s.set(d,l))}return h}function o(){s=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}class _h extends yt{constructor(e,t,n,s,r,o,a,c,l,u=Ji){if(u!==Ji&&u!==cs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===Ji&&(n=bi),n===void 0&&u===cs&&(n=as),super(null,s,r,o,a,c,u,n,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:Nt,this.minFilter=c!==void 0?c:Nt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const xh=new yt,Nl=new _h(1,1),vh=new ch,Mh=new vf,yh=new mh,Fl=[],Ol=[],Bl=new Float32Array(16),zl=new Float32Array(9),kl=new Float32Array(4);function vs(i,e,t){const n=i[0];if(n<=0||n>0)return i;const s=e*t;let r=Fl[s];if(r===void 0&&(r=new Float32Array(s),Fl[s]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(r,a)}return r}function St(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Et(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function xo(i,e){let t=Ol[e];t===void 0&&(t=new Int32Array(e),Ol[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Ug(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Ng(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;i.uniform2fv(this.addr,e),Et(t,e)}}function Fg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(St(t,e))return;i.uniform3fv(this.addr,e),Et(t,e)}}function Og(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;i.uniform4fv(this.addr,e),Et(t,e)}}function Bg(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Et(t,e)}else{if(St(t,n))return;kl.set(n),i.uniformMatrix2fv(this.addr,!1,kl),Et(t,n)}}function zg(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Et(t,e)}else{if(St(t,n))return;zl.set(n),i.uniformMatrix3fv(this.addr,!1,zl),Et(t,n)}}function kg(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(St(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Et(t,e)}else{if(St(t,n))return;Bl.set(n),i.uniformMatrix4fv(this.addr,!1,Bl),Et(t,n)}}function Hg(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Vg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;i.uniform2iv(this.addr,e),Et(t,e)}}function Gg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;i.uniform3iv(this.addr,e),Et(t,e)}}function Wg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;i.uniform4iv(this.addr,e),Et(t,e)}}function Xg(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function qg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(St(t,e))return;i.uniform2uiv(this.addr,e),Et(t,e)}}function jg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(St(t,e))return;i.uniform3uiv(this.addr,e),Et(t,e)}}function Yg(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(St(t,e))return;i.uniform4uiv(this.addr,e),Et(t,e)}}function Kg(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Nl.compareFunction=rh,r=Nl):r=xh,t.setTexture2D(e||r,s)}function Zg(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Mh,s)}function $g(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||yh,s)}function Jg(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||vh,s)}function Qg(i){switch(i){case 5126:return Ug;case 35664:return Ng;case 35665:return Fg;case 35666:return Og;case 35674:return Bg;case 35675:return zg;case 35676:return kg;case 5124:case 35670:return Hg;case 35667:case 35671:return Vg;case 35668:case 35672:return Gg;case 35669:case 35673:return Wg;case 5125:return Xg;case 36294:return qg;case 36295:return jg;case 36296:return Yg;case 35678:case 36198:case 36298:case 36306:case 35682:return Kg;case 35679:case 36299:case 36307:return Zg;case 35680:case 36300:case 36308:case 36293:return $g;case 36289:case 36303:case 36311:case 36292:return Jg}}function e_(i,e){i.uniform1fv(this.addr,e)}function t_(i,e){const t=vs(e,this.size,2);i.uniform2fv(this.addr,t)}function n_(i,e){const t=vs(e,this.size,3);i.uniform3fv(this.addr,t)}function i_(i,e){const t=vs(e,this.size,4);i.uniform4fv(this.addr,t)}function s_(i,e){const t=vs(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function r_(i,e){const t=vs(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function o_(i,e){const t=vs(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function a_(i,e){i.uniform1iv(this.addr,e)}function c_(i,e){i.uniform2iv(this.addr,e)}function l_(i,e){i.uniform3iv(this.addr,e)}function u_(i,e){i.uniform4iv(this.addr,e)}function h_(i,e){i.uniform1uiv(this.addr,e)}function d_(i,e){i.uniform2uiv(this.addr,e)}function f_(i,e){i.uniform3uiv(this.addr,e)}function p_(i,e){i.uniform4uiv(this.addr,e)}function m_(i,e,t){const n=this.cache,s=e.length,r=xo(t,s);St(n,r)||(i.uniform1iv(this.addr,r),Et(n,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||xh,r[o])}function g_(i,e,t){const n=this.cache,s=e.length,r=xo(t,s);St(n,r)||(i.uniform1iv(this.addr,r),Et(n,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||Mh,r[o])}function __(i,e,t){const n=this.cache,s=e.length,r=xo(t,s);St(n,r)||(i.uniform1iv(this.addr,r),Et(n,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||yh,r[o])}function x_(i,e,t){const n=this.cache,s=e.length,r=xo(t,s);St(n,r)||(i.uniform1iv(this.addr,r),Et(n,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||vh,r[o])}function v_(i){switch(i){case 5126:return e_;case 35664:return t_;case 35665:return n_;case 35666:return i_;case 35674:return s_;case 35675:return r_;case 35676:return o_;case 5124:case 35670:return a_;case 35667:case 35671:return c_;case 35668:case 35672:return l_;case 35669:case 35673:return u_;case 5125:return h_;case 36294:return d_;case 36295:return f_;case 36296:return p_;case 35678:case 36198:case 36298:case 36306:case 35682:return m_;case 35679:case 36299:case 36307:return g_;case 35680:case 36300:case 36308:case 36293:return __;case 36289:case 36303:case 36311:case 36292:return x_}}class M_{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Qg(t.type)}}class y_{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=v_(t.type)}}class S_{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const s=this.seq;for(let r=0,o=s.length;r!==o;++r){const a=s[r];a.setValue(e,t[a.id],n)}}}const Ko=/(\w+)(\])?(\[|\.)?/g;function Hl(i,e){i.seq.push(e),i.map[e.id]=e}function E_(i,e,t){const n=i.name,s=n.length;for(Ko.lastIndex=0;;){const r=Ko.exec(n),o=Ko.lastIndex;let a=r[1];const c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===s){Hl(t,l===void 0?new M_(a,i,e):new y_(a,i,e));break}else{let h=t.map[a];h===void 0&&(h=new S_(a),Hl(t,h)),t=h}}}class Kr{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);E_(r,o,this)}}setValue(e,t,n,s){const r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){const s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,o=t.length;r!==o;++r){const a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,s)}}static seqWithValue(e,t){const n=[];for(let s=0,r=e.length;s!==r;++s){const o=e[s];o.id in t&&n.push(o)}return n}}function Vl(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const T_=37297;let b_=0;function A_(i,e){const t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){const a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}const Gl=new Ue;function w_(i){ke._getMatrix(Gl,ke.workingColorSpace,i);const e=`mat3( ${Gl.elements.map(t=>t.toFixed(4))} )`;switch(ke.getTransfer(i)){case mo:return[e,"LinearTransferOETF"];case Qe:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Wl(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+A_(i.getShaderSource(e),o)}else return s}function R_(i,e){const t=w_(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function C_(i,e){let t;switch(e){case Rd:t="Linear";break;case Cd:t="Reinhard";break;case Pd:t="Cineon";break;case Ld:t="ACESFilmic";break;case Dd:t="AgX";break;case Ud:t="Neutral";break;case Id:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Rr=new C;function P_(){ke.getLuminanceCoefficients(Rr);const i=Rr.x.toFixed(4),e=Rr.y.toFixed(4),t=Rr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function L_(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ks).join(`
`)}function I_(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function D_(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(e,s),o=r.name;let a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:i.getAttribLocation(e,o),locationSize:a}}return t}function ks(i){return i!==""}function Xl(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function ql(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const U_=/^[ \t]*#include +<([\w\d./]+)>/gm;function ec(i){return i.replace(U_,F_)}const N_=new Map;function F_(i,e){let t=Fe[e];if(t===void 0){const n=N_.get(e);if(n!==void 0)t=Fe[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return ec(t)}const O_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function jl(i){return i.replace(O_,B_)}function B_(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Yl(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function z_(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Wu?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===ad?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Cn&&(e="SHADOWMAP_TYPE_VSM"),e}function k_(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case ss:case rs:e="ENVMAP_TYPE_CUBE";break;case po:e="ENVMAP_TYPE_CUBE_UV";break}return e}function H_(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===rs&&(e="ENVMAP_MODE_REFRACTION"),e}function V_(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Xu:e="ENVMAP_BLENDING_MULTIPLY";break;case Ad:e="ENVMAP_BLENDING_MIX";break;case wd:e="ENVMAP_BLENDING_ADD";break}return e}function G_(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function W_(i,e,t,n){const s=i.getContext(),r=t.defines;let o=t.vertexShader,a=t.fragmentShader;const c=z_(t),l=k_(t),u=H_(t),h=V_(t),d=G_(t),f=L_(t),g=I_(r),_=s.createProgram();let m,p,b=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ks).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ks).join(`
`),p.length>0&&(p+=`
`)):(m=[Yl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ks).join(`
`),p=[Yl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==si?"#define TONE_MAPPING":"",t.toneMapping!==si?Fe.tonemapping_pars_fragment:"",t.toneMapping!==si?C_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Fe.colorspace_pars_fragment,R_("linearToOutputTexel",t.outputColorSpace),P_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ks).join(`
`)),o=ec(o),o=Xl(o,t),o=ql(o,t),a=ec(a),a=Xl(a,t),a=ql(a,t),o=jl(o),a=jl(a),t.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===ol?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===ol?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const E=b+m+o,y=b+p+a,N=Vl(s,s.VERTEX_SHADER,E),w=Vl(s,s.FRAGMENT_SHADER,y);s.attachShader(_,N),s.attachShader(_,w),t.index0AttributeName!==void 0?s.bindAttribLocation(_,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function A(R){if(i.debug.checkShaderErrors){const k=s.getProgramInfoLog(_).trim(),O=s.getShaderInfoLog(N).trim(),G=s.getShaderInfoLog(w).trim();let j=!0,W=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(j=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,_,N,w);else{const $=Wl(s,N,"vertex"),H=Wl(s,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+k+`
`+$+`
`+H)}else k!==""?console.warn("THREE.WebGLProgram: Program Info Log:",k):(O===""||G==="")&&(W=!1);W&&(R.diagnostics={runnable:j,programLog:k,vertexShader:{log:O,prefix:m},fragmentShader:{log:G,prefix:p}})}s.deleteShader(N),s.deleteShader(w),P=new Kr(s,_),S=D_(s,_)}let P;this.getUniforms=function(){return P===void 0&&A(this),P};let S;this.getAttributes=function(){return S===void 0&&A(this),S};let M=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return M===!1&&(M=s.getProgramParameter(_,T_)),M},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=b_++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=N,this.fragmentShader=w,this}let X_=0;class q_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new j_(e),t.set(e,n)),n}}class j_{constructor(e){this.id=X_++,this.code=e,this.usedTimes=0}}function Y_(i,e,t,n,s,r,o){const a=new lh,c=new q_,l=new Set,u=[],h=s.logarithmicDepthBuffer,d=s.vertexTextures;let f=s.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return l.add(S),S===0?"uv":`uv${S}`}function m(S,M,R,k,O){const G=k.fog,j=O.geometry,W=S.isMeshStandardMaterial?k.environment:null,$=(S.isMeshStandardMaterial?t:e).get(S.envMap||W),H=$&&$.mapping===po?$.image.height:null,Z=g[S.type];S.precision!==null&&(f=s.getMaxPrecision(S.precision),f!==S.precision&&console.warn("THREE.WebGLProgram.getParameters:",S.precision,"not supported, using",f,"instead."));const ne=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,xe=ne!==void 0?ne.length:0;let Oe=0;j.morphAttributes.position!==void 0&&(Oe=1),j.morphAttributes.normal!==void 0&&(Oe=2),j.morphAttributes.color!==void 0&&(Oe=3);let et,q,te,_e;if(Z){const Ze=dn[Z];et=Ze.vertexShader,q=Ze.fragmentShader}else et=S.vertexShader,q=S.fragmentShader,c.update(S),te=c.getVertexShaderID(S),_e=c.getFragmentShaderID(S);const re=i.getRenderTarget(),Te=i.state.buffers.depth.getReversed(),Pe=O.isInstancedMesh===!0,Be=O.isBatchedMesh===!0,lt=!!S.map,We=!!S.matcap,pt=!!$,U=!!S.aoMap,Gt=!!S.lightMap,He=!!S.bumpMap,Ve=!!S.normalMap,Se=!!S.displacementMap,rt=!!S.emissiveMap,ye=!!S.metalnessMap,T=!!S.roughnessMap,x=S.anisotropy>0,F=S.clearcoat>0,Y=S.dispersion>0,J=S.iridescence>0,X=S.sheen>0,ve=S.transmission>0,oe=x&&!!S.anisotropyMap,he=F&&!!S.clearcoatMap,Xe=F&&!!S.clearcoatNormalMap,Q=F&&!!S.clearcoatRoughnessMap,de=J&&!!S.iridescenceMap,Ee=J&&!!S.iridescenceThicknessMap,be=X&&!!S.sheenColorMap,fe=X&&!!S.sheenRoughnessMap,Ge=!!S.specularMap,Ne=!!S.specularColorMap,nt=!!S.specularIntensityMap,L=ve&&!!S.transmissionMap,se=ve&&!!S.thicknessMap,V=!!S.gradientMap,K=!!S.alphaMap,ue=S.alphaTest>0,ce=!!S.alphaHash,Ie=!!S.extensions;let ht=si;S.toneMapped&&(re===null||re.isXRRenderTarget===!0)&&(ht=i.toneMapping);const Rt={shaderID:Z,shaderType:S.type,shaderName:S.name,vertexShader:et,fragmentShader:q,defines:S.defines,customVertexShaderID:te,customFragmentShaderID:_e,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:f,batching:Be,batchingColor:Be&&O._colorsTexture!==null,instancing:Pe,instancingColor:Pe&&O.instanceColor!==null,instancingMorph:Pe&&O.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:re===null?i.outputColorSpace:re.isXRRenderTarget===!0?re.texture.colorSpace:Ft,alphaToCoverage:!!S.alphaToCoverage,map:lt,matcap:We,envMap:pt,envMapMode:pt&&$.mapping,envMapCubeUVHeight:H,aoMap:U,lightMap:Gt,bumpMap:He,normalMap:Ve,displacementMap:d&&Se,emissiveMap:rt,normalMapObjectSpace:Ve&&S.normalMapType===kd,normalMapTangentSpace:Ve&&S.normalMapType===sh,metalnessMap:ye,roughnessMap:T,anisotropy:x,anisotropyMap:oe,clearcoat:F,clearcoatMap:he,clearcoatNormalMap:Xe,clearcoatRoughnessMap:Q,dispersion:Y,iridescence:J,iridescenceMap:de,iridescenceThicknessMap:Ee,sheen:X,sheenColorMap:be,sheenRoughnessMap:fe,specularMap:Ge,specularColorMap:Ne,specularIntensityMap:nt,transmission:ve,transmissionMap:L,thicknessMap:se,gradientMap:V,opaque:S.transparent===!1&&S.blending===$i&&S.alphaToCoverage===!1,alphaMap:K,alphaTest:ue,alphaHash:ce,combine:S.combine,mapUv:lt&&_(S.map.channel),aoMapUv:U&&_(S.aoMap.channel),lightMapUv:Gt&&_(S.lightMap.channel),bumpMapUv:He&&_(S.bumpMap.channel),normalMapUv:Ve&&_(S.normalMap.channel),displacementMapUv:Se&&_(S.displacementMap.channel),emissiveMapUv:rt&&_(S.emissiveMap.channel),metalnessMapUv:ye&&_(S.metalnessMap.channel),roughnessMapUv:T&&_(S.roughnessMap.channel),anisotropyMapUv:oe&&_(S.anisotropyMap.channel),clearcoatMapUv:he&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:Xe&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Q&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:de&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:Ee&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:be&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:fe&&_(S.sheenRoughnessMap.channel),specularMapUv:Ge&&_(S.specularMap.channel),specularColorMapUv:Ne&&_(S.specularColorMap.channel),specularIntensityMapUv:nt&&_(S.specularIntensityMap.channel),transmissionMapUv:L&&_(S.transmissionMap.channel),thicknessMapUv:se&&_(S.thicknessMap.channel),alphaMapUv:K&&_(S.alphaMap.channel),vertexTangents:!!j.attributes.tangent&&(Ve||x),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!j.attributes.uv&&(lt||K),fog:!!G,useFog:S.fog===!0,fogExp2:!!G&&G.isFogExp2,flatShading:S.flatShading===!0,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:h,reverseDepthBuffer:Te,skinning:O.isSkinnedMesh===!0,morphTargets:j.morphAttributes.position!==void 0,morphNormals:j.morphAttributes.normal!==void 0,morphColors:j.morphAttributes.color!==void 0,morphTargetsCount:xe,morphTextureStride:Oe,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:i.shadowMap.enabled&&R.length>0,shadowMapType:i.shadowMap.type,toneMapping:ht,decodeVideoTexture:lt&&S.map.isVideoTexture===!0&&ke.getTransfer(S.map.colorSpace)===Qe,decodeVideoTextureEmissive:rt&&S.emissiveMap.isVideoTexture===!0&&ke.getTransfer(S.emissiveMap.colorSpace)===Qe,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===jt,flipSided:S.side===It,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:Ie&&S.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ie&&S.extensions.multiDraw===!0||Be)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return Rt.vertexUv1s=l.has(1),Rt.vertexUv2s=l.has(2),Rt.vertexUv3s=l.has(3),l.clear(),Rt}function p(S){const M=[];if(S.shaderID?M.push(S.shaderID):(M.push(S.customVertexShaderID),M.push(S.customFragmentShaderID)),S.defines!==void 0)for(const R in S.defines)M.push(R),M.push(S.defines[R]);return S.isRawShaderMaterial===!1&&(b(M,S),E(M,S),M.push(i.outputColorSpace)),M.push(S.customProgramCacheKey),M.join()}function b(S,M){S.push(M.precision),S.push(M.outputColorSpace),S.push(M.envMapMode),S.push(M.envMapCubeUVHeight),S.push(M.mapUv),S.push(M.alphaMapUv),S.push(M.lightMapUv),S.push(M.aoMapUv),S.push(M.bumpMapUv),S.push(M.normalMapUv),S.push(M.displacementMapUv),S.push(M.emissiveMapUv),S.push(M.metalnessMapUv),S.push(M.roughnessMapUv),S.push(M.anisotropyMapUv),S.push(M.clearcoatMapUv),S.push(M.clearcoatNormalMapUv),S.push(M.clearcoatRoughnessMapUv),S.push(M.iridescenceMapUv),S.push(M.iridescenceThicknessMapUv),S.push(M.sheenColorMapUv),S.push(M.sheenRoughnessMapUv),S.push(M.specularMapUv),S.push(M.specularColorMapUv),S.push(M.specularIntensityMapUv),S.push(M.transmissionMapUv),S.push(M.thicknessMapUv),S.push(M.combine),S.push(M.fogExp2),S.push(M.sizeAttenuation),S.push(M.morphTargetsCount),S.push(M.morphAttributeCount),S.push(M.numDirLights),S.push(M.numPointLights),S.push(M.numSpotLights),S.push(M.numSpotLightMaps),S.push(M.numHemiLights),S.push(M.numRectAreaLights),S.push(M.numDirLightShadows),S.push(M.numPointLightShadows),S.push(M.numSpotLightShadows),S.push(M.numSpotLightShadowsWithMaps),S.push(M.numLightProbes),S.push(M.shadowMapType),S.push(M.toneMapping),S.push(M.numClippingPlanes),S.push(M.numClipIntersection),S.push(M.depthPacking)}function E(S,M){a.disableAll(),M.supportsVertexTextures&&a.enable(0),M.instancing&&a.enable(1),M.instancingColor&&a.enable(2),M.instancingMorph&&a.enable(3),M.matcap&&a.enable(4),M.envMap&&a.enable(5),M.normalMapObjectSpace&&a.enable(6),M.normalMapTangentSpace&&a.enable(7),M.clearcoat&&a.enable(8),M.iridescence&&a.enable(9),M.alphaTest&&a.enable(10),M.vertexColors&&a.enable(11),M.vertexAlphas&&a.enable(12),M.vertexUv1s&&a.enable(13),M.vertexUv2s&&a.enable(14),M.vertexUv3s&&a.enable(15),M.vertexTangents&&a.enable(16),M.anisotropy&&a.enable(17),M.alphaHash&&a.enable(18),M.batching&&a.enable(19),M.dispersion&&a.enable(20),M.batchingColor&&a.enable(21),S.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reverseDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),S.push(a.mask)}function y(S){const M=g[S.type];let R;if(M){const k=dn[M];R=Lf.clone(k.uniforms)}else R=S.uniforms;return R}function N(S,M){let R;for(let k=0,O=u.length;k<O;k++){const G=u[k];if(G.cacheKey===M){R=G,++R.usedTimes;break}}return R===void 0&&(R=new W_(i,M,S,r),u.push(R)),R}function w(S){if(--S.usedTimes===0){const M=u.indexOf(S);u[M]=u[u.length-1],u.pop(),S.destroy()}}function A(S){c.remove(S)}function P(){c.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:y,acquireProgram:N,releaseProgram:w,releaseShaderCache:A,programs:u,dispose:P}}function K_(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,c){i.get(o)[a]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function Z_(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Kl(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Zl(){const i=[];let e=0;const t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function o(h,d,f,g,_,m){let p=i[e];return p===void 0?(p={id:h.id,object:h,geometry:d,material:f,groupOrder:g,renderOrder:h.renderOrder,z:_,group:m},i[e]=p):(p.id=h.id,p.object=h,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=h.renderOrder,p.z=_,p.group=m),e++,p}function a(h,d,f,g,_,m){const p=o(h,d,f,g,_,m);f.transmission>0?n.push(p):f.transparent===!0?s.push(p):t.push(p)}function c(h,d,f,g,_,m){const p=o(h,d,f,g,_,m);f.transmission>0?n.unshift(p):f.transparent===!0?s.unshift(p):t.unshift(p)}function l(h,d){t.length>1&&t.sort(h||Z_),n.length>1&&n.sort(d||Kl),s.length>1&&s.sort(d||Kl)}function u(){for(let h=e,d=i.length;h<d;h++){const f=i[h];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:a,unshift:c,finish:u,sort:l}}function $_(){let i=new WeakMap;function e(n,s){const r=i.get(n);let o;return r===void 0?(o=new Zl,i.set(n,[o])):s>=r.length?(o=new Zl,r.push(o)):o=r[s],o}function t(){i=new WeakMap}return{get:e,dispose:t}}function J_(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new C,color:new Ae};break;case"SpotLight":t={position:new C,direction:new C,color:new Ae,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new C,color:new Ae,distance:0,decay:0};break;case"HemisphereLight":t={direction:new C,skyColor:new Ae,groundColor:new Ae};break;case"RectAreaLight":t={color:new Ae,position:new C,halfWidth:new C,halfHeight:new C};break}return i[e.id]=t,t}}}function Q_(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Le};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Le};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Le,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let e0=0;function t0(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function n0(i){const e=new J_,t=Q_(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new C);const s=new C,r=new we,o=new we;function a(l){let u=0,h=0,d=0;for(let S=0;S<9;S++)n.probe[S].set(0,0,0);let f=0,g=0,_=0,m=0,p=0,b=0,E=0,y=0,N=0,w=0,A=0;l.sort(t0);for(let S=0,M=l.length;S<M;S++){const R=l[S],k=R.color,O=R.intensity,G=R.distance,j=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)u+=k.r*O,h+=k.g*O,d+=k.b*O;else if(R.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(R.sh.coefficients[W],O);A++}else if(R.isDirectionalLight){const W=e.get(R);if(W.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){const $=R.shadow,H=t.get(R);H.shadowIntensity=$.intensity,H.shadowBias=$.bias,H.shadowNormalBias=$.normalBias,H.shadowRadius=$.radius,H.shadowMapSize=$.mapSize,n.directionalShadow[f]=H,n.directionalShadowMap[f]=j,n.directionalShadowMatrix[f]=R.shadow.matrix,b++}n.directional[f]=W,f++}else if(R.isSpotLight){const W=e.get(R);W.position.setFromMatrixPosition(R.matrixWorld),W.color.copy(k).multiplyScalar(O),W.distance=G,W.coneCos=Math.cos(R.angle),W.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),W.decay=R.decay,n.spot[_]=W;const $=R.shadow;if(R.map&&(n.spotLightMap[N]=R.map,N++,$.updateMatrices(R),R.castShadow&&w++),n.spotLightMatrix[_]=$.matrix,R.castShadow){const H=t.get(R);H.shadowIntensity=$.intensity,H.shadowBias=$.bias,H.shadowNormalBias=$.normalBias,H.shadowRadius=$.radius,H.shadowMapSize=$.mapSize,n.spotShadow[_]=H,n.spotShadowMap[_]=j,y++}_++}else if(R.isRectAreaLight){const W=e.get(R);W.color.copy(k).multiplyScalar(O),W.halfWidth.set(R.width*.5,0,0),W.halfHeight.set(0,R.height*.5,0),n.rectArea[m]=W,m++}else if(R.isPointLight){const W=e.get(R);if(W.color.copy(R.color).multiplyScalar(R.intensity),W.distance=R.distance,W.decay=R.decay,R.castShadow){const $=R.shadow,H=t.get(R);H.shadowIntensity=$.intensity,H.shadowBias=$.bias,H.shadowNormalBias=$.normalBias,H.shadowRadius=$.radius,H.shadowMapSize=$.mapSize,H.shadowCameraNear=$.camera.near,H.shadowCameraFar=$.camera.far,n.pointShadow[g]=H,n.pointShadowMap[g]=j,n.pointShadowMatrix[g]=R.shadow.matrix,E++}n.point[g]=W,g++}else if(R.isHemisphereLight){const W=e.get(R);W.skyColor.copy(R.color).multiplyScalar(O),W.groundColor.copy(R.groundColor).multiplyScalar(O),n.hemi[p]=W,p++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ie.LTC_FLOAT_1,n.rectAreaLTC2=ie.LTC_FLOAT_2):(n.rectAreaLTC1=ie.LTC_HALF_1,n.rectAreaLTC2=ie.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;const P=n.hash;(P.directionalLength!==f||P.pointLength!==g||P.spotLength!==_||P.rectAreaLength!==m||P.hemiLength!==p||P.numDirectionalShadows!==b||P.numPointShadows!==E||P.numSpotShadows!==y||P.numSpotMaps!==N||P.numLightProbes!==A)&&(n.directional.length=f,n.spot.length=_,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=E,n.pointShadowMap.length=E,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=E,n.spotLightMatrix.length=y+N-w,n.spotLightMap.length=N,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=A,P.directionalLength=f,P.pointLength=g,P.spotLength=_,P.rectAreaLength=m,P.hemiLength=p,P.numDirectionalShadows=b,P.numPointShadows=E,P.numSpotShadows=y,P.numSpotMaps=N,P.numLightProbes=A,n.version=e0++)}function c(l,u){let h=0,d=0,f=0,g=0,_=0;const m=u.matrixWorldInverse;for(let p=0,b=l.length;p<b;p++){const E=l[p];if(E.isDirectionalLight){const y=n.directional[h];y.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(m),h++}else if(E.isSpotLight){const y=n.spot[f];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(m),y.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(m),f++}else if(E.isRectAreaLight){const y=n.rectArea[g];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(m),o.identity(),r.copy(E.matrixWorld),r.premultiply(m),o.extractRotation(r),y.halfWidth.set(E.width*.5,0,0),y.halfHeight.set(0,E.height*.5,0),y.halfWidth.applyMatrix4(o),y.halfHeight.applyMatrix4(o),g++}else if(E.isPointLight){const y=n.point[d];y.position.setFromMatrixPosition(E.matrixWorld),y.position.applyMatrix4(m),d++}else if(E.isHemisphereLight){const y=n.hemi[_];y.direction.setFromMatrixPosition(E.matrixWorld),y.direction.transformDirection(m),_++}}}return{setup:a,setupView:c,state:n}}function $l(i){const e=new n0(i),t=[],n=[];function s(u){l.camera=u,t.length=0,n.length=0}function r(u){t.push(u)}function o(u){n.push(u)}function a(){e.setup(t)}function c(u){e.setupView(t,u)}const l={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:l,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function i0(i){let e=new WeakMap;function t(s,r=0){const o=e.get(s);let a;return o===void 0?(a=new $l(i),e.set(s,[a])):r>=o.length?(a=new $l(i),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}class s0 extends un{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Bd,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class r0 extends un{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const o0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,a0=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function c0(i,e,t){let n=new Sc;const s=new Le,r=new Le,o=new je,a=new s0({depthPacking:zd}),c=new r0,l={},u=t.maxTextureSize,h={[Bn]:It,[It]:Bn,[jt]:jt},d=new ri({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Le},radius:{value:4}},vertexShader:o0,fragmentShader:a0}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new vt;g.setAttribute("position",new tt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new wt(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Wu;let p=this.type;this.render=function(w,A,P){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;const S=i.getRenderTarget(),M=i.getActiveCubeFace(),R=i.getActiveMipmapLevel(),k=i.state;k.setBlending(ii),k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);const O=p!==Cn&&this.type===Cn,G=p===Cn&&this.type!==Cn;for(let j=0,W=w.length;j<W;j++){const $=w[j],H=$.shadow;if(H===void 0){console.warn("THREE.WebGLShadowMap:",$,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;s.copy(H.mapSize);const Z=H.getFrameExtents();if(s.multiply(Z),r.copy(H.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/Z.x),s.x=r.x*Z.x,H.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/Z.y),s.y=r.y*Z.y,H.mapSize.y=r.y)),H.map===null||O===!0||G===!0){const xe=this.type!==Cn?{minFilter:Nt,magFilter:Nt}:{};H.map!==null&&H.map.dispose(),H.map=new Ai(s.x,s.y,xe),H.map.texture.name=$.name+".shadowMap",H.camera.updateProjectionMatrix()}i.setRenderTarget(H.map),i.clear();const ne=H.getViewportCount();for(let xe=0;xe<ne;xe++){const Oe=H.getViewport(xe);o.set(r.x*Oe.x,r.y*Oe.y,r.x*Oe.z,r.y*Oe.w),k.viewport(o),H.updateMatrices($,xe),n=H.getFrustum(),y(A,P,H.camera,$,this.type)}H.isPointLightShadow!==!0&&this.type===Cn&&b(H,P),H.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(S,M,R)};function b(w,A){const P=e.update(_);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Ai(s.x,s.y)),d.uniforms.shadow_pass.value=w.map.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(A,null,P,d,_,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(A,null,P,f,_,null)}function E(w,A,P,S){let M=null;const R=P.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(R!==void 0)M=R;else if(M=P.isPointLight===!0?c:a,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const k=M.uuid,O=A.uuid;let G=l[k];G===void 0&&(G={},l[k]=G);let j=G[O];j===void 0&&(j=M.clone(),G[O]=j,A.addEventListener("dispose",N)),M=j}if(M.visible=A.visible,M.wireframe=A.wireframe,S===Cn?M.side=A.shadowSide!==null?A.shadowSide:A.side:M.side=A.shadowSide!==null?A.shadowSide:h[A.side],M.alphaMap=A.alphaMap,M.alphaTest=A.alphaTest,M.map=A.map,M.clipShadows=A.clipShadows,M.clippingPlanes=A.clippingPlanes,M.clipIntersection=A.clipIntersection,M.displacementMap=A.displacementMap,M.displacementScale=A.displacementScale,M.displacementBias=A.displacementBias,M.wireframeLinewidth=A.wireframeLinewidth,M.linewidth=A.linewidth,P.isPointLight===!0&&M.isMeshDistanceMaterial===!0){const k=i.properties.get(M);k.light=P}return M}function y(w,A,P,S,M){if(w.visible===!1)return;if(w.layers.test(A.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&M===Cn)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,w.matrixWorld);const O=e.update(w),G=w.material;if(Array.isArray(G)){const j=O.groups;for(let W=0,$=j.length;W<$;W++){const H=j[W],Z=G[H.materialIndex];if(Z&&Z.visible){const ne=E(w,Z,S,M);w.onBeforeShadow(i,w,A,P,O,ne,H),i.renderBufferDirect(P,null,O,ne,w,H),w.onAfterShadow(i,w,A,P,O,ne,H)}}}else if(G.visible){const j=E(w,G,S,M);w.onBeforeShadow(i,w,A,P,O,j,null),i.renderBufferDirect(P,null,O,j,w,null),w.onAfterShadow(i,w,A,P,O,j,null)}}const k=w.children;for(let O=0,G=k.length;O<G;O++)y(k[O],A,P,S,M)}function N(w){w.target.removeEventListener("dispose",N);for(const P in l){const S=l[P],M=w.target.uuid;M in S&&(S[M].dispose(),delete S[M])}}}const l0={[_a]:xa,[va]:Sa,[Ma]:Ea,[is]:ya,[xa]:_a,[Sa]:va,[Ea]:Ma,[ya]:is};function u0(i,e){function t(){let L=!1;const se=new je;let V=null;const K=new je(0,0,0,0);return{setMask:function(ue){V!==ue&&!L&&(i.colorMask(ue,ue,ue,ue),V=ue)},setLocked:function(ue){L=ue},setClear:function(ue,ce,Ie,ht,Rt){Rt===!0&&(ue*=ht,ce*=ht,Ie*=ht),se.set(ue,ce,Ie,ht),K.equals(se)===!1&&(i.clearColor(ue,ce,Ie,ht),K.copy(se))},reset:function(){L=!1,V=null,K.set(-1,0,0,0)}}}function n(){let L=!1,se=!1,V=null,K=null,ue=null;return{setReversed:function(ce){if(se!==ce){const Ie=e.get("EXT_clip_control");se?Ie.clipControlEXT(Ie.LOWER_LEFT_EXT,Ie.ZERO_TO_ONE_EXT):Ie.clipControlEXT(Ie.LOWER_LEFT_EXT,Ie.NEGATIVE_ONE_TO_ONE_EXT);const ht=ue;ue=null,this.setClear(ht)}se=ce},getReversed:function(){return se},setTest:function(ce){ce?re(i.DEPTH_TEST):Te(i.DEPTH_TEST)},setMask:function(ce){V!==ce&&!L&&(i.depthMask(ce),V=ce)},setFunc:function(ce){if(se&&(ce=l0[ce]),K!==ce){switch(ce){case _a:i.depthFunc(i.NEVER);break;case xa:i.depthFunc(i.ALWAYS);break;case va:i.depthFunc(i.LESS);break;case is:i.depthFunc(i.LEQUAL);break;case Ma:i.depthFunc(i.EQUAL);break;case ya:i.depthFunc(i.GEQUAL);break;case Sa:i.depthFunc(i.GREATER);break;case Ea:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}K=ce}},setLocked:function(ce){L=ce},setClear:function(ce){ue!==ce&&(se&&(ce=1-ce),i.clearDepth(ce),ue=ce)},reset:function(){L=!1,V=null,K=null,ue=null,se=!1}}}function s(){let L=!1,se=null,V=null,K=null,ue=null,ce=null,Ie=null,ht=null,Rt=null;return{setTest:function(Ze){L||(Ze?re(i.STENCIL_TEST):Te(i.STENCIL_TEST))},setMask:function(Ze){se!==Ze&&!L&&(i.stencilMask(Ze),se=Ze)},setFunc:function(Ze,Qt,vn){(V!==Ze||K!==Qt||ue!==vn)&&(i.stencilFunc(Ze,Qt,vn),V=Ze,K=Qt,ue=vn)},setOp:function(Ze,Qt,vn){(ce!==Ze||Ie!==Qt||ht!==vn)&&(i.stencilOp(Ze,Qt,vn),ce=Ze,Ie=Qt,ht=vn)},setLocked:function(Ze){L=Ze},setClear:function(Ze){Rt!==Ze&&(i.clearStencil(Ze),Rt=Ze)},reset:function(){L=!1,se=null,V=null,K=null,ue=null,ce=null,Ie=null,ht=null,Rt=null}}}const r=new t,o=new n,a=new s,c=new WeakMap,l=new WeakMap;let u={},h={},d=new WeakMap,f=[],g=null,_=!1,m=null,p=null,b=null,E=null,y=null,N=null,w=null,A=new Ae(0,0,0),P=0,S=!1,M=null,R=null,k=null,O=null,G=null;const j=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let W=!1,$=0;const H=i.getParameter(i.VERSION);H.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(H)[1]),W=$>=1):H.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),W=$>=2);let Z=null,ne={};const xe=i.getParameter(i.SCISSOR_BOX),Oe=i.getParameter(i.VIEWPORT),et=new je().fromArray(xe),q=new je().fromArray(Oe);function te(L,se,V,K){const ue=new Uint8Array(4),ce=i.createTexture();i.bindTexture(L,ce),i.texParameteri(L,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(L,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ie=0;Ie<V;Ie++)L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY?i.texImage3D(se,0,i.RGBA,1,1,K,0,i.RGBA,i.UNSIGNED_BYTE,ue):i.texImage2D(se+Ie,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ue);return ce}const _e={};_e[i.TEXTURE_2D]=te(i.TEXTURE_2D,i.TEXTURE_2D,1),_e[i.TEXTURE_CUBE_MAP]=te(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),_e[i.TEXTURE_2D_ARRAY]=te(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),_e[i.TEXTURE_3D]=te(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),re(i.DEPTH_TEST),o.setFunc(is),He(!1),Ve($c),re(i.CULL_FACE),U(ii);function re(L){u[L]!==!0&&(i.enable(L),u[L]=!0)}function Te(L){u[L]!==!1&&(i.disable(L),u[L]=!1)}function Pe(L,se){return h[L]!==se?(i.bindFramebuffer(L,se),h[L]=se,L===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=se),L===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=se),!0):!1}function Be(L,se){let V=f,K=!1;if(L){V=d.get(se),V===void 0&&(V=[],d.set(se,V));const ue=L.textures;if(V.length!==ue.length||V[0]!==i.COLOR_ATTACHMENT0){for(let ce=0,Ie=ue.length;ce<Ie;ce++)V[ce]=i.COLOR_ATTACHMENT0+ce;V.length=ue.length,K=!0}}else V[0]!==i.BACK&&(V[0]=i.BACK,K=!0);K&&i.drawBuffers(V)}function lt(L){return g!==L?(i.useProgram(L),g=L,!0):!1}const We={[yi]:i.FUNC_ADD,[ld]:i.FUNC_SUBTRACT,[ud]:i.FUNC_REVERSE_SUBTRACT};We[hd]=i.MIN,We[dd]=i.MAX;const pt={[fd]:i.ZERO,[pd]:i.ONE,[md]:i.SRC_COLOR,[ma]:i.SRC_ALPHA,[yd]:i.SRC_ALPHA_SATURATE,[vd]:i.DST_COLOR,[_d]:i.DST_ALPHA,[gd]:i.ONE_MINUS_SRC_COLOR,[ga]:i.ONE_MINUS_SRC_ALPHA,[Md]:i.ONE_MINUS_DST_COLOR,[xd]:i.ONE_MINUS_DST_ALPHA,[Sd]:i.CONSTANT_COLOR,[Ed]:i.ONE_MINUS_CONSTANT_COLOR,[Td]:i.CONSTANT_ALPHA,[bd]:i.ONE_MINUS_CONSTANT_ALPHA};function U(L,se,V,K,ue,ce,Ie,ht,Rt,Ze){if(L===ii){_===!0&&(Te(i.BLEND),_=!1);return}if(_===!1&&(re(i.BLEND),_=!0),L!==cd){if(L!==m||Ze!==S){if((p!==yi||y!==yi)&&(i.blendEquation(i.FUNC_ADD),p=yi,y=yi),Ze)switch(L){case $i:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Jc:i.blendFunc(i.ONE,i.ONE);break;case Qc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case el:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case $i:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Jc:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Qc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case el:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}b=null,E=null,N=null,w=null,A.set(0,0,0),P=0,m=L,S=Ze}return}ue=ue||se,ce=ce||V,Ie=Ie||K,(se!==p||ue!==y)&&(i.blendEquationSeparate(We[se],We[ue]),p=se,y=ue),(V!==b||K!==E||ce!==N||Ie!==w)&&(i.blendFuncSeparate(pt[V],pt[K],pt[ce],pt[Ie]),b=V,E=K,N=ce,w=Ie),(ht.equals(A)===!1||Rt!==P)&&(i.blendColor(ht.r,ht.g,ht.b,Rt),A.copy(ht),P=Rt),m=L,S=!1}function Gt(L,se){L.side===jt?Te(i.CULL_FACE):re(i.CULL_FACE);let V=L.side===It;se&&(V=!V),He(V),L.blending===$i&&L.transparent===!1?U(ii):U(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),o.setFunc(L.depthFunc),o.setTest(L.depthTest),o.setMask(L.depthWrite),r.setMask(L.colorWrite);const K=L.stencilWrite;a.setTest(K),K&&(a.setMask(L.stencilWriteMask),a.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),a.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),rt(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?re(i.SAMPLE_ALPHA_TO_COVERAGE):Te(i.SAMPLE_ALPHA_TO_COVERAGE)}function He(L){M!==L&&(L?i.frontFace(i.CW):i.frontFace(i.CCW),M=L)}function Ve(L){L!==rd?(re(i.CULL_FACE),L!==R&&(L===$c?i.cullFace(i.BACK):L===od?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Te(i.CULL_FACE),R=L}function Se(L){L!==k&&(W&&i.lineWidth(L),k=L)}function rt(L,se,V){L?(re(i.POLYGON_OFFSET_FILL),(O!==se||G!==V)&&(i.polygonOffset(se,V),O=se,G=V)):Te(i.POLYGON_OFFSET_FILL)}function ye(L){L?re(i.SCISSOR_TEST):Te(i.SCISSOR_TEST)}function T(L){L===void 0&&(L=i.TEXTURE0+j-1),Z!==L&&(i.activeTexture(L),Z=L)}function x(L,se,V){V===void 0&&(Z===null?V=i.TEXTURE0+j-1:V=Z);let K=ne[V];K===void 0&&(K={type:void 0,texture:void 0},ne[V]=K),(K.type!==L||K.texture!==se)&&(Z!==V&&(i.activeTexture(V),Z=V),i.bindTexture(L,se||_e[L]),K.type=L,K.texture=se)}function F(){const L=ne[Z];L!==void 0&&L.type!==void 0&&(i.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function Y(){try{i.compressedTexImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function J(){try{i.compressedTexImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function X(){try{i.texSubImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ve(){try{i.texSubImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function oe(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function he(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Xe(){try{i.texStorage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Q(){try{i.texStorage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function de(){try{i.texImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Ee(){try{i.texImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function be(L){et.equals(L)===!1&&(i.scissor(L.x,L.y,L.z,L.w),et.copy(L))}function fe(L){q.equals(L)===!1&&(i.viewport(L.x,L.y,L.z,L.w),q.copy(L))}function Ge(L,se){let V=l.get(se);V===void 0&&(V=new WeakMap,l.set(se,V));let K=V.get(L);K===void 0&&(K=i.getUniformBlockIndex(se,L.name),V.set(L,K))}function Ne(L,se){const K=l.get(se).get(L);c.get(se)!==K&&(i.uniformBlockBinding(se,K,L.__bindingPointIndex),c.set(se,K))}function nt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},Z=null,ne={},h={},d=new WeakMap,f=[],g=null,_=!1,m=null,p=null,b=null,E=null,y=null,N=null,w=null,A=new Ae(0,0,0),P=0,S=!1,M=null,R=null,k=null,O=null,G=null,et.set(0,0,i.canvas.width,i.canvas.height),q.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:re,disable:Te,bindFramebuffer:Pe,drawBuffers:Be,useProgram:lt,setBlending:U,setMaterial:Gt,setFlipSided:He,setCullFace:Ve,setLineWidth:Se,setPolygonOffset:rt,setScissorTest:ye,activeTexture:T,bindTexture:x,unbindTexture:F,compressedTexImage2D:Y,compressedTexImage3D:J,texImage2D:de,texImage3D:Ee,updateUBOMapping:Ge,uniformBlockBinding:Ne,texStorage2D:Xe,texStorage3D:Q,texSubImage2D:X,texSubImage3D:ve,compressedTexSubImage2D:oe,compressedTexSubImage3D:he,scissor:be,viewport:fe,reset:nt}}function Jl(i,e,t,n){const s=h0(n);switch(t){case $u:return i*e;case Qu:return i*e;case eh:return i*e*2;case _c:return i*e/s.components*s.byteLength;case xc:return i*e/s.components*s.byteLength;case th:return i*e*2/s.components*s.byteLength;case vc:return i*e*2/s.components*s.byteLength;case Ju:return i*e*3/s.components*s.byteLength;case $t:return i*e*4/s.components*s.byteLength;case Mc:return i*e*4/s.components*s.byteLength;case Wr:case Xr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case qr:case jr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case wa:case Ca:return Math.max(i,16)*Math.max(e,8)/4;case Aa:case Ra:return Math.max(i,8)*Math.max(e,8)/2;case Pa:case La:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Ia:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Da:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ua:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Na:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Fa:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Oa:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Ba:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case za:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case ka:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Ha:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Va:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Ga:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Wa:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Xa:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case qa:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Yr:case ja:case Ya:return Math.ceil(i/4)*Math.ceil(e/4)*16;case nh:case Ka:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Za:case $a:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function h0(i){switch(i){case zn:case Yu:return{byteLength:1,components:1};case Ys:case Ku:case tr:return{byteLength:2,components:1};case mc:case gc:return{byteLength:2,components:4};case bi:case pc:case cn:return{byteLength:4,components:1};case Zu:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function d0(i,e,t,n,s,r,o){const a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Le,u=new WeakMap;let h;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(T,x){return f?new OffscreenCanvas(T,x):$s("canvas")}function _(T,x,F){let Y=1;const J=ye(T);if((J.width>F||J.height>F)&&(Y=F/Math.max(J.width,J.height)),Y<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){const X=Math.floor(Y*J.width),ve=Math.floor(Y*J.height);h===void 0&&(h=g(X,ve));const oe=x?g(X,ve):h;return oe.width=X,oe.height=ve,oe.getContext("2d").drawImage(T,0,0,X,ve),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+X+"x"+ve+")."),oe}else return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),T;return T}function m(T){return T.generateMipmaps}function p(T){i.generateMipmap(T)}function b(T){return T.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?i.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function E(T,x,F,Y,J=!1){if(T!==null){if(i[T]!==void 0)return i[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let X=x;if(x===i.RED&&(F===i.FLOAT&&(X=i.R32F),F===i.HALF_FLOAT&&(X=i.R16F),F===i.UNSIGNED_BYTE&&(X=i.R8)),x===i.RED_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.R8UI),F===i.UNSIGNED_SHORT&&(X=i.R16UI),F===i.UNSIGNED_INT&&(X=i.R32UI),F===i.BYTE&&(X=i.R8I),F===i.SHORT&&(X=i.R16I),F===i.INT&&(X=i.R32I)),x===i.RG&&(F===i.FLOAT&&(X=i.RG32F),F===i.HALF_FLOAT&&(X=i.RG16F),F===i.UNSIGNED_BYTE&&(X=i.RG8)),x===i.RG_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.RG8UI),F===i.UNSIGNED_SHORT&&(X=i.RG16UI),F===i.UNSIGNED_INT&&(X=i.RG32UI),F===i.BYTE&&(X=i.RG8I),F===i.SHORT&&(X=i.RG16I),F===i.INT&&(X=i.RG32I)),x===i.RGB_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.RGB8UI),F===i.UNSIGNED_SHORT&&(X=i.RGB16UI),F===i.UNSIGNED_INT&&(X=i.RGB32UI),F===i.BYTE&&(X=i.RGB8I),F===i.SHORT&&(X=i.RGB16I),F===i.INT&&(X=i.RGB32I)),x===i.RGBA_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.RGBA8UI),F===i.UNSIGNED_SHORT&&(X=i.RGBA16UI),F===i.UNSIGNED_INT&&(X=i.RGBA32UI),F===i.BYTE&&(X=i.RGBA8I),F===i.SHORT&&(X=i.RGBA16I),F===i.INT&&(X=i.RGBA32I)),x===i.RGB&&F===i.UNSIGNED_INT_5_9_9_9_REV&&(X=i.RGB9_E5),x===i.RGBA){const ve=J?mo:ke.getTransfer(Y);F===i.FLOAT&&(X=i.RGBA32F),F===i.HALF_FLOAT&&(X=i.RGBA16F),F===i.UNSIGNED_BYTE&&(X=ve===Qe?i.SRGB8_ALPHA8:i.RGBA8),F===i.UNSIGNED_SHORT_4_4_4_4&&(X=i.RGBA4),F===i.UNSIGNED_SHORT_5_5_5_1&&(X=i.RGB5_A1)}return(X===i.R16F||X===i.R32F||X===i.RG16F||X===i.RG32F||X===i.RGBA16F||X===i.RGBA32F)&&e.get("EXT_color_buffer_float"),X}function y(T,x){let F;return T?x===null||x===bi||x===as?F=i.DEPTH24_STENCIL8:x===cn?F=i.DEPTH32F_STENCIL8:x===Ys&&(F=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===bi||x===as?F=i.DEPTH_COMPONENT24:x===cn?F=i.DEPTH_COMPONENT32F:x===Ys&&(F=i.DEPTH_COMPONENT16),F}function N(T,x){return m(T)===!0||T.isFramebufferTexture&&T.minFilter!==Nt&&T.minFilter!==Vt?Math.log2(Math.max(x.width,x.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?x.mipmaps.length:1}function w(T){const x=T.target;x.removeEventListener("dispose",w),P(x),x.isVideoTexture&&u.delete(x)}function A(T){const x=T.target;x.removeEventListener("dispose",A),M(x)}function P(T){const x=n.get(T);if(x.__webglInit===void 0)return;const F=T.source,Y=d.get(F);if(Y){const J=Y[x.__cacheKey];J.usedTimes--,J.usedTimes===0&&S(T),Object.keys(Y).length===0&&d.delete(F)}n.remove(T)}function S(T){const x=n.get(T);i.deleteTexture(x.__webglTexture);const F=T.source,Y=d.get(F);delete Y[x.__cacheKey],o.memory.textures--}function M(T){const x=n.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),n.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(x.__webglFramebuffer[Y]))for(let J=0;J<x.__webglFramebuffer[Y].length;J++)i.deleteFramebuffer(x.__webglFramebuffer[Y][J]);else i.deleteFramebuffer(x.__webglFramebuffer[Y]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[Y])}else{if(Array.isArray(x.__webglFramebuffer))for(let Y=0;Y<x.__webglFramebuffer.length;Y++)i.deleteFramebuffer(x.__webglFramebuffer[Y]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let Y=0;Y<x.__webglColorRenderbuffer.length;Y++)x.__webglColorRenderbuffer[Y]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[Y]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const F=T.textures;for(let Y=0,J=F.length;Y<J;Y++){const X=n.get(F[Y]);X.__webglTexture&&(i.deleteTexture(X.__webglTexture),o.memory.textures--),n.remove(F[Y])}n.remove(T)}let R=0;function k(){R=0}function O(){const T=R;return T>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+s.maxTextures),R+=1,T}function G(T){const x=[];return x.push(T.wrapS),x.push(T.wrapT),x.push(T.wrapR||0),x.push(T.magFilter),x.push(T.minFilter),x.push(T.anisotropy),x.push(T.internalFormat),x.push(T.format),x.push(T.type),x.push(T.generateMipmaps),x.push(T.premultiplyAlpha),x.push(T.flipY),x.push(T.unpackAlignment),x.push(T.colorSpace),x.join()}function j(T,x){const F=n.get(T);if(T.isVideoTexture&&Se(T),T.isRenderTargetTexture===!1&&T.version>0&&F.__version!==T.version){const Y=T.image;if(Y===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{q(F,T,x);return}}t.bindTexture(i.TEXTURE_2D,F.__webglTexture,i.TEXTURE0+x)}function W(T,x){const F=n.get(T);if(T.version>0&&F.__version!==T.version){q(F,T,x);return}t.bindTexture(i.TEXTURE_2D_ARRAY,F.__webglTexture,i.TEXTURE0+x)}function $(T,x){const F=n.get(T);if(T.version>0&&F.__version!==T.version){q(F,T,x);return}t.bindTexture(i.TEXTURE_3D,F.__webglTexture,i.TEXTURE0+x)}function H(T,x){const F=n.get(T);if(T.version>0&&F.__version!==T.version){te(F,T,x);return}t.bindTexture(i.TEXTURE_CUBE_MAP,F.__webglTexture,i.TEXTURE0+x)}const Z={[os]:i.REPEAT,[Zt]:i.CLAMP_TO_EDGE,[to]:i.MIRRORED_REPEAT},ne={[Nt]:i.NEAREST,[ju]:i.NEAREST_MIPMAP_NEAREST,[Bs]:i.NEAREST_MIPMAP_LINEAR,[Vt]:i.LINEAR,[Gr]:i.LINEAR_MIPMAP_NEAREST,[Dn]:i.LINEAR_MIPMAP_LINEAR},xe={[Hd]:i.NEVER,[jd]:i.ALWAYS,[Vd]:i.LESS,[rh]:i.LEQUAL,[Gd]:i.EQUAL,[qd]:i.GEQUAL,[Wd]:i.GREATER,[Xd]:i.NOTEQUAL};function Oe(T,x){if(x.type===cn&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===Vt||x.magFilter===Gr||x.magFilter===Bs||x.magFilter===Dn||x.minFilter===Vt||x.minFilter===Gr||x.minFilter===Bs||x.minFilter===Dn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(T,i.TEXTURE_WRAP_S,Z[x.wrapS]),i.texParameteri(T,i.TEXTURE_WRAP_T,Z[x.wrapT]),(T===i.TEXTURE_3D||T===i.TEXTURE_2D_ARRAY)&&i.texParameteri(T,i.TEXTURE_WRAP_R,Z[x.wrapR]),i.texParameteri(T,i.TEXTURE_MAG_FILTER,ne[x.magFilter]),i.texParameteri(T,i.TEXTURE_MIN_FILTER,ne[x.minFilter]),x.compareFunction&&(i.texParameteri(T,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(T,i.TEXTURE_COMPARE_FUNC,xe[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Nt||x.minFilter!==Bs&&x.minFilter!==Dn||x.type===cn&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const F=e.get("EXT_texture_filter_anisotropic");i.texParameterf(T,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,s.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function et(T,x){let F=!1;T.__webglInit===void 0&&(T.__webglInit=!0,x.addEventListener("dispose",w));const Y=x.source;let J=d.get(Y);J===void 0&&(J={},d.set(Y,J));const X=G(x);if(X!==T.__cacheKey){J[X]===void 0&&(J[X]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,F=!0),J[X].usedTimes++;const ve=J[T.__cacheKey];ve!==void 0&&(J[T.__cacheKey].usedTimes--,ve.usedTimes===0&&S(x)),T.__cacheKey=X,T.__webglTexture=J[X].texture}return F}function q(T,x,F){let Y=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(Y=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&(Y=i.TEXTURE_3D);const J=et(T,x),X=x.source;t.bindTexture(Y,T.__webglTexture,i.TEXTURE0+F);const ve=n.get(X);if(X.version!==ve.__version||J===!0){t.activeTexture(i.TEXTURE0+F);const oe=ke.getPrimaries(ke.workingColorSpace),he=x.colorSpace===ti?null:ke.getPrimaries(x.colorSpace),Xe=x.colorSpace===ti||oe===he?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Xe);let Q=_(x.image,!1,s.maxTextureSize);Q=rt(x,Q);const de=r.convert(x.format,x.colorSpace),Ee=r.convert(x.type);let be=E(x.internalFormat,de,Ee,x.colorSpace,x.isVideoTexture);Oe(Y,x);let fe;const Ge=x.mipmaps,Ne=x.isVideoTexture!==!0,nt=ve.__version===void 0||J===!0,L=X.dataReady,se=N(x,Q);if(x.isDepthTexture)be=y(x.format===cs,x.type),nt&&(Ne?t.texStorage2D(i.TEXTURE_2D,1,be,Q.width,Q.height):t.texImage2D(i.TEXTURE_2D,0,be,Q.width,Q.height,0,de,Ee,null));else if(x.isDataTexture)if(Ge.length>0){Ne&&nt&&t.texStorage2D(i.TEXTURE_2D,se,be,Ge[0].width,Ge[0].height);for(let V=0,K=Ge.length;V<K;V++)fe=Ge[V],Ne?L&&t.texSubImage2D(i.TEXTURE_2D,V,0,0,fe.width,fe.height,de,Ee,fe.data):t.texImage2D(i.TEXTURE_2D,V,be,fe.width,fe.height,0,de,Ee,fe.data);x.generateMipmaps=!1}else Ne?(nt&&t.texStorage2D(i.TEXTURE_2D,se,be,Q.width,Q.height),L&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Q.width,Q.height,de,Ee,Q.data)):t.texImage2D(i.TEXTURE_2D,0,be,Q.width,Q.height,0,de,Ee,Q.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Ne&&nt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,se,be,Ge[0].width,Ge[0].height,Q.depth);for(let V=0,K=Ge.length;V<K;V++)if(fe=Ge[V],x.format!==$t)if(de!==null)if(Ne){if(L)if(x.layerUpdates.size>0){const ue=Jl(fe.width,fe.height,x.format,x.type);for(const ce of x.layerUpdates){const Ie=fe.data.subarray(ce*ue/fe.data.BYTES_PER_ELEMENT,(ce+1)*ue/fe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,ce,fe.width,fe.height,1,de,Ie)}x.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,0,fe.width,fe.height,Q.depth,de,fe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,V,be,fe.width,fe.height,Q.depth,0,fe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ne?L&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,0,fe.width,fe.height,Q.depth,de,Ee,fe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,V,be,fe.width,fe.height,Q.depth,0,de,Ee,fe.data)}else{Ne&&nt&&t.texStorage2D(i.TEXTURE_2D,se,be,Ge[0].width,Ge[0].height);for(let V=0,K=Ge.length;V<K;V++)fe=Ge[V],x.format!==$t?de!==null?Ne?L&&t.compressedTexSubImage2D(i.TEXTURE_2D,V,0,0,fe.width,fe.height,de,fe.data):t.compressedTexImage2D(i.TEXTURE_2D,V,be,fe.width,fe.height,0,fe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ne?L&&t.texSubImage2D(i.TEXTURE_2D,V,0,0,fe.width,fe.height,de,Ee,fe.data):t.texImage2D(i.TEXTURE_2D,V,be,fe.width,fe.height,0,de,Ee,fe.data)}else if(x.isDataArrayTexture)if(Ne){if(nt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,se,be,Q.width,Q.height,Q.depth),L)if(x.layerUpdates.size>0){const V=Jl(Q.width,Q.height,x.format,x.type);for(const K of x.layerUpdates){const ue=Q.data.subarray(K*V/Q.data.BYTES_PER_ELEMENT,(K+1)*V/Q.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,K,Q.width,Q.height,1,de,Ee,ue)}x.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,de,Ee,Q.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,be,Q.width,Q.height,Q.depth,0,de,Ee,Q.data);else if(x.isData3DTexture)Ne?(nt&&t.texStorage3D(i.TEXTURE_3D,se,be,Q.width,Q.height,Q.depth),L&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,de,Ee,Q.data)):t.texImage3D(i.TEXTURE_3D,0,be,Q.width,Q.height,Q.depth,0,de,Ee,Q.data);else if(x.isFramebufferTexture){if(nt)if(Ne)t.texStorage2D(i.TEXTURE_2D,se,be,Q.width,Q.height);else{let V=Q.width,K=Q.height;for(let ue=0;ue<se;ue++)t.texImage2D(i.TEXTURE_2D,ue,be,V,K,0,de,Ee,null),V>>=1,K>>=1}}else if(Ge.length>0){if(Ne&&nt){const V=ye(Ge[0]);t.texStorage2D(i.TEXTURE_2D,se,be,V.width,V.height)}for(let V=0,K=Ge.length;V<K;V++)fe=Ge[V],Ne?L&&t.texSubImage2D(i.TEXTURE_2D,V,0,0,de,Ee,fe):t.texImage2D(i.TEXTURE_2D,V,be,de,Ee,fe);x.generateMipmaps=!1}else if(Ne){if(nt){const V=ye(Q);t.texStorage2D(i.TEXTURE_2D,se,be,V.width,V.height)}L&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,de,Ee,Q)}else t.texImage2D(i.TEXTURE_2D,0,be,de,Ee,Q);m(x)&&p(Y),ve.__version=X.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function te(T,x,F){if(x.image.length!==6)return;const Y=et(T,x),J=x.source;t.bindTexture(i.TEXTURE_CUBE_MAP,T.__webglTexture,i.TEXTURE0+F);const X=n.get(J);if(J.version!==X.__version||Y===!0){t.activeTexture(i.TEXTURE0+F);const ve=ke.getPrimaries(ke.workingColorSpace),oe=x.colorSpace===ti?null:ke.getPrimaries(x.colorSpace),he=x.colorSpace===ti||ve===oe?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,he);const Xe=x.isCompressedTexture||x.image[0].isCompressedTexture,Q=x.image[0]&&x.image[0].isDataTexture,de=[];for(let K=0;K<6;K++)!Xe&&!Q?de[K]=_(x.image[K],!0,s.maxCubemapSize):de[K]=Q?x.image[K].image:x.image[K],de[K]=rt(x,de[K]);const Ee=de[0],be=r.convert(x.format,x.colorSpace),fe=r.convert(x.type),Ge=E(x.internalFormat,be,fe,x.colorSpace),Ne=x.isVideoTexture!==!0,nt=X.__version===void 0||Y===!0,L=J.dataReady;let se=N(x,Ee);Oe(i.TEXTURE_CUBE_MAP,x);let V;if(Xe){Ne&&nt&&t.texStorage2D(i.TEXTURE_CUBE_MAP,se,Ge,Ee.width,Ee.height);for(let K=0;K<6;K++){V=de[K].mipmaps;for(let ue=0;ue<V.length;ue++){const ce=V[ue];x.format!==$t?be!==null?Ne?L&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue,0,0,ce.width,ce.height,be,ce.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue,Ge,ce.width,ce.height,0,ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ne?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue,0,0,ce.width,ce.height,be,fe,ce.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue,Ge,ce.width,ce.height,0,be,fe,ce.data)}}}else{if(V=x.mipmaps,Ne&&nt){V.length>0&&se++;const K=ye(de[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,se,Ge,K.width,K.height)}for(let K=0;K<6;K++)if(Q){Ne?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,de[K].width,de[K].height,be,fe,de[K].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ge,de[K].width,de[K].height,0,be,fe,de[K].data);for(let ue=0;ue<V.length;ue++){const Ie=V[ue].image[K].image;Ne?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue+1,0,0,Ie.width,Ie.height,be,fe,Ie.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue+1,Ge,Ie.width,Ie.height,0,be,fe,Ie.data)}}else{Ne?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,be,fe,de[K]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ge,be,fe,de[K]);for(let ue=0;ue<V.length;ue++){const ce=V[ue];Ne?L&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue+1,0,0,be,fe,ce.image[K]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue+1,Ge,be,fe,ce.image[K])}}}m(x)&&p(i.TEXTURE_CUBE_MAP),X.__version=J.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function _e(T,x,F,Y,J,X){const ve=r.convert(F.format,F.colorSpace),oe=r.convert(F.type),he=E(F.internalFormat,ve,oe,F.colorSpace),Xe=n.get(x),Q=n.get(F);if(Q.__renderTarget=x,!Xe.__hasExternalTextures){const de=Math.max(1,x.width>>X),Ee=Math.max(1,x.height>>X);J===i.TEXTURE_3D||J===i.TEXTURE_2D_ARRAY?t.texImage3D(J,X,he,de,Ee,x.depth,0,ve,oe,null):t.texImage2D(J,X,he,de,Ee,0,ve,oe,null)}t.bindFramebuffer(i.FRAMEBUFFER,T),Ve(x)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Y,J,Q.__webglTexture,0,He(x)):(J===i.TEXTURE_2D||J>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Y,J,Q.__webglTexture,X),t.bindFramebuffer(i.FRAMEBUFFER,null)}function re(T,x,F){if(i.bindRenderbuffer(i.RENDERBUFFER,T),x.depthBuffer){const Y=x.depthTexture,J=Y&&Y.isDepthTexture?Y.type:null,X=y(x.stencilBuffer,J),ve=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,oe=He(x);Ve(x)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,oe,X,x.width,x.height):F?i.renderbufferStorageMultisample(i.RENDERBUFFER,oe,X,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,X,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ve,i.RENDERBUFFER,T)}else{const Y=x.textures;for(let J=0;J<Y.length;J++){const X=Y[J],ve=r.convert(X.format,X.colorSpace),oe=r.convert(X.type),he=E(X.internalFormat,ve,oe,X.colorSpace),Xe=He(x);F&&Ve(x)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Xe,he,x.width,x.height):Ve(x)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Xe,he,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,he,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Te(T,x){if(x&&x.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,T),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Y=n.get(x.depthTexture);Y.__renderTarget=x,(!Y.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),j(x.depthTexture,0);const J=Y.__webglTexture,X=He(x);if(x.depthTexture.format===Ji)Ve(x)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,J,0);else if(x.depthTexture.format===cs)Ve(x)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function Pe(T){const x=n.get(T),F=T.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==T.depthTexture){const Y=T.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),Y){const J=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,Y.removeEventListener("dispose",J)};Y.addEventListener("dispose",J),x.__depthDisposeCallback=J}x.__boundDepthTexture=Y}if(T.depthTexture&&!x.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");Te(x.__webglFramebuffer,T)}else if(F){x.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[Y]),x.__webglDepthbuffer[Y]===void 0)x.__webglDepthbuffer[Y]=i.createRenderbuffer(),re(x.__webglDepthbuffer[Y],T,!1);else{const J=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,X=x.__webglDepthbuffer[Y];i.bindRenderbuffer(i.RENDERBUFFER,X),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,X)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),re(x.__webglDepthbuffer,T,!1);else{const Y=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,J=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,J),i.framebufferRenderbuffer(i.FRAMEBUFFER,Y,i.RENDERBUFFER,J)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Be(T,x,F){const Y=n.get(T);x!==void 0&&_e(Y.__webglFramebuffer,T,T.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),F!==void 0&&Pe(T)}function lt(T){const x=T.texture,F=n.get(T),Y=n.get(x);T.addEventListener("dispose",A);const J=T.textures,X=T.isWebGLCubeRenderTarget===!0,ve=J.length>1;if(ve||(Y.__webglTexture===void 0&&(Y.__webglTexture=i.createTexture()),Y.__version=x.version,o.memory.textures++),X){F.__webglFramebuffer=[];for(let oe=0;oe<6;oe++)if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer[oe]=[];for(let he=0;he<x.mipmaps.length;he++)F.__webglFramebuffer[oe][he]=i.createFramebuffer()}else F.__webglFramebuffer[oe]=i.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer=[];for(let oe=0;oe<x.mipmaps.length;oe++)F.__webglFramebuffer[oe]=i.createFramebuffer()}else F.__webglFramebuffer=i.createFramebuffer();if(ve)for(let oe=0,he=J.length;oe<he;oe++){const Xe=n.get(J[oe]);Xe.__webglTexture===void 0&&(Xe.__webglTexture=i.createTexture(),o.memory.textures++)}if(T.samples>0&&Ve(T)===!1){F.__webglMultisampledFramebuffer=i.createFramebuffer(),F.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let oe=0;oe<J.length;oe++){const he=J[oe];F.__webglColorRenderbuffer[oe]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,F.__webglColorRenderbuffer[oe]);const Xe=r.convert(he.format,he.colorSpace),Q=r.convert(he.type),de=E(he.internalFormat,Xe,Q,he.colorSpace,T.isXRRenderTarget===!0),Ee=He(T);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ee,de,T.width,T.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.RENDERBUFFER,F.__webglColorRenderbuffer[oe])}i.bindRenderbuffer(i.RENDERBUFFER,null),T.depthBuffer&&(F.__webglDepthRenderbuffer=i.createRenderbuffer(),re(F.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(X){t.bindTexture(i.TEXTURE_CUBE_MAP,Y.__webglTexture),Oe(i.TEXTURE_CUBE_MAP,x);for(let oe=0;oe<6;oe++)if(x.mipmaps&&x.mipmaps.length>0)for(let he=0;he<x.mipmaps.length;he++)_e(F.__webglFramebuffer[oe][he],T,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,he);else _e(F.__webglFramebuffer[oe],T,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0);m(x)&&p(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ve){for(let oe=0,he=J.length;oe<he;oe++){const Xe=J[oe],Q=n.get(Xe);t.bindTexture(i.TEXTURE_2D,Q.__webglTexture),Oe(i.TEXTURE_2D,Xe),_e(F.__webglFramebuffer,T,Xe,i.COLOR_ATTACHMENT0+oe,i.TEXTURE_2D,0),m(Xe)&&p(i.TEXTURE_2D)}t.unbindTexture()}else{let oe=i.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(oe=T.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(oe,Y.__webglTexture),Oe(oe,x),x.mipmaps&&x.mipmaps.length>0)for(let he=0;he<x.mipmaps.length;he++)_e(F.__webglFramebuffer[he],T,x,i.COLOR_ATTACHMENT0,oe,he);else _e(F.__webglFramebuffer,T,x,i.COLOR_ATTACHMENT0,oe,0);m(x)&&p(oe),t.unbindTexture()}T.depthBuffer&&Pe(T)}function We(T){const x=T.textures;for(let F=0,Y=x.length;F<Y;F++){const J=x[F];if(m(J)){const X=b(T),ve=n.get(J).__webglTexture;t.bindTexture(X,ve),p(X),t.unbindTexture()}}}const pt=[],U=[];function Gt(T){if(T.samples>0){if(Ve(T)===!1){const x=T.textures,F=T.width,Y=T.height;let J=i.COLOR_BUFFER_BIT;const X=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ve=n.get(T),oe=x.length>1;if(oe)for(let he=0;he<x.length;he++)t.bindFramebuffer(i.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ve.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ve.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ve.__webglFramebuffer);for(let he=0;he<x.length;he++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(J|=i.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(J|=i.STENCIL_BUFFER_BIT)),oe){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ve.__webglColorRenderbuffer[he]);const Xe=n.get(x[he]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Xe,0)}i.blitFramebuffer(0,0,F,Y,0,0,F,Y,J,i.NEAREST),c===!0&&(pt.length=0,U.length=0,pt.push(i.COLOR_ATTACHMENT0+he),T.depthBuffer&&T.resolveDepthBuffer===!1&&(pt.push(X),U.push(X),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,U)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,pt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),oe)for(let he=0;he<x.length;he++){t.bindFramebuffer(i.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.RENDERBUFFER,ve.__webglColorRenderbuffer[he]);const Xe=n.get(x[he]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ve.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.TEXTURE_2D,Xe,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ve.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&c){const x=T.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}function He(T){return Math.min(s.maxSamples,T.samples)}function Ve(T){const x=n.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function Se(T){const x=o.render.frame;u.get(T)!==x&&(u.set(T,x),T.update())}function rt(T,x){const F=T.colorSpace,Y=T.format,J=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||F!==Ft&&F!==ti&&(ke.getTransfer(F)===Qe?(Y!==$t||J!==zn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),x}function ye(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(l.width=T.naturalWidth||T.width,l.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(l.width=T.displayWidth,l.height=T.displayHeight):(l.width=T.width,l.height=T.height),l}this.allocateTextureUnit=O,this.resetTextureUnits=k,this.setTexture2D=j,this.setTexture2DArray=W,this.setTexture3D=$,this.setTextureCube=H,this.rebindTextures=Be,this.setupRenderTarget=lt,this.updateRenderTargetMipmap=We,this.updateMultisampleRenderTarget=Gt,this.setupDepthRenderbuffer=Pe,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=Ve}function f0(i,e){function t(n,s=ti){let r;const o=ke.getTransfer(s);if(n===zn)return i.UNSIGNED_BYTE;if(n===mc)return i.UNSIGNED_SHORT_4_4_4_4;if(n===gc)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Zu)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Yu)return i.BYTE;if(n===Ku)return i.SHORT;if(n===Ys)return i.UNSIGNED_SHORT;if(n===pc)return i.INT;if(n===bi)return i.UNSIGNED_INT;if(n===cn)return i.FLOAT;if(n===tr)return i.HALF_FLOAT;if(n===$u)return i.ALPHA;if(n===Ju)return i.RGB;if(n===$t)return i.RGBA;if(n===Qu)return i.LUMINANCE;if(n===eh)return i.LUMINANCE_ALPHA;if(n===Ji)return i.DEPTH_COMPONENT;if(n===cs)return i.DEPTH_STENCIL;if(n===_c)return i.RED;if(n===xc)return i.RED_INTEGER;if(n===th)return i.RG;if(n===vc)return i.RG_INTEGER;if(n===Mc)return i.RGBA_INTEGER;if(n===Wr||n===Xr||n===qr||n===jr)if(o===Qe)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Wr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Xr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===qr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===jr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Wr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Xr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===qr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===jr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Aa||n===wa||n===Ra||n===Ca)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Aa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===wa)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ra)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ca)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Pa||n===La||n===Ia)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Pa||n===La)return o===Qe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ia)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Da||n===Ua||n===Na||n===Fa||n===Oa||n===Ba||n===za||n===ka||n===Ha||n===Va||n===Ga||n===Wa||n===Xa||n===qa)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Da)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ua)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Na)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Fa)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Oa)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Ba)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===za)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ka)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ha)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Va)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ga)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Wa)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Xa)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===qa)return o===Qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Yr||n===ja||n===Ya)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Yr)return o===Qe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ja)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ya)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===nh||n===Ka||n===Za||n===$a)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Yr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ka)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Za)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===$a)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===as?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}class p0 extends At{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Fn extends ct{constructor(){super(),this.isGroup=!0,this.type="Group"}}const m0={type:"move"};class Zo{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Fn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Fn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Fn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(const _ of e.hand.values()){const m=t.getJointPose(_,n),p=this._getHandJoint(l,_);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,g=.005;l.inputState.pinching&&d>f+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=f-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(m0)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Fn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const g0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,_0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class x0{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){const s=new yt,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new ri({vertexShader:g0,fragmentShader:_0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new wt(new _o(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class v0 extends xs{constructor(e,t){super();const n=this;let s=null,r=1,o=null,a="local-floor",c=1,l=null,u=null,h=null,d=null,f=null,g=null;const _=new x0,m=t.getContextAttributes();let p=null,b=null;const E=[],y=[],N=new Le;let w=null;const A=new At;A.viewport=new je;const P=new At;P.viewport=new je;const S=[A,P],M=new p0;let R=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let te=E[q];return te===void 0&&(te=new Zo,E[q]=te),te.getTargetRaySpace()},this.getControllerGrip=function(q){let te=E[q];return te===void 0&&(te=new Zo,E[q]=te),te.getGripSpace()},this.getHand=function(q){let te=E[q];return te===void 0&&(te=new Zo,E[q]=te),te.getHandSpace()};function O(q){const te=y.indexOf(q.inputSource);if(te===-1)return;const _e=E[te];_e!==void 0&&(_e.update(q.inputSource,q.frame,l||o),_e.dispatchEvent({type:q.type,data:q.inputSource}))}function G(){s.removeEventListener("select",O),s.removeEventListener("selectstart",O),s.removeEventListener("selectend",O),s.removeEventListener("squeeze",O),s.removeEventListener("squeezestart",O),s.removeEventListener("squeezeend",O),s.removeEventListener("end",G),s.removeEventListener("inputsourceschange",j);for(let q=0;q<E.length;q++){const te=y[q];te!==null&&(y[q]=null,E[q].disconnect(te))}R=null,k=null,_.reset(),e.setRenderTarget(p),f=null,d=null,h=null,s=null,b=null,et.stop(),n.isPresenting=!1,e.setPixelRatio(w),e.setSize(N.width,N.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){a=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(q){l=q},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(p=e.getRenderTarget(),s.addEventListener("select",O),s.addEventListener("selectstart",O),s.addEventListener("selectend",O),s.addEventListener("squeeze",O),s.addEventListener("squeezestart",O),s.addEventListener("squeezeend",O),s.addEventListener("end",G),s.addEventListener("inputsourceschange",j),m.xrCompatible!==!0&&await t.makeXRCompatible(),w=e.getPixelRatio(),e.getSize(N),s.renderState.layers===void 0){const te={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,te),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),b=new Ai(f.framebufferWidth,f.framebufferHeight,{format:$t,type:zn,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil})}else{let te=null,_e=null,re=null;m.depth&&(re=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,te=m.stencil?cs:Ji,_e=m.stencil?as:bi);const Te={colorFormat:t.RGBA8,depthFormat:re,scaleFactor:r};h=new XRWebGLBinding(s,t),d=h.createProjectionLayer(Te),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),b=new Ai(d.textureWidth,d.textureHeight,{format:$t,type:zn,depthTexture:new _h(d.textureWidth,d.textureHeight,_e,void 0,void 0,void 0,void 0,void 0,void 0,te),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),et.setContext(s),et.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function j(q){for(let te=0;te<q.removed.length;te++){const _e=q.removed[te],re=y.indexOf(_e);re>=0&&(y[re]=null,E[re].disconnect(_e))}for(let te=0;te<q.added.length;te++){const _e=q.added[te];let re=y.indexOf(_e);if(re===-1){for(let Pe=0;Pe<E.length;Pe++)if(Pe>=y.length){y.push(_e),re=Pe;break}else if(y[Pe]===null){y[Pe]=_e,re=Pe;break}if(re===-1)break}const Te=E[re];Te&&Te.connect(_e)}}const W=new C,$=new C;function H(q,te,_e){W.setFromMatrixPosition(te.matrixWorld),$.setFromMatrixPosition(_e.matrixWorld);const re=W.distanceTo($),Te=te.projectionMatrix.elements,Pe=_e.projectionMatrix.elements,Be=Te[14]/(Te[10]-1),lt=Te[14]/(Te[10]+1),We=(Te[9]+1)/Te[5],pt=(Te[9]-1)/Te[5],U=(Te[8]-1)/Te[0],Gt=(Pe[8]+1)/Pe[0],He=Be*U,Ve=Be*Gt,Se=re/(-U+Gt),rt=Se*-U;if(te.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(rt),q.translateZ(Se),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),Te[10]===-1)q.projectionMatrix.copy(te.projectionMatrix),q.projectionMatrixInverse.copy(te.projectionMatrixInverse);else{const ye=Be+Se,T=lt+Se,x=He-rt,F=Ve+(re-rt),Y=We*lt/T*ye,J=pt*lt/T*ye;q.projectionMatrix.makePerspective(x,F,Y,J,ye,T),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function Z(q,te){te===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(te.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let te=q.near,_e=q.far;_.texture!==null&&(_.depthNear>0&&(te=_.depthNear),_.depthFar>0&&(_e=_.depthFar)),M.near=P.near=A.near=te,M.far=P.far=A.far=_e,(R!==M.near||k!==M.far)&&(s.updateRenderState({depthNear:M.near,depthFar:M.far}),R=M.near,k=M.far),A.layers.mask=q.layers.mask|2,P.layers.mask=q.layers.mask|4,M.layers.mask=A.layers.mask|P.layers.mask;const re=q.parent,Te=M.cameras;Z(M,re);for(let Pe=0;Pe<Te.length;Pe++)Z(Te[Pe],re);Te.length===2?H(M,A,P):M.projectionMatrix.copy(A.projectionMatrix),ne(q,M,re)};function ne(q,te,_e){_e===null?q.matrix.copy(te.matrixWorld):(q.matrix.copy(_e.matrixWorld),q.matrix.invert(),q.matrix.multiply(te.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(te.projectionMatrix),q.projectionMatrixInverse.copy(te.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=ls*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(q){c=q,d!==null&&(d.fixedFoveation=q),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=q)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(M)};let xe=null;function Oe(q,te){if(u=te.getViewerPose(l||o),g=te,u!==null){const _e=u.views;f!==null&&(e.setRenderTargetFramebuffer(b,f.framebuffer),e.setRenderTarget(b));let re=!1;_e.length!==M.cameras.length&&(M.cameras.length=0,re=!0);for(let Pe=0;Pe<_e.length;Pe++){const Be=_e[Pe];let lt=null;if(f!==null)lt=f.getViewport(Be);else{const pt=h.getViewSubImage(d,Be);lt=pt.viewport,Pe===0&&(e.setRenderTargetTextures(b,pt.colorTexture,d.ignoreDepthValues?void 0:pt.depthStencilTexture),e.setRenderTarget(b))}let We=S[Pe];We===void 0&&(We=new At,We.layers.enable(Pe),We.viewport=new je,S[Pe]=We),We.matrix.fromArray(Be.transform.matrix),We.matrix.decompose(We.position,We.quaternion,We.scale),We.projectionMatrix.fromArray(Be.projectionMatrix),We.projectionMatrixInverse.copy(We.projectionMatrix).invert(),We.viewport.set(lt.x,lt.y,lt.width,lt.height),Pe===0&&(M.matrix.copy(We.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),re===!0&&M.cameras.push(We)}const Te=s.enabledFeatures;if(Te&&Te.includes("depth-sensing")){const Pe=h.getDepthInformation(_e[0]);Pe&&Pe.isValid&&Pe.texture&&_.init(e,Pe,s.renderState)}}for(let _e=0;_e<E.length;_e++){const re=y[_e],Te=E[_e];re!==null&&Te!==void 0&&Te.update(re,te,l||o)}xe&&xe(q,te),te.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:te}),g=null}const et=new gh;et.setAnimationLoop(Oe),this.setAnimationLoop=function(q){xe=q},this.dispose=function(){}}}const fi=new mn,M0=new we;function y0(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,fh(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,b,E,y){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),h(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,y)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),_(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?c(m,p,b,E):p.isSpriteMaterial?l(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===It&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===It&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const b=e.get(p),E=b.envMap,y=b.envMapRotation;E&&(m.envMap.value=E,fi.copy(y),fi.x*=-1,fi.y*=-1,fi.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(fi.y*=-1,fi.z*=-1),m.envMapRotation.value.setFromMatrix4(M0.makeRotationFromEuler(fi)),m.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function c(m,p,b,E){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*b,m.scale.value=E*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function l(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function h(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,b){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===It&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function _(m,p){const b=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function S0(i,e,t,n){let s={},r={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(b,E){const y=E.program;n.uniformBlockBinding(b,y)}function l(b,E){let y=s[b.id];y===void 0&&(g(b),y=u(b),s[b.id]=y,b.addEventListener("dispose",m));const N=E.program;n.updateUBOMapping(b,N);const w=e.render.frame;r[b.id]!==w&&(d(b),r[b.id]=w)}function u(b){const E=h();b.__bindingPointIndex=E;const y=i.createBuffer(),N=b.__size,w=b.usage;return i.bindBuffer(i.UNIFORM_BUFFER,y),i.bufferData(i.UNIFORM_BUFFER,N,w),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,E,y),y}function h(){for(let b=0;b<a;b++)if(o.indexOf(b)===-1)return o.push(b),b;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(b){const E=s[b.id],y=b.uniforms,N=b.__cache;i.bindBuffer(i.UNIFORM_BUFFER,E);for(let w=0,A=y.length;w<A;w++){const P=Array.isArray(y[w])?y[w]:[y[w]];for(let S=0,M=P.length;S<M;S++){const R=P[S];if(f(R,w,S,N)===!0){const k=R.__offset,O=Array.isArray(R.value)?R.value:[R.value];let G=0;for(let j=0;j<O.length;j++){const W=O[j],$=_(W);typeof W=="number"||typeof W=="boolean"?(R.__data[0]=W,i.bufferSubData(i.UNIFORM_BUFFER,k+G,R.__data)):W.isMatrix3?(R.__data[0]=W.elements[0],R.__data[1]=W.elements[1],R.__data[2]=W.elements[2],R.__data[3]=0,R.__data[4]=W.elements[3],R.__data[5]=W.elements[4],R.__data[6]=W.elements[5],R.__data[7]=0,R.__data[8]=W.elements[6],R.__data[9]=W.elements[7],R.__data[10]=W.elements[8],R.__data[11]=0):(W.toArray(R.__data,G),G+=$.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,k,R.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(b,E,y,N){const w=b.value,A=E+"_"+y;if(N[A]===void 0)return typeof w=="number"||typeof w=="boolean"?N[A]=w:N[A]=w.clone(),!0;{const P=N[A];if(typeof w=="number"||typeof w=="boolean"){if(P!==w)return N[A]=w,!0}else if(P.equals(w)===!1)return P.copy(w),!0}return!1}function g(b){const E=b.uniforms;let y=0;const N=16;for(let A=0,P=E.length;A<P;A++){const S=Array.isArray(E[A])?E[A]:[E[A]];for(let M=0,R=S.length;M<R;M++){const k=S[M],O=Array.isArray(k.value)?k.value:[k.value];for(let G=0,j=O.length;G<j;G++){const W=O[G],$=_(W),H=y%N,Z=H%$.boundary,ne=H+Z;y+=Z,ne!==0&&N-ne<$.storage&&(y+=N-ne),k.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=y,y+=$.storage}}}const w=y%N;return w>0&&(y+=N-w),b.__size=y,b.__cache={},this}function _(b){const E={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(E.boundary=4,E.storage=4):b.isVector2?(E.boundary=8,E.storage=8):b.isVector3||b.isColor?(E.boundary=16,E.storage=12):b.isVector4?(E.boundary=16,E.storage=16):b.isMatrix3?(E.boundary=48,E.storage=48):b.isMatrix4?(E.boundary=64,E.storage=64):b.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",b),E}function m(b){const E=b.target;E.removeEventListener("dispose",m);const y=o.indexOf(E.__bindingPointIndex);o.splice(y,1),i.deleteBuffer(s[E.id]),delete s[E.id],delete r[E.id]}function p(){for(const b in s)i.deleteBuffer(s[b]);o=[],s={},r={}}return{bind:c,update:l,dispose:p}}class E0{constructor(e={}){const{canvas:t=hf(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;const g=new Uint32Array(4),_=new Int32Array(4);let m=null,p=null;const b=[],E=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=xt,this.toneMapping=si,this.toneMappingExposure=1;const y=this;let N=!1,w=0,A=0,P=null,S=-1,M=null;const R=new je,k=new je;let O=null;const G=new Ae(0);let j=0,W=t.width,$=t.height,H=1,Z=null,ne=null;const xe=new je(0,0,W,$),Oe=new je(0,0,W,$);let et=!1;const q=new Sc;let te=!1,_e=!1;const re=new we,Te=new we,Pe=new C,Be=new je,lt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let We=!1;function pt(){return P===null?H:1}let U=n;function Gt(v,I){return t.getContext(v,I)}try{const v={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${fc}`),t.addEventListener("webglcontextlost",K,!1),t.addEventListener("webglcontextrestored",ue,!1),t.addEventListener("webglcontextcreationerror",ce,!1),U===null){const I="webgl2";if(U=Gt(I,v),U===null)throw Gt(I)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw console.error("THREE.WebGLRenderer: "+v.message),v}let He,Ve,Se,rt,ye,T,x,F,Y,J,X,ve,oe,he,Xe,Q,de,Ee,be,fe,Ge,Ne,nt,L;function se(){He=new Rg(U),He.init(),Ne=new f0(U,He),Ve=new Sg(U,He,e,Ne),Se=new u0(U,He),Ve.reverseDepthBuffer&&d&&Se.buffers.depth.setReversed(!0),rt=new Lg(U),ye=new K_,T=new d0(U,He,Se,ye,Ve,Ne,rt),x=new Tg(y),F=new wg(y),Y=new Bf(U),nt=new Mg(U,Y),J=new Cg(U,Y,rt,nt),X=new Dg(U,J,Y,rt),be=new Ig(U,Ve,T),Q=new Eg(ye),ve=new Y_(y,x,F,He,Ve,nt,Q),oe=new y0(y,ye),he=new $_,Xe=new i0(He),Ee=new vg(y,x,F,Se,X,f,c),de=new c0(y,X,Ve),L=new S0(U,rt,Ve,Se),fe=new yg(U,He,rt),Ge=new Pg(U,He,rt),rt.programs=ve.programs,y.capabilities=Ve,y.extensions=He,y.properties=ye,y.renderLists=he,y.shadowMap=de,y.state=Se,y.info=rt}se();const V=new v0(y,U);this.xr=V,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){const v=He.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){const v=He.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(v){v!==void 0&&(H=v,this.setSize(W,$,!1))},this.getSize=function(v){return v.set(W,$)},this.setSize=function(v,I,B=!0){if(V.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}W=v,$=I,t.width=Math.floor(v*H),t.height=Math.floor(I*H),B===!0&&(t.style.width=v+"px",t.style.height=I+"px"),this.setViewport(0,0,v,I)},this.getDrawingBufferSize=function(v){return v.set(W*H,$*H).floor()},this.setDrawingBufferSize=function(v,I,B){W=v,$=I,H=B,t.width=Math.floor(v*B),t.height=Math.floor(I*B),this.setViewport(0,0,v,I)},this.getCurrentViewport=function(v){return v.copy(R)},this.getViewport=function(v){return v.copy(xe)},this.setViewport=function(v,I,B,z){v.isVector4?xe.set(v.x,v.y,v.z,v.w):xe.set(v,I,B,z),Se.viewport(R.copy(xe).multiplyScalar(H).round())},this.getScissor=function(v){return v.copy(Oe)},this.setScissor=function(v,I,B,z){v.isVector4?Oe.set(v.x,v.y,v.z,v.w):Oe.set(v,I,B,z),Se.scissor(k.copy(Oe).multiplyScalar(H).round())},this.getScissorTest=function(){return et},this.setScissorTest=function(v){Se.setScissorTest(et=v)},this.setOpaqueSort=function(v){Z=v},this.setTransparentSort=function(v){ne=v},this.getClearColor=function(v){return v.copy(Ee.getClearColor())},this.setClearColor=function(){Ee.setClearColor.apply(Ee,arguments)},this.getClearAlpha=function(){return Ee.getClearAlpha()},this.setClearAlpha=function(){Ee.setClearAlpha.apply(Ee,arguments)},this.clear=function(v=!0,I=!0,B=!0){let z=0;if(v){let D=!1;if(P!==null){const ee=P.texture.format;D=ee===Mc||ee===vc||ee===xc}if(D){const ee=P.texture.type,le=ee===zn||ee===bi||ee===Ys||ee===as||ee===mc||ee===gc,pe=Ee.getClearColor(),me=Ee.getClearAlpha(),Re=pe.r,De=pe.g,ge=pe.b;le?(g[0]=Re,g[1]=De,g[2]=ge,g[3]=me,U.clearBufferuiv(U.COLOR,0,g)):(_[0]=Re,_[1]=De,_[2]=ge,_[3]=me,U.clearBufferiv(U.COLOR,0,_))}else z|=U.COLOR_BUFFER_BIT}I&&(z|=U.DEPTH_BUFFER_BIT),B&&(z|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),U.clear(z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",K,!1),t.removeEventListener("webglcontextrestored",ue,!1),t.removeEventListener("webglcontextcreationerror",ce,!1),he.dispose(),Xe.dispose(),ye.dispose(),x.dispose(),F.dispose(),X.dispose(),nt.dispose(),L.dispose(),ve.dispose(),V.dispose(),V.removeEventListener("sessionstart",Gc),V.removeEventListener("sessionend",Wc),ai.stop()};function K(v){v.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),N=!0}function ue(){console.log("THREE.WebGLRenderer: Context Restored."),N=!1;const v=rt.autoReset,I=de.enabled,B=de.autoUpdate,z=de.needsUpdate,D=de.type;se(),rt.autoReset=v,de.enabled=I,de.autoUpdate=B,de.needsUpdate=z,de.type=D}function ce(v){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function Ie(v){const I=v.target;I.removeEventListener("dispose",Ie),ht(I)}function ht(v){Rt(v),ye.remove(v)}function Rt(v){const I=ye.get(v).programs;I!==void 0&&(I.forEach(function(B){ve.releaseProgram(B)}),v.isShaderMaterial&&ve.releaseShaderCache(v))}this.renderBufferDirect=function(v,I,B,z,D,ee){I===null&&(I=lt);const le=D.isMesh&&D.matrixWorld.determinant()<0,pe=nd(v,I,B,z,D);Se.setMaterial(z,le);let me=B.index,Re=1;if(z.wireframe===!0){if(me=J.getWireframeAttribute(B),me===void 0)return;Re=2}const De=B.drawRange,ge=B.attributes.position;let qe=De.start*Re,it=(De.start+De.count)*Re;ee!==null&&(qe=Math.max(qe,ee.start*Re),it=Math.min(it,(ee.start+ee.count)*Re)),me!==null?(qe=Math.max(qe,0),it=Math.min(it,me.count)):ge!=null&&(qe=Math.max(qe,0),it=Math.min(it,ge.count));const ot=it-qe;if(ot<0||ot===1/0)return;nt.setup(D,z,pe,B,me);let Ot,Ye=fe;if(me!==null&&(Ot=Y.get(me),Ye=Ge,Ye.setIndex(Ot)),D.isMesh)z.wireframe===!0?(Se.setLineWidth(z.wireframeLinewidth*pt()),Ye.setMode(U.LINES)):Ye.setMode(U.TRIANGLES);else if(D.isLine){let Me=z.linewidth;Me===void 0&&(Me=1),Se.setLineWidth(Me*pt()),D.isLineSegments?Ye.setMode(U.LINES):D.isLineLoop?Ye.setMode(U.LINE_LOOP):Ye.setMode(U.LINE_STRIP)}else D.isPoints?Ye.setMode(U.POINTS):D.isSprite&&Ye.setMode(U.TRIANGLES);if(D.isBatchedMesh)if(D._multiDrawInstances!==null)Ye.renderMultiDrawInstances(D._multiDrawStarts,D._multiDrawCounts,D._multiDrawCount,D._multiDrawInstances);else if(He.get("WEBGL_multi_draw"))Ye.renderMultiDraw(D._multiDrawStarts,D._multiDrawCounts,D._multiDrawCount);else{const Me=D._multiDrawStarts,Mn=D._multiDrawCounts,Ke=D._multiDrawCount,en=me?Y.get(me).bytesPerElement:1,wi=ye.get(z).currentProgram.getUniforms();for(let zt=0;zt<Ke;zt++)wi.setValue(U,"_gl_DrawID",zt),Ye.render(Me[zt]/en,Mn[zt])}else if(D.isInstancedMesh)Ye.renderInstances(qe,ot,D.count);else if(B.isInstancedBufferGeometry){const Me=B._maxInstanceCount!==void 0?B._maxInstanceCount:1/0,Mn=Math.min(B.instanceCount,Me);Ye.renderInstances(qe,ot,Mn)}else Ye.render(qe,ot)};function Ze(v,I,B){v.transparent===!0&&v.side===jt&&v.forceSinglePass===!1?(v.side=It,v.needsUpdate=!0,cr(v,I,B),v.side=Bn,v.needsUpdate=!0,cr(v,I,B),v.side=jt):cr(v,I,B)}this.compile=function(v,I,B=null){B===null&&(B=v),p=Xe.get(B),p.init(I),E.push(p),B.traverseVisible(function(D){D.isLight&&D.layers.test(I.layers)&&(p.pushLight(D),D.castShadow&&p.pushShadow(D))}),v!==B&&v.traverseVisible(function(D){D.isLight&&D.layers.test(I.layers)&&(p.pushLight(D),D.castShadow&&p.pushShadow(D))}),p.setupLights();const z=new Set;return v.traverse(function(D){if(!(D.isMesh||D.isPoints||D.isLine||D.isSprite))return;const ee=D.material;if(ee)if(Array.isArray(ee))for(let le=0;le<ee.length;le++){const pe=ee[le];Ze(pe,B,D),z.add(pe)}else Ze(ee,B,D),z.add(ee)}),E.pop(),p=null,z},this.compileAsync=function(v,I,B=null){const z=this.compile(v,I,B);return new Promise(D=>{function ee(){if(z.forEach(function(le){ye.get(le).currentProgram.isReady()&&z.delete(le)}),z.size===0){D(v);return}setTimeout(ee,10)}He.get("KHR_parallel_shader_compile")!==null?ee():setTimeout(ee,10)})};let Qt=null;function vn(v){Qt&&Qt(v)}function Gc(){ai.stop()}function Wc(){ai.start()}const ai=new gh;ai.setAnimationLoop(vn),typeof self<"u"&&ai.setContext(self),this.setAnimationLoop=function(v){Qt=v,V.setAnimationLoop(v),v===null?ai.stop():ai.start()},V.addEventListener("sessionstart",Gc),V.addEventListener("sessionend",Wc),this.render=function(v,I){if(I!==void 0&&I.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(N===!0)return;if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),V.enabled===!0&&V.isPresenting===!0&&(V.cameraAutoUpdate===!0&&V.updateCamera(I),I=V.getCamera()),v.isScene===!0&&v.onBeforeRender(y,v,I,P),p=Xe.get(v,E.length),p.init(I),E.push(p),Te.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),q.setFromProjectionMatrix(Te),_e=this.localClippingEnabled,te=Q.init(this.clippingPlanes,_e),m=he.get(v,b.length),m.init(),b.push(m),V.enabled===!0&&V.isPresenting===!0){const ee=y.xr.getDepthSensingMesh();ee!==null&&So(ee,I,-1/0,y.sortObjects)}So(v,I,0,y.sortObjects),m.finish(),y.sortObjects===!0&&m.sort(Z,ne),We=V.enabled===!1||V.isPresenting===!1||V.hasDepthSensing()===!1,We&&Ee.addToRenderList(m,v),this.info.render.frame++,te===!0&&Q.beginShadows();const B=p.state.shadowsArray;de.render(B,v,I),te===!0&&Q.endShadows(),this.info.autoReset===!0&&this.info.reset();const z=m.opaque,D=m.transmissive;if(p.setupLights(),I.isArrayCamera){const ee=I.cameras;if(D.length>0)for(let le=0,pe=ee.length;le<pe;le++){const me=ee[le];qc(z,D,v,me)}We&&Ee.render(v);for(let le=0,pe=ee.length;le<pe;le++){const me=ee[le];Xc(m,v,me,me.viewport)}}else D.length>0&&qc(z,D,v,I),We&&Ee.render(v),Xc(m,v,I);P!==null&&(T.updateMultisampleRenderTarget(P),T.updateRenderTargetMipmap(P)),v.isScene===!0&&v.onAfterRender(y,v,I),nt.resetDefaultState(),S=-1,M=null,E.pop(),E.length>0?(p=E[E.length-1],te===!0&&Q.setGlobalState(y.clippingPlanes,p.state.camera)):p=null,b.pop(),b.length>0?m=b[b.length-1]:m=null};function So(v,I,B,z){if(v.visible===!1)return;if(v.layers.test(I.layers)){if(v.isGroup)B=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(I);else if(v.isLight)p.pushLight(v),v.castShadow&&p.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||q.intersectsSprite(v)){z&&Be.setFromMatrixPosition(v.matrixWorld).applyMatrix4(Te);const le=X.update(v),pe=v.material;pe.visible&&m.push(v,le,pe,B,Be.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||q.intersectsObject(v))){const le=X.update(v),pe=v.material;if(z&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),Be.copy(v.boundingSphere.center)):(le.boundingSphere===null&&le.computeBoundingSphere(),Be.copy(le.boundingSphere.center)),Be.applyMatrix4(v.matrixWorld).applyMatrix4(Te)),Array.isArray(pe)){const me=le.groups;for(let Re=0,De=me.length;Re<De;Re++){const ge=me[Re],qe=pe[ge.materialIndex];qe&&qe.visible&&m.push(v,le,qe,B,Be.z,ge)}}else pe.visible&&m.push(v,le,pe,B,Be.z,null)}}const ee=v.children;for(let le=0,pe=ee.length;le<pe;le++)So(ee[le],I,B,z)}function Xc(v,I,B,z){const D=v.opaque,ee=v.transmissive,le=v.transparent;p.setupLightsView(B),te===!0&&Q.setGlobalState(y.clippingPlanes,B),z&&Se.viewport(R.copy(z)),D.length>0&&ar(D,I,B),ee.length>0&&ar(ee,I,B),le.length>0&&ar(le,I,B),Se.buffers.depth.setTest(!0),Se.buffers.depth.setMask(!0),Se.buffers.color.setMask(!0),Se.setPolygonOffset(!1)}function qc(v,I,B,z){if((B.isScene===!0?B.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[z.id]===void 0&&(p.state.transmissionRenderTarget[z.id]=new Ai(1,1,{generateMipmaps:!0,type:He.has("EXT_color_buffer_half_float")||He.has("EXT_color_buffer_float")?tr:zn,minFilter:Dn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ke.workingColorSpace}));const ee=p.state.transmissionRenderTarget[z.id],le=z.viewport||R;ee.setSize(le.z,le.w);const pe=y.getRenderTarget();y.setRenderTarget(ee),y.getClearColor(G),j=y.getClearAlpha(),j<1&&y.setClearColor(16777215,.5),y.clear(),We&&Ee.render(B);const me=y.toneMapping;y.toneMapping=si;const Re=z.viewport;if(z.viewport!==void 0&&(z.viewport=void 0),p.setupLightsView(z),te===!0&&Q.setGlobalState(y.clippingPlanes,z),ar(v,B,z),T.updateMultisampleRenderTarget(ee),T.updateRenderTargetMipmap(ee),He.has("WEBGL_multisampled_render_to_texture")===!1){let De=!1;for(let ge=0,qe=I.length;ge<qe;ge++){const it=I[ge],ot=it.object,Ot=it.geometry,Ye=it.material,Me=it.group;if(Ye.side===jt&&ot.layers.test(z.layers)){const Mn=Ye.side;Ye.side=It,Ye.needsUpdate=!0,jc(ot,B,z,Ot,Ye,Me),Ye.side=Mn,Ye.needsUpdate=!0,De=!0}}De===!0&&(T.updateMultisampleRenderTarget(ee),T.updateRenderTargetMipmap(ee))}y.setRenderTarget(pe),y.setClearColor(G,j),Re!==void 0&&(z.viewport=Re),y.toneMapping=me}function ar(v,I,B){const z=I.isScene===!0?I.overrideMaterial:null;for(let D=0,ee=v.length;D<ee;D++){const le=v[D],pe=le.object,me=le.geometry,Re=z===null?le.material:z,De=le.group;pe.layers.test(B.layers)&&jc(pe,I,B,me,Re,De)}}function jc(v,I,B,z,D,ee){v.onBeforeRender(y,I,B,z,D,ee),v.modelViewMatrix.multiplyMatrices(B.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),D.onBeforeRender(y,I,B,z,v,ee),D.transparent===!0&&D.side===jt&&D.forceSinglePass===!1?(D.side=It,D.needsUpdate=!0,y.renderBufferDirect(B,I,z,D,v,ee),D.side=Bn,D.needsUpdate=!0,y.renderBufferDirect(B,I,z,D,v,ee),D.side=jt):y.renderBufferDirect(B,I,z,D,v,ee),v.onAfterRender(y,I,B,z,D,ee)}function cr(v,I,B){I.isScene!==!0&&(I=lt);const z=ye.get(v),D=p.state.lights,ee=p.state.shadowsArray,le=D.state.version,pe=ve.getParameters(v,D.state,ee,I,B),me=ve.getProgramCacheKey(pe);let Re=z.programs;z.environment=v.isMeshStandardMaterial?I.environment:null,z.fog=I.fog,z.envMap=(v.isMeshStandardMaterial?F:x).get(v.envMap||z.environment),z.envMapRotation=z.environment!==null&&v.envMap===null?I.environmentRotation:v.envMapRotation,Re===void 0&&(v.addEventListener("dispose",Ie),Re=new Map,z.programs=Re);let De=Re.get(me);if(De!==void 0){if(z.currentProgram===De&&z.lightsStateVersion===le)return Kc(v,pe),De}else pe.uniforms=ve.getUniforms(v),v.onBeforeCompile(pe,y),De=ve.acquireProgram(pe,me),Re.set(me,De),z.uniforms=pe.uniforms;const ge=z.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(ge.clippingPlanes=Q.uniform),Kc(v,pe),z.needsLights=sd(v),z.lightsStateVersion=le,z.needsLights&&(ge.ambientLightColor.value=D.state.ambient,ge.lightProbe.value=D.state.probe,ge.directionalLights.value=D.state.directional,ge.directionalLightShadows.value=D.state.directionalShadow,ge.spotLights.value=D.state.spot,ge.spotLightShadows.value=D.state.spotShadow,ge.rectAreaLights.value=D.state.rectArea,ge.ltc_1.value=D.state.rectAreaLTC1,ge.ltc_2.value=D.state.rectAreaLTC2,ge.pointLights.value=D.state.point,ge.pointLightShadows.value=D.state.pointShadow,ge.hemisphereLights.value=D.state.hemi,ge.directionalShadowMap.value=D.state.directionalShadowMap,ge.directionalShadowMatrix.value=D.state.directionalShadowMatrix,ge.spotShadowMap.value=D.state.spotShadowMap,ge.spotLightMatrix.value=D.state.spotLightMatrix,ge.spotLightMap.value=D.state.spotLightMap,ge.pointShadowMap.value=D.state.pointShadowMap,ge.pointShadowMatrix.value=D.state.pointShadowMatrix),z.currentProgram=De,z.uniformsList=null,De}function Yc(v){if(v.uniformsList===null){const I=v.currentProgram.getUniforms();v.uniformsList=Kr.seqWithValue(I.seq,v.uniforms)}return v.uniformsList}function Kc(v,I){const B=ye.get(v);B.outputColorSpace=I.outputColorSpace,B.batching=I.batching,B.batchingColor=I.batchingColor,B.instancing=I.instancing,B.instancingColor=I.instancingColor,B.instancingMorph=I.instancingMorph,B.skinning=I.skinning,B.morphTargets=I.morphTargets,B.morphNormals=I.morphNormals,B.morphColors=I.morphColors,B.morphTargetsCount=I.morphTargetsCount,B.numClippingPlanes=I.numClippingPlanes,B.numIntersection=I.numClipIntersection,B.vertexAlphas=I.vertexAlphas,B.vertexTangents=I.vertexTangents,B.toneMapping=I.toneMapping}function nd(v,I,B,z,D){I.isScene!==!0&&(I=lt),T.resetTextureUnits();const ee=I.fog,le=z.isMeshStandardMaterial?I.environment:null,pe=P===null?y.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:Ft,me=(z.isMeshStandardMaterial?F:x).get(z.envMap||le),Re=z.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,De=!!B.attributes.tangent&&(!!z.normalMap||z.anisotropy>0),ge=!!B.morphAttributes.position,qe=!!B.morphAttributes.normal,it=!!B.morphAttributes.color;let ot=si;z.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(ot=y.toneMapping);const Ot=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,Ye=Ot!==void 0?Ot.length:0,Me=ye.get(z),Mn=p.state.lights;if(te===!0&&(_e===!0||v!==M)){const Wt=v===M&&z.id===S;Q.setState(z,v,Wt)}let Ke=!1;z.version===Me.__version?(Me.needsLights&&Me.lightsStateVersion!==Mn.state.version||Me.outputColorSpace!==pe||D.isBatchedMesh&&Me.batching===!1||!D.isBatchedMesh&&Me.batching===!0||D.isBatchedMesh&&Me.batchingColor===!0&&D.colorTexture===null||D.isBatchedMesh&&Me.batchingColor===!1&&D.colorTexture!==null||D.isInstancedMesh&&Me.instancing===!1||!D.isInstancedMesh&&Me.instancing===!0||D.isSkinnedMesh&&Me.skinning===!1||!D.isSkinnedMesh&&Me.skinning===!0||D.isInstancedMesh&&Me.instancingColor===!0&&D.instanceColor===null||D.isInstancedMesh&&Me.instancingColor===!1&&D.instanceColor!==null||D.isInstancedMesh&&Me.instancingMorph===!0&&D.morphTexture===null||D.isInstancedMesh&&Me.instancingMorph===!1&&D.morphTexture!==null||Me.envMap!==me||z.fog===!0&&Me.fog!==ee||Me.numClippingPlanes!==void 0&&(Me.numClippingPlanes!==Q.numPlanes||Me.numIntersection!==Q.numIntersection)||Me.vertexAlphas!==Re||Me.vertexTangents!==De||Me.morphTargets!==ge||Me.morphNormals!==qe||Me.morphColors!==it||Me.toneMapping!==ot||Me.morphTargetsCount!==Ye)&&(Ke=!0):(Ke=!0,Me.__version=z.version);let en=Me.currentProgram;Ke===!0&&(en=cr(z,I,D));let wi=!1,zt=!1,Ts=!1;const at=en.getUniforms(),hn=Me.uniforms;if(Se.useProgram(en.program)&&(wi=!0,zt=!0,Ts=!0),z.id!==S&&(S=z.id,zt=!0),wi||M!==v){Se.buffers.depth.getReversed()?(re.copy(v.projectionMatrix),ff(re),pf(re),at.setValue(U,"projectionMatrix",re)):at.setValue(U,"projectionMatrix",v.projectionMatrix),at.setValue(U,"viewMatrix",v.matrixWorldInverse);const Hn=at.map.cameraPosition;Hn!==void 0&&Hn.setValue(U,Pe.setFromMatrixPosition(v.matrixWorld)),Ve.logarithmicDepthBuffer&&at.setValue(U,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial)&&at.setValue(U,"isOrthographic",v.isOrthographicCamera===!0),M!==v&&(M=v,zt=!0,Ts=!0)}if(D.isSkinnedMesh){at.setOptional(U,D,"bindMatrix"),at.setOptional(U,D,"bindMatrixInverse");const Wt=D.skeleton;Wt&&(Wt.boneTexture===null&&Wt.computeBoneTexture(),at.setValue(U,"boneTexture",Wt.boneTexture,T))}D.isBatchedMesh&&(at.setOptional(U,D,"batchingTexture"),at.setValue(U,"batchingTexture",D._matricesTexture,T),at.setOptional(U,D,"batchingIdTexture"),at.setValue(U,"batchingIdTexture",D._indirectTexture,T),at.setOptional(U,D,"batchingColorTexture"),D._colorsTexture!==null&&at.setValue(U,"batchingColorTexture",D._colorsTexture,T));const bs=B.morphAttributes;if((bs.position!==void 0||bs.normal!==void 0||bs.color!==void 0)&&be.update(D,B,en),(zt||Me.receiveShadow!==D.receiveShadow)&&(Me.receiveShadow=D.receiveShadow,at.setValue(U,"receiveShadow",D.receiveShadow)),z.isMeshGouraudMaterial&&z.envMap!==null&&(hn.envMap.value=me,hn.flipEnvMap.value=me.isCubeTexture&&me.isRenderTargetTexture===!1?-1:1),z.isMeshStandardMaterial&&z.envMap===null&&I.environment!==null&&(hn.envMapIntensity.value=I.environmentIntensity),zt&&(at.setValue(U,"toneMappingExposure",y.toneMappingExposure),Me.needsLights&&id(hn,Ts),ee&&z.fog===!0&&oe.refreshFogUniforms(hn,ee),oe.refreshMaterialUniforms(hn,z,H,$,p.state.transmissionRenderTarget[v.id]),Kr.upload(U,Yc(Me),hn,T)),z.isShaderMaterial&&z.uniformsNeedUpdate===!0&&(Kr.upload(U,Yc(Me),hn,T),z.uniformsNeedUpdate=!1),z.isSpriteMaterial&&at.setValue(U,"center",D.center),at.setValue(U,"modelViewMatrix",D.modelViewMatrix),at.setValue(U,"normalMatrix",D.normalMatrix),at.setValue(U,"modelMatrix",D.matrixWorld),z.isShaderMaterial||z.isRawShaderMaterial){const Wt=z.uniformsGroups;for(let Hn=0,Vn=Wt.length;Hn<Vn;Hn++){const Zc=Wt[Hn];L.update(Zc,en),L.bind(Zc,en)}}return en}function id(v,I){v.ambientLightColor.needsUpdate=I,v.lightProbe.needsUpdate=I,v.directionalLights.needsUpdate=I,v.directionalLightShadows.needsUpdate=I,v.pointLights.needsUpdate=I,v.pointLightShadows.needsUpdate=I,v.spotLights.needsUpdate=I,v.spotLightShadows.needsUpdate=I,v.rectAreaLights.needsUpdate=I,v.hemisphereLights.needsUpdate=I}function sd(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(v,I,B){ye.get(v.texture).__webglTexture=I,ye.get(v.depthTexture).__webglTexture=B;const z=ye.get(v);z.__hasExternalTextures=!0,z.__autoAllocateDepthBuffer=B===void 0,z.__autoAllocateDepthBuffer||He.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),z.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(v,I){const B=ye.get(v);B.__webglFramebuffer=I,B.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(v,I=0,B=0){P=v,w=I,A=B;let z=!0,D=null,ee=!1,le=!1;if(v){const me=ye.get(v);if(me.__useDefaultFramebuffer!==void 0)Se.bindFramebuffer(U.FRAMEBUFFER,null),z=!1;else if(me.__webglFramebuffer===void 0)T.setupRenderTarget(v);else if(me.__hasExternalTextures)T.rebindTextures(v,ye.get(v.texture).__webglTexture,ye.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){const ge=v.depthTexture;if(me.__boundDepthTexture!==ge){if(ge!==null&&ye.has(ge)&&(v.width!==ge.image.width||v.height!==ge.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");T.setupDepthRenderbuffer(v)}}const Re=v.texture;(Re.isData3DTexture||Re.isDataArrayTexture||Re.isCompressedArrayTexture)&&(le=!0);const De=ye.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(De[I])?D=De[I][B]:D=De[I],ee=!0):v.samples>0&&T.useMultisampledRTT(v)===!1?D=ye.get(v).__webglMultisampledFramebuffer:Array.isArray(De)?D=De[B]:D=De,R.copy(v.viewport),k.copy(v.scissor),O=v.scissorTest}else R.copy(xe).multiplyScalar(H).floor(),k.copy(Oe).multiplyScalar(H).floor(),O=et;if(Se.bindFramebuffer(U.FRAMEBUFFER,D)&&z&&Se.drawBuffers(v,D),Se.viewport(R),Se.scissor(k),Se.setScissorTest(O),ee){const me=ye.get(v.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+I,me.__webglTexture,B)}else if(le){const me=ye.get(v.texture),Re=I||0;U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,me.__webglTexture,B||0,Re)}S=-1},this.readRenderTargetPixels=function(v,I,B,z,D,ee,le){if(!(v&&v.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let pe=ye.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&le!==void 0&&(pe=pe[le]),pe){Se.bindFramebuffer(U.FRAMEBUFFER,pe);try{const me=v.texture,Re=me.format,De=me.type;if(!Ve.textureFormatReadable(Re)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ve.textureTypeReadable(De)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=v.width-z&&B>=0&&B<=v.height-D&&U.readPixels(I,B,z,D,Ne.convert(Re),Ne.convert(De),ee)}finally{const me=P!==null?ye.get(P).__webglFramebuffer:null;Se.bindFramebuffer(U.FRAMEBUFFER,me)}}},this.readRenderTargetPixelsAsync=async function(v,I,B,z,D,ee,le){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let pe=ye.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&le!==void 0&&(pe=pe[le]),pe){const me=v.texture,Re=me.format,De=me.type;if(!Ve.textureFormatReadable(Re))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ve.textureTypeReadable(De))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(I>=0&&I<=v.width-z&&B>=0&&B<=v.height-D){Se.bindFramebuffer(U.FRAMEBUFFER,pe);const ge=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,ge),U.bufferData(U.PIXEL_PACK_BUFFER,ee.byteLength,U.STREAM_READ),U.readPixels(I,B,z,D,Ne.convert(Re),Ne.convert(De),0);const qe=P!==null?ye.get(P).__webglFramebuffer:null;Se.bindFramebuffer(U.FRAMEBUFFER,qe);const it=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await df(U,it,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,ge),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,ee),U.deleteBuffer(ge),U.deleteSync(it),ee}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(v,I=null,B=0){v.isTexture!==!0&&(zs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),I=arguments[0]||null,v=arguments[1]);const z=Math.pow(2,-B),D=Math.floor(v.image.width*z),ee=Math.floor(v.image.height*z),le=I!==null?I.x:0,pe=I!==null?I.y:0;T.setTexture2D(v,0),U.copyTexSubImage2D(U.TEXTURE_2D,B,0,0,le,pe,D,ee),Se.unbindTexture()},this.copyTextureToTexture=function(v,I,B=null,z=null,D=0){v.isTexture!==!0&&(zs("WebGLRenderer: copyTextureToTexture function signature has changed."),z=arguments[0]||null,v=arguments[1],I=arguments[2],D=arguments[3]||0,B=null);let ee,le,pe,me,Re,De,ge,qe,it;const ot=v.isCompressedTexture?v.mipmaps[D]:v.image;B!==null?(ee=B.max.x-B.min.x,le=B.max.y-B.min.y,pe=B.isBox3?B.max.z-B.min.z:1,me=B.min.x,Re=B.min.y,De=B.isBox3?B.min.z:0):(ee=ot.width,le=ot.height,pe=ot.depth||1,me=0,Re=0,De=0),z!==null?(ge=z.x,qe=z.y,it=z.z):(ge=0,qe=0,it=0);const Ot=Ne.convert(I.format),Ye=Ne.convert(I.type);let Me;I.isData3DTexture?(T.setTexture3D(I,0),Me=U.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(T.setTexture2DArray(I,0),Me=U.TEXTURE_2D_ARRAY):(T.setTexture2D(I,0),Me=U.TEXTURE_2D),U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,I.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,I.unpackAlignment);const Mn=U.getParameter(U.UNPACK_ROW_LENGTH),Ke=U.getParameter(U.UNPACK_IMAGE_HEIGHT),en=U.getParameter(U.UNPACK_SKIP_PIXELS),wi=U.getParameter(U.UNPACK_SKIP_ROWS),zt=U.getParameter(U.UNPACK_SKIP_IMAGES);U.pixelStorei(U.UNPACK_ROW_LENGTH,ot.width),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ot.height),U.pixelStorei(U.UNPACK_SKIP_PIXELS,me),U.pixelStorei(U.UNPACK_SKIP_ROWS,Re),U.pixelStorei(U.UNPACK_SKIP_IMAGES,De);const Ts=v.isDataArrayTexture||v.isData3DTexture,at=I.isDataArrayTexture||I.isData3DTexture;if(v.isRenderTargetTexture||v.isDepthTexture){const hn=ye.get(v),bs=ye.get(I),Wt=ye.get(hn.__renderTarget),Hn=ye.get(bs.__renderTarget);Se.bindFramebuffer(U.READ_FRAMEBUFFER,Wt.__webglFramebuffer),Se.bindFramebuffer(U.DRAW_FRAMEBUFFER,Hn.__webglFramebuffer);for(let Vn=0;Vn<pe;Vn++)Ts&&U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,ye.get(v).__webglTexture,D,De+Vn),v.isDepthTexture?(at&&U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,ye.get(I).__webglTexture,D,it+Vn),U.blitFramebuffer(me,Re,ee,le,ge,qe,ee,le,U.DEPTH_BUFFER_BIT,U.NEAREST)):at?U.copyTexSubImage3D(Me,D,ge,qe,it+Vn,me,Re,ee,le):U.copyTexSubImage2D(Me,D,ge,qe,it+Vn,me,Re,ee,le);Se.bindFramebuffer(U.READ_FRAMEBUFFER,null),Se.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else at?v.isDataTexture||v.isData3DTexture?U.texSubImage3D(Me,D,ge,qe,it,ee,le,pe,Ot,Ye,ot.data):I.isCompressedArrayTexture?U.compressedTexSubImage3D(Me,D,ge,qe,it,ee,le,pe,Ot,ot.data):U.texSubImage3D(Me,D,ge,qe,it,ee,le,pe,Ot,Ye,ot):v.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,D,ge,qe,ee,le,Ot,Ye,ot.data):v.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,D,ge,qe,ot.width,ot.height,Ot,ot.data):U.texSubImage2D(U.TEXTURE_2D,D,ge,qe,ee,le,Ot,Ye,ot);U.pixelStorei(U.UNPACK_ROW_LENGTH,Mn),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Ke),U.pixelStorei(U.UNPACK_SKIP_PIXELS,en),U.pixelStorei(U.UNPACK_SKIP_ROWS,wi),U.pixelStorei(U.UNPACK_SKIP_IMAGES,zt),D===0&&I.generateMipmaps&&U.generateMipmap(Me),Se.unbindTexture()},this.copyTextureToTexture3D=function(v,I,B=null,z=null,D=0){return v.isTexture!==!0&&(zs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),B=arguments[0]||null,z=arguments[1]||null,v=arguments[2],I=arguments[3],D=arguments[4]||0),zs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(v,I,B,z,D)},this.initRenderTarget=function(v){ye.get(v).__webglFramebuffer===void 0&&T.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?T.setTextureCube(v,0):v.isData3DTexture?T.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?T.setTexture2DArray(v,0):T.setTexture2D(v,0),Se.unbindTexture()},this.resetState=function(){w=0,A=0,P=null,Se.reset(),nt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Un}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorspace=ke._getDrawingBufferColorSpace(e),t.unpackColorSpace=ke._getUnpackColorSpace()}}class T0 extends ct{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new mn,this.environmentIntensity=1,this.environmentRotation=new mn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class Sh{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Qa,this.updateRanges=[],this.version=0,this.uuid=ln()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[n+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ln()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ln()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Dt=new C;class Js{constructor(e,t,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Dt.fromBufferAttribute(this,t),Dt.applyMatrix4(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Dt.fromBufferAttribute(this,t),Dt.applyNormalMatrix(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Dt.fromBufferAttribute(this,t),Dt.transformDirection(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=an(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=$e(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=$e(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=an(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=an(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=an(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=an(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),s=$e(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=$e(t,this.array),n=$e(n,this.array),s=$e(s,this.array),r=$e(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new tt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new Js(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class Eh extends un{static get type(){return"SpriteMaterial"}constructor(e){super(),this.isSpriteMaterial=!0,this.color=new Ae(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}let Vi;const Ps=new C,Gi=new C,Wi=new C,Xi=new Le,Ls=new Le,Th=new we,Cr=new C,Is=new C,Pr=new C,Ql=new Le,$o=new Le,eu=new Le;class b0 extends ct{constructor(e=new Eh){if(super(),this.isSprite=!0,this.type="Sprite",Vi===void 0){Vi=new vt;const t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Sh(t,5);Vi.setIndex([0,1,2,0,2,3]),Vi.setAttribute("position",new Js(n,3,0,!1)),Vi.setAttribute("uv",new Js(n,2,3,!1))}this.geometry=Vi,this.material=e,this.center=new Le(.5,.5)}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Gi.setFromMatrixScale(this.matrixWorld),Th.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Wi.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Gi.multiplyScalar(-Wi.z);const n=this.material.rotation;let s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));const o=this.center;Lr(Cr.set(-.5,-.5,0),Wi,o,Gi,s,r),Lr(Is.set(.5,-.5,0),Wi,o,Gi,s,r),Lr(Pr.set(.5,.5,0),Wi,o,Gi,s,r),Ql.set(0,0),$o.set(1,0),eu.set(1,1);let a=e.ray.intersectTriangle(Cr,Is,Pr,!1,Ps);if(a===null&&(Lr(Is.set(-.5,.5,0),Wi,o,Gi,s,r),$o.set(0,1),a=e.ray.intersectTriangle(Cr,Pr,Is,!1,Ps),a===null))return;const c=e.ray.origin.distanceTo(Ps);c<e.near||c>e.far||t.push({distance:c,point:Ps.clone(),uv:Yt.getInterpolation(Ps,Cr,Is,Pr,Ql,$o,eu,new Le),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}}function Lr(i,e,t,n,s,r){Xi.subVectors(i,t).addScalar(.5).multiply(n),s!==void 0?(Ls.x=r*Xi.x-s*Xi.y,Ls.y=s*Xi.x+r*Xi.y):Ls.copy(Xi),i.copy(e),i.x+=Ls.x,i.y+=Ls.y,i.applyMatrix4(Th)}const tu=new C,nu=new je,iu=new je,A0=new C,su=new we,Ir=new C,Jo=new gn,ru=new we,Qo=new go;class w0 extends wt{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=tl,this.bindMatrix=new we,this.bindMatrixInverse=new we,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new kn),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Ir),this.boundingBox.expandByPoint(Ir)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new gn),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Ir),this.boundingSphere.expandByPoint(Ir)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Jo.copy(this.boundingSphere),Jo.applyMatrix4(s),e.ray.intersectsSphere(Jo)!==!1&&(ru.copy(s).invert(),Qo.copy(e.ray).applyMatrix4(ru),!(this.boundingBox!==null&&Qo.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Qo)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new je,t=this.geometry.attributes.skinWeight;for(let n=0,s=t.count;n<s;n++){e.fromBufferAttribute(t,n);const r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===tl?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Nd?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const n=this.skeleton,s=this.geometry;nu.fromBufferAttribute(s.attributes.skinIndex,e),iu.fromBufferAttribute(s.attributes.skinWeight,e),tu.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){const o=iu.getComponent(r);if(o!==0){const a=nu.getComponent(r);su.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),t.addScaledVector(A0.copy(tu).applyMatrix4(su),o)}}return t.applyMatrix4(this.bindMatrixInverse)}}class bh extends ct{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Ah extends yt{constructor(e=null,t=1,n=1,s,r,o,a,c,l=Nt,u=Nt,h,d){super(null,o,a,c,l,u,s,r,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const ou=new we,R0=new we;class bc{constructor(e=[],t=[]){this.uuid=ln(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new we)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const n=new we;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const e=this.bones,t=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,o=e.length;r<o;r++){const a=e[r]?e[r].matrixWorld:R0;ou.multiplyMatrices(a,t[r]),ou.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new bc(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const n=new Ah(t,e,e,$t,cn);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){const s=this.bones[t];if(s.name===e)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,s=e.bones.length;n<s;n++){const r=e.bones[n];let o=t[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new bh),this.bones.push(o),this.boneInverses.push(new we().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){const e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,n=this.boneInverses;for(let s=0,r=t.length;s<r;s++){const o=t[s];e.bones.push(o.uuid);const a=n[s];e.boneInverses.push(a.toArray())}return e}}class tc extends tt{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const qi=new we,au=new we,Dr=[],cu=new kn,C0=new we,Ds=new wt,Us=new gn;class P0 extends wt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new tc(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,C0)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new kn),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,qi),cu.copy(e.boundingBox).applyMatrix4(qi),this.boundingBox.union(cu)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new gn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,qi),Us.copy(e.boundingSphere).applyMatrix4(qi),this.boundingSphere.union(Us)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(e,t){const n=this.matrixWorld,s=this.count;if(Ds.geometry=this.geometry,Ds.material=this.material,Ds.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Us.copy(this.boundingSphere),Us.applyMatrix4(n),e.ray.intersectsSphere(Us)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,qi),au.multiplyMatrices(n,qi),Ds.matrixWorld=au,Ds.raycast(e,Dr);for(let o=0,a=Dr.length;o<a;o++){const c=Dr[o];c.instanceId=r,c.object=this,t.push(c)}Dr.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new tc(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Ah(new Float32Array(s*this.count),s,this.count,_c,cn));const r=this.morphTexture.source.data.data;let o=0;for(let l=0;l<n.length;l++)o+=n[l];const a=this.geometry.morphTargetsRelative?1:1-o,c=s*e;r[c]=a,r.set(n,c+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class Ti extends un{static get type(){return"LineBasicMaterial"}constructor(e){super(),this.isLineBasicMaterial=!0,this.color=new Ae(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const io=new C,so=new C,lu=new we,Ns=new go,Ur=new gn,ea=new C,uu=new C;class ir extends ct{constructor(e=new vt,t=new Ti){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)io.fromBufferAttribute(t,s-1),so.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=io.distanceTo(so);e.setAttribute("lineDistance",new Bt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ur.copy(n.boundingSphere),Ur.applyMatrix4(s),Ur.radius+=r,e.ray.intersectsSphere(Ur)===!1)return;lu.copy(s).invert(),Ns.copy(e.ray).applyMatrix4(lu);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,u=n.index,d=n.attributes.position;if(u!==null){const f=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let _=f,m=g-1;_<m;_+=l){const p=u.getX(_),b=u.getX(_+1),E=Nr(this,e,Ns,c,p,b);E&&t.push(E)}if(this.isLineLoop){const _=u.getX(g-1),m=u.getX(f),p=Nr(this,e,Ns,c,_,m);p&&t.push(p)}}else{const f=Math.max(0,o.start),g=Math.min(d.count,o.start+o.count);for(let _=f,m=g-1;_<m;_+=l){const p=Nr(this,e,Ns,c,_,_+1);p&&t.push(p)}if(this.isLineLoop){const _=Nr(this,e,Ns,c,g-1,f);_&&t.push(_)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function Nr(i,e,t,n,s,r){const o=i.geometry.attributes.position;if(io.fromBufferAttribute(o,s),so.fromBufferAttribute(o,r),t.distanceSqToSegment(io,so,ea,uu)>n)return;ea.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(ea);if(!(c<e.near||c>e.far))return{distance:c,point:uu.clone().applyMatrix4(i.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:i}}const hu=new C,du=new C;class Zr extends ir{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)hu.fromBufferAttribute(t,s),du.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+hu.distanceTo(du);e.setAttribute("lineDistance",new Bt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class L0 extends ir{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class Ac extends un{static get type(){return"PointsMaterial"}constructor(e){super(),this.isPointsMaterial=!0,this.color=new Ae(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const fu=new we,nc=new go,Fr=new gn,Or=new C;class wh extends ct{constructor(e=new vt,t=new Ac){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Fr.copy(n.boundingSphere),Fr.applyMatrix4(s),Fr.radius+=r,e.ray.intersectsSphere(Fr)===!1)return;fu.copy(s).invert(),nc.copy(e.ray).applyMatrix4(fu);const a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,h=n.attributes.position;if(l!==null){const d=Math.max(0,o.start),f=Math.min(l.count,o.start+o.count);for(let g=d,_=f;g<_;g++){const m=l.getX(g);Or.fromBufferAttribute(h,m),pu(Or,m,c,s,e,t,this)}}else{const d=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let g=d,_=f;g<_;g++)Or.fromBufferAttribute(h,g),pu(Or,g,c,s,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){const a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}}function pu(i,e,t,n,s,r,o){const a=nc.distanceSqToPoint(i);if(a<t){const c=new C;nc.closestPointToPoint(i,c),c.applyMatrix4(n);const l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}class Rh extends yt{constructor(e,t,n,s,r,o,a,c,l){super(e,t,n,s,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class wc extends vt{constructor(e=1,t=1,n=1,s=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};const l=this;s=Math.floor(s),r=Math.floor(r);const u=[],h=[],d=[],f=[];let g=0;const _=[],m=n/2;let p=0;b(),o===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(u),this.setAttribute("position",new Bt(h,3)),this.setAttribute("normal",new Bt(d,3)),this.setAttribute("uv",new Bt(f,2));function b(){const y=new C,N=new C;let w=0;const A=(t-e)/n;for(let P=0;P<=r;P++){const S=[],M=P/r,R=M*(t-e)+e;for(let k=0;k<=s;k++){const O=k/s,G=O*c+a,j=Math.sin(G),W=Math.cos(G);N.x=R*j,N.y=-M*n+m,N.z=R*W,h.push(N.x,N.y,N.z),y.set(j,A,W).normalize(),d.push(y.x,y.y,y.z),f.push(O,1-M),S.push(g++)}_.push(S)}for(let P=0;P<s;P++)for(let S=0;S<r;S++){const M=_[S][P],R=_[S+1][P],k=_[S+1][P+1],O=_[S][P+1];(e>0||S!==0)&&(u.push(M,R,O),w+=3),(t>0||S!==r-1)&&(u.push(R,k,O),w+=3)}l.addGroup(p,w,0),p+=w}function E(y){const N=g,w=new Le,A=new C;let P=0;const S=y===!0?e:t,M=y===!0?1:-1;for(let k=1;k<=s;k++)h.push(0,m*M,0),d.push(0,M,0),f.push(.5,.5),g++;const R=g;for(let k=0;k<=s;k++){const G=k/s*c+a,j=Math.cos(G),W=Math.sin(G);A.x=S*W,A.y=m*M,A.z=S*j,h.push(A.x,A.y,A.z),d.push(0,M,0),w.x=j*.5+.5,w.y=W*.5*M+.5,f.push(w.x,w.y),g++}for(let k=0;k<s;k++){const O=N+k,G=R+k;y===!0?u.push(G,G+1,O):u.push(G+1,G,O),P+=3}l.addGroup(p,P,y===!0?1:2),p+=P}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new wc(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Rc extends un{static get type(){return"MeshStandardMaterial"}constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Ae(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ae(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=sh,this.normalScale=new Le(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new mn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class _n extends Rc{static get type(){return"MeshPhysicalMaterial"}constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Le(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Lt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ae(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ae(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ae(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}function Br(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function I0(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function D0(i){function e(s,r){return i[s]-i[r]}const t=i.length,n=new Array(t);for(let s=0;s!==t;++s)n[s]=s;return n.sort(e),n}function mu(i,e,t){const n=i.length,s=new i.constructor(n);for(let r=0,o=0;o!==n;++r){const a=t[r]*e;for(let c=0;c!==e;++c)s[o++]=i[a+c]}return s}function Ch(i,e,t,n){let s=1,r=i[0];for(;r!==void 0&&r[n]===void 0;)r=i[s++];if(r===void 0)return;let o=r[n];if(o!==void 0)if(Array.isArray(o))do o=r[n],o!==void 0&&(e.push(r.time),t.push.apply(t,o)),r=i[s++];while(r!==void 0);else if(o.toArray!==void 0)do o=r[n],o!==void 0&&(e.push(r.time),o.toArray(t,t.length)),r=i[s++];while(r!==void 0);else do o=r[n],o!==void 0&&(e.push(r.time),t.push(o)),r=i[s++];while(r!==void 0)}class sr{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=t[++n],e<s)break e}o=t.length;break t}if(!(e>=r)){const a=t[1];e<a&&(n=2,r=a);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){const a=n+o>>>1;e<t[a]?o=a:n=a+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class U0 extends sr{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:nl,endingEnd:nl}}intervalChanged_(e,t,n){const s=this.parameterPositions;let r=e-2,o=e+1,a=s[r],c=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case il:r=e,a=2*t-n;break;case sl:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case il:o=e,c=2*n-t;break;case sl:o=1,c=n+s[1]-s[0];break;default:o=e-1,c=t}const l=(n-t)*.5,u=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-n),this._offsetPrev=r*u,this._offsetNext=o*u}interpolate_(e,t,n,s){const r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=this._offsetPrev,h=this._offsetNext,d=this._weightPrev,f=this._weightNext,g=(n-t)/(s-t),_=g*g,m=_*g,p=-d*m+2*d*_-d*g,b=(1+d)*m+(-1.5-2*d)*_+(-.5+d)*g+1,E=(-1-f)*m+(1.5+f)*_+.5*g,y=f*m-f*_;for(let N=0;N!==a;++N)r[N]=p*o[u+N]+b*o[l+N]+E*o[c+N]+y*o[h+N];return r}}class N0 extends sr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){const r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=(n-t)/(s-t),h=1-u;for(let d=0;d!==a;++d)r[d]=o[l+d]*h+o[c+d]*u;return r}}class F0 extends sr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}}class xn{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Br(t,this.TimeBufferType),this.values=Br(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Br(e.times,Array),values:Br(e.values,Array)};const s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new F0(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new N0(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new U0(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ks:t=this.InterpolantFactoryMethodDiscrete;break;case Zs:t=this.InterpolantFactoryMethodLinear;break;case Eo:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ks;case this.InterpolantFactoryMethodLinear:return Zs;case this.InterpolantFactoryMethodSmooth:return Eo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){const n=this.times,s=n.length;let r=0,o=s-1;for(;r!==s&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);const a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);const n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){const c=n[a];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(s!==void 0&&I0(s))for(let a=0,c=s.length;a!==c;++a){const l=s[a];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Eo,r=e.length-1;let o=1;for(let a=1;a<r;++a){let c=!1;const l=e[a],u=e[a+1];if(l!==u&&(a!==1||l!==e[0]))if(s)c=!0;else{const h=a*n,d=h-n,f=h+n;for(let g=0;g!==n;++g){const _=t[h+g];if(_!==t[d+g]||_!==t[f+g]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];const h=a*n,d=o*n;for(let f=0;f!==n;++f)t[d+f]=t[h+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,c=o*n,l=0;l!==n;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}}xn.prototype.TimeBufferType=Float32Array;xn.prototype.ValueBufferType=Float32Array;xn.prototype.DefaultInterpolation=Zs;class Ms extends xn{constructor(e,t,n){super(e,t,n)}}Ms.prototype.ValueTypeName="bool";Ms.prototype.ValueBufferType=Array;Ms.prototype.DefaultInterpolation=Ks;Ms.prototype.InterpolantFactoryMethodLinear=void 0;Ms.prototype.InterpolantFactoryMethodSmooth=void 0;class Ph extends xn{}Ph.prototype.ValueTypeName="color";class hs extends xn{}hs.prototype.ValueTypeName="number";class O0 extends sr{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){const r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-t)/(s-t);let l=e*a;for(let u=l+a;l!==u;l+=4)oi.slerpFlat(r,0,o,l-a,o,l,c);return r}}class ds extends xn{InterpolantFactoryMethodLinear(e){return new O0(this.times,this.values,this.getValueSize(),e)}}ds.prototype.ValueTypeName="quaternion";ds.prototype.InterpolantFactoryMethodSmooth=void 0;class ys extends xn{constructor(e,t,n){super(e,t,n)}}ys.prototype.ValueTypeName="string";ys.prototype.ValueBufferType=Array;ys.prototype.DefaultInterpolation=Ks;ys.prototype.InterpolantFactoryMethodLinear=void 0;ys.prototype.InterpolantFactoryMethodSmooth=void 0;class fs extends xn{}fs.prototype.ValueTypeName="vector";class B0{constructor(e="",t=-1,n=[],s=Fd){this.name=e,this.tracks=n,this.duration=t,this.blendMode=s,this.uuid=ln(),this.duration<0&&this.resetDuration()}static parse(e){const t=[],n=e.tracks,s=1/(e.fps||1);for(let o=0,a=n.length;o!==a;++o)t.push(k0(n[o]).scale(s));const r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r}static toJSON(e){const t=[],n=e.tracks,s={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let r=0,o=n.length;r!==o;++r)t.push(xn.toJSON(n[r]));return s}static CreateFromMorphTargetSequence(e,t,n,s){const r=t.length,o=[];for(let a=0;a<r;a++){let c=[],l=[];c.push((a+r-1)%r,a,(a+1)%r),l.push(0,1,0);const u=D0(c);c=mu(c,1,u),l=mu(l,1,u),!s&&c[0]===0&&(c.push(r),l.push(l[0])),o.push(new hs(".morphTargetInfluences["+t[a].name+"]",c,l).scale(1/n))}return new this(e,-1,o)}static findByName(e,t){let n=e;if(!Array.isArray(e)){const s=e;n=s.geometry&&s.geometry.animations||s.animations}for(let s=0;s<n.length;s++)if(n[s].name===t)return n[s];return null}static CreateClipsFromMorphTargetSequences(e,t,n){const s={},r=/^([\w-]*?)([\d]+)$/;for(let a=0,c=e.length;a<c;a++){const l=e[a],u=l.name.match(r);if(u&&u.length>1){const h=u[1];let d=s[h];d||(s[h]=d=[]),d.push(l)}}const o=[];for(const a in s)o.push(this.CreateFromMorphTargetSequence(a,s[a],t,n));return o}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const n=function(h,d,f,g,_){if(f.length!==0){const m=[],p=[];Ch(f,m,p,g),m.length!==0&&_.push(new h(d,m,p))}},s=[],r=e.name||"default",o=e.fps||30,a=e.blendMode;let c=e.length||-1;const l=e.hierarchy||[];for(let h=0;h<l.length;h++){const d=l[h].keys;if(!(!d||d.length===0))if(d[0].morphTargets){const f={};let g;for(g=0;g<d.length;g++)if(d[g].morphTargets)for(let _=0;_<d[g].morphTargets.length;_++)f[d[g].morphTargets[_]]=-1;for(const _ in f){const m=[],p=[];for(let b=0;b!==d[g].morphTargets.length;++b){const E=d[g];m.push(E.time),p.push(E.morphTarget===_?1:0)}s.push(new hs(".morphTargetInfluence["+_+"]",m,p))}c=f.length*o}else{const f=".bones["+t[h].name+"]";n(fs,f+".position",d,"pos",s),n(ds,f+".quaternion",d,"rot",s),n(fs,f+".scale",d,"scl",s)}}return s.length===0?null:new this(r,c,s,a)}resetDuration(){const e=this.tracks;let t=0;for(let n=0,s=e.length;n!==s;++n){const r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function z0(i){switch(i.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return hs;case"vector":case"vector2":case"vector3":case"vector4":return fs;case"color":return Ph;case"quaternion":return ds;case"bool":case"boolean":return Ms;case"string":return ys}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+i)}function k0(i){if(i.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=z0(i.type);if(i.times===void 0){const t=[],n=[];Ch(i.keys,t,n,"value"),i.times=t,i.values=n}return e.parse!==void 0?e.parse(i):new e(i.name,i.times,i.values,i.interpolation)}const ni={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(this.files[i]=e)},get:function(i){if(this.enabled!==!1)return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};class H0{constructor(e,t,n){const s=this;let r=!1,o=0,a=0,c;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(u){a++,r===!1&&s.onStart!==void 0&&s.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,s.onProgress!==void 0&&s.onProgress(u,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,h){return l.push(u,h),this},this.removeHandler=function(u){const h=l.indexOf(u);return h!==-1&&l.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=l.length;h<d;h+=2){const f=l[h],g=l[h+1];if(f.global&&(f.lastIndex=0),f.test(u))return g}return null}}}const V0=new H0;class Ss{constructor(e){this.manager=e!==void 0?e:V0,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}}Ss.DEFAULT_MATERIAL_NAME="__DEFAULT";const An={};class G0 extends Error{constructor(e,t){super(e),this.response=t}}class Lh extends Ss{constructor(e){super(e)}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=ni.get(e);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(An[e]!==void 0){An[e].push({onLoad:t,onProgress:n,onError:s});return}An[e]=[],An[e].push({onLoad:t,onProgress:n,onError:s});const o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const u=An[e],h=l.body.getReader(),d=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),f=d?parseInt(d):0,g=f!==0;let _=0;const m=new ReadableStream({start(p){b();function b(){h.read().then(({done:E,value:y})=>{if(E)p.close();else{_+=y.byteLength;const N=new ProgressEvent("progress",{lengthComputable:g,loaded:_,total:f});for(let w=0,A=u.length;w<A;w++){const P=u[w];P.onProgress&&P.onProgress(N)}p.enqueue(y),b()}},E=>{p.error(E)})}}});return new Response(m)}else throw new G0(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(u=>new DOMParser().parseFromString(u,a));case"json":return l.json();default:if(a===void 0)return l.text();{const h=/charset="?([^;"\s]*)"?/i.exec(a),d=h&&h[1]?h[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(g=>f.decode(g))}}}).then(l=>{ni.add(e,l);const u=An[e];delete An[e];for(let h=0,d=u.length;h<d;h++){const f=u[h];f.onLoad&&f.onLoad(l)}}).catch(l=>{const u=An[e];if(u===void 0)throw this.manager.itemError(e),l;delete An[e];for(let h=0,d=u.length;h<d;h++){const f=u[h];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}}class W0 extends Ss{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,o=ni.get(e);if(o!==void 0)return r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o;const a=$s("img");function c(){u(),ni.add(e,this),t&&t(this),r.manager.itemEnd(e)}function l(h){u(),s&&s(h),r.manager.itemError(e),r.manager.itemEnd(e)}function u(){a.removeEventListener("load",c,!1),a.removeEventListener("error",l,!1)}return a.addEventListener("load",c,!1),a.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),r.manager.itemStart(e),a.src=e,a}}class X0 extends Ss{constructor(e){super(e)}load(e,t,n,s){const r=new yt,o=new W0(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}}class Cc extends ct{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ae(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}const ta=new we,gu=new C,_u=new C;class Pc{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Le(512,512),this.map=null,this.mapPass=null,this.matrix=new we,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Sc,this._frameExtents=new Le(1,1),this._viewportCount=1,this._viewports=[new je(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;gu.setFromMatrixPosition(e.matrixWorld),t.position.copy(gu),_u.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(_u),t.updateMatrixWorld(),ta.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ta),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ta)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class q0 extends Pc{constructor(){super(new At(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){const t=this.camera,n=ls*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;(n!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class j0 extends Cc{constructor(e,t,n=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ct.DEFAULT_UP),this.updateMatrix(),this.target=new ct,this.distance=n,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new q0}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}const xu=new we,Fs=new C,na=new C;class Y0 extends Pc{constructor(){super(new At(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Le(4,2),this._viewportCount=6,this._viewports=[new je(2,1,1,1),new je(0,1,1,1),new je(3,1,1,1),new je(1,1,1,1),new je(3,0,1,1),new je(1,0,1,1)],this._cubeDirections=[new C(1,0,0),new C(-1,0,0),new C(0,0,1),new C(0,0,-1),new C(0,1,0),new C(0,-1,0)],this._cubeUps=[new C(0,1,0),new C(0,1,0),new C(0,1,0),new C(0,1,0),new C(0,0,1),new C(0,0,-1)]}updateMatrices(e,t=0){const n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Fs.setFromMatrixPosition(e.matrixWorld),n.position.copy(Fs),na.copy(n.position),na.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(na),n.updateMatrixWorld(),s.makeTranslation(-Fs.x,-Fs.y,-Fs.z),xu.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(xu)}}class K0 extends Cc{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Y0}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class Z0 extends Pc{constructor(){super(new Ec(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class $0 extends Cc{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ct.DEFAULT_UP),this.updateMatrix(),this.target=new ct,this.shadow=new Z0}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Ws{static decodeText(e){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let n=0,s=e.length;n<s;n++)t+=String.fromCharCode(e[n]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}class J0 extends Ss{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,o=ni.get(e);if(o!==void 0){if(r.manager.itemStart(e),o.then){o.then(l=>{t&&t(l),r.manager.itemEnd(e)}).catch(l=>{s&&s(l)});return}return setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o}const a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader;const c=fetch(e,a).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(l){return ni.add(e,l),t&&t(l),r.manager.itemEnd(e),l}).catch(function(l){s&&s(l),ni.remove(e),r.manager.itemError(e),r.manager.itemEnd(e)});ni.add(e,c),r.manager.itemStart(e)}}const vu=new we,Mu=new we,pi=new we;class Q0{constructor(){this.type="StereoCamera",this.aspect=1,this.eyeSep=.064,this.cameraL=new At,this.cameraL.layers.enable(1),this.cameraL.matrixAutoUpdate=!1,this.cameraR=new At,this.cameraR.layers.enable(2),this.cameraR.matrixAutoUpdate=!1,this._cache={focus:null,fov:null,aspect:null,near:null,far:null,zoom:null,eyeSep:null}}update(e){const t=this._cache;if(t.focus!==e.focus||t.fov!==e.fov||t.aspect!==e.aspect*this.aspect||t.near!==e.near||t.far!==e.far||t.zoom!==e.zoom||t.eyeSep!==this.eyeSep){t.focus=e.focus,t.fov=e.fov,t.aspect=e.aspect*this.aspect,t.near=e.near,t.far=e.far,t.zoom=e.zoom,t.eyeSep=this.eyeSep,pi.copy(e.projectionMatrix);const s=t.eyeSep/2,r=s*t.near/t.focus,o=t.near*Math.tan(Qi*t.fov*.5)/t.zoom;let a,c;Mu.elements[12]=-s,vu.elements[12]=s,a=-o*t.aspect+r,c=o*t.aspect+r,pi.elements[0]=2*t.near/(c-a),pi.elements[8]=(c+a)/(c-a),this.cameraL.projectionMatrix.copy(pi),a=-o*t.aspect-r,c=o*t.aspect-r,pi.elements[0]=2*t.near/(c-a),pi.elements[8]=(c+a)/(c-a),this.cameraR.projectionMatrix.copy(pi)}this.cameraL.matrixWorld.copy(e.matrixWorld).multiply(Mu),this.cameraR.matrixWorld.copy(e.matrixWorld).multiply(vu)}}const Lc="\\[\\]\\.:\\/",ex=new RegExp("["+Lc+"]","g"),Ic="[^"+Lc+"]",tx="[^"+Lc.replace("\\.","")+"]",nx=/((?:WC+[\/:])*)/.source.replace("WC",Ic),ix=/(WCOD+)?/.source.replace("WCOD",tx),sx=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Ic),rx=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Ic),ox=new RegExp("^"+nx+ix+sx+rx+"$"),ax=["material","materials","bones","map"];class cx{constructor(e,t,n){const s=n||Je.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();const n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){const n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}}class Je{constructor(e,t,n){this.path=t,this.parsedPath=n||Je.parseTrackName(t),this.node=Je.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new Je.Composite(e,t,n):new Je(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(ex,"")}static parseTrackName(e){const t=ox.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);const n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){const r=n.nodeName.substring(s+1);ax.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){const n=function(r){for(let o=0;o<r.length;o++){const a=r[o];if(a.name===t||a.uuid===t)return a;const c=n(a.children);if(c)return c}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,n=t.objectName,s=t.propertyName;let r=t.propertyIndex;if(e||(e=Je.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===l){l=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}const o=e[s];if(o===void 0){const l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}Je.Composite=cx;Je.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Je.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Je.prototype.GetterByBindingType=[Je.prototype._getValue_direct,Je.prototype._getValue_array,Je.prototype._getValue_arrayElement,Je.prototype._getValue_toArray];Je.prototype.SetterByBindingTypeAndVersioning=[[Je.prototype._setValue_direct,Je.prototype._setValue_direct_setNeedsUpdate,Je.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Je.prototype._setValue_array,Je.prototype._setValue_array_setNeedsUpdate,Je.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Je.prototype._setValue_arrayElement,Je.prototype._setValue_arrayElement_setNeedsUpdate,Je.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Je.prototype._setValue_fromArray,Je.prototype._setValue_fromArray_setNeedsUpdate,Je.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];const yu=new C;let zr,ia;class lx extends ct{constructor(e=new C(0,0,1),t=new C(0,0,0),n=1,s=16776960,r=n*.2,o=r*.2){super(),this.type="ArrowHelper",zr===void 0&&(zr=new vt,zr.setAttribute("position",new Bt([0,0,0,0,1,0],3)),ia=new wc(0,.5,1,5,1),ia.translate(0,-.5,0)),this.position.copy(t),this.line=new ir(zr,new Ti({color:s,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new wt(ia,new Nn({color:s,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(e),this.setLength(n,r,o)}setDirection(e){if(e.y>.99999)this.quaternion.set(0,0,0,1);else if(e.y<-.99999)this.quaternion.set(1,0,0,0);else{yu.set(e.z,0,-e.x).normalize();const t=Math.acos(e.y);this.quaternion.setFromAxisAngle(yu,t)}}setLength(e,t=e*.2,n=t*.2){this.line.scale.set(1,Math.max(1e-4,e-t),1),this.line.updateMatrix(),this.cone.scale.set(n,t,n),this.cone.position.y=e,this.cone.updateMatrix()}setColor(e){this.line.material.color.set(e),this.cone.material.color.set(e)}copy(e){return super.copy(e,!1),this.line.copy(e.line),this.cone.copy(e.cone),this}dispose(){this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:fc}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=fc);function mi(i){return i*Math.PI/180}function Dc(i){return i==="tesseract"?{xy:0,xz:mi(-80),yz:mi(-35),xw:0,yw:0,zw:mi(-90)}:{xy:0,xz:mi(-90),yz:mi(-25),xw:0,yw:mi(6),zw:mi(-90)}}function Ih(i){return i==="matryoshka"?1:0}function Su(){return typeof window<"u"&&window.matchMedia("(max-width: 900px), (max-height: 520px)").matches}function Dh(i){return i==="matryoshka"&&Su()?1.5:i==="matryoshka"&&!Su()?.8:1}const Uh=1.2,ux=.2,hx=.5,ro=.008,Eu=.0015,Tu=.006,$r=6,dx=32,fx=140,px=.36,Ln=[.24,.55,1],ts=[1,.3,.42],mx=[0,2,6,0,6,4,1,5,7,1,7,3,0,4,5,0,5,1,2,3,7,2,7,6,0,1,3,0,3,2,4,6,7,4,7,5],Xs=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];function gx(i,e=!1){const t=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},o={},a=i[0].morphTargetsRelative,c=new vt;let l=0;for(let u=0;u<i.length;++u){const h=i[u];let d=0;if(t!==(h.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const f in h.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(h.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(a!==h.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const f in h.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(h.morphAttributes[f])}if(e){let f;if(t)f=h.index.count;else if(h.attributes.position!==void 0)f=h.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,f,u),l+=f}}if(t){let u=0;const h=[];for(let d=0;d<i.length;++d){const f=i[d].index;for(let g=0;g<f.count;++g)h.push(f.getX(g)+u);u+=i[d].attributes.position.count}c.setIndex(h)}for(const u in r){const h=bu(r[u]);if(!h)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;c.setAttribute(u,h)}for(const u in o){const h=o[u][0].length;if(h===0)break;c.morphAttributes=c.morphAttributes||{},c.morphAttributes[u]=[];for(let d=0;d<h;++d){const f=[];for(let _=0;_<o[u].length;++_)f.push(o[u][_][d]);const g=bu(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;c.morphAttributes[u].push(g)}}return c}function bu(i){let e,t,n,s=-1,r=0;for(let l=0;l<i.length;++l){const u=i[l];if(e===void 0&&(e=u.array.constructor),e!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=u.itemSize),t!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=u.gpuType),s!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*t}const o=new e(r),a=new tt(o,t,n);let c=0;for(let l=0;l<i.length;++l){const u=i[l];if(u.isInterleavedBufferAttribute){const h=c/t;for(let d=0,f=u.count;d<f;d++)for(let g=0;g<t;g++){const _=u.getComponent(d,g);a.setComponent(d+h,g,_)}}else o.set(u.array,c);c+=u.count*t}return s!==void 0&&(a.gpuType=s),a}function Au(i,e){if(e===Od)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),i;if(e===Ja||e===ih){let t=i.getIndex();if(t===null){const o=[],a=i.getAttribute("position");if(a!==void 0){for(let c=0;c<a.count;c++)o.push(c);i.setIndex(o),t=i.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),i}const n=t.count-2,s=[];if(e===Ja)for(let o=1;o<=n;o++)s.push(t.getX(0)),s.push(t.getX(o)),s.push(t.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(s.push(t.getX(o)),s.push(t.getX(o+1)),s.push(t.getX(o+2))):(s.push(t.getX(o+2)),s.push(t.getX(o+1)),s.push(t.getX(o)));s.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const r=i.clone();return r.setIndex(s),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),i}class _x extends Ss{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Sx(t)}),this.register(function(t){return new Ex(t)}),this.register(function(t){return new Ix(t)}),this.register(function(t){return new Dx(t)}),this.register(function(t){return new Ux(t)}),this.register(function(t){return new bx(t)}),this.register(function(t){return new Ax(t)}),this.register(function(t){return new wx(t)}),this.register(function(t){return new Rx(t)}),this.register(function(t){return new yx(t)}),this.register(function(t){return new Cx(t)}),this.register(function(t){return new Tx(t)}),this.register(function(t){return new Lx(t)}),this.register(function(t){return new Px(t)}),this.register(function(t){return new vx(t)}),this.register(function(t){return new Nx(t)}),this.register(function(t){return new Fx(t)})}load(e,t,n,s){const r=this;let o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){const l=Ws.extractUrlBase(e);o=Ws.resolveURL(l,this.path)}else o=Ws.extractUrlBase(e);this.manager.itemStart(e);const a=function(l){s?s(l):console.error(l),r.manager.itemError(e),r.manager.itemEnd(e)},c=new Lh(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(e,function(l){try{r.parse(l,o,function(u){t(u),r.manager.itemEnd(e)},a)}catch(u){a(u)}},n,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,s){let r;const o={},a={},c=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(c.decode(new Uint8Array(e,0,4))===Nh){try{o[ze.KHR_BINARY_GLTF]=new Ox(e)}catch(h){s&&s(h);return}r=JSON.parse(o[ze.KHR_BINARY_GLTF].content)}else r=JSON.parse(c.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){s&&s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const l=new Zx(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let u=0;u<this.pluginCallbacks.length;u++){const h=this.pluginCallbacks[u](l);h.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[h.name]=h,o[h.name]=!0}if(r.extensionsUsed)for(let u=0;u<r.extensionsUsed.length;++u){const h=r.extensionsUsed[u],d=r.extensionsRequired||[];switch(h){case ze.KHR_MATERIALS_UNLIT:o[h]=new Mx;break;case ze.KHR_DRACO_MESH_COMPRESSION:o[h]=new Bx(r,this.dracoLoader);break;case ze.KHR_TEXTURE_TRANSFORM:o[h]=new zx;break;case ze.KHR_MESH_QUANTIZATION:o[h]=new kx;break;default:d.indexOf(h)>=0&&a[h]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+h+'".')}}l.setExtensions(o),l.setPlugins(a),l.parse(n,s)}parseAsync(e,t){const n=this;return new Promise(function(s,r){n.parse(e,t,s,r)})}}function xx(){let i={};return{get:function(e){return i[e]},add:function(e,t){i[e]=t},remove:function(e){delete i[e]},removeAll:function(){i={}}}}const ze={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class vx{constructor(e){this.parser=e,this.name=ze.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let n=0,s=t.length;n<s;n++){const r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){const t=this.parser,n="light:"+e;let s=t.cache.get(n);if(s)return s;const r=t.json,c=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e];let l;const u=new Ae(16777215);c.color!==void 0&&u.setRGB(c.color[0],c.color[1],c.color[2],Ft);const h=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new $0(u),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new K0(u),l.distance=h;break;case"spot":l=new j0(u),l.distance=h,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),l.decay=2,Pn(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=t.createUniqueName(c.name||"light_"+e),s=Promise.resolve(l),t.cache.add(n,s),s}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,n=this.parser,r=n.json.nodes[e],a=(r.extensions&&r.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(c){return n._getNodeRef(t.cache,a,c)})}}class Mx{constructor(){this.name=ze.KHR_MATERIALS_UNLIT}getMaterialType(){return Nn}extendParams(e,t,n){const s=[];e.color=new Ae(1,1,1),e.opacity=1;const r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){const o=r.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],Ft),e.opacity=o[3]}r.baseColorTexture!==void 0&&s.push(n.assignTexture(e,"map",r.baseColorTexture,xt))}return Promise.all(s)}}class yx{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=s.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}}class Sx{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(r.push(n.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){const a=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new Le(a,a)}return Promise.all(r)}}class Ex{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_DISPERSION}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=s.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}}class Tx{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(r)}}class bx{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_SHEEN}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[];t.sheenColor=new Ae(0,0,0),t.sheenRoughness=0,t.sheen=1;const o=s.extensions[this.name];if(o.sheenColorFactor!==void 0){const a=o.sheenColorFactor;t.sheenColor.setRGB(a[0],a[1],a[2],Ft)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&r.push(n.assignTexture(t,"sheenColorMap",o.sheenColorTexture,xt)),o.sheenRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(r)}}class Ax{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&r.push(n.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(r)}}class wx{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_VOLUME}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&r.push(n.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;const a=o.attenuationColor||[1,1,1];return t.attenuationColor=new Ae().setRGB(a[0],a[1],a[2],Ft),Promise.all(r)}}class Rx{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_IOR}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=s.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}}class Cx{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_SPECULAR}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&r.push(n.assignTexture(t,"specularIntensityMap",o.specularTexture));const a=o.specularColorFactor||[1,1,1];return t.specularColor=new Ae().setRGB(a[0],a[1],a[2],Ft),o.specularColorTexture!==void 0&&r.push(n.assignTexture(t,"specularColorMap",o.specularColorTexture,xt)),Promise.all(r)}}class Px{constructor(e){this.parser=e,this.name=ze.EXT_MATERIALS_BUMP}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&r.push(n.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(r)}}class Lx{constructor(e){this.parser=e,this.name=ze.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:_n}extendMaterialParams(e,t){const n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();const r=[],o=s.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&r.push(n.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(r)}}class Ix{constructor(e){this.parser=e,this.name=ze.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,n=t.json,s=n.textures[e];if(!s.extensions||!s.extensions[this.name])return null;const r=s.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,o)}}class Dx{constructor(e){this.parser=e,this.name=ze.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){const t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;const o=r.extensions[t],a=s.images[o.source];let c=n.textureLoader;if(a.uri){const l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return this.detectSupport().then(function(l){if(l)return n.loadTextureImage(e,o.source,c);if(s.extensionsRequired&&s.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Ux{constructor(e){this.parser=e,this.name=ze.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){const t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;const o=r.extensions[t],a=s.images[o.source];let c=n.textureLoader;if(a.uri){const l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return this.detectSupport().then(function(l){if(l)return n.loadTextureImage(e,o.source,c);if(s.extensionsRequired&&s.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Nx{constructor(e){this.name=ze.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){const t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){const s=n.extensions[this.name],r=this.parser.getDependency("buffer",s.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(a){const c=s.byteOffset||0,l=s.byteLength||0,u=s.count,h=s.byteStride,d=new Uint8Array(a,c,l);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(u,h,d,s.mode,s.filter).then(function(f){return f.buffer}):o.ready.then(function(){const f=new ArrayBuffer(u*h);return o.decodeGltfBuffer(new Uint8Array(f),u,h,d,s.mode,s.filter),f})})}else return null}}class Fx{constructor(e){this.name=ze.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const s=t.meshes[n.mesh];for(const l of s.primitives)if(l.mode!==qt.TRIANGLES&&l.mode!==qt.TRIANGLE_STRIP&&l.mode!==qt.TRIANGLE_FAN&&l.mode!==void 0)return null;const o=n.extensions[this.name].attributes,a=[],c={};for(const l in o)a.push(this.parser.getDependency("accessor",o[l]).then(u=>(c[l]=u,c[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{const u=l.pop(),h=u.isGroup?u.children:[u],d=l[0].count,f=[];for(const g of h){const _=new we,m=new C,p=new oi,b=new C(1,1,1),E=new P0(g.geometry,g.material,d);for(let y=0;y<d;y++)c.TRANSLATION&&m.fromBufferAttribute(c.TRANSLATION,y),c.ROTATION&&p.fromBufferAttribute(c.ROTATION,y),c.SCALE&&b.fromBufferAttribute(c.SCALE,y),E.setMatrixAt(y,_.compose(m,p,b));for(const y in c)if(y==="_COLOR_0"){const N=c[y];E.instanceColor=new tc(N.array,N.itemSize,N.normalized)}else y!=="TRANSLATION"&&y!=="ROTATION"&&y!=="SCALE"&&g.geometry.setAttribute(y,c[y]);ct.prototype.copy.call(E,g),this.parser.assignFinalMaterial(E),f.push(E)}return u.isGroup?(u.clear(),u.add(...f),u):f[0]}))}}const Nh="glTF",Os=12,wu={JSON:1313821514,BIN:5130562};class Ox{constructor(e){this.name=ze.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,Os),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Nh)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const s=this.header.length-Os,r=new DataView(e,Os);let o=0;for(;o<s;){const a=r.getUint32(o,!0);o+=4;const c=r.getUint32(o,!0);if(o+=4,c===wu.JSON){const l=new Uint8Array(e,Os+o,a);this.content=n.decode(l)}else if(c===wu.BIN){const l=Os+o;this.body=e.slice(l,l+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class Bx{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=ze.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const n=this.json,s=this.dracoLoader,r=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,a={},c={},l={};for(const u in o){const h=ic[u]||u.toLowerCase();a[h]=o[u]}for(const u in e.attributes){const h=ic[u]||u.toLowerCase();if(o[u]!==void 0){const d=n.accessors[e.attributes[u]],f=ns[d.componentType];l[h]=f.name,c[h]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(u){return new Promise(function(h,d){s.decodeDracoFile(u,function(f){for(const g in f.attributes){const _=f.attributes[g],m=c[g];m!==void 0&&(_.normalized=m)}h(f)},a,l,Ft,d)})})}}class zx{constructor(){this.name=ze.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class kx{constructor(){this.name=ze.KHR_MESH_QUANTIZATION}}class Fh extends sr{constructor(e,t,n,s){super(e,t,n,s)}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s*3+s;for(let o=0;o!==s;o++)t[o]=n[r+o];return t}interpolate_(e,t,n,s){const r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=a*2,l=a*3,u=s-t,h=(n-t)/u,d=h*h,f=d*h,g=e*l,_=g-l,m=-2*f+3*d,p=f-d,b=1-m,E=p-d+h;for(let y=0;y!==a;y++){const N=o[_+y+a],w=o[_+y+c]*u,A=o[g+y+a],P=o[g+y]*u;r[y]=b*N+E*w+m*A+p*P}return r}}const Hx=new oi;class Vx extends Fh{interpolate_(e,t,n,s){const r=super.interpolate_(e,t,n,s);return Hx.fromArray(r).normalize().toArray(r),r}}const qt={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},ns={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Ru={9728:Nt,9729:Vt,9984:ju,9985:Gr,9986:Bs,9987:Dn},Cu={33071:Zt,33648:to,10497:os},sa={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},ic={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Kn={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Gx={CUBICSPLINE:void 0,LINEAR:Zs,STEP:Ks},ra={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Wx(i){return i.DefaultMaterial===void 0&&(i.DefaultMaterial=new Rc({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Bn})),i.DefaultMaterial}function gi(i,e,t){for(const n in t.extensions)i[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function Pn(i,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(i.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Xx(i,e,t){let n=!1,s=!1,r=!1;for(let l=0,u=e.length;l<u;l++){const h=e[l];if(h.POSITION!==void 0&&(n=!0),h.NORMAL!==void 0&&(s=!0),h.COLOR_0!==void 0&&(r=!0),n&&s&&r)break}if(!n&&!s&&!r)return Promise.resolve(i);const o=[],a=[],c=[];for(let l=0,u=e.length;l<u;l++){const h=e[l];if(n){const d=h.POSITION!==void 0?t.getDependency("accessor",h.POSITION):i.attributes.position;o.push(d)}if(s){const d=h.NORMAL!==void 0?t.getDependency("accessor",h.NORMAL):i.attributes.normal;a.push(d)}if(r){const d=h.COLOR_0!==void 0?t.getDependency("accessor",h.COLOR_0):i.attributes.color;c.push(d)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){const u=l[0],h=l[1],d=l[2];return n&&(i.morphAttributes.position=u),s&&(i.morphAttributes.normal=h),r&&(i.morphAttributes.color=d),i.morphTargetsRelative=!0,i})}function qx(i,e){if(i.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)i.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(i.morphTargetInfluences.length===t.length){i.morphTargetDictionary={};for(let n=0,s=t.length;n<s;n++)i.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function jx(i){let e;const t=i.extensions&&i.extensions[ze.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+oa(t.attributes):e=i.indices+":"+oa(i.attributes)+":"+i.mode,i.targets!==void 0)for(let n=0,s=i.targets.length;n<s;n++)e+=":"+oa(i.targets[n]);return e}function oa(i){let e="";const t=Object.keys(i).sort();for(let n=0,s=t.length;n<s;n++)e+=t[n]+":"+i[t[n]]+";";return e}function sc(i){switch(i){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Yx(i){return i.search(/\.jpe?g($|\?)/i)>0||i.search(/^data\:image\/jpeg/)===0?"image/jpeg":i.search(/\.webp($|\?)/i)>0||i.search(/^data\:image\/webp/)===0?"image/webp":i.search(/\.ktx2($|\?)/i)>0||i.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const Kx=new we;class Zx{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new xx,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,s=-1,r=!1,o=-1;if(typeof navigator<"u"){const a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;const c=a.match(/Version\/(\d+)/);s=n&&c?parseInt(c[1],10):-1,r=a.indexOf("Firefox")>-1,o=r?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&s<17||r&&o<98?this.textureLoader=new X0(this.options.manager):this.textureLoader=new J0(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Lh(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const n=this,s=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){const a={scene:o[0][s.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:s.asset,parser:n,userData:{}};return gi(r,a,s),Pn(a,s),Promise.all(n._invokeAll(function(c){return c.afterRoot&&c.afterRoot(a)})).then(function(){for(const c of a.scenes)c.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let s=0,r=t.length;s<r;s++){const o=t[s].joints;for(let a=0,c=o.length;a<c;a++)e[o[a]].isBone=!0}for(let s=0,r=e.length;s<r;s++){const o=e[s];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;const s=n.clone(),r=(o,a)=>{const c=this.associations.get(o);c!=null&&this.associations.set(a,c);for(const[l,u]of o.children.entries())r(u,a.children[l])};return r(n,s),s.name+="_instance_"+e.uses[t]++,s}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){const s=e(t[n]);if(s)return s}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const n=[];for(let s=0;s<t.length;s++){const r=e(t[s]);r&&n.push(r)}return n}getDependency(e,t){const n=e+":"+t;let s=this.cache.get(n);if(!s){switch(e){case"scene":s=this.loadScene(t);break;case"node":s=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":s=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":s=this.loadAccessor(t);break;case"bufferView":s=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":s=this.loadBuffer(t);break;case"material":s=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":s=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":s=this.loadSkin(t);break;case"animation":s=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":s=this.loadCamera(t);break;default:if(s=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!s)throw new Error("Unknown type: "+e);break}this.cache.add(n,s)}return s}getDependencies(e){let t=this.cache.get(e);if(!t){const n=this,s=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(s.map(function(r,o){return n.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[ze.KHR_BINARY_GLTF].body);const s=this.options;return new Promise(function(r,o){n.load(Ws.resolveURL(t.uri,s.path),r,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){const s=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+s)})}loadAccessor(e){const t=this,n=this.json,s=this.json.accessors[e];if(s.bufferView===void 0&&s.sparse===void 0){const o=sa[s.type],a=ns[s.componentType],c=s.normalized===!0,l=new a(s.count*o);return Promise.resolve(new tt(l,o,c))}const r=[];return s.bufferView!==void 0?r.push(this.getDependency("bufferView",s.bufferView)):r.push(null),s.sparse!==void 0&&(r.push(this.getDependency("bufferView",s.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",s.sparse.values.bufferView))),Promise.all(r).then(function(o){const a=o[0],c=sa[s.type],l=ns[s.componentType],u=l.BYTES_PER_ELEMENT,h=u*c,d=s.byteOffset||0,f=s.bufferView!==void 0?n.bufferViews[s.bufferView].byteStride:void 0,g=s.normalized===!0;let _,m;if(f&&f!==h){const p=Math.floor(d/f),b="InterleavedBuffer:"+s.bufferView+":"+s.componentType+":"+p+":"+s.count;let E=t.cache.get(b);E||(_=new l(a,p*f,s.count*f/u),E=new Sh(_,f/u),t.cache.add(b,E)),m=new Js(E,c,d%f/u,g)}else a===null?_=new l(s.count*c):_=new l(a,d,s.count*c),m=new tt(_,c,g);if(s.sparse!==void 0){const p=sa.SCALAR,b=ns[s.sparse.indices.componentType],E=s.sparse.indices.byteOffset||0,y=s.sparse.values.byteOffset||0,N=new b(o[1],E,s.sparse.count*p),w=new l(o[2],y,s.sparse.count*c);a!==null&&(m=new tt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let A=0,P=N.length;A<P;A++){const S=N[A];if(m.setX(S,w[A*c]),c>=2&&m.setY(S,w[A*c+1]),c>=3&&m.setZ(S,w[A*c+2]),c>=4&&m.setW(S,w[A*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=g}return m})}loadTexture(e){const t=this.json,n=this.options,r=t.textures[e].source,o=t.images[r];let a=this.textureLoader;if(o.uri){const c=n.manager.getHandler(o.uri);c!==null&&(a=c)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,n){const s=this,r=this.json,o=r.textures[e],a=r.images[t],c=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[c])return this.textureCache[c];const l=this.loadImageSource(t,n).then(function(u){u.flipY=!1,u.name=o.name||a.name||"",u.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(u.name=a.uri);const d=(r.samplers||{})[o.sampler]||{};return u.magFilter=Ru[d.magFilter]||Vt,u.minFilter=Ru[d.minFilter]||Dn,u.wrapS=Cu[d.wrapS]||os,u.wrapT=Cu[d.wrapT]||os,u.generateMipmaps=!u.isCompressedTexture&&u.minFilter!==Nt&&u.minFilter!==Vt,s.associations.set(u,{textures:e}),u}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(e,t){const n=this,s=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(h=>h.clone());const o=s.images[e],a=self.URL||self.webkitURL;let c=o.uri||"",l=!1;if(o.bufferView!==void 0)c=n.getDependency("bufferView",o.bufferView).then(function(h){l=!0;const d=new Blob([h],{type:o.mimeType});return c=a.createObjectURL(d),c});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const u=Promise.resolve(c).then(function(h){return new Promise(function(d,f){let g=d;t.isImageBitmapLoader===!0&&(g=function(_){const m=new yt(_);m.needsUpdate=!0,d(m)}),t.load(Ws.resolveURL(h,r.path),g,void 0,f)})}).then(function(h){return l===!0&&a.revokeObjectURL(c),Pn(h,o),h.userData.mimeType=o.mimeType||Yx(o.uri),h}).catch(function(h){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),h});return this.sourceCache[e]=u,u}assignTexture(e,t,n,s){const r=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),r.extensions[ze.KHR_TEXTURE_TRANSFORM]){const a=n.extensions!==void 0?n.extensions[ze.KHR_TEXTURE_TRANSFORM]:void 0;if(a){const c=r.associations.get(o);o=r.extensions[ze.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),r.associations.set(o,c)}}return s!==void 0&&(o.colorSpace=s),e[t]=o,o})}assignFinalMaterial(e){const t=e.geometry;let n=e.material;const s=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){const a="PointsMaterial:"+n.uuid;let c=this.cache.get(a);c||(c=new Ac,un.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,c.sizeAttenuation=!1,this.cache.add(a,c)),n=c}else if(e.isLine){const a="LineBasicMaterial:"+n.uuid;let c=this.cache.get(a);c||(c=new Ti,un.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,this.cache.add(a,c)),n=c}if(s||r||o){let a="ClonedMaterial:"+n.uuid+":";s&&(a+="derivative-tangents:"),r&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let c=this.cache.get(a);c||(c=n.clone(),r&&(c.vertexColors=!0),o&&(c.flatShading=!0),s&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(a,c),this.associations.set(c,this.associations.get(n))),n=c}e.material=n}getMaterialType(){return Rc}loadMaterial(e){const t=this,n=this.json,s=this.extensions,r=n.materials[e];let o;const a={},c=r.extensions||{},l=[];if(c[ze.KHR_MATERIALS_UNLIT]){const h=s[ze.KHR_MATERIALS_UNLIT];o=h.getMaterialType(),l.push(h.extendParams(a,r,t))}else{const h=r.pbrMetallicRoughness||{};if(a.color=new Ae(1,1,1),a.opacity=1,Array.isArray(h.baseColorFactor)){const d=h.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],Ft),a.opacity=d[3]}h.baseColorTexture!==void 0&&l.push(t.assignTexture(a,"map",h.baseColorTexture,xt)),a.metalness=h.metallicFactor!==void 0?h.metallicFactor:1,a.roughness=h.roughnessFactor!==void 0?h.roughnessFactor:1,h.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(a,"metalnessMap",h.metallicRoughnessTexture)),l.push(t.assignTexture(a,"roughnessMap",h.metallicRoughnessTexture))),o=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,a)})))}r.doubleSided===!0&&(a.side=jt);const u=r.alphaMode||ra.OPAQUE;if(u===ra.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,u===ra.MASK&&(a.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&o!==Nn&&(l.push(t.assignTexture(a,"normalMap",r.normalTexture)),a.normalScale=new Le(1,1),r.normalTexture.scale!==void 0)){const h=r.normalTexture.scale;a.normalScale.set(h,h)}if(r.occlusionTexture!==void 0&&o!==Nn&&(l.push(t.assignTexture(a,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&o!==Nn){const h=r.emissiveFactor;a.emissive=new Ae().setRGB(h[0],h[1],h[2],Ft)}return r.emissiveTexture!==void 0&&o!==Nn&&l.push(t.assignTexture(a,"emissiveMap",r.emissiveTexture,xt)),Promise.all(l).then(function(){const h=new o(a);return r.name&&(h.name=r.name),Pn(h,r),t.associations.set(h,{materials:e}),r.extensions&&gi(s,h,r),h})}createUniqueName(e){const t=Je.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,n=this.extensions,s=this.primitiveCache;function r(a){return n[ze.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(c){return Pu(c,a,t)})}const o=[];for(let a=0,c=e.length;a<c;a++){const l=e[a],u=jx(l),h=s[u];if(h)o.push(h.promise);else{let d;l.extensions&&l.extensions[ze.KHR_DRACO_MESH_COMPRESSION]?d=r(l):d=Pu(new vt,l,t),s[u]={primitive:l,promise:d},o.push(d)}}return Promise.all(o)}loadMesh(e){const t=this,n=this.json,s=this.extensions,r=n.meshes[e],o=r.primitives,a=[];for(let c=0,l=o.length;c<l;c++){const u=o[c].material===void 0?Wx(this.cache):this.getDependency("material",o[c].material);a.push(u)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(c){const l=c.slice(0,c.length-1),u=c[c.length-1],h=[];for(let f=0,g=u.length;f<g;f++){const _=u[f],m=o[f];let p;const b=l[f];if(m.mode===qt.TRIANGLES||m.mode===qt.TRIANGLE_STRIP||m.mode===qt.TRIANGLE_FAN||m.mode===void 0)p=r.isSkinnedMesh===!0?new w0(_,b):new wt(_,b),p.isSkinnedMesh===!0&&p.normalizeSkinWeights(),m.mode===qt.TRIANGLE_STRIP?p.geometry=Au(p.geometry,ih):m.mode===qt.TRIANGLE_FAN&&(p.geometry=Au(p.geometry,Ja));else if(m.mode===qt.LINES)p=new Zr(_,b);else if(m.mode===qt.LINE_STRIP)p=new ir(_,b);else if(m.mode===qt.LINE_LOOP)p=new L0(_,b);else if(m.mode===qt.POINTS)p=new wh(_,b);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(p.geometry.morphAttributes).length>0&&qx(p,r),p.name=t.createUniqueName(r.name||"mesh_"+e),Pn(p,r),m.extensions&&gi(s,p,m),t.assignFinalMaterial(p),h.push(p)}for(let f=0,g=h.length;f<g;f++)t.associations.set(h[f],{meshes:e,primitives:f});if(h.length===1)return r.extensions&&gi(s,h[0],r),h[0];const d=new Fn;r.extensions&&gi(s,d,r),t.associations.set(d,{meshes:e});for(let f=0,g=h.length;f<g;f++)d.add(h[f]);return d})}loadCamera(e){let t;const n=this.json.cameras[e],s=n[n.type];if(!s){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new At(Ei.radToDeg(s.yfov),s.aspectRatio||1,s.znear||1,s.zfar||2e6):n.type==="orthographic"&&(t=new Ec(-s.xmag,s.xmag,s.ymag,-s.ymag,s.znear,s.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),Pn(t,n),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],n=[];for(let s=0,r=t.joints.length;s<r;s++)n.push(this._loadNodeShallow(t.joints[s]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(s){const r=s.pop(),o=s,a=[],c=[];for(let l=0,u=o.length;l<u;l++){const h=o[l];if(h){a.push(h);const d=new we;r!==null&&d.fromArray(r.array,l*16),c.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new bc(a,c)})}loadAnimation(e){const t=this.json,n=this,s=t.animations[e],r=s.name?s.name:"animation_"+e,o=[],a=[],c=[],l=[],u=[];for(let h=0,d=s.channels.length;h<d;h++){const f=s.channels[h],g=s.samplers[f.sampler],_=f.target,m=_.node,p=s.parameters!==void 0?s.parameters[g.input]:g.input,b=s.parameters!==void 0?s.parameters[g.output]:g.output;_.node!==void 0&&(o.push(this.getDependency("node",m)),a.push(this.getDependency("accessor",p)),c.push(this.getDependency("accessor",b)),l.push(g),u.push(_))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l),Promise.all(u)]).then(function(h){const d=h[0],f=h[1],g=h[2],_=h[3],m=h[4],p=[];for(let b=0,E=d.length;b<E;b++){const y=d[b],N=f[b],w=g[b],A=_[b],P=m[b];if(y===void 0)continue;y.updateMatrix&&y.updateMatrix();const S=n._createAnimationTracks(y,N,w,A,P);if(S)for(let M=0;M<S.length;M++)p.push(S[M])}return new B0(r,void 0,p)})}createNodeMesh(e){const t=this.json,n=this,s=t.nodes[e];return s.mesh===void 0?null:n.getDependency("mesh",s.mesh).then(function(r){const o=n._getNodeRef(n.meshCache,s.mesh,r);return s.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let c=0,l=s.weights.length;c<l;c++)a.morphTargetInfluences[c]=s.weights[c]}),o})}loadNode(e){const t=this.json,n=this,s=t.nodes[e],r=n._loadNodeShallow(e),o=[],a=s.children||[];for(let l=0,u=a.length;l<u;l++)o.push(n.getDependency("node",a[l]));const c=s.skin===void 0?Promise.resolve(null):n.getDependency("skin",s.skin);return Promise.all([r,Promise.all(o),c]).then(function(l){const u=l[0],h=l[1],d=l[2];d!==null&&u.traverse(function(f){f.isSkinnedMesh&&f.bind(d,Kx)});for(let f=0,g=h.length;f<g;f++)u.add(h[f]);return u})}_loadNodeShallow(e){const t=this.json,n=this.extensions,s=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const r=t.nodes[e],o=r.name?s.createUniqueName(r.name):"",a=[],c=s._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return c&&a.push(c),r.camera!==void 0&&a.push(s.getDependency("camera",r.camera).then(function(l){return s._getNodeRef(s.cameraCache,r.camera,l)})),s._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){a.push(l)}),this.nodeCache[e]=Promise.all(a).then(function(l){let u;if(r.isBone===!0?u=new bh:l.length>1?u=new Fn:l.length===1?u=l[0]:u=new ct,u!==l[0])for(let h=0,d=l.length;h<d;h++)u.add(l[h]);if(r.name&&(u.userData.name=r.name,u.name=o),Pn(u,r),r.extensions&&gi(n,u,r),r.matrix!==void 0){const h=new we;h.fromArray(r.matrix),u.applyMatrix4(h)}else r.translation!==void 0&&u.position.fromArray(r.translation),r.rotation!==void 0&&u.quaternion.fromArray(r.rotation),r.scale!==void 0&&u.scale.fromArray(r.scale);return s.associations.has(u)||s.associations.set(u,{}),s.associations.get(u).nodes=e,u}),this.nodeCache[e]}loadScene(e){const t=this.extensions,n=this.json.scenes[e],s=this,r=new Fn;n.name&&(r.name=s.createUniqueName(n.name)),Pn(r,n),n.extensions&&gi(t,r,n);const o=n.nodes||[],a=[];for(let c=0,l=o.length;c<l;c++)a.push(s.getDependency("node",o[c]));return Promise.all(a).then(function(c){for(let u=0,h=c.length;u<h;u++)r.add(c[u]);const l=u=>{const h=new Map;for(const[d,f]of s.associations)(d instanceof un||d instanceof yt)&&h.set(d,f);return u.traverse(d=>{const f=s.associations.get(d);f!=null&&h.set(d,f)}),h};return s.associations=l(r),r})}_createAnimationTracks(e,t,n,s,r){const o=[],a=e.name?e.name:e.uuid,c=[];Kn[r.path]===Kn.weights?e.traverse(function(d){d.morphTargetInfluences&&c.push(d.name?d.name:d.uuid)}):c.push(a);let l;switch(Kn[r.path]){case Kn.weights:l=hs;break;case Kn.rotation:l=ds;break;case Kn.position:case Kn.scale:l=fs;break;default:n.itemSize===1?l=hs:l=fs;break}const u=s.interpolation!==void 0?Gx[s.interpolation]:Zs,h=this._getArrayFromAccessor(n);for(let d=0,f=c.length;d<f;d++){const g=new l(c[d]+"."+Kn[r.path],t.array,h,u);s.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(g),o.push(g)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const n=sc(t.constructor),s=new Float32Array(t.length);for(let r=0,o=t.length;r<o;r++)s[r]=t[r]*n;t=s}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){const s=this instanceof ds?Vx:Fh;return new s(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function $x(i,e,t){const n=e.attributes,s=new kn;if(n.POSITION!==void 0){const a=t.json.accessors[n.POSITION],c=a.min,l=a.max;if(c!==void 0&&l!==void 0){if(s.set(new C(c[0],c[1],c[2]),new C(l[0],l[1],l[2])),a.normalized){const u=sc(ns[a.componentType]);s.min.multiplyScalar(u),s.max.multiplyScalar(u)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const r=e.targets;if(r!==void 0){const a=new C,c=new C;for(let l=0,u=r.length;l<u;l++){const h=r[l];if(h.POSITION!==void 0){const d=t.json.accessors[h.POSITION],f=d.min,g=d.max;if(f!==void 0&&g!==void 0){if(c.setX(Math.max(Math.abs(f[0]),Math.abs(g[0]))),c.setY(Math.max(Math.abs(f[1]),Math.abs(g[1]))),c.setZ(Math.max(Math.abs(f[2]),Math.abs(g[2]))),d.normalized){const _=sc(ns[d.componentType]);c.multiplyScalar(_)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}s.expandByVector(a)}i.boundingBox=s;const o=new gn;s.getCenter(o.center),o.radius=s.min.distanceTo(s.max)/2,i.boundingSphere=o}function Pu(i,e,t){const n=e.attributes,s=[];function r(o,a){return t.getDependency("accessor",o).then(function(c){i.setAttribute(a,c)})}for(const o in n){const a=ic[o]||o.toLowerCase();a in i.attributes||s.push(r(n[o],a))}if(e.indices!==void 0&&!i.index){const o=t.getDependency("accessor",e.indices).then(function(a){i.setIndex(a)});s.push(o)}return ke.workingColorSpace!==Ft&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ke.workingColorSpace}" not supported.`),Pn(i,e),$x(i,e,t),Promise.all(s).then(function(){return e.targets!==void 0?Xx(i,e.targets,t):i})}function Jx(i){const e=new Set,t=[];for(let n=0;n<i.length;n+=3){const s=i[n],r=i[n+1],o=i[n+2];aa(e,t,s,r),aa(e,t,r,o),aa(e,t,o,s)}return t}function aa(i,e,t,n){const s=t<n?t:n,r=t<n?n:t,o=s*1048576^r;i.has(o)||(i.add(o),e.push([s,r]))}function Qx(i,e=2){let t=1/0,n=1/0,s=1/0,r=-1/0,o=-1/0,a=-1/0;for(let f=0;f<i.length;f+=3){const g=i[f],_=i[f+1],m=i[f+2];g<t&&(t=g),_<n&&(n=_),m<s&&(s=m),g>r&&(r=g),_>o&&(o=_),m>a&&(a=m)}const c=(t+r)*.5,l=(n+o)*.5,u=(s+a)*.5,h=Math.max(r-t,o-n,a-s,1e-6),d=e/h;for(let f=0;f<i.length;f+=3)i[f]=(i[f]-c)*d,i[f+1]=(i[f+1]-l)*d,i[f+2]=(i[f+2]-u)*d}function ev(i){const e=[],t=(1+Math.sqrt(5))/2;for(let n=0;n<i;n++){const s=i===1?0:1-n/(i-1)*2,r=Math.sqrt(Math.max(0,1-s*s)),o=2*Math.PI*n/t;e.push([Math.cos(o)*r,s,Math.sin(o)*r])}return e}function tv(i,e=dx){const t=i.length/3;if(t<=e)return Array.from({length:t},(s,r)=>r);const n=new Set;for(const s of ev(e)){let r=0,o=-1/0;for(let a=0;a<t;a++){const c=a*3,l=i[c]*s[0]+i[c+1]*s[1]+i[c+2]*s[2];l>o&&(o=l,r=a)}n.add(r)}return[...n]}function nv(i,e=fx){if(i.length<=e)return i.slice();const t=Math.max(1,Math.floor(i.length/e)),n=[];for(let s=0;s<i.length&&n.length<e;s+=t)n.push(i[s]);return n}function iv(i,e){const t=i.length/3;let n=0,s=0,r=0;for(let a=0;a<t;a++){const c=a*3;n+=i[c],s+=i[c+1],r+=i[c+2]}n/=t,s/=t,r/=t;const o=[];for(let a=0;a<e.length;a+=3){const c=e[a]*3,l=e[a+1]*3,u=e[a+2]*3,h=i[c],d=i[c+1],f=i[c+2],g=i[l],_=i[l+1],m=i[l+2],p=i[u],b=i[u+1],E=i[u+2],y=g-h,N=_-d,w=m-f,A=p-h,P=b-d,S=E-f,M=N*S-w*P,R=w*A-y*S,k=y*P-N*A,O=(h+g+p)/3-n,G=(d+_+b)/3-s,j=(f+m+E)/3-r;M*O+R*G+k*j>0&&o.push(e[a],e[a+1],e[a+2])}return Uint32Array.from(o)}function sv(i){const e=Jx(i.indices);return{...i,vertexCount:i.positions.length/3,edges:e,displayEdges:nv(e),wSpokes:tv(i.positions)}}function rv(i){if(!i||Array.isArray(i))return null;const e=i.map;return e?(e.colorSpace=xt,e.wrapS=Zt,e.wrapT=Zt,e.flipY=!1,e):null}function Lu(i,e){const t=new Float32Array(i.count*e);for(let n=0;n<i.count;n++)for(let s=0;s<e;s++)t[n*e+s]=i.getComponent(n,s);return t}async function ov(){const t=await new _x().loadAsync("./models/matryoshka.glb"),n=[];let s=null;if(t.scene.updateMatrixWorld(!0),t.scene.traverse(d=>{const f=d;if(!f.isMesh||!f.geometry)return;const g=f.geometry.clone();g.applyMatrix4(f.matrixWorld),n.push(g),s||(s=rv(f.material))}),n.length===0)throw new Error("Matryoshka GLB has no meshes");const r=n.length===1?n[0]:gx(n,!0);if(!r)throw new Error("Could not merge matryoshka geometries");const o=r.getAttribute("position");if(!o)throw new Error("Matryoshka mesh has no positions");const a=Lu(o,3);Qx(a);for(let d=0;d<a.length;d++)a[d]*=Uh;const c=r.index?Uint32Array.from(r.index.array):Uint32Array.from({length:a.length/3},(d,f)=>f),l=iv(a,c),u=r.getAttribute("uv"),h=u?Lu(u,2):null;return sv({id:"matryoshka",kind:"surface",label:"Matryoshka",positions:a,indices:l,uvs:h,texture:s})}function av(i){return[i&1?1:-1,i&2?1:-1,i&4?1:-1]}function cv(){const i=new Float32Array(24);for(let e=0;e<8;e++){const[t,n,s]=av(e);i[e*3]=t,i[e*3+1]=n,i[e*3+2]=s}return{id:"tesseract",kind:"polytope",label:"Tesseract",positions:i,vertexCount:8,indices:new Uint32Array(mx),uvs:null,edges:Xs.map(([e,t])=>[e,t]),displayEdges:Xs.map(([e,t])=>[e,t]),wSpokes:[0,1,2,3,4,5,6,7],texture:null}}const Oh=[{id:"matryoshka",label:"Matryoshka"},{id:"tesseract",label:"Tesseract"}],Iu=new Map;async function lv(i){const e=Iu.get(i);if(e)return e;const t=i==="matryoshka"?await ov():cv();return Iu.set(i,t),t}function ji(i){return i<0?[Ln[0],Ln[1],Ln[2]]:[ts[0],ts[1],ts[2]]}function uv(i){return[Ln[0]+(ts[0]-Ln[0])*i,Ln[1]+(ts[1]-Ln[1])*i,Ln[2]+(ts[2]-Ln[2])*i]}function Du(i){const e=Math.round(i[0]*255),t=Math.round(i[1]*255),n=Math.round(i[2]*255);return e<<16|t<<8|n}function wn(i,e,t,n){return[i*t-e*n,i*n+e*t]}function vo(i,e,t){let n=i[0],s=i[1],r=i[2],o=i[3],a,c,l;a=Math.cos(e.xy),c=Math.sin(e.xy),l=wn(n,s,a,c),n=l[0],s=l[1];const u=e.xz+(t.mode==="xyz"?t.xz:0),h=e.yz+(t.mode==="xyz"?t.yz:0);return a=Math.cos(u),c=Math.sin(u),l=wn(n,r,a,c),n=l[0],r=l[1],a=Math.cos(h),c=Math.sin(h),l=wn(s,r,a,c),s=l[0],r=l[1],t.mode==="xw-yw"?(a=Math.cos(t.xz),c=Math.sin(t.xz),l=wn(n,o,a,c),n=l[0],o=l[1],a=Math.cos(t.yz),c=Math.sin(t.yz),l=wn(s,o,a,c),s=l[0],o=l[1]):t.mode==="zw"&&(a=Math.cos(t.yz),c=Math.sin(t.yz),l=wn(r,o,a,c),r=l[0],o=l[1]),a=Math.cos(e.xw),c=Math.sin(e.xw),l=wn(n,o,a,c),n=l[0],o=l[1],a=Math.cos(e.yw),c=Math.sin(e.yw),l=wn(s,o,a,c),s=l[0],o=l[1],a=Math.cos(e.zw),c=Math.sin(e.zw),l=wn(r,o,a,c),r=l[0],o=l[1],[n,s,r,o]}function hv(i,e){const[t,n,s,r]=vo(i,e.angles,e.orbit),o=e.projectionDistance/Math.max(.2,e.projectionDistance-r);return[t*o,n*o,s*o]}function dv(i,e,t,n,s,r){const[o,a,c]=vo([i,e,t,n],s.angles,s.orbit);return r[0]=o,r[1]=a,r[2]=c,r}function Jn(i,e,t,n,s,r){const[o,a,c,l]=vo([i,e,t,n],s.angles,s.orbit),u=s.projectionDistance/Math.max(.2,s.projectionDistance-l);return r[0]=o*u,r[1]=a*u,r[2]=c*u,r}function ca(i){const e={strength:{value:.36},near:{value:1},far:{value:8}};return i.onBeforeCompile=t=>{t.uniforms.fadeStrength=e.strength,t.uniforms.fadeNear=e.near,t.uniforms.fadeFar=e.far,t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
varying float vFadeDepth;`).replace("#include <project_vertex>",`#include <project_vertex>
vFadeDepth = -mvPosition.z;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
varying float vFadeDepth;
uniform float fadeStrength;
uniform float fadeNear;
uniform float fadeFar;`).replace("#include <opaque_fragment>",`#include <opaque_fragment>
        float fadeT = clamp((vFadeDepth - fadeNear) / max(0.001, fadeFar - fadeNear), 0.0, 1.0);
        gl_FragColor.a *= mix(1.0, fadeT, fadeStrength);`)},i.customProgramCacheKey=()=>"depth-fade",e}function fv(i,e,t,n){for(const s of i)s.strength.value=e,s.near.value=t,s.far.value=n}const Hs=.62,bt=[0,0,0];function pv(){const e=document.createElement("canvas");e.width=64,e.height=64;const t=e.getContext("2d");if(!t)throw new Error("2D canvas unavailable");const n=t.createRadialGradient(32,32,0,32,32,32);n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.35,"rgba(255,255,255,0.9)"),n.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=n,t.fillRect(0,0,64,64);const s=new Rh(e);return s.colorSpace=xt,s}function la(i,e,t,n=jt){return e&&(e.colorSpace=xt,e.wrapS=Zt,e.wrapT=Zt,e.flipY=!1,e.needsUpdate=!0),new Nn({color:i,map:e,transparent:!0,opacity:Hs,depthWrite:!1,side:n})}function ua(i,e,t,n){for(let s=0;s<e.vertexCount;s++){const r=s*3;Jn(e.positions[r],e.positions[r+1],e.positions[r+2],t,n,bt),i[r]=bt[0],i[r+1]=bt[1],i[r+2]=bt[2]}}class mv{constructor(e){this.parent=e,this.pointMap=pv()}parent;mesh=null;capNeg=null;capPos=null;sliceMeshes=[];cage=null;spokes=null;sliceLines=null;points=null;pointMap;materials=[];fades=[];current(){return this.mesh}setMesh(e,t){this.clear(),this.mesh=e;const n=e.vertexCount,s=()=>{const g=new vt;return g.setAttribute("position",new tt(new Float32Array(n*3),3)),e.uvs&&g.setAttribute("uv",new tt(e.uvs.slice(),2)),g.setIndex(new tt(e.indices.slice(),1)),g},r=e.kind==="surface"?It:jt,o=e.kind==="surface"?16777215:Du(ji(-1)),a=e.kind==="surface"?16777215:Du(ji(1)),c=la(o,e.texture,Hs,r),l=la(a,e.texture,Hs,r);if(this.fades.push(ca(c),ca(l)),this.materials.push(c,l),this.capNeg=new wt(s(),c),this.capPos=new wt(s(),l),this.capNeg.renderOrder=1,this.capPos.renderOrder=1,this.parent.add(this.capNeg,this.capPos),this.sliceMeshes=[],e.kind==="surface")for(let g=0;g<$r;g++){const _=la(16777215,e.texture,Hs,It);this.fades.push(ca(_)),this.materials.push(_);const m=new wt(s(),_);m.renderOrder=1,m.visible=!1,this.parent.add(m),this.sliceMeshes.push(m)}const u=e.displayEdges.length*2,h=new Float32Array(u*6),d=new Float32Array(u*6),f=new vt;if(f.setAttribute("position",new tt(h,3)),f.setAttribute("color",new tt(d,3)),this.cage=new Zr(f,new Ti({vertexColors:!0,transparent:!0,opacity:.95})),this.cage.renderOrder=2,this.parent.add(this.cage),e.kind==="polytope"){const g=e.wSpokes.length,_=new Float32Array(g*6),m=new Float32Array(g*6),p=new vt;p.setAttribute("position",new tt(_,3)),p.setAttribute("color",new tt(m,3)),this.spokes=new Zr(p,new Ti({vertexColors:!0,transparent:!0,opacity:.9,depthTest:!0})),this.spokes.renderOrder=3,this.parent.add(this.spokes);const b=new Float32Array($r*Xs.length*6),E=new Float32Array($r*Xs.length*6),y=new vt;y.setAttribute("position",new tt(b,3)),y.setAttribute("color",new tt(E,3)),this.sliceLines=new Zr(y,new Ti({vertexColors:!0,transparent:!0,opacity:.7})),this.sliceLines.visible=!1,this.parent.add(this.sliceLines);const N=new Float32Array(48),w=new Float32Array(48),A=new vt;A.setAttribute("position",new tt(N,3)),A.setAttribute("color",new tt(w,3)),this.points=new wh(A,new Ac({vertexColors:!0,size:.11,sizeAttenuation:!0,map:this.pointMap,transparent:!0,depthWrite:!1})),this.parent.add(this.points)}}projectedRadius(e){const t=this.mesh;if(!t)return .35;let n=.35;for(const s of[-1,1])for(let r=0;r<t.vertexCount;r++){const o=r*3;Jn(t.positions[o],t.positions[o+1],t.positions[o+2],s,e,bt),n=Math.max(n,Math.hypot(bt[0],bt[1],bt[2]))}return n}extentRadius(e){const t=this.mesh;if(!t)return .35;let n=.35;for(const s of[-1,1])for(let r=0;r<t.vertexCount;r++){const o=r*3;dv(t.positions[o],t.positions[o+1],t.positions[o+2],s,e,bt),n=Math.max(n,Math.hypot(bt[0],bt[1],bt[2]))}return t.id==="matryoshka"?n/Uh:n}projectedHalfWidth(e){const t=this.mesh;if(!t)return .2;let n=.2;for(const s of[-1,1])for(let r=0;r<t.vertexCount;r++){const o=r*3;Jn(t.positions[o],t.positions[o+1],t.positions[o+2],s,e,bt),n=Math.max(n,Math.abs(bt[0]))}return n}update(e,t){const n=this.mesh;if(!n||!this.capNeg||!this.capPos)return;for(const r of this.materials)r.opacity=Hs;const s=t.fillCaps;if(this.capNeg.visible=s,this.capPos.visible=s,s){const r=this.capNeg.geometry.attributes.position.array,o=this.capPos.geometry.attributes.position.array;ua(r,n,-1,e),ua(o,n,1,e),this.capNeg.geometry.attributes.position.needsUpdate=!0,this.capPos.geometry.attributes.position.needsUpdate=!0,this.capNeg.geometry.computeBoundingSphere(),this.capPos.geometry.computeBoundingSphere()}if(this.spokes){const r=this.spokes.material;r.opacity=s?.7:.9}this.updateCage(n,e,t),this.updateSpokes(n,e),this.updateSliceMeshes(n,e,t),this.updateSliceLines(n,e,t),this.updatePoints(n,e)}setDepthFade(e,t,n){fv(this.fades,n,Math.max(.15,e-t*1.05),e+t*1.05)}updateCage(e,t,n){if(!this.cage)return;const s=e.kind==="polytope"||n.showCage;if(this.cage.visible=s,!s)return;const r=this.cage.geometry.attributes.position.array,o=this.cage.geometry.attributes.color.array,a=[0,0,0],c=[0,0,0];let l=0;for(const u of[-1,1]){const h=ji(u);for(const[d,f]of e.displayEdges){const g=d*3,_=f*3;Jn(e.positions[g],e.positions[g+1],e.positions[g+2],u,t,a),Jn(e.positions[_],e.positions[_+1],e.positions[_+2],u,t,c);const m=l*6;r[m]=a[0],r[m+1]=a[1],r[m+2]=a[2],r[m+3]=c[0],r[m+4]=c[1],r[m+5]=c[2],o[m]=o[m+3]=h[0],o[m+1]=o[m+4]=h[1],o[m+2]=o[m+5]=h[2],l++}}this.cage.geometry.setDrawRange(0,l*2),this.cage.geometry.attributes.position.needsUpdate=!0,this.cage.geometry.attributes.color.needsUpdate=!0,this.cage.geometry.computeBoundingSphere()}updateSpokes(e,t){if(!this.spokes||e.kind!=="polytope"){this.spokes&&(this.spokes.visible=!1);return}this.spokes.visible=!0;const n=this.spokes.geometry.attributes.position.array,s=this.spokes.geometry.attributes.color.array,r=[0,0,0],o=[0,0,0],a=ji(-1),c=ji(1);for(let l=0;l<e.wSpokes.length;l++){const h=e.wSpokes[l]*3;Jn(e.positions[h],e.positions[h+1],e.positions[h+2],-1,t,r),Jn(e.positions[h],e.positions[h+1],e.positions[h+2],1,t,o);const d=l*6;n[d]=r[0],n[d+1]=r[1],n[d+2]=r[2],n[d+3]=o[0],n[d+4]=o[1],n[d+5]=o[2],s[d]=a[0],s[d+1]=a[1],s[d+2]=a[2],s[d+3]=c[0],s[d+4]=c[1],s[d+5]=c[2]}this.spokes.geometry.attributes.position.needsUpdate=!0,this.spokes.geometry.attributes.color.needsUpdate=!0,this.spokes.geometry.computeBoundingSphere()}updateSliceMeshes(e,t,n){for(const s of this.sliceMeshes)s.visible=!1;if(!(e.kind!=="surface"||n.sliceCount<=0))for(let s=1;s<=n.sliceCount;s++){const r=-1+2*(s/(n.sliceCount+1)),o=this.sliceMeshes[s-1];if(!o)break;const a=o.geometry.attributes.position.array;ua(a,e,r,t),o.geometry.attributes.position.needsUpdate=!0,o.geometry.computeBoundingSphere(),o.visible=!0}}updateSliceLines(e,t,n){if(!this.sliceLines||e.kind!=="polytope"||(this.sliceLines.visible=n.sliceCount>0,n.sliceCount<=0))return;const s=this.sliceLines.geometry.attributes.position.array,r=this.sliceLines.geometry.attributes.color.array;let o=0;for(let a=1;a<=n.sliceCount;a++){const c=-1+2*(a/(n.sliceCount+1)),l=uv((c+1)/2),u=[];for(let h=0;h<8;h++){const d=h*3;u.push(hv([e.positions[d],e.positions[d+1],e.positions[d+2],c],t))}for(const[h,d]of Xs){const f=u[h],g=u[d],_=o*6;s[_]=f[0],s[_+1]=f[1],s[_+2]=f[2],s[_+3]=g[0],s[_+4]=g[1],s[_+5]=g[2],r[_]=r[_+3]=l[0],r[_+1]=r[_+4]=l[1],r[_+2]=r[_+5]=l[2],o++}}this.sliceLines.geometry.setDrawRange(0,o*2),this.sliceLines.geometry.attributes.position.needsUpdate=!0,this.sliceLines.geometry.attributes.color.needsUpdate=!0,this.sliceLines.geometry.computeBoundingSphere()}updatePoints(e,t){if(!this.points||e.kind!=="polytope")return;const n=this.points.geometry.attributes.position.array,s=this.points.geometry.attributes.color.array;let r=0;for(const o of[-1,1]){const a=ji(o);for(let c=0;c<8;c++){const l=c*3;Jn(e.positions[l],e.positions[l+1],e.positions[l+2],o,t,bt);const u=r*3;n[u]=bt[0],n[u+1]=bt[1],n[u+2]=bt[2],s[u]=a[0],s[u+1]=a[1],s[u+2]=a[2],r++}}this.points.geometry.attributes.position.needsUpdate=!0,this.points.geometry.attributes.color.needsUpdate=!0,this.points.geometry.computeBoundingSphere()}clear(){const e=[this.capNeg,this.capPos,this.cage,this.spokes,this.sliceLines,this.points,...this.sliceMeshes];for(const t of e){if(!t)continue;this.parent.remove(t),t.geometry.dispose();const n=t.material;if(Array.isArray(n))for(const s of n)s.dispose();else n.dispose()}this.capNeg=null,this.capPos=null,this.cage=null,this.spokes=null,this.sliceLines=null,this.points=null,this.sliceMeshes=[],this.materials.length=0,this.fades.length=0,this.mesh=null}}const Uc=["xy","xz","yz","xw","yw","zw"],gv=Math.PI/18,_v=150,xv=100,vv=.5,Uu=.0032,Mv=1e-6,yv=72,Sv=Math.PI*2/1e3,Ev=1600,Kt={xy:0,xz:0,yz:0,xw:0,yw:0,zw:0},on={xy:0,xz:0,yz:0,xw:0,yw:0,zw:0},ps={xy:0,xz:0,yz:0,xw:0,yw:0,zw:0},rr={xy:0,xz:0,yz:0,xw:0,yw:0,zw:0};let Nc=!1,ha=0,Bh=0;function Tv(i,e){return 1-Math.exp(-i/e)}function Vs(i){for(const e of Uc)i[e]=0}function zh(){Vs(Kt),Vs(on),Vs(ps),Vs(rr)}function bv(i){for(const e of Uc)i[e]+=on[e],on[e]=0,Kt[e]=0,ps[e]=0,rr[e]=0;Nc=!0}function Av(){Nc=!1,performance.now()-Bh>yv&&Vs(Kt)}function ms(i,e,t){if(t<4||t>48)return;const n=Kt[i]*.35+e/t*vv*.65;Kt[i]=Math.max(-Uu,Math.min(Uu,n)),Bh=performance.now()}function wv(i,e){on[i]+=e*gv,Kt[i]=0}function Rv(i,e){on[i]=0,Kt[i]=0,ps[i]=e<0?-1:1,rr[i]=performance.now()}function Nu(i){ps[i]=0,rr[i]=0}function Cv(i){const e=performance.now(),t=Math.min(48,ha?e-ha:16);ha=e;let n=!1;for(const s of Uc){if(ps[s]!==0){const r=Math.max(0,e-rr[s]),o=Math.min(1,r/Ev),a=Sv*o*o;i[s]+=ps[s]*a*t,n=!0;continue}if(on[s]!==0){const r=on[s]*Tv(t,xv);i[s]+=r,on[s]-=r,Math.abs(on[s])<1e-5&&(i[s]+=on[s],on[s]=0),n=!0}!Nc&&Kt[s]!==0&&(i[s]+=Kt[s]*t,Kt[s]*=Math.exp(-t/_v),Math.abs(Kt[s])<Mv&&(Kt[s]=0),n=!0)}return n}const ae={mode:"xw-yw",invert:!1,locked:!1,listening:!1,useGyro:!1,xz:0,yz:0,targetXz:0,targetYz:0,lastMotionTime:0,prevBeta:null,prevGamma:null,prevAlpha:null,prevRoll:null,prevPitch:null};function oo(){return ae.mode!=="off"}function Fc(){ae.locked=!1,ae.xz=0,ae.yz=0,ae.targetXz=0,ae.targetYz=0,Oc()}function Oc(){ae.prevBeta=null,ae.prevGamma=null,ae.prevAlpha=null,ae.prevRoll=null,ae.prevPitch=null,ae.lastMotionTime=0}function Pv(){ae.locked||ae.mode!=="off"&&(ae.locked=!0,ae.targetXz=ae.xz,ae.targetYz=ae.yz)}function Lv(){ae.locked&&(ae.targetXz=ae.xz,ae.targetYz=ae.yz,Oc(),ae.locked=!1)}function kh(i){ae.mode=i,Fc()}function qs(i){return Math.atan2(Math.sin(i),Math.cos(i))}function Iv(){if(screen.orientation&&Number.isFinite(screen.orientation.angle))return screen.orientation.angle;const i=window.orientation;return Number.isFinite(i)?i:0}function Hh(i,e){let t=i,n=e;ae.mode==="xyz"&&(t=-t,n=-n),ae.invert&&(t=-t,n=-n);const s=-Ei.degToRad(Iv()),r=Math.cos(s),o=Math.sin(s);ae.targetXz+=t*r-n*o,ae.targetYz+=t*o+n*r}function Dv(i,e,t){if(!Number.isFinite(i)||!Number.isFinite(e))return;if(ae.prevBeta==null){ae.prevBeta=i,ae.prevGamma=e,ae.prevAlpha=t;return}const n=qs(Ei.degToRad(i-ae.prevBeta)),s=qs(Ei.degToRad(e-ae.prevGamma)),r=Number.isFinite(t)&&Number.isFinite(ae.prevAlpha)?qs(Ei.degToRad(t-ae.prevAlpha)):0;ae.prevBeta=i,ae.prevGamma=e,ae.prevAlpha=t,!ae.locked&&(Math.abs(n)>1||Math.abs(s)>1||Math.abs(r)>1||Hh(s+r,-n))}function Uv(i,e,t){const n=Math.hypot(i,e,t);if(n<4)return;const s=Math.atan2(i/n,Math.max(.12,-e/n)),r=Math.atan2(t/n,Math.max(.12,-e/n));if(ae.prevRoll==null){ae.prevRoll=s,ae.prevPitch=r;return}const o=qs(s-ae.prevRoll),a=qs(r-ae.prevPitch);ae.prevRoll=s,ae.prevPitch=r,!ae.locked&&(Math.abs(o)>1||Math.abs(a)>1||Hh(o,-a))}function gs(i){const e=globalThis[i];return typeof e=="function"?e:void 0}function Fu(i){i.beta==null||i.gamma==null||(ae.useGyro=!1,Dv(i.beta,i.gamma,i.alpha))}function Nv(i){if(!ae.useGyro&&ae.prevBeta!=null)return;const e=i.accelerationIncludingGravity;!e||e.x==null||e.y==null||e.z==null||Uv(e.x,e.y,e.z)}const rc=new Set;function Fv(i){return rc.add(i),()=>rc.delete(i)}function oc(){for(const i of rc)i()}function Vh(){ae.listening||(ae.listening=!0,window.addEventListener("deviceorientation",Fu,!0),window.addEventListener("deviceorientationabsolute",Fu,!0),window.addEventListener("devicemotion",Nv,!0),window.addEventListener("orientationchange",Oc),oc())}function Ov(){return!!(gs("DeviceOrientationEvent")||gs("DeviceMotionEvent"))}function Ou(){return!window.isSecureContext&&!Ov()}function Bv(){if(location.protocol==="https:")return location.href;const i=location.port&&location.port!=="80"?`:${location.port}`:"";return`https://${location.hostname}${i}${location.pathname}${location.search}${location.hash}`}function Bc(){const i=gs("DeviceOrientationEvent"),e=gs("DeviceMotionEvent");return typeof i?.requestPermission=="function"||typeof e?.requestPermission=="function"}async function Jr(){if(!oo())return!1;if(ae.listening)return!0;if(Bc())try{const i=gs("DeviceMotionEvent"),e=gs("DeviceOrientationEvent"),t=[i?.requestPermission?.bind(i),e?.requestPermission?.bind(e)].filter(s=>typeof s=="function");if(!(await Promise.all(t.map(s=>s()))).some(s=>s==="granted"))return oc(),!1}catch{return oc(),!1}return Vh(),!0}function zv(){ae.xz+=(ae.targetXz-ae.xz)*.18,ae.yz+=(ae.targetYz-ae.yz)*.18}const zc="4d-viewer",kv=new Set(["mono","cross","parallel"]),Hv=new Set(["tesseract","matryoshka"]),Vv=new Set(["off","xyz","xw-yw","zw"]),Gv=["xy","xz","yz","xw","yw","zw"];function Zn(i,e,t){return Math.min(t,Math.max(e,i))}function Rn(i){return typeof i=="number"&&Number.isFinite(i)?i:null}function Wv(){const i=new URLSearchParams(window.location.search);if(i.get("reset")!=="1")return!1;try{localStorage.removeItem(zc)}catch{}i.delete("reset");const e=i.toString();return history.replaceState(null,"",`${location.pathname}${e?`?${e}`:""}${location.hash}`),!0}function Xv(){try{const i=localStorage.getItem(zc);if(!i)return null;const e=JSON.parse(i);return!e||typeof e!="object"?null:qv(e)}catch{return null}}function qv(i){const e={};typeof i.viewMode=="string"&&kv.has(i.viewMode)&&(e.viewMode=i.viewMode),typeof i.objectId=="string"&&Hv.has(i.objectId)&&(e.objectId=i.objectId);const t=Rn(i.objectSize);t!==null&&(e.objectSize=Zn(t,.4,2.2));const n=Rn(i.eyeSep);n!==null&&(e.eyeSep=Zn(n,.12,1.4));const s=Rn(i.stereoGap);s!==null&&(e.stereoGap=Zn(s,0,1));const r=Rn(i.projectionDistance);r!==null&&(e.projectionDistance=Zn(r,2.2,10));const o=Rn(i.sliceCount);o!==null&&(e.sliceCount=Math.round(Zn(o,0,6)));const a=Rn(i.meshOpacity);if(a!==null&&(e.meshOpacity=Zn(a,0,1)),i.angles&&typeof i.angles=="object"){const u=i.angles,h={};let d=!0;for(const f of Gv){const g=Rn(u[f]);if(g===null){d=!1;break}h[f]=g}d&&(e.angles=h)}typeof i.tiltMode=="string"&&Vv.has(i.tiltMode)&&(e.tiltMode=i.tiltMode),typeof i.tiltInvert=="boolean"&&(e.tiltInvert=i.tiltInvert);const c=Rn(i.parallaxPan);c!==null&&(e.parallaxPan=Zn(c,0,4));const l=Rn(i.parallaxZoom);return l!==null&&(e.parallaxZoom=Zn(l,0,2)),e}let ao=null,co=0;function jv(i){ao=i,window.addEventListener("pagehide",ac),document.addEventListener("visibilitychange",()=>{document.hidden&&ac()})}function mt(){ao&&(window.clearTimeout(co),co=window.setTimeout(ac,250))}function ac(){if(ao){window.clearTimeout(co),co=0;try{localStorage.setItem(zc,JSON.stringify(ao()))}catch{}}}const Yv=280,Kv=["xz","yz","xw","yw","zw"];function Bu(i){return!!(i&&Kv.includes(i))}function Zv(i){const e=(i+Math.PI)/(Math.PI*2);return(e-Math.floor(e))*Math.PI*2-Math.PI}function $v(i){return`${Math.round(Zv(i)*180/Math.PI)}°`}function Jv(i,e){const t=document.getElementById("angleCoords");if(!t)throw new Error("#angleCoords missing");const n=new Map;for(const a of t.querySelectorAll(".coord")){const c=a.dataset.plane,l=a.querySelector(".value");!Bu(c)||!l||n.set(c,l)}function s(a){const c=i[a],{mode:l,xz:u,yz:h}=ae;if(l==="xyz"){if(a==="xz")return c+u;if(a==="yz")return c+h}else if(l==="xw-yw"){if(a==="xw")return c+u;if(a==="yw")return c+h}else if(l==="zw"&&a==="zw")return c+h;return c}function r(){for(const[a,c]of n)c.textContent=$v(s(a))}function o(a,c){wv(a,c),r()}for(const a of t.querySelectorAll("button[data-dir]")){let c=function(){if(!f)return;const _=performance.now()-g;f=!1,Nu(d),_<Yv&&o(d,h)};const u=a.closest(".coord")?.dataset.plane,h=Number(a.dataset.dir);if(!Bu(u)||!h)continue;const d=u;let f=!1,g=0;a.addEventListener("pointerdown",_=>{if(!(_.button!==0&&_.pointerType==="mouse")){_.preventDefault(),f&&(f=!1,Nu(d)),f=!0,g=performance.now(),Rv(d,h);try{a.setPointerCapture(_.pointerId)}catch{}}}),a.addEventListener("pointerup",c),a.addEventListener("pointercancel",c),a.addEventListener("lostpointercapture",c)}return document.getElementById("angle-reset")?.addEventListener("click",a=>{a.stopPropagation(),zh(),Object.assign(i,Dc(e())),Fc(),r(),mt()}),r(),{sync:r}}const da=[{v:[1,0,0,0],label:"X",color:16731501},{v:[0,1,0,0],label:"Y",color:4054148},{v:[0,0,1,0],label:"Z",color:5082623},{v:[0,0,0,1],label:"W",color:16106818}];function Qv(i,e){const t=document.createElement("canvas");t.width=64,t.height=64;const n=t.getContext("2d");if(!n)throw new Error("2D canvas unavailable");n.font="700 38px sans-serif",n.textAlign="center",n.textBaseline="middle",n.fillStyle=`#${e.toString(16).padStart(6,"0")}`,n.fillText(i,32,34);const s=new Rh(t);return new b0(new Eh({map:s,transparent:!0,depthWrite:!1}))}function eM(i){const e=new Float32Array(99);for(let n=0;n<=32;n++){const s=n/32*Math.PI*2;e[n*3]=Math.cos(s),e[n*3+1]=Math.sin(s)}const t=new vt;return t.setAttribute("position",new Bt(e,3)),new ir(t,new Ti({color:i,transparent:!0,depthWrite:!1}))}class or{group=new Fn;arrows=[];labels=[];rings=[];dir=new C;constructor(){this.group.renderOrder=2;for(const e of da){const t=new lx(new C(1,0,0),new C(0,0,0),1,new Ae(e.color),.22,.14),n=eM(e.color),s=Qv(e.label,e.color);n.visible=!1,this.group.add(t,n,s),this.arrows.push(t),this.rings.push(n),this.labels.push(s)}}static layout(e){const t=Math.max(.16,e*.26),n=e*.16,s=-(e+t+n);return{scale:t,originY:s,reach:Math.abs(s)+t}}update(e,t){const{scale:n,originY:s}=or.layout(t);this.group.position.set(0,s,0);for(let r=0;r<da.length;r++){const o=vo(da[r].v,e.angles,e.orbit),a=Math.hypot(o[0],o[1]);this.dir.set(o[0],o[1],o[2]);const c=this.dir.length(),l=this.arrows[r],u=this.rings[r],h=this.labels[r],d=n*.42;if(h.scale.set(d,d,d),c>.06?(l.visible=!0,l.setDirection(this.dir.normalize()),l.setLength(n*Math.min(1,.45+c),n*.22,n*.13),h.position.set(o[0],o[1],o[2]).multiplyScalar(n*1.2/Math.max(c,.06))):(l.visible=!1,h.position.set(.18*n,.16*n,0)),a<.55){const f=(.14+(.55-a)*.32)*n;u.visible=!0,u.scale.setScalar(f);const g=u.material;g.opacity=o[2]>=0?.95:.4}else u.visible=!1}}}function rn(i){return Number(i).toFixed(2)}function tM(){return window.matchMedia("(max-width: 900px), (max-height: 520px)").matches}let Gh=null;function _i(){Gh?.()}function nM(i,e){const t=document.getElementById("stereoHint"),n=document.getElementById("eyeSepSlider"),s=document.getElementById("stereoGapSlider"),r=document.getElementById("focusSlider"),o=document.getElementById("cubeSizeSlider"),a=document.getElementById("opacitySlider"),c=document.getElementById("eyeSepValue"),l=document.getElementById("stereoGapValue"),u=document.getElementById("focusValue"),h=document.getElementById("cubeSizeValue"),d=document.getElementById("opacityValue"),f=document.getElementById("sliceCountSlider"),g=document.getElementById("sliceCountValue"),_=document.getElementById("sliceTicks"),m=document.getElementById("menu-toggle"),p=document.getElementById("menu-backdrop"),b=document.getElementById("ui-container"),E=document.getElementById("object-bar"),y=document.getElementById("tiltModeSelect"),N=document.getElementById("tiltInvert"),w=document.getElementById("tiltInvertGroup"),A=document.getElementById("tilt-banner"),P=document.getElementById("objectCredit");if(!t||!c||!l||!u||!h||!d||!g)throw new Error("Menu DOM is incomplete");const S=t,M=g,R=h;function k(Z){E?.querySelectorAll("button[data-object]").forEach(ne=>{ne.classList.toggle("is-active",ne.dataset.object===Z)})}k(i.objectId);function O(Z){b.classList.toggle("is-open",Z),m.classList.toggle("is-open",Z),p.classList.toggle("is-on",Z),m.setAttribute("aria-expanded",String(Z))}Gh=()=>O(!1);function G(Z){i.viewMode=Z,document.body.classList.toggle("is-mono",Z==="mono"),document.querySelectorAll("#mode-bar button").forEach(ne=>{ne.classList.toggle("is-active",ne.dataset.mode===Z)}),S.textContent=Z==="cross"?"Cross your eyes until the two images merge into one.":Z==="parallel"?"Look through the screen, as if into the distance — left eye on the left image.":"Single view.",mt()}function j(){if(A){if(!oo()||ae.listening){A.hidden=!0;return}if(Ou()){A.hidden=!1,A.textContent="Tilt needs HTTPS — tap to open";return}if(Bc()){A.hidden=!1,A.textContent="Tap to allow device tilt";return}A.hidden=!0}}function W(){y.value=ae.mode,N.checked=ae.invert,w.style.display=oo()?"":"none",j()}function $(){f.value=String(i.display.sliceCount),M.textContent=String(i.display.sliceCount)}function H(Z){Z&&(k(Z.id),P&&(P.hidden=Z.id!=="matryoshka"),o.value=String(i.objectSize),R.textContent=rn(i.objectSize),$())}if(A?.addEventListener("click",Z=>{if(Z.stopPropagation(),Ou()){location.assign(Bv());return}Jr()}),m.addEventListener("click",Z=>{Z.stopPropagation(),Jr(),O(!b.classList.contains("is-open"))}),p.addEventListener("click",()=>O(!1)),document.getElementById("mode-bar")?.addEventListener("click",Z=>{const ne=Z.target.closest("button[data-mode]");ne&&G(ne.dataset.mode)}),E?.addEventListener("click",Z=>{const ne=Z.target.closest("button[data-object]");if(!ne)return;const xe=ne.dataset.object;Oh.some(Oe=>Oe.id===xe)&&e(xe)}),y.addEventListener("change",()=>{kh(y.value),W(),Jr(),mt()}),N.addEventListener("change",()=>{ae.invert=N.checked,mt()}),f.addEventListener("input",()=>{i.display.sliceCount=Number(f.value),M.textContent=String(i.display.sliceCount),mt()}),o.addEventListener("input",()=>{i.objectSize=Number(o.value),R.textContent=rn(i.objectSize),mt()}),a.addEventListener("input",()=>{i.display.meshOpacity=Number(a.value),d.textContent=rn(i.display.meshOpacity),mt()}),n.addEventListener("input",()=>{i.eyeSep=Number(n.value),c.textContent=rn(i.eyeSep),mt()}),s.addEventListener("input",()=>{i.stereoGap=Number(s.value),l.textContent=rn(i.stereoGap),mt()}),r.addEventListener("input",()=>{i.projectionDistance=Number(r.value),u.textContent=rn(i.projectionDistance),mt()}),_&&_.childElementCount===0)for(let Z=0;Z<=$r;Z++){const ne=document.createElement("i");Z%3===0&&ne.classList.add("is-major"),_.append(ne)}return a.value=String(i.display.meshOpacity),d.textContent=rn(i.display.meshOpacity),s.value=String(i.stereoGap),l.textContent=rn(i.stereoGap),n.value=String(i.eyeSep),c.textContent=rn(i.eyeSep),r.value=String(i.projectionDistance),u.textContent=rn(i.projectionDistance),o.value=String(i.objectSize),R.textContent=rn(i.objectSize),$(),O(!tM()),W(),Fv(j),H(null),G(i.viewMode),H}function zu(){return window.matchMedia("(max-width: 900px), (max-height: 520px)").matches}function Yi(i){return i.target instanceof Element&&!!(i.target.closest("#ui-container")||i.target.closest("#chrome-center")||i.target.closest("#camera-toggle")||i.target.closest("#face-preview")||i.target.closest("#menu-toggle")||i.target.closest("#menu-backdrop")||i.target.closest("#axes-hud"))}function iM(i,e,t,n){const s=e*ro,r=-t*ro;i.xz+=s,i.yz+=r,ms("xz",s,n),ms("yz",r,n),mt()}function ku(i,e,t,n){const s=e*ro,r=t*ro;i.xw+=s,i.yw+=r,ms("xw",s,n),ms("yw",r,n),mt()}function sM(i,e){const t=new Map;let n=null,s=0,r=1,o=0;window.addEventListener("selectstart",l=>{l.target instanceof HTMLInputElement||l.target instanceof HTMLTextAreaElement||l.preventDefault()}),window.addEventListener("contextmenu",l=>{Yi(l)||l.preventDefault()});function a(){const l=[...t.values()];return l.length<2?null:{mid:{x:(l[0].x+l[1].x)/2,y:(l[0].y+l[1].y)/2},dist:Math.hypot(l[0].x-l[1].x,l[0].y-l[1].y)}}window.addEventListener("pointerdown",l=>{if(Yi(l)||l.pointerType==="mouse"&&l.button!==0)return;if(Jr(),l.preventDefault(),t.size===0&&(bv(i),o=0),t.set(l.pointerId,{x:l.clientX,y:l.clientY}),e.classList.add("is-dragging"),l.target===e)try{e.setPointerCapture(l.pointerId)}catch{}const u=a();u&&(n=u.mid,s=u.dist),Pv()}),window.addEventListener("pointermove",l=>{if(!t.has(l.pointerId))return;const u=t.get(l.pointerId);if(!u)return;t.set(l.pointerId,{x:l.clientX,y:l.clientY});const h=performance.now(),d=o?Math.min(48,h-o):16;if(o=h,t.size>=2){const _=a();if(!_)return;if(n&&(ku(i,_.mid.x-n.x,_.mid.y-n.y,d),_i()),!zu()&&s>0){const m=(_.dist-s)*.012;i.zw+=m,ms("zw",m,d),_i(),mt()}n=_.mid,s=_.dist;return}const f=l.clientX-u.x,g=l.clientY-u.y;f===0&&g===0||(l.shiftKey?ku(i,f,g,d):iM(i,f,g,d),_i())});function c(l){t.has(l.pointerId)&&(t.delete(l.pointerId),t.size<2&&(n=null,s=0),t.size===0&&(e.classList.remove("is-dragging"),Lv(),Av()))}window.addEventListener("pointerup",c),window.addEventListener("pointercancel",c),window.addEventListener("pointerleave",l=>{l.pointerType==="mouse"&&c(l)}),window.addEventListener("wheel",l=>{if(Yi(l))return;l.preventDefault();const u=l.deltaMode===1?16:l.deltaMode===2?window.innerHeight:1,h=l.deltaX*u,d=l.deltaY*u;if(l.ctrlKey){r===1&&(i.zw+=d*Eu,_i(),mt());return}if(l.shiftKey){i.zw+=d*Eu,_i(),mt();return}i.xw+=h*Tu,i.yw+=d*Tu,_i(),mt()},{passive:!1}),window.addEventListener("gesturestart",l=>{Yi(l)||(l.preventDefault(),r=l.scale||1)}),window.addEventListener("gesturechange",l=>{if(Yi(l))return;l.preventDefault();const u=l.scale||1;if(!zu()){const h=(u-r)*1.4,d=performance.now(),f=o?Math.min(48,d-o):16;o=d,i.zw+=h,ms("zw",h,f),_i(),mt()}r=u}),window.addEventListener("gestureend",l=>{r=1,!Yi(l)&&l.preventDefault()})}const rM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm",oM="https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",aM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/+esm",cM=.85,lM=.64,uM=.86,hM=1.18,Hu=180,dM=560,kr=260,cc="Allow camera for head parallax",Qn="Camera feed is local only",fM=1.6,pM=1,Ce={nx:0,ny:0,z:1,targetNx:0,targetNy:0,targetZ:1,hasFace:!1,restSize:0,sizeEma:0,lastFaceAt:0};let lo=null,ut=null,Qs=null,Jt=!1,uo=0,lc=0,Qr=0,fa=0,Vu=0,fn=null,Mt=null,pn=0,er=fM,Mo=pM,$n=null,pa=null,eo=-1;function _s(){return window.matchMedia("(min-width: 901px) and (min-height: 521px)").matches}function Wh(){return document.getElementById("camera-toggle")}function Xh(){return document.getElementById("parallax-banner")}function mM(){return document.getElementById("face-preview")}function gM(){return document.getElementById("face-preview-canvas")}function _M(){return document.getElementById("face-preview-close")}function In(i,e,t,n){return i+(e-i)*(1-Math.exp(-t/n))}function ei(i,e,t=!1){const n=Wh(),s=Xh();if(!n)return;const r=n.querySelector("[data-title]"),o=n.querySelector("[data-note]");r&&(r.textContent=i),o&&e!==void 0&&(o.textContent=e),s?.setAttribute("aria-label",i),n.hidden=!_s(),n.classList.toggle("is-on",Jt),n.classList.toggle("is-tip-on",t&&_s()&&!Jt)}function ho(i){const e=mM();e&&(e.hidden=!i||!_s())}async function xM(){const e=await new Function("u","return import(u)")(aM),t=await e.FilesetResolver.forVisionTasks(rM);return e.FaceDetector.createFromOptions(t,{baseOptions:{modelAssetPath:oM,delegate:"CPU"},runningMode:"VIDEO",minDetectionConfidence:.3,minSuppressionThreshold:.3})}function vM(i){const e=i.videoWidth,t=i.videoHeight;if(e<2||t<2)return null;const s=Math.min(1,640/e),r=Math.max(2,Math.round(e*s)),o=Math.max(2,Math.round(t*s));return $n||($n=document.createElement("canvas"),pa=$n.getContext("2d",{willReadFrequently:!0})),pa?($n.width!==r&&($n.width=r),$n.height!==o&&($n.height=o),pa.drawImage(i,0,0,r,o),$n):null}function MM(i,e){if(!Qs||i.readyState<2)return null;const t=vM(i);if(!t)return null;const n=e<=eo?eo+1:e;eo=n;try{const r=Qs.detectForVideo(t,n).detections[0]?.boundingBox;if(!r)return null;const o=yM({x:r.originX,y:r.originY,w:r.width,h:r.height},t.width,t.height);return{x:o.x*(i.videoWidth/t.width),y:o.y*(i.videoHeight/t.height),w:o.w*(i.videoWidth/t.width),h:o.h*(i.videoHeight/t.height)}}catch(s){return console.warn("Face detect failed",s),null}}function yM(i,e,t){return i.w<=1.5&&i.h<=1.5?{x:i.x*e,y:i.y*t,w:i.w*e,h:i.h*t}:i}function SM(i,e,t){const n=performance.now();if(!i||e<2||t<2){n-Ce.lastFaceAt>350&&(fn=null,Ce.hasFace=!1,Ce.targetNx=0,Ce.targetNy=0,Ce.targetZ=1);return}fn=i,Ce.hasFace=!0,Ce.lastFaceAt=n;const s=i.x+i.w*.5,r=i.y+i.h*.5,o=(.5-s/e)*2,a=(r/t-.5)*2,c=i.w/e;Ce.sizeEma=Ce.sizeEma<=0?c:Ce.sizeEma*.9+c*.1,Ce.restSize<=0?(Ce.restSize=Ce.sizeEma,Vu=n):n-Vu>800&&(Ce.restSize+=(Ce.sizeEma-Ce.restSize)*.004);const l=Math.min(hM,Math.max(uM,Ce.restSize/Math.max(.04,Ce.sizeEma)));Ce.targetNx=Math.min(1,Math.max(-1,o)),Ce.targetNy=Math.min(1,Math.max(-1,a)),Ce.targetZ=l}function EM(i){if(fn){Mt?(Mt.x=In(Mt.x,fn.x,i,kr),Mt.y=In(Mt.y,fn.y,i,kr),Mt.w=In(Mt.w,fn.w,i,kr),Mt.h=In(Mt.h,fn.h,i,kr)):Mt={...fn},pn=In(pn,1,i,90);return}pn=In(pn,0,i,140),pn<.03&&(Mt=null,pn=0)}function TM(){const i=gM(),e=ut;if(!i||!e||e.readyState<2)return;const t=i.getContext("2d");if(!t)return;const n=i.width,s=i.height;if(t.save(),t.translate(n,0),t.scale(-1,1),t.drawImage(e,0,0,n,s),t.fillStyle="rgba(0, 0, 0, 0.55)",t.fillRect(0,0,n,s),t.restore(),t.strokeStyle="rgba(200, 200, 200, 0.85)",t.lineWidth=2,t.strokeRect(3,3,n-6,s-6),Mt&&e.videoWidth>0&&pn>.03){const r=n/e.videoWidth,o=s/e.videoHeight,a=n-(Mt.x+Mt.w)*r,c=Mt.y*o;t.globalAlpha=pn,t.strokeStyle="#cc9690",t.lineWidth=2,t.strokeRect(a,c,Mt.w*r,Mt.h*o),t.globalAlpha=1}}function qh(i){if(!Jt||!ut)return;if(uo=requestAnimationFrame(qh),!_s()){fo();return}const e=Math.min(50,Qr?i-Qr:16);Qr=i,i-lc>=45&&(lc=i,SM(MM(ut,i),ut.videoWidth,ut.videoHeight)),EM(e),TM()}async function bM(){if(!(Jt||!_s())){if(!window.isSecureContext){ei("Parallax needs HTTPS",Qn,!0);return}if(!navigator.mediaDevices?.getUserMedia){ei("Camera not available",Qn,!0);return}ei("Starting camera…",Qn,!0);try{lo=await navigator.mediaDevices.getUserMedia({audio:!1,video:{facingMode:"user",width:{ideal:640},height:{ideal:480}}})}catch{ei("Permission denied",Qn,!0);return}ut=document.createElement("video"),ut.className="face-track-video",ut.muted=!0,ut.playsInline=!0,ut.autoplay=!0,ut.setAttribute("playsinline",""),ut.setAttribute("webkit-playsinline",""),ut.srcObject=lo,document.body.appendChild(ut),await ut.play().catch(()=>{}),ut.readyState<2&&await new Promise(i=>{ut?.addEventListener("loadeddata",()=>i(),{once:!0})});try{Qs=await xM()}catch(i){console.error(i),jh(),ei("Face tracking failed to load",Qn,!0);return}Jt=!0,Ce.restSize=0,Ce.sizeEma=0,fn=null,Mt=null,pn=0,Qr=0,ei(cc,Qn),ho(!0),lc=0,uo=requestAnimationFrame(qh)}}function jh(){lo?.getTracks().forEach(i=>i.stop()),lo=null,ut&&(ut.srcObject=null,ut.remove(),ut=null),Qs?.close?.(),Qs=null,eo=-1}async function fo(){Jt=!1,cancelAnimationFrame(uo),uo=0,jh(),Ce.hasFace=!1,Ce.targetNx=0,Ce.targetNy=0,Ce.targetZ=1,Ce.restSize=0,Ce.sizeEma=0,fn=null,Mt=null,pn=0,ho(!1),uc()}function uc(){if(!_s()){const i=Wh();i&&(i.hidden=!0),ho(!1),Jt&&fo();return}if(Jt){ei(cc,Qn),ho(!0);return}ei(cc,Qn)}function Gu(i){return Number(i).toFixed(2)}function AM(){const i=document.getElementById("parallaxPanSlider"),e=document.getElementById("parallaxZoomSlider"),t=document.getElementById("parallaxPanValue"),n=document.getElementById("parallaxZoomValue");if(!i||!e||!t||!n)return;const s=(o=!0)=>{const a=Number(i.value);Yh(a),t.textContent=Gu(a),o&&mt()},r=(o=!0)=>{const a=Number(e.value);Kh(a),n.textContent=Gu(a),o&&mt()};i.value=String(er),e.value=String(Mo),s(!1),r(!1),i.addEventListener("input",()=>s()),e.addEventListener("input",()=>r())}function wM(){Xh()?.addEventListener("click",e=>{e.stopPropagation(),Jt?fo():bM()}),_M()?.addEventListener("click",e=>{e.stopPropagation(),fo()}),AM(),window.addEventListener("resize",uc),document.addEventListener("visibilitychange",()=>{document.hidden&&Jt?ut?.pause():Jt&&ut?.play().catch(()=>{})}),uc()}function RM(i,e){const t=performance.now(),n=Math.min(50,fa?t-fa:16);fa=t,Ce.nx=In(Ce.nx,Ce.targetNx,n,Hu),Ce.ny=In(Ce.ny,Ce.targetNy,n,Hu),Ce.z=In(Ce.z,Ce.targetZ,n,dM);const s=Math.abs(Ce.nx)+Math.abs(Ce.ny)+Math.abs(Ce.z-1)<.004;if(!Jt&&s)return;const r=i.position.z;i.position.x=Ce.nx*e*cM*er,i.position.y=-Ce.ny*e*lM*er,i.position.z=r*(1+(Ce.z-1)*Mo),i.lookAt(0,0,0),i.focus=i.position.z}function CM(){return er}function PM(){return Mo}function Yh(i){er=Math.max(0,i)}function Kh(i){Mo=Math.max(0,i)}function LM(){const i=new URLSearchParams(window.location.search).get("object")?.trim().toLowerCase();return Oh.some(e=>e.id===i)?i:null}Wv();const dt=Xv(),hc=LM(),js=hc??dt?.objectId??"matryoshka",dc=!!(dt&&(!hc||hc===dt.objectId)),Es={...dc&&dt?.angles?dt.angles:Dc(js)},st={viewMode:dt?.viewMode??"mono",objectSize:dc&&dt?.objectSize!==void 0?dt.objectSize:Dh(js),eyeSep:dt?.eyeSep??1,stereoGap:dt?.stereoGap??hx,projectionDistance:dt?.projectionDistance??3,objectId:js,display:{fillCaps:!0,showCage:!1,sliceCount:dc&&dt?.sliceCount!==void 0?dt.sliceCount:Ih(js),meshOpacity:dt?.meshOpacity??px}};dt?.tiltMode&&kh(dt.tiltMode);dt?.tiltInvert!==void 0&&(ae.invert=dt.tiltInvert);dt?.parallaxPan!==void 0&&Yh(dt.parallaxPan);dt?.parallaxZoom!==void 0&&Kh(dt.parallaxZoom);const kc=new T0,ft=new At(55,window.innerWidth/2/window.innerHeight,.1,500);ft.position.set(0,0,5.4);ft.lookAt(0,0,0);ft.focus=ft.position.z;const gt=new E0({antialias:window.devicePixelRatio<2,alpha:!1,failIfMajorPerformanceCaveat:!1});gt.setPixelRatio(Math.min(window.devicePixelRatio,2));gt.setSize(window.innerWidth,window.innerHeight);gt.setClearColor(0,1);gt.autoClear=!1;gt.domElement.classList.add("main-view");document.body.appendChild(gt.domElement);const Mi=new Q0;Mi.eyeSep=st.eyeSep;const yo=new Fn;kc.add(yo);const Zi=new mv(yo),Zh=new or;yo.add(Zh.group);const IM=Jv(Es,()=>st.objectId);function $h(){return{angles:Es,orbit:ae,projectionDistance:st.projectionDistance}}function Jh(){return{width:gt.domElement.clientWidth||window.innerWidth,height:gt.domElement.clientHeight||window.innerHeight}}function Qh(){const{width:i,height:e}=Jh(),t=Math.max(1,i/2);return{width:i,height:e,pane:t}}function ed(){const i=st.viewMode!=="mono",{width:e,height:t,pane:n}=Qh(),s=document.getElementById("stereo-split");s&&(s.style.left=`${n}px`);const r=Math.max(.08,i?n/t:e/t);ft.fov=55,ft.aspect=r;const o=Zi.extentRadius($h()),a=Math.max(o,or.layout(o).reach)*1.12/st.objectSize,c=Math.tan(Ei.degToRad(ft.fov*.5)),l=c*r,u=a/Math.min(c,l);ft.position.set(0,0,Number.isFinite(u)?Math.min(120,Math.max(1.4,u)):5.4),ft.lookAt(0,0,0),ft.focus=ft.position.z,ft.updateProjectionMatrix()}function Hc(){const i=gt.domElement;i.style.width="100%",i.style.height="100%";const e=i.clientWidth||window.innerWidth,t=i.clientHeight||window.innerHeight;gt.setPixelRatio(Math.min(window.devicePixelRatio,2)),gt.setSize(e,t,!1),ed()}function DM(i){const e=Math.tan(Ei.degToRad(ft.fov*.5)),t=Math.abs(ft.position.z)*e*ft.aspect,n=Math.min(.95,i/Math.max(1e-6,t));return Math.max(0,1-n-.02)}function Hr(i,e,t){const{height:n,pane:s}=Qh(),r=i?0:s,o=(1-st.stereoGap)*DM(t),a=e.projectionMatrix.elements,c=a[8];a[8]=c+(i?-1:1)*o,gt.setScissor(r,0,s,n),gt.setViewport(r,0,s,n),gt.render(kc,e),a[8]=c}function UM(){const i=$h();Zi.update(i,st.display);const e=Zi.extentRadius(i);Zh.update(i,e),ed(),RM(ft,e);const t=Math.max(e,or.layout(e).reach)*1.12/st.objectSize;yo.position.y=ux*t,Zi.setDepthFade(ft.position.z,e,st.display.meshOpacity);const n=Zi.projectedHalfWidth(i);if(gt.clear(),ft.focus=ft.position.z,st.viewMode==="mono"){const{width:s,height:r}=Jh();gt.setScissorTest(!1),gt.setViewport(0,0,s,r),gt.render(kc,ft);return}Mi.eyeSep=st.eyeSep*(ft.position.z/5.4),Mi.update(ft),gt.setScissorTest(!0),st.viewMode==="cross"?(Hr(!0,Mi.cameraR,n),Hr(!1,Mi.cameraL,n)):(Hr(!0,Mi.cameraL,n),Hr(!1,Mi.cameraR,n)),gt.setScissorTest(!1)}function NM(){return{viewMode:st.viewMode,objectId:st.objectId,objectSize:st.objectSize,eyeSep:st.eyeSep,stereoGap:st.stereoGap,projectionDistance:st.projectionDistance,sliceCount:st.display.sliceCount,meshOpacity:st.display.meshOpacity,angles:{...Es},tiltMode:ae.mode,tiltInvert:ae.invert,parallaxPan:CM(),parallaxZoom:PM()}}function td(){zv(),Cv(Es)&&mt(),UM(),IM.sync(),requestAnimationFrame(td)}let Vr=!1;async function Vc(i){if(Vr)return;const e=i!==st.objectId;Vr=!0,st.objectId=i,e&&(zh(),Object.assign(Es,Dc(i)),Fc(),st.display.sliceCount=Ih(i),st.objectSize=Dh(i));try{const t=await lv(i);Zi.setMesh(t,st.display),FM(t),mt()}catch(t){if(console.error(t),i!=="tesseract"){Vr=!1,await Vc("tesseract");return}}Vr=!1}const FM=nM(st,i=>{Vc(i)});sM(Es,gt.domElement);wM();jv(NM);window.addEventListener("resize",Hc);window.visualViewport?.addEventListener("resize",Hc);oo()&&!Bc()&&Vh();Hc();requestAnimationFrame(td);Vc(js);
