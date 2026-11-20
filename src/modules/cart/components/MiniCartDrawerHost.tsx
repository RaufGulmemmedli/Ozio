'use client';

/**
 * Mounts `<MiniCartDrawer>` only while it is open.
 *
 * The drawer itself calls `useCart()`, which reaches `usePreview()` → `useSearchParams()`. The
 * shell renders it from the app-shell LAYOUT, above every page's Suspense boundary, so having it
 * in the tree unconditionally makes Next refuse to prerender the whole route group
 * ("useSearchParams() should be wrapped in a suspense boundary") — a build failure.
 *
 * Gating on the open flag fixes it for free, and is what the drawer wanted anyway: it is closed
 * on every first paint, so there was never a reason to pay for its queries then. The flag lives
 * in a plain Zustand store, which touches no search params.
 */

import { useCartDrawer } from '../hooks/use-cart-drawer';
import { MiniCartDrawer } from './MiniCartDrawer';

export function MiniCartDrawerHost() {
  const isOpen = useCartDrawer((state) => state.isOpen);
  return isOpen ? <MiniCartDrawer /> : null;
}
