import type { PlaceTracker } from '../../src/place-engine.ts';
import { expressName, NameEvolution, placeStem, type PlaceGenome } from '../../src/place-name.ts';

// Motion scenarios need a known fitting inscription, independent of random
// phonetic variety. Install consistent DNA and reservations before animating.
export const fixtureName = (tracker: PlaceTracker, chromosome: PlaceGenome): void => {
  const state = tracker as unknown as {
    tracks: Map<number, { name: NameEvolution; stem: string; text: string }>;
    usedStems: Set<string>;
  };
  if (state.tracks.size !== 1) throw new Error('Name fixture requires exactly one region');
  const track = [...state.tracks.values()][0];
  const now = performance.now() / 1000;
  const name = new NameEvolution({ areaFraction: 0.06, now, rng: () => 0.5 });
  name.genes = { chromosome, mutability: 1, cooldown: 8, generation: 0 };
  name.genome = expressName(chromosome, 3);
  name.nextChangeAt = now + 8;
  state.usedStems.delete(track.stem);
  track.name = name;
  track.stem = placeStem(name.genome);
  track.text = track.stem[0].toUpperCase() + track.stem.slice(1);
  state.usedStems.add(track.stem);
};
export const FITTING_NAME: PlaceGenome = {
  syllables: [{ onset: 'v', vowel: 'a' }, { onset: 'l', vowel: 'e' }, { onset: 'r', vowel: 'i' }],
  coda: 'n', ending: 'a',
};
export const LONG_NAME: PlaceGenome = {
  syllables: [{ onset: 'pl', vowel: 'i' }, { onset: 'g', vowel: 'i', bridge: 'n' },
    { onset: 's', vowel: 'u', bridge: 'l' }], coda: 'n', ending: 'ea',
};
