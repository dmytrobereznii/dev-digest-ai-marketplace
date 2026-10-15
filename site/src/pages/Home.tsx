import { plural, t } from '../i18n/t';
import { PluginGrid } from '../components/Cards';
import { CopyCommand } from '../components/CopyCommand';
import { SearchForm } from '../components/Layout';
import { ReleaseList } from '../components/ReleaseList';
import { REPO_SLUG } from '../lib/config';
import { useCatalog } from '../lib/data';
import { href } from '../lib/router';

export function Home() {
  const { index, releases } = useCatalog();
  const agents = index.artifacts.filter((a) => a.kind === 'agent').length;
  const skills = index.artifacts.filter((a) => a.kind === 'skill').length;
  const market = index.marketplace.name;

  return (
    <>
      <section className="hero">
        <h1>{market}</h1>
        {index.marketplace.description && <p className="lead">{index.marketplace.description}</p>}
        <p className="counts muted">
          {[plural('count.plugins', index.plugins.length), plural('count.agents', agents), plural('count.skills', skills)].join(
            t('home.countSeparator'),
          )}
        </p>
        <SearchForm />
      </section>

      <section aria-labelledby="plugins-h">
        <h2 id="plugins-h">{t('home.pluginsTitle')}</h2>
        {index.plugins.length > 0 ? (
          <PluginGrid plugins={index.plugins} />
        ) : (
          <p className="muted">{t('home.noPlugins')}</p>
        )}
      </section>

      <div className="two-col">
        <section aria-labelledby="new-h">
          <div className="section-head">
            <h2 id="new-h">{t('home.whatsNewTitle')}</h2>
            {releases.length > 0 && <a href={href.whatsNew()}>{t('home.allReleases')}</a>}
          </div>
          <ReleaseList releases={releases.slice(0, 5)} showChanges={false} />
        </section>

        <section aria-labelledby="quick-h">
          <div className="section-head">
            <h2 id="quick-h">{t('home.quickStartTitle')}</h2>
            <a href={href.gettingStarted()}>{t('home.fullGuide')}</a>
          </div>
          <ol className="steps">
            <li>
              <p>{t('home.quickStartAdd')}</p>
              <CopyCommand command={t('commands.addMarketplaceSlash', { repo: REPO_SLUG })} />
            </li>
            <li>
              <p>{t('home.quickStartInstall')}</p>
              <CopyCommand command={t('commands.install', { plugin: t('commands.pluginPlaceholder'), marketplace: market })} />
            </li>
          </ol>
        </section>
      </div>
    </>
  );
}
