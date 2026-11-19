/**
 * Catalog row — one entry of `GET v1/stores/{storeId}/products` [verified], the card in every grid.
 *
 * The two ids are **not** interchangeable (api/store.md x-live note):
 *  - `id` is the **store-product row id**: store-specific, and the **cart key**
 *    (`POST v2/carts/action { product_id: rowId }`).
 *  - `store_product_variants.id` is the **variant id**, shared across stores, and the id the
 *    product **detail** page is opened with (`/market/product/[variantId]?store=<storeId>`).
 *    They are equal only in store 1.
 *
 * `price`, `mrp`, `stock` are decimal strings; `price < mrp` means discounted. For weight products
 * `stock` is in **grams** while the cart quantity is in the product unit (1 = 1 kg) — that
 * conversion belongs to the cart repository, never here.
 */
import {
  asList,
  asObj,
  bakuWallClock,
  bool,
  int,
  money,
  nullableNum,
  nullableStr,
  num,
  pickTranslation,
  str,
} from '@/core/network';

import { currentBonusPercentage } from './store';

export interface ProductRow {
  /** Store-product ROW id — store-specific, and the **cart key**. */
  id: number;
  /** `store_product_variants.id` — the id the product DETAIL page is opened with. */
  variantId: number;
  storeId: number;
  storeName: string;
  /** Baku wall-clock `HH:mm` of the embedded store, or null. */
  storeOpen: string | null;
  storeClose: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  /** List price. `price < mrp` = discounted. */
  mrp: number;
  isDiscounted: boolean;
  /** `round((mrp - price) / mrp * 100)`, 0 when not discounted. */
  discountPercent: number;
  /** **Grams** for weight products, units otherwise. */
  stock: number;
  inStock: boolean;
  hasWeight: boolean;
  soldByGram: boolean;
  /** `units.symbol`, already falling back to the unit name when the symbol is a bare number. */
  unitLabel: string | null;
  /** Pack size line: "1 kq", "400 q", "2 ədəd" — or null when the API sent nothing. */
  quantityLabel: string | null;
  /** In the product unit for count rows; **grams** for weight rows. Null = no known limit. */
  minOrderQuantity: number | null;
  maxOrderQuantity: number | null;
  isFavorite: boolean;
  categoryId: number | null;
  categoryName: string | null;
  brandName: string | null;
  barcode: string | null;
  /** The store's current bonus rate, when the embedded store carried its history. */
  bonusPercentage: number | null;
}

const UNIT_FALLBACKS: Record<string, string> = {
  kg: 'kq',
  g: 'q',
  l: 'l',
  ml: 'ml',
  pcs: 'ədəd',
};

/** `symbol` can be a bare number on live — fall back to the unit name (api/app-catalog.md). */
function unitLabelOf(units: Record<string, unknown>, locale: string): string | null {
  const symbol = str(units.symbol).trim();
  if (symbol && !/^[\d.,]+$/.test(symbol)) return symbol;
  const name = pickTranslation(units.unit_translations, locale).trim();
  if (name) return name;
  const key = symbol.toLowerCase();
  return UNIT_FALLBACKS[key] ?? null;
}

function imageOf(variant: Record<string, unknown>): string | null {
  for (const entry of asList(variant.store_product_variant_uploads).map(asObj)) {
    // `object_key` is already an absolute CDN URL.
    const url = nullableStr(entry.object_key) ?? nullableStr(asObj(entry.uploads).object_key);
    if (url) return url;
  }
  return null;
}

export function parseProductRow(raw: unknown, opts: { locale?: string } = {}): ProductRow {
  const o = asObj(raw);
  const locale = opts.locale ?? 'az';
  const variant = asObj(o.store_product_variants);
  const store = asObj(o.stores);
  const storeProducts = asObj(variant.store_products);
  const translation = asList(variant.store_product_variant_translations).map(asObj)[0] ?? {};

  const price = money(o.price);
  const mrp = money(o.mrp);
  const isDiscounted = mrp > 0 && price > 0 && price < mrp;

  const firstCategory = asObj(asList(storeProducts.store_products_categories).map(asObj)[0]?.categories);
  const brand = asObj(storeProducts.brands);
  const units = asObj(variant.units);
  const unitLabel = unitLabelOf(units, locale);
  const packSize = nullableNum(variant.quantity);
  const stock = num(o.stock);

  const open = bakuWallClock(store.open_time);
  const close = bakuWallClock(store.close_time);

  return {
    id: int(o.id),
    variantId: int(variant.id, int(o.id)),
    storeId: int(store.id),
    storeName: pickTranslation(store.store_translations, locale) || '',
    storeOpen: open.text || null,
    storeClose: close.text || null,
    name: str(translation.name, '').trim() || '—',
    description: nullableStr(translation.description),
    imageUrl: imageOf(variant),
    price,
    mrp,
    isDiscounted,
    discountPercent: isDiscounted ? Math.round(((mrp - price) / mrp) * 100) : 0,
    stock,
    inStock: stock > 0,
    hasWeight: bool(variant.has_weight),
    soldByGram: bool(variant.sold_by_gram),
    unitLabel,
    quantityLabel:
      packSize !== null && unitLabel
        ? `${formatPackSize(packSize)} ${unitLabel}`
        : (unitLabel ?? null),
    minOrderQuantity: nullableNum(o.min_order_quantity),
    maxOrderQuantity: nullableNum(o.max_order_quantity),
    isFavorite:
      bool(o.is_favorite) || int(asObj(o._count).user_favorite_store_product_variants) > 0,
    categoryId: nullableNum(firstCategory.id),
    categoryName: pickTranslation(firstCategory.category_translations, locale) || null,
    brandName: pickTranslation(brand.brand_translations, locale) || null,
    barcode:
      nullableStr(asList(variant.store_product_variant_barcodes).map(asObj)[0]?.barcode) ??
      nullableStr(asList(variant.barcodes)[0]),
    bonusPercentage: currentBonusPercentage(store.store_bonus_percentages),
  };
}

/** "1", "0,5", "400" — comma decimal, no trailing zeros. The locale formatter owns money only. */
function formatPackSize(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
}

/** Weight rows carry stock in grams; the selectable maximum is in kg. */
export const stockInOrderUnit = (row: ProductRow): number =>
  row.hasWeight || row.soldByGram ? Math.round((row.stock / 1000) * 100) / 100 : row.stock;
