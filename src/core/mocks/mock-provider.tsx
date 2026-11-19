'use client';

/**
 * Starts the MSW service worker in the browser and tells screens when interception is live.
 *
 * No-ops on the server and when `NEXT_PUBLIC_MSW=off`.
 *
 * The worker is kicked off at **module scope**, i.e. as soon as this client chunk is evaluated —
 * before React hydrates, and well before any query fires from an effect. That is how mock requests
 * are intercepted from the very first one without `<MockProvider>` having to withhold the whole app
 * from the first paint (withholding it would mean the server rendered children and the client
 * rendered nothing: a hydration mismatch on every page, and a blank first paint for real-API
 * screens that do not need mocks at all).
 *
 * Screens that must not fetch before the worker is up wrap their data region in `<MockGate>`, or
 * read `useMocksReady()`. Readiness is capped at ~2 s: if the worker cannot start, the app carries
 * on and mock modules render their error state.
 *
 * `msw/browser` is imported dynamically: it has no Node export condition, so a static import would
 * break the server render of this client component.
 */
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

const MOCKS_CONFIGURED = process.env.NEXT_PUBLIC_MSW !== 'off';
const START_TIMEOUT_MS = 2000;

/* --------------------------------------------------------------- readiness store */

let ready = !MOCKS_CONFIGURED;
const listeners = new Set<() => void>();

function markReady(): void {
  if (ready) return;
  ready = true;
  for (const fn of listeners) fn();
}

const subscribe = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const getSnapshot = (): boolean => ready;
/** SSR and the hydrating render both see `true`, so the server and client markup agree. */
const getServerSnapshot = (): boolean => true;

let booted = false;

function bootMocks(): void {
  if (booted) return;
  booted = true;
  if (!MOCKS_CONFIGURED || typeof window === 'undefined') {
    markReady();
    return;
  }
  const cap = setTimeout(markReady, START_TIMEOUT_MS);
  void (async () => {
    try {
      const { startMockWorker } = await import('./browser');
      await startMockWorker();
    } catch {
      // mocks unavailable — mock modules will show their error state
    } finally {
      clearTimeout(cap);
      markReady();
    }
  })();
}

// Start as early as the chunk is parsed in the browser.
if (typeof window !== 'undefined') bootMocks();

/* --------------------------------------------------------------- React surface */

const MockReadyContext = createContext<boolean>(true);

export function useMocksReady(): boolean {
  const fromStore = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // The context exists so a subtree can be told "mocks are not coming" without the store.
  const fromContext = useContext(MockReadyContext);
  return fromStore && fromContext;
}

export interface MockProviderProps {
  children: ReactNode;
  /**
   * Withhold `children` until the worker is up. Off by default — see the note above. Only turn it
   * on for a tree that is entirely mock-driven.
   */
  block?: boolean;
  /** What to render while blocking. */
  fallback?: ReactNode;
}

export function MockProvider({ children, block = false, fallback = null }: MockProviderProps) {
  const mocksReady = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <MockReadyContext.Provider value={mocksReady}>
      {block && !mocksReady ? fallback : children}
    </MockReadyContext.Provider>
  );
}

/**
 * Holds a mock screen's data region back until interception is live, so the very first request
 * cannot escape to the network.
 *
 * ```tsx
 * <MockGate fallback={<ParcelSkeleton />}>
 *   <ParcelList />
 * </MockGate>
 * ```
 */
export function MockGate({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const mocksReady = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <>{mocksReady ? children : fallback}</>;
}
