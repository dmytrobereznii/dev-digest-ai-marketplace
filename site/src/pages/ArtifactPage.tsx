import { t } from '../i18n/t';
import { BodyView } from '../components/BodyView';
import { KindBadge } from '../components/Cards';
import { CopyCommand } from '../components/CopyCommand';
import { useCatalog } from '../lib/data';
import { href } from '../lib/router';
import { NotFound } from './NotFound';

export function ArtifactPage({ id }: { id: string }) {
  const { artifactById, index } = useCatalog();
  const artifact = artifactById.get(id);
  if (!artifact) return <NotFound what={t('notFound.artifact', { name: id })} />;

  return (
    <article className="detail">
      <p className="crumbs">
        <a href={href.home()}>{t('nav.plugins')}</a>
        <span aria-hidden="true"> / </span>
        <a href={href.plugin(artifact.plugin)}>{artifact.plugin}</a>
        <span aria-hidden="true"> / </span>
        <span>{artifact.name}</span>
      </p>
      <h1 className="with-badge">
        <KindBadge kind={artifact.kind} />
        <span>{artifact.name}</span>
      </h1>
      {artifact.description && <p className="lead">{artifact.description}</p>}

      <dl className="facts">
        <div>
          <dt>{t('artifact.plugin')}</dt>
          <dd>
            <a href={href.plugin(artifact.plugin)}>{artifact.plugin}</a>
          </dd>
        </div>
        {artifact.kind === 'agent' && (
          <>
            <div>
              <dt>{t('artifact.model')}</dt>
              <dd>{artifact.model ? <code>{artifact.model}</code> : <span className="muted">{t('artifact.modelDefault')}</span>}</dd>
            </div>
            <div className="facts-wide">
              <dt>{t('artifact.tools')}</dt>
              <dd>
                {artifact.tools && artifact.tools.length > 0 ? (
                  <ul className="tags">
                    {artifact.tools.map((tool) => (
                      <li key={tool}>{tool}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="muted">{t('artifact.toolsAll')}</span>
                )}
              </dd>
            </div>
          </>
        )}
      </dl>

      <section aria-labelledby="install-h">
        <h2 id="install-h">{t('artifact.install')}</h2>
        <p className="muted small">{t('artifact.installHint', { plugin: artifact.plugin })}</p>
        <CopyCommand command={t('commands.install', { plugin: artifact.plugin, marketplace: index.marketplace.name })} />
      </section>

      <section aria-labelledby="body-h">
        <h2 id="body-h">{artifact.kind === 'agent' ? t('artifact.bodyAgent') : t('artifact.bodySkill')}</h2>
        <BodyView id={artifact.body} emptyKey="artifact.noBody" />
      </section>
    </article>
  );
}
