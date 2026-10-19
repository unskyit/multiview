import { APP_CONFIG } from '../config.js';
import { getState, setState } from '../state.js';

export function loadPreferences() {
  const defaults = { ...APP_CONFIG.defaults };
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKeys.preferences);
    if (!raw) {
      setState({ preferences: defaults }, 'preferences:loaded');
      return defaults;
    }
    const parsed = JSON.parse(raw);
    const merged = {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      accent: parsed.accent === 'mono' ? 'mono' : 'blue',
      seekStepSeconds: Number(parsed.seekStepSeconds) > 0 ? Number(parsed.seekStepSeconds) : defaults.seekStepSeconds,
      rememberHistory: typeof parsed.rememberHistory === 'boolean' ? parsed.rememberHistory : defaults.rememberHistory,
      resumePlayback: typeof parsed.resumePlayback === 'boolean' ? parsed.resumePlayback : defaults.resumePlayback,
      maxHistoryItems: defaults.maxHistoryItems,
      textPreviewSafeBytes: defaults.textPreviewSafeBytes
    };
    setState({ preferences: merged }, 'preferences:loaded');
    return merged;
  } catch (_) {
    setState({ preferences: defaults }, 'preferences:loaded');
    return defaults;
  }
}

export function updatePreferences(patch) {
  const current = getState().preferences || loadPreferences();
  const next = { ...current, ...patch };
  try {
    localStorage.setItem(APP_CONFIG.storageKeys.preferences, JSON.stringify(next));
  } catch (_) {}
  setState({ preferences: next }, 'preferences:updated');
  return next;
}

export function resetPreferences() {
  try {
    localStorage.removeItem(APP_CONFIG.storageKeys.preferences);
    localStorage.removeItem(APP_CONFIG.storageKeys.resumePositions);
  } catch (_) {}
  return loadPreferences();
}

export function getResumePosition(fileKey) {
  if (!fileKey) return 0;
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKeys.resumePositions);
    if (!raw) return 0;
    const map = JSON.parse(raw);
    return Number(map[fileKey]) || 0;
  } catch (_) {
    return 0;
  }
}

export function saveResumePosition(fileKey, seconds) {
  if (!fileKey || typeof seconds !== 'number' || !Number.isFinite(seconds)) return;
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKeys.resumePositions);
    const map = raw ? JSON.parse(raw) : {};
    map[fileKey] = Math.floor(seconds);
    localStorage.setItem(APP_CONFIG.storageKeys.resumePositions, JSON.stringify(map));
  } catch (_) {}
}
