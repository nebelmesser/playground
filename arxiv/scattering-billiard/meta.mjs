export default {
  slug: 'scattering-billiard', title: 'A World of Perfect Reflections', short: 'Periodic Lorentz gas', kind: 'scattering-billiard', customView: true,
  hook: 'Nothing chooses a new direction. Free flight and perfectly elastic collisions turn a tiny difference into a different journey.',
  watch: 'The gold and blue particles begin at the same point with angles only 0.0001 radians apart. Follow their traces through the disks: dispersing collisions stretch their difference. The muted particles are independent companions, not a flock. A particle leaving one side enters the opposite side.',
  gesture: 'Press or drag to relaunch the highlighted pair from the pointer. A launch inside a disk is placed just outside its rim. Changing disk radius projects any engulfed particles outside and clears the old trails on the next step.',
  legend: 'Gold and cyan — almost identical initial trajectories · disk rim flash — recent collision · fading lines — recent paths',
  equation: 'Between collisions: ṙ = v, v̇ = 0\nAt a disk: v′ = v − 2(v·n)n\n|v′| = |v|, with periodic square boundaries',
  limit: '24 noninteracting point particles among a periodic square lattice of circular hard scatterers. Circle intersections are solved analytically for every flight segment; velocities reflect specularly and preserve speed. There are four lattice cells per side of the display. The radius is a fraction of one cell, always below 0.5, so open corridors remain: this is an infinite-horizon geometry. The short trails and ensemble are not sufficient to infer a diffusion exponent. A 10⁻¹¹ outward numerical nudge prevents repeated zero-time collisions. Radius edits and launches are explicit interventions, not autonomous dynamics.',
  paper: { title: 'Insights into the superdiffusive dynamics through collision statistics in periodic Lorentz gas and Sinai billiard', authors: 'Valery B. Kokshenev · Eduardo Vicentini', year: 2004, id: 'math-ph/0405033' },
  controls: [{ key: 'radius', label: 'Disk radius / cell', min: .08, max: .46, step: .005 }, { key: 'speed', label: 'Flight speed', min: .08, max: .8, step: .01 }],
  rate: 35, warmup: 70, validationSteps: 2600
};
