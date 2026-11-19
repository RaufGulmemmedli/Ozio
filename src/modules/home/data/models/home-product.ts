/**
 * The "Sənin üçün" cards and the /offers product offers.
 *
 * Two row shapes arrive here:
 * - `GET v1/highlights/products/{id}` (verified, **empty on live**) → the full `LiveProduct` row:
 *   prices are decimal **strings**, the name/unit live under `store_product_variants`, the row `id`
 *   is the store-product ROW id (= the cart key) and `store_product_variants.id` is the VARIANT id
 *   used to open the product page.
 * - `GET v1/ozio-plus/products` (verified) → a flat row `{id, name, price_info{old_price,
 *   new_price, discount_percentage}, image{object_key}}` with no store and no cart key.
 */
import { asList, asObj, int, money, nullableStr, num, pickTranslation, str } from '@/core/network';

export interface HomeProduct {
  /** Store-product row id — the key `POST v2/carts/action` expects as `product_id`. */
  id: number;
  /** Variant id, for `/market/product/[id]`. Null on rows that do not carry one (ozio-plus). */
  variantId: number | null;
  /** Needed by the cart action; null when the row does not name a store (ozio-plus products). */
  storeId: number | null;
  name: string;
  /** "1 kq · Ozio Market" — assembled from the server's unit symbol + store name. */
  unitLabel: string | null;
  storeName: string | null;
  /** Sale price in AZN (server value). */
  price: number;
  /** List price when it is higher than `price`, else null. */
  oldPrice: number | null;
  /** Server-sent discount percentage, or the one derived from mrp/price by the server rows. */
  discountPercent: number | null;
  imageUrl: string | null;
  /** Catalog stock — **grams** for weight products (api/README.md). */
  stock: number | null;
  soldByGram: boolean;
}

const pick = (o: Record<string, unknown>, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

const firstUploadUrl = (rows: unknown): string | null => {
  for (const row of asList(rows)) {
    const o = asObj(row);
    const url = nullableStr(o.object_key) ?? nullableStr(asObj(o.uploads).object_key);
    if (url) return url;
  }
  return null;
};

/** `LiveProduct` row (highlights / store products). */
export function parseHomeProduct(raw: unknown, locale = 'az'): HomeProduct {
  const o = asObj(raw);
  const variant = asObj(o.store_product_variants);
  const store = asObj(o.stores);
  const unit = asObj(variant.units);
  const price = money(pick(o, ['price', 'new_price', 'unit_price']));
  const mrp = money(pick(o, ['mrp', 'old_price', 'unit_mrp']));
  const unitSymbol = str(pick(unit, ['symbol']) ?? variant.unit_symbol);
  const quantity = num(variant.quantity);
  const storeName = pickTranslation(store.store_translations, locale);

  return {
    id: int(o.id),
    variantId: variant.id === undefined ? null : int(variant.id),
    storeId: store.id === undefined ? null : int(store.id),
    name:
      pickTranslation(variant.store_product_variant_translations, locale) ||
      str(pick(o, ['name', 'display_name', 'short_text'])),
    unitLabel: unitSymbol ? `${quantity > 0 ? quantity : 1} ${unitSymbol}` : null,
    storeName: storeName || null,
    price,
    oldPrice: mrp > price ? mrp : null,
    discountPercent: mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : null,
    imageUrl: firstUploadUrl(variant.store_product_variant_uploads),
    stock: o.stock === undefined || o.stock === null ? null : num(o.stock),
    soldByGram: Boolean(variant.sold_by_gram ?? variant.has_weight),
  };
}

/** `GET v1/ozio-plus/products` row — a discount-catalogue product, not a cart-able store row. */
export function parsePlusProduct(raw: unknown): HomeProduct {
  const o = asObj(raw);
  const info = asObj(o.price_info);
  const newPrice = money(info.new_price);
  const oldPrice = money(info.old_price);
  const percent = info.discount_percentage === undefined ? null : num(info.discount_percentage);

  return {
    id: int(o.id),
    variantId: null,
    storeId: null,
    name: str(o.name),
    unitLabel: nullableStr(o.material_code),
    storeName: null,
    price: newPrice,
    oldPrice: oldPrice > newPrice ? oldPrice : null,
    discountPercent:
      percent !== null && percent > 0
        ? Math.round(percent)
        : oldPrice > newPrice && oldPrice > 0
          ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
          : null,
    imageUrl: nullableStr(asObj(o.image).object_key),
    stock: null,
    soldByGram: false,
  };
}

export const isRenderableProduct = (p: HomeProduct): boolean => p.id > 0 && p.name !== '';

/** Can this card add to the cart? Only rows that carry both a store and a row id can. */
export const isCartable = (p: HomeProduct): boolean => p.id > 0 && p.storeId !== null;
