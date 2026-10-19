import { openFiles } from '../core/file-opener.js';
import { showToast } from '../utils/dom.js';

export function isAndroidWrapperActive() {
  return typeof window !== 'undefined' && typeof window.MultiViewAndroid === 'object' && window.MultiViewAndroid !== null;
}

export function validateAndroidPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object') return null;
  const items = Array.isArray(rawPayload.files) ? rawPayload.files : [rawPayload];
  const valid = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const uri = typeof item.uri === 'string' ? item.uri.trim() : '';
    if (!uri.startsWith('content://') && !uri.startsWith('https://appassets.androidplatform.net/')) {
      continue;
    }
    valid.push({
      nativeUri: uri,
      streamUrl: typeof item.streamUrl === 'string' ? item.streamUrl : uri,
      name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Shared File',
      mimeType: typeof item.mimeType === 'string' ? item.mimeType.trim() : '',
      size: typeof item.size === 'number' && item.size >= 0 ? item.size : null,
      canWriteSource: Boolean(item.canWriteSource)
    });
  }
  return valid.length > 0 ? valid : null;
}

export function initAndroidBridgeListener() {
  if (typeof window === 'undefined') return;
  window.onMultiViewAndroidIntent = async (jsonOrObject) => {
    try {
      const parsed = typeof jsonOrObject === 'string' ? JSON.parse(jsonOrObject) : jsonOrObject;
      const validated = validateAndroidPayload(parsed);
      if (!validated) {
        showToast('Received an invalid file intent.', 'error');
        return;
      }
      await openFiles(validated, { sourceType: 'android-intent' });
    } catch (err) {
      showToast('Failed to open shared file: ' + (err.message || 'Error'), 'error');
    }
  };
}

export async function invokeAndroidBridgeAction(methodName, ...args) {
  if (!isAndroidWrapperActive() || typeof window.MultiViewAndroid[methodName] !== 'function') {
    return { ok: false, reason: 'Unavailable in standard browser.' };
  }
  try {
    const rawResult = await window.MultiViewAndroid[methodName](...args);
    return typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult || { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message || 'Operation failed.' };
  }
}
