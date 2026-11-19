'use client';

/**
 * The mirror skeleton for `/topup/cashier`.
 *
 * `topup-cashier.html` has no drawn `-loading` variant; the screen spec's skeleton column says
 * "bone for barcode card + steps", so this mirrors the loaded layout: the barcode card (a real
 * `surface` card with a head row, a 200-high plate bone and the number/holder lines) beside the
 * 420-wide side column (the steps card and the nearby-markets card).
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

export function TopupCashierSkeleton() {
  const t = useTranslations('topup');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 lg:gap-8">
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <BoneCard r="xl" pad={32} gap={20} bordered={false} className="min-w-0 flex-1">
          <div className="flex w-full flex-row items-center justify-between">
            <Bone w={90} h={14} r="md" />
            <Bone w={120} h={18} r="md" />
          </div>
          <Bone w="100%" h={200} r="lg" />
          <Bone w={260} h={22} r="md" />
          <Bone w={110} h={14} r="md" />
        </BoneCard>

        <div className="flex w-full flex-col gap-6 lg:w-[420px] lg:shrink-0">
          <BoneCard r="xl" pad={28} gap={18} bordered={false}>
            <Bone w={140} h={22} r="md" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex w-full flex-row items-center gap-[14px]">
                <Bone w={32} h={32} r="pill" />
                <Bone w="min(260px, 100%)" h={16} r="md" />
              </div>
            ))}
          </BoneCard>

          <BoneCard r="xl" pad={28} gap={14} bordered={false}>
            <Bone w={170} h={22} r="md" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex w-full flex-row items-center justify-between gap-3">
                <Bone w="min(200px, 60%)" h={16} r="md" />
                <Bone w={56} h={14} r="md" />
              </div>
            ))}
          </BoneCard>
        </div>
      </div>
    </Shimmer>
  );
}
