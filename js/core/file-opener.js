import { classifyFileType } from '../utils/file-types.js';
import { sanitizeFilename } from '../utils/format.js';
import { createManagedObjectUrl, revokeManagedObjectUrl } from '../utils/cleanup.js';
import { MultiViewError } from '../utils/errors.js';
import { getState, setState } from '../state.js';
import { events } from '../events.js';
import { recordRecentFile } from '../storage/history.js';

async function readHeaderSlice(blob, byteCount = 64) {
  if (!blob || typeof blob.slice !== 'function' || blob.size === 0) return null;
  try {
    const slice = blob.slice(0, Math.min(byteCount, blob.size));
    if (typeof slice.arrayBuffer === 'function') {
      const buf = await slice.arrayBuffer();
      return new Uint8Array(buf);
    }
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(slice);
    });
  } catch (_) {
    return null;
  }
}

export async function normalizeFileInput(input, options = {}) {
  if (!input) {
    throw new MultiViewError('EMPTY_INPUT', 'No file was provided to open.');
  }

  let file = null;
  let fileHandle = options.fileHandle || null;
  let sourceType = options.sourceType || 'picker';

  if (input && typeof input.getFile === 'function' && !(input instanceof Blob)) {
    fileHandle = input;
    file = await input.getFile();
    sourceType = 'fs-access';
  } else if (typeof File !== 'undefined' && input instanceof File) {
    file = input;
  } else if (input instanceof Blob) {
    const fallbackName = sanitizeFilename(input.name || options.name || 'shared-media');
    if (typeof File !== 'undefined') {
      file = new File([input], fallbackName, {
        type: input.type || options.mimeType || 'application/octet-stream',
        lastModified: input.lastModified || Date.now()
      });
    } else {
      file = Object.assign(input, { name: fallbackName, lastModified: Date.now() });
    }
  } else if (typeof input === 'object' && input.nativeUri) {
    const classification = classifyFileType({
      filename: input.name || 'shared-item',
      mimeType: input.mimeType || '',
      size: typeof input.size === 'number' ? input.size : null
    });
    return {
      id: `mv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: sanitizeFilename(input.name || 'shared-file'),
      size: typeof input.size === 'number' ? input.size : null,
      lastModified: input.lastModified || Date.now(),
      mime: classification.mime,
      extension: classification.extension,
      category: classification.category,
      viewer: classification.viewer,
      subtype: classification.subtype,
      reason: classification.reason || null,
      file: null,
      blobUrl: input.streamUrl || input.nativeUri,
      nativeUri: input.nativeUri,
      canWriteSource: Boolean(input.canWriteSource),
      sourceType: 'android-intent'
    };
  } else {
    throw new MultiViewError('INVALID_SOURCE', 'Invalid file reference.');
  }

  const headerBytes = await readHeaderSlice(file, 64);
  const safeName = sanitizeFilename(file.name || options.name || 'unnamed-file');
  const classification = classifyFileType({
    filename: safeName,
    mimeType: file.type || options.mimeType || '',
    headerBytes,
    size: file.size
  });

  const needsObjectUrl = ['image', 'video', 'audio', 'pdf'].includes(classification.viewer);
  const blobUrl = needsObjectUrl ? createManagedObjectUrl(file) : null;

  return {
    id: `mv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: safeName,
    size: file.size,
    lastModified: file.lastModified || Date.now(),
    mime: classification.mime,
    extension: classification.extension,
    category: classification.category,
    viewer: classification.viewer,
    subtype: classification.subtype,
    reason: classification.reason || null,
    file,
    fileHandle,
    parentDirectoryHandle: options.parentDirectoryHandle || null,
    blobUrl,
    nativeUri: null,
    canWriteSource: Boolean(fileHandle && typeof fileHandle.remove === 'function'),
    sourceType
  };
}

export async function openFiles(rawInputs, options = {}) {
  const list = Array.isArray(rawInputs) ? rawInputs : [rawInputs];
  if (list.length === 0) {
    throw new MultiViewError('EMPTY_QUEUE', 'No files were selected.');
  }

  const prevState = getState();
  if (typeof prevState.activeViewerDestroy === 'function') {
    try {
      prevState.activeViewerDestroy();
    } catch (_) {}
  }
  if (prevState.currentFile?.blobUrl && !prevState.currentFile.nativeUri) {
    revokeManagedObjectUrl(prevState.currentFile.blobUrl);
  }

  const descriptors = [];
  for (const item of list) {
    const desc = await normalizeFileInput(item, options);
    descriptors.push(desc);
    recordRecentFile(desc);
  }

  const active = descriptors[0];
  setState(
    {
      currentFile: active,
      fileQueue: descriptors,
      queueIndex: 0,
      activeViewerDestroy: null
    },
    'file:opened'
  );
  events.emit('viewer:open', active);
  return active;
}

export async function openQueueIndex(index) {
  const { fileQueue, activeViewerDestroy } = getState();
  if (index < 0 || index >= fileQueue.length) return null;

  if (typeof activeViewerDestroy === 'function') {
    try {
      activeViewerDestroy();
    } catch (_) {}
  }

  const next = fileQueue[index];
  if (!next.blobUrl && next.file && ['image', 'video', 'audio', 'pdf'].includes(next.viewer)) {
    next.blobUrl = createManagedObjectUrl(next.file);
  }

  setState({ currentFile: next, queueIndex: index, activeViewerDestroy: null }, 'file:opened');
  events.emit('viewer:open', next);
  return next;
}
