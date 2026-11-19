'use client';

/**
 * Loading state for `/courier-plus/earnings`.
 *
 * No `-yuklenir` export exists for this screen (screens/mock-parcel-courier.md lists the
 * courier_plus earnings skeleton as "not designed — same card-bone patterns"), so it mirrors the
 * loaded layout: the dark hero with its three white tiles, then four history rows.
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

import { CP_BONE_ON_DARK } from './CourierPlusHomeSkeleton';

export function CourierPlusEarningsSkeleton({ rows = 4 }: { rows?: number }) {
  const t = useTranslations('courier_plus');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 lg:gap-8">
      <div className="flex w-full flex-col items-start gap-3 rounded-bento bg-block p-7 md:p-10">
        <Bone w={60} h={14} r={7} style={CP_BONE_ON_DARK} />
        <Bone w={220} h={64} r="md" style={CP_BONE_ON_DARK} />
        <div className="flex w-full flex-col gap-3">
          {[0, 1, 2].map((tile) => (
            <div
              key={tile}
              className="flex w-full flex-row items-center justify-between gap-4 rounded-card bg-surface px-6 py-4"
            >
              <Bone w={100} h={14} r="xs" />
              <Bone w={90} h={24} r={8} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col rounded-xl bg-surface px-6 py-2">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex w-full flex-row items-center gap-4 py-4">
            <Bone w={44} h={44} r="md" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Bone w={200} h={15} r={8} />
              <Bone w={80} h={13} r="xs" />
            </div>
            <Bone w={70} h={16} r={8} />
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
