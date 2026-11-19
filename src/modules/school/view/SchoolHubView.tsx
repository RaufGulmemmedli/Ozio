'use client';

/**
 * `/school` — SC1 "Təhsil mərkəzi · Hub" (`sc1-school-hub.html`, frame `hQ6xT`).
 *
 * Layout from the export: Page Header (breadcrumb "Profil", title 36/800, subtitle 16/400) →
 * "Demo rejim" strip → a row of three 340-high tiles at gap 20, which stacks to one column below
 * 768 and to two at 768–1199.
 *
 * Each tile's status line is **data**: the points balance, the number of lists and the card state
 * all come from the mock, so the hub reads the same three queries the detail screens do (and
 * TanStack de-duplicates them with those screens' reads).
 */
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';

import { HubTile } from '../components/hub-tile';
import { GraduationCap, IdCard, NotebookPen } from '../components/icons';
import { SchoolDemoBanner } from '../components/school-demo-banner';
import { useClassLists } from '../hooks/use-class-lists';
import { useGrades } from '../hooks/use-grades';
import { useStudentCard } from '../hooks/use-student-card';
import { SchoolHubSkeleton } from './SchoolHubSkeleton';

export function SchoolHubView() {
  const t = useTranslations('school');

  const grades = useGrades();
  const lists = useClassLists();
  const card = useStudentCard();

  const loading = grades.isPending || lists.isPending || card.isPending;

  return (
    <>
      <PageHeader
        title={t('hub.title')}
        subtitle={t('hub.subtitle')}
        backHref={paths.profile}
        backLabel={t('crumb.profile')}
      />

      <SchoolDemoBanner />

      {loading ? (
        <SchoolHubSkeleton />
      ) : (
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <HubTile
            href={paths.schoolGrades}
            tone="brand"
            icon={GraduationCap}
            title={t('hub.grades.title')}
            body={t('hub.grades.body')}
            meta={t('points', { count: grades.data?.balance ?? 0 })}
          />
          <HubTile
            href={paths.schoolClassList}
            tone="yellow"
            icon={NotebookPen}
            title={t('hub.lists.title')}
            body={t('hub.lists.body')}
            meta={t('lists.count', { count: lists.total })}
          />
          <HubTile
            href={paths.schoolStudentCard}
            tone="block"
            icon={IdCard}
            title={t('hub.card.title')}
            body={t('hub.card.body')}
            meta={t(`card.state.${card.data?.state ?? 'none'}`)}
          />
        </div>
      )}
    </>
  );
}
