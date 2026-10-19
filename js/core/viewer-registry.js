const registry = new Map();

export function registerViewer(type, viewerModule) {
  if (!type || typeof viewerModule?.mount !== 'function') {
    throw new Error(`Invalid viewer registration for type "${type}"`);
  }
  registry.set(type, viewerModule);
}

export function getViewer(type) {
  return registry.get(type) || registry.get('unsupported') || null;
}
