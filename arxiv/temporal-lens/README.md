# The Dispersed Light Returns

A negative-index temporal lens. A field spreads until the medium changes. Its waves then find their earlier shape by taking the next physical step.

The border changes when the index switches sign. Physical time keeps increasing while Maxwell phase evolution reverses. Playback speed controls how slowly the field returns.

## Source

Oded Schiller · Yonatan Plotnik · Guy Bartal · Mordechai Segev. [Negative Index Makes a Perfect Time-Domain Lens, Generating Slow Playback of Ultrafast Events](https://arxiv.org/abs/2512.03985) (2025).

## Implementation

```text
∂ₜD = (∇×B)/μ(t), ∂ₜB = −(∇×D)/ε(t)
ε=μ=n; dτ/dt=1/n
D̈k(τ)+|k|²Dk(τ)=0
n: +1 → −1/v
```

An ideal impedance-matched temporal interface from the 2025 study. Exact Fourier rotations evolve the propagating transverse Maxwell sector on a periodic 128² square; stored frames are never played backward. D and its magnetic conjugate remain continuous when both ε and μ change sign. The negative-index state persists after the single scheduled switch, so waves continue beyond their first return. The interface-time control takes effect on restart. This reduction omits dispersion, losses, an experimental metamaterial, and the paper’s evanescent-field superresolution claim. A conservative norm measures D and the magnetic sector, not medium energy across the pumped interface. Added pulses are limited to a finite energy budget.

Drag to add a bounded local electric pulse. New pulses also follow the current sign of the medium. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/temporal-lens/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
