import {
  ancestryOf, copyAncestry, mergeSyllable, mergeTail, recordChanges,
  type NameAncestry, type SyllableOrigin, type TailOrigin,
} from './name-ancestry';

export type PlaceKind = 'continent' | 'island' | 'lake';
export type Rng = () => number;
export type PlaceSyllable = { onset: string; vowel: string; bridge?: string };
export type PlaceGenome = {
  syllables: PlaceSyllable[];
  coda: string;
  ending?: string;
};
const boundary = (syllable: PlaceSyllable): string => (syllable.bridge ?? '') + syllable.onset;
export const placeStem = (genome: PlaceGenome): string =>
  `${genome.syllables.map((part) => boundary(part) + part.vowel).join('')}${genome.coda}${genome.ending ?? ''}`;

export type NameGenes = {
  chromosome: PlaceGenome;
  ancestry?: NameAncestry;
  mutability: number;
  cooldown: number;
  generation: number;
};
export type GeneticParent = { genes: NameGenes; genome?: PlaceGenome; weight: number };
export type NameProposal = {
  genes: NameGenes;
  genome: PlaceGenome;
  capacity: 1 | 2 | 3;
  cause: 'growth' | 'shrink' | 'mutation' | 'recombination';
};
type Capacity = NameProposal['capacity'];
type Environment = {
  areaFraction: number; temperature: number; elapsed: number; now: number;
  banned?: ReadonlySet<string>;
};

const CONSONANTS = ['v', 'l', 'm', 'n', 's', 'c', 'r', 't', 'p', 'd', 'f', 'g', 'b'];
const CLUSTERS = ['br', 'cr', 'dr', 'gr', 'pr', 'tr', 'cl', 'fl', 'gl', 'pl', 'fr', 'st'];
const FIRST_ONSETS = ['', '', ...CONSONANTS, ...CLUSTERS, 'qu'];
const INNER_ONSETS = [...CONSONANTS, ...CLUSTERS];
const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const NUCLEI = [...VOWELS, 'ae', 'au', 'oe'];
const CODAS = ['n', 'r', 's', 'l', 'm', 't'];
const ENDINGS = ['a', 'us', 'um', 'is', 'or', 'ia', 'ea', 'ium', 'ius', 'aris', 'ensis'];
// The bridge closes the preceding syllable, the onset starts the next one.
// Legal pairs give us nasal/stop, liquid/stop and geminate junctions rather
// than arbitrary consonant stacks. Empty bridges retain open syllables too.
const BRIDGES: Record<string, string[]> = {
  '': ['n', 'r', 'l', 'm', 's', 't'],
  b: ['', 'm', 'r', 'l'], p: ['', 'm', 'r', 'l'],
  d: ['', 'n', 'r', 'l'], t: ['', 'n', 'r', 'l', 's', 'c'],
  c: ['', 'n', 'r', 's'], g: ['', 'n', 'r', 'l'],
  f: ['', 'r', 'l'], s: ['', 'n', 'r', 'l'],
  m: ['', 'r', 'l', 'm'], n: ['', 'r', 'n'],
  l: ['', 'l'], r: ['', 'r'], v: ['', 'l', 'r'],
  tr: ['', 's', 'n'], dr: ['', 'n'], cr: [''], gr: [''],
  br: ['', 'm'], pr: ['', 'm'], cl: [''], fl: [''],
  gl: [''], pl: [''], fr: [''], st: ['', 'n'],
};
const SALTATION_PROBABILITY = 0.035;
const MAX_NAME_LENGTH = 14;
const CODA_LOCUS = 9;
const ENDING_LOCUS = 10;
const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
const clone = (genome: PlaceGenome): PlaceGenome => ({
  ...genome, syllables: genome.syllables.map((part) => ({ ...part })),
});
const draw = (rng: Rng): number => clamp(rng(), 0, 1 - Number.EPSILON);
const choose = (rng: Rng, values: string[]): string => values[Math.floor(draw(rng) * values.length)];
const copyGenes = (genes: NameGenes): NameGenes => ({
  ...genes, chromosome: clone(genes.chromosome), ancestry: copyAncestry(ancestryOf(genes)),
});
const bridgesFor = (onset: string): string[] => BRIDGES[onset] ?? [''];

// Capacity is expression, not DNA deletion. A dead band prevents waves near a
// size boundary from alternately growing and cutting the same inscription.
export const nameCapacity = (fraction: number, current?: Capacity): Capacity => {
  if (current === undefined) return fraction < 0.012 ? 1 : fraction < 0.03 ? 2 : 3;
  if (current === 1) return fraction >= 0.0132 ? 2 : 1;
  if (current === 2) return fraction < 0.0108 ? 1 : fraction >= 0.033 ? 3 : 2;
  return fraction < 0.0108 ? 1 : fraction < 0.027 ? 2 : 3;
};

export const nameMutationRate = (temperature: number): number =>
  0.025 * Math.exp(clamp((temperature - 2.27) * 5, -12, 12));

// The whole boundary, including its bridge, closes a shorter form. Growth
// unfolds the same DNA: Val -> Valter -> Valterium; no suffix is rerolled.
export const expressName = (chromosome: PlaceGenome, capacity: Capacity): PlaceGenome => ({
  syllables: chromosome.syllables.slice(0, capacity).map((part) => ({ ...part })),
  coda: capacity < 3 ? boundary(chromosome.syllables[capacity]).charAt(0) : chromosome.coda,
  ending: capacity === 3 ? chromosome.ending ?? '' : '',
});

const valid = (genome: PlaceGenome): boolean => {
  const first = genome.syllables[0];
  return first.onset.length + first.vowel.length <= 3
    && genome.syllables.filter((part) => part.vowel.length > 1).length <= 1
    && genome.syllables.every((part, index) =>
      (part.onset !== 'qu' || !['u', 'au', 'oe'].includes(part.vowel))
      && (index === 0 ? !part.bridge : bridgesFor(part.onset).includes(part.bridge ?? ''))
      && (index === 0 || part.onset !== genome.syllables[index - 1].onset
        || part.vowel !== genome.syllables[index - 1].vowel))
    && placeStem(genome).length <= MAX_NAME_LENGTH;
};

// Repair only newly joined or cut chromosomes; ordinary mutations must find
// an already legal allele. Endings and the founder's initial signature survive
// length compaction, which only simplifies the internal consonant junctions.
const repair = (chromosome: PlaceGenome): PlaceGenome => {
  const result = clone(chromosome);
  result.syllables[0].bridge = '';
  let diphthongs = 0;
  for (let index = 0; index < 3; index += 1) {
    const part = result.syllables[index];
    if ((index === 0 && part.onset.length + part.vowel.length > 3)
      || (part.vowel.length > 1 && diphthongs > 0)) part.vowel = part.vowel.charAt(0);
    if (part.onset === 'qu' && ['u', 'au', 'oe'].includes(part.vowel)) part.vowel = 'a';
    if (index > 0 && !bridgesFor(part.onset).includes(part.bridge ?? '')) {
      const legal = bridgesFor(part.onset);
      part.bridge = legal.includes('') ? '' : legal[0];
    }
    if (part.vowel.length > 1) diphthongs += 1;
  }
  while (placeStem(result).length > MAX_NAME_LENGTH) {
    const part = result.syllables.slice(1).reverse()
      .find((item) => (item.bridge && item.onset) || item.onset.length > 1 || item.vowel.length > 1);
    if (!part) break;
    if (part.bridge && part.onset) part.bridge = '';
    else if (part.onset.length > 1) part.onset = part.onset.charAt(0);
    else part.vowel = part.vowel.charAt(0);
  }
  // Compaction can turn gr-o into g-o beside another g-o. Separate those
  // nuclei only after all consonant reductions have finished.
  for (let index = 1; index < 3; index += 1) {
    const before = result.syllables[index - 1];
    const part = result.syllables[index];
    if (before.onset === part.onset && before.vowel === part.vowel) {
      part.vowel = VOWELS[(VOWELS.indexOf(part.vowel.charAt(0)) + 2) % VOWELS.length];
    }
  }
  return result;
};

const founder = (rng: Rng): NameGenes => {
  const syllables: PlaceSyllable[] = [];
  let diphthong = false;
  for (let index = 0; index < 3; index += 1) {
    const onset = choose(rng, index === 0 ? FIRST_ONSETS : INNER_ONSETS);
    const vowel = choose(rng, diphthong || (index === 0 && onset.length > 1) ? VOWELS : NUCLEI);
    diphthong ||= vowel.length > 1;
    syllables.push({ onset, vowel, bridge: index === 0 ? '' : choose(rng, bridgesFor(onset)) });
  }
  return copyGenes({
    chromosome: repair({ syllables, coda: choose(rng, CODAS), ending: choose(rng, ENDINGS) }),
    mutability: 0.75 + draw(rng) * 0.5,
    cooldown: 5 + draw(rng) * 5,
    generation: 0,
  });
};

// A short form exposes one sound of its next boundary, not the final ending.
// Bridges and endings are real loci: both can be inherited and mutated.
const visibleLoci = (genome: PlaceGenome, capacity: Capacity): number[] => {
  const loci: number[] = [];
  for (let index = 0; index < capacity; index += 1) {
    loci.push(index * 3, index * 3 + 1);
    if (index > 0) loci.push(index * 3 + 2);
  }
  if (capacity === 3) loci.push(CODA_LOCUS, ENDING_LOCUS);
  else loci.push(capacity * 3 + (genome.syllables[capacity].bridge ? 2 : 0));
  return loci;
};
const allele = (genome: PlaceGenome, locus: number): string => {
  if (locus === CODA_LOCUS) return genome.coda;
  if (locus === ENDING_LOCUS) return genome.ending ?? '';
  const part = genome.syllables[Math.floor(locus / 3)];
  return locus % 3 === 0 ? part.onset : locus % 3 === 1 ? part.vowel : part.bridge ?? '';
};
const setAllele = (genome: PlaceGenome, locus: number, value: string): void => {
  if (locus === CODA_LOCUS) genome.coda = value;
  else if (locus === ENDING_LOCUS) genome.ending = value;
  else {
    const part = genome.syllables[Math.floor(locus / 3)];
    if (locus % 3 === 0) part.onset = value;
    else if (locus % 3 === 1) part.vowel = value;
    else part.bridge = value;
  }
};
const alternatives = (genome: PlaceGenome, locus: number): string[] => {
  const values = locus === CODA_LOCUS ? CODAS : locus === ENDING_LOCUS ? ENDINGS
    : locus % 3 === 2 ? bridgesFor(genome.syllables[Math.floor(locus / 3)].onset)
      : locus % 3 === 1 ? NUCLEI : locus === 0 ? FIRST_ONSETS : INNER_ONSETS;
  return [...new Set(values)].filter((value) => {
    if (value === allele(genome, locus)) return false;
    const candidate = clone(genome);
    setAllele(candidate, locus, value);
    return valid(candidate);
  });
};
const mutate = (genes: NameGenes, capacity: Capacity, rng: Rng, saltation = draw(rng) < SALTATION_PROBABILITY): NameGenes => {
  const result = copyGenes(genes);
  const loci = visibleLoci(result.chromosome, capacity);
  const count = saltation ? Math.max(3, loci.length - 1) : 1;
  let changed = 0;
  while (changed < count && loci.length) {
    const [locus] = loci.splice(Math.floor(draw(rng) * loci.length), 1);
    const before = placeStem(expressName(result.chromosome, capacity));
    let choices = alternatives(result.chromosome, locus).filter((value) => {
      const candidate = clone(result.chromosome);
      setAllele(candidate, locus, value);
      return placeStem(expressName(candidate, capacity)) !== before;
    });
    if (!saltation) {
      const sameLength = choices.filter((value) => value.length === allele(result.chromosome, locus).length);
      choices = sameLength.length ? sameLength
        : choices.filter((value) => Math.abs(value.length - allele(result.chromosome, locus).length) <= 1);
    }
    if (!choices.length) continue;
    setAllele(result.chromosome, locus, choose(rng, choices));
    changed += 1;
  }
  result.mutability = clamp(result.mutability * (1 + (draw(rng) - 0.5) * 0.08), 0.5, 1.5);
  result.cooldown = clamp(result.cooldown + (draw(rng) - 0.5) * 0.4, 5, 10);
  recordChanges(result, genes.chromosome);
  return result;
};

// Preserve a short form's closing sound in the boundary it will later unfold.
const setClosure = (chromosome: PlaceGenome, capacity: Capacity, closing: string): void => {
  if (capacity === 3) { chromosome.coda = closing; return; }
  const next = chromosome.syllables[capacity];
  if (next.onset.startsWith(closing)) next.bridge = '';
  else if (bridgesFor(next.onset).includes(closing)) next.bridge = closing;
  else { next.bridge = ''; next.onset = closing; }
};

const unique = (
  genes: NameGenes, capacity: Capacity, banned: ReadonlySet<string> | undefined,
  previous?: string, preservePrefix?: string, allowPrevious = false,
): NameGenes | null => {
  const acceptable = (candidate: NameGenes): boolean => {
    const stem = placeStem(expressName(candidate.chromosome, capacity));
    return valid(candidate.chromosome) && (stem !== previous || allowPrevious)
      && (!banned?.has(stem) || (allowPrevious && stem === previous))
      && (!preservePrefix || stem.startsWith(preservePrefix));
  };
  const inheritedChange = (candidate: NameGenes): NameGenes => {
    recordChanges(candidate, genes.chromosome);
    return candidate;
  };
  if (acceptable(genes)) return genes;
  for (const locus of [...visibleLoci(genes.chromosome, capacity)].reverse()) {
    for (const value of alternatives(genes.chromosome, locus)) {
      const candidate = copyGenes(genes);
      setAllele(candidate.chromosome, locus, value);
      if (acceptable(candidate)) return inheritedChange(candidate);
    }
  }
  if (preservePrefix && capacity > 1) {
    for (const vowel of VOWELS) {
      for (const coda of CONSONANTS) {
        const candidate = copyGenes(genes);
        candidate.chromosome.syllables[capacity - 1].vowel = vowel;
        setClosure(candidate.chromosome, capacity, coda);
        if (acceptable(candidate)) return inheritedChange(candidate);
      }
    }
  }
  // Finite fallback exceeds the map's 48 tracked names even for a constant RNG.
  for (const onset of CONSONANTS) {
    for (const vowel of VOWELS) {
      for (const coda of CONSONANTS) {
        const candidate = copyGenes(genes);
        candidate.chromosome.syllables[0] = { onset, vowel, bridge: '' };
        setClosure(candidate.chromosome, capacity, coda);
        if (acceptable(candidate)) return inheritedChange(candidate);
      }
    }
  }
  return null;
};

const joinBridge = (leftCoda: string, right: PlaceSyllable): string => {
  const legal = bridgesFor(right.onset);
  if (legal.includes(leftCoda)) return leftCoda;
  // Nasals assimilate at a lip consonant; other incompatible tails use the
  // closest available sonorant junction rather than carrying a consonant pile.
  if (leftCoda === 'n' && legal.includes('m')) return 'm';
  if (right.bridge && legal.includes(right.bridge)) return right.bridge;
  return legal.find((bridge) => bridge === 'r' || bridge === 'l' || bridge === 'n') ?? '';
};

// Shared origin IDs define homologous material, even after rotation, mutation,
// or a previous crossover. Sound similarity alone never establishes kinship.
const weightedGenes = (parents: GeneticParent[], capacity: Capacity): NameGenes => {
  const ranked = parents.filter((parent) => parent.weight > 0)
    .sort((left, right) => right.weight - left.weight
      || ancestryOf(left.genes).order.join(',').localeCompare(ancestryOf(right.genes).order.join(',')));
  const total = ranked.reduce((sum, parent) => sum + parent.weight, 0);
  const remaining = new Set(ranked);
  const groups: GeneticParent[][] = [];
  while (remaining.size) {
    const group = [remaining.values().next().value!];
    remaining.delete(group[0]);
    const origins = new Set(ancestryOf(group[0].genes).order);
    // A hybrid can connect two families; take the full connected component.
    for (let changed = true; changed;) {
      changed = false;
      for (const parent of remaining) {
        const ids = ancestryOf(parent.genes).syllables.map(({ id }) => id);
        if (!ids.some((id) => origins.has(id))) continue;
        group.push(parent);
        remaining.delete(parent);
        ids.forEach((id) => origins.add(id));
        changed = true;
      }
    }
    groups.push(group);
  }
  const tail = (group: GeneticParent[], field: 'coda' | 'ending'): TailOrigin => {
    const alternatives = new Map<number, Array<{ origin: TailOrigin; weight: number }>>();
    for (const parent of group) {
      const origin = ancestryOf(parent.genes)[field];
      const copies = alternatives.get(origin.id) ?? [];
      copies.push({ origin, weight: parent.weight });
      alternatives.set(origin.id, copies);
    }
    const candidates = [...alternatives.values()].sort((a, b) =>
      b.reduce((sum, copy) => sum + copy.weight, 0) - a.reduce((sum, copy) => sum + copy.weight, 0)
      || a[0].origin.id - b[0].origin.id);
    return mergeTail(candidates[0]);
  };
  const families = groups.map((group) => {
    // The latest inherited arrangement is the alignment scaffold. Rejoining
    // an old relative must not resurrect a discarded ancestral slot at the
    // expense of a donor already incorporated into a hybrid.
    const ordered = [...group].sort((a, b) =>
      ancestryOf(b.genes).orderRevision - ancestryOf(a.genes).orderRevision || b.weight - a.weight
      || ancestryOf(a.genes).order.join(',').localeCompare(ancestryOf(b.genes).order.join(',')));
    const scaffold = ancestryOf(ordered[0].genes).order;
    const copies = new Map<number, Array<{ origin: SyllableOrigin; weight: number }>>();
    const order: number[] = [];
    for (const parent of ordered) {
      const ancestry = ancestryOf(parent.genes);
      const ids = group.length === 1 ? ancestry.syllables.map(({ id }) => id) : ancestry.order;
      for (const id of ids) if (!order.includes(id)) order.push(id);
      for (const origin of ancestry.syllables) {
        const variants = copies.get(origin.id) ?? [];
        variants.push({ origin, weight: parent.weight });
        copies.set(origin.id, variants);
      }
    }
    const material = order.map((id) => {
      const variants = copies.get(id)!;
      const origin = mergeSyllable(variants);
      const sound = group.length === 1
        ? { ...group[0].genes.chromosome.syllables.find((_, index) =>
          ancestryOf(group[0].genes).syllables[index].id === id)! }
        : { onset: origin.onset.value, vowel: origin.vowel.value, bridge: origin.bridge.value };
      return { origin, sound, shared: variants.length > 1,
        support: variants.reduce((sum, copy) => sum + copy.weight, 0) };
    });
    // Shared material gets one slot. In a mixed family, overlap support chooses
    // which distinct material fits the finite chromosome, retaining its order.
    const priorities = [...material].sort((a, b) => Number(b.shared) - Number(a.shared)
      || Number(scaffold.includes(b.origin.id)) - Number(scaffold.includes(a.origin.id))
      || b.support - a.support
      || order.indexOf(a.origin.id) - order.indexOf(b.origin.id));
    return { material, priorities, weight: group.reduce((sum, parent) => sum + parent.weight, 0),
      coda: tail(group, 'coda'), ending: tail(group, 'ending') };
  });
  const quotas = families.map((family) => family.weight / total * capacity);
  const counts = quotas.map(Math.floor);
  const byRemainder = families.map((_, index) => index).sort((a, b) =>
    quotas[b] - counts[b] - (quotas[a] - counts[a]) || a - b);
  for (let left = capacity - counts.reduce((sum, count) => sum + count, 0), index = 0;
    left > 0; left -= 1, index += 1) counts[byRemainder[index]] += 1;
  // Allocate the entire DNA before projecting the visible prefix. Otherwise
  // a small reunion could put shared roots before a hybrid's silent donor,
  // accidentally changing its canonical order just because the area shrank.
  const visibleCounts = [...counts];
  while (counts.reduce((sum, count) => sum + count, 0) < 3) {
    const index = families.map((_, i) => i).sort((a, b) =>
      (families[b].weight / total * 3 - counts[b]) - (families[a].weight / total * 3 - counts[a]) || a - b)
      .find((i) => counts[i] < families[i].material.length)!;
    counts[index] += 1;
  }
  const selected = families.map((family, index) => {
    const material = new Set(family.priorities.slice(0, counts[index]));
    return family.material.filter((part) => material.has(part));
  });
  const blocks: Array<{ family: number; part: typeof families[number]['material'][number] }> = [];
  selected.forEach((material, family) => material.slice(0, visibleCounts[family])
    .forEach((part) => blocks.push({ family, part })));
  // Hidden slots retain donors too, without putting a second copy of a visible
  // ancestral syllable in the reserve. Growth unfolds this exact chromosome.
  selected.forEach((material, family) => material.slice(visibleCounts[family])
    .forEach((part) => blocks.push({ family, part })));
  const syllables: PlaceSyllable[] = [];
  let closing = '';
  blocks.forEach(({ family: index, part }, position) => {
    const family = families[index];
    const sound = { ...part.sound };
    if (position > 0 && blocks[position - 1].family !== index) sound.bridge = joinBridge(closing, sound);
    syllables.push(sound);
    const following = family.material[family.material.indexOf(part) + 1];
    closing = following ? boundary(following.sound).charAt(0) : family.coda.value;
  });
  const last = families[blocks[2].family];
  const order = blocks.map(({ part }) => part.origin.id);
  const matching = ranked.map(({ genes }) => ancestryOf(genes))
    .filter((ancestry) => ancestry.order.every((id, index) => id === order[index]));
  const ancestry: NameAncestry = {
    syllables: blocks.map(({ part }) => part.origin), order,
    orderRevision: matching.length ? Math.max(...matching.map((parent) => parent.orderRevision))
      : Math.max(...ranked.map(({ genes }) => ancestryOf(genes).orderRevision)) + 1,
    coda: last.coda, ending: last.ending,
  };
  return {
    chromosome: repair({ syllables, coda: last.coda.value, ending: last.ending.value }),
    ancestry: copyAncestry(ancestry),
    mutability: ranked.reduce((sum, parent) => sum + parent.genes.mutability * parent.weight, 0) / total,
    cooldown: clamp(ranked.reduce((sum, parent) => sum + parent.genes.cooldown * parent.weight, 0) / total, 5, 10),
    generation: Math.max(...ranked.map((parent) => parent.genes.generation)) + 1,
  };
};

export class NameEvolution {
  genes: NameGenes;
  genome: PlaceGenome;
  pending: NameProposal | null = null;
  nextChangeAt: number;
  private readonly rng: Rng;
  private exposure = 0;
  private capacity: Capacity;
  private inheritance: NameGenes | null = null;
  private inheritanceKey = '';

  // Reproduction sees inherited DNA immediately, even while the inscription
  // waits for its refractory period. Chained merges cannot lose a quiet donor.
  get hereditary(): { genes: NameGenes; genome: PlaceGenome } {
    const genes = this.pending?.cause === 'recombination' ? this.pending.genes : this.inheritance;
    if (!genes) return { genes: copyGenes(this.genes), genome: clone(this.genome) };
    const capacity = this.pending?.cause === 'recombination' ? this.pending.capacity : this.capacity;
    return { genes: copyGenes(genes), genome: expressName(genes.chromosome, capacity) };
  }

  constructor(options: {
    areaFraction: number; now: number; rng?: Rng; banned?: ReadonlySet<string>;
    parent?: NameGenes; fragment?: number;
  }) {
    this.rng = options.rng ?? Math.random;
    this.capacity = nameCapacity(options.areaFraction);
    let genes: NameGenes;
    if (options.parent) {
      genes = copyGenes(options.parent);
      const offset = Math.abs(options.fragment ?? 0) % (4 - this.capacity);
      genes.chromosome.syllables = [...genes.chromosome.syllables.slice(offset),
        ...genes.chromosome.syllables.slice(0, offset)];
      genes.ancestry!.syllables = [...genes.ancestry!.syllables.slice(offset),
        ...genes.ancestry!.syllables.slice(0, offset)];
      if (this.capacity < 3) {
        const closing = offset + this.capacity < 3
          ? boundary(options.parent.chromosome.syllables[offset + this.capacity]).charAt(0)
          : options.parent.chromosome.coda;
        setClosure(genes.chromosome, this.capacity, closing);
      }
      genes.chromosome = repair(genes.chromosome);
      genes.generation += 1;
      genes = mutate(genes, this.capacity, this.rng);
    } else genes = founder(this.rng);
    this.genes = unique(genes, this.capacity, options.banned) ?? genes;
    this.genome = expressName(this.genes.chromosome, this.capacity);
    this.nextChangeAt = options.now + this.genes.cooldown;
  }

  recombine(parents: GeneticParent[], areaFraction: number): void {
    const viable = parents.filter((parent) => parent.weight > 0);
    if (viable.length < 2) return;
    const key = `${nameCapacity(areaFraction)}:` + viable.map(({ genes, genome, weight }) =>
      `${placeStem(genes.chromosome)}:${placeStem(genome ?? genes.chromosome)}:${JSON.stringify(ancestryOf(genes))}:${weight}`).join('|');
    if (key === this.inheritanceKey) return;
    this.inheritanceKey = key;
    const capacity = nameCapacity(areaFraction);
    this.inheritance = weightedGenes(viable, capacity);
    this.pending = {
      genes: this.inheritance, genome: expressName(this.inheritance.chromosome, capacity),
      capacity, cause: 'recombination',
    };
  }

  propose(environment: Environment): NameProposal | null {
    const { areaFraction, temperature, elapsed, now, banned } = environment;
    const mobility = clamp(Math.sqrt(0.055 / Math.max(areaFraction, 0.001)), 0.5, 2);
    this.exposure = Math.min(1, this.exposure + Math.max(0, elapsed)
      * nameMutationRate(temperature) * this.genes.mutability * mobility);
    const desired = nameCapacity(areaFraction, this.capacity);
    if (desired === this.capacity && (this.pending?.cause === 'growth' || this.pending?.cause === 'shrink')) {
      this.pending = null;
    }
    // Size expression wins over a mutation that was waiting for room. The DNA
    // remains intact, so shrinking and regrowing recover the same longer form.
    if ((desired !== this.capacity || this.inheritance) && this.pending?.capacity !== desired) {
      const source = this.inheritance ?? this.genes;
      this.pending = { genes: source, genome: expressName(source.chromosome, desired),
        capacity: desired, cause: this.inheritance ? 'recombination' : desired < this.capacity ? 'shrink' : 'growth' };
    }
    if (!this.pending && this.exposure >= 1 - 1e-10) {
      const genes = mutate(this.genes, this.capacity, this.rng);
      this.pending = { genes, genome: expressName(genes.chromosome, this.capacity),
        capacity: this.capacity, cause: 'mutation' };
    }
    if (this.pending) {
      const candidate = unique(this.pending.genes, this.pending.capacity, banned,
        placeStem(this.genome), this.pending.cause === 'growth' ? placeStem(this.genome) : undefined,
        this.pending.cause === 'recombination');
      if (!candidate) return null;
      if (candidate !== this.pending.genes) {
        this.pending = { ...this.pending, genes: candidate,
          genome: expressName(candidate.chromosome, this.pending.capacity) };
      }
    }
    return now + 1e-10 >= this.nextChangeAt ? this.pending : null;
  }

  // A mutation that cannot be expressed anywhere in its region is discarded.
  // Structural inheritance waits for room and must never be erased this way.
  reject(proposal: NameProposal): void {
    if (proposal !== this.pending || proposal.cause !== 'mutation') return;
    this.pending = null;
    this.exposure = 0;
  }

  commit(proposal: NameProposal, now: number): void {
    if (proposal !== this.pending || now + 1e-10 < this.nextChangeAt) return;
    const renamed = placeStem(proposal.genome) !== placeStem(this.genome);
    this.genes = copyGenes(proposal.genes);
    this.genome = clone(proposal.genome);
    this.capacity = proposal.capacity;
    this.pending = null;
    this.inheritance = null;
    if (renamed) {
      this.exposure = 0;
      this.nextChangeAt = now + clamp(this.genes.cooldown, 5, 10);
    }
  }
}
