'use client';

/**
 * `/viral/auctions` — V5 "Qiymət düşmə siyahısı" (`v5-viral-auctions.html`, frame `Ow8uO`).
 *
 * A 3-column grid of auction cards at gap 20 (one column below 768, two at 768–1199).
 *
 * States from `v-states-dialogs.html`: `State · Hələ oyun yoxdur` (empty) and
 * `State · Yüklənmədi` (error).
 *
 * The prices on these cards move, so the list is read with `CACHE.tracking` (see `useAuctions`):
 * it is never served stale, and each card's stock figure is whatever the server computed when the
 * page was fetched.
 */
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { EmptyState, ErrorState } from '@/shared/states';
import { InfiniteList } from '@/shared/ui';

import { AuctionCard } from '../components/auction-card';
import { TrendingDown } from '../components/icons';
import { ViralDemoBanner } from '../components/viral-demo-banner';
import type { Auction } from '../data/models/auction';
import { useAuctions } from '../hooks/use-auctions';
import { AuctionsSkeleton } from './AuctionsSkeleton';

export function AuctionsView() {
  const t = useTranslations('viral');
  const auctions = useAuctions();

  const header = (
    <>
      <PageHeader
        title={t('auctions.title')}
        subtitle={t('auctions.subtitle')}
        backHref={paths.viral}
        backLabel={t('crumb.viral')}
      />
      <ViralDemoBanner />
    </>
  );

  if (auctions.isPending) {
    return (
      <>
        {header}
        <AuctionsSkeleton />
      </>
    );
  }

  if (auctions.isError) {
    return (
      <>
        {header}
        <ErrorState
          failure={auctions.error}
          title={t('error.title')}
          message={t('error.body')}
          retryLabel={t('error.retry')}
          onRetry={auctions.refetch}
          retrying={auctions.isFetching}
        />
      </>
    );
  }

  if (auctions.isEmpty) {
    return (
      <>
        {header}
        <EmptyState
          panel
          icon={TrendingDown}
          title={t('auctions.empty.title')}
          body={t('auctions.empty.body')}
        />
      </>
    );
  }

  return (
    <>
      {header}

      <InfiniteList<Auction>
        items={auctions.items}
        itemKey={(auction) => auction.id}
        hasNextPage={auctions.hasMore}
        isFetchingNextPage={auctions.isFetchingNextPage}
        fetchNextPage={auctions.loadMore}
        loadingLabel={t('loading')}
        className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        renderItem={(auction) => <AuctionCard auction={auction} />}
      />
    </>
  );
}
