/**
 * Client-side distance maths. There is no distance field on a branch row (`distanceMeters` only
 * exists on the **address list**), so "0,4 km" in the design is computed here from the user's
 * reference point, and only for the handful of branches that carry a usable coordinate.
 */

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance in metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Metres → the design's "0,4 km" / "28 km" (one decimal below 10 km, none above).
 * The number itself is formatted by the caller's locale formatter.
 */
export function distanceKm(meters: number): { value: number; fractionDigits: 0 | 1 } {
  const km = meters / 1000;
  return km < 10 ? { value: Math.round(km * 10) / 10, fractionDigits: 1 } : { value: Math.round(km), fractionDigits: 0 };
}

/**
 * Two points the API's 7 decimals cannot tell apart — used to spot the live rows whose
 * coordinates are a byte-identical copy of a delivery store's point (a placeholder, not a branch).
 */
export function samePoint(a: LatLng, b: LatLng): boolean {
  return Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7;
}
