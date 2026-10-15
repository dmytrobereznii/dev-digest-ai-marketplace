import { t } from '../i18n/t';
import { href } from '../lib/router';

export function NotFound({ what }: { what?: string }) {
  return (
    <div className="empty">
      <h1>{t('notFound.title')}</h1>
      <p>{what ?? t('notFound.page')}</p>
      <p>
        <a href={href.home()}>{t('search.browseAll')}</a>
      </p>
    </div>
  );
}
