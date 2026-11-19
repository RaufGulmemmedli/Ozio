'use client';

/**
 * `/market/store/[id]` loading state. Mirrors `app-store.html`: breadcrumb line, the 260-high
 * store hero at radius 36, the chip row with its sort trigger, the section head and the 4-column
 * product grid at gap 20. Static chrome (the breadcrumb separators, the section title) is not
 * shimmered — only the bones sweep.
 */
import { useTranslations } from 'next-intl';

import {
  Bone,
  BannerSkeleton,
  ProductGridSkeleton,
  SectionHeaderSkeleton,
  Shimmer,
} from '@/shared/skeleton';

export function StoreSkeleton() {
  const t = useTranslations('store');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8">
      <Bone w={240} h={14} r="xs" />

      <BannerSkeleton h={260} r="bento" />

      <div className="flex w-full flex-row items-center justify-between gap-4">
        <Bone w={420} h={40} r="pill" />
        <Bone w={150} h={40} r="pill" />
      </div>

      <SectionHeaderSkeleton titleW={200} />

      <ProductGridSkeleton cols={4} count={8} />
    </Shimmer>
  );
}
