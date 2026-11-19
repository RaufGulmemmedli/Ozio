'use client';

/**
 * Mirror skeleton for `/ask-to-buy/send` (`ask-send.html` loading state).
 *
 * Per the spec's skeleton composition: two 80-high parent tiles in the same two-column grid, a
 * 120-high note bone, then the 400-wide summary card with three row bones, a total bone and a
 * 52-high button bone. The page header and the demo notice stay real above it.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

export function AskSendSkeleton() {
  const tc = useTranslations('common');

  return (
    <Shimmer label={tc('loading')} className="flex w-full flex-col items-start gap-8 lg:flex-row">
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
        <BoneCard r="xl" pad={28} gap={18}>
          <Bone w={200} h={20} r="sm" />
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <Bone w="100%" h={80} r="lg" />
            <Bone w="100%" h={80} r="lg" />
          </div>
        </BoneCard>

        <BoneCard r="xl" pad={28} gap={18}>
          <Bone w={220} h={20} r="sm" />
          <Bone w="100%" h={120} r="md" />
          <Bone w={64} h={13} r="xs" />
        </BoneCard>
      </div>

      <BoneCard r="xl" pad={28} gap={16} className="w-full shrink-0 lg:w-[400px]">
        <Bone w={100} h={20} r="sm" />
        <Bone w="100%" h={15} r="xs" />
        <Bone w="100%" h={15} r="xs" />
        <Bone w="100%" h={15} r="xs" />
        <div className="h-px w-full bg-line" />
        <Bone w={160} h={28} r="sm" />
        <Bone w="100%" h={52} r="pill" />
      </BoneCard>
    </Shimmer>
  );
}
