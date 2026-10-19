import { detectCapabilities } from '../core/capabilities.js';
import { invokeAndroidBridgeAction } from '../adapters/android-bridge.js';
import { resolveCollisionFilename } from '../utils/format.js';
import { saveFileAs } from './save-file.js';
import { showToast } from '../utils/dom.js';

export async function copyCurrentFile(descriptor) {
  if (!descriptor) return { ok: false, reason: 'No active file selected.' };
  const caps = detectCapabilities();

  if (caps.isAndroidBridge && descriptor.nativeUri) {
    const res = await invokeAndroidBridgeAction('copyFileToFolder', descriptor.nativeUri, descriptor.name, descriptor.mime);
    if (res.ok) showToast(`Copied "${descriptor.name}"`, 'info');
    return res;
  }

  if (caps.hasDirectoryPicker && descriptor.file) {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const existingNames = [];
      for await (const entry of dirHandle.values()) {
        existingNames.push(entry.name);
      }
      const targetName = resolveCollisionFilename(descriptor.name, existingNames);
      const destFileHandle = await dirHandle.getFileHandle(targetName, { create: true });
      const writable = await destFileHandle.createWritable();
      await writable.write(descriptor.file);
      await writable.close();

      const writtenFile = await destFileHandle.getFile();
      if (writtenFile.size !== descriptor.file.size) {
        throw new Error('Destination file size verification mismatch.');
      }
      showToast(`Copied as "${targetName}" in "${dirHandle.name}"`, 'info');
      return { ok: true, filename: targetName, directory: dirHandle.name };
    } catch (err) {
      if (err && err.name === 'AbortError') return { ok: false, cancelled: true };
    }
  }

  return saveFileAs({
    ...descriptor,
    name: resolveCollisionFilename(descriptor.name, [descriptor.name])
  });
}
