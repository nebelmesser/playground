# The Other Ends Meet

A local joining can reconnect a distant pair. Join two ends. The partners they leave behind may find themselves joined, far from your hand.

Gold threads are the result of the latest measurement; faint red threads show what it replaced. Drag from one site to another to see the remote partners reconnect. Separate a site to leave both ends loose. The background continues the same pairing and separation process slowly.

## Source

Will Holdhusen · Bailey M. McAmis · Armin Rahmani. [Classical Cellular Automaton for Measurement-Only Entanglement Transitions](https://arxiv.org/abs/2609.28743) (2026).

## Implementation

```text
(a,c),(b,d) → (a,b),(c,d)
single-site measurement: (a,b) → a,b unpaired
P(i,j) ∝ |i−j|⁻ᵅ; S(A) = number of pairs leaving A
```

Exact matching dynamics from the 2026 paper: Bell measurements on two paired sites swap their former partners; one or two unpaired sites follow the corresponding replacement/creation rule. Single-site measurements break a pair. Open-chain pair lengths are sampled with weight (N−r)r⁻ᵅ, so each candidate pair has the stated power-law weight. The paper’s novelty is an exact classical representation of measurement-only entanglement transitions. The 96-site chain is drawn as a bent arc, not a periodic ring. Bell-state labels and individual measurement outcomes are omitted because they do not affect matching or subsystem entropies. Only pairwise entanglement is represented; this is not a general quantum computer. One visible trajectory does not establish the paper’s ensemble scaling laws. Pointer measurements are externally selected additions to the same dynamics.

Join ends makes Bell measurements; Separate makes single-site measurements. Every gesture changes the actual matching. The gap at the top marks the two ends of an open chain. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/measured-bonds/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
