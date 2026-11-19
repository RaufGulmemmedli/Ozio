/**
 * Delivery estimate per store, from `GET v1/stores/search?lat=&lng=` (**verified**; `lat` + `lng`
 * are REQUIRED — 400 without them, and `search` is ignored by the server).
 *
 * `api/cart.md`: a row **without** `delivery_fee` means the store does not serve that point — that
 * is the out-of-zone signal available before checkout answers. The fee quoted here is an
 * **estimate** for the selected address only; the payable delivery fee comes from
 * `orders/checkout`.
 */
import { asList, asObj, bool, money, num, str } from '@/core/network';

export interface StoreDeliveryEstimate {
  storeId: number;
  storeName: string | null;
  /** `delivery_fee.price`; `null` when the row carried no `delivery_fee` → out of zone. */
  fee: number | null;
  /** True when the row has no `delivery_fee` object at all. */
  outOfZone: boolean;
  isFree: boolean;
  /** `delivery_time_min` in minutes; `null` when not sent. */
  minutesMin: number | null;
  zoneId: number | null;
  /** Baku wall-clock `HH:mm` with a fake `Z` — read literally. */
  openTime: string | null;
  closeTime: string | null;
}

const nullableString = (v: unknown): string | null => {
  const s = str(v).trim();
  return s.length > 0 ? s : null;
};

const nullableNumber = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : num(v);

function parseEstimate(json: unknown): StoreDeliveryEstimate {
  const o = asObj(json);
  const hasFee = o.delivery_fee !== null && o.delivery_fee !== undefined;
  const fee = asObj(o.delivery_fee);
  const translations = asList(o.store_translations).map(asObj);

  return {
    storeId: num(o.id),
    storeName: nullableString(o.name ?? translations[0]?.name),
    fee: hasFee ? money(fee.price) : null,
    outOfZone: !hasFee,
    isFree: bool(o.is_delivery_free) || (hasFee && money(fee.price) === 0),
    minutesMin: nullableNumber(o.delivery_time_min),
    zoneId: nullableNumber(o.zone_id),
    openTime: nullableString(o.open_time),
    closeTime: nullableString(o.close_time),
  };
}

export function parseDeliveryEstimates(json: unknown): StoreDeliveryEstimate[] {
  const o = asObj(json);
  const rows = Array.isArray(json) ? json : asList(o.stores ?? o.items ?? o.data);
  return rows.map(parseEstimate).filter((row) => row.storeId > 0);
}

export const estimateFor = (
  estimates: readonly StoreDeliveryEstimate[] | undefined,
  storeId: number,
): StoreDeliveryEstimate | null => estimates?.find((row) => row.storeId === storeId) ?? null;

/* -------------------------------------------------------------------------- */
/* Delivery address                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The slice of a saved address the cart passes to `POST v2/orders/checkout`.
 *
 * The address module (agent M9) owns the data and the "which address do we deliver to" rule —
 * `useSelectedAddress()` from `@/modules/address`. `hooks/use-delivery-address.ts` narrows its
 * `Address` to this view model, so nothing here parses an address payload.
 */
export interface DeliveryAddress {
  id: number;
  /** The free-text line the customer typed (the live `type` field). */
  line: string;
  /** `address_type`: home | office | other. */
  kind: string | null;
  latitude: number | null;
  longitude: number | null;
  isSelected: boolean;
}
