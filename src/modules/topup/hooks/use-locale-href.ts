'use client';

/**
 * `<Button as="a" href>` renders a plain `<a>`, which would drop the `/ru` / `/en` prefix that
 * `<Link>` adds for us. This resolves a `paths.*` value into the prefixed href for the active
 * locale, so a shared `<Button>` can still be a real link.
 *
 * TODO(core): `@/shared/ui`'s `<Button>` only accepts `as: 'button' | 'a'`. If it ever takes a
 * component (`as={Link}`), delete this hook and pass the locale-aware `Link` instead.
 */
import { useLocale } from 'next-intl';

import { getPathname } from '@/core/i18n/navigation';
import type { AppLocale } from '@/core/i18n';

export function useLocaleHref(): (href: string) => string {
  const locale = useLocale() as AppLocale;
  return (href: string) => getPathname({ href, locale });
}
