# A Crowd Without Attraction

Active matter. Particles slow down in a crowd. That creates a feedback loop which brings them together.

Warm dots have more neighbours. They stay in place longer while other particles arrive. Switch to Gas and watch the clusters disperse.

## Source

Michael E. Cates · Julien Tailleur. [Motility-Induced Phase Separation](https://arxiv.org/abs/1406.3533) (2014).

## Implementation

```text
ṙᵢ = v(ρᵢ)e(θᵢ) + soft repulsion
v(ρ)=v₀[1−s(1−e^(−ρ/2.2))]
dθ = √(2Dᵣ) dW
```

An illustration of the MIPS mechanism using density-dependent speed: 640 point particles with soft, short-range repulsion. This is a quorum-sensing model, not a quantitative simulation of hard active disks. Density is smoothed over radius 0.055; boundaries are periodic.

Press a cluster to turn nearby particles outwards. This briefly changes their directions; it does not apply a lasting force. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/active-matter/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
