import { W, H, CELLS, type World } from './simulation';
import { roadField } from './road-field';
export type Camera = {
    x: number;
    y: number;
    scale: number;
};
const vertex = `#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0,1);}`;
const fragment = `#version 300 es
precision highp float;
in vec2 uv; out vec4 color;
uniform sampler2D terrain, roads;
uniform vec2 resolution, center;
uniform float scale, relief, mode, brush;
uniform vec2 pointer;
uniform int tool;
const vec2 size=vec2(240.,170.);
vec4 sampleField(sampler2D field, vec2 p) {
 vec2 q=clamp(p-.5,vec2(0),size-1.);vec2 a=floor(q),f=fract(q);
 return mix(mix(texelFetch(field,ivec2(a),0),texelFetch(field,ivec2(min(a+vec2(1,0),size-1.)),0),f.x),mix(texelFetch(field,ivec2(min(a+vec2(0,1),size-1.)),0),texelFetch(field,ivec2(min(a+1.,size-1.)),0),f.x),f.y);
}
float h(vec2 p){return sampleField(terrain,p).r;}
void main(){
 vec2 p=center+vec2((uv.x-.5)*resolution.x,(.5-uv.y)*resolution.y)/scale;
 bool outside=any(lessThan(p,vec2(0)))||any(greaterThan(p,size));
 float elevation=h(p), z=(elevation-.5)*relief+.5;
 vec3 low=vec3(.085,.17,.165), middle=vec3(.35,.43,.31), high=vec3(.76,.69,.46);
 vec3 ground=mix(low,middle,smoothstep(.08,.57,z)); ground=mix(ground,high,smoothstep(.5,.98,z));
 vec2 slope=vec2(h(p+vec2(1,0))-h(p-vec2(1,0)),h(p+vec2(0,1))-h(p-vec2(0,1)))*relief;
 float light=dot(normalize(vec3(-slope*20.,1.)),normalize(vec3(-.6,-.8,1.2)));
 ground*=.65+.55*light;
 float levels=z*24.;float line=abs(fract(levels-.5)-.5)/max(fwidth(levels),.001);
 float contour=1.-smoothstep(.3,1.1,line);
 float major=1.-smoothstep(.35,1.15,abs(fract(levels/4.-.5)-.5)/max(fwidth(levels/4.),.001));
 ground=mix(ground,vec3(.83,.86,.68),contour*.14+major*.2);
 float grain=fract(sin(dot(floor(p*scale),vec2(12.9898,78.233)))*43758.5453);
 ground+=(grain-.5)*.022;
 vec3 result=mode>1.5?vec3(.025,.055,.061)+ground*.07:ground;
 float traffic=texture(roads,p/size).r;
 if(mode<.5||mode>1.5){
  vec3 roadColor=mix(vec3(.73,.65,.37),vec3(1.,.88,.58),traffic);
  result=mix(result,roadColor,traffic*.83);
 }
 if(outside){float grid=step(.96,fract(p.x/10.))+step(.96,fract(p.y/10.));result=vec3(.055,.091,.087)+grid*.012;}
 if(tool>0&&!outside){float radius=brush;float ring=1.-smoothstep(.5/scale,1.5/scale,abs(length(p-pointer)-radius));result=mix(result,vec3(.95,.88,.67),ring*.8);}
 color=vec4(result,1);
}`;
const cityVertex = `#version 300 es
precision highp float;
in vec4 city;in float hover;
uniform vec2 resolution,center;uniform float scale;
out vec2 local;flat out float radius;flat out float selected;flat out float hovered;
const vec2 corners[6]=vec2[6](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(-1,1),vec2(1,-1),vec2(1,1));
void main(){radius=city.z*scale;selected=city.w;hovered=hover;local=corners[gl_VertexID]*(radius+7.);vec2 p=(city.xy-center)*scale+local;gl_Position=vec4(p.x/resolution.x*2.,-p.y/resolution.y*2.,0,1);}`;
const cityFragment = `#version 300 es
precision highp float;
in vec2 local;flat in float radius;flat in float selected;flat in float hovered;
out vec4 color;
void main(){
 float r=length(local),edge=abs(r-radius);
 float ring=1.-smoothstep(selected>.5?1.4:.8,selected>.5?2.3:1.6,edge);
 float fill=(1.-smoothstep(radius-1.,radius,r))*(selected>.5?.26:.16);
 float core=1.-smoothstep(1.2,2.2,r);
 vec3 ink=mix(vec3(.72,.91,.86),vec3(1.,.95,.77),max(selected,hovered));
 float handle=0.;if(selected>.5)handle=1.-smoothstep(2.4,3.6,min(length(local-vec2(radius,0)),length(local+vec2(radius,0))));
 float alpha=max(max(ring,fill),max(core,handle));if(alpha<.005)discard;color=vec4(ink,alpha);
}`;
export class Renderer {
    gl: WebGL2RenderingContext;
    terrainProgram: WebGLProgram;
    cityProgram: WebGLProgram;
    terrainTexture: WebGLTexture;
    roadTexture: WebGLTexture;
    density = new Float32Array(CELLS);
    roadPixels = new Uint8Array(CELLS);
    fieldTime = -1;
    fieldRevision = -1;
    fieldSpread = -1;
    quad: WebGLVertexArrayObject;
    cities: WebGLVertexArrayObject;
    cityBuffer: WebGLBuffer;
    version = -1;
    constructor(public canvas: HTMLCanvasElement) {
        const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
        if (!gl)
            throw new Error('This playground needs WebGL 2. Enable hardware acceleration or try another browser.');
        this.gl = gl;
        this.terrainProgram = this.program(vertex, fragment);
        this.cityProgram = this.program(cityVertex, cityFragment);
        this.quad = gl.createVertexArray()!;
        gl.bindVertexArray(this.quad);
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const location = gl.getAttribLocation(this.terrainProgram, 'position');
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
        this.terrainTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, W, H, 0, gl.RED, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.roadTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.roadTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, W, H, 0, gl.RED, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.cities = gl.createVertexArray()!;
        gl.bindVertexArray(this.cities);
        this.cityBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cityBuffer);
        this.attribute(this.cityProgram, 'city', 4, 5, 0);
        this.attribute(this.cityProgram, 'hover', 1, 5, 4);
    }
    attribute(program: WebGLProgram, name: string, length: number, stride: number, offset: number) { const gl = this.gl, i = gl.getAttribLocation(program, name); gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, length, gl.FLOAT, false, stride * 4, offset * 4); gl.vertexAttribDivisor(i, 1); }
    program(v: string, f: string) {
        const gl = this.gl, p = gl.createProgram()!;
        for (const [type, source] of [[gl.VERTEX_SHADER, v], [gl.FRAGMENT_SHADER, f]] as const) {
            const s = gl.createShader(type)!;
            gl.shaderSource(s, source);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
                throw new Error(gl.getShaderInfoLog(s) ?? 'Shader compilation failed');
            gl.attachShader(p, s);
            gl.deleteShader(s);
        }
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(p) ?? 'WebGL link failed');
        return p;
    }
    draw(world: World, camera: Camera, mode: number, pointer: number[], brush: boolean, selected: number, hovered: number) {
        const gl = this.gl, width = this.canvas.clientWidth, height = this.canvas.clientHeight, dpr = Math.min(devicePixelRatio, 2);
        if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
            this.canvas.width = Math.round(width * dpr);
            this.canvas.height = Math.round(height * dpr);
        }
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.disable(gl.BLEND);
        const bind = (p: WebGLProgram) => { gl.useProgram(p); gl.uniform2f(gl.getUniformLocation(p, 'resolution'), width, height); gl.uniform2f(gl.getUniformLocation(p, 'center'), camera.x, camera.y); gl.uniform1f(gl.getUniformLocation(p, 'scale'), camera.scale); };
        bind(this.terrainProgram);
        gl.bindVertexArray(this.quad);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);
        if (this.version !== world.terrainVersion) {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RED, gl.FLOAT, world.terrain);
            this.version = world.terrainVersion;
        }
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.roadTexture);
        if (world.time - this.fieldTime > .05 || world.revision !== this.fieldRevision || world.params.spread !== this.fieldSpread) {
            roadField(world, this.density);
            for (let i = 0; i < CELLS; i++)
                this.roadPixels[i] = Math.round(255 * (1 - Math.exp(-this.density[i] * .8)));
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RED, gl.UNSIGNED_BYTE, this.roadPixels);
            this.fieldTime = world.time;
            this.fieldRevision = world.revision;
            this.fieldSpread = world.params.spread;
        }
        gl.uniform1i(gl.getUniformLocation(this.terrainProgram, 'roads'), 1);
        gl.uniform1i(gl.getUniformLocation(this.terrainProgram, 'terrain'), 0);
        for (const [name, value] of [['relief', world.params.relief], ['mode', mode], ['brush', world.params.brush]] as const)
            gl.uniform1f(gl.getUniformLocation(this.terrainProgram, name), value);
        gl.uniform2f(gl.getUniformLocation(this.terrainProgram, 'pointer'), pointer[0], pointer[1]);
        gl.uniform1i(gl.getUniformLocation(this.terrainProgram, 'tool'), brush ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        const cityData = world.cities.flatMap(c => [c.x, c.y, c.radius, c.id === selected ? 1 : 0, c.id === hovered ? 1 : 0]);
        bind(this.cityProgram);
        gl.bindVertexArray(this.cities);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cityBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cityData), gl.DYNAMIC_DRAW);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, world.cities.length);
    }
}
