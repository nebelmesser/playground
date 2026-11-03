# Direction Without a Leader

Vicsek model. Each particle sees only its neighbours. Local adjustments can still produce a shared direction.

The tip of each particle shows its heading. Lower the noise and watch local streams become a shared flow. Polarization 1 means complete agreement; a value near 0 means the headings largely cancel out.

## Source

Tamás Vicsek et al.. [Novel type of phase transition in a system of self-driven particles](https://arxiv.org/abs/cond-mat/0611743) (1995).

## Implementation

```text
θᵢ(t+1)=arg Σⱼ∈Nᵢ exp(iθⱼ)+ηξᵢ
rᵢ(t+1)=rᵢ(t)+v e(θᵢ)
```

700 point particles moving at constant speed. Headings are updated synchronously using a metric neighbourhood and uniform angular noise. Boundaries are periodic; there is no repulsion or leader. This small model is for observation, not for measuring a critical exponent.

Press to turn the headings in a small area into a swirl. The neighbours determine whether the disturbance spreads. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/flocking/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
