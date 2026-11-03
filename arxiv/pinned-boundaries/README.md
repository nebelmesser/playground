# What Holds the Edge

Small particles can stop a moving grain boundary. Place a small particle across a moving edge. Its two contact points slide; a whole grain can remain because of a few small holds.

Pale grain interfaces shorten by curvature. They disappear inside the gold particles, ending at separate sliding contacts. Three well-spaced particles can hold a grain while unpinned neighbours shrink. Release a particle to reconnect the interrupted interface. The dissolving preset gradually removes those holds.

## Source

Sebastian Florez · Marc Bernacki. [Efficient and accurate simulation of the Smith-Zener pinning mechanism during grain growth using a front-tracking numerical framework](https://arxiv.org/abs/2501.11130) (2025).

## Implementation

```text
v = −μγκn; E = γ × grain-boundary length
Contact: free movement → nearest-point projection onto the circle
Particle dissolution: r′ = −vSPP
```

The 2025 paper introduces explicit circular-particle front tracking and its combination with pinning nodes. This reduction keeps resolved grain-boundary curvature, removal of boundary segments inside each disk, independently sliding contacts and radial projection; tension seeks a 90° meeting with the circular surface. Twelve isolated grains in a matrix replace a full polycrystal: no triple junctions, T1 swaps or quantitative Smith–Zener grain-size statistics. A lumped arclength gradient and remeshing discretize isotropic curvature flow. Releasing or dissolving a particle reconnects the cut interfaces. Grains below area 0.000035 and particles below radius 0.0015 are removed at the resolution limit; no grains appear. Full spontaneous detachment topology and intragranular finite elements are omitted. Particle placement is external, and dissolution changes constraints externally. Fixed particles can cause arrest; the unforced field may settle.

Place particles across a grain edge, or just ahead of it. Release a boundary removes particles under your hand. Several particles around one grain produce a stronger hold than one alone. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/pinned-boundaries/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
