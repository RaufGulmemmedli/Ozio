'use client';

/**
 * V7's dark comparison card (400 wide, `block`, radius 36, padding 28, gap 16).
 *
 * Measured: "Eyni səbəti 10% ucuz al" 24/800, the "Mağazada / 24,20 ₼" and "Ozio-da / 21,78 ₼"
 * rows at 15/400 + 15/700, a `#FFFFFF33` hairline, "Ümumi qənaət" with **2,42 ₼ in yellow at
 * 24/800**, then the brand 52-high "Səbətə at" with `shopping-cart`.
 *
 * Every figure — both totals, the saving and the percentage in the heading — is the mock's.
 * "Səbətə at" is a **demo action**: the handler answers with what would go in the cart, nothing is
 * ordered, and the footnote says so.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { ShoppingCart } from '@/shared/lucide';
import { Button } from '@/shared/ui';

import type { ScannedReceipt } from '../data/models/receipt';

export interface ComparisonCardProps {
  receipt: ScannedReceipt;
  onAddToCart: () => void;
  busy?: boolean;
}

export function ComparisonCard({ receipt, onAddToCart, busy = false }: ComparisonCardProps) {
  const t = useTranslations('viral');
  const { money } = useFormat();

  return (
    <aside
      aria-labelledby="receipt-comparison"
      className="flex w-full flex-col gap-4 rounded-bento bg-block p-7 lg:w-[400px] lg:shrink-0"
    >
      <h2 id="receipt-comparison" className="text-h3 font-extrabold text-on-block">
        {t('scan.comparison.title', { percent: receipt.discountPercent })}
      </h2>

      <dl className="flex w-full flex-col gap-3">
        <div className="flex flex-row items-center justify-between gap-3">
          <dt className="text-body-sm text-on-block2">{t('scan.comparison.store')}</dt>
          <dd className="text-body-sm font-bold text-on-block">{money(receipt.storeTotal)}</dd>
        </div>
        <div className="flex flex-row items-center justify-between gap-3">
          <dt className="text-body-sm text-on-block2">{t('scan.comparison.ozio')}</dt>
          <dd className="text-body-sm font-bold text-on-block">{money(receipt.ozioTotal)}</dd>
        </div>

        <span aria-hidden="true" className="h-px w-full bg-white/20" />

        <div className="flex flex-row items-center justify-between gap-3">
          <dt className="text-body-sm text-on-block2">{t('scan.comparison.saving')}</dt>
          <dd className="text-h3 font-extrabold text-yellow">{money(receipt.saving)}</dd>
        </div>
      </dl>

      <Button
        variant="brand"
        size="xl"
        fullWidth
        loading={busy}
        leadingIcon={<ShoppingCart size={20} aria-hidden="true" />}
        onClick={onAddToCart}
      >
        {t('scan.comparison.addToCart')}
      </Button>

      <p className="text-caption text-on-block3">{t('scan.comparison.note')}</p>
    </aside>
  );
}
