import { advanceLabelText, labelTextFrame } from '../src/label-text.ts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
const close = (actual: number, expected: number): boolean => Math.abs(actual - expected) < 1e-8;
const first = advanceLabelText(undefined, 'Var', 0);
assert(labelTextFrame(first).currentOpacity === 1 && first.from === null,
  'initial text added a second fade on top of placement opacity');
assert(advanceLabelText(first, 'Var', 0.4) === first, 'unchanged text restarted a transition');

let state = advanceLabelText(first, 'Varenium', 0.2);
assert(state.from === 'Var' && state.to === 'Varenium' && state.progress === 0,
  'new spelling did not start from fully visible previous text');
assert(advanceLabelText(state, 'Varenium', 0).progress === 0,
  'a zero-second frame advanced the dissolve');
let previousOpacity = 0;
for (let frame = 0; frame < 36; frame += 1) {
  state = advanceLabelText(state, 'Varenium', 1 / 60);
  const ink = labelTextFrame(state);
  assert(ink.currentOpacity >= previousOpacity && ink.currentOpacity <= 1,
    'new text did not fade in monotonically');
  assert(close(ink.currentOpacity + ink.previousOpacity, 1), 'crossfade lost total ink opacity');
  if (frame === 17) assert(close(ink.currentOpacity, 0.5), 'halfway text dissolve was not balanced');
  previousOpacity = ink.currentOpacity;
}
assert(state.from === null && labelTextFrame(state).previousOpacity === 0,
  'finished fade retained the old inscription');
assert(advanceLabelText(state, 'Varenium', 10) === state, 'stable text kept animating');

state = advanceLabelText(state, 'Caer', 0);
state = advanceLabelText(state, 'Alboria', 0.3);
assert(state.from === 'Varenium' && state.to === 'Caer' && close(state.progress, 0.5),
  'rapid third spelling abruptly discarded visible old text');
state = advanceLabelText(state, 'Lumina', 0.3);
assert(state.from === 'Caer' && state.to === 'Lumina' && state.progress === 0,
  'rapid updates did not coalesce into the latest requested spelling');
state = advanceLabelText(state, 'Lumina', 0.6);
assert(state.from === null && state.to === 'Lumina', 'rapid retarget did not finish and clean up');

const reduced = advanceLabelText(state, 'Ael', 0, true);
assert(reduced.from === null && reduced.to === 'Ael' && labelTextFrame(reduced).currentOpacity === 1,
  'reduced motion did not settle immediately');
const literal = '<em>Var</em>';
assert(labelTextFrame(advanceLabelText(undefined, literal, 0)).current === literal,
  'transition changed the literal inscription');
console.log('Place-name text crossfade: smooth curve, stable text, rapid retarget and cleanup passed.');
