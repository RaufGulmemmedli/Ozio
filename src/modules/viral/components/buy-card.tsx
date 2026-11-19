'use client';

/**
 * V6's right-hand "Stok" card (420 wide, white, radius 28, padding 28, gap 18).
 *
 * Measured: "Stok" 14/700 `ink2`, "63 / 100 qalıb" 22/800, a yellow "Tez bitir" pill, a 14-high
 * brand progress bar, the 14/400 `ink2` warning sentence, and the brand 52-high
 * "İndi al · 812 ₼" with `zap`.
 *
 * `stockLeft`, `totalStock` and `currentPrice` are all the mock's; the "Tez bitir" pill appears at
 * the drawn threshold, which lives in the model next to the stock helpers rather than inline here.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Zap } from '@/shared/lucide';
import { Button, Progress } from '@/shared/ui';

import { stockPercent, STOCK_LOW_PERCENT, type Auction } from '../data/models/auction';

export interface BuyCardProps {
  auction: Auction;
  onBuy: () => void;
  busy?: boolean;
}

export function BuyCard({ auction, onBuy, busy = false }: BuyCardProps) {
  const t = useTranslations('viral');
  const { money } = useFormat();

  const percent = stockPercent(auction);
  const low = percent <= STOCK_LOW_PERCENT;
  const live = auction.status === 'live' && auction.stockLeft > 0;

  return (
    <aside
      aria-labelledby="auction-stock"
      className="flex w-full flex-col gap-[18px] rounded-xl bg-surface p-7 lg:w-[420px] lg:shrink-0"
    >
      <h2 id="auction-stock" className="text-label font-bold text-ink2">
        {t('auction.stockTitle')}
      </h2>

      <div className="flex flex-row items-center justify-between gap-3">
        <p className="text-h4 font-extrabold text-ink lg:text-[22px]">
          {t('auction.stockLeft', { left: auction.stockLeft, total: auction.totalStock })}
        </p>
        {low ? (
          <span className="inline-flex h-7 shrink-0 items-center rounded-pill bg-yellow px-2.5 text-micro font-bold text-on-yellow">
            {t('auction.stockLow')}
          </span>
        ) : null}
      </div>

      <Progress
        value={percent}
        max={100}
        height={14}
        tone="brand"
        label={t('auction.stockTitle')}
        valueText={t('auction.stockLeft', {
          left: auction.stockLeft,
          total: auction.totalStock,
        })}
      />

      <p className="text-label text-ink2">{t('auction.stockHint')}</p>

      <Button
        variant="brand"
        size="xl"
        fullWidth
        disabled={!live}
        loading={busy}
        leadingIcon={<Zap size={20} aria-hidden="true" />}
        onClick={onBuy}
      >
        {t('auction.buyNow', { price: money(auction.currentPrice) })}
      </Button>

      <p className="text-caption text-ink3">{t('auction.buyNote')}</p>
    </aside>
  );
}
