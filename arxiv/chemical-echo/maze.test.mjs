import test from 'node:test';
import assert from 'node:assert/strict';
import {generateEnvironment} from './maze.mjs';
import {create} from './model.mjs';

function clearance(walls,n,x,y,radius=1.15){
  if(x<radius+2||x>n-radius||y<radius+2||y>n-radius-2)return false;
  for(let yy=Math.floor(y-radius);yy<=Math.floor(y+radius);yy++)
    for(let xx=Math.floor(x-radius);xx<=Math.floor(x+radius);xx++)if(walls[xx+n*yy]){
      const dx=Math.max(xx-x,0,x-xx-1),dy=Math.max(yy-y,0,y-yy-1);
      if(dx*dx+dy*dy<radius*radius)return false;
    }
  return true;
}
function accessible(geometry,n){
  const clear=new Uint8Array(n*n),seen=clear.slice(),queue=[];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)clear[x+n*y]=+clearance(geometry.walls,n,x+.5,y+.5);
  const start=Math.floor(geometry.start.x)+n*Math.floor(geometry.start.y);assert(clear[start]);
  seen[start]=1;queue.push(start);
  for(let k=0;k<queue.length;k++){
    const i=queue[k],x=i%n,y=Math.floor(i/n);
    for(const j of [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1])
      if(j>=0&&clear[j]&&!seen[j]){seen[j]=1;queue.push(j);}
  }
  return seen;
}

test('same seed repeats geometry; new seeds change passage topology, rooms and entrance',()=>{
  const maps=new Set(),topologies=new Set(),starts=new Set();
  for(let seed=1;seed<=48;seed++){
    const a=generateEnvironment(seed),b=generateEnvironment(seed);
    assert.deepEqual(a,b);maps.add(Buffer.from(a.walls).toString('base64'));
    topologies.add(a.links.map(([i,j])=>[Math.min(i,j),Math.max(i,j)].join(':')).sort().join(','));
    starts.add(a.start.y);
  }
  assert.equal(maps.size,48);assert.equal(topologies.size,48);assert.ok(starts.size>=5);
});

test('generated corridors are connected with clearance for the actual finite-radius drop',()=>{
  for(const layout of [0,1,2])for(let seed=1;seed<=48;seed++){
    const g=generateEnvironment(seed,layout),seen=accessible(g,112);
    assert(seen[Math.floor(g.exit.x)+112*Math.floor(g.exit.y)],`seed ${seed}, layout ${layout} has an accessible outlet`);
    for(const room of g.rooms)assert(seen[room.x+112*room.y],`room is accessible for seed ${seed}`);
    if(layout!==1){
      const degree=new Uint8Array(g.rooms.length);for(const [a,b] of g.links){degree[a]++;degree[b]++;}
      if(layout===0){
        assert.ok(degree.filter(v=>v===1).length>=2,'blind arms provide actual alternatives');
        assert.equal(g.links.length,g.rooms.length-1);
      }else assert.ok(g.links.length>g.rooms.length-1,'the loop preset has cycles');
    }
  }
});

test('the chemical process explores different generated mazes without penetrating walls or losing mass',()=>{
  for(const seed of [1,2,3,5,17,41]){
    const m=create(seed),start={...m.drop};let maxDistance=0;
    for(let k=0;k<500;k++){
      m.step();maxDistance=Math.max(maxDistance,Math.hypot(m.drop.x-start.x,m.drop.y-start.y));
      assert(clearance(m.walls,m.n,m.drop.x,m.drop.y),'finite droplet stays in accessible water');
    }
    assert.ok(maxDistance>12,'the drop leaves its starting chamber through its chemical feedback');
    assert.ok(m.values().every(Number.isFinite));
    assert.ok(Math.abs(m.mass()-m.emitted+m.drained)<2e-6);
  }
});
