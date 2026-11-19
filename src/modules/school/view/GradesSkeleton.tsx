'use client';

/**
 * SC2's loading state, mirroring `sc2-school-grades-skeleton.html` bone for bone:
 *
 * left column — 190 hero (radius 36), 112 dropzone (radius 28), a 180×24 heading bone and three
 * 76-high row bones (radius 24); right column (400 wide) — a 150×24 heading bone and three
 * 130-high card bones (radius 28). Same `flex-row gap-8` body and same column widths as the
 * loaded view, so the layout does not shift.
 *
 * The export also draws bones for the page title and subtitle; per hard rule 3 the page header is
 * static chrome here (the title is not data), so it stays real and un-shimmered.
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

export function GradesSkeleton() {
  const t = useTranslations('school');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <Bone w="100%" h={190} r="bento" />
        <Bone w="100%" h={112} r="xl" />
        <Bone w={180} h={24} r="xs" />
        <Bone w="100%" h={76} r="card" />
        <Bone w="100%" h={76} r="card" />
        <Bone w="100%" h={76} r="card" />
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:shrink-0">
        <Bone w={150} h={24} r="xs" />
        <Bone w="100%" h={130} r="xl" />
        <Bone w="100%" h={130} r="xl" />
        <Bone w="100%" h={130} r="xl" />
      </div>
    </Shimmer>
  );
}
