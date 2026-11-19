'use client';

/**
 * The yellow "Demo rejim" strip every viral screen carries under the page header.
 *
 * The design export draws this module's own sentence, so the body overrides the generic
 * `common.demo.body`; the az string is verbatim from the export.
 */
import { useTranslations } from 'next-intl';

import { DemoBanner } from '@/shared/states';

export function ViralDemoBanner() {
  const t = useTranslations('viral');
  return <DemoBanner module="viral" body={t('demo.body')} />;
}
