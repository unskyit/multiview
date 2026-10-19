export function formatBytes(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
    return 'Unknown size';
  }
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, exp);
  return `${val >= 10 || exp === 0 ? val.toFixed(exp === 0 ? 0 : 1) : val.toFixed(2)} ${units[exp]}`;
}

export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const padSecs = String(secs).padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${padSecs}`;
  }
  return `${mins}:${padSecs}`;
}

export function sanitizeFilename(rawName, fallback = 'untitled-file') {
  if (typeof rawName !== 'string') return fallback;
  const trimmed = rawName.trim().replace(/[\u0000-\u001F<>:"/\\|?*]+/g, '_');
  return trimmed.length > 0 ? trimmed : fallback;
}

export function resolveCollisionFilename(filename, existingNames = []) {
  const clean = sanitizeFilename(filename);
  const set = new Set(existingNames.map((n) => n.toLowerCase()));
  if (!set.has(clean.toLowerCase())) return clean;

  const dotIdx = clean.lastIndexOf('.');
  const base = dotIdx > 0 ? clean.slice(0, dotIdx) : clean;
  const ext = dotIdx > 0 ? clean.slice(dotIdx) : '';
  let counter = 1;
  while (counter < 1000) {
    const candidate = `${base} (${counter})${ext}`;
    if (!set.has(candidate.toLowerCase())) {
      return candidate;
    }
    counter += 1;
  }
  return `${base}-${Date.now()}${ext}`;
}
