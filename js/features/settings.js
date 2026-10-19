import { getState } from '../state.js';
import { updatePreferences, resetPreferences } from '../storage/preferences.js';
import { clearHistory } from '../storage/history.js';
import { openInstallInstructionsModal } from './install-prompt.js';
import { showToast, clearNode } from '../utils/dom.js';
import { createIcon } from '../utils/icons.js';

/**
 * Applies Dark (True AMOLED #000000) or Light (#ffffff) theme,
 * updates the Calm Blue vs. Monochrome accent attribute, and dynamically
 * updates <meta name="theme-color"> so the Android system status bar matches immediately.
 */
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

  const themeSelect = document.getElementById('setting-theme');
  const accentSelect = document.getElementById('setting-accent');
  const seekSelect = document.getElementById('setting-seek-step');
  const historyCheckbox = document.getElementById('setting-remember-history');
  const resumeCheckbox = document.getElementById('setting-resume-playback');
  const clearHistoryBtn = document.getElementById('btn-clear-history');
  const resetSettingsBtn = document.getElementById('btn-reset-settings');
  const showInstallHelpBtn = document.getElementById('btn-settings-install-help');

  themeSelect?.addEventListener('change', (e) => {
    const updated = updatePreferences({ theme: e.target.value });
    applyThemeAndAccent(updated.theme, updated.accent);
  });

  accentSelect?.addEventListener('change', (e) => {
    const updated = updatePreferences({ accent: e.target.value });
    applyThemeAndAccent(updated.theme, updated.accent);
    showToast(
      updated.accent === 'mono' ? 'Switched to Pure Monochrome (Black & White).' : 'Switched to Calm Blue accent.',
      'info',
      2000
    );
  });

  seekSelect?.addEventListener('change', (e) => {
    updatePreferences({ seekStepSeconds: Number(e.target.value) || 10 });
    showToast(`Double-tap seek interval set to ${e.target.value}s.`, 'info', 2000);
  });

  historyCheckbox?.addEventListener('change', (e) => {
    updatePreferences({ rememberHistory: Boolean(e.target.checked) });
  });

  resumeCheckbox?.addEventListener('change', (e) => {
    updatePreferences({ resumePlayback: Boolean(e.target.checked) });
  });

  clearHistoryBtn?.addEventListener('click', () => {
    clearHistory();
    showToast('Cleared recent file history and playback positions.', 'info');
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
  const themeSelect = document.getElementById('setting-theme');
  const accentSelect = document.getElementById('setting-accent');
  const seekSelect = document.getElementById('setting-seek-step');
  const historyCheckbox = document.getElementById('setting-remember-history');
  const resumeCheckbox = document.getElementById('setting-resume-playback');

  if (themeSelect) themeSelect.value = prefs.theme;
  if (accentSelect) accentSelect.value = prefs.accent || 'blue';
  if (seekSelect) seekSelect.value = String(prefs.seekStepSeconds);
  if (historyCheckbox) historyCheckbox.checked = Boolean(prefs.rememberHistory);
  if (resumeCheckbox) resumeCheckbox.checked = Boolean(prefs.resumePlayback);
}
