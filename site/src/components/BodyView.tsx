import { t, type MessageKey } from '../i18n/t';
import { useBody } from '../lib/data';
import { Markdown } from './Markdown';

/** Loads a bodies/ file and renders it; says so when it is empty or unavailable. */
export function BodyView({ id, emptyKey }: { id: string | undefined; emptyKey: MessageKey }) {
  const body = useBody(id);
  if (body.status === 'loading') return <p className="muted">{t('status.loadingBody')}</p>;
  if (body.status === 'error') return <p className="muted">{t('status.bodyError')}</p>;
  if (!body.text.trim()) return <p className="muted">{t(emptyKey)}</p>;
  return <Markdown source={body.text} />;
}
