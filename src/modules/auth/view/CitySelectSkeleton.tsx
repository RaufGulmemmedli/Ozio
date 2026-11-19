'use client';

import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

/**
 * Mirror skeleton for `/city-select`: the search field (56 high, radius 14), the "detect my
 * location" row (56) and six city rows (64 high, radius 14) in the same 2-column grid with the
 * same 10px gaps, so nothing shifts when the list arrives.
 *
 * The back link, title and subtitle are static chrome and stay real (architecture/05 §2).
 */
export function CitySelectSkeleton({ rows = 6 }: { rows?: number }) {
  const t = useTranslations('common');
  return (
    <Shimmer className="flex w-full flex-col gap-5" label={t('loading')}>
      <Bone w="100%" h={56} r="md" />
      <Bone w="100%" h={56} r="md" />
      <div className="grid w-full grid-cols-1 gap-[10px] md:grid-cols-2">
        {Array.from({ length: Math.max(rows, 0) }, (_, i) => (
          <Bone key={i} w="100%" h={64} r="md" />
        ))}
      </div>
      <Bone w="100%" h={60} r="pill" />
    </Shimmer>
  );
}
