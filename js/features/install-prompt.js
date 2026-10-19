import { APP_CONFIG } from '../config.js';
import { getState, setState } from '../state.js';
import { detectCapabilities } from '../core/capabilities.js';
import { createEl, clearNode, showToast } from '../utils/dom.js';

let deferredPromptEvent = null;

export function evaluateInstallState() {
  const caps = detectCapabilities();
  let storedInstalled = false;
  try {
    storedInstalled = localStorage.getItem(APP_CONFIG.storageKeys.installState) === 'installed';
  } catch (_) {}

  const isStandalone = caps.isStandaloneDisplay;
  const isInstalled = Boolean(isStandalone || storedInstalled);

  setState(
    {
      installStatus: {
        canPrompt: Boolean(deferredPromptEvent),
        isInstalled,
        platformHint: caps.isAndroidBridge ? 'android-native' : isStandalone ? 'standalone-pwa' : 'browser'
      }
    },
    'install:updated'
  );
  updateInstallButtonVisibility();
}

export function initInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptEvent = e;
    evaluateInstallState();
  });

  window.addEventListener('appinstalled', () => {
    deferredPromptEvent = null;
    try {
      localStorage.setItem(APP_CONFIG.storageKeys.installState, 'installed');
    } catch (_) {}
    evaluateInstallState();
    showToast('MultiView installed. Launch it from your home screen for fullscreen mode.', 'info');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      evaluateInstallState();
    }
  });

  evaluateInstallState();
}

export function updateInstallButtonVisibility() {
  const btn = document.getElementById('btn-install-pwa');
  if (!btn) return;
  const { installStatus } = getState();
  if (installStatus.isInstalled || installStatus.platformHint === 'android-native') {
    btn.style.display = 'none';
  } else {
    btn.style.display = 'inline-flex';
  }
}

export async function triggerInstallFlow() {
  if (deferredPromptEvent) {
    try {
      deferredPromptEvent.prompt();
      const choice = await deferredPromptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        deferredPromptEvent = null;
      } else {
        showToast('Install prompt dismissed. You can install anytime from Settings.', 'info');
      }
      evaluateInstallState();
      return;
    } catch (_) {}
  }
  openInstallInstructionsModal();
}

export function openInstallInstructionsModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  if (!backdrop || !titleEl || !bodyEl) return;

  titleEl.textContent = 'Install MultiView on Your Device';
  clearNode(bodyEl);

  const content = createEl('div', { style: 'display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem;' }, [
    createEl('p', {
      style: 'color: var(--text-secondary);',
      textContent:
        'Once hosted on GitHub Pages (HTTPS), MultiView installs directly onto your Android phone with a native home screen icon and fullscreen AMOLED display.'
    }),
    createEl('div', { className: 'card' }, [
      createEl('strong', { textContent: 'Android (Chrome / Edge / Brave)' }),
      createEl('p', {
        className: 'viewer-file-sub',
        style: 'white-space: normal;',
        textContent: 'Tap the browser three-dot menu (⋮) and select "Install app" or "Add to Home screen".'
      })
    ]),
    createEl('div', { className: 'card' }, [
      createEl('strong', { textContent: 'Desktop (Chrome / Edge)' }),
      createEl('p', {
        className: 'viewer-file-sub',
        style: 'white-space: normal;',
        textContent: 'Click the install icon on the right side of the address bar.'
      })
    ]),
    createEl('div', { className: 'card' }, [
      createEl('strong', { textContent: 'iOS / iPadOS (Safari)' }),
      createEl('p', {
        className: 'viewer-file-sub',
        style: 'white-space: normal;',
        textContent: 'Tap Share at the bottom of Safari and choose "Add to Home Screen".'
      })
    ])
  ]);

  bodyEl.appendChild(content);
  backdrop.classList.add('is-open');
}
