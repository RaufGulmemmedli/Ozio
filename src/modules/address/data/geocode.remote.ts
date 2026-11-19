/**
 * Geocoding — **not part of the Ozio API**.
 *
 * `api/address.md`: "Geocoding / reverse geocoding does not exist in the API." The Flutter app
 * calls an external provider (Photon); the web needs its own. Until one is chosen, the UI is built
 * against the two functions below and they are served by an MSW stub under
 * `/api/mock/address/geocode/…` (see `address.mock.ts`), with az / ru / en fixtures of real Baku
 * street names.
 *
 * ┌──────────────────────────────────────────────────────────────────────────────────────────┐
 * │ THE SWAP POINT                                                                           │
 * │                                                                                          │
 * │ Replace `GEOCODE_PROVIDER` with a real provider and nothing else in the app changes:      │
 * │ every screen goes through `geocodeSearch` / `reverseGeocode` and the `GeoPlace` model.    │
 * │                                                                                          │
 * │   const GEOCODE_PROVIDER: GeocodeProvider = {                                            │
 * │     search: (q, locale, signal) => remote.get('<provider path>', { q, lang: locale }, …), │
 * │     reverse: (lat, lng, locale, signal) => remote.get('<provider path>', { lat, lng }, …),│
 * │   };                                                                                     │
 * │                                                                                          │
 * │ A real provider belongs behind the BFF (its key must not reach the browser), so the path  │
 * │ would be a same-origin BFF route — never a third-party host called from the client.       │
 * └──────────────────────────────────────────────────────────────────────────────────────────┘
 */
import { remote, type RemoteResult } from '@/core/network';

/** The mock namespace. All stub traffic lives here — never the real API host. */
export const GEOCODE_MOCK_MODULE = 'address';

export interface GeocodeProvider {
  search(query: string, locale: string, signal?: AbortSignal): RemoteResult<unknown>;
  reverse(lat: number, lng: number, locale: string, signal?: AbortSignal): RemoteResult<unknown>;
}

/**
 * Registers the MSW handlers on first use.
 *
 * `address` is not in `core/mocks/modules.ts` (that list is the mock-only modules, and this module
 * is real-API with one stubbed capability), so the handlers are registered lazily from here.
 * `registerMockHandlers` forwards late registrations into the running worker, so this works
 * whenever it happens.
 */
let mockReady: Promise<void> | null = null;
async function ensureGeocodeStub(): Promise<void> {
  if (typeof window === 'undefined') return;
  mockReady ??= import('./address.mock').then(
    () => undefined,
    () => undefined,
  );
  await mockReady;
}

/** The stub provider. Swap this const for a real one — see the box above. */
const GEOCODE_PROVIDER: GeocodeProvider = {
  search: (query, locale, signal) =>
    remote
      .mock(GEOCODE_MOCK_MODULE)
      .get<unknown>('geocode/search', { q: query, locale }, { signal }),
  reverse: (lat, lng, locale, signal) =>
    remote
      .mock(GEOCODE_MOCK_MODULE)
      .get<unknown>('geocode/reverse', { lat, lng, locale }, { signal }),
};

export const geocodeRemote = {
  search: async (query: string, locale: string, signal?: AbortSignal) => {
    await ensureGeocodeStub();
    return GEOCODE_PROVIDER.search(query, locale, signal);
  },
  reverse: async (lat: number, lng: number, locale: string, signal?: AbortSignal) => {
    await ensureGeocodeStub();
    return GEOCODE_PROVIDER.reverse(lat, lng, locale, signal);
  },
} as const;
