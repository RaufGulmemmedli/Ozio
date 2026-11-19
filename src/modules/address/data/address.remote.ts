/**
 * Address remote source — paths only. Resolved through `callEndpoint()` so the version prefix and
 * the live status come from `core/api/contracts/endpoints.ts`.
 *
 * | endpoint | path | live |
 * | --- | --- | --- |
 * | `AddressList` | `GET v1/profile/address` | **verified** |
 * | `AddressGet` | `GET v1/profile/address/{id}` | **verified** (404 "address not found") |
 * | `AddressCreate` | `POST v1/profile/address` | unverified (body guess — `toAddressWriteBody`) |
 * | `AddressUpdate` | `PUT v1/profile/address/{id}` | unverified (same body question) |
 * | `AddressDelete` | `DELETE v1/profile/address/{id}` | unverified (method inferred) |
 * | `AuthCities` | `GET v1/location/cities?country_id=1` | **verified** (`country_id` REQUIRED) |
 *
 * `PATCH v1/profile/address/{id}` (`AddressPatch`, `live: not-found`) is **never referenced here**.
 * It answers 404 `Cannot PATCH …` on live, and `endpoint()` would throw on it by design.
 */
import { DEFAULT_COUNTRY_ID } from '@/core/api/contracts/endpoints';
import { callEndpoint, type RemoteResult } from '@/core/network';
import type { AddressGetData, AddressListData, AuthCitiesData } from '@/core/api/contracts/types';

export const addressRemote = {
  list: (query?: { lat?: number; lng?: number }, signal?: AbortSignal): RemoteResult<AddressListData> =>
    callEndpoint<AddressListData>('AddressList', {
      // A point is optional; with one the rows come back with `distanceMeters` filled in.
      query: query?.lat !== undefined && query?.lng !== undefined ? { lat: query.lat, lng: query.lng } : undefined,
      signal,
    }),

  detail: (id: number, signal?: AbortSignal): RemoteResult<AddressGetData> =>
    callEndpoint<AddressGetData>('AddressGet', { params: { id }, signal }),

  /** UNVERIFIED. `body` must come from `toAddressWriteBody` — the single place it is built. */
  create: (body: Record<string, unknown>): RemoteResult<unknown> =>
    callEndpoint<unknown>('AddressCreate', { body }),

  /** UNVERIFIED. Also the only attempt available for "make this the default address". */
  update: (id: number, body: Record<string, unknown>): RemoteResult<unknown> =>
    callEndpoint<unknown>('AddressUpdate', { params: { id }, body }),

  /** UNVERIFIED (method inferred). Confirm destructively before calling. */
  remove: (id: number): RemoteResult<unknown> =>
    callEndpoint<unknown>('AddressDelete', { params: { id } }),

  /** `country_id` is REQUIRED — the server answers 400 "Bad request" without it. */
  cities: (countryId: number = DEFAULT_COUNTRY_ID, signal?: AbortSignal): RemoteResult<AuthCitiesData> =>
    callEndpoint<AuthCitiesData>('AuthCities', { query: { country_id: countryId }, signal }),
} as const;
