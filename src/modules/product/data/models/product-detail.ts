/**
 * Domain model for `GET v1/stores/{storeId}/products/{variantId}` (`ProductDetail`, **verified**)
 * and for the rows of `GET v1/stores/{storeId}/similar-products/{variantId}` (`ProductSimilar`,
 * **verified**) — the two shapes are identical except for the barcode key, so one parser reads both.
 *
 * Two ids (api/product.md §"Two ids"):
 *  - `rowId`     = the top-level `id` of the row  → the **cart** key (`carts/action.product_id`)
 *  - `variantId` = `store_product_variants.id`    → the **detail / similar** URL segment
 *
 * Weight products: `stock`, `min_order_quantity`, `max_order_quantity` arrive in **grams**, while
 * the cart quantity is in the product unit (1 = 1 kg). Nothing is converted here — the grams stay
 * grams and `cart.repository` owns the conversion.
 *
 * Nothing in this file throws (BUILD-CONTRACT §6).
 */
import {
  asList,
  asObj,
  bool,
  int,
  money,
  nullableNum,
  num,
  pickTranslation,
  str,
} from '@/core/network';

export interface ProductUnit {
  id: number | null;
  /** May be a bare number ("1") on live — `label` falls back to the unit name then. */
  symbol: string;
  name: string;
  label: string;
  conversion: number | null;
  typeName: string;
}

export interface ProductStoreRef {
  id: number | null;
  name: string;
  address: string;
  /** A string on live ("0"); kept as a number, `null` when the store sent nothing usable. */
  rating: number | null;
  ratingCount: number | null;
  /** Current bonus rate in percentage points, server data — never computed. */
  bonusPercentage: number | null;
  preparationTime: number | null;
}

export interface ProductFlags {
  organic: boolean;
  halal: boolean;
  vegan: boolean;
  recommended: boolean;
  popular: boolean;
}

export interface ProductDetail {
  /** `data.id` — the store-product ROW id, i.e. the cart key. */
  rowId: number | null;
  /** `store_product_variants.id` — the id the detail / similar URLs take. */
  variantId: number | null;
  storeId: number | null;
  name: string;
  description: string;
  price: number;
  mrp: number;
  hasDiscount: boolean;
  /** `round((mrp - price) / mrp * 100)`, 0 when there is no discount. */
  discountPercent: number;
  /** Units in stock — **grams** for weight products. `null` when the API did not say. */
  stock: number | null;
  minOrderQuantity: number | null;
  maxOrderQuantity: number | null;
  /** `stock > 0`; a missing stock counts as in stock (api/product.md). */
  inStock: boolean;
  hasWeight: boolean;
  soldByGram: boolean;
  /** `variant.quantity` trimmed, e.g. "300". */
  packQuantity: string;
  unit: ProductUnit | null;
  images: string[];
  barcodes: string[];
  brand: string;
  categoryId: number | null;
  categoryName: string;
  materialCode: string;
  flags: ProductFlags;
  /** `_count.user_favorite_store_product_variants` — per-user semantics unconfirmed. */
  favoriteCount: number | null;
  /** Only the list rows carry `is_favorite`; the detail endpoint does not. */
  isFavorite: boolean | null;
  store: ProductStoreRef | null;
}

/** `price < mrp` = discounted (api/store.md). */
export function discountPercent(price: number, mrp: number): number {
  if (!(mrp > 0) || !(price < mrp)) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/**
 * `store_bonus_percentages` is a history, newest first: the current rate is the newest entry whose
 * `start_date` has passed and that is not soft-deleted. Never `[0]` blindly (api/store.md).
 */
export function currentBonusPercentage(raw: unknown, now = Date.now()): number | null {
  let best: { at: number; value: number } | null = null;
  for (const entry of asList(raw).map(asObj)) {
    if (entry.deleted_at !== null && entry.deleted_at !== undefined) continue;
    const value = nullableNum(entry.percentage);
    if (value === null) continue;
    const started = Date.parse(str(entry.start_date));
    const at = Number.isFinite(started) ? started : 0;
    if (at > now) continue;
    if (!best || at > best.at) best = { at, value };
  }
  return best ? best.value : null;
}

function parseUnit(raw: unknown, locale: string): ProductUnit | null {
  const o = asObj(raw);
  if (Object.keys(o).length === 0) return null;
  const symbol = str(o.symbol).trim();
  const name = pickTranslation(o.unit_translations, locale);
  // The symbol can be a bare number ("1" for "bag") — fall back to the translated unit name.
  const symbolIsNumber = symbol.length > 0 && /^[\d.,]+$/.test(symbol);
  return {
    id: nullableNum(o.id),
    symbol,
    name,
    label: (symbolIsNumber || symbol.length === 0 ? name : symbol) || name || symbol,
    conversion: nullableNum(o.conversion),
    typeName: pickTranslation(asObj(o.unit_types).unit_type_translations, locale),
  };
}

function parseStoreRef(raw: unknown, locale: string): ProductStoreRef | null {
  const o = asObj(raw);
  if (Object.keys(o).length === 0) return null;
  return {
    id: nullableNum(o.id),
    name: pickTranslation(o.store_translations, locale),
    address: str(o.address),
    rating: nullableNum(o.rating),
    ratingCount: nullableNum(o.rating_count),
    bonusPercentage: currentBonusPercentage(o.store_bonus_percentages),
    preparationTime: nullableNum(o.preparation_time),
  };
}

function parseImages(raw: unknown): string[] {
  const urls: string[] = [];
  for (const upload of asList(raw).map(asObj)) {
    // `object_key` is already an absolute CDN URL on live — used as-is.
    const url = str(upload.object_key).trim();
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

/** Both shapes: `barcodes: string[]` (similar-products) and `store_product_variant_barcodes[{barcode}]` (detail). */
function parseBarcodes(variant: Record<string, unknown>): string[] {
  const codes: string[] = [];
  for (const raw of asList(variant.barcodes)) {
    const code = str(raw).trim();
    if (code && !codes.includes(code)) codes.push(code);
  }
  for (const row of asList(variant.store_product_variant_barcodes).map(asObj)) {
    const code = str(row.barcode).trim();
    if (code && !codes.includes(code)) codes.push(code);
  }
  return codes;
}

function parseCategory(storeProducts: Record<string, unknown>, locale: string) {
  const first = asObj(asList(storeProducts.store_products_categories)[0]);
  const category = asObj(first.categories);
  return {
    categoryId: nullableNum(category.id),
    categoryName: pickTranslation(category.category_translations, locale),
  };
}

/**
 * Reads one product row / detail payload. `raw` may be the envelope's `data`, which is **`null`**
 * for an unknown id — callers must treat that as not-found *before* parsing (see
 * `isMissingProduct`).
 */
export function parseProductDetail(raw: unknown, locale = 'az'): ProductDetail {
  const o = asObj(raw);
  const variant = asObj(o.store_product_variants);
  const storeProducts = asObj(variant.store_products);
  const price = money(o.price);
  const mrp = money(o.mrp);
  const stock = nullableNum(o.stock);
  const { categoryId, categoryName } = parseCategory(storeProducts, locale);

  return {
    rowId: nullableNum(o.id),
    variantId: nullableNum(variant.id),
    storeId: nullableNum(asObj(o.stores).id),
    name: pickTranslation(variant.store_product_variant_translations, locale),
    description: pickTranslation(
      variant.store_product_variant_translations,
      locale,
      'description',
    ),
    price,
    mrp,
    hasDiscount: mrp > price,
    discountPercent: discountPercent(price, mrp),
    stock,
    minOrderQuantity: nullableNum(o.min_order_quantity),
    maxOrderQuantity: nullableNum(o.max_order_quantity),
    inStock: stock === null ? true : stock > 0,
    hasWeight: bool(variant.has_weight),
    soldByGram: bool(variant.sold_by_gram),
    packQuantity: str(variant.quantity).trim(),
    unit: parseUnit(variant.units, locale),
    images: parseImages(variant.store_product_variant_uploads),
    barcodes: parseBarcodes(variant),
    brand: pickTranslation(asObj(storeProducts.brands).brand_translations, locale),
    categoryId,
    categoryName,
    materialCode: str(variant.material_code).trim(),
    flags: {
      organic: bool(variant.is_organic),
      halal: bool(variant.is_halal),
      vegan: bool(variant.is_vegan),
      recommended: bool(variant.is_recommended),
      popular: bool(variant.is_popular_item),
    },
    favoriteCount: nullableNum(asObj(o._count).user_favorite_store_product_variants),
    isFavorite: variant.is_favorite === undefined ? null : bool(variant.is_favorite),
    store: parseStoreRef(o.stores, locale),
  };
}

/**
 * `GET stores/{sid}/products/{id}` answers **HTTP 200 with `data: null`** for an unknown id (and
 * for a row id passed where a variant id belongs). That is a 404, not an empty product.
 */
export function isMissingProduct(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  const o = asObj(data);
  if (Array.isArray(data)) return data.length === 0;
  return Object.keys(o).length === 0;
}

/** Pack line, e.g. `300 Qr` — `variant.quantity` + the unit label. */
export function packLabel(product: Pick<ProductDetail, 'packQuantity' | 'unit'>): string {
  const unit = product.unit?.label ?? '';
  return [product.packQuantity, unit].filter((part) => part.length > 0).join(' ');
}

/** Bonus a purchase earns: `price × rate%` — the rate is server data, the multiplication is display. */
export function bonusFor(price: number, percentage: number | null): number {
  if (percentage === null || !(percentage > 0)) return 0;
  return Math.round(price * percentage) / 100;
}

/**
 * Stepper bounds in the **cart unit** (pieces, or kg for weight products).
 * Weight rows send grams, so the gram figures are divided by 1000 here for the *control bounds
 * only* — the quantity the cart repository receives is already in the product unit.
 */
export interface QuantityBounds {
  step: number;
  min: number;
  max: number | undefined;
}

/**
 * Weight-product quantity step, in the cart unit (1 = 1 kg).
 *
 * 0.1, not 0.5: the design export itself prints "Addım 0,1 kq" and
 * `screens/app-catalog.md` spells out "multiples of 0.1, min 0.1,
 * max stock/1000". The 0.5 in `design-system/components.md` §5/§10 is the
 * generic DS-board note and conflates the step with the *preset chips*
 * (0,5 / 1 / 1,5 / 2 kq), which are a separate control. The screen spec and
 * the export win. `@/modules/store`'s ProductCard uses 0.1 for the same reason.
 */
export const WEIGHT_STEP_KG = 0.1;
export const GRAMS_PER_KG = 1000;

export function quantityBounds(product: ProductDetail): QuantityBounds {
  if (product.hasWeight || product.soldByGram) {
    const stockKg = product.stock === null ? undefined : product.stock / GRAMS_PER_KG;
    const maxOrderKg =
      product.maxOrderQuantity === null ? undefined : product.maxOrderQuantity / GRAMS_PER_KG;
    const caps = [stockKg, maxOrderKg].filter((v): v is number => typeof v === 'number' && v > 0);
    const minKg =
      product.minOrderQuantity === null
        ? WEIGHT_STEP_KG
        : Math.max(WEIGHT_STEP_KG, product.minOrderQuantity / GRAMS_PER_KG);
    return {
      step: WEIGHT_STEP_KG,
      min: minKg,
      max: caps.length > 0 ? Math.min(...caps) : undefined,
    };
  }

  const caps = [product.stock, product.maxOrderQuantity].filter(
    (v): v is number => typeof v === 'number' && v > 0,
  );
  const min = product.minOrderQuantity !== null && product.minOrderQuantity > 0
    ? int(product.minOrderQuantity, 1)
    : 1;
  return {
    step: 1,
    min,
    max: caps.length > 0 ? Math.floor(Math.min(...caps)) : undefined,
  };
}

/** The preset weight chips from `rKZ0u` (0,5 / 1 / 1,5 / 2 kq), clamped to the bounds. */
export function weightPresets(bounds: QuantityBounds): number[] {
  const base = [0.5, 1, 1.5, 2];
  return base.filter((kg) => kg >= bounds.min && (bounds.max === undefined || kg <= bounds.max));
}

/** Line total for display only (BUILD-CONTRACT §7 allows line × qty). */
export function lineTotal(price: number, quantity: number): number {
  return Math.round(price * quantity * 100) / 100;
}

/** Defensive helper so a 0-quantity never reaches a stepper. */
export const clampQuantity = (value: number, bounds: QuantityBounds): number => {
  const upper = bounds.max ?? Number.POSITIVE_INFINITY;
  const rounded = Math.round(value / bounds.step) * bounds.step;
  return Math.min(upper, Math.max(bounds.min, Math.round(rounded * 1000) / 1000));
};

/** `num` is re-exported so views never import the network layer directly. */
export const toNumber = num;
