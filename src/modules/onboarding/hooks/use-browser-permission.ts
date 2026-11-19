'use client';

/**
 * The permission screens are **explainers around the real browser APIs**
 * (`Notification.requestPermission()`, `navigator.geolocation`) — there is no backend for either
 * (`screens/auth.md` §/icazeler: "browser APIs, no API").
 *
 * Rules this hook enforces:
 *  - `unsupported` when the API is missing (older browsers, non-secure origins, some in-app
 *    webviews) — the row is then hidden, never broken;
 *  - `denied` is terminal in the browser: the only remedy is the site settings, so the UI shows a
 *    hint instead of asking again;
 *  - it **never blocks**: every path resolves, and `continue` stays available throughout.
 *
 * Nothing is persisted here — the browser owns the permission; `usePrefs().onboardingSeen` only
 * records that the step was shown.
 */
import { useCallback, useState, useSyncExternalStore } from 'react';

export type PermissionState = 'unknown' | 'unsupported' | 'prompt' | 'granted' | 'denied';

export interface BrowserPermission {
  state: PermissionState;
  pending: boolean;
  /** Runs the real browser prompt. Safe to call when `state` is anything but `prompt`. */
  request(): Promise<PermissionState>;
}

const isSupported = {
  notifications: () => typeof window !== 'undefined' && 'Notification' in window,
  location: () => typeof navigator !== 'undefined' && 'geolocation' in navigator,
};

function notificationState(): PermissionState {
  if (!isSupported.notifications()) return 'unsupported';
  const current = Notification.permission;
  return current === 'granted' ? 'granted' : current === 'denied' ? 'denied' : 'prompt';
}

const fromPermissionName = (name: string): PermissionState =>
  name === 'granted' ? 'granted' : name === 'denied' ? 'denied' : 'prompt';

/* The permission lives in the browser, not in React state, so it is read through
   `useSyncExternalStore`: the server snapshot is `'unknown'` (no hydration mismatch, nothing to
   sync in an effect) and the real value arrives in the commit right after hydration. The browser
   fires no event for `Notification.permission`, so the only thing that can move it is our own
   prompt — which tells the subscribers itself. */
const notificationListeners = new Set<() => void>();

function subscribeNotification(onChange: () => void): () => void {
  notificationListeners.add(onChange);
  return () => {
    notificationListeners.delete(onChange);
  };
}

const unknownState = (): PermissionState => 'unknown';

/** `Notification.requestPermission()`. Resolves even when the browser throws. */
export function useNotificationPermission(): BrowserPermission {
  const state = useSyncExternalStore(subscribeNotification, notificationState, unknownState);
  const [pending, setPending] = useState(false);

  const request = useCallback(async (): Promise<PermissionState> => {
    if (!isSupported.notifications()) return 'unsupported';
    setPending(true);
    try {
      const result = await Notification.requestPermission();
      return fromPermissionName(result);
    } catch {
      // Safari < 16 used the callback form and can throw on the promise form.
      return notificationState();
    } finally {
      setPending(false);
      // `Notification.permission` has moved; re-read it everywhere.
      for (const listener of notificationListeners) listener();
    }
  }, []);

  return { state, pending, request };
}

/**
 * `navigator.geolocation.getCurrentPosition` — the only way to trigger the location prompt.
 * `navigator.permissions` is consulted first (where available) so an already-answered permission
 * does not re-prompt.
 */
/* `navigator.permissions.query` is asynchronous, so the browser's answer is cached in this one
   module-level cell and `useSyncExternalStore` reads it synchronously. The probe is kicked off by
   `subscribe` — i.e. after the commit, never during render — and de-duplicated while in flight, so
   N rows asking at once cost one query. */
let locationCache: PermissionState = 'unknown';
let locationProbe: Promise<void> | null = null;
const locationListeners = new Set<() => void>();

function publishLocation(next: PermissionState): void {
  if (locationCache === next) return;
  locationCache = next;
  for (const listener of locationListeners) listener();
}

async function readLocationPermission(): Promise<PermissionState> {
  if (!isSupported.location()) return 'unsupported';
  const permissions = typeof navigator !== 'undefined' ? navigator.permissions : undefined;
  if (!permissions || typeof permissions.query !== 'function') return 'prompt';
  try {
    const status = await permissions.query({ name: 'geolocation' });
    return fromPermissionName(status.state);
  } catch {
    return 'prompt';
  }
}

function probeLocation(): void {
  locationProbe ??= readLocationPermission()
    .then(publishLocation)
    .finally(() => {
      locationProbe = null;
    });
}

function subscribeLocation(onChange: () => void): () => void {
  locationListeners.add(onChange);
  probeLocation();
  return () => {
    locationListeners.delete(onChange);
  };
}

const readLocationCache = (): PermissionState => locationCache;

export function useLocationPermission(): BrowserPermission {
  const state = useSyncExternalStore(subscribeLocation, readLocationCache, unknownState);
  const [pending, setPending] = useState(false);

  const request = useCallback(
    () =>
      new Promise<PermissionState>((resolve) => {
        if (!isSupported.location()) {
          publishLocation('unsupported');
          resolve('unsupported');
          return;
        }
        setPending(true);
        navigator.geolocation.getCurrentPosition(
          () => {
            setPending(false);
            publishLocation('granted');
            resolve('granted');
          },
          (error) => {
            setPending(false);
            // 1 = PERMISSION_DENIED; a timeout or a position error is not a denial.
            const next: PermissionState = error.code === 1 ? 'denied' : 'prompt';
            publishLocation(next);
            resolve(next);
          },
          { timeout: 10_000, maximumAge: 300_000 },
        );
      }),
    [],
  );

  return { state, pending, request };
}
