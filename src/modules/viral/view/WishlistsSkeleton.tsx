'use client';

/**
 * V2's loading state. The screen spec says "Skeleton: card bones", and the pages without a drawn
 * `-skeleton` frame follow the SC2/V4 recipe, so this is four card bones in the loaded grid.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

export function WishlistsSkeleton() {
  const t = useTranslations('viral');

  return (
    <Shimmer label={t('loading')} className="grid w-full grid-cols-1 gap-5 xl:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <BoneCard key={i} r="xl" pad={24} gap={16} w="100%">
          <div className="flex w-full flex-row items-start gap-4">
            <Bone w={80} h={80} r="card" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Bone w="70%" h={20} r="xs" />
              <Bone w="45%" h={13} r="xs" />
            </div>
            <Bone w={56} h={28} r="pill" />
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-3">
            <Bone w={120} h={16} r="xs" />
            <Bone w={96} h={13} r="xs" />
          </div>
          <Bone w="100%" h={10} r="sm" />
        </BoneCard>
      ))}
    </Shimmer>
  );
}
