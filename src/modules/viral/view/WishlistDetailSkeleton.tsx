'use client';

/**
 * V4's loading state, mirroring `v4-viral-campaign-detail-skeleton.html` bone for bone:
 *
 * left column — a white hero panel (radius 28, padding 36, gap 36) holding a **180×180 circle
 * bone** for the progress ring plus a column of 260×40, 360×16, 100 %×12 and 150×52 bones; then a
 * white contributors panel (radius 28, padding 28, gap 16) with a 160×22 heading bone and three
 * rows of 40×40 + a flexible 16 + 60×16; right column — a single 380×260 bone (radius 28) for the
 * share card.
 *
 * The page header's bones from the export are omitted on purpose: the title there is the product
 * name, which *is* data — but hard rule 3 keeps the page header real, and `<PageHeader>` renders
 * the single `h1`, so the view passes the product name once it has it and shows the subtitle
 * placeholder meanwhile.
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

export function WishlistDetailSkeleton() {
  const t = useTranslations('viral');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex w-full flex-col items-start gap-9 rounded-xl bg-surface p-9 lg:flex-row lg:items-center">
          <Bone w={180} h={180} r={90} />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Bone w={260} h={40} r={10} />
            <Bone w={360} h={16} r="xs" />
            <Bone w="100%" h={12} r={6} />
            <Bone w={150} h={52} r={26} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 rounded-xl bg-surface p-7">
          <Bone w={160} h={22} r="xs" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex w-full flex-row items-center gap-[14px]">
              <Bone w={40} h={40} r="lg" />
              <Bone w="100%" h={16} r="xs" className="min-w-0 flex-1" />
              <Bone w={60} h={16} r="xs" />
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-[380px] lg:shrink-0">
        <Bone w="100%" h={260} r="xl" />
      </div>
    </Shimmer>
  );
}
