import { createEl, clearNode, showToast } from '../utils/dom.js';
import { createIcon } from '../utils/icons.js';
import { APP_CONFIG } from '../config.js';
import { formatBytes } from '../utils/format.js';

function parseCsvRows(text, delimiter = ',') {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.slice(0, 500).map((line) => line.split(delimiter).map((cell) => cell.trim()));
}

export const textViewer = {
  mount(container, descriptor) {
    clearNode(container);
    let isCancelled = false;
    let rawText = '';
    let fontSizeRem = 0.82;

    const searchInput = createEl('input', {
      type: 'search',
      className: 'text-search-input',
      placeholder: 'Search lines...',
      'aria-label': 'Search within document'
    });

    const matchBadge = createEl('span', { className: 'status-pill', textContent: 'Loading...' });

    const fontDownBtn = createEl('button', {
      className: 'btn btn-secondary',
      textContent: 'A−',
      'aria-label': 'Decrease text size',
      onClick: () => {
        fontSizeRem = Math.max(0.68, Number((fontSizeRem - 0.08).toFixed(2)));
        preEl.style.fontSize = `${fontSizeRem}rem`;
      }
    });

    const fontUpBtn = createEl('button', {
      className: 'btn btn-secondary',
      textContent: 'A+',
      'aria-label': 'Increase text size',
      onClick: () => {
        fontSizeRem = Math.min(1.35, Number((fontSizeRem + 0.08).toFixed(2)));
        preEl.style.fontSize = `${fontSizeRem}rem`;
      }
    });

    const copyBtn = createEl('button', {
      className: 'btn btn-secondary',
      onClick: async () => {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(rawText);
          } else {
            const ta = createEl('textarea', { value: rawText });
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          showToast('Copied text to clipboard.', 'info', 2200);
        } catch (_) {
          showToast('Clipboard access was denied.', 'error');
        }
      }
    }, [createIcon('copy'), createEl('span', { textContent: 'Copy' })]);

    const contentHost = createEl('div');
    const preEl = createEl('pre', { className: 'text-content-pre', textContent: 'Reading local file...' });
    contentHost.appendChild(preEl);

    const renderFilteredText = (query = '') => {
      const q = query.trim().toLowerCase();
      if (!q) {
        preEl.textContent = rawText;
        const lineCount = rawText ? rawText.split(/\r?\n/).length : 0;
        matchBadge.textContent = `${lineCount} lines`;
        return;
      }
      const lines = rawText.split(/\r?\n/);
      const matched = lines.filter((line) => line.toLowerCase().includes(q));
      preEl.textContent = matched.length > 0 ? matched.join('\n') : `No lines matching "${query}".`;
      matchBadge.textContent = `${matched.length} matches`;
    };

    searchInput.addEventListener('input', () => renderFilteredText(searchInput.value));

    const header = createEl('div', { className: 'text-viewer-header' }, [
      createEl('div', { className: 'header-actions', style: 'flex: 1 1 180px;' }, [searchInput, matchBadge]),
      createEl('div', { className: 'header-actions' }, [fontDownBtn, fontUpBtn, copyBtn])
    ]);

    container.append(header, contentHost);

    (async () => {
      try {
        if (!descriptor.file) {
          preEl.textContent = 'Ready.';
          return;
        }
        const maxBytes = APP_CONFIG.defaults.textPreviewSafeBytes;
        const isPartial = descriptor.file.size > maxBytes;
        const slice = descriptor.file.slice(0, maxBytes);
        let text = await slice.text();
        if (isCancelled) return;

        if (descriptor.subtype === 'json' && !isPartial) {
          try {
            text = JSON.stringify(JSON.parse(text), null, 2);
          } catch (_) {}
        }

        rawText = text;

        if (descriptor.subtype === 'csv') {
          const delim = descriptor.extension === 'tsv' ? '\t' : ',';
          const rows = parseCsvRows(rawText, delim);
          if (rows.length > 0) {
            const tableWrap = createEl('div', { className: 'csv-table-wrap' });
            const table = createEl('table', { className: 'csv-table' });
            const thead = createEl('thead');
            const trHead = createEl('tr');
            for (const col of rows[0]) {
              trHead.appendChild(createEl('th', { textContent: col }));
            }
            thead.appendChild(trHead);
            const tbody = createEl('tbody');
            for (const row of rows.slice(1)) {
              const tr = createEl('tr');
              for (const cell of row) {
                tr.appendChild(createEl('td', { textContent: cell }));
              }
              tbody.appendChild(tr);
            }
            table.append(thead, tbody);
            tableWrap.appendChild(table);
            clearNode(contentHost);
            contentHost.appendChild(tableWrap);
            matchBadge.textContent = `${rows.length - 1} rows`;
            return;
          }
        }

        renderFilteredText('');
        if (isPartial) {
          showToast(
            `Showing first ${formatBytes(maxBytes)} of ${formatBytes(descriptor.file.size)} to preserve memory.`,
            'info',
            4500
          );
        }
      } catch (err) {
        if (!isCancelled) {
          preEl.textContent = `Unable to read text content: ${err.message || 'Read error'}`;
        }
      }
    })();

    return () => {
      isCancelled = true;
      rawText = '';
    };
  }
};
