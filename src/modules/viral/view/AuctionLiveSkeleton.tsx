'use client';

/**
 * V6's loading state. The screen spec puts this page on the same recipe as the drawn skeletons, so
 * it mirrors the loaded layout: the dark price block (a tinted block whose fill stays outside the
 * shimmer, with bones on top) next to the 420-wide stock card, then the bid-log rows.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, BoneTint, Shimmer } from '@/shared/skeleton';

export function AuctionLiveSkeleton() {
  const t = useTranslations('viral');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col gap-8 lg:flex-row">
        <BoneTint tone="block" r="bento" w="100%" h={320} className="min-w-0 flex-1">
          <div className="flex h-full w-full flex-col justify-center gap-4 p-7 lg:p-10">
            <Bone w={96} h={28} r="pill" tone="white" className="opacity-20" />
            <Bone w={180} h={16} r="xs" tone="white" className="opacity-20" />
            <Bone w={320} h={72} r={12} tone="white" className="opacity-20" />
            <Bone w={260} h={16} r="xs" tone="white" className="opacity-20" />
          </div>
        </BoneTint>

        <BoneCard r="xl" pad={28} gap={18} w="100%" className="lg:w-[420px] lg:shrink-0">
          <Bone w={60} h={14} r="xs" />
          <Bone w={180} h={22} r="xs" />
          <Bone w="100%" h={14} r="sm" />
          <Bone w="100%" h={32} r="xs" />
          <Bone w="100%" h={52} r="pill" />
        </BoneCard>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-6">
        <Bone w={160} h={22} r="xs" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex w-full flex-row items-center gap-[14px]">
            <Bone w={40} h={40} r="lg" />
            <Bone w="100%" h={16} r="xs" className="min-w-0 flex-1" />
            <Bone w={64} h={16} r="xs" />
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
