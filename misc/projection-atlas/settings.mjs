import { getMorphLimit } from './timeline.mjs';

const STORAGE_KEY = 'projection-atlas.settings.v1';
export const DEFAULT_SETTINGS = Object.freeze({
  sequence: Object.freeze(['equirectangular','mercator','robinson','mollweide','equalearth','lambert','orthographic']),
  seconds: 35, morphSeconds: 4.3,
  uiLang: 'ru', videoLang: 'ru', showLabels: true,
  videoLoop: false, loop: true, format: 'auto',
  previewTime: 0, projectionToAdd: 'equirectangular'
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function readSettings(projectionIds, storage) {
  const settings = {...DEFAULT_SETTINGS, sequence:[...DEFAULT_SETTINGS.sequence]};
  try {
    const saved = JSON.parse((storage ?? localStorage).getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return settings;
    if (Array.isArray(saved.sequence)) {
      const sequence = saved.sequence.filter(id => projectionIds.includes(id));
      if (sequence.length) settings.sequence = sequence;
    }
    for (const key of ['uiLang','videoLang']) {
      if (['ru','en'].includes(saved[key])) settings[key] = saved[key];
    }
    for (const key of ['showLabels','videoLoop','loop']) {
      if (typeof saved[key] === 'boolean') settings[key] = saved[key];
    }
    if (['auto','mp4','webm'].includes(saved.format)) settings.format = saved.format;
    if (projectionIds.includes(saved.projectionToAdd)) settings.projectionToAdd = saved.projectionToAdd;
    if (Number.isFinite(saved.seconds)) settings.seconds = clamp(Math.round(saved.seconds),5,300);
    if (Number.isFinite(saved.morphSeconds)) settings.morphSeconds = saved.morphSeconds;
    const limit = getMorphLimit(settings.seconds,settings.sequence.length,settings.videoLoop);
    settings.morphSeconds = clamp(settings.morphSeconds,Math.min(.1,limit),limit);
    if (Number.isFinite(saved.previewTime)) {
      settings.previewTime = clamp(saved.previewTime,0,settings.seconds);
    }
  } catch {
    // Storage may be disabled or contain an older, invalid value.
  }
  return settings;
}

export function writeSettings(settings, storage) {
  try {
    (storage ?? localStorage).setItem(STORAGE_KEY,JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
