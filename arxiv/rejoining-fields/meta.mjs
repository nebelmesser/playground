export default {
  slug:'rejoining-fields',title:'Where the Lines Rejoin',short:'Magnetic reconnection',kind:'rejoining-fields',customView:true,
  hook:'Two magnetic islands press against each other. The field carries the fluid, and the fluid carries the field, until a connection can change.',
  watch:'Follow one pale contour through the narrow central current sheet. Connections cross the sheet and a shared island forms. Moving copper threads follow the actual fluid velocity. Drag across a contour, release it, and watch the field push back. Higher viscosity slows this response.',
  gesture:'Push the plasma by dragging, or turn a small patch with the vortex tool. These gestures give the fluid momentum without drawing magnetic lines.',
  legend:'Pale contours — magnetic flux · copper trails — moving fluid · blue / copper background — opposite electric current',
  equation:'B=(∂yA,−∂xA), u=(∂yψ,−∂xψ), ω=−∇²ψ\n∂tA={ψ,A}+η∇²A\n∂tω={ψ,ω}+{A,∇²A}+ν∇²ω',
  limit:'A 65² incompressible, constant-density reduction of the source’s isothermal resistive MHD. Its initial two-island flux and conducting, free-slip walls are retained; the current sheet is broadened to resolve it. A sine-transform Poisson solve and Arakawa brackets couple the magnetic flux to fluid vorticity; adaptive Heun steps obey wave and diffusion limits. The source minimises compressibility with a large sound speed; here pressure enforces incompressibility exactly. Browser resistivities and resolution describe slow, smooth reconnection, not the paper’s high-Lundquist plasmoid regime or its scaling result. The initial state is only approximately force-balanced. Dragging injects external kinetic energy. Passive fluid trails do not change the fields. The isolated system dissipates and eventually rests; it has no automatic restart or hidden stirring.',
  paper:{title:'Magnetic Prandtl number dependence of plasmoid-mediated reconnection',authors:'Vinay Kumar · Axel Brandenburg',year:2026,id:'2605.18946'},
  controls:[{key:'resistivity',label:'Resistivity η',min:.0002,max:.003,step:.0002},{key:'prandtl',label:'Viscosity / resistivity',min:1,max:12,step:1}],
  rate:28,warmup:25,validationSteps:1800
};
