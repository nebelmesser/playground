# A Fabric That Never Repeats

Kuramoto–Sivashinsky. Small irregularities grow while the smallest ones are smoothed away. A continuous struggle between scales remains.

The top line is the current slope u(x) of a one-dimensional surface. Below is its history: space runs left to right, and older times run downwards. Splitting bands mark the birth and disappearance of structures.

## Source

Carson C. Chow · Terence Hwa. [Defect-Mediated Stability: An Effective Hydrodynamic Theory of Spatiotemporal Chaos](https://arxiv.org/abs/cond-mat/9412041) (1994).

## Implementation

```text
∂ₜu = −u∂ₓu − ∂ₓ²u − ∂ₓ⁴u
u = ∂ₓh; periodic boundary
```

The Kuramoto–Sivashinsky equation for surface slope: 256 Fourier modes, a 2/3 cutoff and a semi-implicit time step Δt=0.04. This is a qualitative exploration of spatiotemporal chaos. Changing L changes the spatial coordinate scale.

Press at any x to add a local bump. A short world can become regular; a longer world allows more independent structures. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/chaotic-surface/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
