import { t } from '../i18n/t';
import { href } from '../lib/router';
import type { Release } from '../types';

const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export function formatDate(iso: string | null): string {
  if (!iso) return t('release.undated');
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? t('release.undated') : dateFormat.format(d);
}

export function ReleaseList({ releases, showChanges }: { releases: Release[]; showChanges: boolean }) {
  if (releases.length === 0) return <p className="muted">{t('release.none')}</p>;
  return (
    <ol className="releases">
      {releases.map((r) => (
        <li key={r.tag} className="release">
          <div className="release-head">
            <a href={href.plugin(r.plugin)} className="release-plugin">
              {r.plugin}
            </a>
            <span className="version">{t('plugin.versionShort', { version: r.version })}</span>
            <time dateTime={r.date ?? undefined} className="muted">
              {formatDate(r.date)}
            </time>
          </div>
          {showChanges &&
            (r.changes.length > 0 ? (
              <ul className="release-changes">
                {r.changes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">{t('release.noChanges')}</p>
            ))}
        </li>
      ))}
    </ol>
  );
}
