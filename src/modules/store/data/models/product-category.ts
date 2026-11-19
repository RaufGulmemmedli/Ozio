/**
 * Product category — a row of `GET v1/categories/products?store_id&parent_id` [verified].
 *
 * The endpoint returns `{ categories[], total }` and **no products inside** (42 categories for
 * store 1). `is_age_restricted` is true on the alcohol / tobacco categories and **the API does not
 * gate their products** — the confirm step in `<AgeGate>` is the only gate there is.
 * `_count.store_products_categories` is not per store, so it is never shown as a product count.
 */
import { asList, asObj, bool, int, nullableNum, nullableStr, pickTranslation } from '@/core/network';

export interface ProductCategory {
  id: number;
  name: string;
  imageUrl: string | null;
  /** Has children — ask again with `parent_id=id`. */
  isParent: boolean;
  /** Alcohol / tobacco. The products are NOT gated server-side. */
  isAgeRestricted: boolean;
  searchCount: number | null;
  /** `_count.store_products_categories` — global, NOT per store. Do not render it as a count. */
  globalProductCount: number | null;
}

export function parseProductCategory(
  raw: unknown,
  opts: { locale?: string } = {},
): ProductCategory {
  const o = asObj(raw);
  let imageUrl: string | null = null;
  for (const entry of asList(o.categories_uploads).map(asObj)) {
    const url = nullableStr(asObj(entry.uploads).object_key);
    if (url) {
      imageUrl = url;
      break;
    }
  }
  return {
    id: int(o.id),
    name: pickTranslation(o.category_translations, opts.locale ?? 'az') || '—',
    imageUrl,
    isParent: bool(o.is_parent),
    isAgeRestricted: bool(o.is_age_restricted),
    searchCount: nullableNum(o.search_count),
    globalProductCount: nullableNum(asObj(o._count).store_products_categories),
  };
}
