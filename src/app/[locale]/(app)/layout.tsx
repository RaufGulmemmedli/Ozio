import type { Metadata } from "next";
import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import { AuthGate } from "./_auth-gate";
import { OverlayHosts } from "./_overlay-hosts";
import { ShellChrome } from "./_shell-chrome";

/**
 * `app-shell` layout (02-routing.md): `<AppShell>` switches between sidebar
 * (≥1200), icon rail (768–1199) and bottom pill (<768) in pure CSS, and it owns
 * the `<main id="main">` landmark.
 *
 * Contract for screen agents:
 * - the route is `src/app/[locale]/(app)/<path>/page.tsx`;
 * - the page gets `{ params: Promise<{ locale: string }>, searchParams: Promise<…> }`
 *   and stays thin: `export default function Page(){ return <MarketView/> }`;
 * - **do not render `<main>`** — `<AppShell>` already does, and it is the
 *   skip-link target. Start the page at `<PageHeader>` / a section;
 * - the shell chrome, the guard and the `@modal` slot are provided here;
 * - intercepted modals live at `(app)/@modal/(.)<path>/page.tsx`, and a direct
 *   hit falls through to the full page (`@modal/default.tsx` renders `null`);
 * - the guard comes from the `routeGuards` table via `<AuthGate>`, so a page does
 *   nothing for auth; `notFound()` for flagged modules still belongs in the page
 *   (08-feature-flags-mocks.md);
 * - a screen that needs the right-hand panel, a reduced top bar, nav badge counts
 *   or a banner passes them through its own `<AppShell>`-less content — those
 *   props live on this layout, so ask for them here rather than nesting a second
 *   shell.
 */

export const metadata: Metadata = {
  // The whole group is `Disallow`-ed in robots.txt as well.
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
  modal,
  params,
}: {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    // `<ShellChrome>` is `<AppShell>` plus the live cart count: this layout is a server
    // component and the shell may not call module hooks itself, so the badge needs that seam.
    <ShellChrome>
      <AuthGate>{children}</AuthGate>
      {modal}
      {/* Singleton hosts for toast / snackbar / confirmDialog / requireAuth.
          Mounted here, once, for the whole group — modules must not mount
          their own, or the imperative APIs resolve against the wrong store. */}
      <OverlayHosts />
    </ShellChrome>
  );
}
