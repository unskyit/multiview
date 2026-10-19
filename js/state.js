import { events } from './events.js';

const state = {
  currentRoute: 'home',
  currentFile: null,
  fileQueue: [],
  queueIndex: -1,
  activeViewerDestroy: null,
  preferences: null,
  recentHistory: [],
  installStatus: {
    canPrompt: false,
    isInstalled: false,
    platformHint: 'browser'
  }
};

export function getState() {
  return state;
}

export function setState(patch, eventName = 'state:changed') {
  Object.assign(state, patch);
  events.emit(eventName, state);
}
