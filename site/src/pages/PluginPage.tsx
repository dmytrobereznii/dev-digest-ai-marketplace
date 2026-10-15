import { t } from '../i18n/t';
import { BodyView } from '../components/BodyView';
import { ArtifactCard } from '../components/Cards';
import { CopyCommand } from '../components/CopyCommand';
import { useArtifactsOf, useCatalog } from '../lib/data';
import { href } from '../lib/router';
import type { Plugin } from '../types';
import { NotFound } from './NotFound';

export function PluginPage({ name }: { name: string }) {
  const { pluginByName } = useCatalog();
  const plugin = pluginByName.get(name);
  if (!plugin) return <NotFound what={t('notFound.plugin', { name })} />;
  return <PluginDetail plugin={plugin} />;
}

function PluginDetail({ plugin }: { plugin: Plugin }) {
  const { index } = useCatalog();
  const artifacts = useArtifactsOf(plugin);
  const agents = artifacts.filter((a) => a.kind === 'agent');
  const skills = artifacts.filter((a) => a.kind === 'skill');

  return (
    <article className="detail">
      <p className="crumbs">
        <a href={href.home()}>{t('nav.plugins')}</a>
        <span aria-hidden="true"> / </span>
        <span>{plugin.name}</span>
      </p>
      <h1>{plugin.name}</h1>
      {plugin.description && <p className="lead">{plugin.description}</p>}

      <dl className="facts">
        <div>
          <dt>{t('plugin.version')}</dt>
          <dd>{plugin.version}</dd>
        </div>
        <div>
          <dt>{t('plugin.latestTag')}</dt>
          <dd>{plugin.latestTag ? <code>{plugin.latestTag}</code> : <span className="muted">{t('plugin.noTag')}</span>}</dd>
        </div>
        <div>
          <dt>{t('plugin.author')}</dt>
          <dd>{plugin.author || <span className="muted">{t('plugin.unknown')}</span>}</dd>
        </div>
        <div>
          <dt>{t('plugin.compatibility')}</dt>
          {/* A Markdown line shown as plain text: drop inline-code backticks. */}
          <dd>{plugin.compatibility.replace(/`/g, '') || <span className="muted">{t('plugin.noCompatibility')}</span>}</dd>
        </div>
      </dl>

      <section aria-labelledby="install-h">
        <h2 id="install-h">{t('plugin.install')}</h2>
        <CopyCommand command={t('commands.install', { plugin: plugin.name, marketplace: index.marketplace.name })} />
        <p className="muted small">
          {t('plugin.installHint')} <a href={href.gettingStarted()}>{t('nav.gettingStarted')}</a>
        </p>
      </section>

      <div className="two-col">
        <section aria-labelledby="deps-h">
          <h2 id="deps-h">{t('plugin.dependencies')}</h2>
          {plugin.dependencies.length > 0 ? (
            <ul className="links">
              {plugin.dependencies.map((d) => (
                <li key={d.name}>
                  <a href={href.plugin(d.name)}>{d.name}</a> <code className="range">{d.range}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('plugin.noDependencies')}</p>
          )}
        </section>
        <section aria-labelledby="dependents-h">
          <h2 id="dependents-h">{t('plugin.dependents')}</h2>
          {plugin.dependents.length > 0 ? (
            <ul className="links">
              {plugin.dependents.map((d) => (
                <li key={d}>
                  <a href={href.plugin(d)}>{d}</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('plugin.noDependents')}</p>
          )}
        </section>
      </div>

      <section aria-labelledby="contents-h">
        <h2 id="contents-h">{t('plugin.contents')}</h2>
        {artifacts.length === 0 && <p className="muted">{t('plugin.noContents')}</p>}
        {agents.length > 0 && (
          <>
            <h3>{t('kind.agentPlural')}</h3>
            <div className="grid">
              {agents.map((a) => (
                <ArtifactCard key={a.id} artifact={a} showPlugin={false} />
              ))}
            </div>
          </>
        )}
        {skills.length > 0 && (
          <>
            <h3>{t('kind.skillPlural')}</h3>
            <div className="grid">
              {skills.map((a) => (
                <ArtifactCard key={a.id} artifact={a} showPlugin={false} />
              ))}
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="readme-h">
        <h2 id="readme-h">{t('plugin.readme')}</h2>
        <BodyView id={plugin.readme} emptyKey="plugin.noReadme" />
      </section>

      <section>
        <details className="changelog">
          <summary>
            <h2>{t('plugin.changelog')}</h2>
          </summary>
          <BodyView id={plugin.changelog} emptyKey="plugin.noChangelog" />
        </details>
      </section>
    </article>
  );
}
