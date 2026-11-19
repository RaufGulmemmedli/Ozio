'use client';

/**
 * One card on V5 (`v5-viral-auctions.html`).
 *
 * Measured: white card radius 28, padding 24, gap 16 — an 80×80 `surface2` thumb at radius 24, the
 * `brand-soft` "Canlı" pill with `radio`, title 22/700, "900 ₼-dən" 30/800, "Minimum 700 ₼ · 100
 * ədəd stokda" 13/400 `ink3` and a full-width 44-high soft "Oyuna bax".
 *
 * The card leads with the **start** price, as drawn; the live price belongs to the detail screen.
 * An auction the server reports as `ended` swaps the pill and the CTA copy — the card never
 * decides that itself, and the stock figure is the mock's.
 *
 * The whole card is one locale-aware `<Link>`, so the drawn CTA is a styled span rather than a
 * nested `<a>`/`<button>`.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';

import type { Auction } from '../data/models/auction';
import { GiftThumb } from './gift-thumb';
import { Radio } from './icons';

export interface AuctionCardProps {
  auction: Auction;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const t = useTranslations('viral');
  const { money } = useFormat();
  const live = auction.status === 'live';

  return (
    <Link
      href={paths.viralAuction(auction.id)}
      className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6 transition-colors duration-[var(--oz-dur-fast)] hover:bg-surface2/60"
    >
      <div className="flex w-full flex-row items-start justify-between gap-4">
        <GiftThumb icon={auction.icon} size={80} radiusClassName="rounded-card" />
        {live ? (
          <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-pill bg-brand-soft px-2.5 text-micro font-bold text-brand">
            <Radio size={14} aria-hidden="true" />
            {t('auctions.live')}
          </span>
        ) : (
          <span className="inline-flex h-7 shrink-0 items-center rounded-pill bg-surface2 px-2.5 text-micro font-bold text-ink2">
            {t('auctions.ended')}
          </span>
        )}
      </div>

      <h3 className="text-h3 font-bold text-ink lg:text-[22px]">{auction.title}</h3>

      <p className="text-h2 font-extrabold text-ink lg:text-[30px]">
        {t('auctions.from', { price: money(auction.startPrice) })}
      </p>

      <p className="text-caption text-ink3">
        {t('auctions.cardMeta', { floor: money(auction.floorPrice), stock: auction.stockLeft })}
      </p>

      <span className="flex h-11 w-full items-center justify-center rounded-pill bg-surface2 text-label font-bold text-ink">
        {live ? t('auctions.watch') : t('auctions.result')}
      </span>
    </Link>
  );
}
