'use client';

/**
 * `useHref(path)` — a locale-prefixed href for the places where a real `<a>` is needed but the
 * element is rendered by a shared component that takes `href` as a string (`<Button as="a">`).
 *
 * `next-intl`'s `<Link>` is used everywhere else; this exists so a styled CTA is still a normal
 * link (middle-click, open-in-new-tab, copy-link) instead of an `onClick` router push.
 *
 * TODO(core): `@/shared/ui`'s `<Button>` only accepts `as: 'button' | 'a'`. If it ever takes a
 * component (`as={Link}`), delete this hook and pass the locale-aware `Link` instead.
 */
import { useLocale } from 'next-intl';
import { useCallback } from 'react';

import { getPathname } from '@/core/i18n/navigation';
import type { AppLocale } from '@/core/i18n';

export function useHref(): (path: string) => string {
  const locale = useLocale() as AppLocale;
  return useCallback((path: string) => getPathname({ href: path, locale }), [locale]);
}
