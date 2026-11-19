'use client';

/**
 * SC4's loading state — the same recipe as the drawn SC2 skeleton, mirroring this screen's layout:
 * the status card (radius 36), the barcode plate, the dark night-discount block, and the 400-wide
 * categories column with three 60-high row bones.
 *
 * The plate bone is deliberately as tall as the rendered barcode plate so the symbol does not
 * jump into place.
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

export function StudentCardSkeleton() {
  const t = useTranslations('school');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <Bone w="100%" h={128} r="bento" />
        <Bone w="100%" h={260} r="bento" />
        <Bone w="100%" h={150} r="bento" />
      </div>

      <div className="flex w-full flex-col gap-[14px] rounded-xl bg-surface p-6 lg:w-[400px] lg:shrink-0">
        <Bone w={200} h={22} r="xs" />
        <Bone w="100%" h={60} r="lg" />
        <Bone w="100%" h={60} r="lg" />
        <Bone w="100%" h={60} r="lg" />
      </div>
    </Shimmer>
  );
}
