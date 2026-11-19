'use client';

/**
 * One essentials-basket row (`senior-pension.html` → `Basket Row`): a 48 photo tile (radius 14),
 * the name 16/600, the quantity 14/400 `ink2`, and the line total 16/700.
 *
 * The photo is `<ProductImage>` without a `src`, which renders exactly the `surface2` placeholder
 * the export draws (the mock basket carries no image urls).
 *
 * TODO(store): when `@/modules/store` exposes it, render these lines through
 * `import { ProductCard } from '@/modules/store'` in its list variant so the basket shares the
 * catalogue's product presentation.
 */
import { useFormat } from '@/core/i18n';
import { ProductImage } from '@/shared/media';

import type { BasketItem } from '../data/models/pension-plan';

export interface BasketRowProps {
  item: BasketItem;
}

export function BasketRow({ item }: BasketRowProps) {
  const { money, number } = useFormat();

  return (
    <li className="flex min-h-[72px] w-full flex-row items-center gap-[14px] py-3">
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
        <span className="text-body font-semibold text-ink">{item.name}</span>
        <span className="text-label text-ink2">
          {number(item.qty)} {item.unit}
        </span>
      </div>
      <span className="shrink-0 text-body font-bold text-ink">{money(item.lineTotal)}</span>
    </li>
  );
}
