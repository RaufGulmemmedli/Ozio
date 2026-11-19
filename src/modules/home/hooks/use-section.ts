'use client';

/**
 * Shared plumbing for the per-section hooks.
 *
 * Every home region is its own query, so one failing endpoint degrades one card. Two rules are
 * centralised here:
 * - account-bound sections are **disabled** while the visitor is a guest (the request is never
 *   fired), so `/home` as a guest calls only the three guest-safe endpoints;
 * - a guest-reachable section that answers 401 is reported as `needsLogin`, not as an error —
 *   server-side guest acceptance is unverified, so the view shows the login prompt instead of a
 *   red card (home brief).
 */
import { useAuthStatus } from '@/core/session';
import type { Failure } from '@/core/network';

export interface SectionAccess {
  /** There is an account: account-bound sections may run. */
  authenticated: boolean;
  /** Browsing without an account. */
  guest: boolean;
  /** The session is still resolving — keep showing the skeleton, fire nothing. */
  resolving: boolean;
}

export function useSectionAccess(): SectionAccess {
  const status = useAuthStatus();
  return {
    authenticated: status === 'authenticated',
    guest: status === 'guest',
    resolving: status === 'unknown',
  };
}

/** `true` when the failure is really "you are not signed in" rather than a broken endpoint. */
export const isLoginFailure = (failure: Failure | null | undefined): boolean =>
  failure?.kind === 'unauthorized';
