const activeObjectUrls = new Set();

export function createManagedObjectUrl(blobOrFile) {
  if (!blobOrFile || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }
  const url = URL.createObjectURL(blobOrFile);
  activeObjectUrls.add(url);
  return url;
}

export function revokeManagedObjectUrl(url) {
  if (!url || !activeObjectUrls.has(url)) return false;
  try {
    URL.revokeObjectURL(url);
  } catch (_) {}
  activeObjectUrls.delete(url);
  return true;
}

export function revokeAllManagedObjectUrls() {
  for (const url of [...activeObjectUrls]) {
    revokeManagedObjectUrl(url);
  }
}
