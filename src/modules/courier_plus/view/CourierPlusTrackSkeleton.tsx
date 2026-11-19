'use client';

/**
 * Loading state for `/courier-plus/track/[id]`.
 *
 * The track screen has no `-yuklenir` export (screens/mock-parcel-courier.md: "courier_plus
 * track/earnings/hub-register skeletons — use the same card-bone patterns"), so it mirrors the
 * loaded layout with the bone sizes the other `courier_plus` skeletons use: the map block, four
 * stepper rows, the dark pay card and the primary button.
 */
import { useTranslations } from 'next-intl';

import { Bone, MapSkeleton, Shimmer } from '@/shared/skeleton';

import { CP_BONE_ON_DARK } from './CourierPlusHomeSkeleton';

export function CourierPlusTrackSkeleton() {
  const t = useTranslations('courier_plus');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <MapSkeleton h={320} r="xl" />

        <div className="flex w-full flex-col items-start gap-4 rounded-xl bg-surface p-6">
          <Bone w={160} h={22} r={11} />
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex w-full flex-row items-center gap-4">
              <Bone w={36} h={36} r="pill" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Bone w={200} h={15} r={8} />
                <Bone w={140} h={13} r="xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 lg:w-[400px] lg:shrink-0">
        <div className="flex w-full flex-col items-start gap-3 rounded-bento bg-block p-7 md:p-8">
          <Bone w={80} h={14} r={7} style={CP_BONE_ON_DARK} />
          <Bone w={180} h={48} r="md" style={CP_BONE_ON_DARK} />
          <div className="flex flex-row flex-wrap gap-2">
            <Bone w={90} h={28} r="md" style={CP_BONE_ON_DARK} />
            <Bone w={60} h={28} r="md" style={CP_BONE_ON_DARK} />
            <Bone w={60} h={28} r="md" style={CP_BONE_ON_DARK} />
          </div>
        </div>
        <Bone w="100%" h={56} r="pill" />
      </div>
    </Shimmer>
  );
}
