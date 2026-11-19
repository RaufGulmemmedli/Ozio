/**
 * Edge middleware: locale first, then the route guards (03-auth-session.md "Guards", layer 1).
 *
 * Cookie PRESENCE only — this never calls upstream and never trusts a cookie's contents.
 * An expired-but-present cookie is caught one layer up by `<AuthGate>` in `(app)/layout.tsx`.
 *
 * NOTE (Next 16): the `middleware` file convention is deprecated in favour of `proxy.ts`
 * (`npx @next/codemod@canary middleware-to-proxy .`). The behaviour is identical; renaming this
 * file later needs no change to the code below. It lives in `src/` because `app/` does
 * (`src/app`), which is where Next looks for it in a `src`-layout project.
 */
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
// TODO(core): `routing` is written by agent F1 (`defineRouting({ locales: ['az','ru','en'],
// defaultLocale: 'az', localePrefix: 'as-needed' })`). This import is the one thing in here that
// cannot type-check until that file lands.
import { routing } from '@/core/i18n/routing';
import { FeatureFlags } from '@/core/config/feature-flags';
import { matchGuard } from '@/core/routes/guards';
import { paths } from '@/core/routes/paths';

const intl = createIntlMiddleware(routing);

const locales: readonly string[] = routing.locales;
const defaultLocale: string = routing.defaultLocale;

/** Split `/ru/market/store/7` into `{ locale: 'ru', path: '/market/store/7' }`. */
function splitLocale(pathname: string): { locale: string | null; path: string } {
  const segments = pathname.split('/');
  const first = segments[1] ?? '';
  if (locales.includes(first)) {
    const rest = `/${segments.slice(2).join('/')}`;
    return { locale: first, path: rest === '/' ? '/' : rest.replace(/\/+$/, '') || '/' };
  }
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;
  return { locale: null, path };
}

/** Flutter used singular `/order/...`; keep those links alive with a permanent redirect. */
function legacyTarget(path: string): string | null {
  if (path === '/order') return paths.orders;
  const m = /^\/order\/(.+)$/.exec(path);
  return m ? `/orders/${m[1]}` : null;
}

/** `?preview=` bypasses the auth guard only when previews are enabled (never in production). */
function isPreview(req: NextRequest): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_PREVIEW === '1' && req.nextUrl.searchParams.has('preview')
  );
}

function redirectTo(
  req: NextRequest,
  locale: string | null,
  target: string,
  status: 307 | 308 = 307,
): NextResponse {
  const prefix = locale && locale !== defaultLocale ? `/${locale}` : '';
  return NextResponse.redirect(new URL(`${prefix}${target}`, req.nextUrl.origin), status);
}

export default function middleware(req: NextRequest): NextResponse {
  const { locale, path } = splitLocale(req.nextUrl.pathname);

  const legacy = legacyTarget(path);
  if (legacy) return redirectTo(req, locale, `${legacy}${req.nextUrl.search}`, 308);

  // 1. locale rewrite / redirect first.
  const res = intl(req);
  if (res.status >= 300 && res.status < 400) return res;

  // 2. guard table (default `auth` — see core/routes/guards.ts).
  const rule = matchGuard(path);
  const hasToken = req.cookies.has('ozio_at') || req.cookies.has('ozio_rt');

  if (rule.flag && !FeatureFlags[rule.flag]) return redirectTo(req, locale, paths.home);

  if (rule.guard === 'auth' && !hasToken && !isPreview(req)) {
    const next = encodeURIComponent(`${path}${req.nextUrl.search}`);
    return redirectTo(req, locale, `${paths.login}?next=${next}`);
  }

  if (rule.guard === 'flow' && hasToken) return redirectTo(req, locale, paths.home);

  return res;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
