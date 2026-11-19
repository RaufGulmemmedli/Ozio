'use client';

/**
 * The countdown every group_buy screen renders.
 *
 * **It is derived from the instant the source supplied** (`deal.closesAt`), never from a timer
 * started at mount: remounting, reloading or leaving the tab asleep for an hour all give the same
 * answer, because the answer is `closesAt − now`.
 *
 * When the window elapses while the screen is open, `onElapsed` fires **once** and the caller
 * refetches. The hook never decides that a deal is expired — only the source does
 * (`deal.expired`), so a group that filled in time does not flip to "vaxtı bitdi" on a client
 * clock that runs a few seconds fast.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

export interface Countdown {
  /** Milliseconds left, floored at 0. */
  remainingMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** `remainingMs === 0`. */
  elapsed: boolean;
  /** No instant was supplied, so there is nothing to count. */
  unknown: boolean;
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function split(remainingMs: number): Countdown {
  const ms = Math.max(0, remainingMs);
  return {
    remainingMs: ms,
    days: Math.floor(ms / DAY),
    hours: Math.floor((ms % DAY) / HOUR),
    minutes: Math.floor((ms % HOUR) / MINUTE),
    seconds: Math.floor((ms % MINUTE) / 1000),
    elapsed: ms === 0,
    unknown: false,
  };
}

const NO_COUNTDOWN: Countdown = {
  remainingMs: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  elapsed: false,
  unknown: true,
};

/**
 * How often to re-read the clock: once a second only in the last minute, so a grid of deal cards
 * is not re-rendered 60 times a minute for text that changes once.
 */
function tickFor(remainingMs: number): number {
  if (remainingMs < MINUTE) return 1000;
  if (remainingMs < HOUR) return 15_000;
  return 30_000;
}

export function useCountdown(endsAt: string | null | undefined, onElapsed?: () => void): Countdown {
  const target = useMemo(() => {
    const parsed = endsAt ? Date.parse(endsAt) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [endsAt]);

  // `null` means "no clock read yet" (the server render), not "already over".
  const [now, setNow] = useState<number | null>(null);

  const elapsedCallback = useRef(onElapsed);
  useEffect(() => {
    elapsedCallback.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    if (target === null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let fired = false;

    const run = () => {
      const current = Date.now();
      setNow(current);
      const remaining = target - current;
      if (remaining <= 0) {
        if (!fired) {
          fired = true;
          elapsedCallback.current?.();
        }
        return;
      }
      timer = setTimeout(run, Math.min(tickFor(remaining), remaining));
    };

    run();
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [target]);

  return useMemo(() => {
    if (target === null || now === null) return NO_COUNTDOWN;
    return split(target - now);
  }, [target, now]);
}
