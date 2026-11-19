'use client';

/**
 * The live bid feed next to V6's price block — what makes the draining stock visible.
 *
 * a11y (brief): the list is a `role="log"` with `aria-live="polite"`, so a new row is announced
 * once, politely, and the countdown's per-second ticking (which lives in `<LivePriceBlock>` and is
 * `aria-hidden`) never competes with it.
 *
 * Every row is server data: the mock derives the feed from the auction's stored `startedAt`, so the
 * same log comes back after a reload.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Avatar } from '@/shared/ui';

import type { AuctionBid } from '../data/models/auction';
import { contributorTone } from '../data/models/wishlist';

export interface BidLogProps {
  bids: AuctionBid[];
}

export function BidLog({ bids }: BidLogProps) {
  const t = useTranslations('viral');
  const { money, relative } = useFormat();

  return (
    <section aria-labelledby="auction-bids" className="flex w-full flex-col gap-4">
      <h2 id="auction-bids" className="text-h4 font-extrabold text-ink">
        {t('auction.bids.title')}
      </h2>

      <ul
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={t('auction.bids.title')}
        className="flex w-full flex-col divide-y divide-line rounded-xl bg-surface px-6"
      >
        {bids.length === 0 ? (
          <li className="py-5 text-body-sm text-ink2">{t('auction.bids.empty')}</li>
        ) : (
          bids.map((bid, index) => (
            <li key={bid.id} className="flex h-16 flex-row items-center gap-[14px]">
              <Avatar
                size={40}
                name={bid.name || t('auction.bids.me')}
                tone={contributorTone(index)}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    'truncate text-body font-bold',
                    bid.isMine ? 'text-brand' : 'text-ink',
                  )}
                >
                  {bid.isMine ? t('auction.bids.me') : bid.name}
                </span>
                <span className="text-caption text-ink3">
                  {bid.at ? relative(bid.at) : ''}
                </span>
              </span>
              <span className="shrink-0 text-[17px] font-extrabold text-success">
                {money(bid.amount)}
              </span>
            </li>
          ))
        )}
      </ul>

      <p className="text-caption text-ink3">{t('auction.bids.note')}</p>
    </section>
  );
}
