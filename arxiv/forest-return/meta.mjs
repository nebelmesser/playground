export default {
  slug: 'forest-return', title: 'What Grows in the Clearing', short: 'Forest fire and renewal', kind: 'forest-return', customView: true,
  hook: 'A forest returns one tree at a time. A fire follows the connections that the forest has made.',
  watch: 'Older trees deepen into green. A lightning strike removes a whole connected patch, leaving a dark scar in which isolated seedlings slowly reappear. Sometimes the fire finds very little. Sometimes an almost invisible bridge lets it cross the forest.',
  gesture: 'Press or drag to ignite trees. A clearing cannot burn until trees grow back into it.',
  legend: 'Green — trees, shaded by age · pale yellow — fire · dark ground — a clearing · red glow — a fading ember',
  equation: 'Empty → tree with probability p per slow tick\nTree → ignition with probability f per slow tick\nFire consumes its four-neighbour tree component',
  limit: 'A 128² Drossel–Schwabl forest-fire lattice with open boundaries. The source burns the connected cluster instantaneously; here its fast event is resolved into nearest-neighbour fire waves, while regrowth and lightning wait until the fire ends. Thus fire-front steps and slow growth ticks are different scales, both exposed in the display. This is a toy of connectivity and renewal, not a weather or ecological forecast. No fuel threshold, grain transfer, sandpile toppling, or critical-exponent claim is present. Grain in the image is fixed per cell; randomness is only tree growth and lightning.',
  paper: { title: 'The self-organized critical forest-fire model on large scales', authors: 'Klaus Schenk · Barbara Drossel · Franz Schwabl', year: 2001, id: 'cond-mat/0105121' },
  controls: [{ key: 'growth', label: 'Tree growth p', min: .001, max: .025, step: .001 }, { key: 'lightning', label: 'Lightning f', min: .000001, max: .00006, step: .000001 }],
  rate: 28, warmup: 450, validationSteps: 3200
};
