'use client';

/**
 * Where the flow goes next (03-auth-session.md "Login flow").
 *
 * ```
 * /otp  ├─ needsRegistration → /register
 *       ├─ no city selected  → /city-select
 *       └─ → safeNext(next) || /home        (first time: the onboarding steps, then /welcome)
 * ```
 *
 * `next` is always validated with `safeNext` (same-origin path allow-list) and is carried along
 * the intermediate steps as a query parameter so the user lands where they were headed.
 */
import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { usePrefs } from '@/core/session';
import { paths, safeNext } from '@/core/routes';

/** Appends `?next=<encoded>` when there is a safe destination to carry. */
export function withNext(path: string, next: string | null | undefined): string {
  if (!next) return path;
  const resolved = safeNext(next, '');
  if (!resolved) return path;
  return `${path}${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(resolved)}`;
}

export interface AuthDestinations {
  /** The raw, already-validated `next` (or `null`). */
  next: string | null;
  /** Right after a verified OTP. */
  afterOtp(needsRegistration: boolean): string;
  /** Right after `complete_registration`. */
  afterRegistration(): string;
  /** Right after a city has been picked and persisted. */
  afterCity(): string;
  /** The end of the flow: the caller's destination, or `/home`. */
  final(): string;
}

export function useAuthDestination(): AuthDestinations {
  const search = useSearchParams();
  const raw = search.get('next');
  const next = raw ? safeNext(raw, '') || null : null;

  const cityId = usePrefs((s) => s.cityId);
  const onboardingSeen = usePrefs((s) => s.onboardingSeen);

  const final = useCallback(() => safeNext(next), [next]);

  const afterCity = useCallback(
    // First run through: the 3-step onboarding (permissions 2/3, welcome 3/3).
    () => (onboardingSeen ? safeNext(next) : withNext(paths.permissionNotifications, next)),
    [next, onboardingSeen],
  );

  const afterRegistration = useCallback(
    () => (cityId === null ? withNext(paths.citySelect, next) : afterCity()),
    [afterCity, cityId, next],
  );

  const afterOtp = useCallback(
    (needsRegistration: boolean) =>
      needsRegistration ? withNext(paths.register, next) : afterRegistration(),
    [afterRegistration, next],
  );

  return { next, afterOtp, afterRegistration, afterCity, final };
}
