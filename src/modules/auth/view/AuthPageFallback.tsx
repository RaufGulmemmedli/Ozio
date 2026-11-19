'use client';

import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

/**
 * Suspense fallback for the auth pages. The views read `?next=` through `useSearchParams`, which
 * needs a boundary while the static shell streams; this mirrors the form column (heading block,
 * `fields` x 56-high fields, a 60-high pill) so the swap does not shift anything.
 */
export function AuthPageFallback({ fields = 1 }: { fields?: number }) {
  const t = useTranslations('common');
  return (
    <Shimmer className="flex w-full flex-col gap-6" label={t('loading')}>
      <div className="flex w-full flex-col gap-2.5">
        <Bone w={220} h={40} r="sm" />
        <Bone w="100%" h={22} r="xs" />
      </div>
      {Array.from({ length: Math.max(fields, 0) }, (_, i) => (
        <Bone key={i} w="100%" h={i === 0 ? 60 : 56} r="md" />
      ))}
      <Bone w="100%" h={60} r="pill" />
    </Shimmer>
  );
}
