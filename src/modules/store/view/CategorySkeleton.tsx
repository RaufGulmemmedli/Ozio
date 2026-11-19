'use client';

/**
 * `/market/category/[id]` loading state. Mirrors `app-category.html`: breadcrumb, the header
 * title + subtitle bones, the subcategory chip row (`ChipRowSkeleton`, height 40, pill), then the
 * body row at gap 24 — the real 240-wide filter card beside the 3-column grid at gap 20.
 */
import { useTranslations } from 'next-intl';

import {
  Bone,
  BoneCard,
  ChipRowSkeleton,
  ProductGridSkeleton,
  Shimmer,
} from '@/shared/skeleton';

const FILTER_ROW_WIDTHS = [140, 110, 140, 110, 140];

export function CategorySkeleton() {
  const t = useTranslations('store');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8">
      <Bone w={260} h={14} r="xs" />

      <div className="flex flex-col gap-[10px]">
        <Bone w={300} h={40} r={12} />
        <Bone w={260} h={16} r="sm" />
      </div>

      <ChipRowSkeleton count={7} h={40} />

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
        </BoneCard>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex w-full flex-row items-center justify-between gap-4">
            <Bone w={260} h={36} r="pill" />
            <Bone w={220} h={40} r="pill" />
          </div>
          <ProductGridSkeleton cols={3} count={6} />
        </div>
      </div>
    </Shimmer>
  );
}
