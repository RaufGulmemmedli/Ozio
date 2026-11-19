'use client';

/**
 * "Sənin üçün" grid (`l50w3q`, 382 high) — 4 × 263×332 at gap 20 on the 1440 frame.
 *
 * Columns per the responsive frames: mobile 390 → 2 (the `Products Row 1/2` pair of the
 * mobil-390 export), tablet 768 → 2, 3 from 1024 and 4 from 1200 up, where the sidebar is back.
 * gap 16 below desktop, 20 above.
 */
import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';

import type { HomeProduct } from '../data/models';
import { ProductCard } from './product-card';

export interface ProductGridProps {
  products: readonly HomeProduct[];
  /** 4 on home, 3 on the offers page. */
  cols?: 3 | 4;
  className?: string;
}

export function ProductGrid({ products, cols = 4, className }: ProductGridProps) {
  const { money } = useFormat();

  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5',
        cols === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3',
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={`${product.id}-${product.variantId ?? 'plus'}`}
          product={product}
          price={money(product.price)}
          oldPrice={product.oldPrice === null ? null : money(product.oldPrice)}
        />
      ))}
    </div>
  );
}
