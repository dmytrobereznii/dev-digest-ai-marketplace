import { t } from '../i18n/t';
import { CopyBlock, CopyCommand } from '../components/CopyCommand';
import { REPO_SLUG, REPO_URL } from '../lib/config';
import { useCatalog } from '../lib/data';

// Condensed from docs/RELEASES.md; the full document is linked at the bottom.
export function GettingStarted() {
  const { index } = useCatalog();
  const vars = { repo: REPO_SLUG, marketplace: index.marketplace.name, plugin: t('commands.pluginPlaceholder') };

  return (
    <article className="detail guide">
      <h1>{t('guide.title')}</h1>
      <p className="lead">{t('guide.lead')}</p>

      <section aria-labelledby="g-add">
        <h2 id="g-add">{t('guide.addTitle')}</h2>
        <p>{t('guide.addText')}</p>
        <CopyCommand command={t('commands.addMarketplaceSlash', vars)} />
        <p className="muted small">{t('guide.addCli')}</p>
        <CopyCommand command={t('commands.addMarketplaceCli', vars)} />
      </section>

      <section aria-labelledby="g-install">
        <h2 id="g-install">{t('guide.installTitle')}</h2>
        <p>{t('guide.installText')}</p>
        <CopyCommand command={t('commands.install', vars)} />
        <p>{t('guide.installReload')}</p>
        <CopyCommand command={t('commands.reload')} />
      </section>

      <section aria-labelledby="g-update">
        <h2 id="g-update">{t('guide.updateTitle')}</h2>
        <p>{t('guide.updateText')}</p>
        <CopyBlock code={t('commands.update', vars)} />
        <p>{t('guide.updateCheck')}</p>
        <CopyCommand command={t('commands.list')} />
      </section>

      <section aria-labelledby="g-auto">
        <h2 id="g-auto">{t('guide.autoTitle')}</h2>
        <p>{t('guide.autoText')}</p>
        <ul>
          <li>{t('guide.autoMenu')}</li>
          <li>{t('guide.autoSetting')}</li>
        </ul>
      </section>

      <section aria-labelledby="g-versions">
        <h2 id="g-versions">{t('guide.versionsTitle')}</h2>
        <p>{t('guide.versionsText')}</p>
        <p>{t('guide.tagsText')}</p>
      </section>

      <section aria-labelledby="g-rollback">
        <h2 id="g-rollback">{t('guide.rollbackTitle')}</h2>
        <p>{t('guide.rollbackText', vars)}</p>
        <CopyBlock code={t('commands.rollback', vars)} />
        <p>{t('guide.rollbackReturn')}</p>
        <p className="muted small">{t('guide.rollbackData')}</p>
      </section>

      <p>
        <a href={`${REPO_URL}/blob/main/docs/RELEASES.md`} target="_blank" rel="noopener noreferrer">
          {t('guide.fullDoc')}
        </a>
      </p>
    </article>
  );
}
