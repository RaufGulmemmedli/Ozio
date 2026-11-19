/**
 * A geocoding result.
 *
 * **Geocoding does not exist in the Ozio API** (api/address.md). This type is the contract of the
 * internal interface the UI is written against — `geocodeSearch(query)` / `reverseGeocode(lat,lng)`
 * — which is served by the MSW stub under `/api/mock/address/…` until a real provider is wired in.
 */
import { asObj, nullableStr, num, str } from '@/core/network';

export interface GeoPlace {
  id: string;
  /** The one-line label shown in the result row and in the map caption. */
  label: string;
  /** Street / house part, when the provider separates it. */
  street: string | null;
  /** District or settlement ("Nərimanov"). */
  district: string | null;
  city: string | null;
  lat: number;
  lng: number;
}

export function parseGeoPlace(raw: unknown): GeoPlace | null {
  const row = asObj(raw);
  const lat = num(row.lat, Number.NaN);
  const lng = num(row.lng, Number.NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const label = str(row.label).trim();
  if (!label) return null;
  return {
    id: str(row.id).trim() || `${lat},${lng}`,
    label,
    street: nullableStr(row.street),
    district: nullableStr(row.district),
    city: nullableStr(row.city),
    lat,
    lng,
  };
}

export function parseGeoPlaces(raw: unknown): GeoPlace[] {
  const rows = Array.isArray(raw) ? raw : [];
  const out: GeoPlace[] = [];
  for (const row of rows) {
    const place = parseGeoPlace(row);
    if (place) out.push(place);
  }
  return out;
}
