export default {
 slug:'gravity-garden',title:'A Garden Held by Falling',short:'Self-gravitating particles',kind:'gravity-garden',
 hook:'Every point falls toward every other point. Rotation prevents a simple ending, and close encounters rearrange the garden.',
 watch:'The disc can bend into a bar, pass through a collapse or exchange stars with its neighbour. Trails show recent physical trajectories. Particles can leave the visible window; there is no containing wall.',
 gesture:'Press and drag to give nearby stars a small tangential impulse. An equal overall correction keeps total linear momentum unchanged. The energy reference restarts after each impulse.',
 legend:'Dots — equal masses · short trails — recent orbits · open space — no boundary',
 equation:'r̈ᵢ = Σⱼ≠ᵢ Gmⱼ(rⱼ−rᵢ) / (|rⱼ−rᵢ|²+ε²)³ᐟ²\nVᵢⱼ = −Gmᵢmⱼ / √(|rᵢ−rⱼ|²+ε²)',
 limit:'160 equal masses move in a plane under direct pairwise 3D Newtonian gravity with Plummer softening. A kick–drift–kick leapfrog uses Δt=0.008, three substeps per displayed step. No collisions, merging, halo, gas or stellar evolution are included. Initial discs are illustrative, not exact distribution-function equilibria. As the paper explains, softening biases disc stability; this finite, collisional toy does not reproduce its collisionless mode calculations.',
 paper:{title:'How gravitational softening affects galaxy stability I. Linear mode analysis of disc galaxies',authors:'Sven De Rijcke · Jean-Baptiste Fouvry · Walter Dehnen',year: 2018,id:'1812.07001'},
 controls:[{key:'softening',label:'Softening ε',min:.07,max:.24,step:.01},{key:'spin',label:'Rotation (restart)',min:.2,max:1.2,step:.02}],rate: 60,warmup:0,customView:true,validationSteps: 6000
};
