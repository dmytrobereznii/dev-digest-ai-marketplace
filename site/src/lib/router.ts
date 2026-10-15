import { useEffect, useState } from 'react';

// Hash routing, so deep links work on GitHub Pages without server rewrites.
export type Route =
  | { name: 'home' }
  | { name: 'search'; q: string; kind: string; plugin: string }
  | { name: 'plugin'; plugin: string }
  | { name: 'artifact'; id: string }
  | { name: 'whats-new' }
  | { name: 'getting-started' }
  | { name: 'not-found' };

const decode = (s: string): string => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const qIndex = raw.indexOf('?');
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  const params = new URLSearchParams(qIndex === -1 ? '' : raw.slice(qIndex + 1));
  const parts = path.split('/').filter(Boolean).map(decode);

  if (parts.length === 0) return { name: 'home' };
  const [head, ...rest] = parts;
  switch (head) {
    case 'search':
      return {
        name: 'search',
        q: params.get('q') ?? '',
        kind: params.get('kind') ?? '',
        plugin: params.get('plugin') ?? '',
      };
    case 'plugin':
      return rest.length === 1 ? { name: 'plugin', plugin: rest[0] } : { name: 'not-found' };
    case 'artifact':
      return rest.length === 1 && rest[0].includes(':') ? { name: 'artifact', id: rest[0] } : { name: 'not-found' };
    case 'whats-new':
      return { name: 'whats-new' };
    case 'getting-started':
      return { name: 'getting-started' };
    default:
      return { name: 'not-found' };
  }
}

export const href = {
  home: () => '#/',
  plugin: (name: string) => `#/plugin/${encodeURIComponent(name)}`,
  artifact: (id: string) => {
    const [plugin, ...name] = id.split(':');
    return `#/artifact/${encodeURIComponent(plugin)}:${encodeURIComponent(name.join(':'))}`;
  },
  whatsNew: () => '#/whats-new',
  gettingStarted: () => '#/getting-started',
  search: (q: string, filters: { kind?: string; plugin?: string } = {}) => {
    const params = new URLSearchParams();
    params.set('q', q);
    if (filters.kind) params.set('kind', filters.kind);
    if (filters.plugin) params.set('plugin', filters.plugin);
    return `#/search?${params.toString()}`;
  },
};

/** Changes the route; `replace` keeps typing in the search box out of the history. */
export function navigate(hash: string, { replace = false } = {}): void {
  if (replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
