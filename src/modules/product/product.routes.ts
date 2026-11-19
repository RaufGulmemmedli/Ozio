/**
 * Routes this module owns. The same path is a full page on a direct hit (and below 768) and an
 * intercepted quick-view modal when it is opened from a store / search / category page
 * (`(app)/@modal/(.)market/product/[id]/page.tsx`).
 */
export interface ProductRoute {
  id: string;
  path: string;
  guard: 'public' | 'guest' | 'auth' | 'flow';
  layout: 'landing' | 'auth-split' | 'app-shell' | 'modal' | 'drawer' | 'full';
}

export const productRoutes: readonly ProductRoute[] = [
  { id: 'product', path: '/market/product/[id]', guard: 'guest', layout: 'full' },
  { id: 'productQuickView', path: '/market/product/[id]', guard: 'guest', layout: 'modal' },
] as const;

/** The query key that carries the store a variant belongs to. */
export const PRODUCT_STORE_PARAM = 'store';

/**
 * `/market/product/{variantId}?store={storeId}` — the only correct product link.
 *
 * `{id}` in the path is the **variant id** (`store_product_variants.id`), and a variant is only
 * meaningful together with its store, so the store id always rides along in the query. Lists hand
 * out `row.id` (the cart key) *and* `row.variantId`; pass the variant here, never the row id — a
 * row id makes the detail endpoint answer `data: null`.
 */
export function productPath(variantId: number | string, storeId: number | string): string {
  return `/market/product/${variantId}?${PRODUCT_STORE_PARAM}=${storeId}`;
}
