import { CartSkeleton } from '@/modules/cart';

/**
 * Route-level fallback for `/cart`, so the first paint is the screen's own mirror skeleton rather
 * than the generic shell stand-in from `(app)/loading.tsx` (BUILD-CONTRACT rule 3). It is also the
 * Suspense boundary the group needs for `useSearchParams()` inside `<CartView>`.
 */
export default function CartLoading() {
  return <CartSkeleton />;
}
