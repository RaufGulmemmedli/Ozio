'use client';

/**
 * `useCart()` / `useCartCount()` — `GET v2/carts` (**verified**).
 *
 * `data` is a LIST of carts, one per store, so the hook hands back the grouped `CartBundle`
 * (`carts`, `storeCount`, `itemCount`, `activeCartId`) rather than pretending there is a single
 * active cart. Cache policy `CACHE.cart`: `staleTime 0`, refetch on focus, invalidated by every
 * mutation (04-data-layer.md).
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery, usePreview } from '@/core/query';
import { useIsAuthenticated } from '@/core/session';

import { cartKeys } from '../cart.query-keys';
import { previewBundle } from '../data/cart.preview';
import { cartRepository } from '../data/cart.repository';
import {
  emptyCartBundle,
  findCart,
  orderedLines,
  type Cart,
  type CartBundle,
  type CartLine,
} from '../data/models/cart';
import { useCartSelection } from './use-cart-selection';

/**
 * The cart, with `?preview=` support.
 *
 * The API cart is per account and a guest cart is explicitly not persisted, so the query only runs
 * for a signed-in customer; a guest sees the empty bundle (and `requireAuth()` fires on the first
 * mutation attempt).
 */
export function useCart() {
  const authenticated = useIsAuthenticated();

  return useScreenQuery<CartBundle>(
    {
      queryKey: cartKeys.list(),
      queryFn: ({ signal }) => unwrap(cartRepository.list(signal)),
      enabled: authenticated,
      placeholderData: authenticated ? undefined : emptyCartBundle(),
      ...CACHE.cart,
    },
    { empty: emptyCartBundle(), data: previewBundle() },
  );
}

/**
 * The header badge: lines across every per-store cart, saved-for-later excluded
 * (`api/cart.md` — "Cart badge = sum of line counts across carts; empty → `data: []`").
 *
 * Reads the same cache entry as `useCart()`, so the badge never fires a second request.
 */
export function useCartCount(): number {
  const authenticated = useIsAuthenticated();
  const preview = usePreview();

  const { data } = useQuery<CartBundle, Failure>({
    queryKey: cartKeys.list(),
    queryFn: ({ signal }) => unwrap(cartRepository.list(signal)),
    enabled: authenticated && preview === null,
    ...CACHE.cart,
  });

  if (preview === 'empty') return 0;
  if (preview !== null) return previewBundle().itemCount;
  return data?.itemCount ?? 0;
}

/**
 * The same count for the app-shell header badge — and the one the shell must use.
 *
 * It is {@link useCartCount} without the `?preview=` branch, for a structural reason rather than a
 * stylistic one: the shell calls this from the `(app)` layout, which sits ABOVE every page's
 * Suspense boundary, and `usePreview()` reaches `useSearchParams()`. Next then refuses to
 * prerender anything under that layout — `next build` fails every static app page with
 * "useSearchParams() should be wrapped in a suspense boundary". Wrapping the shell itself in
 * Suspense is not a fix either: the fallback would have to render the whole shell a second time
 * and the swap would remount every page under it.
 *
 * Nothing real is lost. `?preview=` is a per-screen debug device for rendering a screen's loading,
 * empty and error states; the chrome around it goes on showing the actual cart. The query key is
 * the one `useCart` and every mutation use, so this costs no extra request and updates in step.
 */
export function useCartBadgeCount(): number {
  return useCartBadgeSummary().count;
}

export interface CartBadgeSummary {
  count: number;
  /** The ACTIVE cart's item total, or `null` before anything has loaded. */
  total: number | null;
}

/**
 * Count and total for the chrome — the header badge and the phone's floating cart pill.
 *
 * Same reasoning as `useCartBadgeCount` had on its own, and the reason this exists at all: both
 * callers live in the app-shell LAYOUT, above every page's Suspense boundary, and `useCart()`
 * reaches `usePreview()` → `useSearchParams()`. Next then refuses to prerender the whole group
 * ("useSearchParams() should be wrapped in a suspense boundary"), which is a build failure, not a
 * warning. This reads the same `cartKeys.list()` query with a plain `useQuery`, so it costs no
 * extra request and stays out of that trap.
 *
 * The price is `?preview=`: the chrome shows the real cart while a screen previews its states.
 * That is the right trade — preview is a per-screen debug device.
 */
export function useCartBadgeSummary(): CartBadgeSummary {
  const authenticated = useIsAuthenticated();

  const { data } = useQuery<CartBundle, Failure>({
    queryKey: cartKeys.list(),
    queryFn: ({ signal }) => unwrap(cartRepository.list(signal)),
    enabled: authenticated,
    ...CACHE.cart,
  });

  // `orders/checkout` prices a single `cart_id`, so the pill shows the active cart's figure —
  // the same one the drawer and the summary card show.
  const active = data ? (findCart(data, data.activeCartId) ?? data.carts[0] ?? null) : null;

  return { count: data?.itemCount ?? 0, total: active?.totals?.price ?? null };
}

/** The cart the summary prices: the selection's choice, else the bundle's most recent non-empty. */
export function useActiveCart(bundle: CartBundle | undefined): Cart | null {
  const chosen = useCartSelection((state) => state.activeCartId);

  return useMemo(() => {
    if (!bundle) return null;
    return findCart(bundle, chosen) ?? findCart(bundle, bundle.activeCartId);
  }, [bundle, chosen]);
}

/** Every orderable line across every cart, in the order the stores come back. */
export function useAllLines(bundle: CartBundle | undefined): CartLine[] {
  return useMemo(() => (bundle?.carts ?? []).flatMap(orderedLines), [bundle]);
}

/**
 * The quantity of one store-product row in the cart (`items_map` lookup), for a product card or
 * the product page: `0` when it is not in the cart.
 */
export function useCartQuantity(storeId: number, productId: number): number {
  const { data } = useCart();

  return useMemo(() => {
    const cart = data?.carts.find((row) => row.storeId === storeId);
    if (!cart) return 0;
    const mapped = cart.itemsMap[String(productId)];
    if (typeof mapped === 'number') return mapped;
    return cart.lines.find((line) => line.id === productId)?.quantity ?? 0;
  }, [data, storeId, productId]);
}
