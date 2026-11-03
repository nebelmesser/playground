export default {
  slug: 'room-for-one-more', title: 'Room for One More', short: 'Sequential phyllotactic packing', kind: 'room-for-one-more', customView: true,
  hook: 'Each new organ takes the first place where it can fit. The arrangement is a history of all those local accommodations.',
  watch: 'The newest organs are pale. They gradually form a denser rim as their exclusion radius decreases. Regular spirals and occasional defects arise from packing, without a golden angle. The view slowly rescales to include the growing head; the head itself does not rotate.',
  gesture: 'Press or drag near the outer rim to remove recent organs. The remaining front determines where the following organs can fit. The oldest basal disk is kept as the initial support.',
  legend: 'Pale — newly placed organs · violet — older organs · all positions arise from sequential exclusion',
  equation: 'Computational cylinder: x ≡ x + 1\nr_new = max(r_min, ½ − taper · z_last)\nPlace at lowest z ≥ z_last with no disk overlap\nRadial display: R ∝ √z, θ = 2πx',
  limit: 'A deterministic Schwendener/Snow disk-stacking model on a cylinder of circumference 1, using circle intersections and all nearby periodic exclusion disks. The smallest valid next height is chosen; ties use a seed-dependent orientation. Following the source’s cylinder-to-capitulum method, centres are then mapped onto a radial head. This square-root map and the small seed glyphs are display choices: the model’s circular inhibition regions live on the cylinder and are distorted by projection. This is geometric exclusion, not an auxin transport model or a simulation of tissue growth. No golden angle or Fibonacci count is fitted. The finite organ budget stops growth honestly; there is no automatic restart.',
  paper: { title: 'Disk-stacking models are consistent with Fibonacci and non-Fibonacci structure in sunflowers', authors: 'Jonathan Swinton', year: 2024, id: '2407.05857' },
  controls: [{ key: 'taper', label: 'How quickly organs get smaller', min: .008, max: .11, step: .001 }, { key: 'smallest', label: 'Smallest exclusion radius', min: .025, max: .14, step: .005 }],
  rate: 4, warmup: 150, validationSteps: 1050
};
