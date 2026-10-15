import { t } from '../i18n/t';
import { ReleaseList } from '../components/ReleaseList';
import { useCatalog } from '../lib/data';

export function WhatsNew() {
  const { releases } = useCatalog();
  return (
    <>
      <h1>{t('whatsNew.title')}</h1>
      <p className="lead">{t('whatsNew.lead')}</p>
      <ReleaseList releases={releases} showChanges />
    </>
  );
}
