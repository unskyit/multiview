import { createEl, clearNode } from '../utils/dom.js';
import { createIcon } from '../utils/icons.js';
import { formatBytes } from '../utils/format.js';
import { saveFileAs } from '../features/save-file.js';
import { shareCurrentFile } from '../features/share-file.js';

export const unsupportedViewer = {
  mount(container, descriptor) {
    clearNode(container);
    const wrap = createEl(
      'div',
      {
        className: 'card',
        style: 'margin: var(--space-4); text-align: center; align-items: center;'
      },
      [
        createEl('div', { className: 'hero-icon-ring' }, [createIcon('alert')]),
        createEl('h3', { textContent: 'Direct Preview Unavailable for This Format' }),
        createEl('p', {
          className: 'hero-subtitle',
          textContent:
            descriptor.reason ||
            `MultiView cannot natively decode "${descriptor.name}" (${descriptor.mime || 'unknown type'}) without external conversion libraries.`
        }),
        createEl('p', {
          className: 'viewer-file-sub',
          textContent: `Size: ${formatBytes(descriptor.size)} • Source: ${descriptor.sourceType}`
        }),
        createEl(
          'div',
          { className: 'header-actions', style: 'margin-top: 0.5rem; flex-wrap: wrap; justify-content: center;' },
          [
            createEl(
              'button',
              {
                className: 'btn btn-primary',
                onClick: () => saveFileAs(descriptor)
              },
              [createIcon('download'), createEl('span', { textContent: 'Save File As' })]
            ),
            createEl(
              'button',
              {
                className: 'btn btn-secondary',
                onClick: () => shareCurrentFile(descriptor)
              },
              [createIcon('share'), createEl('span', { textContent: 'Share File' })]
            )
          ]
        )
      ]
    );

    container.appendChild(wrap);
    return () => {};
  }
};
