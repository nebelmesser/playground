import type { NameGenes, PlaceGenome } from './place-name';

export type Variant = { value: string; revision: number };
export type SyllableOrigin = { id: number; onset: Variant; vowel: Variant; bridge: Variant };
export type TailOrigin = Variant & { id: number };
export type NameAncestry = {
  syllables: SyllableOrigin[];
  order: number[];
  orderRevision: number;
  coda: TailOrigin;
  ending: TailOrigin;
};

let nextOriginId = 1;
const fallbackAncestry = new WeakMap<NameGenes, NameAncestry>();
const variant = (value: string): Variant => ({ value, revision: 0 });

// Identity, not spelling or random draws, distinguishes independent founders.
// Legacy/manual genes gain metadata without modifying the caller's snapshot.
export const ancestryOf = (genes: NameGenes): NameAncestry => {
  if (genes.ancestry) return genes.ancestry;
  const existing = fallbackAncestry.get(genes);
  if (existing) return existing;
  const syllables = genes.chromosome.syllables.map((part) => ({
    id: nextOriginId++, onset: variant(part.onset), vowel: variant(part.vowel),
    bridge: variant(part.bridge ?? ''),
  }));
  const ancestry: NameAncestry = {
    syllables, order: syllables.map((part) => part.id), orderRevision: 0,
    coda: { id: nextOriginId++, ...variant(genes.chromosome.coda) },
    ending: { id: nextOriginId++, ...variant(genes.chromosome.ending ?? '') },
  };
  fallbackAncestry.set(genes, ancestry);
  return ancestry;
};

export const copyAncestry = (ancestry: NameAncestry): NameAncestry => ({
  syllables: ancestry.syllables.map((part) => ({
    id: part.id, onset: { ...part.onset }, vowel: { ...part.vowel }, bridge: { ...part.bridge },
  })),
  order: [...ancestry.order], orderRevision: ancestry.orderRevision,
  coda: { ...ancestry.coda }, ending: { ...ancestry.ending },
});

// Only actual allele edits advance revisions. Display cuts and phonetic seam
// repairs intentionally keep the underlying homologous alleles unchanged.
export const recordChanges = (genes: NameGenes, before: PlaceGenome): void => {
  const ancestry = copyAncestry(ancestryOf(genes));
  genes.ancestry = ancestry;
  for (let index = 0; index < genes.chromosome.syllables.length; index += 1) {
    const current = genes.chromosome.syllables[index];
    const previous = before.syllables[index];
    const origin = ancestry.syllables[index];
    for (const field of ['onset', 'vowel', 'bridge'] as const) {
      const value = current[field] ?? '';
      if (value !== (previous[field] ?? '')) {
        origin[field] = { value, revision: origin[field].revision + 1 };
      }
    }
  }
  for (const field of ['coda', 'ending'] as const) {
    const value = genes.chromosome[field] ?? '';
    if (value !== (before[field] ?? '')) {
      ancestry[field] = { id: ancestry[field].id, value, revision: ancestry[field].revision + 1 };
    }
  }
};

type WeightedOrigin<T> = { origin: T; weight: number };

const homologousCopies = <T extends { id: number }>(copies: WeightedOrigin<T>[]): WeightedOrigin<T>[] => {
  const active = copies.filter(({ weight }) => Number.isFinite(weight) && weight > 0);
  if (!active.length) throw new Error('Homologous inheritance needs a positive contribution');
  if (active.some(({ origin }) => origin.id !== active[0].origin.id)) {
    throw new Error('Cannot align unrelated gene origins');
  }
  return active;
};

const mergeVariant = (copies: Array<{ variant: Variant; weight: number }>): Variant => {
  const revision = Math.max(...copies.map((copy) => copy.variant.revision));
  const support = new Map<string, number>();
  for (const copy of copies) {
    if (copy.variant.revision !== revision) continue;
    const value = copy.variant.value;
    support.set(value, (support.get(value) ?? 0) + copy.weight);
  }
  const winner = [...support].sort((left, right) => right[1] - left[1]
    || (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0))[0][0];
  return { value: winner, revision };
};

export const mergeSyllable = (copies: WeightedOrigin<SyllableOrigin>[]): SyllableOrigin => {
  const active = homologousCopies(copies);
  const field = (name: 'onset' | 'vowel' | 'bridge'): Variant =>
    mergeVariant(active.map(({ origin, weight }) => ({ variant: origin[name], weight })));
  return { id: active[0].origin.id, onset: field('onset'), vowel: field('vowel'), bridge: field('bridge') };
};

export const mergeTail = (copies: WeightedOrigin<TailOrigin>[]): TailOrigin => {
  const active = homologousCopies(copies);
  return { id: active[0].origin.id,
    ...mergeVariant(active.map(({ origin, weight }) => ({ variant: origin, weight }))) };
};
