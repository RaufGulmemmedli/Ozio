"use client";

import { Suspense, useEffect, type ReactNode } from "react";

import { usePathname, useRouter } from "@/core/i18n";
import { usePreview } from "@/core/query";
import { matchGuard, paths, type Guard } from "@/core/routes";
import { useSession } from "@/core/session";
import { SessionExpiredDialog } from "@/shared/states";

import { ShellSkeleton } from "./_shell-skeleton";

/**
 * Client-side guard for the `(app)` group (03-auth-session.md §Guards, step 2).
 * `middleware.ts` is the first line of defence; this catches what the edge cannot
 * see (a cookie that expired between navigations, client-side transitions).
 *
 * - `status === 'unknown'` → page skeleton, never a blank screen or a spinner.
 * - `guest` on an `auth` route → `router.replace('/login?next=…')`.
 * - `session.expired` → blocking `<SessionExpiredDialog>` over the page.
 *
 * `guard` is optional: with nothing passed it is resolved per pathname from the
 * `routeGuards` table (`matchGuard`, 02-routing.md), whose documented default is
 * `auth` — a route is account-bound unless it is listed as guest/public. A screen
 * can override it (`<AuthGate guard="guest">`) if it ever needs to.
 *
 * `usePathname()` comes from `@/core/i18n` (next-intl), so `pathname` is already
 * locale-free, which is exactly what the guard table expects.
 */

/**
 * TODO(core): `@/core/query/providers` seeds the session store but nothing calls
 * `hydrate()`, so `unknown` would never resolve. The gate kicks it off once; when
 * the provider (or a server cookie read) takes this over, delete this block.
 */
let hydrateStarted = false;

/**
 * `usePreview()` reads the query string, so the gate is split: the outer
 * component supplies a Suspense boundary (a `useSearchParams()` read without one
 * opts the whole segment out of prerendering), the inner one does the work.
 */
export function AuthGate({ children, guard }: { children: ReactNode; guard?: Guard }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AuthGateInner guard={guard}>{children}</AuthGateInner>
    </Suspense>
  );
}

function AuthGateInner({
  children,
  guard,
}: {
  children: ReactNode;
  guard?: Guard;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, expired, hydrate } = useSession();

  /**
   * `?preview=` bypasses the guard, exactly as `middleware.ts` already does
   * (04-data-layer.md: "middleware lets these through without login"). Without
   * this the edge lets a preview URL through and then the client gate bounces it
   * to /login, so no `(app)` screen could be viewed or screenshotted without
   * real credentials — which is the whole point of the preview states.
   *
   * `usePreview()` returns null unless NEXT_PUBLIC_ENABLE_PREVIEW=1, so this
   * cannot weaken the guard in production.
   */
  const preview = usePreview();

  const effectiveGuard = guard ?? matchGuard(pathname).guard;
  const mustSignIn = status === "guest" && effectiveGuard === "auth" && preview === null;

  useEffect(() => {
    if (status !== "unknown" || hydrateStarted) return;
    hydrateStarted = true;
    void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (!mustSignIn) return;
    router.replace(paths.loginNext(pathname));
  }, [mustSignIn, pathname, router]);

  if (status === "unknown" || mustSignIn) return <ShellSkeleton />;

  return (
    <>
      {children}
      {expired ? <SessionExpiredDialog /> : null}
    </>
  );
}
