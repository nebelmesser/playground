export default {
  slug:'diffusion-tree',title:'The Shape of Arrival',short:'Diffusion-limited aggregation',kind:'diffusion-tree',
  hook:'A wandering particle has no plan. Where it first touches changes where the next thousand particles can arrive.',
  watch:'Tips intercept the random walkers and shelter the gaps behind them. Lower the sticking probability and particles get more chances to enter those gaps. Growth is irreversible and eventually reaches the finite boundary.',
  gesture:'Press and drag inside the circle to plant extra nuclei. Each new nucleus changes which parts of the aggregate intercept the incoming walkers.',
  legend:'Blue — early attachment · amber — recent attachment · pale dot — wandering particle',
  equation:'Xₜ₊₁ = Xₜ + a random lattice neighbour\nP(attach | adjacent to cluster) = Kstick',
  limit:'Single-species square-lattice DLA with partial sticking, following the first modification in the paper. One walker is active at a time; rejected contact resumes diffusion. Launch and kill circles approximate distant supply and create finite-size bias. Each tick budgets 12,000 hops, not a fixed number of attachments. The 257² world stops at radius 112 or 6,500 attached particles; Reset begins a new aggregate. User-planted nuclei are external additions. The paper’s two-species and second-chance variants are not included.',
  paper:{title:'Diffusion Limited Aggregation with modified local rules',authors:'Bogdan Ranguelov · Desislava Goranova · Vesselin Tonchev · Rositsa Yakimova',year: 2011,id:'1105.5558'},
  controls:[{key:'sticking',label:'Sticking probability',min:.05,max:1,step:.01},{key:'supply',label:'Supply distance',min:8,max: 45,step:1}],rate: 30,warmup: 550,customView:true,validationSteps: 1200
};
