export function detectCapabilities() {
  const hasWindow = typeof window !== 'undefined';
  const hasNav = typeof navigator !== 'undefined';
  const androidBridge = hasWindow && typeof window.MultiViewAndroid === 'object' && window.MultiViewAndroid !== null;

  return {
    isAndroidBridge: Boolean(androidBridge),
    hasFileSystemAccess: hasWindow && 'showOpenFilePicker' in window && 'showSaveFilePicker' in window,
    hasDirectoryPicker: hasWindow && 'showDirectoryPicker' in window,
    hasLaunchQueue: hasWindow && 'launchQueue' in window,
    hasWebShare: hasNav && typeof navigator.share === 'function',
    hasWebShareFiles: hasNav && typeof navigator.canShare === 'function',
    hasServiceWorker: hasNav && 'serviceWorker' in navigator,
    hasMediaSession: hasNav && 'mediaSession' in navigator,
    hasPictureInPicture: typeof document !== 'undefined' && 'pictureInPictureEnabled' in document,
    isStandaloneDisplay:
      hasWindow &&
      ((window.matchMedia &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches)) ||
        window.navigator?.standalone === true)
  };
}
