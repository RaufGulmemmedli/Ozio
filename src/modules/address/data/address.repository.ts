/**
 * Address repository — envelope → domain model, always a `Result`, never a throw.
 *
 * Two rules are enforced here rather than in the UI:
 *  1. **A write is not a success without evidence.** `POST`/`PUT` are unverified, so a 2xx that
 *     carries no address row (or no id) is reported as a `Failure`, not as "saved".
 *  2. **`PATCH` is never called.** "Make this the default" is one `PUT` with the full row and
 *     `is_selected: true`; whatever the server answers, the UI's own selection is client state.
 */
import { pickTranslation } from '@/core/network';
import {
  Failure,
  asList,
  asObj,
  fail,
  int,
  isFail,
  mapResult,
  ok,
  str,
  type Result,
} from '@/core/network';

import { addressRemote } from './address.remote';
import {
  parseAddress,
  parseAddresses,
  toAddressWriteBody,
  type Address,
  type AddressInput,
  type City,
  type LatLng,
} from './models/address';

/** A write answered 2xx but without the saved row — we refuse to call that a success. */
const unconfirmed = (operation: string): Failure =>
  new Failure(
    'parse',
    `${operation}: the server answered 2xx without an address id — the write is unconfirmed.`,
  );

function addressFromWriteResponse(data: unknown): Address | null {
  // The response shape is unknown: a bare row, `{address: {...}}`, or `{data: {...}}`.
  const direct = parseAddress(data);
  if (direct.id > 0) return direct;
  const holder = asObj(data);
  for (const key of ['address', 'data', 'result']) {
    const nested = parseAddress(holder[key]);
    if (nested.id > 0) return nested;
  }
  return null;
}

export const addressRepository = {
  /** `GET v1/profile/address` (verified). With `point`, rows carry `distanceMeters`. */
  list: async (point?: LatLng | null, signal?: AbortSignal): Promise<Result<Address[]>> => {
    const res = await addressRemote.list(
      point ? { lat: point.lat, lng: point.lng } : undefined,
      signal,
    );
    return mapResult(res, (env) => parseAddresses(env.data));
  },

  /** `GET v1/profile/address/{id}` (verified). An unknown id is a `notFound` failure. */
  detail: async (id: number, signal?: AbortSignal): Promise<Result<Address>> => {
    const res = await addressRemote.detail(id, signal);
    if (isFail(res)) return res;
    const address = parseAddress(res.value.data);
    if (address.id <= 0) return fail(new Failure('notFound', 'address not found', 404));
    return ok(address);
  },

  /**
   * `POST v1/profile/address` — **unverified**. The body is built by `toAddressWriteBody`, the one
   * place the guess lives. A 2xx without an id is reported as a failure.
   */
  create: async (input: AddressInput): Promise<Result<Address>> => {
    const res = await addressRemote.create(toAddressWriteBody(input));
    if (isFail(res)) return res;
    const saved = addressFromWriteResponse(res.value.data);
    return saved ? ok(saved) : fail(unconfirmed('POST v1/profile/address'));
  },

  /**
   * `PUT v1/profile/address/{id}` — **unverified**. Sends the whole row (a partial body may or may
   * not be accepted, which is itself unknown).
   */
  update: async (id: number, input: AddressInput): Promise<Result<Address>> => {
    const res = await addressRemote.update(id, toAddressWriteBody(input));
    if (isFail(res)) return res;
    const saved = addressFromWriteResponse(res.value.data);
    // An update that echoes nothing is still an update: the caller refetches the list to confirm.
    return ok(saved ?? { ...parseAddress({}), id });
  },

  /**
   * "Make this the delivery address".
   *
   * There is **no verified endpoint**: `PATCH v1/profile/address/{id}` answers 404
   * `Cannot PATCH …` on live, so it must never be called. The single attempt is a `PUT` with the
   * full row plus `is_selected: true`. The result is advisory — the app's own selection lives in
   * `usePrefs().selectedAddressId`.
   */
  trySelect: async (address: Address): Promise<Result<boolean>> => {
    const res = await addressRemote.update(address.id, {
      ...toAddressWriteBody({
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
        isSelected: true,
      }),
    });
    // A failure is not fatal: the client-side selection has already been applied by the hook.
    return isFail(res) ? ok(false) : ok(true);
  },

  /** `DELETE v1/profile/address/{id}` — unverified, method inferred. */
  remove: async (id: number): Promise<Result<number>> => {
    const res = await addressRemote.remove(id);
    return mapResult(res, () => id);
  },

  /**
   * `GET v1/location/cities?country_id=1` (verified). Rows have no `name` — the label comes from
   * `city_translations` via `pickTranslation`, and there are **no coordinates** on the row.
   */
  cities: async (locale: string, signal?: AbortSignal): Promise<Result<City[]>> => {
    const res = await addressRemote.cities(undefined, signal);
    return mapResult(res, (env) =>
      asList(env.data)
        .map((raw): City => {
          const row = asObj(raw);
          return {
            id: int(row.id, 0),
            name:
              pickTranslation(row.city_translations, locale).trim() ||
              str(row.name).trim(),
            countryId: int(asObj(row.countries).id, 0) || null,
          };
        })
        .filter((city) => city.id > 0 && city.name.length > 0),
    );
  },
} as const;
