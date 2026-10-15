import { useEffect, useMemo, useState } from 'react';
import { plural, t } from '../i18n/t';
import { HitCard } from '../components/Cards';
import { useCatalog } from '../lib/data';
import { href, navigate } from '../lib/router';
import { useSearcher, type HitType } from '../lib/search';

const KINDS: HitType[] = ['plugin', 'agent', 'skill'];

type Props = { q: string; kind: string; plugin: string };

export function Search({ q, kind, plugin }: Props) {
  const catalog = useCatalog();
  const searcher = useSearcher(catalog);
  const [input, setInput] = useState(q);

  // Keep the box in sync when the route changes from outside (back button, header link).
  useEffect(() => setInput(q), [q]);

  const activeKind = KINDS.includes(kind as HitType) ? (kind as HitType) : '';
  const activePlugin = catalog.pluginByName.has(plugin) ? plugin : '';

  const hits = useMemo(() => searcher.search(q), [searcher, q]);
  const byPlugin = activePlugin ? hits.filter((h) => h.plugin === activePlugin) : hits;
  const byKind = activeKind ? hits.filter((h) => h.type === activeKind) : hits;
  const shown = activeKind ? byPlugin.filter((h) => h.type === activeKind) : byPlugin;

  const go = (next: Partial<Props>, replace = false) => {
    const merged = { q, kind: activeKind, plugin: activePlugin, ...next };
    navigate(href.search(merged.q, { kind: merged.kind, plugin: merged.plugin }), { replace });
  };

  const chip = (key: string, active: boolean, label: string, count: number, onClick: () => void) => (
    <button key={key} type="button" className="chip" aria-pressed={active} onClick={onClick}>
      {label} <span className="chip-count">{count}</span>
    </button>
  );

  return (
    <>
      <h1>{q ? t('search.titleFor', { q }) : t('search.titleAll')}</h1>
      <form
        className="search-form"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: input.trim() });
        }}
      >
        <input
          type="search"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            go({ q: e.target.value }, true);
          }}
          placeholder={t('search.placeholder')}
          aria-label={t('search.label')}
          autoFocus
        />
        <button type="submit">{t('search.submit')}</button>
      </form>

      <div className="filters">
        <div className="chips" role="group" aria-label={t('search.filterKind')}>
          {chip('all', !activeKind, t('search.allKinds'), byPlugin.length, () => go({ kind: '' }))}
          {KINDS.map((k) =>
            chip(k, activeKind === k, t(`kind.${k}Plural`), byPlugin.filter((h) => h.type === k).length, () =>
              go({ kind: activeKind === k ? '' : k }),
            ),
          )}
        </div>
        {catalog.index.plugins.length > 1 && (
          <div className="chips" role="group" aria-label={t('search.filterPlugin')}>
            {chip('all', !activePlugin, t('search.allPlugins'), byKind.length, () => go({ plugin: '' }))}
            {catalog.index.plugins.map((p) =>
              chip(p.name, activePlugin === p.name, p.name, byKind.filter((h) => h.plugin === p.name).length, () =>
                go({ plugin: activePlugin === p.name ? '' : p.name }),
              ),
            )}
          </div>
        )}
      </div>

      <p className="muted" aria-live="polite">
        {plural('count.results', shown.length)}
        {q && !searcher.complete ? t('search.indexingBodies') : ''}
      </p>

      {shown.length > 0 ? (
        <div className="grid">
          {shown.map((h) => (
            <HitCard key={`${h.type}:${h.ref}`} type={h.type} id={h.ref} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>{q ? t('search.noResults', { q }) : t('search.nothingToShow')}</p>
          <p>
            <a href={href.home()}>{t('search.browseAll')}</a>
          </p>
        </div>
      )}
    </>
  );
}
