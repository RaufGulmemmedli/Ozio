'use client';

/**
 * GB1 — `/group-buy` (`gb1-group-buy-home.html`, node `fT0Yx`).
 *
 * Header + brand `Qrup yarat` pill · Demo rejim strip · `Yaxınlıqda` / `Mənim qruplarım` chips ·
 * two-column deal grid · 360px right rail (dark create block + "Necə işləyir").
 *
 * Time: each card's countdown is derived from that deal's `closesAt`. When one elapses on screen
 * the list refetches, so the card settles into whatever the source then says (expired tag, or the
 * deal gone from `nearby`) instead of the client deciding.
 *
 * `?preview=loading|empty|error|offline` all work through `useScreenQuery`.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { Plus } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { DemoBanner } from '@/shared/states';
import { Button, ChipGroup } from '@/shared/ui';

import { DealCard } from '../components/deal-card';
import { GroupBuyEmpty, GroupBuyError } from '../components/group-state-panels';
import { CreateCtaBlock, HowItWorks } from '../components/right-rail';
import { useGroupBuyOverview } from '../hooks/use-group-buy';
import { useHref } from '../lib/use-href';
import { GroupBuyHeaderActionSkeleton, GroupBuyHomeSkeleton } from './GroupBuyHomeSkeleton';

type Tab = 'nearby' | 'mine';

export function GroupBuyHomeView() {
  const t = useTranslations('group_buy');
  const href = useHref();
  const [tab, setTab] = useState<Tab>('nearby');
  const overview = useGroupBuyOverview();

  const deals = overview.data ? overview.data[tab] : [];
  const refetch = () => {
    void overview.refetch();
  };

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          overview.isPending ? (
            <GroupBuyHeaderActionSkeleton />
          ) : (
            <Button
              as="a"
              href={href(paths.groupBuyCreate)}
              variant="brand"
              leadingIcon={<Plus size={20} aria-hidden="true" />}
            >
              {t('create.cta')}
            </Button>
          )
        }
      />

      <DemoBanner module={t('demo.module')} body={t('demo.body')} />

      {overview.isPending ? (
        <GroupBuyHomeSkeleton label={t('loading')} />
      ) : overview.isError ? (
        <GroupBuyError failure={overview.error} onRetry={refetch} retrying={overview.isRefetching} />
      ) : (
        <div className="flex flex-col gap-5 xl:flex-row xl:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <ChipGroup
              label={t('tabs.label')}
              value={tab}
              onValueChange={(value) => setTab(value as Tab)}
              options={[
                { value: 'nearby', label: t('tabs.nearby') },
                { value: 'mine', label: t('tabs.mine') },
              ]}
            />

            {deals.length === 0 ? (
              <GroupBuyEmpty tab={tab} />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onElapsed={refetch} />
                ))}
              </div>
            )}
          </div>

          <aside
            aria-label={t('how.title')}
            className="flex w-full flex-col gap-5 xl:w-[360px] xl:shrink-0"
          >
            <CreateCtaBlock />
            <HowItWorks />
          </aside>
        </div>
      )}
    </>
  );
}
