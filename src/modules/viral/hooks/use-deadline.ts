'use client';

/**
 * A countdown toward an instant **the server supplied**.
 *
 * TODO(core): `@/core/query` has no deadline helper and `@/core/i18n`'s `relative()` formats a
 * distance without ticking. The school module carries the same local copy; if a shared hook lands,
 * delete both.
 *
 * This is the hook that keeps the auction honest, so the rules it encodes matter:
 *
 * - the target is an ISO string from the mock (`ends_at`, `next_drop_at`), never
 *   `Date.now() + duration` captured at mount. A remount, a reload or a second tab therefore all
 *   agree on when the run ends;
 * - when the deadline passes, `onElapsed` fires **once** so the caller can refetch. The UI learns
 *   the next price — or that the run is over — from the server rather than deriving it.
 */
import { useEffect, useRef, useState } from 'react';

export interface Deadline {
  /** Milliseconds left, clamped at 0. `null` when there is no target. */
  msLeft: number | null;
  /** Whole seconds left, clamped at 0. `null` when there is no target. */
  secondsLeft: number | null;
  /** `true` once the target is in the past (and `false` while there is no target). */
  elapsed: boolean;
}

export interface UseDeadlineOptions {
  /** Fired once, the first time the target passes while the component is mounted. */
  onElapsed?: () => void;
  /** Tick interval in ms. Default 1000. */
  intervalMs?: number;
  /** Set to `false` to freeze the ticker. */
  enabled?: boolean;
}

export function useDeadline(target: string | null, options: UseDeadlineOptions = {}): Deadline {
  const { onElapsed, intervalMs = 1000, enabled = true } = options;

  const targetMs = target ? Date.parse(target) : Number.NaN;
  const hasTarget = Number.isFinite(targetMs);

  const [now, setNow] = useState<number>(() => Date.now());

  const elapsedRef = useRef(false);

  // The callback is kept in a ref so a new closure identity does not restart the interval. The
  // write happens in an effect, never during render.
  const onElapsedRef = useRef(onElapsed);
  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  // A new target re-arms the one-shot below.
  useEffect(() => {
    elapsedRef.current = false;
  }, [targetMs]);

  useEffect(() => {
    if (!enabled || !hasTarget) return;
    // No `setNow` here: `now` is initialised at mount and the interval keeps it current, so the
    // effect only has to own the timer.
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, hasTarget, intervalMs, targetMs]);

  const msLeft = hasTarget ? Math.max(0, targetMs - now) : null;

  useEffect(() => {
    if (!hasTarget || msLeft === null || msLeft > 0 || elapsedRef.current) return;
    elapsedRef.current = true;
    onElapsedRef.current?.();
  }, [hasTarget, msLeft]);

  return {
    msLeft,
    secondsLeft: msLeft === null ? null : Math.ceil(msLeft / 1000),
    elapsed: hasTarget && msLeft === 0,
  };
}

/** `3725` → `"01:02:05"`, `125` → `"02:05"`. Pure formatting of a server-derived number. */
export function formatCountdown(secondsLeft: number | null): string {
  if (secondsLeft === null) return '';
  const total = Math.max(0, secondsLeft);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
