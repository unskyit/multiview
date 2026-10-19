import { createEl, clearNode, showToast } from '../utils/dom.js';
import { createIcon, setButtonIconAndText } from '../utils/icons.js';
import { formatDuration, formatBytes } from '../utils/format.js';
import { getState } from '../state.js';
import { openQueueIndex } from '../core/file-opener.js';

export const audioViewer = {
  mount(container, descriptor, { onMetadataUpdate } = {}) {
    clearNode(container);
    const audio = new Audio(descriptor.blobUrl || '');
    audio.preload = 'metadata';

    let sleepTimerId = null;
    let repeatMode = false;

    const artwork = createEl('div', { className: 'audio-artwork', 'aria-hidden': 'true' }, [
      createIcon('audio')
    ]);

    const titleEl = createEl('h3', {
      style: 'font-size: 1rem; font-weight: 700; word-break: break-word;',
      textContent: descriptor.name
    });
    const metaEl = createEl('p', {
      className: 'viewer-file-sub',
      textContent: `${descriptor.mime} • ${formatBytes(descriptor.size)}`
    });

    const playBtn = createEl('button', {
      className: 'btn btn-primary',
      onClick: () => {
        if (audio.paused) {
          audio.play().catch((err) => showToast('Playback error: ' + err.message, 'error'));
        } else {
          audio.pause();
        }
      }
    }, [createIcon('play'), createEl('span', { textContent: 'Play Audio' })]);

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
      className: 'btn btn-secondary',
      onClick: () => {
        repeatMode = !repeatMode;
        audio.loop = repeatMode;
        setButtonIconAndText(repeatBtn, 'repeat', `Repeat: ${repeatMode ? 'On' : 'Off'}`);
      }
    }, [createIcon('repeat'), createEl('span', { textContent: 'Repeat: Off' })]);

    const speedSelect = createEl(
      'select',
      {
        className: 'btn btn-secondary',
        'aria-label': 'Audio speed',
        onChange: (e) => {
          audio.playbackRate = Number(e.target.value) || 1;
        }
      },
      [0.75, 1, 1.25, 1.5, 2].map((rate) =>
        createEl('option', { value: String(rate), selected: rate === 1, textContent: `${rate}x` })
      )
    );

    const sleepSelect = createEl(
      'select',
      {
        className: 'btn btn-secondary',
        'aria-label': 'Sleep timer',
        onChange: (e) => {
          if (sleepTimerId) {
            clearTimeout(sleepTimerId);
            sleepTimerId = null;
          }
          const mins = Number(e.target.value);
          if (mins > 0) {
            sleepTimerId = setTimeout(() => {
              audio.pause();
              showToast(`Sleep timer (${mins}m) paused audio playback.`, 'info');
              sleepSelect.value = '0';
            }, mins * 60 * 1000);
            showToast(`Sleep timer set for ${mins} minute(s).`, 'info', 2200);
          }
        }
      },
      [
        createEl('option', { value: '0', textContent: 'Sleep: Off' }),
        createEl('option', { value: '5', textContent: 'Sleep: 5m' }),
        createEl('option', { value: '15', textContent: 'Sleep: 15m' }),
        createEl('option', { value: '30', textContent: 'Sleep: 30m' }),
        createEl('option', { value: '60', textContent: 'Sleep: 60m' })
      ]
    );

    audio.addEventListener('loadedmetadata', () => {
      durationEl.textContent = formatDuration(audio.duration);
      descriptor.duration = formatDuration(audio.duration);
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: descriptor.name,
            artist: 'MultiView Local Audio'
          });
          navigator.mediaSession.setActionHandler('play', () => audio.play());
          navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        } catch (_) {}
      }
      if (typeof onMetadataUpdate === 'function') {
        onMetadataUpdate(descriptor);
      }
    });

    audio.addEventListener('timeupdate', () => {
      elapsedEl.textContent = formatDuration(audio.currentTime);
      if (audio.duration > 0) {
        seekInput.value = String((audio.currentTime / audio.duration) * 100);
      }
    });

    audio.addEventListener('play', () => {
      setButtonIconAndText(playBtn, 'pause', 'Pause Audio');
    });

    audio.addEventListener('pause', () => {
      setButtonIconAndText(playBtn, 'play', 'Play Audio');
    });

    audio.addEventListener('ended', () => {
      const { fileQueue, queueIndex } = getState();
      if (!repeatMode && queueIndex + 1 < fileQueue.length) {
        openQueueIndex(queueIndex + 1);
      }
    });

    audio.addEventListener('error', () => {
      showToast('This audio format or codec is not supported by your browser.', 'error');
    });

    const deck = createEl('div', { className: 'audio-deck' }, [
      artwork,
      titleEl,
      metaEl,
      createEl('div', { className: 'video-seek-row', style: 'width: 100%; max-width: 440px;' }, [
        elapsedEl,
        seekInput,
        durationEl
      ]),
      createEl('div', { className: 'viewer-toolbar', style: 'border-top: none; background: transparent;' }, [
        playBtn,
        repeatBtn,
        speedSelect,
        sleepSelect
      ])
    ]);

    container.appendChild(deck);

    return () => {
      if (sleepTimerId) clearTimeout(sleepTimerId);
      audio.pause();
      audio.src = '';
    };
  }
};
