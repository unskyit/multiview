import { createEl, clearNode, showToast } from '../utils/dom.js';
import { formatDuration } from '../utils/format.js';
import { getState } from '../state.js';
import { getResumePosition, saveResumePosition } from '../storage/preferences.js';
import { detectCapabilities } from '../core/capabilities.js';
import { createIcon, setButtonIconAndText } from '../utils/icons.js';

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
      textContent: `−${seekStep}s`
    });
    const rightFeedback = createEl('div', {
      className: 'video-gesture-feedback right',
      textContent: `+${seekStep}s`
    });

    const flashFeedback = (el) => {
      el.classList.add('is-visible');
      setTimeout(() => el.classList.remove('is-visible'), 520);
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
      type: 'button',
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
      type: 'button',
      className: 'btn btn-secondary',
      textContent: `−${seekStep}s`,
      onClick: () => {
        video.currentTime = Math.max(0, video.currentTime - seekStep);
        flashFeedback(leftFeedback);
      }
    });

    const fwdStepBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      textContent: `+${seekStep}s`,
      onClick: () => {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + seekStep);
        flashFeedback(rightFeedback);
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

    // Native Pill-Chip Speed Selector (Zero <select> dropdowns!)
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const speedGroup = createEl('div', { className: 'chip-group', role: 'group', 'aria-label': 'Playback speed' });
    const renderSpeedChips = () => {
      clearNode(speedGroup);
      for (const rate of speeds) {
        speedGroup.appendChild(
          createEl('button', {
            type: 'button',
            className: `chip-btn${video.playbackRate === rate ? ' is-active' : ''}`,
            textContent: `${rate}×`,
            onClick: () => {
              video.playbackRate = rate;
              renderSpeedChips();
            }
          })
        );
      }
    };
    renderSpeedChips();

    const fitModes = [
      { id: 'contain', label: 'Fit' },
      { id: 'cover', label: 'Crop' },
      { id: 'fill', label: 'Stretch' }
    ];
    let fitIdx = 0;
    const fitBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      textContent: 'Aspect: Fit',
      onClick: () => {
        fitIdx = (fitIdx + 1) % fitModes.length;
        video.dataset.fit = fitModes[fitIdx].id;
        fitBtn.textContent = `Aspect: ${fitModes[fitIdx].label}`;
      }
    });

    const caps = detectCapabilities();
    const pipBtn = createEl('button', {
      type: 'button',
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
          showToast('Picture-in-Picture unavailable.', 'warning');
        }
      }
    }, [createIcon('pip'), createEl('span', { textContent: 'PiP' })]);

    const fsBtn = createEl('button', {
      type: 'button',
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
      if (typeof onMetadataUpdate === 'function') onMetadataUpdate(descriptor);
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

    video.addEventListener('play', () => setButtonIconAndText(playPauseBtn, 'pause', 'Pause'));
    video.addEventListener('pause', () => setButtonIconAndText(playPauseBtn, 'play', 'Play'));
    video.addEventListener('error', () => {
      showToast('This video codec is not supported by your device decoder.', 'error', 5000);
    });

    videoWrap.append(video, leftFeedback, rightFeedback);
    const controlsBar = createEl('div', { className: 'video-controls-bar' }, [
      createEl('div', { className: 'video-seek-row' }, [elapsedLabel, seekSlider, durationLabel]),
      createEl('div', { className: 'viewer-toolbar' }, [
        backStepBtn,
        playPauseBtn,
        fwdStepBtn,
        fitBtn,
        pipBtn,
        fsBtn
      ]),
      createEl('div', { className: 'viewer-toolbar' }, [speedGroup])
    ]);

    container.append(videoWrap, controlsBar);

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }
};
