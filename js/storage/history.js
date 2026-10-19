import { APP_CONFIG } from '../config.js';
import { getState, setState } from '../state.js';

const sessionFilesById = new Map();

export function loadHistory() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKeys.history);
    const list = raw ? JSON.parse(raw) : [];
    const valid = Array.isArray(list) ? list : [];
    setState({ recentHistory: valid }, 'history:updated');
    return valid;
  } catch (_) {
    setState({ recentHistory: [] }, 'history:updated');
    return [];
  }
}

export function recordRecentFile(descriptor) {
  if (!descriptor || !descriptor.name) return;
  const prefs = getState().preferences || APP_CONFIG.defaults;
  sessionFilesById.set(descriptor.id, descriptor);

  if (!prefs.rememberHistory) return;

  const entry = {
    id: descriptor.id,
    name: descriptor.name,
    size: descriptor.size,
    mime: descriptor.mime,
    category: descriptor.category,
    viewer: descriptor.viewer,
    sourceType: descriptor.sourceType,
    openedAt: Date.now()
  };

  const existing = getState().recentHistory || [];
  const filtered = existing.filter((item) => !(item.name === entry.name && item.size === entry.size));
  const updated = [entry, ...filtered].slice(0, prefs.maxHistoryItems || 30);

  try {
    localStorage.setItem(APP_CONFIG.storageKeys.history, JSON.stringify(updated));
  } catch (_) {}
  setState({ recentHistory: updated }, 'history:updated');
}

export function getSessionDescriptor(id) {
  return sessionFilesById.get(id) || null;
}

export function removeHistoryEntry(id) {
  sessionFilesById.delete(id);
  const existing = getState().recentHistory || [];
  const updated = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(APP_CONFIG.storageKeys.history, JSON.stringify(updated));
  } catch (_) {}
  setState({ recentHistory: updated }, 'history:updated');
}

export function clearHistory() {
  sessionFilesById.clear();
  try {
    localStorage.removeItem(APP_CONFIG.storageKeys.history);
    localStorage.removeItem(APP_CONFIG.storageKeys.resumePositions);
  } catch (_) {}
  setState({ recentHistory: [] }, 'history:updated');
}
