'use client';

/**
 * Notification preferences — **client-only**.
 *
 * There is NO notification-preferences endpoint anywhere in the API (api/screen-api-matrix.md:
 * "Bildiriş ayarları (PS4) — none, no preferences endpoint (client-only)"). Nothing here is sent
 * to a server and nothing is read back from one; the toggles only decide what this browser asks
 * the Notification API to show. The screen says so in its own copy.
 *
 * TODO(core): `usePrefs()` in `@/core/session/prefs-store` is the right home for these four
 * booleans (`persist` + `skipHydration` is already wired there), but `src/core/**` is owned by the
 * foundation agents. This is the minimal local fallback: same `localStorage`-backed zustand
 * pattern, its own key. When `PrefsState` grows `notify*` fields, delete this file and read
 * `usePrefs()` instead — the component API (`useNotificationPrefs()`) stays identical.
 */
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type NotificationChannel = 'orderStatus' | 'bonus' | 'coupons' | 'lottery';

export interface NotificationPrefsState {
  orderStatus: boolean;
  bonus: boolean;
  coupons: boolean;
  lottery: boolean;
  hydrated: boolean;
  toggle(channel: NotificationChannel, value: boolean): void;
  markHydrated(): void;
}

export const NOTIFY_PREFS_KEY = 'ozio.profile.notify';

/** Defaults mirror the design's drawn state: coupons off, the rest on. */
export const useNotificationPrefs = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      orderStatus: true,
      bonus: true,
      coupons: false,
      lottery: true,
      hydrated: false,
      toggle: (channel, value) => set({ [channel]: value } as Partial<NotificationPrefsState>),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: NOTIFY_PREFS_KEY,
      version: 1,
      // No `window` access during render — the screen rehydrates in an effect.
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        orderStatus: s.orderStatus,
        bonus: s.bonus,
        coupons: s.coupons,
        lottery: s.lottery,
      }),
    },
  ),
);

/** Safe to call twice; a no-op on the server and in private mode. */
export async function rehydrateNotificationPrefs(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await useNotificationPrefs.persist.rehydrate();
  } catch {
    // Disabled storage: the defaults above are fine.
  } finally {
    useNotificationPrefs.getState().markHydrated();
  }
}

export type BrowserPermission = 'unsupported' | 'default' | 'granted' | 'denied';

/** The one *real* control on the screen: the browser's own Notification permission. */
export function readBrowserPermission(): BrowserPermission {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  const state = Notification.permission;
  return state === 'granted' || state === 'denied' ? state : 'default';
}

/* The permission lives in the browser, not in React state, so it is read through
   `useSyncExternalStore`: the server snapshot is `'unsupported'` (no hydration mismatch) and the
   real value arrives in the commit right after hydration. */
const permissionListeners = new Set<() => void>();

function subscribePermission(onChange: () => void): () => void {
  permissionListeners.add(onChange);
  return () => permissionListeners.delete(onChange);
}

const serverPermission = (): BrowserPermission => 'unsupported';

export function useBrowserPermission(): BrowserPermission {
  return useSyncExternalStore(subscribePermission, readBrowserPermission, serverPermission);
}

export async function requestBrowserPermission(): Promise<BrowserPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
  let result: BrowserPermission;
  try {
    const answer = await Notification.requestPermission();
    result = answer === 'granted' || answer === 'denied' ? answer : 'default';
  } catch {
    result = readBrowserPermission();
  }
  for (const listener of permissionListeners) listener();
  return result;
}
