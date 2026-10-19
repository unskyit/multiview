import { evaluateFilePermissions } from '../core/permissions.js';
import { invokeAndroidBridgeAction } from '../adapters/android-bridge.js';
import { resolveCollisionFilename } from '../utils/format.js';
import { showToast } from '../utils/dom.js';

export async function moveCurrentFile(descriptor) {
  const perms = evaluateFilePermissions(descriptor);
  if (!perms.canMove) {
    showToast(perms.explanations.move, 'warning', 5000);
    return { ok: false, code: 'MOVE_NOT_PERMITTED', reason: perms.explanations.move };
  }

  if (descriptor.nativeUri) {
    const res = await invokeAndroidBridgeAction('moveFile', descriptor.nativeUri, descriptor.name, descriptor.mime);
    if (res.ok) showToast(`Moved "${descriptor.name}"`, 'info');
    else showToast(res.reason || 'Move failed.', 'error');
    return res;
  }

  try {
    const destDir = await window.showDirectoryPicker({ mode: 'readwrite' });
    const existingNames = [];
    for await (const entry of destDir.values()) {
      existingNames.push(entry.name);
    }
    const targetName = resolveCollisionFilename(descriptor.name, existingNames);
    const destHandle = await destDir.getFileHandle(targetName, { create: true });
    const writable = await destHandle.createWritable();
    await writable.write(descriptor.file);
    await writable.close();

    const verifiedFile = await destHandle.getFile();
    if (verifiedFile.size !== descriptor.file.size) {
      throw new Error('Destination verification failed; original file was NOT deleted.');
    }

    if (descriptor.fileHandle && typeof descriptor.fileHandle.remove === 'function') {
      await descriptor.fileHandle.remove();
    } else if (descriptor.parentDirectoryHandle) {
      await descriptor.parentDirectoryHandle.removeEntry(descriptor.name);
    } else {
      throw new Error('Copy succeeded, but source handle does not support removal.');
    }

    showToast(`Moved "${descriptor.name}" to "${destDir.name}/${targetName}"`, 'info');
    return { ok: true, targetName };
  } catch (err) {
    if (err && err.name === 'AbortError') return { ok: false, cancelled: true };
    showToast(err.message || 'Move failed; source preserved.', 'error');
    return { ok: false, reason: err.message };
  }
}
