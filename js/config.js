export const APP_CONFIG = Object.freeze({
  appName: 'MultiView',
  version: '2.0.0',
  storageKeys: {
    preferences: 'multiview.preferences.v2',
    history: 'multiview.history.v2',
    installState: 'multiview.installState.v2',
    resumePositions: 'multiview.resume.v2'
  },
  defaults: {
    theme: 'dark',
    accent: 'blue',         // 'blue' (Calm Blue + AMOLED) or 'mono' (Pure Black & White)
    seekStepSeconds: 10,
    rememberHistory: true,
    resumePlayback: true,
    maxHistoryItems: 30,
    textPreviewSafeBytes: 2 * 1024 * 1024
  },
  categories: ['photos', 'videos', 'audio', 'documents', 'unsupported'],
  routes: ['home', 'open', 'photos', 'videos', 'audio', 'documents', 'settings']
});
