import { detectCapabilities } from '../core/capabilities.js';
import { invokeAndroidBridgeAction } from '../adapters/android-bridge.js';
import { showToast } from '../utils/dom.js';

export async function shareCurrentFile(descriptor) {
  if (!descriptor) return { ok: false, reason: 'No active file to share.' };
  const caps = detectCapabilities();

  if (caps.isAndroidBridge && descriptor.nativeUri) {
    return invokeAndroidBridgeAction('shareFile', descriptor.nativeUri, descriptor.mime, descriptor.name);
  }

  if (caps.hasWebShare && descriptor.file) {
    try {
      const shareData = { title: descriptor.name, files: [descriptor.file] };
      if (!caps.hasWebShareFiles || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { ok: true, method: 'web-share-files' };
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return { ok: false, cancelled: true };
    }
  }

  showToast('System share sheet is unavailable on this browser. Use "Save as" instead.', 'warning');
  return { ok: false, reason: 'Web Share API unsupported.' };
}

export async function openWithExternalApp(descriptor) {
  if (!descriptor) return { ok: false, reason: 'No active file.' };
  const caps = detectCapabilities();
  if (caps.isAndroidBridge && descriptor.nativeUri) {
    return invokeAndroidBridgeAction('openWith', descriptor.nativeUri, descriptor.mime);
  }
  return shareCurrentFile(descriptor);
}
