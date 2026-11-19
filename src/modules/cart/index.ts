/**
 * `@/modules/cart` — the public surface. **Other modules import ONLY from here.**
 *
 * M2 (app shell): `useCartBadgeCount` for the header badge (NOT `useCartCount` — it reads
 * `?preview=`, which the layout may not do; see the hook), `useCartDrawer` to open the drawer and
 * `<MiniCartDrawer/>` mounted once in the shell.
 * M3 (store / product) and M4 (search, orders): `<AddToCartButton>` on every product card,
 * `useCart` / `useCartAction` for line quantities, `cartKeys` to invalidate, and `toCartQty` when a
 * quantity has to cross the grams ↔ cart-unit boundary (that function is the only converter).
 *
 * Keep this list stable — three modules depend on it.
 */
export { useCart, useCartCount, useCartBadgeCount, useCartAction, useCartDrawer } from './hooks';
export { MiniCartDrawer } from './components/MiniCartDrawer';
export { AddToCartButton } from './components/AddToCartButton';
export { cartKeys } from './cart.query-keys';
export type { Cart, CartLine, CartTotals } from './data/models/cart';
export { toCartQty } from './data/cart.repository';

/* -------------------------------------------------------------------------------------------
 * Supporting exports — additions to the six names above, never replacements.
 *
 * `<ProductCard>` (M3) renders its own add control and takes the quantity from outside, so the
 * three hooks below are what wire it to the cart without reaching into this module:
 *
 *   const qty    = useCartQuantity(storeId, product.id);          // `items_map` lookup
 *   const commit = useQuantityCommit({ storeId, productId: product.id, serverQty: qty });
 *   <ProductCard quantity={commit.value} onQuantityChange={commit.setQuantity}
 *                busy={commit.isPending} step={cartStep(product)} />
 *
 * `useQuantityCommit` already debounces 250 ms, sends the net delta and runs `requireAuth()`.
 * ------------------------------------------------------------------------------------------- */
export { useCartQuantity, useQuantityCommit } from './hooks';
export type { QuantityCommit, CartActionInput } from './hooks';
export { cartStep } from './data/cart.repository';
export type { AddToCartProduct, AddToCartButtonProps } from './components/AddToCartButton';
export type { CartBundle } from './data/models/cart';
export { CartView } from './view/CartView';
export { CartSkeleton } from './view/CartSkeleton';
export { cartRoutes } from './cart.routes';
