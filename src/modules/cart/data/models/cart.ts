/**
 * Cart domain models + tolerant parsers (`api/cart.md`, `GET v2/carts` — **verified** 2026-11-12).
 *
 * Two things about this endpoint shape every screen in the module:
 *
 * 1. **`data` is a LIST of carts, one per store.** There is no single "active cart"; the client
 *    groups by store and decides what to show (the design header reads "3 mağazadan 6 məhsul").
 * 2. **`totals` is `{price, mrp}` only** — the items total, *not* the payable amount. Delivery,
 *    service/packet fees, bonus, promo and the amount the customer pays exist only in
 *    `POST v2/orders/checkout` (see `./checkout.ts`). Never derive them here.
 *
 * Parsers never throw; a missing field becomes a safe default, and money that was not sent stays
 * `null` so the view can render a skeleton instead of a made-up `0`.
 */
import { asList, asObj, bool, money, num, str } from '@/core/network';

/** The items total of one cart, exactly as the server sent it. Nothing is derived from it. */
export interface CartTotals {
  /** `totals.price` — items at sale price. NOT the payable amount. */
  price: number;
  /** `totals.mrp` — the same items at list price. */
  mrp: number;
}

/** One line of one store's cart. `id` is the store-product **ROW** id (not a variant id). */
export interface CartLine {
  /** Store-product row id = `product.id` = the `items_map` key = `product_id` for `carts/action`. */
  id: number;
  /** Same value as `id`; kept separate so call sites read as the API body does. */
  productId: number;
  /** The store this line belongs to — `carts/action` needs it. */
  storeId: number;
  name: string;
  imageUrl: string | null;
  /** In the product unit: a count, or **kg** for a weight product (1 = 1 kg, never grams). */
  quantity: number;
  /** `price_details.total_price` — server value for this line. */
  linePrice: number;
  /** `price_details.total_mrp`. */
  lineMrp: number;
  /** `price_details.unit_price` — per piece / per kg. */
  unitPrice: number;
  unitMrp: number;
  /** `inventory.stock`; `null` when unknown. Grams for a weight product. */
  stock: number | null;
  /** `null` = unknown (live sends null); never pre-validate a weight product against it. */
  minOrderQuantity: number | null;
  /** `null` = no limit. */
  maxOrderQuantity: number | null;
  /** `measurements.sold_by_gram` — the quantity is kg and the catalog stock is grams. */
  soldByGram: boolean;
  hasWeight: boolean;
  /** `measurements.unit.symbol`, e.g. "kq". */
  unitSymbol: string | null;
  /** Saved-for-later lines are excluded from the order. */
  savedForLater: boolean;
  notes: string | null;
  addedAt: string | null;
}

/** One store's cart. */
export interface Cart {
  id: number;
  status: string;
  storeId: number;
  storeName: string;
  /** Baku wall-clock `HH:mm` written with a fake `Z` — read literally, never converted. */
  openTime: string | null;
  closeTime: string | null;
  totals: CartTotals;
  lines: CartLine[];
  /** `{ "<rowId>": qty }` — the fastest "is this product in the cart" lookup for product cards. */
  itemsMap: Readonly<Record<string, number>>;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Everything `GET v2/carts` says, grouped the way the screens need it.
 * `activeCartId` is the cart the summary prices (checkout is per `cart_id`).
 */
export interface CartBundle {
  carts: Cart[];
  /** Number of per-store carts that still hold a line. */
  storeCount: number;
  /** Lines across all carts, saved-for-later excluded — the "6 məhsul" / badge number. */
  itemCount: number;
  /**
   * The cart the summary prices by default: the most recently updated non-empty one
   * (`cart_repository.dart:37`). `null` when the cart is empty.
   */
  activeCartId: number | null;
}

/** Result of `POST v2/carts/action`. */
export interface CartActionResult {
  cartId: number | null;
  actionStatus: string;
  /** Server message to show when set (`notification_message`); empty → nothing to show. */
  notificationMessage: string | null;
  removeAll: boolean;
}

const nullableNumber = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : num(v);

const nullableString = (v: unknown): string | null => {
  const s = str(v).trim();
  return s.length > 0 ? s : null;
};

/** `pick(json, ['a','b'])` — first non-null wins (mirrors the Flutter parsers). */
const pick = (o: Record<string, unknown>, keys: readonly string[]): unknown => {
  for (const key of keys) {
    const value = o[key];
    if (value !== null && value !== undefined) return value;
  }
  return undefined;
};

export function parseCartLine(json: unknown, storeId: number): CartLine {
  const o = asObj(json);
  const product = asObj(o.product);
  const price = asObj(o.price_details);
  const inventory = asObj(o.inventory);
  const measurements = asObj(product.measurements);
  const unit = asObj(measurements.unit);
  const saveForLater = asObj(o.save_for_later);

  // cart_action_api.dart:110 — the row id may only be present on the nested product.
  const id = num(pick(o, ['id']) ?? product.id);

  return {
    id,
    productId: id,
    storeId,
    name: str(product.name),
    imageUrl: nullableString(asObj(product.image).url),
    quantity: num(o.quantity),
    linePrice: money(pick(price, ['total_price'])),
    lineMrp: money(pick(price, ['total_mrp'])),
    unitPrice: money(pick(price, ['unit_price'])),
    unitMrp: money(pick(price, ['unit_mrp'])),
    stock: nullableNumber(inventory.stock),
    minOrderQuantity: nullableNumber(inventory.min_order_quantity),
    maxOrderQuantity: nullableNumber(inventory.max_order_quantity),
    soldByGram: bool(measurements.sold_by_gram),
    hasWeight: bool(measurements.has_weight),
    unitSymbol: nullableString(unit.symbol),
    savedForLater: bool(saveForLater.is_saved),
    notes: nullableString(o.notes),
    addedAt: nullableString(o.added_at),
  };
}

export function parseCart(json: unknown): Cart {
  const o = asObj(json);
  const store = asObj(o.store);
  const totals = asObj(o.totals);
  const storeId = num(store.id);

  const itemsMap: Record<string, number> = {};
  for (const [key, value] of Object.entries(asObj(o.items_map))) {
    itemsMap[key] = num(value);
  }

  return {
    id: num(pick(o, ['id', 'cart_id'])),
    status: str(o.status, 'active'),
    storeId,
    storeName: str(store.name),
    openTime: nullableString(store.open_time),
    closeTime: nullableString(store.close_time),
    totals: {
      // cart_totals.dart:62 — alternate keys kept for the legacy shapes.
      price: money(pick(totals, ['price', 'items_total_price', 'total_price'])),
      mrp: money(pick(totals, ['mrp', 'total_mrp'])),
    },
    lines: asList(o.items).map((item) => parseCartLine(item, storeId)),
    itemsMap,
    createdAt: nullableString(o.created_at),
    updatedAt: nullableString(o.updated_at),
  };
}

/** Lines that count towards the order (saved-for-later is excluded, per `api/cart.md`). */
export const orderedLines = (cart: Cart): CartLine[] =>
  cart.lines.filter((line) => !line.savedForLater);

/**
 * Parses the `GET v2/carts` payload: a list of per-store carts (a single object is tolerated,
 * `cart.dart:68`), then groups it the way the screens read it.
 */
export function parseCartBundle(json: unknown): CartBundle {
  const rows = Array.isArray(json) ? json : json === null || json === undefined ? [] : [json];
  const carts = rows.map(parseCart).filter((cart) => cart.id > 0 || cart.lines.length > 0);

  const nonEmpty = carts.filter((cart) => orderedLines(cart).length > 0);
  const itemCount = nonEmpty.reduce((total, cart) => total + orderedLines(cart).length, 0);

  // The most recently updated non-empty cart (cart_repository.dart:37).
  const active = nonEmpty.reduce<Cart | null>((best, cart) => {
    if (!best) return cart;
    const a = Date.parse(cart.updatedAt ?? '') || 0;
    const b = Date.parse(best.updatedAt ?? '') || 0;
    return a > b ? cart : best;
  }, null);

  return {
    carts,
    storeCount: nonEmpty.length,
    itemCount,
    activeCartId: active?.id ?? null,
  };
}

export function parseCartActionResult(json: unknown): CartActionResult {
  const o = asObj(json);
  return {
    cartId: nullableNumber(pick(o, ['id', 'cart_id'])),
    actionStatus: str(pick(o, ['action_status', 'status'])),
    notificationMessage: nullableString(o.notification_message),
    removeAll: bool(o.remove_all),
  };
}

/** The empty bundle — also the `?preview=empty` seed. */
export const emptyCartBundle = (): CartBundle => ({
  carts: [],
  storeCount: 0,
  itemCount: 0,
  activeCartId: null,
});

export const findCart = (bundle: CartBundle, cartId: number | null): Cart | null =>
  bundle.carts.find((cart) => cart.id === cartId) ?? null;

export const findLine = (cart: Cart | null, lineId: number): CartLine | null =>
  cart?.lines.find((line) => line.id === lineId) ?? null;
