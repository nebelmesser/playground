import {rng} from '../shared/math.mjs';

// Geometry is generated once. The moving drop only receives the reflecting
// raster and the open reservoir, never this room graph or a route to the exit.
export function generateEnvironment(seed,layout=0,n=112){
  const random=rng((seed^0x6d2b79f5)>>>0),walls=new Uint8Array(n*n);
  const integer=k=>Math.floor(random()*k);
  function box(x0,y0,x1,y1,value=0){
    for(let y=Math.max(0,Math.floor(y0));y<Math.min(n,Math.ceil(y1));y++)
      for(let x=Math.max(0,Math.floor(x0));x<Math.min(n,Math.ceil(x1));x++)walls[x+n*y]=value;
  }
  function border(){box(0,0,n,2,1);box(0,n-2,n,n,1);box(0,0,2,n,1);}
  if(layout===1){
    for(let i=0;i<7;i++){
      const x=23+integer(n-44),y=12+integer(n-47),w=4+integer(5),h=14+integer(22);
      box(x,y,x+w,y+h,1);
    }
    const start={x:9,y:12+integer(n-24)},exit={x:n-2.5,y:start.y};
    border();return {walls,start,exit,rooms:[],links:[],kind:'bath'};
  }

  const cols=5,rows=5,rooms=[],links=[],visited=new Uint8Array(cols*rows);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    rooms.push({x:Math.round(11+col*(n-32)/(cols-1))+integer(3)-1,
      y:Math.round(11+row*(n-24)/(rows-1))+integer(3)-1,half:5+integer(3)});
  }
  const startRoom=cols*integer(rows),active=[startRoom];visited[startRoom]=1;
  const neighbours=i=>[i%cols?i-1:-1,i%cols<cols-1?i+1:-1,i>=cols?i-cols:-1,i<cols*(rows-1)?i+cols:-1].filter(j=>j>=0);
  // Growing-tree sampling mixes long turns with short blind arms.
  while(active.length){
    const position=random()<.65?active.length-1:integer(active.length),a=active[position];
    const candidates=neighbours(a).filter(i=>!visited[i]);
    if(!candidates.length){active.splice(position,1);continue;}
    const b=candidates[integer(candidates.length)];visited[b]=1;active.push(b);links.push([a,b]);
  }
  if(layout===2){
    const unused=[];
    for(let a=0;a<rooms.length;a++)for(const b of neighbours(a))
      if(a<b&&!links.some(([i,j])=>(i===a&&j===b)||(i===b&&j===a)))unused.push([a,b]);
    for(let count=0,loops=3+integer(3);count<loops&&unused.length;count++)links.push(...unused.splice(integer(unused.length),1));
  }
  // Choose a distant right-hand room before rasterizing the environment.
  const distance=new Int16Array(rooms.length).fill(-1),queue=[startRoom];distance[startRoom]=0;
  for(let q=0;q<queue.length;q++)for(const [a,b] of links){
    const j=a===queue[q]?b:b===queue[q]?a:-1;
    if(j>=0&&distance[j]<0){distance[j]=distance[queue[q]]+1;queue.push(j);}
  }
  let exitRoom=cols-1;
  for(let row=1;row<rows;row++){const i=cols-1+row*cols;if(distance[i]>distance[exitRoom])exitRoom=i;}

  walls.fill(1);
  for(const p of rooms)box(p.x-p.half,p.y-p.half,p.x+p.half+1,p.y+p.half+1);
  function segment(ax,ay,bx,by,half){box(Math.min(ax,bx)-half,Math.min(ay,by)-half,Math.max(ax,bx)+half+1,Math.max(ay,by)+half+1);}
  for(const [a,b] of links){
    const p=rooms[a],q=rooms[b],half=3+integer(3);
    if(Math.abs(a-b)===1){
      const x=Math.round((p.x+q.x)/2);segment(p.x,p.y,x,p.y,half);segment(x,p.y,x,q.y,half);segment(x,q.y,q.x,q.y,half);
    }else{
      const y=Math.round((p.y+q.y)/2);segment(p.x,p.y,p.x,y,half);segment(p.x,y,q.x,y,half);segment(q.x,y,q.x,q.y,half);
    }
  }
  const entrance=rooms[startRoom],outlet=rooms[exitRoom];
  segment(4,entrance.y,entrance.x,entrance.y,4);
  box(n-8,2,n,n-2);segment(outlet.x,outlet.y,n-1,outlet.y,4);border();
  return {walls,start:{x:7.5,y:entrance.y},exit:{x:n-2.5,y:outlet.y},rooms,links,startRoom,exitRoom,kind:layout===2?'loops':'tree'};
}
