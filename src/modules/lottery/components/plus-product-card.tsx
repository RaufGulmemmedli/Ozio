'use client';

/**
 * A discounts-catalogue card for `/offers/discounts`.
 *
 * TODO(store): the brief asks this screen to reuse
 *   `import { ProductCard } from '@/modules/store';`
 * and it deliberately does **not**, for a data reason: `<ProductCard>` takes a `ProductRow`
 * and renders a card-covering link to
 * `paths.product(product.variantId) + '?store=' + product.storeId` plus a cart add button
 * keyed on the store-product row id. An `ozio-plus/products` row carries only
 * `{id, name, material_code, image, price_info}` — **no store, no variant id, no stock and
 * no cart key** — so mapping it into a `ProductRow` would mean inventing a `storeId` and a
 * `variantId`, i.e. shipping a dead product link and an add button that cannot work. These
 * rows are a partner chain's discount leaflet, not Ozio Market stock.
 *
 * The measurements are therefore `<ProductCard>`'s, kept 1:1 so the two grids line up:
 * `surface`, radius 24, padding 12, gap 12; image 200 high at radius 16 with the yellow
 * discount `<Tag>` inset 10; name 16/600; meta 13/400 `ink2`; price row with the new price
 * at 20/700 and the struck old price beside it. Swap this for `<ProductCard>` the day the
 * endpoint starts sending a store and a variant id.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { ProductImage } from '@/shared/media';
import { Price, Tag } from '@/shared/ui';

import type { PlusProduct } from '../data/models/plus';

export interface PlusProductCardProps {
  product: PlusProduct;
  /** The chain the row belongs to — the only "where" the API gives us. */
  chainName?: string;
  priority?: boolean;
  className?: string;
}

export function PlusProductCard({
  product,
  chainName,
  priority = false,
  className,
}: PlusProductCardProps) {
  const t = useTranslations('lottery');
  const discounted = product.discountPercent > 0 && product.oldPrice > product.newPrice;

  return (
    <article
      className={cn(
        'flex w-full min-w-0 flex-col gap-3 rounded-card bg-surface p-3',
        className,
      )}
    >
      <div className="relative">
        <ProductImage
          src={product.imageUrl}
          alt=""
          ratio="236/200"
          radius="inner"
          priority={priority}
          className="h-[200px]"
          sizes="(max-width: 767px) 45vw, (max-width: 1199px) 30vw, 269px"
        />
        {discounted ? (
          <Tag className="absolute left-[10px] top-[10px]">{`-${product.discountPercent}%`}</Tag>
        ) : null}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-1 px-1">
        <h3 className="line-clamp-2 text-body font-semibold text-ink">{product.name}</h3>
        <p className="truncate text-caption text-ink2">
          {chainName || t('discounts.chainUnknown')}
        </p>
      </div>

      <div className="flex w-full flex-row items-baseline gap-[6px] px-1 pb-1">
        <Price value={product.newPrice} size="card" />
        {discounted ? <Price value={product.oldPrice} size="sm" strike /> : null}
      </div>
    </article>
  );
}
