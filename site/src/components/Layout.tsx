import { useState, type FormEvent, type ReactNode } from 'react';
import { t } from '../i18n/t';
import { REPO_URL } from '../lib/config';
import { useCatalogState } from '../lib/data';
import { href, navigate, type Route } from '../lib/router';
import { useTheme } from '../lib/theme';
import { formatDate } from './ReleaseList';

function Header({ route }: { route: Route }) {
  const [theme, toggle] = useTheme();
  const link = (target: string, label: string, active: boolean) => (
    <a href={target} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
      {label}
    </a>
  );
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href={href.home()}>
          {t('site.name')}
        </a>
        <nav aria-label={t('nav.label')}>
          {link(href.home(), t('nav.plugins'), route.name === 'home')}
          {link(href.search(''), t('nav.search'), route.name === 'search')}
          {link(href.whatsNew(), t('nav.whatsNew'), route.name === 'whats-new')}
          {link(href.gettingStarted(), t('nav.gettingStarted'), route.name === 'getting-started')}
        </nav>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggle}
          aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
          title={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
        >
          {theme === 'dark' ? t('theme.light') : t('theme.dark')}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  const state = useCatalogState();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        {state.status === 'ready' && (
          <span className="muted">
            {state.catalog.index.commit
              ? t('footer.builtAtCommit', {
                  commit: state.catalog.index.commit,
                  date: formatDate(state.catalog.index.generatedAt),
                })
              : t('footer.built', { date: formatDate(state.catalog.index.generatedAt) })}
          </span>
        )}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          {t('footer.source')}
        </a>
      </div>
    </footer>
  );
}

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        {t('nav.skip')}
      </a>
      <Header route={route} />
      <main id="main" tabIndex={-1} className="container">
        {children}
      </main>
      <Footer />
    </>
  );
}

/** Search input; submitting goes to #/search. */
export function SearchForm({ initial = '', autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const [q, setQ] = useState(initial);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(href.search(q.trim()));
  };
  return (
    <form className="search-form" role="search" onSubmit={onSubmit}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('search.placeholder')}
        aria-label={t('search.label')}
        autoFocus={autoFocus}
      />
      <button type="submit">{t('search.submit')}</button>
    </form>
  );
}
