/**
 * MultiView Service Worker (v2.0.0)
 * Caches the complete static application shell for 100% offline execution
 * and intercepts Web Share Target POST requests without persisting private media to disk.
 */
const CACHE_VERSION = 'multiview-shell-v2.0.0';

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.png',
  './css/reset.css',
  './css/variables.css',
  './css/themes.css',
  './css/layout.css',
  './css/navigation.css',
  './css/components.css',
  './css/viewers.css',
  './css/dialogs.css',
  './css/responsive.css',
  './js/app.js',
  './js/config.js',
  './js/router.js',
  './js/state.js',
  './js/events.js',
  './js/utils/icons.js',
  './js/utils/dom.js',
  './js/utils/errors.js',
  './js/utils/file-types.js',
  './js/utils/format.js',
  './js/utils/cleanup.js',
  './js/core/file-opener.js',
  './js/core/file-intake.js',
  './js/core/viewer-registry.js',
  './js/core/capabilities.js',
  './js/core/permissions.js',
  './js/viewers/image-viewer.js',
  './js/viewers/video-viewer.js',
  './js/viewers/audio-viewer.js',
  './js/viewers/pdf-viewer.js',
  './js/viewers/text-viewer.js',
  './js/viewers/unsupported-viewer.js',
  './js/features/file-actions.js',
  './js/features/save-file.js',
  './js/features/move-file.js',
  './js/features/copy-file.js',
  './js/features/share-file.js',
  './js/features/recent-files.js',
  './js/features/settings.js',
  './js/features/install-prompt.js',
  './js/storage/preferences.js',
  './js/storage/history.js',
  './js/adapters/web-adapter.js',
  './js/adapters/android-bridge.js'
];

const pendingSharedPayloads = new Map();

function pruneExpiredShares() {
  const now = Date.now();
  for (const [id, entry] of pendingSharedPayloads.entries()) {
    if (now - entry.timestamp > 60000) {
      pendingSharedPayloads.delete(id);
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('multiview-shell-') && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data.type === 'CLAIM_SHARED_FILES' && event.source) {
    pruneExpiredShares();
    const payload = pendingSharedPayloads.get(event.data.token);
    if (payload) {
      pendingSharedPayloads.delete(event.data.token);
      event.source.postMessage({
        type: 'SHARED_FILES_PAYLOAD',
        files: payload.files,
        meta: payload.meta
      });
    } else {
      event.source.postMessage({
        type: 'SHARED_FILES_EMPTY',
        reason: 'No pending shared files found or session token expired.'
      });
    }
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (
    event.request.method === 'POST' &&
    url.origin === self.location.origin &&
    url.searchParams.has('share-target')
  ) {
    event.respondWith(handleShareTargetPost(event.request));
    return;
  }

  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  if (url.protocol === 'blob:' || url.protocol === 'content:') {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(event.request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        return await fetch(event.request);
      } catch (err) {
        if (event.request.mode === 'navigate') {
          return (await cache.match('./index.html')) || (await cache.match('./offline.html'));
        }
        throw err;
      }
    })()
  );
});

async function handleShareTargetPost(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('shared_files').filter((item) => item instanceof File && item.size >= 0);
    const meta = {
      title: formData.get('title') || '',
      text: formData.get('text') || '',
      url: formData.get('url') || ''
    };
    const token = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    pruneExpiredShares();
    pendingSharedPayloads.set(token, { files, meta, timestamp: Date.now() });
    return Response.redirect(`./index.html?share-target=1&token=${encodeURIComponent(token)}`, 303);
  } catch (_) {
    return Response.redirect('./index.html?share-error=invalid_payload', 303);
  }
}
