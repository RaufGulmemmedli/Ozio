'use client';

/**
 * The mirror skeleton for `/topup` — drawn in `topup-method-loading.html`.
 *
 * The export keeps the back link and the 36/800 heading **real** (static chrome is never
 * shimmered) and drops the subtitle and the demo notice; the body becomes a 180×24 section-title
 * bone, two method-row bones (a 64 disc plus 200×20 and 320×14 lines inside a real `surface` card)
 * and the balance block as a `surface` card holding 110×14, 190×44 and 220×34 bones.
 *
 * Same container widths, gaps and columns as the loaded view, so nothing shifts.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneCard, Shimmer } from '@/shared/skeleton';

export function TopupMethodSkeleton() {
  const t = useTranslations('topup');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 lg:gap-8">
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
          <Bone w={180} h={24} r="md" />
          {[0, 1].map((i) => (
            <BoneCard key={i} r="xl" pad={28} gap={20} row bordered={false}>
              <Bone w={64} h={64} r="pill" />
              <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
                <Bone w={200} h={20} r="md" />
                <Bone w="min(320px, 100%)" h={14} r="md" />
              </div>
            </BoneCard>
          ))}
        </div>

        {/* The loaded block is a dark `block` card; its skeleton is drawn as a plain surface card
            with bones on top (the export's `Balance Skeleton`), so the fill never shimmers. */}
        <BoneCard r="xl" pad={28} gap={16} bordered={false} className="lg:w-[380px]" w="100%">
          <Bone w={110} h={14} r="md" />
          <Bone w={190} h={44} r="md" />
          <Bone w={220} h={34} r="pill" />
        </BoneCard>
      </div>
    </Shimmer>
  );
}
