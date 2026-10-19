const EXTENSION_MAP = Object.freeze({
  jpg: { category: 'photos', viewer: 'image', mime: 'image/jpeg' },
  jpeg: { category: 'photos', viewer: 'image', mime: 'image/jpeg' },
  png: { category: 'photos', viewer: 'image', mime: 'image/png' },
  gif: { category: 'photos', viewer: 'image', mime: 'image/gif' },
  webp: { category: 'photos', viewer: 'image', mime: 'image/webp' },
  svg: { category: 'photos', viewer: 'image', mime: 'image/svg+xml' },
  bmp: { category: 'photos', viewer: 'image', mime: 'image/bmp' },
  avif: { category: 'photos', viewer: 'image', mime: 'image/avif' },
  ico: { category: 'photos', viewer: 'image', mime: 'image/x-icon' },

  mp4: { category: 'videos', viewer: 'video', mime: 'video/mp4' },
  m4v: { category: 'videos', viewer: 'video', mime: 'video/mp4' },
  webm: { category: 'videos', viewer: 'video', mime: 'video/webm' },
  ogv: { category: 'videos', viewer: 'video', mime: 'video/ogg' },
  mov: { category: 'videos', viewer: 'video', mime: 'video/quicktime' },
  mkv: { category: 'videos', viewer: 'video', mime: 'video/x-matroska' },

  mp3: { category: 'audio', viewer: 'audio', mime: 'audio/mpeg' },
  wav: { category: 'audio', viewer: 'audio', mime: 'audio/wav' },
  ogg: { category: 'audio', viewer: 'audio', mime: 'audio/ogg' },
  oga: { category: 'audio', viewer: 'audio', mime: 'audio/ogg' },
  opus: { category: 'audio', viewer: 'audio', mime: 'audio/opus' },
  flac: { category: 'audio', viewer: 'audio', mime: 'audio/flac' },
  m4a: { category: 'audio', viewer: 'audio', mime: 'audio/mp4' },
  aac: { category: 'audio', viewer: 'audio', mime: 'audio/aac' },

  pdf: { category: 'documents', viewer: 'pdf', mime: 'application/pdf' },

  txt: { category: 'documents', viewer: 'text', mime: 'text/plain', subtype: 'plain' },
  md: { category: 'documents', viewer: 'text', mime: 'text/markdown', subtype: 'markdown' },
  markdown: { category: 'documents', viewer: 'text', mime: 'text/markdown', subtype: 'markdown' },
  csv: { category: 'documents', viewer: 'text', mime: 'text/csv', subtype: 'csv' },
  tsv: { category: 'documents', viewer: 'text', mime: 'text/tab-separated-values', subtype: 'csv' },
  json: { category: 'documents', viewer: 'text', mime: 'application/json', subtype: 'json' },
  xml: { category: 'documents', viewer: 'text', mime: 'application/xml', subtype: 'xml' },
  log: { category: 'documents', viewer: 'text', mime: 'text/plain', subtype: 'log' },
  ini: { category: 'documents', viewer: 'text', mime: 'text/plain', subtype: 'plain' },
  cfg: { category: 'documents', viewer: 'text', mime: 'text/plain', subtype: 'plain' },
  yaml: { category: 'documents', viewer: 'text', mime: 'text/yaml', subtype: 'plain' },
  yml: { category: 'documents', viewer: 'text', mime: 'text/yaml', subtype: 'plain' }
});

export function extractExtension(filename = '') {
  if (typeof filename !== 'string') return '';
  const cleaned = filename.split('?')[0].split('#')[0].trim();
  const lastDot = cleaned.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === cleaned.length - 1) return '';
  return cleaned.slice(lastDot + 1).toLowerCase();
}

export function sniffSignatureBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 4) return null;
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { category: 'documents', viewer: 'pdf', mime: 'application/pdf', confidence: 'signature' };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { category: 'photos', viewer: 'image', mime: 'image/png', confidence: 'signature' };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { category: 'photos', viewer: 'image', mime: 'image/jpeg', confidence: 'signature' };
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { category: 'photos', viewer: 'image', mime: 'image/gif', confidence: 'signature' };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
  ) {
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return { category: 'photos', viewer: 'image', mime: 'image/webp', confidence: 'signature' };
    }
    if (bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
      return { category: 'audio', viewer: 'audio', mime: 'audio/wav', confidence: 'signature' };
    }
  }
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return { category: 'audio', viewer: 'audio', mime: 'audio/ogg', confidence: 'signature' };
  }
  if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
    return { category: 'audio', viewer: 'audio', mime: 'audio/flac', confidence: 'signature' };
  }
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return { category: 'audio', viewer: 'audio', mime: 'audio/mpeg', confidence: 'signature' };
  }
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === 'M4A ' || brand === 'M4B ') {
      return { category: 'audio', viewer: 'audio', mime: 'audio/mp4', confidence: 'signature' };
    }
    if (brand === 'avif' || brand === 'avis') {
      return { category: 'photos', viewer: 'image', mime: 'image/avif', confidence: 'signature' };
    }
    return { category: 'videos', viewer: 'video', mime: 'video/mp4', confidence: 'signature' };
  }
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { category: 'videos', viewer: 'video', mime: 'video/webm', confidence: 'signature' };
  }
  return null;
}

export function classifyFileType({ filename = '', mimeType = '', headerBytes = null, size = null } = {}) {
  const ext = extractExtension(filename);
  const normalizedMime = String(mimeType || '').split(';')[0].trim().toLowerCase();

  if (size === 0) {
    return {
      category: 'unsupported',
      viewer: 'unsupported',
      mime: normalizedMime || 'application/octet-stream',
      extension: ext,
      subtype: 'empty',
      reason: 'File is empty (0 bytes).'
    };
  }

  const sigMatch = headerBytes ? sniffSignatureBytes(headerBytes) : null;
  if (sigMatch) {
    return {
      ...sigMatch,
      extension: ext,
      subtype: EXTENSION_MAP[ext]?.subtype || 'binary'
    };
  }

  if (ext && EXTENSION_MAP[ext]) {
    const mapped = EXTENSION_MAP[ext];
    return {
      category: mapped.category,
      viewer: mapped.viewer,
      mime: normalizedMime && normalizedMime !== 'application/octet-stream' ? normalizedMime : mapped.mime,
      extension: ext,
      subtype: mapped.subtype || ext,
      confidence: 'extension'
    };
  }

  if (normalizedMime) {
    if (normalizedMime.startsWith('image/')) {
      return { category: 'photos', viewer: 'image', mime: normalizedMime, extension: ext, subtype: 'image', confidence: 'mime' };
    }
    if (normalizedMime.startsWith('video/')) {
      return { category: 'videos', viewer: 'video', mime: normalizedMime, extension: ext, subtype: 'video', confidence: 'mime' };
    }
    if (normalizedMime.startsWith('audio/')) {
      return { category: 'audio', viewer: 'audio', mime: normalizedMime, extension: ext, subtype: 'audio', confidence: 'mime' };
    }
    if (normalizedMime === 'application/pdf') {
      return { category: 'documents', viewer: 'pdf', mime: normalizedMime, extension: ext, subtype: 'pdf', confidence: 'mime' };
    }
    if (
      normalizedMime.startsWith('text/') ||
      normalizedMime === 'application/json' ||
      normalizedMime === 'application/xml' ||
      normalizedMime.endsWith('+json') ||
      normalizedMime.endsWith('+xml')
    ) {
      let subtype = 'plain';
      if (normalizedMime.includes('csv')) subtype = 'csv';
      else if (normalizedMime.includes('json')) subtype = 'json';
      else if (normalizedMime.includes('xml')) subtype = 'xml';
      else if (normalizedMime.includes('markdown')) subtype = 'markdown';
      return { category: 'documents', viewer: 'text', mime: normalizedMime, extension: ext, subtype, confidence: 'mime' };
    }
  }

  if (headerBytes instanceof Uint8Array && headerBytes.length > 0) {
    let printable = 0;
    for (let i = 0; i < headerBytes.length; i++) {
      const b = headerBytes[i];
      if (b === 0x00) {
        printable = -1;
        break;
      }
      if (b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b <= 0x7e) || b >= 0x80) {
        printable++;
      }
    }
    if (printable > 0 && printable / headerBytes.length > 0.9) {
      return {
        category: 'documents',
        viewer: 'text',
        mime: 'text/plain',
        extension: ext,
        subtype: 'plain',
        confidence: 'heuristic-text'
      };
    }
  }

  return {
    category: 'unsupported',
    viewer: 'unsupported',
    mime: normalizedMime || 'application/octet-stream',
    extension: ext,
    subtype: 'unknown',
    reason: `Unsupported or unrecognized format (${ext ? `.${ext}` : normalizedMime || 'unknown type'}).`
  };
}
