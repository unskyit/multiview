const CACHE_NAME = 'multiview-shell-v3.0.0';
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
  './vendor/exif-parser.js',
  './vendor/markdown-parser.js',
  './vendor/csv-parser.js',
  './vendor/pdf-inspector.js',
  './vendor/audio-visualizer.js',
  './js/app.js',
  './js/config.js',
  './js/state.js',
  './js/router.js',
  './js/events.js',
  './js/core/file-intake.js',
  './js/core/file-opener.js',
  './js/core/viewer-registry.js',
  './js/core/capabilities.js',
  './js/core/permissions.js',
  './js/adapters/web-adapter.js',
  './js/adapters/android-bridge.js',
  './js/viewers/image-viewer.js',
  './js/viewers/video-viewer.js',
  './js/viewers/audio-viewer.js',
  './js/viewers/pdf-viewer.js',
  './js/viewers/text-viewer.js',
  './js/viewers/unsupported-viewer.js',
  './js/features/save-file.js',
  './js/features/copy-file.js',
  './js/features/move-file.js',
  './js/features/share-file.js',
  './js/features/file-actions.js',
  './js/features/recent-files.js',
  './js/features/install-prompt.js',
  './js/features/settings.js',
  './js/storage/preferences.js',
  './js/storage/history.js',
  './js/utils/dom.js',
  './js/utils/icons.js',
  './js/utils/file-types.js',
  './js/utils/format.js',
  './js/utils/errors.js',
  './js/utils/cleanup.js'
];

const sharedPayloadQueue = new Map();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'CLAIM_SHARED_FILES') return;
  const token = data.token;
  const payload = sharedPayloadQueue.get(token);
  if (payload) {
    sharedPayloadQueue.delete(token);
    event.source?.postMessage({ type: 'SHARED_FILES_PAYLOAD', token, files: payload });
  } else {
    event.source?.postMessage({ type: 'SHARED_FILES_EMPTY', token, reason: 'Shared session expired.' });
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.searchParams.has('share-target')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const files = formData.getAll('shared_files').filter((f) => f && typeof f.size === 'number');
          const token = 'share_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
          sharedPayloadQueue.set(token, files);
          setTimeout(() => sharedPayloadQueue.delete(token), 60000);
          return Response.redirect(`./index.html?share-target=1&token=${encodeURIComponent(token)}`, 303);
        } catch (_) {
          return Response.redirect('./index.html?share-error=1', 303);
        }
      })()
    );
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./offline.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
