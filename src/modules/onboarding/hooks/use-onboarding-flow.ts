'use client';

/**
 * Where the onboarding steps go next, and the `?next=` carrier.
 *
 * `withNext` is deliberately a local copy of the auth module's helper rather than an import from
 * `@/modules/auth`: pulling that barrel in would drag the whole login/OTP/registration bundle
 * into the splash and permission routes, which are the first paint of a cold visit.
 */
import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { paths, safeNext } from '@/core/routes';
import { usePrefs, useSession } from '@/core/session';

/** Appends `?next=<encoded>` when there is a safe destination to carry. */
export function withNext(path: string, next: string | null | undefined): string {
  if (!next) return path;
  const resolved = safeNext(next, '');
  if (!resolved) return path;
  return `${path}${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(resolved)}`;
}

export interface OnboardingFlow {
  next: string | null;
  /** Step 2/3 → step 3/3. */
  afterNotifications(): string;
  /** Step 3/3 is `/welcome`; a guest has no welcome screen, so they go straight through. */
  afterLocation(): string;
  /** End of the flow. */
  final(): string;
  /** Where `/splash` hands off to. */
  bootstrap(): string;
}

export function useOnboardingFlow(): OnboardingFlow {
  const search = useSearchParams();
  const raw = search.get('next');
  const next = raw ? safeNext(raw, '') || null : null;

  const status = useSession((s) => s.status);
  const onboardingSeen = usePrefs((s) => s.onboardingSeen);

  const final = useCallback(() => safeNext(next), [next]);

  const afterNotifications = useCallback(
    () => withNext(paths.permissionLocation, next),
    [next],
  );

  const afterLocation = useCallback(
    () => (status === 'authenticated' ? withNext(paths.welcome, next) : safeNext(next)),
    [next, status],
  );

  const bootstrap = useCallback(() => {
    if (!onboardingSeen) return withNext(paths.onboardingStep(1), next);
    if (status === 'authenticated') return safeNext(next);
    return next ? paths.loginNext(next) : paths.login;
  }, [next, onboardingSeen, status]);

  return { next, afterNotifications, afterLocation, final, bootstrap };
}
