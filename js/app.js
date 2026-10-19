import { events } from './events.js';
import { getState, setState } from './state.js';
import { initRouter, navigateTo } from './router.js';
import { loadPreferences } from './storage/preferences.js';
import { loadHistory } from './storage/history.js';
import { registerViewer, getViewer } from './core/viewer-registry.js';
import { imageViewer } from './viewers/image-viewer.js';
import { videoViewer } from './viewers/video-viewer.js';
import { audioViewer } from './viewers/audio-viewer.js';
import { pdfViewer } from './viewers/pdf-viewer.js';
import { textViewer } from './viewers/text-viewer.js';
import { unsupportedViewer } from './viewers/unsupported-viewer.js';
import { initFileIntake, createDiagnosticSampleFile } from './core/file-intake.js';
import { openFiles } from './core/file-opener.js';
import { pickFilesFromWeb } from './adapters/web-adapter.js';
import { renderFileActionsMenu, openFileInfoModal } from './features/file-actions.js';
import { renderRecentAndCategoryLists } from './features/recent-files.js';
import { initSettingsControls } from './features/settings.js';
import { initInstallPrompt, triggerInstallFlow } from './features/install-prompt.js';
import { formatBytes } from './utils/format.js';
import { qsa, clearNode, showToast } from './utils/dom.js';
import { createIcon } from './utils/icons.js';

registerViewer('image', imageViewer);
registerViewer('video', videoViewer);
registerViewer('audio', audioViewer);
registerViewer('pdf', pdfViewer);
registerViewer('text', textViewer);
registerViewer('unsupported', unsupportedViewer);

function mountActiveViewer(descriptor) {
  const stage = document.getElementById('viewer-stage');
  const workspaceCard = document.getElementById('active-viewer-workspace');
  const nameEl = document.getElementById('viewer-file-name');
  const subEl = document.getElementById('viewer-file-sub');
  const actionMenu = document.getElementById('file-action-menu');

  if (!stage || !workspaceCard || !descriptor) return;
  workspaceCard.style.display = 'flex';

  const updateHeaderMeta = (desc) => {
    if (nameEl) nameEl.textContent = desc.name;
    if (subEl) {
      const parts = [
        desc.mime || 'unknown',
        formatBytes(desc.size),
        desc.dimensions || null,
        desc.duration || null
      ].filter(Boolean);
      subEl.textContent = parts.join(' • ');
    }
  };

  updateHeaderMeta(descriptor);

  const viewerModule = getViewer(descriptor.viewer);
  const cleanupFn = viewerModule.mount(stage, descriptor, {
    onMetadataUpdate: updateHeaderMeta
  });
  setState({ activeViewerDestroy: cleanupFn }, 'viewer:mounted');

  renderFileActionsMenu(actionMenu, descriptor, {
    onShowFileInfo: (desc) => openFileInfoModal(desc),
    onCloseMenu: () => actionMenu?.classList.remove('is-open')
  });

  workspaceCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function syncRouteUI(route) {
  qsa('.view-section').forEach((sec) => {
    sec.classList.toggle('is-active', sec.dataset.route === route);
  });
  qsa('.nav-item').forEach((btn) => {
    const active = btn.dataset.nav === route;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (
    window.location.protocol !== 'https:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return;
  }
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

function initAppFullscreenButton() {
  const fsBtn = document.getElementById('btn-fullscreen-app');
  if (!fsBtn) return;

  const syncFsIcon = () => {
    clearNode(fsBtn);
    fsBtn.appendChild(createIcon(document.fullscreenElement ? 'minimize' : 'fullscreen'));
  };

  fsBtn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {
      showToast('Fullscreen mode is restricted by this browser container.', 'info', 2200);
    }
  });

  document.addEventListener('fullscreenchange', syncFsIcon);
}

export function initApp() {
  loadPreferences();
  loadHistory();
  initSettingsControls();
  initInstallPrompt();
  initFileIntake();
  initRouter();
  registerServiceWorker();
  initAppFullscreenButton();

  qsa('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.nav);
    });
  });

  qsa('[data-pick-accept]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pickFilesFromWeb({ accept: btn.dataset.pickAccept || '', multiple: true });
    });
  });

  qsa('[data-sample-kind]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sampleFile = createDiagnosticSampleFile(btn.dataset.sampleKind);
      await openFiles([sampleFile], { sourceType: 'sample' });
    });
  });

  const closeViewerBtn = document.getElementById('btn-close-viewer');
  closeViewerBtn?.addEventListener('click', () => {
    const { activeViewerDestroy } = getState();
    if (typeof activeViewerDestroy === 'function') {
      try { activeViewerDestroy(); } catch (_) {}
    }
    const workspaceCard = document.getElementById('active-viewer-workspace');
    if (workspaceCard) workspaceCard.style.display = 'none';
  });

  const installBtn = document.getElementById('btn-install-pwa');
  installBtn?.addEventListener('click', () => triggerInstallFlow());

  const menuToggleBtn = document.getElementById('btn-file-actions-toggle');
  const actionMenu = document.getElementById('file-action-menu');
  menuToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = actionMenu?.classList.toggle('is-open');
    menuToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', () => {
    if (actionMenu?.classList.contains('is-open')) {
      actionMenu.classList.remove('is-open');
      menuToggleBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalCloseBtn = document.getElementById('btn-modal-close');
  modalCloseBtn?.addEventListener('click', () => modalBackdrop?.classList.remove('is-open'));
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) modalBackdrop.classList.remove('is-open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalBackdrop?.classList.remove('is-open');
      actionMenu?.classList.remove('is-open');
    }
  });

  events.on('route:changed', (st) => syncRouteUI(st.currentRoute));
  events.on('viewer:open', (descriptor) => mountActiveViewer(descriptor));
  events.on('history:updated', () => renderRecentAndCategoryLists());

  syncRouteUI(getState().currentRoute);
  renderRecentAndCategoryLists();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
