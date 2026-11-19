'use client';

/**
 * `/market` loading state — the drawn truth is `app-states/app-market-loading.html`.
 *
 * Mirrors the loaded layout exactly: header bones 36×126 + 16×300 at gap 10, a 140-high banner
 * tint at radius 28, then the catalog row at gap 24 — the **real** 240-wide filter card (its
 * chrome is not shimmered: `surface`, radius 24, padding 22, gap 18) beside the 3-column grid at
 * gap 20 with 332-high cards.
 */
import { useTranslations } from 'next-intl';

import {
  Bone,
  BoneCard,
  BannerSkeleton,
  ProductGridSkeleton,
  Shimmer,
} from '@/shared/skeleton';

const FILTER_ROW_WIDTHS = [140, 110, 140, 110, 140, 110, 140];

export function MarketSkeleton() {
  const t = useTranslations('store');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex flex-col gap-[10px]">
          <Bone w={126} h={36} r={12} />
          <Bone w={300} h={16} r="sm" />
        </div>
      </div>

      <BannerSkeleton h={140} r="xl" />

      <div className="flex w-full flex-row items-start gap-6">
        <BoneCard
          bordered={false}
          r="card"
          pad={22}
          gap={18}
          w={240}
          className="hidden shrink-0 lg:flex"
        >
          <Bone w={80} h={18} r="sm" />
          {FILTER_ROW_WIDTHS.map((width, index) => (
            <div key={index} className="flex w-full flex-row items-center gap-3">
              <Bone w={20} h={20} r="xs" />
              <Bone w={width} h={14} r="sm" />
            </div>
          ))}
          <Bone w={90} h={18} r="sm" />
          <Bone w={196} h={14} r="sm" />
          <Bone w={196} h={14} r="sm" />
        </BoneCard>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex w-full flex-row items-center justify-between gap-4">
            <Bone w={320} h={40} r="pill" />
            <Bone w={150} h={40} r="pill" />
          </div>
          <ProductGridSkeleton cols={3} count={6} />
        </div>
      </div>
    </Shimmer>
  );
}
