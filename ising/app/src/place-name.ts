export type PlaceKind = 'continent' | 'island' | 'lake';

export type Rng = () => number;

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

export const createPlaceStem = (rng: Rng, banned?: ReadonlySet<string>): string => {
  for (let attempt = 0; attempt < 512; attempt += 1) {
    const syllableCount = rng() < 0.82 || attempt >= 24 ? 2 : 3;
    const syllables: string[] = [];
    let hasDiphthong = false;
    for (let index = 0; index < syllableCount; index += 1) {
      const onset = pick(rng, index === 0 ? FIRST_ONSETS : INNER_ONSETS,
        index === 0 ? attempt : index === 1 ? Math.floor(attempt / FIRST_ONSETS.length) : 0);
      let vowel = pick(rng, VOWELS);
      if (vowel.length > 1 && hasDiphthong) vowel = pick(rng, SIMPLE_VOWELS);
      if (onset === 'qu' && (vowel === 'u' || vowel === 'au' || vowel === 'oe')) vowel = 'a';
      if (index > 0 && `${onset}${vowel}` === syllables[index - 1]) {
        vowel = pick(rng, VOWELS, 1);
      }
      hasDiphthong ||= vowel.length > 1;
      syllables.push(`${onset}${vowel}`);
    }
    const stem = `${syllables.join('')}${pick(rng, CODAS)}`;
    if (stem.length > 8) continue;
    if (!banned?.has(stem)) return stem;
  }
  throw new Error('Could not find an unused place name');
};

export const placeLabel = (kind: PlaceKind, stem: string): string => {
  const name = `${stem.charAt(0).toUpperCase()}${stem.slice(1)}`;
  if (kind === 'continent') return `${name}ia`;
  const ending = ENDINGS[[...stem].reduce((hash, letter) => hash + letter.charCodeAt(0), 0) % ENDINGS.length];
  return `${name}${ending}`;
};
