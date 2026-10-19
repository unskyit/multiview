import { APP_CONFIG } from './config.js';
import { getState, setState } from './state.js';
import { events } from './events.js';

export function normalizeRoute(rawRoute) {
  const cleaned = String(rawRoute || '')
    .replace(/^#\/?/, '')
    .trim()
    .toLowerCase();
  if (APP_CONFIG.routes.includes(cleaned)) {
    return cleaned;
  }
  return 'home';
}

export function navigateTo(route, { updateHash = true } = {}) {
  const target = normalizeRoute(route);
  const prev = getState().currentRoute;
  setState({ currentRoute: target }, 'route:changed');
  if (updateHash && typeof window !== 'undefined') {
    const nextHash = `#/${target}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }
  if (prev !== target) {
    events.emit('navigation:updated', { from: prev, to: target });
  }
  return target;
}

export function initRouter() {
  if (typeof window === 'undefined') return;
  navigateTo(normalizeRoute(window.location.hash), { updateHash: false });
  window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash, { updateHash: false });
  });
}
