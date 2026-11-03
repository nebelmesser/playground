# Two Reasons to Stay

Competing chemical invitations. The cells leave a signal that gathers them together. They also eat what they are following, opening another way to go.

Follow a bright patch and the faint paths around it. The same conserved population responds to two chemicals: one it makes and one it consumes. A dense centre can coexist with a spreading population.

## Source

Agniva Datta · Robert Großmann · Carsten Beta. [Multi-scale patterns arising from competing chemotactic interactions](https://arxiv.org/abs/2610.32591) (2026).

## Implementation

```text
∂ₜb = ∇²b − ∇·[b/(1+b²)(κₐ∇a + 14∇n)]
∂ₜa = 2.5∇²a + b − a
∂ₜn = 0.75∇²n + β(1−bn)
```

Source-specific three-field Keller–Segel model, Eq.(1), on a periodic 88² grid of length 50. The 2026 result is coexistence of aggregation and dispersal under competing self-produced signal and consumed food. A conservative upwind finite-volume flux with a positivity limiter replaces the paper’s numerical scheme; reactions are locally integrated exactly. Δt=0.015, six substeps per tick. No cell birth or death, particle slowdown, alignment or continuing random forcing is used. Coarse-grid upwinding changes wavelengths and can damp the mixed patterns. The food brush is an explicit bounded perturbation.

Press and drag to replenish food locally. You change an invitation, not the number of cells. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/two-calls/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
