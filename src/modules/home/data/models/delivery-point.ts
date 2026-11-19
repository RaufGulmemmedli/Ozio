/**
 * The lat/lng `GET v1/stores/search` insists on (400 without it).
 *
 * The point is always the customer's own — the selected row of `GET v1/profile/address`
 * (`is_selected`, else the first row). When there is no saved address (or the visitor is a guest)
 * the city default is used so the rail can still render; it is a map centre, never a fee input.
 *
 * The shape is `@/modules/store`'s `DeliveryPoint` (`{lat, lng}`) plus the bits the home header
 * needs, so the resolved point can be handed straight to that module's `useStores({ point })` and
 * share one `stores/search` cache entry with `/market`.
 */
import { asList, asObj, bool, int, nullableStr, num } from '@/core/network';

export interface HomeDeliveryPoint {
  lat: number;
  lng: number;
  addressId: number | null;
  /** Top-bar line; null when the row has no text. */
  label: string | null;
  /** `true` when the point came from the city default rather than a saved address. */
  isFallback: boolean;
}

/**
 * Bakı city centre. `GET v1/location/cities` sends **no coordinates** (verified), so there is no
 * server value to read for the default point — this is a UI map centre only. It matches
 * `BAKU_CENTRE` in `@/modules/store`.
 */
export const CITY_DEFAULT_POINT: HomeDeliveryPoint = {
  lat: 40.4093,
  lng: 49.8671,
  addressId: null,
  label: null,
  isFallback: true,
};

/** `chooseDeliveryAddressRow`: the row marked selected, else the first saved row. */
export function parseDeliveryPoint(envelopeData: unknown): HomeDeliveryPoint {
  const rows = asList(Array.isArray(envelopeData) ? envelopeData : asObj(envelopeData).data).map(asObj);
  const row = rows.find((r) => bool(r.is_selected)) ?? rows[0];
  if (!row) return CITY_DEFAULT_POINT;

  const lat = num(row.lat, Number.NaN);
  const lng = num(row.lng, Number.NaN);
  const addressId = row.id === undefined ? null : int(row.id);
  const label = nullableStr(row.type) ?? nullableStr(row.address_details);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return { ...CITY_DEFAULT_POINT, addressId, label };
  }

  return { lat, lng, addressId, label, isFallback: false };
}
