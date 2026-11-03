# Nobody Wins

Cyclic competition. A displaces B, B displaces C, and C displaces A. Waves emerge because no species can win for good.

Find a point where all three colours meet. Boundaries can spiral around it: each species follows the one it can displace.

## Source

Tobias Reichenbach · Mauro Mobilia · Erwin Frey. [Mobility promotes and jeopardizes biodiversity in rock-paper-scissors games](https://arxiv.org/abs/0709.0217) (2007).

## Implementation

```text
∂ₜa = D∇²a + a(1−a−b−c−σc)
Cyclic permutations give the equations for b and c
```

A deterministic reaction–diffusion approximation of the May–Leonard model on a 112² grid. Randomness only enters the initial conditions and interventions. The demographic noise and finite-population extinction studied in the paper are not reproduced here.

Press to populate a small area with one of the three species. The species is selected from a reproducible random sequence. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/cyclic-life/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
