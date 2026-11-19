'use client';

/**
 * Fires `screen_view` on every pathname change. Mounted once inside `<Providers>`, so both the
 * marketing and the app layout get it.
 *
 * The locale is read from `<html lang>` rather than `useLocale()` on purpose: `<RouteTracker/>`
 * sits above `NextIntlClientProvider` in some layouts, and an analytics ping must never be the
 * reason a screen throws.
 */
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { track } from '@/core/analytics/track';

const LOCALES = ['az', 'ru', 'en'];

function documentLocale(): string {
  if (typeof document === 'undefined') return LOCALES[0] as string;
  const lang = document.documentElement.lang?.slice(0, 2).toLowerCase();
  return lang && LOCALES.includes(lang) ? lang : (LOCALES[0] as string);
}

/**
 * `/az/orders/41/receipt` → `orders.receipt`. The locale prefix and numeric ids are dropped so the
 * screen name is the same for every user and every language.
 */
export function screenNameFromPath(pathname: string): string {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((s, i) => !(i === 0 && LOCALES.includes(s)))
    .filter((s) => !/^\d+$/.test(s) && !/^\[.*\]$/.test(s));
  return segments.length > 0 ? segments.join('.') : 'landing';
}

export function RouteTracker(): null {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    track('screen_view', {
      path: pathname,
      screen: screenNameFromPath(pathname),
      locale: documentLocale(),
    });
  }, [pathname]);

  return null;
}
