import { detectCapabilities } from './capabilities.js';

export function evaluateFilePermissions(descriptor) {
  const caps = detectCapabilities();
  if (!descriptor) {
    return {
      canSaveAs: false,
      canCopy: false,
      canMove: false,
      canDelete: false,
      canShare: false,
      canOpenWith: false,
      explanations: {}
    };
  }

  const hasAndroidUri = caps.isAndroidBridge && Boolean(descriptor.nativeUri);
  const hasWritableHandle = Boolean(descriptor.fileHandle && typeof descriptor.fileHandle.remove === 'function');
  const hasParentDirHandle = Boolean(descriptor.parentDirectoryHandle);
  const canModifySource =
    (hasAndroidUri && descriptor.canWriteSource === true) ||
    hasWritableHandle ||
    hasParentDirHandle;

  return {
    canSaveAs: Boolean(descriptor.file || descriptor.blobUrl || hasAndroidUri),
    canCopy: Boolean(descriptor.file || descriptor.blobUrl || hasAndroidUri),
    canMove: Boolean(
      (hasAndroidUri && descriptor.canWriteSource) ||
      (caps.hasDirectoryPicker && (hasWritableHandle || hasParentDirHandle))
    ),
    canDelete: Boolean(canModifySource),
    canShare: Boolean(hasAndroidUri || caps.hasWebShare),
    canOpenWith: Boolean(hasAndroidUri),
    explanations: {
      move: canModifySource
        ? 'Moves file using verified copy-then-delete.'
        : 'Opened as a read-only browser file. Use "Save as" or "Copy" instead; MultiView never fakes a move when the source cannot be removed.',
      delete: canModifySource
        ? 'Permanently deletes the source file.'
        : 'Browser security prevents deleting local files opened via a read-only file picker.',
      openWith: hasAndroidUri
        ? 'Opens the file in another installed Android app.'
        : 'In a web browser, use "Share" or "Save as" to open in another application.'
    }
  };
}
