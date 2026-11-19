'use client';

/**
 * `Yolüstü kuryer · Əsas · Yüklənir` (`A2IO80`), bone for bone.
 *
 * The chrome stays real (banner, page header, the dark hero's fill, the yellow card's fill, the
 * three card shells) and only the data bones sweep — one `<Shimmer>` for the whole screen, same
 * containers / gaps / columns as the loaded view so nothing shifts.
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

/** `#FFFFFF1F` on the dark hero / `#1111111F` on the yellow card, expressed through tokens. */
export const CP_BONE_ON_DARK = {
  backgroundColor: 'color-mix(in srgb, var(--oz-white) 12%, transparent)',
} as const;
export const CP_BONE_ON_YELLOW = {
  backgroundColor: 'color-mix(in srgb, var(--oz-on-yellow) 12%, transparent)',
} as const;

export function CourierPlusHomeSkeleton({ hasActiveDelivery = true }: { hasActiveDelivery?: boolean }) {
  const t = useTranslations('courier_plus');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-6 lg:gap-8">
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="flex w-full flex-col items-start gap-4 rounded-bento bg-block p-7 md:p-10">
          <Bone w={60} h={14} r={7} style={CP_BONE_ON_DARK} />
          <Bone w={220} h={64} r="md" style={CP_BONE_ON_DARK} />
          <Bone w={280} h={16} r={8} style={CP_BONE_ON_DARK} />
          <Bone w={240} h={56} r="pill" style={CP_BONE_ON_DARK} />
        </div>

        {hasActiveDelivery ? (
          <div className="flex w-full flex-col items-start gap-3.5 rounded-bento bg-yellow p-8 lg:w-[420px] lg:shrink-0">
            <Bone w={120} h={12} r="xs" style={CP_BONE_ON_YELLOW} />
            <Bone w={260} h={22} r={11} style={CP_BONE_ON_YELLOW} />
            <Bone w={220} h={14} r={7} style={CP_BONE_ON_YELLOW} />
            <Bone w="100%" h={44} r="pill" style={CP_BONE_ON_YELLOW} />
          </div>
        ) : null}
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div key={card} className="flex w-full flex-col items-start gap-4 rounded-xl bg-surface p-6">
            <Bone w={140} h={22} r={11} />
            <Bone w="100%" h={16} r={8} />
            <Bone w="100%" h={16} r={8} />
            <Bone w="100%" h={16} r={8} />
            <Bone w="100%" h={16} r={8} />
            <Bone w="100%" h={48} r="pill" />
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
