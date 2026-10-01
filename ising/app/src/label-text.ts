export type LabelTextTransition = { from: string | null; to: string; progress: number };

const FADE_SECONDS = 0.6;

export const advanceLabelText = (
  current: LabelTextTransition | undefined, desired: string, seconds: number, reducedMotion = false,
): LabelTextTransition => {
  if (!current || reducedMotion) return { from: null, to: desired, progress: 1 };
  if (current.from === null) {
    return desired === current.to ? current : { from: current.to, to: desired, progress: 0 };
  }
  const elapsed = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const progress = Math.min(1, current.progress + elapsed / FADE_SECONDS);
  if (progress < 1 - 1e-9) return { ...current, progress };
  // A third spelling waits for this dissolve to finish, then replaces its
  // result. Only two inscriptions ever coexist, without discarding visible ink.
  return desired === current.to ? { from: null, to: desired, progress: 1 }
    : { from: current.to, to: desired, progress: 0 };
};

export const labelTextFrame = (state: LabelTextTransition): {
  previous: string | null; current: string; previousOpacity: number; currentOpacity: number;
} => {
  const blend = state.from === null ? 1 : state.progress ** 2 * (3 - 2 * state.progress);
  return { previous: state.from, current: state.to, previousOpacity: 1 - blend, currentOpacity: blend };
};
