export type PlaceKind = 'continent' | 'island' | 'sea' | 'lake';

const VOWELS = 'aeiou';
const CONSONANTS = 'bcdfghklmnprstvw';

export type Rng = () => number;

const alphabetAt = (rng: Rng, alphabet: string): string => (
  alphabet[Math.floor(rng() * alphabet.length)] ?? 'a'
);

/** Odd length so the stem ends on a consonant before the "-ia" suffix. */
export const createPlaceStem = (rng: Rng, banned?: ReadonlySet<string>): string => {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const length = rng() < 0.62 ? 5 : 3;
    let stem = '';
    for (let index = 0; index < length; index += 1) {
      stem += alphabetAt(rng, index % 2 === 0 ? CONSONANTS : VOWELS);
    }
    if (!banned?.has(stem)) return stem;
  }
  let stem = '';
  for (let index = 0; index < 7; index += 1) {
    stem += alphabetAt(rng, index % 2 === 0 ? CONSONANTS : VOWELS);
  }
  return stem;
};

export const placeLabel = (kind: PlaceKind, stem: string): string => {
  const name = `${stem.charAt(0).toUpperCase()}${stem.slice(1)}`;
  if (kind === 'continent') return `${name}ia`;
  if (kind === 'sea') return `Sea of ${name}`;
  if (kind === 'lake') return `Lake ${name}`;
  return `${name} island`;
};
