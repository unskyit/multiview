import { createEl, clearNode, showToast } from '../utils/dom.js';
import { formatDuration, formatBytes } from '../utils/format.js';
import { getState } from '../state.js';
import { openQueueIndex } from '../core/file-opener.js';
import { createIcon, setButtonIconAndText } from '../utils/icons.js';
import { attachAudioVisualizer } from '../../vendor/audio-visualizer.js';

export const audioViewer = {
  mount(container, descriptor, { onMetadataUpdate } = {}) {
    clearNode(container);
    const audio = new Audio(descriptor.blobUrl || '');
    audio.preload = 'metadata';

    let sleepTimerId = null;
    let sleepMinutes = 0;
    let repeatMode = false;

    const artwork = createEl('div', { className: 'audio-artwork', 'aria-hidden': 'true' }, [
      createIcon('audio')
    ]);

    const visualizerCanvas = createEl('canvas', {
      className: 'audio-visualizer-canvas',
      width: '360',
      height: '58',
      'aria-label': 'Real-time audio spectrum visualizer'
    });

    const detachVisualizer = attachAudioVisualizer(audio, visualizerCanvas);

    const titleEl = createEl('h3', {
      style: 'font-size: 1.05rem; font-weight: 700; word-break: break-word;',
      textContent: descriptor.name
    });
    const metaEl = createEl('p', {
      className: 'viewer-file-sub',
      textContent: `${descriptor.mime} • ${formatBytes(descriptor.size)}`
    });

    const playBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-primary',
      style: 'min-width: 128px;',
      onClick: () => {
        if (audio.paused) {
          audio.play().catch((err) => showToast('Playback error: ' + err.message, 'error'));
        } else {
          audio.pause();
        }
      }
    }, [createIcon('play'), createEl('span', { textContent: 'Play' })]);

    const back10Btn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      textContent: '−10s',
      onClick: () => { audio.currentTime = Math.max(0, audio.currentTime - 10); }
    });

    const fwd10Btn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      textContent: '+10s',
      onClick: () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); }
    });

    const elapsedEl = createEl('span', { textContent: '0:00' });
    const durationEl = createEl('span', { textContent: '0:00' });
    const seekInput = createEl('input', {
      type: 'range',
      className: 'video-seek-slider',
      min: '0',
      max: '100',
      step: '0.2',
      value: '0',
      'aria-label': 'Audio timeline'
    });

    seekInput.addEventListener('input', () => {
      if (audio.duration) {
        audio.currentTime = (Number(seekInput.value) / 100) * audio.duration;
      }
    });

    const repeatBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      onClick: () => {
        repeatMode = !repeatMode;
        audio.loop = repeatMode;
        setButtonIconAndText(repeatBtn, 'repeat', repeatMode ? 'Repeat: On' : 'Repeat');
      }
    }, [createIcon('repeat'), createEl('span', { textContent: 'Repeat' })]);

    // Native Pill-Chip Speed Selector (Zero <select> dropdowns!)
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const speedGroup = createEl('div', { className: 'chip-group', role: 'group', 'aria-label': 'Audio speed' });
    const renderSpeedChips = () => {
      clearNode(speedGroup);
      for (const rate of speeds) {
        speedGroup.appendChild(
          createEl('button', {
            type: 'button',
            className: `chip-btn${audio.playbackRate === rate ? ' is-active' : ''}`,
            textContent: `${rate}×`,
            onClick: () => {
              audio.playbackRate = rate;
              renderSpeedChips();
            }
          })
        );
      }
    };
    renderSpeedChips();

    // Native Pill-Chip Sleep Timer Selector
    const sleepOptions = [
      { mins: 0, label: 'Sleep: Off' },
      { mins: 5, label: '5m' },
      { mins: 15, label: '15m' },
      { mins: 30, label: '30m' }
    ];
    const sleepGroup = createEl('div', { className: 'chip-group', role: 'group', 'aria-label': 'Sleep timer' });
    const renderSleepChips = () => {
      clearNode(sleepGroup);
      for (const opt of sleepOptions) {
        sleepGroup.appendChild(
          createEl('button', {
            type: 'button',
            className: `chip-btn${sleepMinutes === opt.mins ? ' is-active' : ''}`,
            textContent: opt.label,
            onClick: () => {
              if (sleepTimerId) {
                clearTimeout(sleepTimerId);
                sleepTimerId = null;
              }
              sleepMinutes = opt.mins;
              renderSleepChips();
              if (opt.mins > 0) {
                sleepTimerId = setTimeout(() => {
                  audio.pause();
                  sleepMinutes = 0;
                  renderSleepChips();
                  showToast(`Sleep timer (${opt.mins}m) paused audio playback.`, 'info');
                }, opt.mins * 60 * 1000);
                showToast(`Sleep timer set for ${opt.mins} minutes.`, 'info', 2000);
              }
            }
          })
        );
      }
    };
    renderSleepChips();

    audio.addEventListener('loadedmetadata', () => {
      durationEl.textContent = formatDuration(audio.duration);
      descriptor.duration = formatDuration(audio.duration);
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: descriptor.name,
            artist: 'MultiView Studio Audio'
          });
          navigator.mediaSession.setActionHandler('play', () => audio.play());
          navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        } catch (_) {}
      }
      if (typeof onMetadataUpdate === 'function') onMetadataUpdate(descriptor);
    });

    audio.addEventListener('timeupdate', () => {
      elapsedEl.textContent = formatDuration(audio.currentTime);
      if (audio.duration > 0) {
        seekInput.value = String((audio.currentTime / audio.duration) * 100);
      }
    });

    audio.addEventListener('play', () => {
      artwork.classList.add('is-playing');
      setButtonIconAndText(playBtn, 'pause', 'Pause');
    });

    audio.addEventListener('pause', () => {
      artwork.classList.remove('is-playing');
      setButtonIconAndText(playBtn, 'play', 'Play');
    });

    audio.addEventListener('ended', () => {
      const { fileQueue, queueIndex } = getState();
      if (!repeatMode && queueIndex + 1 < fileQueue.length) {
        openQueueIndex(queueIndex + 1);
      }
    });

    const deck = createEl('div', { className: 'audio-deck' }, [
      artwork,
      titleEl,
      metaEl,
      visualizerCanvas,
      createEl('div', { className: 'video-seek-row', style: 'width: 100%; max-width: 420px;' }, [
        elapsedEl,
        seekInput,
        durationEl
      ]),
      createEl('div', { className: 'viewer-toolbar' }, [
        back10Btn,
        playBtn,
        fwd10Btn,
        repeatBtn
      ]),
      createEl('div', { className: 'viewer-toolbar' }, [speedGroup, sleepGroup])
    ]);

    container.appendChild(deck);

    return () => {
      if (sleepTimerId) clearTimeout(sleepTimerId);
      detachVisualizer();
      audio.pause();
      audio.src = '';
    };
  }
};
