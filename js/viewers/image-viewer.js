import { createEl, clearNode } from '../utils/dom.js';
import { getState } from '../state.js';
import { openQueueIndex } from '../core/file-opener.js';
import { createIcon } from '../utils/icons.js';
import { inspectImageMetadata } from '../../vendor/exif-parser.js';

const FILTER_PRESETS = [
  { name: 'Original', filter: '' },
  { name: 'Vivid', filter: 'saturate(1.38) contrast(1.1)' },
  { name: 'Doc Scan', filter: 'contrast(1.55) brightness(1.06) grayscale(0.2)' },
  { name: 'B&W', filter: 'grayscale(1) contrast(1.25)' },
  { name: 'Invert', filter: 'invert(1)' }
];

export const imageViewer = {
  mount(container, descriptor, { onMetadataUpdate } = {}) {
    clearNode(container);
    let scale = 1;
    let rotation = 0;
    let flipX = 1;
    let panX = 0;
    let panY = 0;
    let presetIdx = 0;
    let brightness = 100;
    let contrast = 100;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let lastTap = 0;
    let initialPinchDist = null;
    let initialPinchScale = 1;

    const viewport = createEl('div', {
      className: 'image-viewport',
      tabindex: '0',
      'aria-label': `Photo viewer for ${descriptor.name}`
    });

    const img = createEl('img', {
      src: descriptor.blobUrl || '',
      alt: descriptor.name,
      draggable: 'false'
    });

    const zoomBadge = createEl('span', { className: 'status-pill', textContent: '100%' });

    const applyTransform = () => {
      img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale * flipX}, ${scale}) rotate(${rotation}deg)`;
      const baseFilter = FILTER_PRESETS[presetIdx].filter;
      const customAdjust = `brightness(${brightness}%) contrast(${contrast}%)`;
      img.style.filter = baseFilter ? `${baseFilter} ${customAdjust}` : customAdjust;
      zoomBadge.textContent = `${Math.round(scale * 100)}%`;
    };

    img.addEventListener('load', async () => {
      const exif = await inspectImageMetadata(descriptor.file);
      descriptor.dimensions = `${img.naturalWidth} × ${img.naturalHeight} px${exif.colorSpace ? ` • ${exif.colorSpace}` : ''}`;
      if (typeof onMetadataUpdate === 'function') onMetadataUpdate(descriptor);
    });

    img.addEventListener('error', () => {
      clearNode(viewport);
      viewport.appendChild(
        createEl('div', {
          className: 'card',
          style: 'max-width: 22rem; text-align: center;',
          textContent: 'Unable to decode this image file.'
        })
      );
    });

    // Multi-touch Pinch-to-Zoom & Double-Tap Zoom
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialPinchScale = scale;
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialPinchDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        scale = Math.min(8, Math.max(0.5, Number((initialPinchScale * (dist / initialPinchDist)).toFixed(2))));
        if (scale <= 1) { panX = 0; panY = 0; }
        applyTransform();
      }
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      initialPinchDist = null;
    });

    const onPointerDown = (e) => {
      const now = Date.now();
      if (now - lastTap < 280) {
        scale = scale > 1 ? 1 : 2.5;
        if (scale === 1) { panX = 0; panY = 0; }
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

    const onPointerUp = () => { isDragging = false; };

    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      scale = Math.min(8, Math.max(0.25, Number((scale + delta).toFixed(2))));
      if (scale === 1) { panX = 0; panY = 0; }
      applyTransform();
    };

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('wheel', onWheel, { passive: false });

    // Preset Filter Chips
    const filterChipGroup = createEl('div', { className: 'chip-group', role: 'group', 'aria-label': 'Image filters' });
    const renderFilterChips = () => {
      clearNode(filterChipGroup);
      FILTER_PRESETS.forEach((preset, idx) => {
        filterChipGroup.appendChild(
          createEl('button', {
            type: 'button',
            className: `chip-btn${idx === presetIdx ? ' is-active' : ''}`,
            textContent: preset.name,
            onClick: () => {
              presetIdx = idx;
              renderFilterChips();
              applyTransform();
            }
          })
        );
      });
    };
    renderFilterChips();

    // Brightness & Contrast Sliders
    const adjustRow = createEl('div', { className: 'adjust-sliders-row' }, [
      createEl('label', { style: 'display:flex;align-items:center;gap:0.5rem;' }, [
        createEl('span', { textContent: 'Brightness' }),
        createEl('input', {
          type: 'range',
          className: 'video-seek-slider',
          min: '50',
          max: '150',
          value: '100',
          onInput: (e) => {
            brightness = Number(e.target.value);
            applyTransform();
          }
        })
      ]),
      createEl('label', { style: 'display:flex;align-items:center;gap:0.5rem;' }, [
        createEl('span', { textContent: 'Contrast' }),
        createEl('input', {
          type: 'range',
          className: 'video-seek-slider',
          min: '50',
          max: '160',
          value: '100',
          onInput: (e) => {
            contrast = Number(e.target.value);
            applyTransform();
          }
        })
      ])
    ]);

    const zoomOutBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      'aria-label': 'Zoom out',
      onClick: () => {
        scale = Math.max(0.25, Number((scale - 0.25).toFixed(2)));
        if (scale <= 1) { panX = 0; panY = 0; }
        applyTransform();
      }
    }, [createIcon('zoomOut')]);

    const zoomInBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      'aria-label': 'Zoom in',
      onClick: () => {
        scale = Math.min(8, Number((scale + 0.25).toFixed(2)));
        applyTransform();
      }
    }, [createIcon('zoomIn')]);

    const rotateBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      onClick: () => {
        rotation = (rotation + 90) % 360;
        applyTransform();
      }
    }, [createIcon('rotateCw'), createEl('span', { textContent: '90°' })]);

    const flipBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      onClick: () => {
        flipX = flipX * -1;
        applyTransform();
      }
    }, [createIcon('flipH'), createEl('span', { textContent: 'Flip' })]);

    const tuneToggleBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      onClick: () => {
        adjustRow.classList.toggle('is-open');
      }
    }, [createIcon('contrast'), createEl('span', { textContent: 'Tune' })]);

    const resetBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      textContent: 'Reset',
      onClick: () => {
        scale = 1;
        rotation = 0;
        flipX = 1;
        panX = 0;
        panY = 0;
        presetIdx = 0;
        brightness = 100;
        contrast = 100;
        renderFilterChips();
        applyTransform();
      }
    });

    const fullscreenBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      'aria-label': 'Fullscreen photo',
      onClick: () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    }, [createIcon('fullscreen')]);

    const toolbarChildren = [zoomOutBtn, zoomBadge, zoomInBtn, rotateBtn, flipBtn, tuneToggleBtn, resetBtn, fullscreenBtn];

    const { fileQueue, queueIndex } = getState();
    if (fileQueue.length > 1) {
      toolbarChildren.unshift(
        createEl('button', {
          type: 'button',
          className: 'btn btn-secondary',
          disabled: queueIndex <= 0,
          onClick: () => openQueueIndex(queueIndex - 1)
        }, [createIcon('chevronLeft')])
      );
      toolbarChildren.push(
        createEl('button', {
          type: 'button',
          className: 'btn btn-secondary',
          disabled: queueIndex >= fileQueue.length - 1,
          onClick: () => openQueueIndex(queueIndex + 1)
        }, [createIcon('chevronRight')])
      );
    }

    const dock = createEl('div', { className: 'viewer-floating-dock' }, [
      createEl('div', { className: 'viewer-toolbar' }, toolbarChildren),
      createEl('div', { className: 'viewer-toolbar' }, [filterChipGroup]),
      adjustRow
    ]);

    viewport.appendChild(img);
    container.append(viewport, dock);

    return () => {
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('wheel', onWheel);
      img.src = '';
    };
  }
};
