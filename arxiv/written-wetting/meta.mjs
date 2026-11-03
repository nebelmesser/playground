export default {
  slug: 'written-wetting', title: 'What the Surface Asks', short: 'A liquid sheet follows written chemistry', kind: 'written-wetting',
  hook: 'Write beneath the liquid. A change in the surface starts a withdrawal somewhere else.',
  watch: 'The sheet begins almost flat. Thin places open, their moving rims carry liquid, and deeper pools remain. Draw a wettable route or a repellent divide, then watch where the same liquid goes. Chemistry contours stay visible while paused.',
  gesture: 'Choose a surface tool, then press and drag. Green contours mark more wettable ground; amber contours mark more repellent ground. The brush changes contact angle beneath the sheet and leaves its volume untouched. Restore brings back the original chemistry, not the earlier liquid shape.',
  legend: 'Pale green relief — deeper liquid · dark brown — exposed precursor · green / amber contours — low / high contact angle',
  equation: '∂ₜh = ∇·[Q(h)∇p],  Q = h(2h²+6bh+3b²)/(6μ)\np = −γ∇²h − γ(1−cosθ(x,y))φ′(h)\nφ(h) = [8(h*/h)²−2(h*/h)⁸]/6',
  limit: 'Source Eqs.(1–5): conserved thin-film hydrodynamics on a physically flat, chemically patterned substrate. The 2025 work quantifies how smooth versus abrupt chemical patterns change rupture sites and droplet counts; it does not introduce the underlying thin-film equation. This reduced 96² periodic model uses h*=0.22, b=0.035, Δx=0.7 and dimensionless γ=μ=1. A symmetric finite-volume flux integrates the full height-dependent mobility; adaptive explicit steps are accepted only when positive and decreasing the discrete capillary-plus-wetting energy. No liquid is inserted, removed or clipped. A smooth, static starter pattern supplies heterogeneous contact angles; initial height noise is the only random perturbation. Surface contrast changes θ around 30°, and chemical sharpness changes a bounded tanh transformation of the drawn map. Drawing and these two controls explicitly perform work by changing the substrate energy. The thickness control takes effect on restart. Lubrication/Stokes approximation, with a molecular precursor standing for dry ground; large slopes/contact angles are qualitative, with no inertia, evaporation or contact-angle hysteresis. A closed sheet eventually settles rather than being automatically disturbed or restarted.',
  paper: { title: 'Modelling of the dewetting of ultra-thin liquid films on chemically patterned substrates: linear spectrum and deposition patterns', authors: 'Tilman Richter · Paolo Malgaretti · Jens Harting', year: 2025, id: '2503.03627' },
  controls: [
    { key: 'contrast', label: 'Wettability contrast', min: .2, max: 1.35, step: .05 },
    { key: 'sharpness', label: 'Chemical border sharpness', min: 0, max: 1, step: .05 },
    { key: 'thickness', label: 'Initial film thickness (restart)', min: .44, max: .75, step: .01 },
  ],
  rate: 12, warmup: 18, customView: true, validationSteps: 1400,
};
