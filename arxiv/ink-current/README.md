# What the Water Keeps

Dye in an incompressible fluid. Ink follows a current it cannot change. A line stretches, folds and loses its edge.

Follow one dark ribbon. The velocity field carries itself as well as the dye, so a fold changes the next fold. The resting preset receives no new stirring or ink: it slowly mixes and fades.

## Source

Bruno Eckhardt · Jörg Schumacher. [Structure function of passive scalars in two-dimensional turbulence](https://arxiv.org/abs/chao-dyn/9904024) (1999).

## Implementation

```text
∂ₜu + (u·∇)u = −∇p + ν∇²u + f − λu
∇·u = 0
∂ₜc + u·∇c = κ∇²c + Sg(x)(1−c) − μc
S = 3, μ = 0.09 in the maintained presets
```

A periodic 64² incompressible velocity grid transports two 192² passive dye fields. Midpoint semi-Lagrangian advection, Fourier pressure projection, spectral viscosity and explicit dye diffusion use Δt=0.035. Fourier velocity modes above the 2/3 cutoff are discarded. Semi-Lagrangian interpolation adds numerical diffusion and does not conserve dye mass exactly. The default is maintained by explicit low-wave-number body forces and two dye inlets, with weak drag. Each dye inlet has maximum supply rate S=3 with saturation (1−c), and dye removal rate μ=0.09; these explicit sources and sinks keep folds visible without a reset. It illustrates the source’s passive-scalar transport mechanism; it does not measure its turbulence scaling exponents.

Press and drag to add ink and stir a small vortex. The fluid continues moving after you let go. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/ink-current/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
