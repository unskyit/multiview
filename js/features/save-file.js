import { detectCapabilities } from '../core/capabilities.js';
import { invokeAndroidBridgeAction } from '../adapters/android-bridge.js';
import { sanitizeFilename } from '../utils/format.js';
import { createManagedObjectUrl, revokeManagedObjectUrl } from '../utils/cleanup.js';
import { showToast } from '../utils/dom.js';

export async function saveFileAs(descriptor) {
  if (!descriptor) {
    return { ok: false, reason: 'No active file to save.' };
  }

  const safeName = sanitizeFilename(descriptor.name);
  const caps = detectCapabilities();

  if (caps.isAndroidBridge && descriptor.nativeUri) {
    const res = await invokeAndroidBridgeAction('saveFileAs', descriptor.nativeUri, safeName, descriptor.mime);
    if (res.ok) {
      showToast(`Saved "${safeName}"`, 'info');
    } else {
      showToast(res.reason || 'Save cancelled or failed.', 'warning');
    }
    return res;
  }

  if (caps.hasFileSystemAccess && descriptor.file) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: safeName });
      const writable = await handle.createWritable();
      await writable.write(descriptor.file);
      await writable.close();
      showToast(`Saved "${handle.name || safeName}"`, 'info');
      return { ok: true, filename: handle.name || safeName, method: 'fs-access' };
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return { ok: false, cancelled: true };
      }
    }
  }

  if (descriptor.file || descriptor.blobUrl) {
    const tempUrl = descriptor.blobUrl || createManagedObjectUrl(descriptor.file);
    const a = document.createElement('a');
    a.href = tempUrl;
    a.download = safeName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!descriptor.blobUrl && tempUrl) {
      setTimeout(() => revokeManagedObjectUrl(tempUrl), 5000);
    }
    showToast(`Downloading "${safeName}"`, 'info');
    return { ok: true, filename: safeName, method: 'download-fallback' };
  }

  showToast('Unable to save: file source unavailable.', 'error');
  return { ok: false, reason: 'Source unavailable.' };
}
