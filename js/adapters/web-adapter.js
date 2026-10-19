import { detectCapabilities } from '../core/capabilities.js';
import { openFiles } from '../core/file-opener.js';
import { showToast } from '../utils/dom.js';

export async function pickFilesFromWeb({ accept = '', multiple = true } = {}) {
  const caps = detectCapabilities();

  if (caps.hasFileSystemAccess && !accept) {
    try {
      const handles = await window.showOpenFilePicker({ multiple });
      if (!handles || handles.length === 0) return [];
      const opened = [];
      for (const handle of handles) {
        const file = await handle.getFile();
        opened.push({ file, handle });
      }
      if (opened.length === 1) {
        await openFiles([opened[0].file], {
          fileHandle: opened[0].handle,
          sourceType: 'fs-access'
        });
      } else {
        await openFiles(
          opened.map((o) => o.file),
          { sourceType: 'fs-access' }
        );
      }
      return opened;
    } catch (err) {
      if (err && err.name === 'AbortError') return [];
    }
  }

  return new Promise((resolve) => {
    const input = document.getElementById('global-file-input');
    if (!input) {
      resolve([]);
      return;
    }
    input.accept = accept || '';
    input.multiple = Boolean(multiple);
    input.value = '';
    const onChange = async () => {
      input.removeEventListener('change', onChange);
      const files = Array.from(input.files || []);
      if (files.length > 0) {
        await openFiles(files, { sourceType: 'file-input' });
      }
      resolve(files);
    };
    input.addEventListener('change', onChange, { once: true });
    input.click();
  });
}

export function initWebLaunchAndShareIntake() {
  if (typeof window === 'undefined') return;

  if ('launchQueue' in window && window.launchQueue) {
    window.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams?.files || launchParams.files.length === 0) return;
      try {
        const files = [];
        for (const handle of launchParams.files) {
          if (typeof handle.getFile === 'function') {
            files.push(await handle.getFile());
          }
        }
        if (files.length > 0) {
          await openFiles(files, {
            fileHandle: launchParams.files[0],
            sourceType: 'pwa-file-handler'
          });
        }
      } catch (err) {
        showToast('Could not open file from system handler: ' + (err.message || 'Permission error'), 'error');
      }
    });
  }

  const url = new URL(window.location.href);
  if (url.searchParams.has('share-error')) {
    showToast('Incoming shared payload could not be read.', 'error');
    window.history.replaceState({}, '', './index.html');
  }

  const shareToken = url.searchParams.get('token');
  if (url.searchParams.has('share-target') && shareToken && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (!event.data) return;
      if (event.data.type === 'SHARED_FILES_PAYLOAD' && Array.isArray(event.data.files) && event.data.files.length > 0) {
        await openFiles(event.data.files, { sourceType: 'web-share-target' });
        showToast(`Opened ${event.data.files.length} shared file(s)`, 'info');
      } else if (event.data.type === 'SHARED_FILES_EMPTY') {
        showToast(event.data.reason || 'Shared file session expired.', 'warning');
      }
    });

    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: 'CLAIM_SHARED_FILES', token: shareToken });
      window.history.replaceState({}, '', './index.html');
    });
  }
}
