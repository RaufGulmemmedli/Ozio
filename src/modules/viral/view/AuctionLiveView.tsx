'use client';

/**
 * `/viral/auctions/[id]` — V6 "Canlı oyun" (`v6-viral-auction-live.html`, frame `No6de`).
 *
 * Layout from the export: the dark live-price block next to the 420-wide "Stok" card; the live bid
 * feed is added below (the brief asks for a `role="log"` bid list, which the frame does not draw).
 *
 * ## Where the time comes from
 *
 * Nothing on this screen starts a clock of its own. `useAuction` reads `current_price`,
 * `stock_left`, `status`, `ends_at` and `next_drop_at` from the mock, and `useAuctionClock` counts
 * down to those two **server instants**. When a countdown reaches zero it refetches, so:
 *
 *  - the next price is the server's, not `price - step` computed here;
 *  - the run ending is the server's verdict — the screen settles into `Aldın!` / `Qaçırdın` on a
 *    refetch, never on a guess;
 *  - a reload resumes exactly where the server says the run is, because `startedAt` is persisted
 *    in the demo db rather than captured at mount.
 *
 * ## Where the validation comes from
 *
 * "İndi al" opens `<BidDialog>`, which posts the price it is showing. The **handler** compares it
 * with the price that is live when the request lands and answers 422 if it is lower — the
 * stale-ticker case. This component has no notion of a valid bid.
 *
 * States from `v-states-dialogs.html`: `State · Aldın!` (own winning bid),
 * `State · Qaçırdın` (ended with no bid, plus "Yenidən oyna"), `State · Yüklənmədi`.
 * `?preview=ended` seeds the ended screen without waiting for the run.
 */
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFailureMessage, useFormat } from '@/core/i18n';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';
import { Trophy } from '@/shared/lucide';
import { EmptyState, ErrorState } from '@/shared/states';
import { Button, toast } from '@/shared/ui';

import { BidDialog } from '../components/bid-dialog';
import { BidLog } from '../components/bid-log';
import { BuyCard } from '../components/buy-card';
import { Hourglass } from '../components/icons';
import { LinkButton } from '../components/link-button';
import { LivePriceBlock } from '../components/live-price-block';
import { ViralDemoBanner } from '../components/viral-demo-banner';
import { auctionOutcome } from '../data/models/auction';
import { useAuction, useAuctionClock, useBid, useRestartAuction } from '../hooks/use-auctions';
import { AuctionLiveSkeleton } from './AuctionLiveSkeleton';

export interface AuctionLiveViewProps {
  id: string;
}

export function AuctionLiveView({ id }: AuctionLiveViewProps) {
  const t = useTranslations('viral');
  const { money } = useFormat();
  const failureMessage = useFailureMessage();

  const auction = useAuction(id);
  const clock = useAuctionClock(auction.data);
  const bid = useBid(id);
  const restart = useRestartAuction(id);

  const [bidOpen, setBidOpen] = useState(false);

  const data = auction.data;

  const header = (
    <>
      <PageHeader
        title={data?.title ?? t('auction.titleFallback')}
        subtitle={
          data
            ? t('auction.subtitle', {
                seconds: data.secondsPerDrop,
                step: money(data.step),
              })
            : undefined
        }
        backHref={paths.viralAuctions}
        backLabel={t('crumb.auctions')}
      />
      <ViralDemoBanner />
    </>
  );

  if (auction.isPending) {
    return (
      <>
        {header}
        <AuctionLiveSkeleton />
      </>
    );
  }

  if (auction.isError || !data) {
    return (
      <>
        {header}
        <ErrorState
          failure={auction.error}
          title={t('error.title')}
          message={t('error.body')}
          retryLabel={t('error.retry')}
          onRetry={() => void auction.refetch()}
          retrying={auction.isFetching}
        />
      </>
    );
  }

  const outcome = auctionOutcome(data);

  return (
    <>
      {header}

      {/* `Aldın!` — the user holds a winning bid. */}
      {outcome === 'bought' ? (
        <EmptyState
          panel
          icon={Trophy}
          title={t('auction.won.title')}
          body={t('auction.won.body', {
            title: data.title,
            price: money(data.myBid?.amount ?? data.currentPrice),
          })}
          action={
            <LinkButton href={paths.viralAuctions} variant="primary" size="md">
              {t('auction.won.back')}
            </LinkButton>
          }
        />
      ) : null}

      {/* `Qaçırdın` — the run is over and nothing was won. */}
      {outcome === 'missed' ? (
        <EmptyState
          panel
          icon={Hourglass}
          title={t('auction.missed.title')}
          body={t('auction.missed.body')}
          action={
            <Button
              variant="primary"
              size="md"
              loading={restart.isPending}
              onClick={() =>
                restart.mutate(undefined, {
                  onSuccess: () => toast.success(t('auction.missed.restarted')),
                  onError: (failure) => toast.error(failureMessage(failure)),
                })
              }
            >
              {t('auction.missed.again')}
            </Button>
          }
        />
      ) : null}

      <div className="flex w-full flex-col gap-8 lg:flex-row">
        <LivePriceBlock auction={data} toNextDrop={clock.toNextDrop} />
        <BuyCard
          auction={data}
          busy={bid.isPending}
          onBuy={() => {
            bid.reset();
            setBidOpen(true);
          }}
        />
      </div>

      <BidLog bids={data.bids} />

      <BidDialog
        auction={data}
        open={bidOpen}
        onOpenChange={(open) => {
          setBidOpen(open);
          if (!open) bid.reset();
        }}
        busy={bid.isPending}
        failure={bid.error ?? null}
        onConfirm={(amount) =>
          bid.mutate(amount, {
            onSuccess: (updated) => {
              setBidOpen(false);
              toast.success({
                title: t('auction.won.title'),
                body: money(updated.myBid?.amount ?? amount),
              });
            },
            // A rejection keeps the dialog open: the 422's message is rendered inside it, and the
            // refetch below brings the price the server actually wants.
            onError: () => void auction.refetch(),
          })
        }
      />
    </>
  );
}
