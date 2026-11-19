/**
 * Persisted client preferences (`localStorage` key `ozio.prefs`).
 *
 * SSR-safe by construction: `persist` runs with `skipHydration: true`, so nothing touches
 * `window` during render. The root client provider calls `rehydratePrefs()` in an effect, which
 * keeps the server and the first client render identical (no hydration mismatch).
 *
 * These are *preferences*, not session data: nothing here is trusted for auth, and sign-out
 * clears only the per-user parts (see `clearUserPrefs`).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LocalePref = 'az' | 'ru' | 'en';
export type ThemePref = 'light' | 'dark' | 'system';

const RECENT_SEARCH_LIMIT = 10;

export interface PrefsState {
  /** Chosen UI language; `null` = follow the `NEXT_LOCALE` cookie / `Accept-Language`. */
  locale: LocalePref | null;
  themePref: ThemePref;
  /** `v1/location/cities` id picked on `/city-select`. */
  cityId: number | null;
  /** `v1/profile/address` id of the delivery address shown in the header chip. */
  selectedAddressId: number | null;
  onboardingSeen: boolean;
  /** Most recent search terms, newest first, capped at 10. */
  recentSearches: string[];
  /** Mirror of the httpOnly `ozio_dt` device token — diagnostics only, never sent as auth. */
  deviceTokenMirror: string | null;

  setLocale(locale: LocalePref | null): void;
  setThemePref(pref: ThemePref): void;
  setCityId(cityId: number | null): void;
  setSelectedAddressId(id: number | null): void;
  setOnboardingSeen(seen: boolean): void;
  addRecentSearch(term: string): void;
  removeRecentSearch(term: string): void;
  clearRecentSearches(): void;
  setDeviceTokenMirror(token: string | null): void;
  /** Drop everything that belongs to the signed-in account (run on sign-out). */
  clearUserPrefs(): void;
}

export const PREFS_STORAGE_KEY = 'ozio.prefs';

export const usePrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      locale: null,
      themePref: 'system',
      cityId: null,
      selectedAddressId: null,
      onboardingSeen: false,
      recentSearches: [],
      deviceTokenMirror: null,

      setLocale: (locale) => set({ locale }),
      setThemePref: (themePref) => set({ themePref }),
      setCityId: (cityId) => set({ cityId }),
      setSelectedAddressId: (selectedAddressId) => set({ selectedAddressId }),
      setOnboardingSeen: (onboardingSeen) => set({ onboardingSeen }),

      addRecentSearch: (term) => {
        const q = term.trim();
        if (q.length === 0) return;
        const rest = get().recentSearches.filter((t) => t.toLowerCase() !== q.toLowerCase());
        set({ recentSearches: [q, ...rest].slice(0, RECENT_SEARCH_LIMIT) });
      },
      removeRecentSearch: (term) =>
        set({ recentSearches: get().recentSearches.filter((t) => t !== term) }),
      clearRecentSearches: () => set({ recentSearches: [] }),

      setDeviceTokenMirror: (deviceTokenMirror) => set({ deviceTokenMirror }),

      clearUserPrefs: () =>
        set({ cityId: null, selectedAddressId: null, recentSearches: [], deviceTokenMirror: null }),
    }),
    {
      name: PREFS_STORAGE_KEY,
      version: 1,
      // No `window` access during render — the provider rehydrates in an effect.
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        locale: s.locale,
        themePref: s.themePref,
        cityId: s.cityId,
        selectedAddressId: s.selectedAddressId,
        onboardingSeen: s.onboardingSeen,
        recentSearches: s.recentSearches,
        deviceTokenMirror: s.deviceTokenMirror,
      }),
    },
  ),
);

/**
 * Read `localStorage` and apply it to the store. Call once from the root client provider
 * (`useEffect(() => { void rehydratePrefs(); }, [])`). Safe to call on the server (no-op) and
 * safe to call twice.
 */
export async function rehydratePrefs(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await usePrefs.persist.rehydrate();
  } catch {
    // Private mode / disabled storage: defaults are fine.
  }
}

/** Non-hook read, for imperative helpers. */
export const prefsState = () => usePrefs.getState();
