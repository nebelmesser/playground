# What Grows in the Clearing

Forest fire and renewal. A forest returns one tree at a time. A fire follows the connections that the forest has made.

Older trees deepen into green. A lightning strike removes a whole connected patch, leaving a dark scar in which isolated seedlings slowly reappear. Sometimes the fire finds very little. Sometimes an almost invisible bridge lets it cross the forest.

## Source

Klaus Schenk · Barbara Drossel · Franz Schwabl. [The self-organized critical forest-fire model on large scales](https://arxiv.org/abs/cond-mat/0105121) (2001).

## Implementation

```text
Empty → tree with probability p per slow tick
Tree → ignition with probability f per slow tick
Fire consumes its four-neighbour tree component
```

A 128² Drossel–Schwabl forest-fire lattice with open boundaries. The source burns the connected cluster instantaneously; here its fast event is resolved into nearest-neighbour fire waves, while regrowth and lightning wait until the fire ends. Thus fire-front steps and slow growth ticks are different scales, both exposed in the display. This is a toy of connectivity and renewal, not a weather or ecological forecast. No fuel threshold, grain transfer, sandpile toppling, or critical-exponent claim is present. Grain in the image is fixed per cell; randomness is only tree growth and lightning.

Press or drag to ignite trees. A clearing cannot burn until trees grow back into it. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/forest-return/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
