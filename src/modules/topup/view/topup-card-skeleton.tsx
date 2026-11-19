'use client';

/**
 * The mirror skeleton for `/topup/card` — drawn in `topup-card-loading.html`.
 *
 * Export composition, reproduced exactly: back link + 36/800 heading stay real; the amount card is
 * a real `surface` card (radius 28, padding 28, gap 18) holding an 80×14 label bone, a full-width
 * 84-high field bone at radius 20 and five 84×44 pill chip bones; the cards card holds a 120×14
 * label bone and three full-width 68-high row bones at radius 20; the summary column is 380 wide
 * with an 80×22 title bone, three 140/70 row bones and a full-width 56 pill CTA bone.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

export function TopupCardSkeleton() {
  const t = useTranslations('topup');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 lg:gap-8">
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-6">
          {/* Amount card */}
          <BoneCard r="xl" pad={28} gap={18} bordered={false}>
            <Bone w={80} h={14} r="md" />
            <Bone w="100%" h={84} r="lg" />
            <div className="flex w-full flex-row flex-wrap gap-[10px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <Bone key={i} w={84} h={44} r="pill" />
              ))}
            </div>
          </BoneCard>

          {/* Saved cards card */}
          <BoneCard r="xl" pad={28} gap={14} bordered={false}>
            <Bone w={120} h={14} r="md" />
            {[0, 1, 2].map((i) => (
              <Bone key={i} w="100%" h={68} r="lg" />
            ))}
          </BoneCard>
        </div>

        {/* Summary */}
        <BoneCard r="xl" pad={28} gap={18} bordered={false} className="lg:w-[380px]" w="100%">
          <Bone w={80} h={22} r="md" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex w-full flex-row items-start justify-between">
              <Bone w={140} h={16} r="md" />
              <Bone w={70} h={16} r="md" />
            </div>
          ))}
          <Bone w="100%" h={56} r="pill" />
        </BoneCard>
      </div>
    </Shimmer>
  );
}
