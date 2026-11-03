# A Garden Held by Falling

Self-gravitating particles. Every point falls toward every other point. Rotation prevents a simple ending, and close encounters rearrange the garden.

The disc can bend into a bar, pass through a collapse or exchange stars with its neighbour. Trails show recent physical trajectories. Particles can leave the visible window; there is no containing wall.

## Source

Sven De Rijcke · Jean-Baptiste Fouvry · Walter Dehnen. [How gravitational softening affects galaxy stability I. Linear mode analysis of disc galaxies](https://arxiv.org/abs/1812.07001) (2018).

## Implementation

```text
r̈ᵢ = Σⱼ≠ᵢ Gmⱼ(rⱼ−rᵢ) / (|rⱼ−rᵢ|²+ε²)³ᐟ²
Vᵢⱼ = −Gmᵢmⱼ / √(|rᵢ−rⱼ|²+ε²)
```

160 equal masses move in a plane under direct pairwise 3D Newtonian gravity with Plummer softening. A kick–drift–kick leapfrog uses Δt=0.008, three substeps per displayed step. No collisions, merging, halo, gas or stellar evolution are included. Initial discs are illustrative, not exact distribution-function equilibria. As the paper explains, softening biases disc stability; this finite, collisional toy does not reproduce its collisionless mode calculations.

Press and drag to give nearby stars a small tangential impulse. An equal overall correction keeps total linear momentum unchanged. The energy reference restarts after each impulse. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/gravity-garden/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
