# Enough to Take a Step

A quantum wall follows a small measurement. The wall needs to know only the leftmost position. Reading everything changes what can happen next.

The luminous triangle is a map of possible pairs of occupied positions. Its horizontal and vertical coordinates are the two site positions, measured from the wall. The strip below shows one-body density. The ladder at the right uses absolute sites: the gold wall climbs after successful reads, and blue marks show occupation above it. Each read can move the wall uphill without resolving the rest of the state.

## Source

Kangqiao Liu · Jie Gu · Deyou Chen. [Collective advantage from a minimal record in a quantum information engine](https://arxiv.org/abs/2609.24558) (2026).

## Implementation

```text
H = −∑ⱼ(c†ⱼ₊₁cⱼ+h.c.) + α∑ⱼjnⱼ
Pₘ = nₘ∏ⱼ<ₘ(1−nⱼ)
|Ψ′⟩ = TₘPₘe^(−iHτ)|Ψ⟩ / √pₘ
```

Two noninteracting spin-polarized fermions, initially at sites 0 and 3, on 56 sites use complex occupied orbitals, not classical particle probabilities. The quadratic Hamiltonian and edge-only Lüders projection follow the 2026 paper, Eqs. (1–5) and Appendix A. Gaussian/Slater conditioning removes rows below the measured minimum, orthonormalizes the occupied subspace, pins one orbital at the measured site and preserves the remaining conditional coherence. Full readout samples the exact two-fermion determinant distribution. The wall is inserted only into the measured empty region; translating the simulation frame does not erase ascent. A unitary Crank–Nicolson approximation uses Δt=0.025 and two substeps per tick. Finite right truncation is reflecting, unlike the source half-line. α=0.05–0.4 and cycle time 0.7–4 are reduced units; no claim of reproducing the paper’s optimized collective efficiency. Pair brightness has a fixed logarithmic scale; the square shows the first 12 sites, with its visible occupation fraction below. The physical ladder shows a 24-site window in absolute coordinates and pages by 12 sites only when needed to keep the advancing wall in view. Small gold ticks mark earlier measured wall levels. A held read postpones the next measurement; release reads once, cancellation does not read. Automatic measurement timing is an explicit protocol, not an autonomous force. Recorded information is the sum of outcome surprisals, without a heat-bath or erasure-cost model.

Hold a read tool to let the fermions spread, then release for one measurement and wall step. Read every position collapses to a full occupation configuration. Stop measuring leaves the state to evolve freely. Selecting a read tool also selects the automatic protocol; Stop measuring stops automatic reads immediately. With a read protocol selected, automatic cycles continue after release. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/measured-ascent/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
