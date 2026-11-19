'use client';

/**
 * The wall clock, read the same way every other external source in this app is read — through
 * `useSyncExternalStore` (see `@/core/lib/use-online`). A render must never call `Date.now()`
 * itself: the result would change between two renders of the same commit.
 *
 * One 1 s interval is shared by every subscriber, so a page with a countdown and a timeline does
 * not run two timers, and both agree on "now" within the same render.
 *
 * The server snapshot is `0` — "the clock has not been read yet". Callers treat `0` as "fall back
 * to the instant the server gave me", which keeps the static HTML and the hydrating render
 * identical; the real reading arrives in the commit right after hydration.
 *
 * TODO(core): this belongs next to `use-online.ts` in `@/core/lib`, but modules may not write
 * there — it is module-private until a foundation agent lifts it.
 */
import { useSyncExternalStore } from 'react';

/** Milliseconds, or `0` before the first subscriber started the interval. */
let current = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

const TICK_MS = 1000;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (timer === undefined) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      for (const listener of listeners) listener();
    }, TICK_MS);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const read = (): number => current;
const serverRead = (): number => 0;

/** The shared clock, ticking once a second. `0` until the first commit after hydration. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, read, serverRead);
}
