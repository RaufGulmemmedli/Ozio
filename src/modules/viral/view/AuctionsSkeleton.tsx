'use client';

/**
 * V5's loading state: three card bones in the loaded grid, at the drawn sizes (80 thumb, a pill,
 * a 22 title bone, a 30 price bone, a meta bone and a 44-high CTA bone).
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

export function AuctionsSkeleton() {
  const t = useTranslations('viral');

  return (
    <Shimmer
      label={t('loading')}
      className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {[0, 1, 2].map((i) => (
        <BoneCard key={i} r="xl" pad={24} gap={16} w="100%">
          <div className="flex w-full flex-row items-start justify-between gap-4">
            <Bone w={80} h={80} r="card" />
            <Bone w={64} h={28} r="pill" />
          </div>
          <Bone w="70%" h={22} r="xs" />
          <Bone w={150} h={30} r={8} />
          <Bone w="85%" h={13} r="xs" />
          <Bone w="100%" h={44} r="pill" />
        </BoneCard>
      ))}
    </Shimmer>
  );
}
