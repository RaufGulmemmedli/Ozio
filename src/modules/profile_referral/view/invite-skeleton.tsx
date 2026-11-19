'use client';

/**
 * The mirror skeleton for `/invite` — drawn in `referral-loading.html`.
 *
 * Export composition: back link and 36/800 heading stay real, the subtitle and the demo notice are
 * dropped; the main column gets a full-width 230-high bone at radius 36 (the code hero), three
 * step-card bones (a real `surface` card at radius 24 / padding 24 / gap 14, each with a 48 disc
 * bone and 18-high full-width + 120-wide text bones), and the invited card is a 380-wide `surface`
 * card holding a title bone and three avatar + two-line rows.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

export function InviteSkeleton() {
  const t = useTranslations('referral');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 lg:gap-8">
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-6">
          <Bone w="100%" h={230} r="bento" />

          <div className="flex w-full flex-col gap-4 md:flex-row">
            {[0, 1, 2].map((i) => (
              <BoneCard key={i} r="card" pad={24} gap={14} bordered={false} className="min-w-0 flex-1">
                <Bone w={48} h={48} r="pill" />
                <Bone w="100%" h={18} r="md" />
                <Bone w={120} h={18} r="md" />
              </BoneCard>
            ))}
          </div>
        </div>

        <BoneCard r="xl" pad={28} gap={16} bordered={false} className="lg:w-[380px]" w="100%">
          <div className="flex w-full flex-row items-center justify-between">
            <Bone w={150} h={22} r="md" />
            <Bone w={20} h={22} r="md" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex w-full flex-row items-center gap-3">
              <Bone w={44} h={44} r="pill" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Bone w={110} h={15} r="md" />
                <Bone w={90} h={13} r="md" />
              </div>
            </div>
          ))}
        </BoneCard>
      </div>
    </Shimmer>
  );
}
