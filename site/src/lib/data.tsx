import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Artifact, CatalogIndex, Plugin, Release, Stats } from '../types';
import { dataUrl } from './config';

export type Catalog = {
  index: CatalogIndex;
  releases: Release[];
  stats: Stats | null;
  pluginByName: Map<string, Plugin>;
  artifactById: Map<string, Artifact>;
};

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; catalog: Catalog };

const CatalogContext = createContext<State>({ status: 'loading' });

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(dataUrl(file), { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchJson<CatalogIndex>('index.json'),
      // A missing releases or stats file degrades to "no data", not a broken site.
      fetchJson<Release[]>('releases.json').catch(() => [] as Release[]),
      fetchJson<Stats>('stats.json').catch(() => null),
    ])
      .then(([index, releases, stats]) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          catalog: {
            index,
            releases: Array.isArray(releases) ? releases : [],
            stats,
            pluginByName: new Map(index.plugins.map((p) => [p.name, p])),
            artifactById: new Map(index.artifacts.map((a) => [a.id, a])),
          },
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>;
}

export const useCatalogState = (): State => useContext(CatalogContext);

/** For screens rendered only once the catalog is ready. */
export function useCatalog(): Catalog {
  const state = useContext(CatalogContext);
  if (state.status !== 'ready') throw new Error('useCatalog called before the catalog loaded');
  return state.catalog;
}

// Bodies (README, CHANGELOG, agent and skill Markdown) are loaded on demand and cached.
const bodyCache = new Map<string, Promise<string>>();

export function loadBody(id: string): Promise<string> {
  let p = bodyCache.get(id);
  if (!p) {
    p = fetch(dataUrl(`bodies/${encodeURIComponent(id)}`)).then((res) => {
      if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
      return res.text();
    });
    p.catch(() => bodyCache.delete(id));
    bodyCache.set(id, p);
  }
  return p;
}

export type BodyState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; text: string };

export function useBody(id: string | undefined): BodyState {
  const [state, setState] = useState<BodyState>({ status: 'loading' });
  useEffect(() => {
    if (!id) {
      setState({ status: 'ready', text: '' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    loadBody(id).then(
      (text) => !cancelled && setState({ status: 'ready', text }),
      () => !cancelled && setState({ status: 'error' }),
    );
    return () => {
      cancelled = true;
    };
  }, [id]);
  return state;
}

/** Artifacts of one plugin, in index order. */
export function useArtifactsOf(plugin: Plugin): Artifact[] {
  const { artifactById } = useCatalog();
  return useMemo(
    () => plugin.artifacts.map((id) => artifactById.get(id)).filter((a): a is Artifact => Boolean(a)),
    [plugin, artifactById],
  );
}
