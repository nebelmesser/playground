import { placeStem } from '../src/place-name.ts';
import {
  expressName, nameCapacity, nameMutationRate, NameEvolution, type NameGenes,
} from '../src/place-name.ts';

const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };
const rng = (seed: number) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);
const loci = (genes: NameGenes): string[] => [
  ...genes.chromosome.syllables.flatMap(({ bridge, onset, vowel }) => [bridge ?? '', onset, vowel]),
  genes.chromosome.coda, genes.chromosome.ending ?? '',
];
const differences = (first: NameGenes, second: NameGenes): number =>
  loci(first).filter((value, index) => value !== loci(second)[index]).length;
const observe = (name: NameEvolution, areaFraction: number, now: number, elapsed = 0, temperature = 0.8) =>
  name.propose({ areaFraction, now, elapsed, temperature });
const commit = (name: NameEvolution, areaFraction: number, now: number): void => {
  const proposal = observe(name, areaFraction, now);
  assert(proposal !== null, `no name proposal at ${now}`);
  name.commit(proposal!, now);
};

const thermal = [0.8, 1.5, 2.12, 2.27, 2.29, 2.42, 3, 3.5, 4, 4.5].map(nameMutationRate);
assert(thermal.every((rate, index) => index === 0 || rate > thermal[index - 1]),
  'mutation opportunity rate is not monotonic across absolute temperature');
assert(nameCapacity(0.0125, 1) === 1 && nameCapacity(0.0115, 2) === 2
  && nameCapacity(0.031, 2) === 2 && nameCapacity(0.029, 3) === 3,
  'size thresholds have no hysteresis');

// Expression unfolds a chromosome; it does not ask a new random generator for
// more syllables. Oscillating area therefore cannot exhaust a family reserve.
const growth = new NameEvolution({ areaFraction: 0.007, now: 0, rng: rng(12) });
const initialGenes = JSON.stringify(growth.genes);
const first = placeStem(growth.genome);
const originalGenome = JSON.stringify(growth.genome);
assert(growth.genes.chromosome.syllables.length === 3 && first.length >= 2 && first.length <= 4,
  'small founder has no latent chromosome or compact expression');
assert(observe(growth, 0.02, 0.2) === null && growth.pending?.cause === 'growth',
  'growth was not prepared during the cooldown');
const prepared = growth.pending;
assert(observe(growth, 0.02, 1) === null && growth.pending === prepared,
  'unchanged pending growth was regenerated');
growth.commit(prepared!, 1);
assert(placeStem(growth.genome) === first, 'commit bypassed cooldown');
commit(growth, 0.02, growth.nextChangeAt);
const second = placeStem(growth.genome);
assert(second.startsWith(first) && growth.genome.syllables.length === 2,
  'growth lost the literal short-name prefix');
commit(growth, 0.04, growth.nextChangeAt);
const third = placeStem(growth.genome);
assert(third.startsWith(second) && growth.genome.syllables.length === 3,
  'second growth lost the inherited prefix');
assert(JSON.stringify(growth.genes) === initialGenes,
  'expressing more syllables changed latent DNA');
const beforeShrink = growth.nextChangeAt;
assert(observe(growth, 0.007, beforeShrink - 0.1) === null && placeStem(growth.genome) === third,
  'contraction bypassed visible cooldown');
commit(growth, 0.007, beforeShrink);
assert(JSON.stringify(growth.genome) === originalGenome, 'contraction forgot the original short form');
commit(growth, 0.02, growth.nextChangeAt);
assert(placeStem(growth.genome) === second, 'regrowth invented a different continuation');
commit(growth, 0.04, growth.nextChangeAt);
assert(placeStem(growth.genome) === third, 'regrowth did not restore the latent long name');

const transient = new NameEvolution({ areaFraction: 0.007, now: 0, rng: rng(13) });
observe(transient, 0.02, 1);
observe(transient, 0.007, 2);
assert(transient.pending === null && observe(transient, 0.007, 12) === null,
  'a brief area excursion left a stale growth proposal');

const parent: NameGenes = {
  chromosome: { syllables: [{ onset: 's', vowel: 'a' }, { onset: 'r', vowel: 'e' },
    { onset: 'm', vowel: 'o' }], coda: 'n' },
  mutability: 1.1, cooldown: 8, generation: 7,
};
const parentSnapshot = JSON.stringify(parent);
const descendant = new NameEvolution({ areaFraction: 0.04, now: 0, parent, rng: () => 0.5 });
assert(differences(parent, descendant.genes) === 1 && descendant.genes.generation === 8,
  'ordinary offspring did not inherit all but one sound locus');
assert(Math.abs(descendant.genes.mutability - parent.mutability) <= 0.05
  && Math.abs(descendant.genes.cooldown - parent.cooldown) <= 0.2,
  'offspring did not inherit regulatory genes');
const saltation = new NameEvolution({ areaFraction: 0.04, now: 0, parent, rng: () => 0 });
assert(differences(parent, saltation.genes) >= 5, 'saltation did not make a substantially different descendant');
const fragment = new NameEvolution({ areaFraction: 0.007, now: 0, parent, fragment: 1, rng: () => 0.5 });
const fragmentStem = placeStem(fragment.genome);
assert(fragmentStem.length === 3 && [...'rem'].filter((letter, index) =>
  fragmentStem[index] === letter).length === 2,
  `split did not inherit and mutate a contiguous middle fragment (${fragmentStem})`);
assert(JSON.stringify(parent) === parentSnapshot, 'constructing descendants mutated the parent');
let ordinary = 0;
let leaps = 0;
for (let index = 0; index < 2000; index += 1) {
  const child = new NameEvolution({ areaFraction: 0.04, now: 0, parent, rng: rng(index * 117 + 19) });
  const changed = differences(parent, child.genes);
  if (changed === 1) ordinary += 1;
  if (changed >= 5) leaps += 1;
}
assert(ordinary > 1850 && leaps > 30 && leaps < 110,
  `large jumps were not a rare tail (${ordinary} ordinary, ${leaps} jumps)`);

const other: NameGenes = {
  chromosome: { syllables: [{ onset: 'v', vowel: 'i' }, { onset: 't', vowel: 'u' },
    { onset: 'l', vowel: 'a' }], coda: 's' },
  mutability: 0.8, cooldown: 6, generation: 2,
};
const merged = new NameEvolution({ areaFraction: 0.007, now: 0, rng: rng(22) });
const deadline = merged.nextChangeAt;
const mergeParents = [{ genes: parent, genome: expressName(parent.chromosome, 1), weight: 50 },
  { genes: other, genome: expressName(other.chromosome, 1), weight: 50 }];
merged.recombine(mergeParents, 0.02);
assert(merged.pending?.cause === 'recombination' && merged.nextChangeAt === deadline,
  'recombination reset the visible cooldown');
const mergeProposal = merged.pending;
merged.recombine(mergeParents, 0.02);
assert(merged.pending === mergeProposal, 'same recombination regenerated its queued candidate');
for (let step = 1; step < 20; step += 1) {
  merged.recombine([{ ...mergeParents[0], weight: 50 + step }, mergeParents[1]], 0.02);
  assert(observe(merged, 0.02, deadline * step / 20) === null,
    'topology storm bypassed cooldown');
  assert(merged.nextChangeAt === deadline, 'topology storm postponed expression forever');
}
commit(merged, 0.02, deadline);
const mergedStem = placeStem(merged.genome);
assert(mergedStem.startsWith('sa') && mergedStem.includes('vi')
  && merged.genome.syllables.length === 2,
  `comparable parents did not contribute repaired sound blocks (${mergedStem})`);
assert(merged.genes.generation === 8 && merged.genes.cooldown >= 6 && merged.genes.cooldown <= 8,
  'merge lost weighted inheritance or generation');
assert(JSON.stringify(parent) === parentSnapshot, 'crossover edited parental DNA');
const tinyMerge = new NameEvolution({ areaFraction: 0.007, now: 0, rng: rng(23) });
tinyMerge.recombine(mergeParents, 0.007);
assert(tinyMerge.pending?.genes.chromosome.syllables.some((part) =>
  part.onset === 'v' && part.vowel === 'i') === true,
  'a small merged region erased the second parent instead of storing silent ancestry');
const chained = new NameEvolution({ areaFraction: 0.007, now: 0, rng: rng(23) });
const chainedOriginal = placeStem(chained.genome);
const chainedDeadline = chained.nextChangeAt;
chained.recombine(mergeParents, 0.02);
const ab = chained.hereditary;
const abSnapshot = JSON.stringify(ab);
assert(ab.genes.generation === 8 && ab.genome.syllables[0].vowel === 'a'
  && ab.genome.syllables[1].onset === 'v' && ab.genome.syllables[1].vowel === 'i'
  && placeStem(chained.genome) === chainedOriginal,
  'queued recombination was not available for heredity before expression');
const earlyChild = new NameEvolution({ areaFraction: 0.007, now: 1,
  parent: ab.genes, fragment: 1, rng: () => 0.5 });
assert(earlyChild.genes.generation === 9 && placeStem(earlyChild.genome).startsWith('v'),
  'split before cooldown lost the quiet donor ancestry');
const thirdParent: NameGenes = {
  chromosome: { syllables: [{ onset: 'p', vowel: 'o' }, { onset: 'c', vowel: 'a' },
    { onset: 'd', vowel: 'e' }], coda: 'r' }, mutability: 1, cooldown: 7, generation: 1,
};
chained.recombine([{ ...ab, weight: 100 }, { genes: thirdParent, weight: 50 }], 0.04);
assert(chained.hereditary.genes.chromosome.syllables[1].onset === 'v'
  && chained.hereditary.genes.chromosome.syllables[1].vowel === 'i'
  && chained.hereditary.genes.generation === 9 && chained.nextChangeAt === chainedDeadline
  && observe(chained, 0.04, 2) === null && placeStem(chained.genome) === chainedOriginal,
  'second merge before cooldown lost the first donor or changed visible text too soon');
assert(JSON.stringify(ab) === abSnapshot, 'chained reproduction edited an earlier hereditary snapshot');

// Integrating the same physical time in different partitions must not mint
// extra mutations. Proposals are held until the renderer can commit them.
const partitionGenes = new NameEvolution({ areaFraction: 0.04, now: 0, rng: rng(41) }).genes;
const integrated = (steps: number): NameEvolution => {
  const evolution = new NameEvolution({ areaFraction: 0.04, now: 0, rng: rng(41) });
  // These are two time integrations of the same individual, including its
  // origin IDs; identical random spelling alone now creates separate founders.
  evolution.genes = structuredClone(partitionGenes);
  for (let step = 1; step <= steps; step += 1) {
    evolution.propose({ areaFraction: 0.04, now: step * 40 / steps,
      elapsed: 40 / steps, temperature: 2.42 });
  }
  return evolution;
};
const coarse = integrated(1);
const fine = integrated(160);
assert(coarse.pending !== null && JSON.stringify(coarse.pending) === JSON.stringify(fine.pending),
  'dt partition changed a mutation candidate');
const pending = fine.pending;
observe(fine, 0.04, 41, 1, 2.42);
assert(fine.pending === pending, 'uncommitted mutation changed on the next observation');
const oldGenes = fine.genes;
const oldSnapshot = JSON.stringify(oldGenes);
fine.commit(fine.pending!, 41);
assert(fine.genes !== oldGenes && JSON.stringify(oldGenes) === oldSnapshot,
  'committing mutated an earlier genetic snapshot');
assert(fine.nextChangeAt - 41 >= 5 && fine.nextChangeAt - 41 <= 10,
  'inherited refractory period escaped its limits');

const rejected = new NameEvolution({ areaFraction: 0.04, now: 0, rng: rng(124) });
const rejectedGenes = rejected.genes;
const rejectedSnapshot = JSON.stringify(rejectedGenes);
const rejectedText = placeStem(rejected.genome);
const rejectedDeadline = rejected.nextChangeAt;
const unfit = rejected.propose({ areaFraction: 0.04, temperature: 4.5, now: 10, elapsed: 10 });
assert(unfit?.cause === 'mutation', 'rejected-mutation setup did not prepare a candidate');
rejected.reject({ ...unfit! });
assert(rejected.pending === unfit, 'reject accepted a different proposal object');
rejected.reject(unfit!);
assert(rejected.pending === null && rejected.genes === rejectedGenes
  && JSON.stringify(rejectedGenes) === rejectedSnapshot && placeStem(rejected.genome) === rejectedText
  && rejected.nextChangeAt === rejectedDeadline,
  'discarding an unfit mutation changed committed DNA, text or cooldown');
assert(rejected.propose({ areaFraction: 0.04, temperature: 4.5, now: 11, elapsed: 0 }) === null,
  'rejected mutation retained its accumulated exposure');
const replacement = rejected.propose({ areaFraction: 0.04, temperature: 4.5, now: 12, elapsed: 1 });
assert(replacement?.cause === 'mutation' && replacement !== unfit,
  'fresh thermal exposure did not produce another candidate after rejection');
rejected.reject(unfit!);
assert(rejected.pending === replacement, 'stale rejection discarded a later mutation');

const protectedGrowth = new NameEvolution({ areaFraction: 0.007, now: 0, rng: rng(125) });
observe(protectedGrowth, 0.02, 1);
const growthProposal = protectedGrowth.pending;
assert(growthProposal?.cause === 'growth', 'protected-growth setup did not prepare growth');
protectedGrowth.reject(growthProposal!);
assert(protectedGrowth.pending === growthProposal, 'reject discarded inherited growth');
protectedGrowth.recombine(mergeParents, 0.02);
const crossoverProposal = protectedGrowth.pending;
const crossoverGenes = JSON.stringify(protectedGrowth.hereditary);
assert(crossoverProposal?.cause === 'recombination', 'protected-crossover setup did not prepare inheritance');
protectedGrowth.reject(crossoverProposal!);
assert(protectedGrowth.pending === crossoverProposal
  && JSON.stringify(protectedGrowth.hereditary) === crossoverGenes,
  'reject erased queued recombination ancestry');

const changesAt = (temperature: number): number => {
  const evolution = new NameEvolution({ areaFraction: 0.04, now: 0, rng: rng(91) });
  let changes = 0;
  let last = 0;
  for (let tick = 1; tick <= 960; tick += 1) {
    const now = tick / 4;
    const proposal = evolution.propose({ areaFraction: 0.04, now, elapsed: 0.25, temperature });
    if (!proposal) continue;
    assert(now - last >= 5, 'thermal evolution violated minimum cooldown');
    evolution.commit(proposal, now);
    last = now;
    changes += 1;
  }
  return changes;
};
const mutationCounts = [0.8, 2.27, 2.42, 4.5].map(changesAt);
assert(mutationCounts.every((count, index) => index === 0 || count > mutationCounts[index - 1]),
  `temperature did not increase observed mutation frequency (${mutationCounts})`);

// Constant RNG and occupied names are deliberate adversarial inputs: all
// randomness remains injectable and bounded collision repair stays local.
const occupied = new Set<string>();
for (let index = 0; index < 100; index += 1) {
  const crowded = new NameEvolution({ areaFraction: 0.007, now: 0, rng: () => 0.5, banned: occupied });
  const stem = placeStem(crowded.genome);
  assert(stem.length >= 2 && stem.length <= 4 && !occupied.has(stem), 'crowded deterministic founders collided');
  occupied.add(stem);
}
const blockedGrowth = new NameEvolution({ areaFraction: 0.005, now: 0, rng: () => 0.5 });
blockedGrowth.genes = { chromosome: { syllables: [{ onset: 'r', vowel: 'i' },
  { onset: 'f', vowel: 'u' }, { onset: 'f', vowel: 'a' }], coda: 'n', ending: 'us' },
  mutability: 1, cooldown: 7, generation: 0 };
blockedGrowth.genome = expressName(blockedGrowth.genes.chromosome, 1);
const blockedContinuations = new Set(['rif',
  ...['v', 'l', 'm', 'n', 's', 'c', 'r', 't', 'p', 'd', 'f', 'g', 'b'].map((coda) => `rifu${coda}`),
  ...['a', 'e', 'i', 'o', 'u'].map((vowel) => `rif${vowel}f`)]);
const escapedGrowth = blockedGrowth.propose({ areaFraction: 0.02, now: 10, elapsed: 0,
  temperature: 0.8, banned: blockedContinuations });
assert(escapedGrowth !== null && placeStem(escapedGrowth.genome).startsWith('rif')
  && !blockedContinuations.has(placeStem(escapedGrowth.genome)),
  'crowded growth stalled instead of varying both unprotected continuation sounds');
console.log('Genetic inheritance, expression, recombination, mutation and refractory periods passed.', {
  expressions: [first, second, third], fragment: fragmentStem, merged: mergedStem,
  ordinary, leaps, mutationCounts,
});
