# What Gives Way

A rocked intruder meets a remembering packing. A small movement can change which grains carry the next push.

The large disk is driven by an explicitly applied rocking force. Bright connections carry actual normal contact loads. It may advance, turn sideways or become held by a new arrangement. Change its aim or disturb a few supporting grains and watch what the next push encounters.

## Source

Douglas Daniel de Carvalho · Erick de Moraes Franklin. [Undulatory forcing of an intruder through granular media: effects of frequency and packing fraction](https://arxiv.org/abs/2606.02853) (2026).

## Implementation

```text
mᵢr̈ᵢ = Σ(Fₙn + Fₜt) + Fbase + Fdrive
Fₙ = max(0,kₙδ³ᐟ²−γₙ√δ vₙ), |Fₜ|≤μFₙ
Fdrive = F₀(|cosωt|,sinωt), rotated to the chosen aim
```

A dimensionless 2D DEM reduction of Carvalho & Franklin, Eqs.(1–5). Bidisperse disks translate and rotate; Hertz normal repulsion, damped Mindlin-like tangential springs with stored slip and Coulomb truncation, and static/dynamic basal friction transmit the load. A 30×24 closed box uses roughly 550 grains, smaller and softer than the source, with Δt=0.0015 and 20 substeps per tick. The initial packing is relaxed for 1000 microsteps before the external drive starts. Packing changes radii at restart; contact modulus and friction values are illustrative, so the paper’s quantitative optimal frequency is not reproduced. The 2026 result concerns the relation between oscillatory forcing, system elasticity and intermittent passage; the contact laws are established DEM ingredients. The visible drive is continuous external work, not self-propulsion or random kicks. Pointer disturbances are explicit added forces; no particle is deleted and no jam is scripted. At a wall or a stable jam it can genuinely stop; steer the force to explore another route.

Aim changes the direction of the applied rocking force. Disturb pushes nearby grains; holding keeps applying a bounded local force. Positions and contact history remain after release. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/granular-intruder/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
