import { createEl, clearNode, showToast } from '../utils/dom.js';
import { createIcon, setButtonIconAndText } from '../utils/icons.js';
import { formatDuration } from '../utils/format.js';
import { getState } from '../state.js';
import { getResumePosition, saveResumePosition } from '../storage/preferences.js';
import { detectCapabilities } from '../core/capabilities.js';

export const videoViewer = {
  mount(container, descriptor, { onMetadataUpdate } = {}) {
    clearNode(container);
    const prefs = getState().preferences || { seekStepSeconds: 10, resumePlayback: true };
    const seekStep = Number(prefs.seekStepSeconds) || 10;
    const resumeKey = `${descriptor.name}:${descriptor.size || 0}`;

    const videoWrap = createEl('div', { className: 'video-container' });
    const video = createEl('video', {
      className: 'video-element',
      src: descriptor.blobUrl || '',
      playsinline: true,
      preload: 'metadata'
    });
    video.dataset.fit = 'contain';

    const leftFeedback = createEl('div', {
      className: 'video-gesture-feedback left',
      textContent: `-${seekStep}s`
    });
    const rightFeedback = createEl('div', {
      className: 'video-gesture-feedback right',
      textContent: `+${seekStep}s`
    });

    const flashFeedback = (el) => {
      el.classList.add('is-visible');
      setTimeout(() => el.classList.remove('is-visible'), 500);
    };

    let lastTapTime = 0;
    video.addEventListener('pointerup', (e) => {
      const now = Date.now();
      const rect = video.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      if (now - lastTapTime < 300) {
        if (relX < rect.width * 0.45) {
          video.currentTime = Math.max(0, video.currentTime - seekStep);
          flashFeedback(leftFeedback);
        } else if (relX > rect.width * 0.55) {
          video.currentTime = Math.min(video.duration || Infinity, video.currentTime + seekStep);
          flashFeedback(rightFeedback);
        }
        lastTapTime = 0;
      } else {
        lastTapTime = now;
      }
    });

    const playPauseBtn = createEl('button', {
      className: 'btn btn-primary',
      onClick: () => {
        if (video.paused) {
          video.play().catch((err) => showToast('Playback blocked: ' + err.message, 'error'));
        } else {
          video.pause();
        }
      }
    }, [createIcon('play'), createEl('span', { textContent: 'Play' })]);

    const backStepBtn = createEl('button', {
      className: 'btn btn-secondary',
      textContent: `-${seekStep}s`,
      onClick: () => {
        video.currentTime = Math.max(0, video.currentTime - seekStep);
      }
    });

    const fwdStepBtn = createEl('button', {
      className: 'btn btn-secondary',
      textContent: `+${seekStep}s`,
      onClick: () => {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + seekStep);
      }
    });

    const elapsedLabel = createEl('span', { textContent: '0:00' });
    const durationLabel = createEl('span', { textContent: '0:00' });
    const seekSlider = createEl('input', {
      type: 'range',
      className: 'video-seek-slider',
      min: '0',
      max: '100',
      step: '0.1',
      value: '0',
      'aria-label': 'Video timeline'
    });

    seekSlider.addEventListener('input', () => {
      if (video.duration) {
        video.currentTime = (Number(seekSlider.value) / 100) * video.duration;
      }
    });

    const speedSelect = createEl(
      'select',
      {
        className: 'btn btn-secondary',
        'aria-label': 'Playback speed',
        onChange: (e) => {
          video.playbackRate = Number(e.target.value) || 1;
        }
      },
      [0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) =>
        createEl('option', {
          value: String(rate),
          selected: rate === 1,
          textContent: `${rate}x`
        })
      )
    );

    const fitModes = ['contain', 'cover', 'fill'];
    let fitIdx = 0;
    const fitBtn = createEl('button', {
      className: 'btn btn-secondary',
      textContent: 'Fit: Contain',
      onClick: () => {
        fitIdx = (fitIdx + 1) % fitModes.length;
        const mode = fitModes[fitIdx];
        video.dataset.fit = mode;
        fitBtn.textContent = `Fit: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
      }
    });

    const caps = detectCapabilities();
    const pipBtn = createEl('button', {
      className: 'btn btn-secondary',
      disabled: !caps.hasPictureInPicture,
      onClick: async () => {
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else if (video.requestPictureInPicture) {
            await video.requestPictureInPicture();
          }
        } catch (_) {
          showToast('Picture-in-Picture unavailable for this video.', 'warning');
        }
      }
    }, [createIcon('pip'), createEl('span', { textContent: 'PiP' })]);

    const fsBtn = createEl('button', {
      className: 'btn btn-secondary',
      'aria-label': 'Fullscreen video',
      onClick: () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }
    }, [createIcon('fullscreen')]);

    video.addEventListener('loadedmetadata', () => {
      durationLabel.textContent = formatDuration(video.duration);
      descriptor.duration = formatDuration(video.duration);
      if (video.videoWidth && video.videoHeight) {
        descriptor.dimensions = `${video.videoWidth} × ${video.videoHeight} px`;
      }
      if (prefs.resumePlayback) {
        const savedPos = getResumePosition(resumeKey);
        if (savedPos > 3 && savedPos < video.duration - 5) {
          video.currentTime = savedPos;
          showToast(`Resumed at ${formatDuration(savedPos)}`, 'info', 2200);
        }
      }
      if (typeof onMetadataUpdate === 'function') {
        onMetadataUpdate(descriptor);
      }
    });

    video.addEventListener('timeupdate', () => {
      elapsedLabel.textContent = formatDuration(video.currentTime);
      if (video.duration > 0) {
        seekSlider.value = String((video.currentTime / video.duration) * 100);
      }
      if (prefs.resumePlayback && Math.floor(video.currentTime) % 5 === 0) {
        saveResumePosition(resumeKey, video.currentTime);
      }
    });

    video.addEventListener('play', () => {
      setButtonIconAndText(playPauseBtn, 'pause', 'Pause');
    });

    video.addEventListener('pause', () => {
      setButtonIconAndText(playPauseBtn, 'play', 'Play');
    });

    video.addEventListener('error', () => {
      showToast('This video codec or container is not supported by your device decoder.', 'error', 5000);
    });

    videoWrap.append(video, leftFeedback, rightFeedback);
    const controlsBar = createEl('div', { className: 'video-controls-bar' }, [
      createEl('div', { className: 'video-seek-row' }, [elapsedLabel, seekSlider, durationLabel]),
      createEl('div', { className: 'viewer-toolbar' }, [
        playPauseBtn,
        backStepBtn,
        fwdStepBtn,
        speedSelect,
        fitBtn,
        pipBtn,
        fsBtn
      ])
    ]);

    container.append(videoWrap, controlsBar);

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }
};
