# The Shape of Arrival

Diffusion-limited aggregation. A wandering particle has no plan. Where it first touches changes where the next thousand particles can arrive.

Tips intercept the random walkers and shelter the gaps behind them. Lower the sticking probability and particles get more chances to enter those gaps. Growth is irreversible and eventually reaches the finite boundary.

## Source

Bogdan Ranguelov · Desislava Goranova · Vesselin Tonchev · Rositsa Yakimova. [Diffusion Limited Aggregation with modified local rules](https://arxiv.org/abs/1105.5558) (2011).

## Implementation

```text
Xₜ₊₁ = Xₜ + a random lattice neighbour
P(attach | adjacent to cluster) = Kstick
```

Single-species square-lattice DLA with partial sticking, following the first modification in the paper. One walker is active at a time; rejected contact resumes diffusion. Launch and kill circles approximate distant supply and create finite-size bias. Each tick budgets 12,000 hops, not a fixed number of attachments. The 257² world stops at radius 112 or 6,500 attached particles; Reset begins a new aggregate. User-planted nuclei are external additions. The paper’s two-species and second-chance variants are not included.

Press and drag inside the circle to plant extra nuclei. Each new nucleus changes which parts of the aggregate intercept the incoming walkers. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/diffusion-tree/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
