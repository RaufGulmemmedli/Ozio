/**
 * City fallback points.
 *
 * `GET v1/location/cities?country_id=1` returns `{id, city_translations, countries}` and **no
 * coordinates**, but `stores/search` cannot be called without a `lat`/`lng` pair — which is why
 * `useSelectedAddress()` must still produce a point for a user who has saved no address yet.
 *
 * These are therefore **client-side city centres**, not server data, and every consumer is told so
 * through `isFallback: true` so a screen can hide the delivery fee / ETA rather than imply that
 * the point is the user's address. Add a row when a new delivery city appears; nothing here is a
 * fee, a zone or a distance (BUILD-CONTRACT rule 7 is untouched).
 */
import type { LatLng } from '../data/models/address';

export interface CityPoint extends LatLng {
  /** The az city name as `city_translations` spells it — the join key. */
  name: string;
}

export const CITY_POINTS: readonly CityPoint[] = [
  { name: 'Bakı', lat: 40.4093, lng: 49.8671 },
  { name: 'Sumqayıt', lat: 40.5855, lng: 49.6317 },
  { name: 'Xırdalan', lat: 40.4544, lng: 49.7553 },
  { name: 'Gəncə', lat: 40.6828, lng: 46.3606 },
  { name: 'Mingəçevir', lat: 40.7703, lng: 47.0496 },
  { name: 'Lənkəran', lat: 38.7529, lng: 48.8475 },
  { name: 'Şəki', lat: 41.1919, lng: 47.1706 },
  { name: 'Quba', lat: 41.3617, lng: 48.5128 },
] as const;

/** The default point when nothing at all is known: the capital. */
export const DEFAULT_CITY_POINT: CityPoint = CITY_POINTS[0];

function fold(text: string): string {
  return text
    .toLocaleLowerCase('az-AZ')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

/** The centre of a city by its (localized) name, or `null` when the name is not in the table. */
export function cityPointByName(name: string | null | undefined): CityPoint | null {
  if (!name) return null;
  const needle = fold(name);
  return CITY_POINTS.find((city) => fold(city.name) === needle) ?? null;
}
