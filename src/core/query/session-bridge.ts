'use client';

/**
 * Glue between `<Providers>` and `@/core/session`, kept in one file so the provider stays readable.
 *
 *   `applyInitialSession`  seeds the store with what the server layout already resolved, during the
 *                          first render, so the app never paints a guest shell for a signed-in user
 *   `rehydratePrefs`       reads the persisted locale / theme / city / address back
 *   `installSessionExpiredBridge`  wires `api()`'s 401 + `x-ozio-session: expired` signal to the
 *                          session-expired dialog; returns its own disposer
 */
import {
  installSessionExpiredBridge,
  rehydratePrefs,
  setInitialSession,
  type InitialSession,
} from '@/core/session';

export type { InitialSession };
export { installSessionExpiredBridge, rehydratePrefs };

/**
 * Seeds the session store. A no-op when the server passed nothing, and the store itself ignores it
 * once a live answer has arrived, so calling it during render is safe.
 */
export function applyInitialSession(initial: InitialSession): void {
  if (initial.status === undefined && initial.user === undefined) return;
  setInitialSession(initial);
}
