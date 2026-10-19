import { getState } from '../state.js';
import { getSessionDescriptor, removeHistoryEntry } from '../storage/history.js';
import { openFiles } from '../core/file-opener.js';
import { pickFilesFromWeb } from '../adapters/web-adapter.js';
import { formatBytes } from '../utils/format.js';
import { createEl, clearNode, showToast } from '../utils/dom.js';
import { createIcon } from '../utils/icons.js';

export function renderRecentAndCategoryLists() {
  const { recentHistory } = getState();
  const homeRecentEl = document.getElementById('recent-files-list');
  if (homeRecentEl) {
    populateFileList(homeRecentEl, recentHistory, 'No recent files opened yet. Tap Open File above or try a sample.');
  }

  const categoryMap = {
    photos: 'category-list-photos',
    videos: 'category-list-videos',
    audio: 'category-list-audio',
    documents: 'category-list-documents'
  };

  for (const [cat, elemId] of Object.entries(categoryMap)) {
    const el = document.getElementById(elemId);
    if (el) {
      const items = recentHistory.filter((item) => item.category === cat);
      populateFileList(el, items, `No recent ${cat} opened in this session.`);
    }
  }
}

function populateFileList(container, items, emptyMessage) {
  clearNode(container);
  if (!items || items.length === 0) {
    container.appendChild(
      createEl('div', {
        className: 'card',
        style: 'color: var(--text-muted); font-size: 0.84rem;',
        textContent: emptyMessage
      })
    );
    return;
  }

  for (const item of items) {
    const inMemory = getSessionDescriptor(item.id);
    const row = createEl('div', { className: 'file-row' }, [
      createEl('div', { className: 'file-row-main' }, [
        createEl('span', { className: 'status-pill', textContent: item.viewer.toUpperCase() }),
        createEl('div', { style: 'min-width: 0; flex: 1;' }, [
          createEl('div', { className: 'file-row-title', textContent: item.name }),
          createEl('div', {
            className: 'file-row-meta',
            textContent: `${formatBytes(item.size)} • ${item.mime} • ${inMemory ? 'Active in session' : 'Re-select file'}`
          })
        ])
      ]),
      createEl('div', { className: 'header-actions' }, [
        createEl('button', {
          className: 'btn btn-secondary',
          textContent: inMemory ? 'Open' : 'Browse',
          onClick: async () => {
            if (inMemory && (inMemory.file || inMemory.nativeUri)) {
              await openFiles([inMemory.file || inMemory], { sourceType: inMemory.sourceType });
            } else {
              showToast('Select the file from your device to grant fresh browser access.', 'info');
              await pickFilesFromWeb();
            }
          }
        }),
        createEl(
          'button',
          {
            className: 'btn-icon',
            'aria-label': `Remove ${item.name} from recent list`,
            onClick: () => removeHistoryEntry(item.id)
          },
          [createIcon('close')]
        )
      ])
    ]);
    container.appendChild(row);
  }
}
