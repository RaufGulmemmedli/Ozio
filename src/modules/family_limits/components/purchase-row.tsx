'use client';

/**
 * One "Son alışlar" row (`limits-member.html` → `Purchase Row`): a 48 photo tile (radius 14),
 * the title 16/600, `category · date` 14/400 `ink2`, and the amount 16/700. Row height 76.
 *
 * The photo is `<ProductImage>` without a `src`, which renders exactly the `surface2` placeholder
 * the export draws (the mock ledger carries no image urls).
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { ProductImage } from '@/shared/media';

import type { LimitPurchase } from '../data/models/limit-member';

export interface PurchaseRowProps {
  purchase: LimitPurchase;
}

export function PurchaseRow({ purchase }: PurchaseRowProps) {
  const t = useTranslations('family_limits');
  const { money, date } = useFormat();

  return (
    <li className="flex min-h-[76px] w-full flex-row items-center gap-[14px] py-3">
      <ProductImage
        src={null}
        alt=""
        ratio="1/1"
        radius="none"
        fallbackIconSize={22}
        sizes="48px"
        className="size-12 shrink-0 rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-semibold text-ink">{purchase.title}</span>
        <span className="truncate text-label text-ink2">
          {t('purchase.meta', {
            category: t(`category.${purchase.category}`),
            date: date(purchase.date, 'dayMonth'),
          })}
        </span>
      </div>
      <span className="shrink-0 text-body font-bold text-ink">{money(purchase.amount)}</span>
    </li>
  );
}
