'use client';

/**
 * The client seam that feeds live counters into `<AppShell>`.
 *
 * `<AppShell>` and `<TopBar>` take their counts as **props** on purpose (`top-bar.tsx`: "This
 * component NEVER calls a module hook") — `shared/` sits below `modules/` and may not import from
 * it. The layout that renders the shell is an async server component, so it cannot call a hook
 * either, and the result was that nothing ever supplied `cartCount`: it kept its `= 0` default and
 * the badge on the cart icon never appeared, however many items were in the cart.
 *
 * This component is that missing link and nothing else. `children` arrives as a prop, so the
 * pages under it stay server components; the chrome itself (`TopBar`, `Sidebar`, `IconRail`,
 * `BottomPill`) is already `'use client'`, so nothing moves across the boundary that was not
 * already there.
 *
 * `useCartBadgeCount()` reads the same `cartKeys.list()` query the cart screen and every mutation
 * use, so adding, removing or clearing a line updates the badge with no extra request. It is the
 * badge-specific hook rather than `useCartCount` because this is a LAYOUT: anything that reads
 * `useSearchParams()` here (which `useCartCount` does, for `?preview=`) sits above every page's
 * Suspense boundary and makes `next build` refuse to prerender the whole group.
 */

import type { ReactNode } from 'react';

import { useRouter } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { useUser } from '@/core/session';
import { useTheme } from '@/core/theme';
import { MiniCartDrawerHost, MobileCartPill, useCartBadgeCount } from '@/modules/cart';
import { useSignOut } from '@/modules/profile';
import { useRestaurantBasketStore } from '@/modules/restaurants';
import { RouteSplash } from '@/shared/brand';
import { AppShell } from '@/shared/layout';

export function ShellChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  // One badge for one cart: the server lines plus the demo restaurant lines, which `/cart`
  // renders side by side. The restaurant count comes from a local store, so it costs no request.
  const serverCartCount = useCartBadgeCount();
  const restaurantCount = useRestaurantBasketStore((state) =>
    state.lines.reduce((sum, line) => sum + line.quantity, 0),
  );
  const cartCount = serverCartCount + restaurantCount;
  const user = useUser();
  const theme = useTheme();
  // No phone lookup of its own: the session already carries it, so the confirm dialog can name
  // the account without the shell fetching the profile.
  const { signOut } = useSignOut(user?.phone);

  return (
    <AppShell
      homeHref={paths.home}
      badges={{ cart: cartCount }}
      topBar={{
        cartCount,
        // Gives the avatar its initial and the trigger a real accessible name ("<name> hesabı").
        user: user?.name ? { name: user.name } : undefined,
        menu: {
          // Every one of these was an inert button until now — `<TopBar>` renders the menu from
          // this wiring and silently does nothing for whatever is missing, so "Çıxış" closed the
          // menu and stopped there.
          onSignOut: () => void signOut(),
          onThemeToggle: theme.toggle,
          onLanguage: () => router.push(paths.settingsLanguage),
        },
      }}
    >
      {children}
      {/* Watches the route, not the mount: the layout survives client-side navigation, so a
          plain <BootSplash> here only ever played on a hard refresh. */}
      {/* The cart module has always documented `<MiniCartDrawer>` as "mounted once in the shell",
          and it never was — so every `useCartDrawer().open()` in the app opened nothing. The pill
          is what opens it on a phone, where `<TopBar>` hides its cart icon below `md` and a
          shopper otherwise had no way to reach the cart from the catalogue at all. */}
      <MiniCartDrawerHost />
      <MobileCartPill />

      <RouteSplash />
    </AppShell>
  );
}
