'use client';

/**
 * The resend countdown under the OTP field.
 *
 * `RESEND_COOLDOWN_SECONDS` (59 s) is a **client-side** rule — Flutter's `AuthCubit.resendCooldown`
 * — because the server documents no resend limit. When the server *does* send a `Retry-After`,
 * that value wins (03-auth-session.md: "disables resend until `Retry-After`").
 *
 * The timer is wall-clock based (an end timestamp, not a decrementing counter), so a backgrounded
 * tab does not drift.
 */
import { useCallback, useEffect, useState } from 'react';

import { RESEND_COOLDOWN_SECONDS } from '../auth.constants';

export interface Cooldown {
  /** Whole seconds left; `0` when the action is available. */
  remaining: number;
  active: boolean;
  /** `m:ss`, e.g. `0:24` / `14:32`. */
  label: string;
  /** Starts (or restarts) the countdown. Defaults to the 59 s client cooldown. */
  start(seconds?: number): void;
  reset(): void;
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function useResendCooldown(initialSeconds = 0): Cooldown {
  const [endsAt, setEndsAt] = useState<number | null>(() =>
    initialSeconds > 0 ? Date.now() + initialSeconds * 1000 : null,
  );
  // The clock the countdown is read against. Only the interval below (and `start`, which has a
  // fresh reading anyway) ever moves it, so nothing is copied into state during render or
  // synchronously inside the effect.
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;
    const timer = setInterval(() => {
      const at = Date.now();
      setNow(at);
      // Past the end: drop the deadline, which also stops this interval.
      if (at >= endsAt) setEndsAt(null);
    }, 500);
    return () => clearInterval(timer);
  }, [endsAt]);

  // Derived from the deadline, never decremented: a backgrounded tab cannot drift.
  const remaining = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));

  const start = useCallback((seconds: number = RESEND_COOLDOWN_SECONDS) => {
    const safe = Math.max(0, Math.ceil(seconds));
    const at = Date.now();
    // Same reading for both, so the first rendered value is exactly `safe`.
    setNow(at);
    setEndsAt(safe > 0 ? at + safe * 1000 : null);
  }, []);

  const reset = useCallback(() => setEndsAt(null), []);

  return { remaining, active: remaining > 0, label: formatCountdown(remaining), start, reset };
}
