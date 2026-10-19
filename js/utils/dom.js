import { createIcon } from './icons.js';

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    if (key === 'className') {
      el.className = value;
    } else if (key === 'textContent') {
      el.textContent = String(value);
    } else if (key === 'dataset' && typeof value === 'object') {
      for (const [dKey, dVal] of Object.entries(value)) {
        el.dataset[dKey] = String(dVal);
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (typeof value === 'boolean') {
      if (value) el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }
  const childList = Array.isArray(children) ? children : [children];
  for (const child of childList) {
    if (child === null || child === undefined) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }
  return el;
}

export function clearNode(node) {
  while (node && node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function showToast(message, type = 'info', durationMs = 3800) {
  if (typeof document === 'undefined') return;
  const region = document.getElementById('toast-region');
  if (!region) return;
  const dismissBtn = createEl(
    'button',
    {
      className: 'btn-icon',
      style: 'width:28px;height:28px;border:none;',
      'aria-label': 'Dismiss notification'
    },
    [createIcon('close')]
  );
  const toast = createEl(
    'div',
    {
      className: `toast toast-${type}`,
      role: 'status',
      'aria-live': 'polite'
    },
    [createEl('span', { textContent: message }), dismissBtn]
  );
  const remove = () => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  };
  dismissBtn.addEventListener('click', remove);
  region.appendChild(toast);
  if (durationMs > 0) {
    setTimeout(remove, durationMs);
  }
}
