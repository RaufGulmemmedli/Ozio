'use client';

/**
 * V6's dark live-price block (`v6-viral-auction-live.html`).
 *
 * Measured: `block` fill, radius 36, padding 40, gap 16 — the `brand-soft` "Canlı" pill, a
 * "Növbəti düşmə: 00:03" line with `timer` at 15/700, "Hazırkı qiymət" 15/400, the price at
 * **96/800 in yellow**, and "Başlanğıc 900 ₼ · minimum 700 ₼" 15/400.
 *
 * Nothing here is derived: `currentPrice`, `startPrice`, `floorPrice`, `secondsPerDrop` and the
 * countdown's target all come from the mock. The seconds shown tick locally, but when they reach
 * zero the parent refetches and the **server** supplies the next price.
 *
 * a11y: the ticking line is `aria-hidden` so a reader is not interrupted every second; a single
 * `aria-live="polite"` region announces the price, and only when the price itself changes.
 */
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useFormat } from '@/core/i18n';
import { Timer } from '@/shared/lucide';

import type { Auction } from '../data/models/auction';
import { formatCountdown } from '../hooks/use-deadline';
import { Radio } from './icons';

export interface LivePriceBlockProps {
  auction: Auction;
  /** Seconds to the next drop, from `useAuctionClock`. */
  toNextDrop: number | null;
}

export function LivePriceBlock({ auction, toNextDrop }: LivePriceBlockProps) {
  const t = useTranslations('viral');
  const { money } = useFormat();
  const live = auction.status === 'live';

  // The polite announcement is refreshed only when the price moves, never on a tick.
  const [announced, setAnnounced] = useState('');
  const lastPrice = useRef<number | null>(null);

  useEffect(() => {
    if (lastPrice.current === auction.currentPrice) return;
    lastPrice.current = auction.currentPrice;
    setAnnounced(
      t('auction.live.announce', { price: money(auction.currentPrice), stock: auction.stockLeft }),
    );
  }, [auction.currentPrice, auction.stockLeft, money, t]);

  return (
    <section
      aria-labelledby="auction-live-price"
      className="flex min-w-0 flex-1 flex-col gap-4 rounded-bento bg-block p-7 lg:p-10"
    >
      <div className="flex flex-row flex-wrap items-center gap-4">
        {live ? (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-brand-soft px-2.5 text-micro font-bold text-brand">
            <Radio size={14} aria-hidden="true" />
            {t('auctions.live')}
          </span>
        ) : (
          <span className="inline-flex h-7 items-center rounded-pill bg-white/15 px-2.5 text-micro font-bold text-on-block">
            {t('auctions.ended')}
          </span>
        )}

        {live && toNextDrop !== null ? (
          <span
            aria-hidden="true"
            className="flex flex-row items-center gap-2 text-body-sm font-bold text-on-block"
          >
            <Timer size={18} />
            {t('auction.nextDrop', { time: formatCountdown(toNextDrop) })}
          </span>
        ) : null}
      </div>

      <p className="text-body-sm text-on-block2">{t('auction.currentPrice')}</p>

      <p
        id="auction-live-price"
        className="oz-num text-display font-extrabold text-yellow lg:text-[96px]"
      >
        {money(auction.currentPrice)}
      </p>

      <p className="text-body-sm text-on-block2">
        {t('auction.range', {
          start: money(auction.startPrice),
          floor: money(auction.floorPrice),
        })}
      </p>

      <p className="text-caption text-on-block3">
        {t('auction.dropRule', {
          seconds: auction.secondsPerDrop,
          step: money(auction.step),
        })}
      </p>

      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </section>
  );
}
