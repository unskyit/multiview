import { createEl, clearNode } from '../utils/dom.js';
import { createIcon, setButtonIconAndText } from '../utils/icons.js';
import { getState } from '../state.js';
import { openQueueIndex } from '../core/file-opener.js';

const FILTER_MODES = [
  { name: 'Normal', css: 'none' },
  { name: 'Doc Scan', css: 'contrast(1.45) brightness(1.05)' },
  { name: 'B&W', css: 'grayscale(1) contrast(1.2)' },
  { name: 'Invert', css: 'invert(1)' }
];

export const imageViewer = {
  mount(container, descriptor, { onMetadataUpdate } = {}) {
    clearNode(container);
    let scale = 1;
    let rotation = 0;
    let flipX = 1;
    let panX = 0;
    let panY = 0;
    let filterIdx = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let lastTap = 0;

    const viewport = createEl('div', {
      className: 'image-viewport',
      tabindex: '0',
      'aria-label': `Image viewer for ${descriptor.name}`
    });

    const img = createEl('img', {
      src: descriptor.blobUrl || '',
      alt: descriptor.name,
      draggable: 'false'
    });

    const zoomLabel = createEl('span', { className: 'status-pill', textContent: '100%' });

    const applyTransform = () => {
      img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale * flipX}, ${scale}) rotate(${rotation}deg)`;
      img.style.filter = FILTER_MODES[filterIdx].css;
      zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    };

    img.addEventListener('load', () => {
      descriptor.dimensions = `${img.naturalWidth} × ${img.naturalHeight} px`;
      if (typeof onMetadataUpdate === 'function') {
        onMetadataUpdate(descriptor);
      }
    });

    img.addEventListener('error', () => {
      clearNode(viewport);
      viewport.appendChild(
        createEl('div', {
          className: 'card',
          style: 'max-width: 24rem; text-align: center;',
          textContent: 'Unable to decode this image file. It may be corrupted or use an unsupported profile.'
        })
      );
    });

    const onPointerDown = (e) => {
      const now = Date.now();
      if (now - lastTap < 280) {
        scale = scale > 1 ? 1 : 2.5;
        if (scale === 1) {
          panX = 0;
          panY = 0;
        }
        applyTransform();
        lastTap = 0;
        return;
      }
      lastTap = now;
      if (scale <= 1) return;
      isDragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      viewport.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyTransform();
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      scale = Math.min(8, Math.max(0.25, Number((scale + delta).toFixed(2))));
      if (scale === 1) {
        panX = 0;
        panY = 0;
      }
      applyTransform();
    };

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('wheel', onWheel, { passive: false });

    const zoomOutBtn = createEl('button', {
      className: 'btn btn-secondary',
      'aria-label': 'Zoom out',
      onClick: () => {
        scale = Math.max(0.25, Number((scale - 0.25).toFixed(2)));
        if (scale <= 1) { panX = 0; panY = 0; }
        applyTransform();
      }
    }, [createIcon('zoomOut')]);

    const zoomInBtn = createEl('button', {
      className: 'btn btn-secondary',
      'aria-label': 'Zoom in',
      onClick: () => {
        scale = Math.min(8, Number((scale + 0.25).toFixed(2)));
        applyTransform();
      }
    }, [createIcon('zoomIn')]);

    const rotateBtn = createEl('button', {
      className: 'btn btn-secondary',
      onClick: () => {
        rotation = (rotation + 90) % 360;
        applyTransform();
      }
    }, [createIcon('rotateCw'), createEl('span', { textContent: '90°' })]);

    const flipBtn = createEl('button', {
      className: 'btn btn-secondary',
      'aria-label': 'Flip horizontal',
      onClick: () => {
        flipX = flipX * -1;
        applyTransform();
      }
    }, [createIcon('flipH'), createEl('span', { textContent: 'Flip' })]);

    const filterBtn = createEl('button', {
      className: 'btn btn-secondary',
      onClick: () => {
        filterIdx = (filterIdx + 1) % FILTER_MODES.length;
        setButtonIconAndText(filterBtn, 'contrast', FILTER_MODES[filterIdx].name);
        applyTransform();
      }
    }, [createIcon('contrast'), createEl('span', { textContent: 'Normal' })]);

    const resetBtn = createEl('button', {
      className: 'btn btn-secondary',
      textContent: 'Reset',
      onClick: () => {
        scale = 1;
        rotation = 0;
        flipX = 1;
        panX = 0;
        panY = 0;
        filterIdx = 0;
        setButtonIconAndText(filterBtn, 'contrast', 'Normal');
        applyTransform();
      }
    });

    const fullscreenBtn = createEl('button', {
      className: 'btn btn-secondary',
      'aria-label': 'Toggle viewer fullscreen',
      onClick: () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    }, [createIcon('fullscreen')]);

    const toolbarChildren = [zoomOutBtn, zoomLabel, zoomInBtn, rotateBtn, flipBtn, filterBtn, resetBtn, fullscreenBtn];

    const { fileQueue, queueIndex } = getState();
    if (fileQueue.length > 1) {
      toolbarChildren.unshift(
        createEl('button', {
          className: 'btn btn-secondary',
          disabled: queueIndex <= 0,
          onClick: () => openQueueIndex(queueIndex - 1)
        }, [createIcon('chevronLeft'), createEl('span', { textContent: 'Prev' })])
      );
      toolbarChildren.push(
        createEl('button', {
          className: 'btn btn-secondary',
          disabled: queueIndex >= fileQueue.length - 1,
          onClick: () => openQueueIndex(queueIndex + 1)
        }, [createEl('span', { textContent: 'Next' }), createIcon('chevronRight')])
      );
    }

    const toolbar = createEl('div', { className: 'viewer-toolbar' }, toolbarChildren);
    viewport.appendChild(img);
    container.append(viewport, toolbar);

    return () => {
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('wheel', onWheel);
      img.src = '';
    };
  }
};
