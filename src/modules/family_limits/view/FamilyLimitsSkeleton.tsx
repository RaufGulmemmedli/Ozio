'use client';

/**
 * Mirror skeleton for `/family-limits` (`limits-list-skeleton.html`, node `Dj7Wz`).
 *
 * Per the drawn composition: a 110-high strip bone at radius 28, then three member cards, each a
 * 52 circle, two text bones, a 160×28 amount bone, the 10px bar and a 110×14 line. The page
 * header and the demo notice above stay real; the grid columns and gaps match the loaded view.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

const CARDS = [0, 1, 2] as const;

export function FamilyLimitsSkeleton() {
  const tc = useTranslations('common');

  return (
    <Shimmer label={tc('loading')} className="flex w-full flex-col gap-8">
      <Bone w="100%" h={110} r="xl" tone="surface2" />

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <BoneCard key={card} r="xl" pad={28} gap={16}>
            <div className="flex w-full flex-row items-center gap-[14px]">
              <Bone w={52} h={52} r="pill" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Bone w={96} h={18} r="xs" />
                <Bone w={128} h={14} r="xs" />
              </div>
            </div>
            <Bone w={160} h={28} r="sm" />
            <Bone w="100%" h={10} r={5} />
            <Bone w={110} h={14} r="xs" />
          </BoneCard>
        ))}
      </div>
    </Shimmer>
  );
}
