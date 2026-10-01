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

export const mutatePlaceGenome = (
  genome: PlaceGenome, seed: number, banned?: ReadonlySet<string>,
): PlaceGenome => {
  const loci = genome.syllables.length * 2 + 1;
  for (let offset = 0; offset < loci; offset += 1) {
    const locus = (Math.abs(seed) + offset) % loci;
    const previous = allele(genome, locus);
    const choices = locus === loci - 1 ? CODAS
      : locus % 2 === 1 ? VOWELS
        : locus === 0 ? FIRST_ONSETS : INNER_ONSETS;
    const alternatives = [...new Set(choices)].filter((value) => value.length === previous.length
      && value !== previous);
    if (alternatives.length === 0) continue;
    for (let attempt = 0; attempt < alternatives.length; attempt += 1) {
      const value = alternatives[(Math.abs(seed + offset * 7) + attempt) % alternatives.length];
      const candidate = withAllele(genome, locus, value);
      const stem = placeStem(candidate);
      if (stem.length <= 8 && pronounceable(candidate) && !banned?.has(stem)) return candidate;
    }
  }
  return cloneGenome(genome);
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

export const placeLabel = (kind: PlaceKind, stem: string): string => {
  const name = `${stem.charAt(0).toUpperCase()}${stem.slice(1)}`;
  if (kind === 'continent') return `${name}ia`;
  const ending = ENDINGS[[...stem].reduce((hash, letter) => hash + letter.charCodeAt(0), 0) % ENDINGS.length];
  return `${name}${ending}`;
};
