'use client';

/**
 * `Yolüstü kuryer · Bağlamalar · Yüklənir` (`rap6H`), bone for bone: three `Skeleton Match`
 * cards next to the route-summary card, in the same two-column grid as the loaded view.
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

function MatchBones() {
  return (
    <div className="flex w-full flex-col items-stretch gap-5 rounded-xl bg-surface p-6 lg:flex-row lg:items-center">
      <div className="flex shrink-0 flex-col gap-1.5 lg:w-[104px]">
        <Bone w={80} h={26} r={13} />
        <Bone w={50} h={12} r="xs" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          {[0, 1].map((place) => (
            <div key={place} className="flex min-w-0 flex-1 flex-row items-center gap-3">
              <Bone w={48} h={48} r={16} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Bone w="100%" h={16} r={8} />
                <Bone w={80} h={12} r="xs" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-row flex-wrap items-center gap-2">
          <Bone w={90} h={28} r="md" />
          <Bone w={60} h={28} r="md" />
          <Bone w={60} h={28} r="md" />
        </div>
      </div>

      <Bone w={100} h={48} r="pill" className="shrink-0" />
    </div>
  );
}

/** The route-summary card's bones (`Route Summary` in `rap6H`). */
export function CpRouteSummaryBones() {
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-xl bg-surface p-6 lg:w-[360px] lg:shrink-0">
      <Bone w={120} h={22} r={11} />
      {[0, 1, 2, 3].map((row) => (
        <Bone key={row} w="100%" h={16} r={8} />
      ))}
      <Bone w="100%" h={48} r="pill" />
    </div>
  );
}

export function CourierPlusMatchesSkeleton({ rows = 3 }: { rows?: number }) {
  const t = useTranslations('courier_plus');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {Array.from({ length: rows }, (_, i) => (
          <MatchBones key={i} />
        ))}
      </div>
      <CpRouteSummaryBones />
    </Shimmer>
  );
}
