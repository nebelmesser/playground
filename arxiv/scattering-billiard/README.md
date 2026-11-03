# A World of Perfect Reflections

Periodic Lorentz gas. Nothing chooses a new direction. Free flight and perfectly elastic collisions turn a tiny difference into a different journey.

The gold and blue particles begin at the same point with angles only 0.0001 radians apart. Follow their traces through the disks: dispersing collisions stretch their difference. The muted particles are independent companions, not a flock. A particle leaving one side enters the opposite side.

## Source

Valery B. Kokshenev · Eduardo Vicentini. [Insights into the superdiffusive dynamics through collision statistics in periodic Lorentz gas and Sinai billiard](https://arxiv.org/abs/math-ph/0405033) (2004).

## Implementation

```text
Between collisions: ṙ = v, v̇ = 0
At a disk: v′ = v − 2(v·n)n
|v′| = |v|, with periodic square boundaries
```

24 noninteracting point particles among a periodic square lattice of circular hard scatterers. Circle intersections are solved analytically for every flight segment; velocities reflect specularly and preserve speed. There are four lattice cells per side of the display. The radius is a fraction of one cell, always below 0.5, so open corridors remain: this is an infinite-horizon geometry. The short trails and ensemble are not sufficient to infer a diffusion exponent. A 10⁻¹¹ outward numerical nudge prevents repeated zero-time collisions. Radius edits and launches are explicit interventions, not autonomous dynamics.

Press or drag to relaunch the highlighted pair from the pointer. A launch inside a disk is placed just outside its rim. Changing disk radius projects any engulfed particles outside and clears the old trails on the next step. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/scattering-billiard/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
