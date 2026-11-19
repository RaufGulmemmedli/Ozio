'use client';

/**
 * One basket line on the request detail (`ask-detail-*.html` → `Item Row`): a 52 photo tile
 * (radius 14), the name 16/600, `qty × unit price` 14/400 `ink2`, and the line total 16/700.
 *
 * The photo comes from `<ProductImage>` (`@/shared/media`) — the export paints a `surface2`
 * placeholder because it ships no raster assets, and that is exactly what `ProductImage` renders
 * without a `src`. The mock API carries no image urls, so there is nothing to pass yet.
 *
 * TODO(store): when `@/modules/store` exposes it, swap this row for
 * `import { ProductCard } from '@/modules/store'` in its compact/list variant so the basket lines
 * share the catalogue's product presentation instead of re-stating it.
 */
import { useFormat } from '@/core/i18n';
import { ProductImage } from '@/shared/media';

import type { AskItem } from '../data/models/ask-request';

export interface AskItemRowProps {
  item: AskItem;
}

export function AskItemRow({ item }: AskItemRowProps) {
  const { money, number } = useFormat();
  const qty = item.unit ? `${number(item.qty)} ${item.unit}` : number(item.qty);

  return (
    <li className="flex w-full flex-row items-center gap-[14px]">
      <ProductImage
        src={null}
        alt=""
        ratio="1/1"
        radius="none"
        fallbackIconSize={24}
        sizes="52px"
        className="size-13 shrink-0 rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-semibold text-ink">{item.name}</span>
        <span className="text-label text-ink2">
          {qty} × {money(item.unitPrice)}
        </span>
      </div>
      <span className="shrink-0 text-body font-bold text-ink">{money(item.lineTotal)}</span>
    </li>
  );
}
