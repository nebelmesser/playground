import { expressName, NameEvolution, placeStem, type NameGenes, type PlaceGenome } from '../src/place-name.ts';

const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };
const rng = (seed: number) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 0x100000000);
const skeleton = (text: string): string => text.replace(/[aeiou]/g, 'V').replace(/[^V]/g, 'C');
const phonetic = (genome: PlaceGenome, context: string): void => {
  const word = placeStem(genome);
  assert(/^[a-z]+$/.test(word), `${context}: nonalphabetic place name ${word}`);
  assert(word.length <= 14, `${context}: overlong place name ${word}`);
  assert(!/[^aeiou]{4}/.test(word), `${context}: four consecutive consonants in ${word}`);
  assert((word.match(/ae|au|oe/g) ?? []).length <= 1,
    `${context}: competing diphthongs in ${word}`);
  assert(!(genome.syllables[0].bridge ?? ''), `${context}: leading inherited bridge in ${word}`);
  assert(genome.syllables.every((part, index) => index === 0
    || part.onset !== genome.syllables[index - 1].onset || part.vowel !== genome.syllables[index - 1].vowel),
  `${context}: repeated adjacent syllable cores in ${word}`);
};
const endings = new Set<string>();
const starts = new Set<string>();
const boundaries = new Set<string>();
const skeletons = new Set<string>();
const examples: string[] = [];
let vowelInitial = 0;
let initialCluster = 0;
let initialDiphthong = 0;
const cohortRandom = rng(0x917be);
for (let index = 0; index < 800; index += 1) {
  const name = new NameEvolution({ areaFraction: 0.04, now: 0, rng: cohortRandom });
  const chromosome = name.genes.chromosome;
  const full = placeStem(name.genome);
  const short = placeStem(expressName(chromosome, 1));
  const middle = placeStem(expressName(chromosome, 2));
  phonetic(name.genome, 'founder');
  assert(short.length >= 2 && short.length <= 4, `tiny place expression is too wide: ${short}`);
  assert(middle.startsWith(short) && full.startsWith(middle),
    `bridge expression lost a literal inherited prefix: ${short}/${middle}/${full}`);
  assert((chromosome.ending?.length ?? 0) > 0 && name.genome.ending === chromosome.ending,
    `long founder lost its Latin ending: ${full}`);
  assert(!expressName(chromosome, 1).ending && !expressName(chromosome, 2).ending,
    'short expression displayed a long-form ending');
  const first = chromosome.syllables[0];
  if (!first.onset) vowelInitial += 1;
  if (first.onset.length > 1) initialCluster += 1;
  if (first.vowel.length > 1) initialDiphthong += 1;
  assert(!(first.onset.length > 1 && first.vowel.length > 1),
    `first syllable combines a cluster and a diphthong: ${short}`);
  starts.add(first.onset);
  endings.add(chromosome.ending!);
  skeletons.add(skeleton(placeStem({ ...chromosome, ending: '' })));
  for (const part of chromosome.syllables.slice(1)) boundaries.add((part.bridge ?? '') + part.onset);
  if (index < 18) examples.push(full);
}
assert(endings.size >= 8, `Latin endings collapsed to ${[...endings].join(', ')}`);
assert(starts.size >= 15 && vowelInitial >= 10 && initialCluster >= 10 && initialDiphthong >= 10,
  `founder starts lack phonetic variety (${starts.size} onsets, ${vowelInitial} vowel starts, ${initialCluster} clusters, ${initialDiphthong} diphthongs)`);
assert(skeletons.size >= 6, `all roots repeat too few consonant-vowel patterns (${skeletons.size})`);
const linkedPairs = ['nt', 'nd', 'rt', 'lt', 'mb', 'st', 'll', 'ntr'].filter((pair) => boundaries.has(pair));
assert(boundaries.size >= 8 && linkedPairs.length >= 6,
  `medial consonants lost their Latin combinations (${[...boundaries].join(', ')})`);

const inherited: NameGenes = {
  chromosome: { syllables: [{ onset: 'cl', vowel: 'a', bridge: '' },
    { onset: 't', vowel: 'o', bridge: 'n' }, { onset: 'r', vowel: 'i', bridge: '' }],
  coda: 'n', ending: 'us' },
  mutability: 1, cooldown: 7, generation: 3,
};
const inheritedSnapshot = JSON.stringify(inherited);
assert(placeStem(expressName(inherited.chromosome, 1)) === 'clan'
  && placeStem(expressName(inherited.chromosome, 2)) === 'clantor'
  && placeStem(expressName(inherited.chromosome, 3)) === 'clantorinus',
  'bridge or ending is omitted from a known inherited Latin form');
let inheritedEndings = 0;
let inheritedLinks = 0;
const offspringRandom = rng(0x4571);
for (let index = 0; index < 200; index += 1) {
  const child = new NameEvolution({ areaFraction: 0.04, now: 0, parent: inherited, rng: offspringRandom });
  phonetic(child.genome, 'offspring');
  if (child.genes.chromosome.ending === 'us') inheritedEndings += 1;
  if ((child.genes.chromosome.syllables[1].bridge ?? '') + child.genes.chromosome.syllables[1].onset === 'nt') {
    inheritedLinks += 1;
  }
}
assert(inheritedEndings >= 140 && inheritedLinks >= 120,
  `ordinary offspring discarded family morphology (${inheritedEndings} endings, ${inheritedLinks} links)`);
assert(JSON.stringify(inherited) === inheritedSnapshot, 'offspring generation changed the parent morphology');

const other: NameGenes = {
  chromosome: { syllables: [{ onset: '', vowel: 'ae', bridge: '' },
    { onset: 't', vowel: 'a', bridge: 'l' }, { onset: 'n', vowel: 'o', bridge: '' }],
  coda: 'r', ending: 'ia' },
  mutability: 0.9, cooldown: 8, generation: 2,
};
const crossed = new NameEvolution({ areaFraction: 0.04, now: 0, rng: rng(23) });
crossed.recombine([{ genes: inherited, weight: 50 }, { genes: other, weight: 50 }], 0.04);
const proposal = crossed.propose({ areaFraction: 0.04, temperature: 0.8, elapsed: 0, now: 10 });
assert(proposal !== null && ['us', 'ia'].includes(proposal.genes.chromosome.ending ?? ''),
  'crossover invented an unrelated grammatical ending');
assert(proposal!.genes.chromosome.syllables.some((part) => (part.bridge ?? '') + part.onset === 'nt'),
  'crossover severed an inherited consonant link inside a sound block');
phonetic(proposal!.genome, 'crossover');
crossed.commit(proposal!, 10);
assert(JSON.stringify(inherited) === inheritedSnapshot, 'crossover changed parental morphology');

const crossingRandom = rng(0x7cf18);
for (let index = 0; index < 1200; index += 1) {
  const left = new NameEvolution({ areaFraction: 0.04, now: 0, rng: crossingRandom });
  const right = new NameEvolution({ areaFraction: 0.04, now: 0, rng: crossingRandom });
  const child = new NameEvolution({ areaFraction: 0.04, now: 0, rng: crossingRandom });
  child.recombine([{ genes: left.genes, weight: 60 }, { genes: right.genes, weight: 40 }], 0.04);
  phonetic(child.hereditary.genome, 'mixed founder crossover');
  const fragment = new NameEvolution({ areaFraction: 0.007, now: 0,
    parent: child.hereditary.genes, fragment: index % 3, rng: crossingRandom });
  phonetic(fragment.genome, 'small fragment offspring');
  assert(placeStem(fragment.genome).length <= 4, 'fragment offspring lost compact expression');
  assert(fragment.genes.chromosome.ending === child.hereditary.genes.chromosome.ending,
    'a short offspring discarded its silent family ending');
}

// Repeated hot mutations must retain pronunciation rules, literal prefix
// expression and snapshot safety after the first generation too.
for (let index = 0; index < 40; index += 1) {
  const evolution = new NameEvolution({ areaFraction: 0.04, now: 0, rng: rng(index * 719 + 11) });
  for (let generation = 1; generation <= 20; generation += 1) {
    const before = evolution.genes;
    const beforeSnapshot = JSON.stringify(before);
    const now = generation * 10;
    const candidate = evolution.propose({ areaFraction: 0.04, temperature: 4.5, elapsed: 10, now });
    assert(candidate !== null, 'hot evolution failed to prepare a mutation');
    evolution.commit(candidate!, now);
    phonetic(evolution.genome, 'evolved name');
    const tiny = placeStem(expressName(evolution.genes.chromosome, 1));
    const medium = placeStem(expressName(evolution.genes.chromosome, 2));
    assert(tiny.length <= 4 && medium.startsWith(tiny) && placeStem(evolution.genome).startsWith(medium),
      'mutation broke compact hereditary expression');
    assert(JSON.stringify(before) === beforeSnapshot && before !== evolution.genes,
      'mutation rewrote an earlier morphology snapshot');
    assert(evolution.nextChangeAt - now >= 5 && evolution.nextChangeAt - now <= 10,
      'phonetic mutation escaped the inherited cooldown');
  }
}
console.log('Latin morphology, consonant links, endings and phonetic inheritance passed.', {
  endings: [...endings], skeletons: skeletons.size, vowelInitial, initialCluster, initialDiphthong,
  examples,
});
