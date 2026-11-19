import { moduleKeys } from '@/core/query';

/**
 * Query keys for the partners module. The first element is always `'partners'` so the whole
 * module can be invalidated at once (04-data-layer.md).
 */
export const partnerKeys = {
  ...moduleKeys('partners'),
  /** `GET v1/ozio-partners` — the categories. */
  categories: () => ['partners', 'categories'] as const,
  /** `GET v1/ozio-partners/modules/{categoryId}` — the brands of a category. */
  brands: (categoryId: string | null) => ['partners', 'brands', categoryId] as const,
  /** One brand resolved by id (plus the category hint the link carried). */
  brand: (brandId: string, categoryId: string | null) =>
    ['partners', 'brand', brandId, categoryId] as const,
  /** `GET v1/ozio-partners/modules/branch/{brandId}`. */
  branches: (brandId: string) => ['partners', 'branches', brandId] as const,
  /** `GET v1/ozio-plus/campaigns` (+ chain names from `ozio-plus/categories`). */
  campaigns: () => ['partners', 'campaigns'] as const,
  /** `GET v1/ozio-plus/categories` — the store chains. */
  plusChains: () => ['partners', 'plus-chains'] as const,
} as const;
