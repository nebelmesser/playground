# What the Surface Asks

A liquid sheet follows written chemistry. Write beneath the liquid. A change in the surface starts a withdrawal somewhere else.

The sheet begins almost flat. Thin places open, their moving rims carry liquid, and deeper pools remain. Draw a wettable route or a repellent divide, then watch where the same liquid goes. Chemistry contours stay visible while paused.

## Source

Tilman Richter · Paolo Malgaretti · Jens Harting. [Modelling of the dewetting of ultra-thin liquid films on chemically patterned substrates: linear spectrum and deposition patterns](https://arxiv.org/abs/2503.03627) (2025).

## Implementation

```text
∂ₜh = ∇·[Q(h)∇p],  Q = h(2h²+6bh+3b²)/(6μ)
p = −γ∇²h − γ(1−cosθ(x,y))φ′(h)
φ(h) = [8(h*/h)²−2(h*/h)⁸]/6
```

Source Eqs.(1–5): conserved thin-film hydrodynamics on a physically flat, chemically patterned substrate. The 2025 work quantifies how smooth versus abrupt chemical patterns change rupture sites and droplet counts; it does not introduce the underlying thin-film equation. This reduced 96² periodic model uses h*=0.22, b=0.035, Δx=0.7 and dimensionless γ=μ=1. A symmetric finite-volume flux integrates the full height-dependent mobility; adaptive explicit steps are accepted only when positive and decreasing the discrete capillary-plus-wetting energy. No liquid is inserted, removed or clipped. A smooth, static starter pattern supplies heterogeneous contact angles; initial height noise is the only random perturbation. Surface contrast changes θ around 30°, and chemical sharpness changes a bounded tanh transformation of the drawn map. Drawing and these two controls explicitly perform work by changing the substrate energy. The thickness control takes effect on restart. Lubrication/Stokes approximation, with a molecular precursor standing for dry ground; large slopes/contact angles are qualitative, with no inertia, evaporation or contact-angle hysteresis. A closed sheet eventually settles rather than being automatically disturbed or restarted.

Choose a surface tool, then press and drag. Green contours mark more wettable ground; amber contours mark more repellent ground. The brush changes contact angle beneath the sheet and leaves its volume untouched. Restore brings back the original chemistry, not the earlier liquid shape. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/written-wetting/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
