'use client';

/**
 * The suggestion rail under AX3 (`yiDLd` "Populyar məhsullar") and under the empty favourites
 * screen (`CoL5u` "Sənə maraqlı ola bilər"): head 22–26/800 + a brand "Hamısı" link over a 4-up
 * `<ProductCard>` row at gap 20.
 */
import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { ArrowRight } from '@/shared/lucide';
import { ProductGridSkeleton, Shimmer } from '@/shared/skeleton';
// TODO(store): `<ProductCard>` is agent M3's component.
import { ProductCard } from '@/modules/store';

import { useGridCart } from '@/modules/product';

import type { ProductRow } from '../data/store-bridge';

export interface SuggestedRailProps {
  title: string;
  products: readonly ProductRow[];
  loading?: boolean;
  href?: string;
  className?: string;
}

export function SuggestedRail({
  title,
  products,
  loading = false,
  href,
  className,
}: SuggestedRailProps) {
  const t = useTranslations('search');
  const headId = useId();
  const cart = useGridCart();

  if (!loading && products.length === 0) return null;

  return (
    <section
      aria-labelledby={headId}
      className={cn('flex w-full flex-col gap-5', className)}
    >
      <div className="flex w-full flex-row items-center justify-between gap-5">
        <h2 id={headId} className="m-0 text-h4 font-extrabold text-ink md:text-[22px]">
          {title}
        </h2>
        <Link
          href={href ?? paths.market}
          className="flex shrink-0 flex-row items-center gap-1.5 text-label font-bold text-brand hover:text-brand-dark"
        >
          {t('suggested.all')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <Shimmer className="w-full">
          <ProductGridSkeleton cols={4} count={4} />
        </Shimmer>
      ) : (
        <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
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
