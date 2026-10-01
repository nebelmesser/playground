export type PlaceKind = 'continent' | 'island' | 'lake';

export type Rng = () => number;
export type PlaceGenome = {
  syllables: Array<{ onset: string; vowel: string }>;
  coda: string;
};

// Open syllables and a short final consonant keep the names readable on the map.
// Clusters and diphthongs add variety without producing arbitrary letter strings.
const FIRST_ONSETS = ['v', 'l', 'm', 'n', 's', 'c', 'r', 't', 'p', 'd', 'f', 'g', 'b',
  'pr', 'tr', 'cl', 'cr', 'fl', 'fr', 'gl', 'gr', 'pl', 'br', 'dr', 'st', 'qu'] as const;
const SHORT_ONSETS = FIRST_ONSETS.filter((onset) => onset.length === 1);
const INNER_ONSETS = ['l', 'r', 'n', 'm', 't', 's', 'c', 'd', 'v', 'p', 'g', 'b', 'f',
  'br', 'cr', 'dr', 'gr', 'pr', 'tr', 'st'] as const;
const SIMPLE_VOWELS = ['a', 'e', 'i', 'o', 'u'] as const;
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'ae', 'au', 'oe'] as const;
const CODAS = ['n', 'r', 's', 'l', 'm', 't'] as const;
const ENDINGS = ['a', 'us', 'um', 'is', 'or'] as const;
const CONTINENT_ENDINGS = ['ia', 'ea', 'on', 'ar', 'is', 'um'] as const;
const MAX_STEM_LENGTH = 12;

const pick = (rng: Rng, choices: readonly string[], offset = 0): string =>
  choices[(Math.floor(rng() * choices.length) + offset) % choices.length];

export const placeStem = (genome: PlaceGenome): string =>
  `${genome.syllables.map((syllable) => syllable.onset + syllable.vowel).join('')}${genome.coda}`;

export const createPlaceGenome = (
  rng: Rng, banned?: ReadonlySet<string>, requestedSyllables?: 1 | 2 | 3,
): PlaceGenome => {
  for (let attempt = 0; attempt < 512; attempt += 1) {
    const syllableCount = requestedSyllables ?? (rng() < 0.82 || attempt >= 24 ? 2 : 3);
    const syllables: PlaceGenome['syllables'] = [];
    let hasDiphthong = false;
    for (let index = 0; index < syllableCount; index += 1) {
      const onsets = requestedSyllables === 1 ? SHORT_ONSETS
        : index === 0 ? FIRST_ONSETS : INNER_ONSETS;
      const onset = pick(rng, onsets,
        index === 0 ? attempt : index === 1 ? Math.floor(attempt / FIRST_ONSETS.length) : 0);
      let vowel = pick(rng, requestedSyllables === 1 ? SIMPLE_VOWELS : VOWELS,
        requestedSyllables === 1 ? Math.floor(attempt / SHORT_ONSETS.length) : 0);
      if (vowel.length > 1 && hasDiphthong) vowel = pick(rng, SIMPLE_VOWELS);
      if (onset === 'qu' && (vowel === 'u' || vowel === 'au' || vowel === 'oe')) vowel = 'a';
      if (index > 0 && `${onset}${vowel}` === syllables[index - 1].onset + syllables[index - 1].vowel) {
        vowel = pick(rng, VOWELS, 1);
      }
      hasDiphthong ||= vowel.length > 1;
      syllables.push({ onset, vowel });
    }
    const genome = { syllables, coda: pick(rng, CODAS,
      requestedSyllables === 1 ? Math.floor(attempt / (SHORT_ONSETS.length * SIMPLE_VOWELS.length)) : 0) };
    const stem = placeStem(genome);
    if (stem.length > MAX_STEM_LENGTH) continue;
    if (!banned?.has(stem)) return genome;
  }
  throw new Error('Could not find an unused place name');
};

// A name exposes one more inherited sound when its region gains capacity.
// Moving the old coda to the new onset keeps the complete former name as a
// literal prefix (Var -> Varen), rather than replacing its last consonant.
export const extendPlaceGenome = (
  genome: PlaceGenome, seed: number, banned?: ReadonlySet<string>, reserve?: PlaceGenome,
): PlaceGenome | null => {
  if (genome.syllables.length >= 3) return null;
  if (reserve && reserve.syllables.length > genome.syllables.length
    && placeStem(prefixGenome(reserve, genome.syllables.length)) === placeStem(genome)) {
    const restored = prefixGenome(reserve, genome.syllables.length + 1);
    if (!banned?.has(placeStem(restored))) return restored;
  }
  for (let attempt = 0; attempt < SIMPLE_VOWELS.length * CODAS.length; attempt += 1) {
    const vowel = SIMPLE_VOWELS[(Math.abs(seed) + attempt) % SIMPLE_VOWELS.length];
    const coda = CODAS[(Math.floor(Math.abs(seed) / SIMPLE_VOWELS.length)
      + Math.floor(attempt / SIMPLE_VOWELS.length)) % CODAS.length];
    const candidate = { syllables: [...genome.syllables.map((part) => ({ ...part })),
      { onset: genome.coda, vowel }], coda };
    if (placeStem(candidate).length <= MAX_STEM_LENGTH && !banned?.has(placeStem(candidate))) {
      return candidate;
    }
  }
  return null;
};

// Prefix projection is the inverse of extension: the first consonant of the
// next syllable becomes the shortened name's final consonant.
const prefixGenome = (genome: PlaceGenome, syllables: number): PlaceGenome => ({
  syllables: genome.syllables.slice(0, syllables).map((part) => ({ ...part })),
  coda: syllables < genome.syllables.length
    ? genome.syllables[syllables].onset.charAt(0) : genome.coda,
});

// A smaller descendant keeps the opening sounds of its parent. If another
// place already uses that shortened stem, vary its spelling at the same size.
export const shortenPlaceGenome = (
  genome: PlaceGenome, syllables: 1 | 2, seed: number, banned?: ReadonlySet<string>,
): PlaceGenome => {
  if (genome.syllables.length <= syllables) return cloneGenome(genome);
  const short = prefixGenome(genome, syllables);
  if (syllables === 1) {
    const first = short.syllables[0];
    first.onset = first.onset === 'qu' ? 'c' : first.onset.charAt(0);
    first.vowel = first.vowel.charAt(0);
  }
  if (!banned?.has(placeStem(short))) return short;
  for (let attempt = 0; attempt < short.syllables.length * 2 + 1; attempt += 1) {
    const variant = mutatePlaceGenome(short, seed + attempt, banned);
    if (!banned?.has(placeStem(variant))) return variant;
  }
  return createPlaceGenome(Math.random, banned, syllables);
};

export const createPlaceStem = (rng: Rng, banned?: ReadonlySet<string>): string =>
  placeStem(createPlaceGenome(rng, banned));

const cloneGenome = (genome: PlaceGenome): PlaceGenome => ({
  syllables: genome.syllables.map((syllable) => ({ ...syllable })), coda: genome.coda,
});

const allele = (genome: PlaceGenome, locus: number): string => {
  if (locus === genome.syllables.length * 2) return genome.coda;
  const syllable = genome.syllables[Math.floor(locus / 2)];
  return locus % 2 === 0 ? syllable.onset : syllable.vowel;
};

const withAllele = (genome: PlaceGenome, locus: number, value: string): PlaceGenome => {
  const result = cloneGenome(genome);
  if (locus === result.syllables.length * 2) result.coda = value;
  else if (locus % 2 === 0) result.syllables[Math.floor(locus / 2)].onset = value;
  else result.syllables[Math.floor(locus / 2)].vowel = value;
  return result;
};

const pronounceable = (genome: PlaceGenome): boolean => genome.syllables.every(
  ({ onset, vowel }) => onset !== 'qu' || !['u', 'au', 'oe'].includes(vowel),
);

// A geometric tail makes each additional changed gene less likely. Heating
// can raise the continuation chance without replacing the family's spelling.
export const mutationMagnitude = (
  rng: Rng, continuation: number, minimum = 1, maximum = 4,
): number => {
  let magnitude = minimum;
  while (magnitude < maximum && rng() < continuation) magnitude += 1;
  return magnitude;
};

export const mutatePlaceGenome = (
  genome: PlaceGenome, seed: number, banned?: ReadonlySet<string>, changes = 1,
): PlaceGenome => {
  const loci = genome.syllables.length * 2 + 1;
  let result = cloneGenome(genome);
  const changed = new Set<number>();
  for (let step = 0; step < Math.min(changes, loci); step += 1) {
    let next: PlaceGenome | null = null;
    for (let offset = 0; offset < loci && !next; offset += 1) {
      const locus = (Math.abs(seed) + step + offset) % loci;
      if (changed.has(locus)) continue;
      const previous = allele(result, locus);
      const choices = locus === loci - 1 ? CODAS
        : locus % 2 === 1 ? VOWELS
          : locus === 0 ? FIRST_ONSETS : INNER_ONSETS;
      const alternatives = [...new Set(choices)].filter((value) => value.length === previous.length
        && value !== previous);
      for (let attempt = 0; attempt < alternatives.length; attempt += 1) {
        const value = alternatives[(Math.abs(seed + offset * 7 + step * 11) + attempt) % alternatives.length];
        const candidate = withAllele(result, locus, value);
        const stem = placeStem(candidate);
        if (stem.length <= MAX_STEM_LENGTH && pronounceable(candidate) && !banned?.has(stem)) {
          next = candidate;
          changed.add(locus);
          break;
        }
      }
    }
    if (!next) break;
    result = next;
  }
  return result;
};

const compactGenome = (genome: PlaceGenome): PlaceGenome => {
  const result = cloneGenome(genome);
  while (placeStem(result).length > MAX_STEM_LENGTH) {
    let shortened = false;
    for (let index = result.syllables.length - 1; index >= 0; index -= 1) {
      const part = result.syllables[index];
      if (part.onset.length > 1) {
        part.onset = part.onset === 'qu' ? 'c' : part.onset.charAt(0);
        shortened = true;
        break;
      }
      if (part.vowel.length > 1) {
        part.vowel = part.vowel.charAt(0);
        shortened = true;
        break;
      }
    }
    if (!shortened) break;
  }
  return result;
};

// Each parent contributes a contiguous sound block. Divide the available
// syllables by area using largest remainders; a tiny donor need not displace a
// large parent's sounds. Equal short parents concatenate (Var + Mel -> Varmel).
export const recombinePlaceGenomes = (
  parents: Array<{ genome: PlaceGenome; weight: number }>, desiredSyllables?: 1 | 2 | 3,
): PlaceGenome => {
  const ranked = [...parents].filter((parent) => parent.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  if (ranked.length === 0) throw new Error('Cannot recombine without a parent');
  const slots = desiredSyllables ?? Math.min(3,
    ranked.reduce((sum, parent) => sum + parent.genome.syllables.length, 0));
  const total = ranked.reduce((sum, parent) => sum + parent.weight, 0);
  const quotas = ranked.map((parent) => parent.weight / total * slots);
  const apportioned = quotas.map(Math.floor);
  const remainders = ranked.map((_, index) => index)
    .sort((a, b) => (quotas[b] - apportioned[b]) - (quotas[a] - apportioned[a])
      || ranked[b].weight - ranked[a].weight || a - b);
  for (let remaining = slots - apportioned.reduce((sum, count) => sum + count, 0), index = 0;
    remaining > 0; remaining -= 1, index += 1) apportioned[remainders[index]] += 1;
  const sources = ranked.filter((_, index) => apportioned[index] > 0);
  const counts = apportioned.filter((count) => count > 0);
  const sourceAt = (index: number): PlaceGenome => {
    let source = cloneGenome(sources[index].genome);
    while (source.syllables.length < counts[index]) {
      const next = extendPlaceGenome(source, placeStem(source).length * 131 + index * 17);
      if (!next) break;
      source = next;
    }
    return source;
  };
  const first = sourceAt(0);
  let result = prefixGenome(first, counts[0]);
  for (let parent = 1; parent < sources.length; parent += 1) {
    const source = sourceAt(parent);
    for (let index = 0; index < counts[parent]; index += 1) {
      const part = source.syllables[index];
      const coda = index + 1 < source.syllables.length
        ? source.syllables[index + 1].onset.charAt(0) : source.coda;
      result = compactGenome({
        syllables: [...result.syllables,
          { onset: result.coda + (index === 0 ? part.onset : part.onset.slice(1)), vowel: part.vowel }],
        coda,
      });
    }
  }
  return result;
};

export const nextPlaceGenomeStep = (
  current: PlaceGenome, target: PlaceGenome, banned?: ReadonlySet<string>,
): PlaceGenome | null => {
  if (target.syllables.length < current.syllables.length) {
    const short = prefixGenome(current, current.syllables.length - 1);
    return banned?.has(placeStem(short)) ? null : short;
  }
  if (target.syllables.length > current.syllables.length) {
    const prefix = prefixGenome(target, current.syllables.length);
    if (placeStem(prefix) === placeStem(current)) {
      const longer = prefixGenome(target, current.syllables.length + 1);
      return banned?.has(placeStem(longer)) ? null : longer;
    }
    target = prefix;
  }
  const loci = current.syllables.length * 2 + 1;
  for (let locus = 0; locus < loci; locus += 1) {
    const desired = allele(target, locus);
    if (desired === allele(current, locus)) continue;
    const candidate = withAllele(current, locus, desired);
    if (placeStem(candidate).length <= MAX_STEM_LENGTH && pronounceable(candidate)
      && !banned?.has(placeStem(candidate))) return candidate;
  }
  return null;
};

// A cold region borrows one compatible sound from an established neighbour.
// The recipient keeps its syllable count and total length, so its label can
// stay in the same seat while its spelling gradually approaches the donor's.
export const borrowPlaceGenomeGene = (
  current: PlaceGenome, donor: PlaceGenome, seed: number, banned?: ReadonlySet<string>,
): PlaceGenome | null => {
  const loci = current.syllables.length * 2 + 1;
  for (let offset = 0; offset < loci; offset += 1) {
    const locus = (Math.abs(seed) + offset) % loci;
    const donorLocus = locus === loci - 1 ? donor.syllables.length * 2
      : Math.min(Math.floor(locus / 2), donor.syllables.length - 1) * 2 + locus % 2;
    const desired = allele(donor, donorLocus);
    if (desired === allele(current, locus) || desired.length !== allele(current, locus).length) continue;
    const candidate = withAllele(current, locus, desired);
    if (placeStem(candidate).length <= MAX_STEM_LENGTH && pronounceable(candidate)
      && !banned?.has(placeStem(candidate))) return candidate;
  }
  return null;
};

export const placeLabel = (kind: PlaceKind, stem: string): string => {
  const name = `${stem.charAt(0).toUpperCase()}${stem.slice(1)}`;
  const hash = [...stem].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const endings = kind === 'continent' ? CONTINENT_ENDINGS : ENDINGS;
  const ending = endings[hash % endings.length];
  return `${name}${ending}`;
};
