# Room for One More

Sequential phyllotactic packing. Each new organ takes the first place where it can fit. The arrangement is a history of all those local accommodations.

The newest organs are pale. They gradually form a denser rim as their exclusion radius decreases. Regular spirals and occasional defects arise from packing, without a golden angle. The view slowly rescales to include the growing head; the head itself does not rotate.

## Source

Jonathan Swinton. [Disk-stacking models are consistent with Fibonacci and non-Fibonacci structure in sunflowers](https://arxiv.org/abs/2407.05857) (2024).

## Implementation

```text
Computational cylinder: x ≡ x + 1
r_new = max(r_min, ½ − taper · z_last)
Place at lowest z ≥ z_last with no disk overlap
Radial display: R ∝ √z, θ = 2πx
```

A deterministic Schwendener/Snow disk-stacking model on a cylinder of circumference 1, using circle intersections and all nearby periodic exclusion disks. The smallest valid next height is chosen; ties use a seed-dependent orientation. Following the source’s cylinder-to-capitulum method, centres are then mapped onto a radial head. This square-root map and the small seed glyphs are display choices: the model’s circular inhibition regions live on the cylinder and are distorted by projection. This is geometric exclusion, not an auxin transport model or a simulation of tissue growth. No golden angle or Fibonacci count is fitted. The finite organ budget stops growth honestly; there is no automatic restart.

Press or drag near the outer rim to remove recent organs. The remaining front determines where the following organs can fit. The oldest basal disk is kept as the initial support. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/room-for-one-more/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
