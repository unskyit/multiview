/**
 * Pure SVG Icon System (24x24 viewBox, stroke-based vector paths).
 * Replaces all emojis with crisp, accessible SVG icons.
 */
const SVG_NS = 'http://www.w3.org/2000/svg';

export const ICON_PATHS = Object.freeze({
  home: [
    ['path', { d: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5z' }]
  ],
  folder: [
    ['path', { d: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h4.3l2.2 2.5H19.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-12z' }]
  ],
  image: [
    ['rect', { x: '3', y: '4', width: '18', height: '16', rx: '2' }],
    ['circle', { cx: '8.5', cy: '9.5', r: '1.5' }],
    ['path', { d: 'M21 15l-4.5-4.5L7 20' }]
  ],
  video: [
    ['rect', { x: '2.5', y: '4.5', width: '19', height: '15', rx: '2.2' }],
    ['polygon', { points: '10,8.8 16,12 10,15.2' }]
  ],
  audio: [
    ['path', { d: 'M9 18V6l11-2v12' }],
    ['circle', { cx: '6.5', cy: '18', r: '2.5' }],
    ['circle', { cx: '17.5', cy: '16', r: '2.5' }]
  ],
  fileText: [
    ['path', { d: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z' }],
    ['polyline', { points: '14 3 14 9 20 9' }],
    ['line', { x1: '8', y1: '13', x2: '16', y2: '13' }],
    ['line', { x1: '8', y1: '17', x2: '13', y2: '17' }]
  ],
  settings: [
    ['circle', { cx: '12', cy: '12', r: '3.2' }],
    ['path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' }]
  ],
  download: [
    ['path', { d: 'M12 3v12' }],
    ['polyline', { points: '7 10 12 15 17 10' }],
    ['path', { d: 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2' }]
  ],
  sun: [
    ['circle', { cx: '12', cy: '12', r: '4' }],
    ['path', { d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' }]
  ],
  moon: [
    ['path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }]
  ],
  fullscreen: [
    ['polyline', { points: '15 3 21 3 21 9' }],
    ['polyline', { points: '9 21 3 21 3 15' }],
    ['line', { x1: '21', y1: '3', x2: '14', y2: '10' }],
    ['line', { x1: '3', y1: '21', x2: '10', y2: '14' }]
  ],
  minimize: [
    ['polyline', { points: '4 14 10 14 10 20' }],
    ['polyline', { points: '20 10 14 10 14 4' }],
    ['line', { x1: '14', y1: '10', x2: '21', y2: '3' }],
    ['line', { x1: '3', y1: '21', x2: '10', y2: '14' }]
  ],
  moreVertical: [
    ['circle', { cx: '12', cy: '5', r: '1.3' }],
    ['circle', { cx: '12', cy: '12', r: '1.3' }],
    ['circle', { cx: '12', cy: '19', r: '1.3' }]
  ],
  play: [
    ['polygon', { points: '6 4 20 12 6 20 6 4' }]
  ],
  pause: [
    ['rect', { x: '6', y: '4', width: '4', height: '16', rx: '1' }],
    ['rect', { x: '14', y: '4', width: '4', height: '16', rx: '1' }]
  ],
  zoomIn: [
    ['circle', { cx: '11', cy: '11', r: '7' }],
    ['line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }],
    ['line', { x1: '11', y1: '8', x2: '11', y2: '14' }],
    ['line', { x1: '8', y1: '11', x2: '14', y2: '11' }]
  ],
  zoomOut: [
    ['circle', { cx: '11', cy: '11', r: '7' }],
    ['line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }],
    ['line', { x1: '8', y1: '11', x2: '14', y2: '11' }]
  ],
  rotateCw: [
    ['polyline', { points: '23 4 23 10 17 10' }],
    ['path', { d: 'M20.49 15a9 9 0 1 1-2.12-9.36L23 10' }]
  ],
  flipH: [
    ['polyline', { points: '17 8 21 12 17 16' }],
    ['polyline', { points: '7 8 3 12 7 16' }],
    ['line', { x1: '3', y1: '12', x2: '21', y2: '12' }]
  ],
  contrast: [
    ['circle', { cx: '12', cy: '12', r: '9' }],
    ['path', { d: 'M12 3v18' }]
  ],
  pip: [
    ['rect', { x: '2', y: '4', width: '20', height: '15', rx: '2' }],
    ['rect', { x: '12', y: '11', width: '7', height: '5', rx: '1' }]
  ],
  repeat: [
    ['polyline', { points: '17 1 21 5 17 9' }],
    ['path', { d: 'M3 11V9a4 4 0 0 1 4-4h14' }],
    ['polyline', { points: '7 23 3 19 7 15' }],
    ['path', { d: 'M21 13v2a4 4 0 0 1-4 4H3' }]
  ],
  copy: [
    ['rect', { x: '9', y: '9', width: '13', height: '13', rx: '2' }],
    ['path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }]
  ],
  move: [
    ['polyline', { points: '15 10 20 15 15 20' }],
    ['path', { d: 'M4 4v7a4 4 0 0 0 4 4h12' }]
  ],
  share: [
    ['circle', { cx: '18', cy: '5', r: '3' }],
    ['circle', { cx: '6', cy: '12', r: '3' }],
    ['circle', { cx: '18', cy: '19', r: '3' }],
    ['line', { x1: '8.59', y1: '13.51', x2: '15.42', y2: '17.49' }],
    ['line', { x1: '15.41', y1: '6.51', x2: '8.59', y2: '10.49' }]
  ],
  external: [
    ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }],
    ['polyline', { points: '15 3 21 3 21 9' }],
    ['line', { x1: '10', y1: '14', x2: '21', y2: '3' }]
  ],
  info: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['line', { x1: '12', y1: '16', x2: '12', y2: '12' }],
    ['line', { x1: '12', y1: '8', x2: '12.01', y2: '8' }]
  ],
  trash: [
    ['polyline', { points: '3 6 5 6 21 6' }],
    ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }]
  ],
  close: [
    ['line', { x1: '18', y1: '6', x2: '6', y2: '18' }],
    ['line', { x1: '6', y1: '6', x2: '18', y2: '18' }]
  ],
  chevronLeft: [
    ['polyline', { points: '15 18 9 12 15 6' }]
  ],
  chevronRight: [
    ['polyline', { points: '9 18 15 12 9 6' }]
  ],
  alert: [
    ['path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }],
    ['line', { x1: '12', y1: '9', x2: '12', y2: '13' }],
    ['line', { x1: '12', y1: '17', x2: '12.01', y2: '17' }]
  ]
});

export function createIcon(name, className = 'mv-icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  const shapes = ICON_PATHS[name] || ICON_PATHS.info;
  for (const [tag, attrs] of shapes) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    svg.appendChild(el);
  }
  return svg;
}

export function setButtonIconAndText(btn, iconName, text) {
  while (btn.firstChild) btn.removeChild(btn.firstChild);
  btn.appendChild(createIcon(iconName));
  if (text) {
    const span = document.createElement('span');
    span.textContent = text;
    btn.appendChild(span);
  }
}
