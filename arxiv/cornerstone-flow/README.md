# One Grain Holds the Passage

A held grain changes the arches that can form. The opening is wide enough for one grain. What the grains can hold together is another question.

Gravity carries three sizes of grains through an opening. Contacts can form a load-bearing arch. Move the green cornerstone a little and the set of possible supports changes. A jam is a real static force balance; there is no hidden clogging coin flip.

## Source

Jesse M. Hanlan · Sam Dillavou · Andrea J. Liu · Douglas J. Durian. [Cornerstones are the Key Stones: Using Interpretable Machine Learning to Probe the Clogging Process in 2D Granular Hoppers](https://arxiv.org/abs/2407.05491) (2024).

## Implementation

```text
mᵢr̈ᵢ = mᵢg + Σⱼ(Fₙn+Fₜt), Iᵢω̇ᵢ = Σⱼτᵢⱼ
Fₙ = max(0,kₙδ³ᐟ²−γₙ√δ vₙ), |Fₜ|≤μFₙ
The marked grain has externally fixed position.
```

The 2024 primary paper is experimental: a three-size monolayer hopper and a magnetically fixed cornerstone causally change the possible arch geometry. This is a new DEM approximation of that apparatus, not the paper’s ML classifier or a quantitative reproduction of its discharge statistics. Roughly 250 disks use Hertz normal repulsion, damped tangential contact history, Coulomb friction and angular motion, Δt=0.0006 with 60 substeps per tick. Rounded outlet lips and actual frictional contact forces support arches; no flow/arrest state is imposed. Grain stiffness, damping and friction are illustrative. Motion of the pinned grain and the local exciter perform external work. An explicitly external recirculator queues escaped grains and inserts each into a non-overlapping empty place at the top, preserving the grain identities and radii while resetting their velocity; it supplies gravitational potential energy. There is no automatic arch-breaking. A stable jam persists until a physical intervention. A few trials cannot establish the paper’s mean-flow enhancement or exponential clogging statistics. The cornerstone preset position applies at restart.

Move the cornerstone along the rim, or disturb an arch with an upward local nudge. Holding Disturb continues applying an explicit exciter force. Released grains are recirculated at the top by an external feeder, as in the source apparatus. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/cornerstone-flow/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
