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
const INNER_ONSETS = ['l', 'r', 'n', 'm', 't', 's', 'c', 'd', 'v', 'p', 'g', 'b', 'f',
  'br', 'cr', 'dr', 'gr', 'pr', 'tr', 'st'] as const;
const SIMPLE_VOWELS = ['a', 'e', 'i', 'o', 'u'] as const;
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'ae', 'au', 'oe'] as const;
const CODAS = ['n', 'r', 's', 'l', 'm', 't'] as const;
const ENDINGS = ['a', 'us', 'um', 'is', 'or'] as const;
const CONTINENT_ENDINGS = ['ia', 'ea', 'on', 'ar', 'is', 'um'] as const;

const pick = (rng: Rng, choices: readonly string[], offset = 0): string =>
  choices[(Math.floor(rng() * choices.length) + offset) % choices.length];

export const placeStem = (genome: PlaceGenome): string =>
  `${genome.syllables.map((syllable) => syllable.onset + syllable.vowel).join('')}${genome.coda}`;

export const createPlaceGenome = (rng: Rng, banned?: ReadonlySet<string>): PlaceGenome => {
  for (let attempt = 0; attempt < 512; attempt += 1) {
    const syllableCount = rng() < 0.82 || attempt >= 24 ? 2 : 3;
    const syllables: PlaceGenome['syllables'] = [];
    let hasDiphthong = false;
    for (let index = 0; index < syllableCount; index += 1) {
      const onset = pick(rng, index === 0 ? FIRST_ONSETS : INNER_ONSETS,
        index === 0 ? attempt : index === 1 ? Math.floor(attempt / FIRST_ONSETS.length) : 0);
      let vowel = pick(rng, VOWELS);
      if (vowel.length > 1 && hasDiphthong) vowel = pick(rng, SIMPLE_VOWELS);
      if (onset === 'qu' && (vowel === 'u' || vowel === 'au' || vowel === 'oe')) vowel = 'a';
      if (index > 0 && `${onset}${vowel}` === syllables[index - 1].onset + syllables[index - 1].vowel) {
        vowel = pick(rng, VOWELS, 1);
      }
      hasDiphthong ||= vowel.length > 1;
      syllables.push({ onset, vowel });
    }
    const genome = { syllables, coda: pick(rng, CODAS) };
    const stem = placeStem(genome);
    if (stem.length > 8) continue;
    if (!banned?.has(stem)) return genome;
  }
  throw new Error('Could not find an unused place name');
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
        if (stem.length <= 8 && pronounceable(candidate) && !banned?.has(stem)) {
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

export const recombinePlaceGenomes = (
  parents: Array<{ genome: PlaceGenome; weight: number }>,
): PlaceGenome => {
  const ranked = [...parents].sort((a, b) => b.weight - a.weight);
  const dominant = ranked[0];
  if (!dominant) throw new Error('Cannot recombine without a parent');
  const total = ranked.reduce((sum, parent) => sum + Math.max(0, parent.weight), 0);
  if (ranked.length === 1 || total <= 0) return cloneGenome(dominant.genome);
  const result = cloneGenome(dominant.genome);
  const loci = result.syllables.length * 2 + 1;
  let cumulative = 0;
  const shares = ranked.map((parent) => {
    cumulative += Math.max(0, parent.weight) / total;
    return cumulative;
  });
  for (let locus = 0; locus < loci; locus += 1) {
    const fraction = (locus + 0.5) / loci;
    const source = ranked[shares.findIndex((share) => fraction <= share)]?.genome ?? dominant.genome;
    const sourceLocus = locus === loci - 1 ? source.syllables.length * 2
      : Math.min(Math.floor(locus / 2), source.syllables.length - 1) * 2 + locus % 2;
    const inherited = allele(source, sourceLocus);
    if (inherited.length !== allele(result, locus).length) continue;
    const candidate = withAllele(result, locus, inherited);
    if (placeStem(candidate).length <= 8 && pronounceable(candidate)) {
      result.syllables = candidate.syllables;
      result.coda = candidate.coda;
    }
  }
  return result;
};

export const nextPlaceGenomeStep = (
  current: PlaceGenome, target: PlaceGenome, banned?: ReadonlySet<string>,
): PlaceGenome | null => {
  const loci = current.syllables.length * 2 + 1;
  if (target.syllables.length !== current.syllables.length) return null;
  for (let locus = 0; locus < loci; locus += 1) {
    const desired = allele(target, locus);
    if (desired === allele(current, locus)) continue;
    const candidate = withAllele(current, locus, desired);
    if (placeStem(candidate).length <= 8 && pronounceable(candidate)
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
    if (placeStem(candidate).length <= 8 && pronounceable(candidate)
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
