/**
 * The single import point for everything this module borrows from the catalog module.
 *
 * TODO(store): agent M3 owns `src/modules/store`. Its `index.ts` is the public surface, and these
 * are the exports this module expects from it:
 *
 *     export { ProductCard, StoreTile } from './components/…';
 *     export { parseProductRow, stockInOrderUnit, type ProductRow } from './data/models/product-row';
 *     export { parseStore, sortStoresByDistance, type Store } from './data/models/store';
 *     export { storeRepository, type DeliveryPoint } from './data/store.repository';
 *     export { useStoreProducts, useDeliveryPoint } from './hooks/…';
 *
 * Nothing is re-implemented here: `<ProductCard>`, `parseProductRow` and `parseStore` have exactly
 * one home, and it is not this module. Keeping the imports in one file means the integration is a
 * single diff if M3 renames anything.
 */
export { parseProductRow, type ProductRow } from '@/modules/store';
