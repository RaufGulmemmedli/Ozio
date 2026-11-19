'use client';

/**
 * "Bənzər məhsullar" (`LcZls`): head 26/800 with a brand "Hamısı" link, then a 4-up row of
 * `<ProductCard>`s at gap 20 — 2-up at 768, 2-up at 390, exactly like `ProductGridSkeleton`.
 *
 * The cards come from `@/modules/store`; this module never draws its own product card.
 */
import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ArrowRight } from '@/shared/lucide';
import { ProductGridSkeleton, Shimmer } from '@/shared/skeleton';
// TODO(store): `<ProductCard>` is agent M3's component (src/modules/store/components/product-card.tsx).
import { ProductCard } from '@/modules/store';

import { useGridCart } from '../hooks/use-grid-cart';
import type { ProductRow } from '../data/store-bridge';

export interface SimilarRailProps {
  title: string;
  products: readonly ProductRow[];
  loading?: boolean;
  /** `/market/category/[id]` when the product has a category, `/market` otherwise. */
  allHref?: string;
  emptyLabel?: string;
  className?: string;
}

export function SimilarRail({
  title,
  products,
  loading = false,
  allHref,
  emptyLabel,
  className,
}: SimilarRailProps) {
  const t = useTranslations('product');
  const headId = useId();
  const cart = useGridCart();
  const href = allHref ?? paths.market;

  if (!loading && products.length === 0 && !emptyLabel) return null;

  return (
    <section aria-labelledby={headId} className={cn('flex w-full flex-col gap-5', className)}>
      <div className="flex w-full flex-row items-center justify-between gap-5">
        <h2 id={headId} className="m-0 text-h3 font-extrabold text-ink md:text-[26px]">
          {title}
        </h2>
        <Link
          href={href}
          className="flex shrink-0 flex-row items-center gap-1.5 text-body-sm font-bold text-brand hover:text-brand-dark"
        >
          {t('similar.all')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <Shimmer>
          <ProductGridSkeleton cols={4} count={4} />
        </Shimmer>
      ) : products.length === 0 ? (
        <p className="m-0 text-body text-ink2">{emptyLabel}</p>
      ) : (
        <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard
              key={`${product.storeId}-${product.id}`}
              product={product}
              quantity={cart.quantityOf(product)}
              onQuantityChange={(next) => cart.setQuantity(product, next)}
              step={cart.stepOf(product)}
              busy={cart.pending}
            />
          ))}
        </div>
      )}
    </section>
  );
}
