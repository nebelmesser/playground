import {clamp} from '../shared/math.mjs';
export function draw(view,m){const r=view.rect();view.image(m.n,m.n,i=>{const density=clamp(Math.log1p(m.b[i])/.95),signal=clamp((m.a[i]-.6)/2),food=clamp(m.food[i]/2);return [16+202*density+20*signal,15+183*density+18*food,27+172*density+35*signal].map(v=>clamp(v,0,255));},r,true);}
