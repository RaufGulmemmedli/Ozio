/**
 * The single import point for everything the search module borrows from the catalog module.
 *
 * TODO(store): agent M3 owns `src/modules/store`; these are the exports expected from its
 * `index.ts`:
 *
 *     export { ProductCard, StoreTile } from './components/…';
 *     export { parseProductRow, type ProductRow } from './data/models/product-row';
 *     export { parseStore, sortStoresByDistance, type Store } from './data/models/store';
 *     export { parseProductCategory, type ProductCategory } from './data/models/product-category';
 *     export { useDeliveryPoint, type DeliveryPoint } from './hooks/use-delivery-point';
 *
 * Nothing here is re-implemented: the catalog row parser, the store parser, `<ProductCard>` and
 * `<StoreTile>` have exactly one home and it is not this module.
 */
export {
  parseProductRow,
  parseStore,
  parseProductCategory,
  sortStoresByDistance,
  type ProductRow,
  type Store,
  type ProductCategory,
} from '@/modules/store';
