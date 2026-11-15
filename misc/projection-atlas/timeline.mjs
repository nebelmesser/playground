const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = value => value * value * (3 - 2 * value);
const easeMorph = value => value < .5 ? 4 * value ** 3 : 1 - 4 * (1 - value) ** 3;

export function getMorphLimit(duration, count, loop = false) {
  if (count < 2) return duration;
  const limit = duration / (loop ? count : count - 1);
  return limit >= .1 ? Math.floor(limit * 10) / 10 : limit;
}

// The total duration includes one hold per projection and one morph per pair.
export function getSegment(sequence, time, duration, morphDuration, loop = false) {
  const count = sequence.length;
  if (!count) throw new Error('At least one projection is required');
  const still = id => ({ from: id, to: id, t: 0, progress: 0 });
  if (count === 1) return still(sequence[0]);
  if (time >= duration) return still(loop ? sequence[0] : sequence.at(-1));
  const transitions = loop ? count : count - 1;
  const transition = clamp(morphDuration, 0, duration / transitions);
  const hold = Math.max(0, (duration - transition * transitions) / count);
  let remaining = clamp(time, 0, duration);
  for (let i = 0; i < count; i++) {
    if (remaining <= hold || (!loop && i === count - 1)) return still(sequence[i]);
    remaining -= hold;
    if (remaining < transition) {
      const progress = clamp(remaining / transition, 0, 1);
      return { from: sequence[i], to: sequence[(i + 1) % count], t: easeMorph(progress), progress };
    }
    remaining -= transition;
  }
  return still(loop ? sequence[0] : sequence.at(-1));
}

// Fade out completely before fading in. The midpoint leaves both captions blank.
export function getCaptionState(from, to, progress) {
  if (from === to) return { id: from, alpha: 1 };
  if (progress < .5) {
    return { id: from, alpha: 1 - ease(clamp(progress / .45, 0, 1)) };
  }
  return { id: to, alpha: ease(clamp((progress - .55) / .45, 0, 1)) };
}
