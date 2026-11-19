'use client';

/**
 * Mirror skeleton for `/orders/[id]/track`: the header bones, then the big map tint (flex-1, 640
 * high, r32) beside the 440 column — status card, courier card and the items card.
 * No pins move while loading (`MapSkeleton` is a tint block, not a bone).
 */
import { useTranslations } from 'next-intl';
import { Bone, BoneCard, MapSkeleton, Shimmer } from '@/shared/skeleton';

export function OrderTrackingSkeleton() {
  const t = useTranslations('orders');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col gap-2.5">
        <Bone w={230} h={36} r={12} />
        <Bone w={320} h={16} r="sm" />
      </div>

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <MapSkeleton h={640} r="modal" />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-5 lg:w-[440px]">
          <BoneCard r="xl" pad={28} gap={16}>
            <Bone w={170} h={20} r="sm" />
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex w-full items-center gap-4">
                <Bone w={28} h={28} r="pill" />
                <Bone w={index % 2 === 0 ? 180 : 140} h={14} r="xs" />
              </div>
            ))}
          </BoneCard>

          <BoneCard r="xl" pad={20} gap={14} row>
            <Bone w={56} h={56} r="pill" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Bone w={120} h={16} r="sm" />
              <Bone w={90} h={12} r="xs" />
            </div>
            <Bone w={48} h={48} r="pill" />
            <Bone w={48} h={48} r="pill" />
          </BoneCard>

          <BoneCard r="xl" pad={24} gap={14}>
            <div className="flex w-full items-center justify-between">
              <Bone w={130} h={17} r="sm" />
              <Bone w={80} h={17} r="sm" />
            </div>
            <div className="flex w-full items-center gap-2">
              {[0, 1, 2, 3, 4].map((index) => (
                <Bone key={index} w={56} h={56} r={14} />
              ))}
            </div>
          </BoneCard>
        </div>
      </div>
    </Shimmer>
  );
}
