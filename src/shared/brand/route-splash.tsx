'use client';

/**
 * `<RouteSplash>` — the loading animation for every page change, not just document loads.
 *
 * `<BootSplash>` on its own is mounted by a layout, so it plays exactly once per document: a hard
 * refresh showed it, clicking through the app did not, even while the screen sat on skeletons
 * waiting for the API. This watches the route instead of the mount.
 *
 * It is on screen while EITHER is true:
 *
 *  - the minimum window has not elapsed — so a cached page does not flash it for 80 ms, and
 *  - something is still being fetched (`useIsFetching`), which is the "API has not answered yet"
 *    the loading state is actually about.
 *
 * `MAX_VISIBLE_MS` ends it regardless, because a screen that polls or has one slow call must not
 * keep the animation running forever. Nothing here blocks the page: the overlay is transparent
 * and `pointer-events-none`, and the screens keep their own skeletons underneath — this marks the
 * transition, it does not replace the mirror skeletons (BUILD-CONTRACT rule 3).
 */

import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';

import { usePathname } from '@/core/i18n/navigation';

import { BootSplash } from './boot-splash';

/** Below this a transition is instant enough that the animation would only flicker. */
const MIN_VISIBLE_MS = 900;

/** Upper bound, whatever the network is doing. */
const MAX_VISIBLE_MS = 7_000;

export function RouteSplash() {
  const pathname = usePathname();
  const fetching = useIsFetching();

  // `run` counts navigations; it doubles as the key that remounts the animation so it replays.
  const [run, setRun] = useState(0);
  const [routeOf, setRouteOf] = useState(pathname);
  const [active, setActive] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);

  // Adjusting state during render on a changed input — React's documented alternative to an
  // effect for exactly this, and it avoids a frame where the old route's splash is still shown.
  if (routeOf !== pathname) {
    setRouteOf(pathname);
    setRun((n) => n + 1);
    setActive(true);
    setMinElapsed(false);
  }

  useEffect(() => {
    if (!active) return;
    // No reset here: the render-time branch above already cleared `minElapsed` for this run, and
    // a synchronous setState in an effect body is both redundant and an extra render.
    const min = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    const max = setTimeout(() => setActive(false), MAX_VISIBLE_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
    };
    // `run` restarts both timers on each navigation.
  }, [active, run]);

  const settled = minElapsed && fetching === 0;

  useEffect(() => {
    if (!active || !settled) return;
    // One frame of grace so the exit is driven by `ready`, not by the node disappearing.
    const timer = setTimeout(() => setActive(false), 320);
    return () => clearTimeout(timer);
  }, [active, settled]);

  if (!active) return null;

  // `ready` false → the burnout segment loops while the data is in flight.
  return <BootSplash key={run} ready={settled} />;
}
