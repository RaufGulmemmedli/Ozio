/**
 * Public surface of the product module (D4 / AX5 / AX6). Other modules import from here only.
 */
export { productRoutes, productPath, PRODUCT_STORE_PARAM, type ProductRoute } from './product.routes';
export { productKeys } from './product.query-keys';

export {
  parseProductDetail,
  isMissingProduct,
  packLabel,
  bonusFor,
  discountPercent,
  currentBonusPercentage,
  quantityBounds,
  weightPresets,
  clampQuantity,
  lineTotal,
  WEIGHT_STEP_KG,
  GRAMS_PER_KG,
  type ProductDetail,
  type ProductFlags,
  type ProductStoreRef,
  type ProductUnit,
  type QuantityBounds,
} from './data/models/product-detail';

export { productRepository, type ProductRef } from './data/product.repository';

export { useProductDetail } from './hooks/use-product-detail';
export { useSimilarProducts } from './hooks/use-similar-products';
export { useProductFavorite, type ProductFavoriteState } from './hooks/use-product-favorite';
export { useGridCart, type GridCart } from './hooks/use-grid-cart';

export { ProductQuickView, type ProductQuickViewProps } from './components/product-quick-view';
export { ProductGallery, type ProductGalleryProps } from './components/product-gallery';
export { SimilarRail, type SimilarRailProps } from './components/similar-rail';

export { ProductView, type ProductViewProps } from './view/product-view';
export { ProductSkeleton } from './view/product-skeleton';
