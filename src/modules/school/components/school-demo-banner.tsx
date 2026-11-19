'use client';

/**
 * The yellow "Demo rejim" strip every school screen carries under the page header.
 *
 * `<DemoBanner>` from `@/shared/states` defaults to the generic `common.demo.body` copy; the
 * design export draws this module's own sentence ("Bu bölmə hələ real serverə qoşulmayıb — …"),
 * so the body is overridden with `school.demo.body` and the az string is verbatim from the export.
 */
import { useTranslations } from 'next-intl';

import { DemoBanner } from '@/shared/states';

export function SchoolDemoBanner() {
  const t = useTranslations('school');
  return <DemoBanner module="school" body={t('demo.body')} />;
}
