'use client';

import { useTranslations } from 'next-intl';

import { Bone, Shimmer } from '@/shared/skeleton';

/**
 * Suspense fallback for the onboarding pages (the views read `?step=` / `?next=` through
 * `useSearchParams`). It mirrors the full-bleed centred panel: a 64px tile, a title block and the
 * 60-high pill, so nothing shifts when the real screen mounts.
 */
export function OnboardingFallback() {
  const t = useTranslations('common');
  return (
    <Shimmer
      className="flex min-h-dvh w-full flex-1 flex-col items-center justify-center px-5"
      label={t('loading')}
    >
      <div className="flex w-full max-w-[460px] flex-col gap-6">
        <Bone w={64} h={64} r="pill" />
        <Bone w="80%" h={40} r="sm" />
        <Bone w="100%" h={22} r="xs" />
        <Bone w="100%" h={60} r="pill" />
      </div>
    </Shimmer>
  );
}
