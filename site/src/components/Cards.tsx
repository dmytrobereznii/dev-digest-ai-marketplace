import { t, plural } from '../i18n/t';
import { useArtifactsOf, useCatalog } from '../lib/data';
import { href } from '../lib/router';
import type { Artifact, Plugin } from '../types';

export function KindBadge({ kind }: { kind: 'plugin' | 'agent' | 'skill' }) {
  return <span className={`badge badge-${kind}`}>{t(`kind.${kind}`)}</span>;
}

export function PluginCard({ plugin }: { plugin: Plugin }) {
  const artifacts = useArtifactsOf(plugin);
  const agents = artifacts.filter((a) => a.kind === 'agent').length;
  const skills = artifacts.filter((a) => a.kind === 'skill').length;
  return (
    <a className="card" href={href.plugin(plugin.name)}>
      <div className="card-head">
        <KindBadge kind="plugin" />
        <span className="card-title">{plugin.name}</span>
        <span className="version">{t('plugin.versionShort', { version: plugin.version })}</span>
      </div>
      {plugin.description && <p className="card-desc">{plugin.description}</p>}
      <div className="card-meta">
        <span>{plural('count.agents', agents)}</span>
        <span>{plural('count.skills', skills)}</span>
        {plugin.dependencies.length > 0 && (
          <span>{t('plugin.dependsOnCount', { n: plugin.dependencies.length })}</span>
        )}
      </div>
      {plugin.keywords.length > 0 && (
        <ul className="tags" aria-label={t('plugin.keywords')}>
          {plugin.keywords.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      )}
    </a>
  );
}

export function ArtifactCard({ artifact, showPlugin = true }: { artifact: Artifact; showPlugin?: boolean }) {
  return (
    <a className="card" href={href.artifact(artifact.id)}>
      <div className="card-head">
        <KindBadge kind={artifact.kind} />
        <span className="card-title">{artifact.name}</span>
      </div>
      {artifact.description && <p className="card-desc">{artifact.description}</p>}
      {showPlugin && (
        <div className="card-meta">
          <span>{t('artifact.inPlugin', { plugin: artifact.plugin })}</span>
        </div>
      )}
    </a>
  );
}

export function PluginGrid({ plugins }: { plugins: Plugin[] }) {
  return (
    <div className="grid">
      {plugins.map((p) => (
        <PluginCard key={p.name} plugin={p} />
      ))}
    </div>
  );
}

/** Card for a search hit, resolved against the catalog. */
export function HitCard({ type, id }: { type: 'plugin' | 'agent' | 'skill'; id: string }) {
  const { pluginByName, artifactById } = useCatalog();
  if (type === 'plugin') {
    const p = pluginByName.get(id);
    return p ? <PluginCard plugin={p} /> : null;
  }
  const a = artifactById.get(id);
  return a ? <ArtifactCard artifact={a} /> : null;
}

