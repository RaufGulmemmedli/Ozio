'use client';

/**
 * SC3's sticky "Xülasə" card (380 wide, radius 36, padding 28, gap 16).
 *
 * Rows: "14 məhsul / 23,00 ₼", "Qənaət / 4,35 ₼" (success), a `line` hairline, then
 * "Cəmi / 23,00 ₼" at 24/800 and the two 52-high buttons.
 *
 * "Hamısını səbətə at" is a **demo action**: the mock answers with what would go into the cart and
 * the screen says nothing was ordered. "Paylaş" is `navigator.share` with a clipboard fallback.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { Share2, ShoppingCart } from '@/shared/lucide';
import { Button } from '@/shared/ui';

import type { ClassList } from '../data/models/class-list';

export interface ClassListSummaryProps {
  list: ClassList;
  onAddToCart: () => void;
  onShare: () => void;
  addingToCart?: boolean;
  sharing?: boolean;
}

export function ClassListSummary({
  list,
  onAddToCart,
  onShare,
  addingToCart = false,
  sharing = false,
}: ClassListSummaryProps) {
  const t = useTranslations('school');
  const { money } = useFormat();

  return (
    <aside
      aria-labelledby="class-list-summary"
      className="flex w-full flex-col gap-4 rounded-bento bg-surface p-7 lg:sticky lg:top-6 lg:w-[380px] lg:shrink-0"
    >
      <h2 id="class-list-summary" className="text-h4 font-extrabold text-ink">
        {t('lists.summary.title')}
      </h2>

      <dl className="flex w-full flex-col gap-3">
        <div className="flex flex-row items-center justify-between gap-3">
          <dt className="text-body-sm text-ink2">
            {t('lists.summary.items', { count: list.itemCount })}
          </dt>
          <dd className="text-body-sm font-bold text-ink">{money(list.total)}</dd>
        </div>
        {list.savings > 0 ? (
          <div className="flex flex-row items-center justify-between gap-3">
            <dt className="text-body-sm text-ink2">{t('lists.summary.savings')}</dt>
            <dd className="text-body-sm font-bold text-success">{money(list.savings)}</dd>
          </div>
        ) : null}

        <span aria-hidden="true" className="h-px w-full bg-line" />

        <div className="flex flex-row items-center justify-between gap-3">
          <dt className="text-body-sm text-ink">{t('lists.summary.total')}</dt>
          <dd className="text-h3 font-extrabold text-ink">{money(list.total)}</dd>
        </div>
      </dl>

      <Button
        variant="primary"
        size="xl"
        fullWidth
        loading={addingToCart}
        leadingIcon={<ShoppingCart size={20} aria-hidden="true" />}
        onClick={onAddToCart}
      >
        {t('lists.addToCart')}
      </Button>

      <Button
        variant="soft"
        size="xl"
        fullWidth
        loading={sharing}
        leadingIcon={<Share2 size={20} aria-hidden="true" />}
        onClick={onShare}
      >
        {t('lists.share')}
      </Button>

      <p className="text-caption text-ink3">{t('lists.addToCartNote')}</p>
    </aside>
  );
}
