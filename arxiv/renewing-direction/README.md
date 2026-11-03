# A Direction Outlives Its Threads

Orientation survives material turnover. Every filament can disappear. A new one borrows its direction from those crossing the place where it is born.

Each row is one filament in the same one-dimensional bundle. The arrow marks its plus end. Pale threads belonged to the starting material; coloured threads were born later. Watch Original filaments reach zero while a directional bias remains. Seed the opposite orientation at one site, or trigger retraction around a patch, then stay with its descendants. Without feedback, replacement gradually loses the initial bias.

## Source

Hannah G. Scanlon · Gibarni Mahata · Anna C. Nelson · Scott A. McKinley · Melissa M. Rolls · Maria-Veronica Ciocanel. [Nucleation feedback can drive establishment and maintenance of biased microtubule polarity in neurites](https://arxiv.org/abs/2506.12209) (2025).

## Implementation

```text
P(right at x)=nright(x)/(nright(x)+nleft(x))
λcat±(L)=max[0.05, (0.5,0.25)+0.01(L−20)] min⁻¹
Complete retraction → new filament at a random birth site
```

The source’s 70 μm one-dimensional spatial model: 60 filaments, six sites, 0.1 μm newborns, stochastic growth/shrink switching at both ends and orientation sampled from actual local crossing filaments. Plus/minus growth speeds are 6/0.75 μm per minute, shrink speeds 6/3.5; rescue rates 0.2811/0.67 per minute. A one-second step approximates the continuous-time end dynamics, as in the source algorithm. This reduction uses length-dependent catastrophe and omits the source’s additional finite-tubulin growth limitation, so lengths and establishment times are qualitative. Optional checkpoint applies 0.25 automatic failure and six independent local samples; an empty site uses an unbiased birth and passes the directional check. Feedback between 0 and 1 mixes unbiased births with the local rule; endpoints match the paper’s off/on experiments. Rows separate overlapping filaments for inspection and are not a second spatial dimension. Initial bias is a prepared condition, not a fitted biological prediction. Retraction/seeding are external interventions and do not model full injury or nerve regeneration. No filament ever turns to align; only replacements inherit orientation.

Retraction changes the growth states of filaments touched by the brush. Seeding replaces a few rows with short externally planted filaments at the nearest site; drag vertically to plant more. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/renewing-direction/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
