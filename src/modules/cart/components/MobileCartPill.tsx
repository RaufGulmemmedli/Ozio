'use client';

/**
 * The floating cart button, phones only.
 *
 * `<TopBar>` hides its cart icon below `md` (`hidden md:grid`) — the phone header is logo,
 * search, bell and avatar, with no room for it. That left a visitor shopping on a phone with no
 * way to see or reach the cart at all: they could add items from `/market` and the only sign of
 * it was a number they could not get to. The native app solves it with a pill above the bottom
 * nav carrying the count and the total, and this is that.
 *
 * It opens `<MiniCartDrawer>` rather than navigating to `/cart`, because the question a shopper
 * asks mid-shop is "what is in there?", not "let me check out" — the drawer answers it without
 * losing their place in the catalogue, and carries its own link onward.
 *
 * Hidden when the cart is empty: a pill reading "0" is a button with nothing behind it.
 */

import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { ShoppingBag } from '@/shared/lucide';

import { useCartBadgeSummary } from '../hooks/use-cart';
import { useCartDrawer } from '../hooks/use-cart-drawer';

/**
 * Clears the app shell's bottom pill (68 high) plus a 44 gap, and the home-indicator inset under
 * it. The same arithmetic as the toast and snackbar offsets in `_overlay-hosts.tsx`.
 */
const BOTTOM_OFFSET = 'calc(68px + 44px + env(safe-area-inset-bottom))';

export function MobileCartPill() {
  const t = useTranslations('cart');
  const { money } = useFormat();
  const open = useCartDrawer((state) => state.open);

  // NOT `useCart()`: this renders in the app-shell layout, above every page's Suspense
  // boundary, and that hook reaches `useSearchParams()` — which makes Next refuse to prerender
  // the whole route group. `useCartBadgeSummary` reads the same query without it.
  const { count, total } = useCartBadgeSummary();
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t('miniCart.openWithCount', { count })}
      className="fixed end-5 z-40 flex h-14 flex-row items-center gap-2.5 rounded-pill bg-brand px-5 text-on-cta shadow-menu transition-transform duration-[var(--oz-dur-fast)] active:scale-[.97] md:hidden"
      style={{ bottom: BOTTOM_OFFSET }}
    >
      <ShoppingBag size={22} aria-hidden="true" />
      <span className="text-body font-extrabold tabular-nums">
        {total === null ? count : `${count} · ${money(total)}`}
      </span>
    </button>
  );
}
