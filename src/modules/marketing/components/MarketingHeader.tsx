'use client';

/**
 * The marketing header island.
 *
 * `<LandingHeader>` from `@/shared/layout` draws the whole nav; it just needs two
 * things the server cannot give a static page:
 *
 *  1. **the CTA's auth state.** 02-routing.md: logged-out → "Daxil ol" (`/login`),
 *     logged-in → "Tətbiqə keç" (`/home`), "decided client-side from a tiny
 *     `/api/auth/session` fetch (avoid making the page dynamic)". `<Providers>`
 *     only *seeds* the session store on marketing routes (it is `'unknown'`
 *     there), and `<AuthGate>` — which does the fetching — lives in the `(app)`
 *     layout, so this island performs that one request itself and pushes the
 *     answer into `@/core/session`. The request is same-origin to our own route
 *     handler; with no `ozio_at` cookie that handler answers `guest` without
 *     touching the upstream API, so **no authenticated request fires on a
 *     logged-out page**.
 *  2. **the language menu.** Three locale links for the same pathname.
 *
 * It renders nothing of its own, so it adds no markup and no layout shift: the
 * first paint is the logged-out header, exactly as the static HTML.
 *
 * TODO(shared): `@/shared/layout/landing-header.tsx` is a client component that
 * imports `{ OzioLogo } from '@/shared/brand'` — the barrel — so `lottie-404`
 * and `lottie-loader` (lottie-react, ~22 KB gz measured) join the client graph of
 * every marketing route even though no marketing page plays a Lottie. Changing
 * that one import to `@/shared/brand/ozio-logo` removes it; it is the single
 * biggest item in the marketing first-load budget that this module cannot fix
 * from inside its own folder.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';

import { localeLabels, locales, usePathname, type AppLocale } from '@/core/i18n';
import { Link } from '@/core/i18n/navigation';
import { useAuthStatus, useSessionStore } from '@/core/session';
import { LandingHeader, type LandingNavLink } from '@/shared/layout/landing-header';
import { Check } from '@/shared/lucide';

export interface MarketingHeaderProps {
  links: LandingNavLink[];
  loginHref: string;
  downloadHref: string;
  appHref: string;
  localeLabel: string;
  locale: AppLocale;
}

/**
 * One in-flight hydration per document, even with React's double-invoked effects
 * in development. `store.hydrate()` is the shared `/api/auth/session` reader from
 * `@/core/session`; it never throws and never guesses `authenticated`.
 */
let hydrating: Promise<void> | null = null;

function hydrateSessionOnce(): Promise<void> {
  hydrating ??= useSessionStore.getState().hydrate();
  return hydrating;
}

/**
 * "Has this document been hydrated?" — read the way every other outside-of-React fact is read
 * here, through `useSyncExternalStore`: `false` on the server and in the hydrating render (so the
 * markup matches the static HTML), `true` from the commit right after. Nothing ever changes, so
 * `subscribe` has nothing to listen to.
 *
 * TODO(core): the same three lines as `@/core/lib/use-online`, but modules may not add to
 * `core/lib`, so it stays local.
 */
const subscribeHydration = (): (() => void) => () => undefined;
const hydratedSnapshot = (): boolean => true;
const serverSnapshot = (): boolean => false;

export function MarketingHeader({
  links,
  loginHref,
  downloadHref,
  appHref,
  localeLabel,
  locale,
}: MarketingHeaderProps) {
  const t = useTranslations('shell');
  const pathname = usePathname();
  const status = useAuthStatus();
  const hydrated = useSyncExternalStore(subscribeHydration, hydratedSnapshot, serverSnapshot);

  useEffect(() => {
    void hydrateSessionOnce();
  }, []);

  // Stay logged-out until the fetch answers, so the markup matches the SSG HTML.
  const authed = hydrated && status === 'authenticated';

  const localeMenu = (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0" aria-label={t('landing.language')}>
      {locales.map((option) => (
        <li key={option}>
          <Link
            href={pathname}
            locale={option}
            prefetch={false}
            aria-current={option === locale ? 'true' : undefined}
            className="flex h-10 items-center justify-between gap-3 rounded-md px-3 text-body-sm font-medium text-ink hover:bg-surface2"
          >
            {localeLabels[option]}
            {option === locale ? <Check size={16} aria-hidden="true" className="text-brand" /> : null}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <LandingHeader
      links={links}
      loginHref={loginHref}
      downloadHref={downloadHref}
      appHref={appHref}
      authed={authed}
      localeLabel={localeLabel}
      localeMenu={localeMenu}
    />
  );
}
