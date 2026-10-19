import { events } from './events.js';
import { getState, setState } from './state.js';
import { initRouter, navigateTo } from './router.js';
import { loadPreferences } from './storage/preferences.js';
import { loadHistory } from './storage/history.js';
import { registerViewer, getViewer } from './core/viewer-registry.js';
import { openFiles } from './core/file-opener.js';
import { pickFilesFromWeb } from './adapters/web-adapter.js';
import { initFileIntake, createDiagnosticSampleFile } from './core/file-intake.js';
import { imageViewer } from './viewers/image-viewer.js';
import { videoViewer } from './viewers/video-viewer.js';
import { audioViewer } from './viewers/audio-viewer.js';
import { pdfViewer } from './viewers/pdf-viewer.js';
import { textViewer } from './viewers/text-viewer.js';
import { unsupportedViewer } from './viewers/unsupported-viewer.js';
import { renderFileActionsMenu, openFileInfoModal } from './features/file-actions.js';
import { renderRecentAndCategoryLists } from './features/recent-files.js';
import { initInstallPrompt, triggerInstallFlow } from './features/install-prompt.js';
import { initSettingsControls } from './features/settings.js';
import { qsa, clearNode, showToast } from './utils/dom.js';
import { formatBytes } from './utils/format.js';
import { createIcon } from './utils/icons.js';

registerViewer('image', imageViewer);
registerViewer('video', videoViewer);
registerViewer('audio', audioViewer);
registerViewer('pdf', pdfViewer);
registerViewer('text', textViewer);
registerViewer('unsupported', unsupportedViewer);

function closeActionSheet() {
  const actionMenu = document.getElementById('file-action-menu');
  const sheetBackdrop = document.getElementById('action-sheet-backdrop');
  const menuToggleBtn = document.getElementById('btn-file-actions-toggle');
  actionMenu?.classList.remove('is-open');
  sheetBackdrop?.classList.remove('is-open');
  menuToggleBtn?.setAttribute('aria-expanded', 'false');
}

function closeNavDrawer() {
  const drawer = document.getElementById('app-nav-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const toggleBtn = document.getElementById('btn-drawer-toggle');
  drawer?.classList.remove('is-open');
  backdrop?.classList.remove('is-open');
  toggleBtn?.setAttribute('aria-expanded', 'false');
}

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
        desc.mime || 'File',
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
    onCloseMenu: () => closeActionSheet()
  });

  workspaceCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Slide-out Hamburger Drawer Controls
  const drawerToggleBtn = document.getElementById('btn-drawer-toggle');
  const drawerCloseBtn = document.getElementById('btn-drawer-close');
  const drawer = document.getElementById('app-nav-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  drawerToggleBtn?.addEventListener('click', () => {
    const isOpen = drawer?.classList.toggle('is-open');
    drawerBackdrop?.classList.toggle('is-open', Boolean(isOpen));
    drawerToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  drawerCloseBtn?.addEventListener('click', closeNavDrawer);
  drawerBackdrop?.addEventListener('click', closeNavDrawer);

  qsa('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.nav);
      closeNavDrawer();
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
    closeActionSheet();
  });

  const installBtn = document.getElementById('btn-install-pwa');
  installBtn?.addEventListener('click', () => triggerInstallFlow());

  // Native Slide-Up Action Bottom Sheet
  const menuToggleBtn = document.getElementById('btn-file-actions-toggle');
  const actionMenu = document.getElementById('file-action-menu');
  const sheetBackdrop = document.getElementById('action-sheet-backdrop');

  menuToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = actionMenu?.classList.toggle('is-open');
    sheetBackdrop?.classList.toggle('is-open', Boolean(isOpen));
    menuToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  sheetBackdrop?.addEventListener('click', closeActionSheet);

  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalCloseBtn = document.getElementById('btn-modal-close');
  modalCloseBtn?.addEventListener('click', () => modalBackdrop?.classList.remove('is-open'));
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) modalBackdrop.classList.remove('is-open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalBackdrop?.classList.remove('is-open');
      closeActionSheet();
      closeNavDrawer();
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
