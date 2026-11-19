'use client';

/**
 * V3's loading state (the gift catalogue is a read, so the form has one).
 *
 * Mirrors the loaded layout: the white form card with five pick bones, a chip row and two field
 * bones, next to the 400-wide dark preview column. `FormSkeleton` and `ChipRowSkeleton` from
 * `@/shared/skeleton` supply the field and chip bones so the sizes match every other form in the
 * app.
 */
import { useTranslations } from 'next-intl';

import { Bone, BoneTint, ChipRowSkeleton, FormSkeleton, Shimmer } from '@/shared/skeleton';

export function WishlistNewSkeleton() {
  const t = useTranslations('viral');

  return (
    <Shimmer label={t('loading')} className="flex w-full flex-col gap-8 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6 rounded-xl bg-surface p-6 lg:p-8">
        <Bone w={160} h={18} r="xs" />
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Bone key={i} w="100%" h={84} r="card" />
          ))}
        </div>

        <span aria-hidden="true" className="h-px w-full bg-line" />

        <Bone w={140} h={18} r="xs" />
        <ChipRowSkeleton count={3} />

        <span aria-hidden="true" className="h-px w-full bg-line" />

        <FormSkeleton fields={2} cols={2} submit={false} />
      </div>

      <div className="w-full lg:w-[400px] lg:shrink-0">
        <BoneTint tone="block" r="bento" w="100%" h={480} />
      </div>
    </Shimmer>
  );
}
