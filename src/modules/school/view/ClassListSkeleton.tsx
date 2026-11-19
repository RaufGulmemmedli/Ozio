'use client';

/**
 * SC3's loading state. The screen spec says the pages without a drawn `-skeleton` frame "follow
 * the same recipe", so this mirrors the loaded layout exactly: a 36-radius panel bone with the
 * dark header's height plus four row bones, and a 380-wide summary bone.
 *
 * Static chrome (header, "Demo rejim", the "Siyahı yarat" action) stays real.
 */
import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

export function ClassListSkeleton() {
  const t = useTranslations('school');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-0 overflow-hidden rounded-bento bg-surface">
        <Bone w="100%" h={168} r="bento" />
        <div className="flex w-full flex-col gap-0 px-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex h-[84px] w-full flex-row items-center gap-4">
              <Bone w={48} h={48} r="md" />
              <Bone w="40%" h={16} r="xs" />
              <span className="flex-1" />
              <Bone w={72} h={28} r="pill" />
              <Bone w={64} h={18} r="xs" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-[380px] lg:shrink-0">
        <Bone w="100%" h={300} r="bento" />
      </div>
    </Shimmer>
  );
}
