'use client';

/**
 * `Yolüstü kuryer · Anbar · Yüklənir` (`kWPz7`), bone for bone: the four stat tiles (the first one
 * dark, with translucent bones) and four waiting-parcel rows. The page header and the "Açıqdır"
 * pill are real chrome in the export, so they are not shimmered here either — they stay in the
 * view above this block.
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

import { CP_BONE_ON_DARK } from './CourierPlusHomeSkeleton';

export function CourierPlusHubSkeleton({ rows = 4 }: { rows?: number }) {
  const t = useTranslations('courier_plus');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 lg:gap-8">
      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((tile) => (
          <div
            key={tile}
            className={
              tile === 0
                ? 'flex w-full flex-col items-start gap-2 rounded-xl bg-block p-6'
                : 'flex w-full flex-col items-start gap-2 rounded-xl bg-surface p-6'
            }
          >
            <Bone w={100} h={12} r="xs" style={tile === 0 ? CP_BONE_ON_DARK : undefined} />
            <Bone w={100} h={32} r="md" style={tile === 0 ? CP_BONE_ON_DARK : undefined} />
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-0 rounded-xl bg-surface px-6 pb-2 pt-6">
        <Bone w={200} h={22} r={11} className="mb-4" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex w-full flex-row items-center gap-4 py-4">
            <Bone w={44} h={44} r="md" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Bone w={120} h={14} r={7} />
              <Bone w={160} h={12} r="xs" />
            </div>
            <Bone w={50} h={14} r={7} />
            <Bone w={140} h={44} r="pill" />
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
