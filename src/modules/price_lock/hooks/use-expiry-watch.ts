'use client';

/**
 * `useExpiryWatch(instants, onElapsed)` — fires once when the **earliest** of the supplied
 * instants passes while the screen is open.
 *
 * price_lock has no ticking countdown (the cards read in whole days), but it still must not lie:
 * when a lock's window or the guarantee's window elapses on screen, this calls back and the view
 * refetches, so the card settles into the state the **source** then reports (`expired`) instead of
 * the client deciding.
 *
 * Every instant comes from the source (`expiresAt` / `endsAt`); nothing is timed from mount, and
 * the clock is only read inside the effect.
 */
import { useEffect, useMemo, useRef } from 'react';

/** `setTimeout` tops out around 24.8 days; longer waits are re-armed in chunks. */
const MAX_DELAY = 86_400_000;

export function useExpiryWatch(
  instants: ReadonlyArray<string | null | undefined>,
  onElapsed?: () => void,
): void {
  // A stable primitive the effect can depend on, so a new array identity each render is harmless.
  const key = useMemo(() => instants.filter((iso): iso is string => Boolean(iso)).join('|'), [
    instants,
  ]);

  const callback = useRef(onElapsed);
  useEffect(() => {
    callback.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    if (!key) return;
    // Only instants still ahead of us are watched: one that already passed before this screen
    // opened is the source's business (it serves the row as `expired`), not a reason to refetch.
    const times = key
      .split('|')
      .map((iso) => Date.parse(iso))
      .filter((t) => Number.isFinite(t) && t > Date.now());
    if (times.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let fired = false;

    const arm = () => {
      const now = Date.now();
      const future = times.filter((t) => t > now);
      if (future.length === 0) {
        if (!fired) {
          fired = true;
          callback.current?.();
        }
        return;
      }
      const remaining = Math.min(...future) - now;
      timer = setTimeout(arm, Math.min(remaining, MAX_DELAY));
    };

    arm();
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [key]);
}
