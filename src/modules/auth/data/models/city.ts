import { asList, asObj, int, pickTranslation } from '@/core/network';

/**
 * A selectable delivery city (`GET v1/location/cities?country_id=1`, live-verified).
 *
 * Live rows are `{ id, city_translations: [{ name, locale }], countries: {…} }` — there is **no
 * `name`, `display_name` or coordinate field**, and the live arrays carry only `az`. The label is
 * therefore resolved with `pickTranslation`, which falls back to az and then to the first row.
 *
 * `storeCount` and the "Tezliklə" (coming soon) flag shown in `sheher-sec.html` do **not** exist
 * in the payload, so they are never invented: the row simply has no meta line.
 */
export interface City {
  id: number;
  /** Already localized label; `''` when the row carries no usable translation. */
  name: string;
  countryId: number | null;
}

export function parseCity(json: unknown, locale: string): City {
  const row = asObj(json);
  const countries = asObj(row.countries);
  const countryId = int(countries.id, 0);
  return {
    id: int(row.id, 0),
    name: pickTranslation(row.city_translations, locale),
    countryId: countryId > 0 ? countryId : null,
  };
}

/** Never throws. Rows without an id or a label are dropped rather than rendered empty. */
export function parseCities(json: unknown, locale: string): City[] {
  return asList(json)
    .map((row) => parseCity(row, locale))
    .filter((city) => city.id > 0 && city.name.length > 0);
}

/** Case/diacritic-tolerant search for the "Şəhər axtar" field. */
export function matchesCityQuery(city: City, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('az');
  if (!q) return true;
  return city.name.toLocaleLowerCase('az').includes(q);
}
