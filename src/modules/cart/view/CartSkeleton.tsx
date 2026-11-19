'use client';

/**
 * The `/cart` loading state — the mirror skeleton of `CartView`.
 *
 * Same container sizes, same gaps, same two-column split, so nothing shifts when the data lands:
 * a flexible item column of `CartRowSkeleton`s inside the real `surface` panel, beside the
 * 420-wide `SummaryCardSkeleton`.
 *
 * The page title is static chrome and is **not** shimmered, and there is exactly one `<Shimmer>`
 * root (BUILD-CONTRACT rule 3). The line under the title is data ("3 mağazadan 6 məhsul"), so it
 * simply is not drawn yet — the header keeps its height either way.
 */
import { useTranslations } from 'next-intl';

import { CartRowSkeleton, Shimmer, SummaryCardSkeleton } from '@/shared/skeleton';

export function CartSkeleton({ rows = 4 }: { rows?: number }) {
  const t = useTranslations('cart');
  const tc = useTranslations('common');

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex min-h-[68px] flex-col gap-1.5">
        <h1 className="text-h1-app font-extrabold text-ink">{t('title')}</h1>
      </header>

      <Shimmer className="flex w-full flex-col gap-6 lg:flex-row lg:items-start" label={tc('loading')}>
        <div className="flex w-full min-w-0 flex-1 flex-col rounded-xl bg-surface px-7 py-2">
          {Array.from({ length: rows }, (_, index) => (
            <CartRowSkeleton key={index} index={index} />
          ))}
        </div>
        <div className="w-full lg:w-[420px] lg:shrink-0">
          <SummaryCardSkeleton rows={4} />
        </div>
      </Shimmer>
    </div>
  );
}
