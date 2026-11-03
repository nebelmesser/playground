# When Nearness Is Not Enough

Bring populations together and watch whether gene flow returns. Carry a small population across the field. Being near another group may no longer be enough to make a future together.

Colour marks globally connected genetic compatibility groups. Each generation replaces the adults with recombined offspring nearby. Raise the similarity required for mating, or carry a neighbourhood into another colour. Pale rings follow moved genomes through their descendants; faint red rings mark parents that found no mate.

## Source

Larissa G. Landucci · Marcus A. M. de Aguiar. [Speciation, extinction and explosions induced by sudden environmental changes](https://arxiv.org/abs/2609.13349) (2026).

## Implementation

```text
q(a,b) = 1 − 2 Hamming(a,b)/B
Mate only if r ≤ R and q ≥ qmin; offspring recombine both parents + mutation.
Infinite preset: q′ab = e⁻⁴ᵘ (qAC+qAD+qBC+qBD)/4
```

The 2026 study tests sudden changes in mating range, carrying capacity and assortativity, finding different diversity responses for finite and infinite genomes. This model implements its non-overlapping sexual generations, 1,500 independent binary loci, per-locus recombination and mutation; the Infinite genome preset instead uses its exact similarity-matrix recurrence. The reflecting 80×80 lattice and smaller population reduce cost. The printed local-density normalization is dimensionally inconsistent with the stated mean density; here density is compared with 1.2 M₀/L². Compatibility groups are exact global connected components, refreshed every five generations and immediately after threshold changes. Colour continuity uses largest surviving group overlap; colour is not a gene or ancestry. External transplanting and thinning are additional manipulations. This neutral model has no adaptation, competition for particular resources or prediction for a real species. Extinction is possible and is not reset.

Move a population picks up the neighbourhood under your hand; drag it elsewhere. Make a clearing removes individuals. Genomes are never recoloured or edited by a gesture. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/separate-futures/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
