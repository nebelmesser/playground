import {
  expressName, NameEvolution, nameMutationRate, placeStem,
  type GeneticParent, type NameGenes, type PlaceGenome,
} from '../src/place-name.ts';
import { ancestryOf, copyAncestry, recordChanges } from '../src/name-ancestry.ts';

const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };
const seeded = (seed: number) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);
const copy = (genes: NameGenes): NameGenes => ({
  ...genes, chromosome: structuredClone(genes.chromosome), ancestry: copyAncestry(ancestryOf(genes)),
});
const ids = (genes: NameGenes): number[] => ancestryOf(genes).syllables.map(({ id }) => id);
const revisions = (genes: NameGenes): number[] => {
  const ancestry = ancestryOf(genes);
  return [...ancestry.syllables.flatMap((part) =>
    [part.onset.revision, part.vowel.revision, part.bridge.revision]),
  ancestry.coda.revision, ancestry.ending.revision];
};
const edit = (genes: NameGenes, change: (chromosome: PlaceGenome) => void): NameGenes => {
  const result = copy(genes);
  const before = structuredClone(result.chromosome);
  change(result.chromosome);
  recordChanges(result, before);
  return result;
};
const source: NameGenes = {
  chromosome: { syllables: [
    { onset: 's', vowel: 'a', bridge: '' },
    { onset: 'r', vowel: 'e', bridge: 'r' },
    { onset: 'm', vowel: 'o', bridge: 'l' },
  ], coda: 'n', ending: 'um' },
  mutability: 1, cooldown: 7, generation: 0,
};
const sourceSnapshot = JSON.stringify(source);
const origins = ancestryOf(source);
assert(ancestryOf(source) === origins && JSON.stringify(source) === sourceSnapshot,
  'lazy ancestry was unstable or edited a caller snapshot');
const sameSound = { ...source, chromosome: structuredClone(source.chromosome) };
assert(ids(sameSound).every((id) => !ids(source).includes(id)),
  'unrelated identical-looking founder reused ancestral origins');
const sameRngFirst = new NameEvolution({ areaFraction: 0.04, now: 0, rng: seeded(72) });
const sameRngSecond = new NameEvolution({ areaFraction: 0.04, now: 0, rng: seeded(72) });
assert(placeStem(sameRngFirst.genome) === placeStem(sameRngSecond.genome)
  && ids(sameRngFirst.genes).every((id) => !ids(sameRngSecond.genes).includes(id)),
  'founder provenance depended on spelling or phonetic random draws');

// A rotated fragment changes storage order while retaining its original
// homology and canonical order. Expression never rewrites that provenance.
const fragment = new NameEvolution({ areaFraction: 0.007, now: 0, parent: source, fragment: 1, rng: () => 0.5 });
const expectedRotation = [...origins.syllables.slice(1), origins.syllables[0]].map(({ id }) => id);
assert(JSON.stringify(ids(fragment.genes)) === JSON.stringify(expectedRotation)
  && JSON.stringify(ancestryOf(fragment.genes).order) === JSON.stringify(origins.order),
  'fragment rotation separated sounds from their origins or erased canonical order');
assert(ancestryOf(fragment.genes).orderRevision === origins.orderRevision,
  'a split incorrectly made a new recombination scaffold');
assert(ancestryOf(fragment.genes).syllables[0].bridge.value === 'r'
  && ancestryOf(fragment.genes).syllables[0].bridge.revision === 0,
  'cutting a leading bridge destroyed the underlying ancestral allele');
assert(revisions(fragment.genes).some((revision) => revision > 0),
  'actual offspring mutation failed to record a revised locus');
const fragmentAncestry = JSON.stringify(ancestryOf(fragment.genes));
for (const areaFraction of [0.02, 0.04, 0.007, 0.02, 0.04]) {
  const now = fragment.nextChangeAt;
  const proposal = fragment.propose({ areaFraction, now, elapsed: 0, temperature: 0.8 });
  assert(proposal !== null, 'growth or shrink had no expression proposal');
  fragment.commit(proposal!, now);
  assert(JSON.stringify(ancestryOf(fragment.genes)) === fragmentAncestry,
    'growth or shrink changed origin IDs, mutation revisions or canonical order');
}

const crossover = (parents: GeneticParent[], areaFraction = 0.04): NameEvolution => {
  const name = new NameEvolution({ areaFraction, now: 0, rng: seeded(193) });
  name.recombine(parents, areaFraction);
  return name;
};
const left = edit(source, (chromosome) => {
  chromosome.syllables[0].onset = 'v';
  chromosome.syllables[1].bridge = '';
});
const right = edit(source, (chromosome) => {
  chromosome.syllables[2].vowel = 'i';
  chromosome.ending = 'ia';
});
const leftSnapshot = JSON.stringify(left);
const related = crossover([{ genes: source, weight: 1000 }, { genes: left, weight: 40 }, { genes: right, weight: 50 }]);
const reunited = related.hereditary.genes;
assert(reunited.chromosome.syllables[0].onset === 'v'
  && reunited.chromosome.syllables[1].bridge === ''
  && reunited.chromosome.syllables[2].vowel === 'i' && reunited.chromosome.ending === 'ia',
  'homologous reunion lost independent mutations to the larger untouched ancestor');
assert(JSON.stringify(ids(reunited)) === JSON.stringify(origins.order)
  && new Set(ids(reunited)).size === 3,
  'homologous reunion duplicated an ancestral sound or reordered the family');
assert(JSON.stringify(left) === leftSnapshot && JSON.stringify(source) === sourceSnapshot,
  'recombination edited its parental snapshots');

const e = edit(source, (chromosome) => { chromosome.syllables[0].vowel = 'e'; });
const i = edit(source, (chromosome) => { chromosome.syllables[0].vowel = 'i'; });
const conflicting = [{ genes: e, weight: 25 }, { genes: i, weight: 40 }, { genes: copy(e), weight: 25 }];
const winner = crossover(conflicting).hereditary.genes;
assert(winner.chromosome.syllables[0].vowel === 'e', 'same-allele overlap support was not summed');
assert(JSON.stringify(winner) === JSON.stringify(crossover([...conflicting].reverse()).hereditary.genes),
  'conflicting homologous mutation selection depended on input order');
const tie = [{ genes: e, weight: 20 }, { genes: i, weight: 20 }];
assert(crossover(tie).hereditary.genes.chromosome.syllables[0].vowel === 'e'
  && crossover([...tie].reverse()).hereditary.genes.chromosome.syllables[0].vowel === 'e',
  'equal-support homologous conflicts had an unstable tie break');

const donor: NameGenes = {
  chromosome: { syllables: [{ onset: 'p', vowel: 'o' }, { onset: 'c', vowel: 'a' },
    { onset: 'd', vowel: 'e' }], coda: 'r', ending: 'is' },
  mutability: 0.9, cooldown: 8, generation: 0,
};
const donorIds = new Set(ids(donor));
const mixed = crossover([{ genes: source, weight: 60 }, { genes: donor, weight: 40 }]);
const hybrid = mixed.hereditary;
assert(ids(hybrid.genes).some((id) => donorIds.has(id)) && new Set(ids(hybrid.genes)).size === 3,
  'ordinary crossover lost the donor or repeated an origin');
for (const weights of [[50, 50], [60, 40]]) {
  const parents = [{ genes: source, weight: weights[0] }, { ...hybrid, weight: weights[1] }];
  const merged = crossover(parents).hereditary.genes;
  const reversed = crossover([...parents].reverse()).hereditary.genes;
  assert(ids(merged).some((id) => donorIds.has(id)) && new Set(ids(merged)).size === 3,
    'hybrid reunion resurrected a lost ancestral slot over the existing donor');
  assert(JSON.stringify(merged) === JSON.stringify(reversed),
    'mixed-family reunion depended on parent input order');
}
const small = crossover([{ genes: source, genome: expressName(source.chromosome, 1), weight: 60 },
  { genes: donor, genome: expressName(donor.chromosome, 1), weight: 40 }], 0.007);
assert(small.hereditary.genome.syllables.length === 1 && new Set(ids(small.hereditary.genes)).size === 3
  && ids(small.hereditary.genes).some((id) => donorIds.has(id)),
  'one-syllable expression duplicated or erased latent donor origins');

// The hybrid's established scaffold can interleave families. Choosing fewer
// visible syllables must not move a shared ancestral block ahead of its donor.
const interleaved = crossover([{ genes: source, weight: 60 }, { genes: donor, weight: 40 }], 0.02).hereditary;
const interleavedIds = [ids(source)[0], ids(donor)[0], ids(source)[1]];
assert(JSON.stringify(ids(interleaved.genes)) === JSON.stringify(interleavedIds),
  'two-syllable hybrid fixture did not establish an interleaved scaffold');
for (const areaFraction of [0.007, 0.02, 0.04]) {
  const reunitedHybrid = crossover([{ ...interleaved, weight: 50 }, { genes: source, weight: 50 }], areaFraction);
  assert(JSON.stringify(ids(reunitedHybrid.hereditary.genes)) === JSON.stringify(interleavedIds),
    'expression capacity reordered a connected family chromosome during reunion');
  assert(JSON.stringify(ancestryOf(reunitedHybrid.hereditary.genes).order) === JSON.stringify(interleavedIds),
    'expression capacity changed the established canonical scaffold');
}

// Queued crossover ancestry is reproductive material before any visible name
// change. Defensive snapshots must retain its IDs and per-locus revisions.
const deadline = related.nextChangeAt;
const originalText = placeStem(related.genome);
const queued = related.hereditary;
const queuedSnapshot = JSON.stringify(queued);
related.recombine([{ ...queued, weight: 60 }, { genes: source, weight: 40 }], 0.04);
assert(related.nextChangeAt === deadline && placeStem(related.genome) === originalText
  && related.hereditary.genes.chromosome.syllables[0].onset === 'v'
  && related.hereditary.genes.chromosome.ending === 'ia',
  'queued ancestry chain lost inherited mutations or changed visible timing');
assert(JSON.stringify(queued) === queuedSnapshot, 'later crossover mutated an earlier hereditary snapshot');
const snapshot = related.hereditary;
snapshot.genes.ancestry!.syllables[0].onset.value = 'x';
assert(related.hereditary.genes.ancestry!.syllables[0].onset.value === 'v',
  'hereditary getter leaked mutable ancestry metadata');

// A reunion that leaves the inscription unchanged must preserve both its
// visible deadline and the already accumulated thermal mutation opportunity.
const unchanged = new NameEvolution({ areaFraction: 0.055, now: 0, rng: seeded(543) });
const noOpDeadline = unchanged.nextChangeAt;
const noOpText = placeStem(unchanged.genome);
const mutability = unchanged.genes.mutability;
assert(unchanged.propose({ areaFraction: 0.055, now: 20, elapsed: 20, temperature: 2.27 }) === null,
  'no-op fixture mutated before enough thermal exposure accumulated');
unchanged.recombine([{ genes: unchanged.genes, weight: 50 }, { genes: copy(unchanged.genes), weight: 50 }], 0.055);
const noOp = unchanged.propose({ areaFraction: 0.055, now: 20, elapsed: 0, temperature: 2.27,
  banned: new Set([noOpText]) });
assert(noOp !== null && placeStem(noOp.genome) === noOpText,
  'self name reservation forced a pointless mutation during reunion');
unchanged.commit(noOp!, 20);
assert(unchanged.nextChangeAt === noOpDeadline && placeStem(unchanged.genome) === noOpText,
  'unchanged recombination restarted the visible naming deadline');
const remaining = 1 / (nameMutationRate(2.27) * mutability) - 20 + 1e-6;
const thermal = unchanged.propose({ areaFraction: 0.055, now: 20 + remaining,
  elapsed: remaining, temperature: 2.27 });
assert(thermal?.cause === 'mutation', 'unchanged recombination erased accumulated thermal exposure');
assert(revisions(thermal!.genes).some((revision) => revision > 0),
  'actual thermal mutation did not mark a hereditary revision');
console.log('Pure kinship: homologous mutations, rotated origins, mixed donors, queued ancestry and no-op timing passed.');
