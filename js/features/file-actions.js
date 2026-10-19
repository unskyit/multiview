import { evaluateFilePermissions } from '../core/permissions.js';
import { saveFileAs } from './save-file.js';
import { copyCurrentFile } from './copy-file.js';
import { moveCurrentFile } from './move-file.js';
import { shareCurrentFile, openWithExternalApp } from './share-file.js';
import { formatBytes } from '../utils/format.js';
import { createEl, clearNode, showToast } from '../utils/dom.js';
import { createIcon } from '../utils/icons.js';

export function renderFileActionsMenu(menuEl, descriptor, { onShowFileInfo, onCloseMenu } = {}) {
  if (!menuEl) return;
  clearNode(menuEl);
  const perms = evaluateFilePermissions(descriptor);

  const items = [
    {
      id: 'action-save-as',
      icon: 'download',
      label: 'Save as…',
      enabled: perms.canSaveAs,
      hint: 'Download / SAF',
      run: () => saveFileAs(descriptor)
    },
    {
      id: 'action-copy',
      icon: 'copy',
      label: 'Copy to folder…',
      enabled: perms.canCopy,
      hint: 'Duplicate',
      run: () => copyCurrentFile(descriptor)
    },
    {
      id: 'action-move',
      icon: 'move',
      label: 'Move file…',
      enabled: perms.canMove,
      hint: perms.canMove ? 'Verified' : 'Read-only',
      disabledReason: perms.explanations.move,
      run: () => moveCurrentFile(descriptor)
    },
    {
      id: 'action-share',
      icon: 'share',
      label: 'Share…',
      enabled: perms.canShare,
      hint: perms.canShare ? 'System' : 'Unavailable',
      disabledReason: 'System file sharing is unavailable in this browser.',
      run: () => shareCurrentFile(descriptor)
    },
    {
      id: 'action-open-with',
      icon: 'external',
      label: 'Open with…',
      enabled: perms.canOpenWith || perms.canShare,
      hint: perms.canOpenWith ? 'Intent' : 'Share sheet',
      disabledReason: perms.explanations.openWith,
      run: () => openWithExternalApp(descriptor)
    },
    {
      id: 'action-file-info',
      icon: 'info',
      label: 'File information',
      enabled: Boolean(descriptor),
      hint: 'Details',
      run: () => {
        if (typeof onShowFileInfo === 'function') onShowFileInfo(descriptor);
      }
    },
    {
      id: 'action-delete',
      icon: 'trash',
      label: 'Delete source',
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

  titleEl.textContent = 'File Information';
  clearNode(bodyEl);

  const rows = [
    ['Filename', descriptor.name],
    ['Extension', descriptor.extension ? `.${descriptor.extension}` : 'None'],
    ['MIME Type', descriptor.mime || 'Unknown'],
    ['Viewer Route', `${descriptor.category} (${descriptor.viewer})`],
    ['File Size', formatBytes(descriptor.size)],
    ['Intake Source', descriptor.sourceType || 'Local'],
    ['Modified', descriptor.lastModified ? new Date(descriptor.lastModified).toLocaleString() : 'Unknown']
  ];

  if (descriptor.dimensions) rows.push(['Resolution', descriptor.dimensions]);
  if (descriptor.duration) rows.push(['Duration', descriptor.duration]);

  const dl = createEl('dl', { className: 'info-dl' });
  for (const [label, val] of rows) {
    dl.appendChild(createEl('dt', { textContent: label }));
    dl.appendChild(createEl('dd', { textContent: String(val) }));
  }

  bodyEl.appendChild(dl);
  backdrop.classList.add('is-open');
}
