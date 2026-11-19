'use client';

/**
 * `navigator.onLine` plus the `online` / `offline` events — drives `<OfflineBanner>` and the
 * `?preview=offline` state.
 *
 * SSR-safe: `true` on the server and in the hydrating render (assume online, so nothing flashes),
 * the real value immediately after.
 *
 * Note what the browser actually tells us: `onLine === false` means "definitely no network";
 * `true` only means an interface is up, not that the API is reachable. A `network` `Failure` from
 * `api()` is the authoritative signal — this hook is for the banner and for not firing doomed
 * requests.
 */
import { useSyncExternalStore } from 'react';

const read = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
};

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}

/** `!useOnline()`, for readability at the call site. */
export const useOffline = (): boolean => !useOnline();

/** Non-hook read. */
export const isOnline = read;
