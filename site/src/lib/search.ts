import MiniSearch from 'minisearch';
import { useEffect, useMemo, useState } from 'react';
import type { Catalog } from './data';
import { loadBody } from './data';

// Client-side search over plugins and individual agents and skills (docs/SITE-SPEC.md → Search).

export type HitType = 'plugin' | 'agent' | 'skill';
export type Hit = { type: HitType; ref: string; plugin: string; score: number };

type Doc = {
  id: string;
  type: HitType;
  ref: string;
  plugin: string;
  name: string;
  description: string;
  keywords: string;
  body: string;
};

// Plain-language queries ("I need a skill for writing specs") carry filler words
// that would otherwise prefix-match nearly every document.
const STOP_WORDS = new Set(
  'a an and are as at be but by can do does for from how i in into is it its me my need of on or that the this to want we what when which who with you your'.split(
    ' ',
  ),
);

// A light suffix stemmer, applied to both indexed and query terms, so "specs" meets
// "spec" and "writing" (→ "writ") prefix-matches "write" and "writer".
function stem(t: string): string {
  if (t.length <= 4) return t;
  if (t.endsWith('ing') && t.length >= 6) return t.slice(0, -3);
  if (t.endsWith('ies')) return `${t.slice(0, -3)}y`;
  if (/(ss|x|ch|sh)es$/.test(t)) return t.slice(0, -2);
  if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

const processTerm = (term: string): string | null => {
  const t = term.toLowerCase();
  return t.length < 2 || STOP_WORDS.has(t) ? null : stem(t);
};

function buildIndex(catalog: Catalog, bodies: Map<string, string>): MiniSearch<Doc> {
  const ms = new MiniSearch<Doc>({
    fields: ['name', 'description', 'keywords', 'body'],
    storeFields: ['type', 'ref', 'plugin'],
    processTerm,
    searchOptions: {
      boost: { name: 3, description: 2, keywords: 2, body: 1 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'OR',
    },
  });
  const docs: Doc[] = [
    ...catalog.index.plugins.map((p) => ({
      id: `plugin:${p.name}`,
      type: 'plugin' as const,
      ref: p.name,
      plugin: p.name,
      name: p.name,
      description: p.description,
      keywords: p.keywords.join(' '),
      body: bodies.get(p.readme) ?? '',
    })),
    ...catalog.index.artifacts.map((a) => ({
      id: `artifact:${a.id}`,
      type: a.kind,
      ref: a.id,
      plugin: a.plugin,
      name: a.name,
      description: a.description,
      keywords: '',
      body: bodies.get(a.body) ?? '',
    })),
  ];
  ms.addAll(docs);
  return ms;
}

function allEntries(catalog: Catalog): Hit[] {
  return [
    ...catalog.index.plugins.map((p) => ({ type: 'plugin' as const, ref: p.name, plugin: p.name, score: 0 })),
    ...catalog.index.artifacts.map((a) => ({ type: a.kind, ref: a.id, plugin: a.plugin, score: 0 })),
  ];
}

/**
 * Ranked hits for a query. An agent or skill hit also brings in its plugin, so a
 * skill's distinctive word finds both the skill and the plugin that ships it.
 */
function runSearch(ms: MiniSearch<Doc>, catalog: Catalog, q: string): Hit[] {
  if (!q.trim()) return allEntries(catalog);
  const hits: Hit[] = ms.search(q).map((r) => ({
    type: r.type as HitType,
    ref: r.ref as string,
    plugin: r.plugin as string,
    score: r.score,
  }));
  const plugins = new Map(hits.filter((h) => h.type === 'plugin').map((h) => [h.ref, h]));
  for (const h of hits) {
    if (h.type === 'plugin') continue;
    const parent = plugins.get(h.plugin);
    if (!parent) {
      const added: Hit = { type: 'plugin', ref: h.plugin, plugin: h.plugin, score: h.score * 0.5 };
      plugins.set(h.plugin, added);
      hits.push(added);
    }
  }
  return hits.sort((a, b) => b.score - a.score);
}

export type Searcher = { search: (q: string) => Hit[]; complete: boolean };

/**
 * Indexes names, descriptions and keywords at once, then adds every README and
 * component body as they arrive, so the first query never waits on the network.
 */
export function useSearcher(catalog: Catalog): Searcher {
  const [bodies, setBodies] = useState<Map<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ids = [...catalog.index.plugins.map((p) => p.readme), ...catalog.index.artifacts.map((a) => a.body)];
    Promise.all(ids.map((id) => loadBody(id).then((text) => [id, text] as const, () => [id, ''] as const))).then(
      (pairs) => !cancelled && setBodies(new Map(pairs)),
    );
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  return useMemo(
    () => ({ search: createSearch(catalog, bodies ?? new Map()), complete: bodies !== null }),
    [catalog, bodies],
  );
}

/** Pure search over a catalog and the bodies loaded so far. */
export function createSearch(catalog: Catalog, bodies: Map<string, string>): (q: string) => Hit[] {
  const ms = buildIndex(catalog, bodies);
  return (q: string) => runSearch(ms, catalog, q);
}
