'use client';

/**
 * Mirror skeleton for `/orders/[id]`: the detail header bones (the title IS data here), then the
 * same two columns — the items card with five 64px rows and the timeline card on the left, the
 * totals card and the info rows on the right (400 wide).
 */
import { useTranslations } from 'next-intl';
import { Bone, BoneCard, DetailHeaderSkeleton, Shimmer, SummaryCardSkeleton } from '@/shared/skeleton';

export function OrderDetailSkeleton() {
  const t = useTranslations('orders');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6">
      <DetailHeaderSkeleton action titleW={300} subtitleW={360} />

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <BoneCard r="xl" pad={28} gap={16}>
            <Bone w={160} h={24} r="sm" />
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="flex w-full items-center gap-[18px] py-2">
                <Bone w={64} h={64} r={16} />
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <Bone w={index % 2 === 0 ? 170 : 130} h={16} r="sm" />
                  <Bone w={110} h={12} r="xs" />
                </div>
                <Bone w={64} h={14} r="xs" />
                <Bone w={80} h={18} r="sm" />
              </div>
            ))}
          </BoneCard>

          <BoneCard r="xl" pad={28} gap={18}>
            <Bone w={190} h={24} r="sm" />
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex w-full items-center gap-4">
                <Bone w={28} h={28} r="pill" />
                <Bone w={index % 2 === 0 ? 200 : 160} h={14} r="xs" />
              </div>
            ))}
          </BoneCard>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[400px]">
          <SummaryCardSkeleton rows={3} cta={false} />
          <BoneCard r="xl" pad={28} gap={20}>
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex w-full items-center gap-[14px]">
                <Bone w={44} h={44} r="pill" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Bone w={90} h={12} r="xs" />
                  <Bone w={180} h={14} r="xs" />
                </div>
              </div>
            ))}
          </BoneCard>
          <Bone w="100%" h={52} r="pill" />
        </div>
      </div>
    </Shimmer>
  );
}
