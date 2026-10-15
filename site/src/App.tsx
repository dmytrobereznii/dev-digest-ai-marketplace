import { useEffect } from 'react';
import { t } from './i18n/t';
import { Layout } from './components/Layout';
import { useCatalogState } from './lib/data';
import { useRoute, type Route } from './lib/router';
import { ArtifactPage } from './pages/ArtifactPage';
import { GettingStarted } from './pages/GettingStarted';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { PluginPage } from './pages/PluginPage';
import { Search } from './pages/Search';
import { WhatsNew } from './pages/WhatsNew';

function titleFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return t('site.name');
    case 'search':
      return t('title.page', { page: route.q ? t('search.titleFor', { q: route.q }) : t('search.titleAll') });
    case 'plugin':
      return t('title.page', { page: route.plugin });
    case 'artifact':
      return t('title.page', { page: route.id });
    case 'whats-new':
      return t('title.page', { page: t('whatsNew.title') });
    case 'getting-started':
      return t('title.page', { page: t('guide.title') });
    case 'not-found':
      return t('title.page', { page: t('notFound.title') });
  }
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'search':
      return <Search q={route.q} kind={route.kind} plugin={route.plugin} />;
    case 'plugin':
      return <PluginPage name={route.plugin} />;
    case 'artifact':
      return <ArtifactPage id={route.id} />;
    case 'whats-new':
      return <WhatsNew />;
    case 'getting-started':
      return <GettingStarted />;
    case 'not-found':
      return <NotFound />;
  }
}

export function App() {
  const route = useRoute();
  const state = useCatalogState();

  // Typing in the search box rewrites the route; only a new screen jumps to the top.
  const screenKey = route.name === 'search' ? 'search' : JSON.stringify(route);

  useEffect(() => {
    document.title = titleFor(route);
  }, [route]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screenKey]);

  return (
    <Layout route={route}>
      {state.status === 'loading' && <p className="muted">{t('status.loading')}</p>}
      {state.status === 'error' && (
        <div className="empty">
          <h1>{t('status.errorTitle')}</h1>
          <p>{t('status.errorText')}</p>
        </div>
      )}
      {state.status === 'ready' && <Screen route={route} />}
    </Layout>
  );
}
