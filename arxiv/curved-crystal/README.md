# The Ground Changes the Meeting

Curvature redirects the repair of a crystal. Two imperfections move toward a meeting. The shape beneath them changes how they arrive.

The bright points are reconstructed atomic density, not particles following drawn routes. Opposite dislocations distort the rows as they move and can annihilate. Raise part of their support, or flatten it without resetting the crystal. When the patch has repaired, introduce another opposite pair.

## Source

Marcello De Donno · Luiza Angheluta · Marco Salvalaglio. [Dislocation dynamics on deformable surfaces](https://arxiv.org/abs/2602.14348) (2026).

## Implementation

```text
ψ = Σₙηₙeⁱᵏⁿ·ˣ + c.c.
F = ∫[AΣ|Gₙˢηₙ|² + BS − 2t(η₁η₂η₃+c.c.) + 3vS²−(3v/2)Σ|ηₙ|⁴]dS
∂ₜηₙ = −M|kₙ|ˢ² δF/δηₙ* , S=Σ|ηₙ|²
```

A fixed-support reduction of the 2026 surface-APFC study, particularly Section VI and Eqs.(6),(11–13). Three complex triangular-lattice amplitudes evolve by the actual variational gradient of a surface free energy. The supporting Monge height is held between explicit edits; the source’s coupled height equation, spontaneous buckling and resulting self-propulsion are not implemented. A 72² periodic cotangent triangulation approximates the Laplace–Beltrami operator; gauge phases implement G=e⁻ⁱᵏ·ˣΔSeⁱᵏ·ˣ+q. The constant q is the flat discrete symbol so a uniform flat crystal is exactly compatible. A canonical bounded triangular-PFC polynomial is used with B=−0.12,t=0.5,v=1; these normalized coefficients are illustrative, not a verbatim quantitative fit to the source polynomial. Adaptive explicit steps accept only free-energy descent at fixed support, with a tick of 0.075. Initial opposite-charge dipoles use a smooth periodic far-field window; adding a pair is explicit external preparation. Editing height performs work. Density is reconstructed from the evolving amplitudes; circles track actual phase winding. Quantitative defect speeds, atomistic dynamics, mass transport and large rotations are outside this coarse amplitude approximation. No phase-oscillator drive, random forcing or automatic defect reinsertion maintains motion; a repaired crystal can genuinely settle.

Raise and Flatten alter a held supporting surface. Introduce a defect pair writes an explicit neutral Burgers disturbance into the crystal. Repeated drag remains bounded; neither tool restores an earlier amplitude field. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/curved-crystal/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
