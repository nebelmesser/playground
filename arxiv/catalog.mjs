import rejoining_fields from './rejoining-fields/meta.mjs';
import cornerstone_flow from './cornerstone-flow/meta.mjs';
import curved_crystal from './curved-crystal/meta.mjs';
import pinned_boundaries from './pinned-boundaries/meta.mjs';
import renewing_direction from './renewing-direction/meta.mjs';
import separate_futures from './separate-futures/meta.mjs';
import granular_intruder from './granular-intruder/meta.mjs';
import measured_ascent from './measured-ascent/meta.mjs';
import spiral_territories from './spiral-territories/meta.mjs';
import measured_bonds from './measured-bonds/meta.mjs';
import chemical_echo from './chemical-echo/meta.mjs';
import written_wetting from './written-wetting/meta.mjs';
import porous_displacement from './porous-displacement/meta.mjs';
import temporal_lens from './temporal-lens/meta.mjs';
import two_calls from './two-calls/meta.mjs';
import ink_current from './ink-current/meta.mjs';
import forest_return from './forest-return/meta.mjs';
import room_for_one_more from './room-for-one-more/meta.mjs';
import diffusion_tree from './diffusion-tree/meta.mjs';
import scattering_billiard from './scattering-billiard/meta.mjs';
import gravity_garden from './gravity-garden/meta.mjs';
export const experiments = [
  {...measured_bonds,newExploration:true},
  {...granular_intruder,newExploration:true},
  {...cornerstone_flow,newExploration:true},
  {...separate_futures,newExploration:true},
  {...renewing_direction,newExploration:true},
  {...pinned_boundaries,newExploration:true},
  {...curved_crystal,newExploration:true},
  {...measured_ascent,newExploration:true},
  {...spiral_territories,newExploration:true},
  {...rejoining_fields,newExploration:true},
  {...chemical_echo,newExploration:false},
  {...written_wetting,newExploration:false},
  {...porous_displacement,newExploration:false},
  {...temporal_lens,newExploration:false},
  {...two_calls,newExploration:false},
  {...ink_current,newExploration:false},
  {...forest_return,newExploration:false},
  {...room_for_one_more,newExploration:false},
  {...diffusion_tree,newExploration:false},
  {...scattering_billiard,newExploration:false},
  {...gravity_garden,newExploration:false},
  {
    slug:'gray-scott', title:'A Garden That Eats Itself', short:'Reaction–diffusion', kind:'gray',
    hook:'Spots grow, divide and disappear when they become crowded. A boundary between a creature and a process.',
    watch:'Follow a single spot: its shape persists while the material inside it keeps changing. In Maze mode, separate spots become a network.',
    gesture:'Press the field to add a drop of reagent V. Its future depends on the surrounding pattern.',
    legend:'Light — high V concentration · dark — little or no V',
    equation:'∂ₜU = 0.16 ∇²U − UV² + F(1−U)\n∂ₜV = 0.08 ∇²V + UV² − (F+k)V',
    limit:'A two-dimensional Gray–Scott model with periodic boundaries and an explicit finite-difference scheme on a 128² grid. Time and space scales are chosen for the browser. Some regimes naturally approach a nearly stationary pattern. The initial garden has already evolved for 1,600 steps.',
    paper:{title:'Complex Patterns in a Simple System',authors:'John E. Pearson',year:1993,id:'patt-sol/9304003'},
    controls:[{key:'feed',label:'Feed F',min:.015,max:.06,step:.0001},{key:'kill',label:'Decay k',min:.045,max:.068,step:.0001}],rate:700,warmup:1600
  },
  {
    slug:'active-matter',title:'A Crowd Without Attraction',short:'Active matter',kind:'active',
    hook:'Particles slow down in a crowd. That creates a feedback loop which brings them together.',
    watch:'Warm dots have more neighbours. They stay in place longer while other particles arrive. Switch to Gas and watch the clusters disperse.',
    gesture:'Press a cluster to turn nearby particles outwards. This briefly changes their directions; it does not apply a lasting force.',
    legend:'Cool → warm colour: increasing local density',
    equation:'ṙᵢ = v(ρᵢ)e(θᵢ) + soft repulsion\nv(ρ)=v₀[1−s(1−e^(−ρ/2.2))]\ndθ = √(2Dᵣ) dW',
    limit:'An illustration of the MIPS mechanism using density-dependent speed: 640 point particles with soft, short-range repulsion. This is a quorum-sensing model, not a quantitative simulation of hard active disks. Density is smoothed over radius 0.055; boundaries are periodic.',
    paper:{title:'Motility-Induced Phase Separation',authors:'Michael E. Cates · Julien Tailleur',year:2014,id:'1406.3533'},
    controls:[{key:'slowdown',label:'Slowdown s',min:0,max:.99,step:.01},{key:'persistence',label:'Turning noise Dᵣ',min:.04,max:1.5,step:.02}],rate:40,warmup:1200
  },
  {
    slug:'cyclic-life',title:'Nobody Wins',short:'Cyclic competition',kind:'cyclic',
    hook:'A displaces B, B displaces C, and C displaces A. Waves emerge because no species can win for good.',
    watch:'Find a point where all three colours meet. Boundaries can spiral around it: each species follows the one it can displace.',
    gesture:'Press to populate a small area with one of the three species. The species is selected from a reproducible random sequence.',
    legend:'A — coral · B — jade · C — blue · darker — more empty space',
    equation:'∂ₜa = D∇²a + a(1−a−b−c−σc)\nCyclic permutations give the equations for b and c',
    limit:'A deterministic reaction–diffusion approximation of the May–Leonard model on a 112² grid. Randomness only enters the initial conditions and interventions. The demographic noise and finite-population extinction studied in the paper are not reproduced here.',
    paper:{title:'Mobility promotes and jeopardizes biodiversity in rock-paper-scissors games',authors:'Tobias Reichenbach · Mauro Mobilia · Erwin Frey',year:2007,id:'0709.0217'},
    controls:[{key:'mobility',label:'Mobility D',min:.05,max:.7,step:.01},{key:'selection',label:'Displacement σ',min:.4,max:1.5,step:.05}],rate:150,warmup:800
  },
  {
    slug:'flocking',title:'Direction Without a Leader',short:'Vicsek model',kind:'flock',
    hook:'Each particle sees only its neighbours. Local adjustments can still produce a shared direction.',
    watch:'The tip of each particle shows its heading. Lower the noise and watch local streams become a shared flow. Polarization 1 means complete agreement; a value near 0 means the headings largely cancel out.',
    gesture:'Press to turn the headings in a small area into a swirl. The neighbours determine whether the disturbance spreads.',
    legend:'Tip — direction of motion · colour also encodes heading',
    equation:'θᵢ(t+1)=arg Σⱼ∈Nᵢ exp(iθⱼ)+ηξᵢ\nrᵢ(t+1)=rᵢ(t)+v e(θᵢ)',
    limit:'700 point particles moving at constant speed. Headings are updated synchronously using a metric neighbourhood and uniform angular noise. Boundaries are periodic; there is no repulsion or leader. This small model is for observation, not for measuring a critical exponent.',
    paper:{title:'Novel type of phase transition in a system of self-driven particles',authors:'Tamás Vicsek et al.',year:1995,id:'cond-mat/0611743'},
    controls:[{key:'noise',label:'Noise η',min:0,max:6.2,step:.05},{key:'radius',label:'Neighbour radius',min:.025,max:.13,step:.005}],rate:35,warmup:150
  },
  {
    slug:'chaotic-surface',title:'A Fabric That Never Repeats',short:'Kuramoto–Sivashinsky',kind:'surface',
    hook:'Small irregularities grow while the smallest ones are smoothed away. A continuous struggle between scales remains.',
    watch:'The top line is the current slope u(x) of a one-dimensional surface. Below is its history: space runs left to right, and older times run downwards. Splitting bands mark the birth and disappearance of structures.',
    gesture:'Press at any x to add a local bump. A short world can become regular; a longer world allows more independent structures.',
    legend:'Blue — negative slope · copper — positive slope · newest history rows at the top',
    equation:'∂ₜu = −u∂ₓu − ∂ₓ²u − ∂ₓ⁴u\nu = ∂ₓh; periodic boundary',
    limit:'The Kuramoto–Sivashinsky equation for surface slope: 256 Fourier modes, a 2/3 cutoff and a semi-implicit time step Δt=0.04. This is a qualitative exploration of spatiotemporal chaos. Changing L changes the spatial coordinate scale.',
    paper:{title:'Defect-Mediated Stability: An Effective Hydrodynamic Theory of Spatiotemporal Chaos',authors:'Carson C. Chow · Terence Hwa',year:1994,id:'cond-mat/9412041'},
    controls:[{key:'length',label:'World length L',min:30,max:170,step:1}],rate:110,warmup:1800
  }
];
