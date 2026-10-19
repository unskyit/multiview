import { createEl, clearNode } from '../utils/dom.js';
import { createIcon } from '../utils/icons.js';

export const pdfViewer = {
  mount(container, descriptor) {
    clearNode(container);
    const url = descriptor.blobUrl || '';

    const headerBar = createEl('div', { className: 'text-viewer-header' }, [
      createEl('span', {
        className: 'viewer-file-sub',
        textContent: 'Local PDF Document Viewer'
      }),
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

    return () => {
      frame.src = 'about:blank';
    };
  }
};
