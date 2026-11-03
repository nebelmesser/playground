export default {
 slug:'ink-current',title:'What the Water Keeps',short:'Dye in an incompressible fluid',kind:'ink-current',
 hook:'Ink follows a current it cannot change. A line stretches, folds and loses its edge.',
 watch:'Follow one dark ribbon. The velocity field carries itself as well as the dye, so a fold changes the next fold. The resting preset receives no new stirring or ink: it slowly mixes and fades.',
 gesture:'Press and drag to add ink and stir a small vortex. The fluid continues moving after you let go.',
 legend:'Indigo and rose — two passive dyes · pale — little dye',
 equation:'∂ₜu + (u·∇)u = −∇p + ν∇²u + f − λu\n∇·u = 0\n∂ₜc + u·∇c = κ∇²c + Sg(x)(1−c) − μc\nS = 3, μ = 0.09 in the maintained presets',
 limit:'A periodic 64² incompressible velocity grid transports two 192² passive dye fields. Midpoint semi-Lagrangian advection, Fourier pressure projection, spectral viscosity and explicit dye diffusion use Δt=0.035. Fourier velocity modes above the 2/3 cutoff are discarded. Semi-Lagrangian interpolation adds numerical diffusion and does not conserve dye mass exactly. The default is maintained by explicit low-wave-number body forces and two dye inlets, with weak drag. Each dye inlet has maximum supply rate S=3 with saturation (1−c), and dye removal rate μ=0.09; these explicit sources and sinks keep folds visible without a reset. It illustrates the source’s passive-scalar transport mechanism; it does not measure its turbulence scaling exponents.',
 paper:{title:'Structure function of passive scalars in two-dimensional turbulence',authors:'Bruno Eckhardt · Jörg Schumacher',year:1999,id:'chao-dyn/9904024'},
 controls:[{key:'viscosity',label:'Viscosity ν',min:.00004,max:.001,step:.00002},{key:'stirring',label:'Stirring strength',min:0,max:.12,step:.005},{key:'diffusion',label:'Dye diffusion κ',min:0,max:.00005,step:.000005}],rate:30,warmup:220,customView:true,validationSteps:1600
};
