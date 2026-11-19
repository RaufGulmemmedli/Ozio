'use client';

/**
 * Price filter, "only discounted" switch and sort order.
 *
 * **All three are client-side only.** `api/store.md` is explicit: `stores/{storeId}/products`
 * supports `category_id`, `keyword`, `limit` and `offset` and nothing else — no price range, no
 * discount flag, no sort parameter (`sort`, `order_by`, `sortBy`, `order` are all ignored). They
 * are therefore applied to the pages that are **already loaded**, and the UI says so
 * (`filters.clientSideNote` / `sort.clientSideNote`) instead of implying a catalogue-wide filter.
 */
import { useCallback, useMemo, useState } from 'react';

import type { ProductRow } from '../data/models/product-row';

export type CatalogSort = 'popular' | 'priceAsc' | 'priceDesc' | 'discount' | 'name';

export const CATALOG_SORTS: readonly CatalogSort[] = [
  'popular',
  'priceAsc',
  'priceDesc',
  'discount',
  'name',
] as const;

export interface PriceRange {
  min: number;
  max: number;
}

/** The ends drawn in the export (0,50 ₼ – 25 ₼) — used until a page of real prices has landed. */
export const DEFAULT_PRICE_BOUNDS: PriceRange = { min: 0.5, max: 25 };

/**
 * The active category is **not** here: it is a server parameter (`category_id`) owned by the
 * screen, so there is exactly one source of truth for it.
 */
export interface CatalogFilterState {
  /** `null` = untouched, so the full range stays implicit. */
  price: PriceRange | null;
  discountOnly: boolean;
  sort: CatalogSort;
}

export interface UseCatalogFiltersResult extends CatalogFilterState {
  /** Slider ends, derived from the loaded prices. */
  bounds: PriceRange;
  /** The loaded rows after the client-side filters, in the chosen order. */
  visible: ProductRow[];
  /** How many of the client-side filters are active (sort excluded). */
  activeCount: number;
  /** True when the client-side filters hid at least one loaded row. */
  isFiltered: boolean;
  setPrice: (range: PriceRange | null) => void;
  setDiscountOnly: (only: boolean) => void;
  setSort: (sort: CatalogSort) => void;
  clearFilters: () => void;
}

function boundsOf(items: readonly ProductRow[]): PriceRange {
  if (items.length === 0) return DEFAULT_PRICE_BOUNDS;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const item of items) {
    if (item.price < min) min = item.price;
    if (item.price > max) max = item.price;
  }
  if (!Number.isFinite(min) || max <= 0) return DEFAULT_PRICE_BOUNDS;
  const low = Math.max(0, Math.floor(min * 10) / 10);
  const high = Math.max(low + 1, Math.ceil(max));
  return { min: low, max: high };
}

export function useCatalogFilters(
  items: readonly ProductRow[],
  initial: Partial<CatalogFilterState> = {},
): UseCatalogFiltersResult {
  const [price, setPrice] = useState<PriceRange | null>(initial.price ?? null);
  const [discountOnly, setDiscountOnly] = useState(initial.discountOnly ?? false);
  const [sort, setSort] = useState<CatalogSort>(initial.sort ?? 'popular');

  const bounds = useMemo(() => boundsOf(items), [items]);

  const visible = useMemo(() => {
    let list = [...items];
    if (discountOnly) list = list.filter((row) => row.isDiscounted);
    if (price) list = list.filter((row) => row.price >= price.min && row.price <= price.max);
    switch (sort) {
      case 'priceAsc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        list.sort((a, b) => b.discountPercent - a.discountPercent);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'az'));
        break;
      case 'popular':
        // Server order: `stores/{id}/products` has no sort parameter at all.
        break;
    }
    return list;
  }, [items, discountOnly, price, sort]);

  const clearFilters = useCallback(() => {
    setPrice(null);
    setDiscountOnly(false);
    setSort('popular');
  }, []);

  const activeCount = (price ? 1 : 0) + (discountOnly ? 1 : 0);

  return {
    price,
    discountOnly,
    sort,
    bounds,
    visible,
    activeCount,
    isFiltered: visible.length !== items.length,
    setPrice,
    setDiscountOnly,
    setSort,
    clearFilters,
  };
}
