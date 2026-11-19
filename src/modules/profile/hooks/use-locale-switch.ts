'use client';

/**
 * Language switching (`app-dil-sec.html`, PS2).
 *
 * This is a pure client preference — there is no language endpoint. Switching:
 *  1. writes the `NEXT_LOCALE` cookie (what the next-intl middleware reads on the next request),
 *  2. mirrors the choice into `usePrefs()` so the rest of the app agrees,
 *  3. navigates with next-intl's locale-aware `useRouter`, which rewrites `/…` → `/ru/…`,
 *  4. drops the cached entries that belong to the *previous* locale.
 *
 * Step 4 is belt-and-braces: every localized query key already carries the locale (`scoped()`),
 * so the new locale is a cache **miss** and re-fetches on its own. Removing the old locale's
 * entries only stops stale text sitting in the cache if the user switches back within `gcTime`.
 */
import { useCallback, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { LOCALE_COOKIE, type AppLocale } from '@/core/i18n';
import { usePathname, useRouter } from '@/core/i18n/navigation';
import { usePrefs } from '@/core/session';

const ONE_YEAR = 60 * 60 * 24 * 365;

function writeLocaleCookie(locale: AppLocale): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
}

export interface UseLocaleSwitchResult {
  locale: AppLocale;
  pending: boolean;
  select(next: AppLocale): void;
}

export function useLocaleSwitch(): UseLocaleSwitchResult {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setLocale = usePrefs((s) => s.setLocale);
  const [pending, startTransition] = useTransition();

  const select = useCallback(
    (next: AppLocale) => {
      if (next === locale) return;
      writeLocaleCookie(next);
      setLocale(next);
      const previous = locale;
      startTransition(() => {
        router.replace(pathname, { locale: next });
      });
      // Localized keys are `[...base, locale, cityId]`, so the old locale's entries can go.
      queryClient.removeQueries({
        predicate: (query) => query.queryKey.includes(previous),
      });
    },
    [locale, pathname, queryClient, router, setLocale],
  );

  return { locale, pending, select };
}
