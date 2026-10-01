import { PlaceTracker, type PlaceLabel } from '../src/place-engine.ts';

let nameSeed = 0x5eed1234;
Math.random = () => {
  nameSeed = (Math.imul(nameSeed, 1664525) + 1013904223) >>> 0;
  return nameSeed / 0x100000000;
};

const WIDTH = 48;
const HEIGHT = 36;
const CELL = 12;
const VIEW = { width: WIDTH * CELL, height: HEIGHT * CELL };

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const sample = (x0: number, x1: number, y0 = 8, y1 = 24) => {
  const signs = new Int8Array(WIDTH * HEIGHT).fill(-1);
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) signs[x + y * WIDTH] = 1;
  }
  return { width: WIDTH, height: HEIGHT, signs };
};

const settle = (places: PlaceTracker, frames = 46): PlaceLabel[] => {
  let labels: PlaceLabel[] = [];
  for (let frame = 0; frame < frames; frame += 1) labels = places.advance(0.5, 'map', VIEW);
  return labels.filter((label) => label.opacity > 0.5);
};

const watch = (places: PlaceTracker, frames: number) => {
  const trail = new Map<number, PlaceLabel[]>();
  let maxStep = 0;
  let maxTurn = 0;
  let maxFontStep = 0;
  for (let frame = 0; frame < frames; frame += 1) {
    for (const label of places.advance(1 / 30, 'map', VIEW)) {
      const history = trail.get(label.id) ?? [];
      const previous = history[history.length - 1];
      if (previous) {
        maxStep = Math.max(maxStep, Math.hypot(label.x - previous.x, label.y - previous.y));
        maxTurn = Math.max(maxTurn, Math.abs(label.angle - previous.angle));
        maxFontStep = Math.max(maxFontStep, Math.abs(label.fontSize - previous.fontSize));
      }
      history.push(label);
      trail.set(label.id, history);
    }
  }
  return { trail, maxStep, maxTurn, maxFontStep };
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const inside = (label: PlaceLabel, x0: number, x1: number, y0: number, y1: number): boolean => {
  const radians = label.angle * Math.PI / 180;
  const extentX = Math.abs(label.width / 2 * Math.cos(radians)) + Math.abs(label.height / 2 * Math.sin(radians));
  const extentY = Math.abs(label.width / 2 * Math.sin(radians)) + Math.abs(label.height / 2 * Math.cos(radians));
  return label.x - extentX >= x0 * CELL - 1
    && label.x + extentX <= x1 * CELL + 1
    && label.y - extentY >= y0 * CELL - 1
    && label.y + extentY <= y1 * CELL + 1;
};

const shoreGap = (label: PlaceLabel, x0: number, x1: number, y0: number, y1: number): number => {
  const radians = label.angle * Math.PI / 180;
  const extentX = Math.abs(label.width / 2 * Math.cos(radians)) + Math.abs(label.height / 2 * Math.sin(radians));
  const extentY = Math.abs(label.width / 2 * Math.sin(radians)) + Math.abs(label.height / 2 * Math.cos(radians));
  return Math.min(label.x - extentX - x0 * CELL, x1 * CELL - label.x - extentX,
    label.y - extentY - y0 * CELL, y1 * CELL - label.y - extentY);
};

const footprintOnLand = (label: PlaceLabel, signs: Int8Array, margin: number): boolean => {
  const radians = label.angle * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const halfWidth = label.width / 2 + margin;
  const halfHeight = label.height / 2 + margin;
  for (let y = -halfHeight; y <= halfHeight; y += 3) {
    for (let x = -halfWidth; x <= halfWidth; x += 3) {
      const sx = Math.floor((label.x + x * cos - y * sin) / CELL);
      const sy = Math.floor((label.y + x * sin + y * cos) / CELL);
      if (sx < 0 || sx >= WIDTH || sy < 0 || sy >= HEIGHT || signs[sx + sy * WIDTH] < 0) return false;
    }
  }
  return true;
};

const land = (rects: Array<[number, number, number, number]>) => {
  const signs = new Int8Array(WIDTH * HEIGHT).fill(-1);
  for (const [x0, x1, y0, y1] of rects) {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) signs[x + y * WIDTH] = 1;
    }
  }
  return { width: WIDTH, height: HEIGHT, signs };
};

const run = async (): Promise<void> => {
  // The label sits in the first block. The second block overlaps it, but the
  // old center is already outside the new block — previously this spawned a
  // second copy at the new center instead of carrying the same label across.
  const overlap = new PlaceTracker();
  overlap.advance(0.016, 'map', VIEW);
  overlap.ingest(sample(6, 26));
  const seated = settle(overlap);
  assert(seated.length === 1, `expected one seated label, got ${seated.length}`);
  const origin = seated[0];
  assert(Math.hypot(origin.x - 16 * CELL, origin.y - 16 * CELL) < 32,
    `rectangular region did not attract the label to its mass center (${origin.x.toFixed(0)}, ${origin.y.toFixed(0)})`);
  assert(shoreGap(origin, 6, 26, 8, 24) >= 8,
    `label is too close to the rectangular coast (${shoreGap(origin, 6, 26, 8, 24).toFixed(1)}px)`);
  await sleep(1600);
  overlap.ingest(sample(17, 37));
  const motion = watch(overlap, 90);
  const originTrail = motion.trail.get(origin.id) ?? [];
  assert(originTrail.length > 0, 'overlapping move dropped the original label');
  assert(motion.trail.size === 1, `overlapping regions produced ${motion.trail.size} labels`);
  const lowest = Math.min(...originTrail.map((label) => label.opacity));
  assert(lowest > 0.8, `label blinked during an overlapping move (opacity ${lowest.toFixed(2)})`);
  assert(motion.maxStep <= 140 / 30 + 0.3, `label exceeded its speed limit (${motion.maxStep.toFixed(1)}px/frame)`);
  assert(motion.maxTurn < 20, `label spun ${motion.maxTurn.toFixed(1)}° in one frame`);
  const arrived = originTrail[originTrail.length - 1];
  assert(arrived.x > origin.x + 24, `label did not translate toward the overlap (${origin.x.toFixed(0)} → ${arrived.x.toFixed(0)})`);
  assert(Math.abs(arrived.angle) <= 80, `angle ${arrived.angle} left the allowed range`);
  console.log('overlap translates', {
    id: origin.id,
    from: Math.round(origin.x),
    to: Math.round(arrived.x),
    maxStep: Number(motion.maxStep.toFixed(2)),
    opacity: Number(lowest.toFixed(2)),
  });

  // A smaller overlap used to fail the old match and mint a new name.
  const partial = new PlaceTracker();
  partial.advance(0.016, 'map', VIEW);
  partial.ingest(sample(4, 24));
  const partialOrigin = settle(partial);
  assert(partialOrigin.length === 1, 'partial-overlap setup has no label');
  await sleep(1600);
  partial.ingest(sample(16, 36));
  const partialMotion = watch(partial, 90);
  assert(partialMotion.trail.size === 1, `partial overlap split into ${partialMotion.trail.size} labels`);
  assert(partialMotion.trail.has(partialOrigin[0].id), 'partial overlap replaced the label');
  assert(partialMotion.maxStep <= 140 / 30 + 0.3, `partial overlap exceeded its speed limit (${partialMotion.maxStep.toFixed(1)}px/frame)`);
  const partialEnd = partialMotion.trail.get(partialOrigin[0].id)?.at(-1);
  assert(partialEnd !== undefined && partialEnd.text === partialOrigin[0].text, 'partial overlap changed the name');
  assert(partialEnd.x > partialOrigin[0].x + 24, 'partial overlap did not translate');
  console.log('partial overlap keeps the name', {
    text: partialEnd.text,
    from: Math.round(partialOrigin[0].x),
    to: Math.round(partialEnd.x),
  });

  // No shared cells: the old label must fade where it is, and the new one
  // appears on the far block. Neither inscription crosses the gap.
  const apart = new PlaceTracker();
  apart.advance(0.016, 'map', VIEW);
  apart.ingest(sample(2, 14));
  const left = settle(apart);
  assert(left.length === 1, 'disjoint setup has no label');
  apart.ingest(sample(32, 44));
  const departure = watch(apart, 30);
  const leftTrail = departure.trail.get(left[0].id) ?? [];
  for (const label of leftTrail) {
    assert(label.x < 20 * CELL, `old label traveled into the gap at x=${label.x.toFixed(0)}`);
  }
  const later = settle(apart, 40);
  const right = later.filter((label) => label.x > 28 * CELL);
  assert(right.length === 1, `new region did not receive its own label (${later.length})`);
  assert(right[0].id !== left[0].id, 'disjoint regions reused the old label');
  assert(right[0].x > 30 * CELL, `new label is not on the far region (${right[0].x.toFixed(0)})`);
  console.log('disjoint regions jump', {
    old: Math.round(left[0].x),
    young: Math.round(right[0].x),
  });

  // The same block, ingested again, must not blink a second copy.
  const still = new PlaceTracker();
  still.advance(0.016, 'map', VIEW);
  still.ingest(sample(10, 30));
  const steady = settle(still);
  assert(steady.length === 1, 'steady setup has no label');
  for (let repeat = 0; repeat < 4; repeat += 1) {
    await sleep(300);
    still.ingest(sample(10, 30));
    const beat = watch(still, 8);
    assert(beat.trail.size === 1 && beat.trail.has(steady[0].id), 're-ingest blinked a new label');
    assert(beat.maxStep < 8, `label twitched ${beat.maxStep.toFixed(1)}px on an unchanged region`);
    const opacity = Math.min(...(beat.trail.get(steady[0].id) ?? []).map((label) => label.opacity));
    assert(opacity > 0.9, `unchanged region flickered (opacity ${opacity.toFixed(2)})`);
  }
  console.log('unchanged region stays');

  // A continent that has already been named keeps that name when it shrinks
  // across the island threshold. The letters ease down; they do not snap.
  const named = new PlaceTracker();
  named.advance(0.016, 'map', VIEW);
  named.ingest(sample(6, 26));
  const continent = settle(named);
  assert(continent.length === 1, 'continent setup has no label');
  assert(continent[0].text.endsWith('ia') && !continent[0].text.includes('island'), `expected a continent name, got ${continent[0].text}`);
  await sleep(300);
  named.ingest(sample(12, 20, 12, 20));
  let present = 0;
  let maxFontStep = 0;
  let quietest = 1;
  let last = continent[0];
  for (let frame = 0; frame < 90; frame += 1) {
    const labels = named.advance(1 / 30, 'map', VIEW).filter((label) => label.opacity > 0.2);
    assert(labels.length === 1 && labels[0].id === continent[0].id, 'shrinking continent replaced its label');
    assert(labels[0].text === continent[0].text, `continent was renamed to ${labels[0].text}`);
    maxFontStep = Math.max(maxFontStep, Math.abs(labels[0].fontSize - last.fontSize));
    quietest = Math.min(quietest, labels[0].opacity);
    last = labels[0];
    present += 1;
  }
  assert(present === 90, 'label disappeared while the continent shrank');
  assert(quietest > 0.8, `label blinked while resizing (opacity ${quietest.toFixed(2)})`);
  assert(inside(last, 12, 20, 12, 20), `shrunk label leaves the island (${last.x.toFixed(0)}, ${last.y.toFixed(0)})`);
  assert(last.fontSize < continent[0].fontSize - 6, `font did not fit the smaller region (${continent[0].fontSize.toFixed(1)} → ${last.fontSize.toFixed(1)})`);
  console.log('continent keeps its name and eases', {
    text: last.text,
    from: Number(continent[0].fontSize.toFixed(1)),
    to: Number(last.fontSize.toFixed(1)),
    maxFontStep: Number(maxFontStep.toFixed(2)),
  });

  // A one-cell coast wobble must not step the font.
  const wobble = new PlaceTracker();
  wobble.advance(0.016, 'map', VIEW);
  wobble.ingest(sample(8, 28, 8, 26));
  const seatedFont = settle(wobble);
  assert(seatedFont.length === 1, 'wobble setup has no label');
  let fontStep = 0;
  let previousFont = seatedFont[0].fontSize;
  for (let repeat = 0; repeat < 6; repeat += 1) {
    await sleep(280);
    const edge = repeat % 2 === 0 ? 27 : 28;
    wobble.ingest(sample(8, edge, 8, 26));
    for (let frame = 0; frame < 8; frame += 1) {
      const labels = wobble.advance(1 / 30, 'map', VIEW).filter((label) => label.id === seatedFont[0].id);
      assert(labels.length === 1, 'coast wobble dropped the label');
      fontStep = Math.max(fontStep, Math.abs(labels[0].fontSize - previousFont));
      previousFont = labels[0].fontSize;
    }
  }
  assert(fontStep < 8, `coast wobble jumped the font by ${fontStep.toFixed(2)}px`);
  console.log('coast wobble', { fontStep: Number(fontStep.toFixed(2)) });

  // A label that starts in a narrow neck must be drawn into the open part,
  // and the letters stay inside the land.
  const neck = new PlaceTracker();
  neck.advance(0.016, 'map', VIEW);
  neck.ingest(land([[36, 46, 15, 23]]));
  const pinched = settle(neck);
  assert(pinched.length === 1, 'neck setup has no label');
  const expandedNeck = land([[4, 22, 6, 30], [22, 36, 12, 26], [36, 46, 15, 23]]);
  neck.ingest(expandedNeck);
  let arrivedNeck = pinched[0];
  for (let frame = 0; frame < 150; frame += 1) {
    if (frame > 0 && frame % 8 === 0) neck.ingest(expandedNeck);
    const labels = neck.advance(1 / 30, 'map', VIEW).filter((label) => label.opacity > 0.5);
    assert(labels.length === 1 && labels[0].id === pinched[0].id, 'neck move replaced the label');
    arrivedNeck = labels[0];
  }
  assert(arrivedNeck.x < pinched[0].x - 80, `label stayed in the neck (${pinched[0].x.toFixed(0)} → ${arrivedNeck.x.toFixed(0)})`);
  assert(inside(arrivedNeck, 4, 36, 6, 30), `label does not sit in the open land (${arrivedNeck.x.toFixed(0)}, ${arrivedNeck.y.toFixed(0)})`);
  console.log('neck yields to the open part', { x: Math.round(arrivedNeck.x), font: Number(arrivedNeck.fontSize.toFixed(1)) });

  // Two equal lobes: keep the one nearer the screen center, and do not swap.
  const lobes = new PlaceTracker();
  lobes.advance(0.016, 'map', VIEW);
  const equal = land([[14, 26, 12, 24], [26, 32, 17, 19], [32, 44, 12, 24]]);
  lobes.ingest(equal);
  const central = settle(lobes);
  assert(central.length === 1, 'equal lobes produced no single label');
  assert(central[0].x < 26 * CELL, `equal lobes picked the far seat (${central[0].x.toFixed(0)})`);
  for (let repeat = 0; repeat < 4; repeat += 1) {
    await sleep(280);
    lobes.ingest(equal);
    const beat = watch(lobes, 10);
    assert(beat.trail.size === 1 && beat.trail.has(central[0].id), 'equal lobes jumped to a new label');
    const end = beat.trail.get(central[0].id)?.at(-1);
    assert(end !== undefined && end.x < 26 * CELL, `equal lobes swapped seats (${end?.x.toFixed(0)})`);
    assert(beat.maxStep < 12, `equal lobes jumped ${beat.maxStep.toFixed(1)}px`);
  }
  console.log('equal lobes stay near the center', { x: Math.round(central[0].x) });

  const lakeMap = land([[8, 40, 6, 30]]);
  for (let y = 16; y < 20; y += 1) {
    for (let x = 22; x < 26; x += 1) lakeMap.signs[x + y * WIDTH] = -1;
  }
  const shore = new PlaceTracker();
  shore.advance(0.016, 'map', VIEW);
  shore.ingest(lakeMap);
  const shoreLabels = settle(shore).filter((label) => label.kind === 'continent');
  assert(shoreLabels.length === 1, 'land with an internal lake has no continent label');
  assert(footprintOnLand(shoreLabels[0], lakeMap.signs, 8),
    'continent label crosses the outer coast or the internal lake');
  console.log('label footprint avoids an internal lake');

  // A genuinely better lobe behind an impassable one-cell channel changes
  // positions by crossfading two bodies. Neither body teleports.
  const blocked = new PlaceTracker();
  blocked.advance(0.016, 'map', VIEW);
  blocked.ingest(land([[3, 13, 14, 22]]));
  const oldSeat = settle(blocked);
  assert(oldSeat.length === 1, 'blocked-channel setup has no label');
  blocked.ingest(land([[3, 13, 14, 22], [13, 23, 17, 18], [23, 46, 4, 32]]));
  const crossfade = blocked.advance(1 / 30, 'map', VIEW);
  const outgoing = crossfade.find((label) => label.id === oldSeat[0].id);
  const incoming = crossfade.find((label) => label.id !== oldSeat[0].id);
  assert(outgoing !== undefined && incoming !== undefined, 'impassable better lobe did not crossfade');
  assert(Math.abs(outgoing.x - oldSeat[0].x) < 0.1, 'outgoing label teleported');
  assert(incoming.x > 23 * CELL, 'incoming label did not appear in the better lobe');
  assert(outgoing.opacity > incoming.opacity && outgoing.opacity > 0.8,
    'crossfade did not begin from the old position');
  let lastOld = outgoing.opacity;
  let lastNew = incoming.opacity;
  for (let frame = 0; frame < 8; frame += 1) {
    const labels = blocked.advance(1 / 30, 'map', VIEW);
    const old = labels.find((label) => label.id === outgoing.id);
    const fresh = labels.find((label) => label.id === incoming.id);
    assert(old !== undefined && fresh !== undefined, 'crossfade removed a body too early');
    assert(old.opacity <= lastOld && fresh.opacity >= lastNew, 'crossfade opacity reversed');
    lastOld = old.opacity;
    lastNew = fresh.opacity;
  }
  console.log('impassable better lobe crossfades', {
    from: Math.round(outgoing.x), to: Math.round(incoming.x),
    oldOpacity: Number(lastOld.toFixed(2)), newOpacity: Number(lastNew.toFixed(2)),
  });

  // More land on the far side is not by itself a reason to jump when the
  // current lobe offers a similarly good seat.
  const comparable = new PlaceTracker();
  comparable.advance(0.016, 'map', VIEW);
  comparable.ingest(land([[4, 16, 12, 24]]));
  const comparableSeat = settle(comparable);
  comparable.ingest(land([[4, 16, 12, 24], [16, 34, 17, 18], [34, 46, 4, 32]]));
  const comparableMotion = watch(comparable, 90);
  assert(comparableMotion.trail.size === 1 && comparableMotion.trail.has(comparableSeat[0].id),
    'comparable lobes switched through an impassable channel');
  console.log('comparable lobe keeps its position');
  console.log('ok');
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
