/**
 * The browser-side MSW worker.
 *
 * **Never import this module statically from a component.** `msw/browser` has no Node export
 * condition, so a static import would break the server render of any client component that pulls
 * it in. `<MockProvider>` loads it with `await import('./browser')` inside an effect.
 *
 * `NEXT_PUBLIC_MSW`: `mock-modules` (default — only mock-module handlers) | `all` (dev: may also
 * stub real endpoints) | `off` (no mocks at all; mock modules then render `<ErrorState>`).
 */
import { setupWorker, type SetupWorker } from 'msw/browser';
import { handlers, loadMockModules, onMockHandlersChanged } from './index';

export type MswMode = 'mock-modules' | 'all' | 'off';

export const mswMode = (): MswMode => {
  const raw = process.env.NEXT_PUBLIC_MSW;
  return raw === 'off' || raw === 'all' || raw === 'mock-modules' ? raw : 'mock-modules';
};

/** Mocks run only in the browser, and only when not switched off. */
export const mocksEnabled = (): boolean => typeof window !== 'undefined' && mswMode() !== 'off';

/** How long `<MockProvider>` is allowed to wait for the worker before giving up. */
export const MOCK_START_TIMEOUT_MS = 2000;

let worker: SetupWorker | undefined;
let startPromise: Promise<boolean> | undefined;
let unsubscribe: (() => void) | undefined;

export const getMockWorker = (): SetupWorker | undefined => worker;

/**
 * Loads every mock module, then registers and activates the service worker. Idempotent: the work
 * happens once per tab and later callers await the same promise.
 *
 * Resolves `true` when interception is live, `false` when mocks are off or the worker could not
 * start (the app then talks to the BFF as usual and mock modules show their error state).
 */
export async function startMockWorker(): Promise<boolean> {
  if (!mocksEnabled()) return false;
  startPromise ??= (async () => {
    try {
      await loadMockModules();
      worker = setupWorker(...handlers);
      // Modules that register after start (lazy route entry) are pushed into the running worker.
      unsubscribe = onMockHandlersChanged((added) => {
        worker?.use(...added);
      });
      await worker.start({
        serviceWorker: { url: '/mockServiceWorker.js' },
        // Everything that is not a mock path must reach the BFF untouched.
        onUnhandledFrame: 'bypass',
        quiet: true,
      });
      return true;
    } catch (error) {
      unsubscribe?.();
      unsubscribe = undefined;
      worker = undefined;
      // Swallowing this silently cost real debugging time: every mock screen
      // just showed <ErrorState> with no clue why. The most common cause is the
      // environment refusing to register a service worker at all (some embedded
      // browsers do, even when /mockServiceWorker.js serves fine) — in which
      // case the demo modules cannot work there and that is worth saying once.
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[mocks] the MSW service worker did not start; demo modules will show their error state.',
          error,
        );
      }
      return false;
    }
  })();
  return startPromise;
}

export async function stopMockWorker(): Promise<void> {
  unsubscribe?.();
  unsubscribe = undefined;
  await worker?.stop();
  worker = undefined;
  startPromise = undefined;
}
