'use client';

/**
 * The mirror skeleton for `/market/product/[id]`.
 *
 * `GallerySkeleton` is already shaped for this screen (540 gallery + 532 info column, stacking at
 * the same width as the loaded layout), so the only extra bones are the breadcrumb, the tab rule
 * and the similar rail. The section headings are **not** shimmered — "Bənzər məhsullar" does not
 * depend on data.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import {
  Bone,
  ChipRowSkeleton,
  GallerySkeleton,
  ProductGridSkeleton,
  Shimmer,
} from '@/shared/skeleton';

export function ProductSkeleton({
  compact = false,
  className,
}: {
  /** Quick view: no breadcrumb, no similar rail. */
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations('common');

  return (
    <Shimmer label={t('loading')} className={cn('flex w-full flex-col gap-8', className)}>
      {compact ? null : <Bone w={260} h={14} r="xs" />}

      <GallerySkeleton thumbs={4} />

      {compact ? null : (
        <>
          <div className="flex w-full flex-col gap-6">
            <ChipRowSkeleton count={3} h={20} />
            <div className="h-px w-full bg-line" />
            <Bone w="100%" h={72} r="sm" className="max-w-[640px]" />
          </div>

          <div className="flex w-full flex-col gap-5">
            <Bone w={220} h={26} r="sm" />
            <ProductGridSkeleton cols={4} count={4} />
          </div>
        </>
      )}
    </Shimmer>
  );
}
