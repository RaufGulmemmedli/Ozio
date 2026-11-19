/**
 * Address domain model (api/address.md).
 *
 * The **read** shape is verified (2026-11-12). Two traps live in it:
 *  - `type` is NOT the kind of address — it holds the free-text address line the user typed.
 *    The kind is in `address_type` (`home|office|other`).
 *  - `isCurrentLocation` / `distanceMeters` exist on the **list** only, not on `GET …/{id}`.
 *
 * The **write** shape is unverified; everything about it lives in `toAddressWriteBody` below,
 * which is the single place to change when a live capture settles it.
 */
import { asList, asObj, bool, int, nullableNum, nullableStr, num, str } from '@/core/network';

/* ------------------------------------------------------------------ kinds */

export type AddressKind = 'home' | 'office' | 'other';

export const ADDRESS_KINDS: readonly AddressKind[] = ['home', 'office', 'other'];

/** `address_type` → kind. Anything unknown (and `block_type`'s values) becomes `other`. */
export function parseAddressKind(raw: unknown): AddressKind {
  const text = str(raw).trim().toLowerCase();
  if (text === 'home' || text === 'ev' || text === 'house') return 'home';
  if (text === 'office' || text === 'work' || text === 'iş' || text === 'is') return 'office';
  return 'other';
}

/* ------------------------------------------------------------------ zones */

export type ZoneTone = 'brand' | 'sky' | 'violet';

/**
 * One delivery zone, as it would arrive on the address row's `zones` key.
 *
 * `zones` is **null on every live row** and there is no zone endpoint, so this parser exists for
 * the day the server fills it in; until then `parseZones` returns `[]` and the zone screen renders
 * its "not available" state. Fees, minimums and ETAs are server data and are never computed here
 * (BUILD-CONTRACT rule 7).
 */
export interface AddressZone {
  id: string;
  name: string;
  tone: ZoneTone;
  /** District names the server listed for the zone. */
  districts: string[];
  /** Whatever the server calls the ETA ("25-35 dəq"), verbatim. `null` when absent. */
  etaText: string | null;
  deliveryFee: number | null;
  minOrder: number | null;
  freeDeliveryFrom: number | null;
  /** True when the address itself falls inside this zone, when the server says so. */
  contains: boolean;
}

const ZONE_TONES: readonly ZoneTone[] = ['brand', 'sky', 'violet'];

function pick(row: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function parseDistricts(raw: unknown): string[] {
  if (typeof raw === 'string') {
    return raw
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
  return asList(raw)
    .map((entry) =>
      typeof entry === 'string' ? entry.trim() : str(pick(asObj(entry), ['name', 'title'])).trim(),
    )
    .filter((name) => name.length > 0);
}

export function parseZones(raw: unknown): AddressZone[] {
  const rows = Array.isArray(raw) ? raw : asList(asObj(raw).zones);
  const out: AddressZone[] = [];
  rows.forEach((entry, index) => {
    const row = asObj(entry);
    const name = str(pick(row, ['name', 'zone_name', 'title'])).trim();
    const id = str(pick(row, ['id', 'zone_id'])).trim() || `zone-${index}`;
    if (!name && Object.keys(row).length === 0) return;
    out.push({
      id,
      name,
      tone: ZONE_TONES[index % ZONE_TONES.length],
      districts: parseDistricts(pick(row, ['districts', 'areas', 'regions'])),
      etaText: nullableStr(pick(row, ['eta', 'delivery_time', 'duration', 'eta_text'])),
      deliveryFee: nullableNum(pick(row, ['delivery_fee', 'fee', 'price'])),
      minOrder: nullableNum(pick(row, ['min_order', 'minimum_order', 'min_order_amount'])),
      freeDeliveryFrom: nullableNum(pick(row, ['free_delivery_from', 'free_from', 'free_delivery'])),
      contains: bool(pick(row, ['contains', 'is_current', 'in_zone']), false),
    });
  });
  return out;
}

/* ------------------------------------------------------------------ address */

/**
 * Azerbaijan's bounding box — a coordinate outside it is junk, not a location.
 * (The partner branch rows prove the API does send junk coordinates.)
 */
const AZ_BOUNDS = { minLat: 38.3, maxLat: 42.0, minLng: 44.7, maxLng: 50.6 } as const;

export interface LatLng {
  lat: number;
  lng: number;
}

export function usablePoint(lat: unknown, lng: unknown): LatLng | null {
  if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') {
    return null;
  }
  const la = num(lat, Number.NaN);
  const ln = num(lng, Number.NaN);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < AZ_BOUNDS.minLat || la > AZ_BOUNDS.maxLat) return null;
  if (ln < AZ_BOUNDS.minLng || ln > AZ_BOUNDS.maxLng) return null;
  return { lat: la, lng: ln };
}

/** A saved delivery address, as the API returns it. */
export interface Address {
  id: number;
  /** The live `type` field: the **free-text address line** ("Nərimanov, Ə. Rəcəbli küç. 12"). */
  line: string;
  /** The live `address_type`: what the address is for. */
  kind: AddressKind;
  personName: string | null;
  /** E.164 when the server sent one. */
  phone: string | null;
  point: LatLng | null;
  road: string | null;
  buildingName: string | null;
  entranceNumber: string | null;
  floor: string | null;
  apartmentRoom: string | null;
  /** The courier note ("Domofon işləmir, zəng edin"). */
  details: string | null;
  /**
   * The server's `is_selected`. **Not** the app's delivery-address flag: every live row can be
   * `false` at once, and there is no working endpoint to change it, so the UI's source of truth is
   * `usePrefs().selectedAddressId`.
   */
  isSelectedOnServer: boolean;
  zones: AddressZone[];
  /** List only — absent on `GET …/{id}`. */
  isCurrentLocation: boolean;
  /** List only — metres from the point the list was asked about, when it was given one. */
  distanceMeters: number | null;
}

export function parseAddress(raw: unknown): Address {
  const row = asObj(raw);
  return {
    id: int(pick(row, ['id', 'address_id']), 0),
    // `type` first (verified read key), then the APK-era aliases.
    line: str(
      pick(row, ['type', 'address_line', 'delivery_address', 'actual_address', 'address']),
    ).trim(),
    kind: parseAddressKind(pick(row, ['address_type', 'block_type'])),
    personName: nullableStr(pick(row, ['person_name', 'name'])),
    phone: nullableStr(pick(row, ['phone', 'phone_number'])),
    point: usablePoint(
      pick(row, ['lat', 'latitude']),
      pick(row, ['lng', 'longitude', 'long']),
    ),
    road: nullableStr(pick(row, ['road', 'street'])),
    buildingName: nullableStr(pick(row, ['building_name', 'building'])),
    entranceNumber: nullableStr(pick(row, ['entrance_number', 'entrance'])),
    floor: nullableStr(pick(row, ['floor'])),
    apartmentRoom: nullableStr(pick(row, ['apartment_room', 'apartment', 'flat'])),
    details: nullableStr(pick(row, ['address_details', 'actual_address_details', 'note'])),
    isSelectedOnServer: bool(pick(row, ['is_selected', 'is_default', 'selected']), false),
    zones: parseZones(row.zones),
    isCurrentLocation: bool(pick(row, ['isCurrentLocation', 'is_current_location']), false),
    distanceMeters: nullableNum(pick(row, ['distanceMeters', 'distance_meters', 'distance'])),
  };
}

/** The list arrives as `data.addresses | data.data | data.items | a bare array` (tolerant). */
export function parseAddresses(raw: unknown): Address[] {
  const rows = Array.isArray(raw)
    ? raw
    : (() => {
        const holder = asObj(raw);
        for (const key of ['addresses', 'data', 'items', 'rows', 'results']) {
          if (Array.isArray(holder[key])) return holder[key] as unknown[];
        }
        return [];
      })();
  return rows.map(parseAddress).filter((address) => address.id > 0);
}

/**
 * App-wide delivery-address rule (`chooseDeliveryAddressRow`, api/address.md): the row the user
 * picked locally, else the first row that has coordinates, else the first row.
 */
export function chooseDeliveryAddress(
  addresses: readonly Address[],
  selectedId: number | null,
): Address | null {
  if (addresses.length === 0) return null;
  if (selectedId !== null) {
    const picked = addresses.find((a) => a.id === selectedId);
    if (picked) return picked;
  }
  return addresses.find((a) => a.point !== null) ?? addresses[0] ?? null;
}

/* ============================================================================================
 * WRITE BODY — the single place the POST / PUT payload is built.
 * ==========================================================================================*/

/** What the form collects. Field names mirror the **verified read** shape, not the APK guess. */
export interface AddressInput {
  /** The address line (the server returns it as `type`). */
  line: string;
  kind: AddressKind;
  personName?: string | null;
  /** E.164 (`normalizeToE164`), or null. */
  phone?: string | null;
  point?: LatLng | null;
  road?: string | null;
  buildingName?: string | null;
  entranceNumber?: string | null;
  floor?: string | null;
  apartmentRoom?: string | null;
  details?: string | null;
  /** Sent on the PUT that tries to make this row the default. */
  isSelected?: boolean;
  cityId?: number | null;
}

/**
 * **UNVERIFIED — this is the only guess in the module, and it lives here alone.**
 *
 * `POST v1/profile/address` and `PUT v1/profile/address/{id}` have never been called. The APK
 * contains two key sets (`address_line/phone_number/latitude/longitude` and
 * `type/phone/lat/lng`), and the documentation cannot say which the server wants.
 *
 * Decision: send the **verified read keys**. A read response is the only real evidence of the
 * server's own vocabulary, and the same row shape round-trips on every other Ozio resource.
 * `lat`/`lng` go as **numbers** (JSON numbers are accepted where decimal strings are returned on
 * every other endpoint of this API).
 *
 * To switch to the APK vocabulary — one line — set `ADDRESS_WRITE_INCLUDE_APK_ALIASES` to `true`:
 * the body then carries both key sets, which is the next thing to try if the read keys 422.
 */
export const ADDRESS_WRITE_INCLUDE_APK_ALIASES = false;

export function toAddressWriteBody(input: AddressInput): Record<string, unknown> {
  const text = (value: string | null | undefined): string | null => {
    const trimmed = (value ?? '').trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  /** Verified read vocabulary. */
  const body: Record<string, unknown> = {
    type: input.line.trim(),
    address_type: input.kind,
    person_name: text(input.personName),
    phone: text(input.phone),
    road: text(input.road),
    building_name: text(input.buildingName),
    entrance_number: text(input.entranceNumber),
    floor: text(input.floor),
    apartment_room: text(input.apartmentRoom),
    address_details: text(input.details),
    lat: input.point ? input.point.lat : null,
    lng: input.point ? input.point.lng : null,
  };

  if (input.isSelected !== undefined) body.is_selected = input.isSelected;
  if (input.cityId !== null && input.cityId !== undefined) body.city_id = input.cityId;

  if (ADDRESS_WRITE_INCLUDE_APK_ALIASES) {
    Object.assign(body, {
      address_line: body.type,
      phone_number: body.phone,
      latitude: body.lat,
      longitude: body.lng,
      delivery_address: body.type,
      address_details: body.address_details,
    });
  }

  return body;
}

/** A saved row → form values, for the edit flow and for the `PUT` that resends the whole row. */
export function toAddressInput(address: Address): AddressInput {
  return {
    line: address.line,
    kind: address.kind,
    personName: address.personName,
    phone: address.phone,
    point: address.point,
    road: address.road,
    buildingName: address.buildingName,
    entranceNumber: address.entranceNumber,
    floor: address.floor,
    apartmentRoom: address.apartmentRoom,
    details: address.details,
  };
}

/* ------------------------------------------------------------------ cities */

/**
 * A delivery city — `GET v1/location/cities?country_id=1` (verified; `country_id` is REQUIRED,
 * 400 without it). The rows carry **no `name` and no coordinates**: only
 * `{id, city_translations:[{name, locale}], countries:{…}}`.
 */
export interface City {
  id: number;
  name: string;
  countryId: number | null;
}
