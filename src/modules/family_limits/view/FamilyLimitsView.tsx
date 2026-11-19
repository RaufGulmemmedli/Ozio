'use client';

/**
 * `/family-limits` — "Üzv limitləri" (`limits-list.html`, node `U1hegb`).
 *
 * Layout from the export: Page Header (breadcrumb "Profil / Ailə kartı", title 36/800, subtitle)
 * → yellow demo notice → the `block` summary strip → a 3-column member grid at gap 24.
 *
 * States: `limits-list-skeleton.html` (loading), `limits-list-empty.html` (empty, CTA back to the
 * family card) and `limits-list-error.html` (error with retry) — the header and the notice stay
 * real in all three, which is what the exports draw.
 */
import { useTranslations } from 'next-intl';

import { useFailureMessage } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Users } from '@/shared/lucide';
import { DemoBanner, EmptyState, ErrorState } from '@/shared/states';
import { Breadcrumbs } from '@/shared/ui';

import { LimitMemberCard } from '../components/limit-member-card';
import { LimitSummaryStrip } from '../components/limit-summary-strip';
import { LinkButton } from '../components/link-button';
import { useFamilyLimits } from '../hooks/use-family-limits';
import { FamilyLimitsSkeleton } from './FamilyLimitsSkeleton';

export function FamilyLimitsView() {
  const t = useTranslations('family_limits');
  const tc = useTranslations('common');
  const failureMessage = useFailureMessage();

  const limits = useFamilyLimits();
  const members = limits.data?.members ?? [];

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={
          <Breadcrumbs
            label={t('breadcrumb.label')}
            items={[
              { label: t('breadcrumb.profile'), href: paths.profile },
              { label: t('breadcrumb.familyCard') },
            ]}
          />
        }
      />

      <DemoBanner module={t('title')} body={t('demo.body')} />

      {limits.isPending ? (
        <FamilyLimitsSkeleton />
      ) : limits.isError ? (
        <ErrorState
          failure={limits.error}
          title={t('error.title')}
          message={failureMessage(limits.error)}
          retryLabel={tc('retry')}
          retrying={limits.isRefetching}
          onRetry={() => limits.refetch()}
          className="min-h-[480px] justify-center rounded-xl bg-surface p-7"
        />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('empty.title')}
          body={t('empty.body')}
          action={
            <LinkButton href={paths.rewardsFamilyCard} variant="primary" size="xl">
              {t('empty.action')}
            </LinkButton>
          }
          className="min-h-[480px] justify-center rounded-xl bg-surface p-7"
        />
      ) : (
        <>
          <LimitSummaryStrip summary={limits.data.summary} />

          <ul className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <li key={member.id} className="flex">
                <LimitMemberCard member={member} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
