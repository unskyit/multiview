import { createEl, clearNode } from '../utils/dom.js';
import { createIcon } from '../utils/icons.js';
import { inspectPdfDocument } from '../../vendor/pdf-inspector.js';

export const pdfViewer = {
  mount(container, descriptor, { onMetadataUpdate } = {}) {
    clearNode(container);
    const url = descriptor.blobUrl || '';

    const metaBadge = createEl('span', {
      className: 'status-pill',
      textContent: 'PDF Document'
    });

    const headerBar = createEl('div', { className: 'text-viewer-header' }, [
      metaBadge,
      createEl('div', { className: 'header-actions' }, [
        createEl('a', {
          className: 'btn btn-secondary',
          href: url,
          target: '_blank',
          rel: 'noopener'
        }, [createIcon('external'), createEl('span', { textContent: 'Open Tab' })]),
        createEl('a', {
          className: 'btn btn-primary',
          href: url,
          download: descriptor.name
        }, [createIcon('download'), createEl('span', { textContent: 'Save PDF' })])
      ])
    ]);

    const frame = createEl('iframe', {
      className: 'pdf-frame',
      src: url,
      title: `PDF Viewer: ${descriptor.name}`
    });

    container.append(headerBar, frame);

    (async () => {
      const info = await inspectPdfDocument(descriptor.file);
      metaBadge.textContent = `PDF v${info.version} • ${info.pageCount} page(s)`;
      descriptor.dimensions = `${info.pageCount} page(s)`;
      if (typeof onMetadataUpdate === 'function') onMetadataUpdate(descriptor);
    })();

    return () => {
      frame.src = 'about:blank';
    };
  }
};
