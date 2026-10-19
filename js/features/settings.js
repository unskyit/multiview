import { getState } from '../state.js';
import { updatePreferences, resetPreferences } from '../storage/preferences.js';
import { clearHistory } from '../storage/history.js';
import { showToast, clearNode, qsa } from '../utils/dom.js';
import { createIcon } from '../utils/icons.js';
import { openInstallInstructionsModal } from './install-prompt.js';

export function applyThemeAndAccent(theme, accent = 'blue') {
  const normalizedTheme = theme === 'light' ? 'light' : 'dark';
  const normalizedAccent = accent === 'mono' ? 'mono' : 'blue';

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', normalizedTheme);
    document.documentElement.setAttribute('data-accent', normalizedAccent);

    const statusColor = normalizedTheme === 'dark' ? '#000000' : '#ffffff';
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', statusColor);

    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      clearNode(themeBtn);
      themeBtn.appendChild(createIcon(normalizedTheme === 'dark' ? 'sun' : 'moon'));
    }
  }
}

export function initSettingsControls() {
  const prefs = getState().preferences;
  if (prefs) {
    applyThemeAndAccent(prefs.theme, prefs.accent);
  }

  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  themeToggleBtn?.addEventListener('click', () => {
    const current = getState().preferences?.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    const updated = updatePreferences({ theme: next });
    applyThemeAndAccent(updated.theme, updated.accent);
    syncSettingsForm();
  });

  // Pill Chip Listeners (No <select> dropdowns!)
  qsa('[data-pref-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = updatePreferences({ theme: btn.dataset.prefTheme });
      applyThemeAndAccent(updated.theme, updated.accent);
      syncSettingsForm();
    });
  });

  qsa('[data-pref-accent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = updatePreferences({ accent: btn.dataset.prefAccent });
      applyThemeAndAccent(updated.theme, updated.accent);
      syncSettingsForm();
    });
  });

  qsa('[data-pref-seek]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sec = Number(btn.dataset.prefSeek) || 10;
      updatePreferences({ seekStepSeconds: sec });
      syncSettingsForm();
      showToast(`Double-tap seek set to ${sec}s`, 'info', 1800);
    });
  });

  const historySwitch = document.getElementById('setting-remember-history');
  const resumeSwitch = document.getElementById('setting-resume-playback');
  const clearHistoryBtn = document.getElementById('btn-clear-history');
  const resetSettingsBtn = document.getElementById('btn-reset-settings');
  const showInstallHelpBtn = document.getElementById('btn-settings-install-help');

  historySwitch?.addEventListener('click', () => {
    const next = historySwitch.getAttribute('aria-checked') !== 'true';
    updatePreferences({ rememberHistory: next });
    syncSettingsForm();
  });

  resumeSwitch?.addEventListener('click', () => {
    const next = resumeSwitch.getAttribute('aria-checked') !== 'true';
    updatePreferences({ resumePlayback: next });
    syncSettingsForm();
  });

  clearHistoryBtn?.addEventListener('click', () => {
    clearHistory();
    showToast('Cleared recent history and playback positions.', 'info');
  });

  resetSettingsBtn?.addEventListener('click', () => {
    const defaults = resetPreferences();
    applyThemeAndAccent(defaults.theme, defaults.accent);
    syncSettingsForm();
    showToast('Restored default preferences.', 'info');
  });

  showInstallHelpBtn?.addEventListener('click', () => {
    openInstallInstructionsModal();
  });

  syncSettingsForm();
}

export function syncSettingsForm() {
  const prefs = getState().preferences;
  if (!prefs) return;

  qsa('[data-pref-theme]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.prefTheme === prefs.theme);
  });

  qsa('[data-pref-accent]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.prefAccent === (prefs.accent || 'blue'));
  });

  qsa('[data-pref-seek]').forEach((btn) => {
    btn.classList.toggle('is-active', Number(btn.dataset.prefSeek) === Number(prefs.seekStepSeconds));
  });

  const historySwitch = document.getElementById('setting-remember-history');
  const resumeSwitch = document.getElementById('setting-resume-playback');
  if (historySwitch) historySwitch.setAttribute('aria-checked', prefs.rememberHistory ? 'true' : 'false');
  if (resumeSwitch) resumeSwitch.setAttribute('aria-checked', prefs.resumePlayback ? 'true' : 'false');
}
