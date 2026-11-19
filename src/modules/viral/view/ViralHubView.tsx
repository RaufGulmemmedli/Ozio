'use client';

/**
 * `/viral` — V1 "Kəşf et hub" (`v1-viral-hub.html`, frame `n4rxj`).
 *
 * Layout from the export: Page Header (title 36/800 "Kəşf et", subtitle 16/400) → "Demo rejim" →
 * a row of three 360-high tiles at gap 20, stacking to one column below 768 and two at 768–1199.
 *
 * Each tile's counter is **data**: "2 kampaniya" and "3 canlı" come from the two list queries, so
 * the hub reads what the list screens read and TanStack shares the cache with them.
 */
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Gift, ScanLine } from '@/shared/lucide';

import { FeatureTile } from '../components/feature-tile';
import { TrendingDown } from '../components/icons';
import { ViralDemoBanner } from '../components/viral-demo-banner';
import { useAuctions } from '../hooks/use-auctions';
import { useWishlists } from '../hooks/use-wishlists';
import { ViralHubSkeleton } from './ViralHubSkeleton';

export function ViralHubView() {
  const t = useTranslations('viral');

  const wishlists = useWishlists();
  const auctions = useAuctions();

  const loading = wishlists.isPending || auctions.isPending;
  const liveCount = auctions.items.filter((auction) => auction.status === 'live').length;

  return (
    <>
      <PageHeader title={t('hub.title')} subtitle={t('hub.subtitle')} />

      <ViralDemoBanner />

      {loading ? (
        <ViralHubSkeleton />
      ) : (
        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <FeatureTile
            href={paths.viralWishlists}
            tone="brand"
            icon={Gift}
            title={t('hub.gift.title')}
            body={t('hub.gift.body')}
            meta={t('wishlists.count', { count: wishlists.total })}
          />
          <FeatureTile
            href={paths.viralAuctions}
            tone="yellow"
            icon={TrendingDown}
            title={t('hub.game.title')}
            body={t('hub.game.body')}
            meta={t('auctions.liveCount', { count: liveCount })}
          />
          <FeatureTile
            href={paths.viralReceiptScan}
            tone="block"
            icon={ScanLine}
            title={t('hub.scan.title')}
            body={t('hub.scan.body')}
            meta={t('hub.scan.meta')}
          />
        </div>
      )}
    </>
  );
}
