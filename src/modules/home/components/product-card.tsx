'use client';

/**
 * Product card (`fkAPW`, 263×332 at gap 20).
 *
 * Export: `surface`, `rounded-card` (24), padding 12, gap 12; image 200 high with radius 16 and a
 * yellow "-20%" tag pill (28 high, padding-inline 12, 13/700); name 16/600; meta 13/400 `ink2`;
 * price row space-between with price 20/700 and the 40 brand add circle.
 *
 * The add control is the cart module's `<AddToCartButton>` (M5): at quantity 0 it is that 40px
 * brand circle, and it morphs into the `QuantityStepper` as soon as the line exists. Everything
 * cart-shaped — `POST v2/carts/action`, `requireAuth()`, the grams ↔ kg conversion and the debounce
 * — lives there; this module owns no cart code.
 *
 * Rows with no `storeId` (the `ozio-plus` discount catalogue) have no cart key, so they show no add
 * control at all.
 */
import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n';
import { paths } from '@/core/routes';
import { ProductImage } from '@/shared/media';
import { AddToCartButton } from '@/modules/cart';

import { isCartable, type HomeProduct } from '../data/models';

export interface ProductCardProps {
  product: HomeProduct;
  /** Formatted money, e.g. "3,10 ₼". */
  price: string;
  oldPrice?: string | null;
  /** Out of stock / store closed — the add control renders disabled. */
  addDisabled?: boolean;
  className?: string;
}

export function ProductCard({ product, price, oldPrice, addDisabled = false, className }: ProductCardProps) {
  const meta = [product.unitLabel, product.storeName].filter(Boolean).join(' · ');
  const href = product.variantId !== null ? paths.product(product.variantId) : null;

  const media = (
    <div className="relative w-full">
      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        ratio="236/200"
        radius="inner"
        sizes="(max-width: 767px) 45vw, (max-width: 1199px) 30vw, 263px"
      />
      {product.discountPercent ? (
        <span className="absolute left-2.5 top-2.5 flex h-7 items-center rounded-pill bg-yellow px-3 text-caption font-bold text-on-yellow">
          -{product.discountPercent}%
        </span>
      ) : null}
    </div>
  );

  const info = (
    <div className="flex w-full flex-col gap-1 px-1">
      <span className="line-clamp-2 text-body font-semibold text-ink">{product.name}</span>
      {meta ? <span className="truncate text-caption text-ink2">{meta}</span> : null}
    </div>
  );

  return (
    <article className={cn('flex w-full flex-col gap-3 rounded-card bg-surface p-3', className)}>
      {href ? (
        <Link href={href} className="flex w-full flex-col gap-3">
          {media}
          {info}
        </Link>
      ) : (
        <>
          {media}
          {info}
        </>
      )}

      <div className="flex w-full flex-row items-center justify-between gap-2 px-1 pb-1">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-h4 font-bold text-ink">{price}</span>
          {oldPrice ? (
            <span className="truncate text-micro text-ink3 line-through">{oldPrice}</span>
          ) : null}
        </span>

        {isCartable(product) && product.storeId !== null ? (
          <AddToCartButton
            size="card"
            disabled={addDisabled}
            product={{
              id: product.id,
              storeId: product.storeId,
              name: product.name,
              soldByGram: product.soldByGram,
              stock: product.stock,
            }}
          />
        ) : null}
      </div>
    </article>
  );
}
