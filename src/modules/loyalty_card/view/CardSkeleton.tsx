'use client';

/**
 * The `/card` loading state — `html/app-states/app-kart-loading.html` is the
 * drawn truth.
 *
 * Measured there: Content gap 32; the header's two bones (240x36 r12, 300x16
 * r8) with gap 10; the row gap 24; the left column 560 wide holding the card
 * bone (100% x 340, r28) and the barcode plate (white, r28, padding 28, gap 16)
 * with a 110-high bone and a 160x14 bone; the right column `flex: 1` holding a
 * white panel (r28, padding 28, gap 18) with a 160x20 bone and five `Tx Row`s
 * (44 circle + 170x14 / 100x11 + 70x16, gap 14, text gap 8).
 *
 * One `<Shimmer>` root; the card's `brand` fill comes from `<BoneTint>` inside
 * `<OzioCardSkeleton>`, which keeps the fill **outside** the sweep so only the
 * bones on top move. The container sizes, gaps and columns mirror the loaded
 * view exactly, so nothing shifts when the data lands.
 *
 * The page title and subtitle are real chrome and are **not** shimmered — they
 * come from `<PageHeader>` in the view, above this skeleton.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import {
  Bone,
  OzioCardSkeleton,
  Shimmer,
  TransactionRowSkeleton,
} from '@/shared/skeleton';

export interface CardSkeletonProps {
  rows?: number;
  className?: string;
}

export function CardSkeleton({ rows = 5, className }: CardSkeletonProps) {
  const t = useTranslations('loyalty_card');

  return (
    <Shimmer
      label={t('loading')}
      className={cn('flex w-full flex-col gap-6 xl:flex-row', className)}
    >
      <div className="flex w-full flex-col gap-5 xl:w-[560px] xl:shrink-0">
        {/* `brand` fill, outside the sweep. */}
        <OzioCardSkeleton tone="brand" w="100%" h={340} />

        <div className="flex w-full flex-col items-center gap-4 rounded-xl bg-white p-7">
          <Bone w="100%" h={110} r={16} tone="surface2" />
          <Bone w={160} h={14} r="xs" tone="surface2" />
        </div>

        <div className="flex w-full flex-row gap-3">
          <Bone w="100%" h={52} r="pill" />
          <Bone w="100%" h={52} r="pill" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-7">
          <Bone w={160} h={20} r="sm" />
          <Bone w="100%" h={10} r={5} />
          <Bone w={240} h={14} r="xs" />
        </div>

        <div className="flex w-full flex-col gap-[18px] rounded-xl border border-line bg-surface p-7">
          <Bone w={160} h={20} r="sm" />
          {Array.from({ length: rows }, (_, index) => (
            <TransactionRowSkeleton key={index} index={index} />
          ))}
        </div>
      </div>
    </Shimmer>
  );
}
