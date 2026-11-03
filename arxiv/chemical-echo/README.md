# The Water Answers

A drop follows its own chemical echoes. The drop releases what it avoids. A closed passage sends that signal back; an opening lets it spread.

New seed generates a different maze; Restart repeats the same one. Watch a fork fill before the drop reaches it. A dead arm can repel the drop through its accumulated chemical. Build a wall, open a passage, or move the drop back through water that remembers its earlier visit.

## Source

Aritra K. Mukhopadhyay · Ran Niu · Linhui Fu · Kai Feng · Christopher Fujta · Qiang Zhao · Jinping Qu · Benno Liebchen. [Automated decision-making by chemical echolocation in active droplets](https://arxiv.org/abs/2601.00480) (2026).

## Implementation

```text
∂ₜc = D∇²c + qK(x−r)
τr̈ + ṙ = −χ⟨∇c⟩K
∂ₙc = 0 at walls; c = 0 outside the right edge
```

Minimal single-agent chemical-echolocation model from Eqs. (1–4) of the 2026 paper, not a pathfinding algorithm. Dimensionless 112² finite-volume grid; D=3–24, χ=0–100, q=12 and τ=0.35. Fixed Δt=0.006, 20 substeps per tick. The source and gradient use a normalized Gaussian footprint (variance 1.6 grid cells²), replacing the point source and nearest-cell sensing. Rays from the drop to footprint cells must cross only water, so emission and sensing cannot reach through a thin wall. Brownian noise is omitted; one small initial velocity breaks symmetry. A swept inelastic contact replaces the short-range WCA wall potential. All painted walls reflect chemical. The right edge drains into an explicitly empty reservoir; released and drained amounts are tracked, with no chemical decay, global subtraction or hidden reset. Building a wall displaces its chemical to neighbouring water; erasing adds empty water. Moving the drop stops its velocity and preserves the field. Brightness uses the fixed scale log(1+c/0.2)/log(101), saturated above c=20; it never rescales after a new peak. Maze geometry is generated from the seed before the simulation: variable-width rooms and corridors form a connected branching tree; the Looping passages preset opens additional cycles. The outlet connects to a distant room on the right. The open bath also has seeded obstacles. Layout changes in presets restart the experiment. Generated mazes have a physically traversable path to the reservoir; the chemical dynamics can explore blind arms, revisit rooms or take a long time to find it. The route shows up to 8,000 samples; the chemical field retains the entire dynamical history through diffusion. This coarse, deterministic reduction does not reproduce the paper’s quantitative maze-success statistics.

Build wall and Open passage change the geometry. Move drop places it in clear water without erasing its chemical history. A pale line records its route. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/chemical-echo/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
