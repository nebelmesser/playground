# A Garden That Eats Itself

Reaction–diffusion. Spots grow, divide and disappear when they become crowded. A boundary between a creature and a process.

Follow a single spot: its shape persists while the material inside it keeps changing. In Maze mode, separate spots become a network.

## Source

John E. Pearson. [Complex Patterns in a Simple System](https://arxiv.org/abs/patt-sol/9304003) (1993).

## Implementation

```text
∂ₜU = 0.16 ∇²U − UV² + F(1−U)
∂ₜV = 0.08 ∇²V + UV² − (F+k)V
```

A two-dimensional Gray–Scott model with periodic boundaries and an explicit finite-difference scheme on a 128² grid. Time and space scales are chosen for the browser. Some regimes naturally approach a nearly stationary pattern. The initial garden has already evolved for 1,600 steps.

Press the field to add a drop of reagent V. Its future depends on the surrounding pattern. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/gray-scott/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
