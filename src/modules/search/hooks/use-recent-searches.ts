'use client';

/**
 * Recent searches are **client-only** (Flutter `recent_searches.dart`; there is no endpoint).
 * They live in `usePrefs()` — `localStorage` key `ozio.prefs`, newest first, capped at 10, and
 * cleared on sign-out by `clearUserPrefs()`.
 */
import { usePrefs } from '@/core/session';

export interface RecentSearchesState {
  terms: string[];
  add: (term: string) => void;
  remove: (term: string) => void;
  clear: () => void;
}

export function useRecentSearches(): RecentSearchesState {
  const terms = usePrefs((state) => state.recentSearches);
  const add = usePrefs((state) => state.addRecentSearch);
  const remove = usePrefs((state) => state.removeRecentSearch);
  const clear = usePrefs((state) => state.clearRecentSearches);

  return { terms, add, remove, clear };
}
