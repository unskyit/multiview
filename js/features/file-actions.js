import { createEl, clearNode, showToast } from '../utils/dom.js';
import { evaluateFilePermissions } from '../core/permissions.js';
import { saveFileAs } from './save-file.js';
import { copyCurrentFile } from './copy-file.js';
import { moveCurrentFile } from './move-file.js';
import { shareCurrentFile, openWithExternalApp } from './share-file.js';
import { formatBytes } from '../utils/format.js';
import { createIcon } from '../utils/icons.js';

export function renderFileActionsMenu(menuEl, descriptor, { onShowFileInfo, onCloseMenu } = {}) {
  if (!menuEl) return;
  clearNode(menuEl);
  const perms = evaluateFilePermissions(descriptor);

  // Native Android Bottom Sheet Drag Handle & Header
  menuEl.appendChild(createEl('div', { className: 'sheet-handle', 'aria-hidden': 'true' }));
  menuEl.appendChild(
    createEl('div', { className: 'sheet-header' }, [
      createEl('div', { style: 'min-width: 0;' }, [
        createEl('div', { className: 'file-row-title', textContent: descriptor ? descriptor.name : 'File Actions' }),
        createEl('div', {
          className: 'file-row-meta',
          textContent: descriptor ? `${descriptor.mime || 'File'} • ${formatBytes(descriptor.size)}` : ''
        })
      ]),
      createEl(
        'button',
        {
          type: 'button',
          className: 'btn-icon',
          'aria-label': 'Close actions sheet',
          onClick: () => {
            if (typeof onCloseMenu === 'function') onCloseMenu();
          }
        },
        [createIcon('close')]
      )
    ])
  );

  const items = [
    {
      id: 'action-save-as',
      icon: 'download',
      label: 'Save to Device',
      enabled: perms.canSaveAs,
      hint: 'Download',
      run: () => saveFileAs(descriptor)
    },
    {
      id: 'action-copy',
      icon: 'copy',
      label: 'Copy to Folder',
      enabled: perms.canCopy,
      hint: 'Duplicate',
      run: () => copyCurrentFile(descriptor)
    },
    {
      id: 'action-share',
      icon: 'share',
      label: 'Share File',
      enabled: perms.canShare,
      hint: perms.canShare ? 'System Share' : 'Unavailable',
      disabledReason: 'System file sharing is unavailable in this browser.',
      run: () => shareCurrentFile(descriptor)
    },
    {
      id: 'action-open-with',
      icon: 'external',
      label: 'Open in External App',
      enabled: perms.canOpenWith || perms.canShare,
      hint: perms.canOpenWith ? 'Android Intent' : 'Share Sheet',
      disabledReason: perms.explanations.openWith,
      run: () => openWithExternalApp(descriptor)
    },
    {
      id: 'action-file-info',
      icon: 'info',
      label: 'Properties & Metadata',
      enabled: Boolean(descriptor),
      hint: 'EXIF / Info',
      run: () => {
        if (typeof onShowFileInfo === 'function') onShowFileInfo(descriptor);
      }
    },
    {
      id: 'action-move',
      icon: 'move',
      label: 'Move File',
      enabled: perms.canMove,
      hint: perms.canMove ? 'Verified' : 'Read-only',
      disabledReason: perms.explanations.move,
      run: () => moveCurrentFile(descriptor)
    },
    {
      id: 'action-delete',
      icon: 'trash',
      label: 'Delete Source File',
      enabled: perms.canDelete,
      hint: perms.canDelete ? 'Delete' : 'Read-only',
      disabledReason: perms.explanations.delete,
      run: async () => {
        if (!perms.canDelete) {
          showToast(perms.explanations.delete, 'warning', 4500);
          return;
        }
        if (descriptor.fileHandle?.remove) {
          await descriptor.fileHandle.remove();
          showToast(`Deleted "${descriptor.name}".`, 'info');
        }
      }
    }
  ];

  for (const item of items) {
    const btn = createEl(
      'button',
      {
        type: 'button',
        className: 'action-menu-item',
        id: item.id,
        role: 'menuitem',
        'aria-disabled': item.enabled ? 'false' : 'true',
        onClick: async () => {
          if (typeof onCloseMenu === 'function') onCloseMenu();
          if (!item.enabled) {
            showToast(item.disabledReason || 'Action unavailable for this file source.', 'warning', 4500);
            return;
          }
          await item.run();
        }
      },
      [
        createEl('span', { className: 'action-menu-item-left' }, [
          createIcon(item.icon),
          createEl('span', { textContent: item.label })
        ]),
        createEl('span', { className: 'file-row-meta', textContent: item.hint })
      ]
    );
    menuEl.appendChild(btn);
  }
}

export function openFileInfoModal(descriptor) {
  if (!descriptor) return;
  const backdrop = document.getElementById('modal-backdrop');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  if (!backdrop || !titleEl || !bodyEl) return;

  titleEl.textContent = 'Properties & Metadata';
  clearNode(bodyEl);

  const rows = [
    ['Filename', descriptor.name],
    ['Format', descriptor.mime || 'Unknown'],
    ['Category', `${descriptor.category} (${descriptor.viewer})`],
    ['File Size', formatBytes(descriptor.size)],
    ['Source', descriptor.sourceType || 'Local Storage'],
    ['Modified', descriptor.lastModified ? new Date(descriptor.lastModified).toLocaleString() : 'Unknown']
  ];

  if (descriptor.dimensions) rows.push(['Details', descriptor.dimensions]);
  if (descriptor.duration) rows.push(['Duration', descriptor.duration]);

  const dl = createEl('dl', { className: 'info-dl' });
  for (const [label, val] of rows) {
    dl.appendChild(createEl('dt', { textContent: label }));
    dl.appendChild(createEl('dd', { textContent: String(val) }));
  }

  bodyEl.appendChild(dl);
  backdrop.classList.add('is-open');
}
