'use client';

/**
 * Address hooks — the module's public data surface (M5 cart/checkout and M6 import these).
 *
 * The one rule to keep in mind: **the selected delivery address is client state.** The server has
 * no working "set default" route (`PATCH v1/profile/address/{id}` → 404 `Cannot PATCH …`), so
 * `usePrefs().selectedAddressId` is the source of truth and survives a reload through the
 * persisted `ozio.prefs` store.
 */
import { useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';

import { CACHE, useScreenQuery } from '@/core/query';
import { unwrap, type Failure } from '@/core/network';
import { usePrefs, useSession } from '@/core/session';

import { addressKeys } from '../address.query-keys';
import { addressRepository } from '../data/address.repository';
import {
  chooseDeliveryAddress,
  type Address,
  type AddressInput,
  type City,
  type LatLng,
} from '../data/models/address';
import { cityPointByName, DEFAULT_CITY_POINT } from '../lib/city-points';

const EMPTY_ADDRESSES: Address[] = [];
const EMPTY_CITIES: City[] = [];

/* ------------------------------------------------------------------ reads */

/**
 * `GET v1/profile/address` (verified).
 *
 * Gated on a real session: the endpoint is bearer-only, and `useSelectedAddress()` is called from
 * **guest-visible** screens (the partner map, the market), where firing it would answer 401 and
 * trip the session-expired bridge on every visit.
 */
export function useAddresses(point?: LatLng | null): UseQueryResult<Address[], Failure> {
  const authenticated = useSession((s) => s.status === 'authenticated');
  return useScreenQuery<Address[]>(
    {
      queryKey: addressKeys.list(point ?? null),
      queryFn: ({ signal }) => unwrap(addressRepository.list(point ?? null, signal)),
      enabled: authenticated,
      ...CACHE.profile,
    },
    { empty: EMPTY_ADDRESSES },
  );
}

/** `GET v1/profile/address/{id}` (verified). An unknown id resolves to a `notFound` failure. */
export function useAddress(id: number | null): UseQueryResult<Address, Failure> {
  const authenticated = useSession((s) => s.status === 'authenticated');
  return useScreenQuery<Address>({
    queryKey: addressKeys.detail(id ?? 0),
    queryFn: ({ signal }) => unwrap(addressRepository.detail(id ?? 0, signal)),
    enabled: authenticated && typeof id === 'number' && id > 0,
    ...CACHE.profile,
  });
}

/** `GET v1/location/cities?country_id=1` (verified; `country_id` is required). */
export function useCities(): UseQueryResult<City[], Failure> {
  const locale = useLocale();
  return useScreenQuery<City[]>(
    {
      queryKey: [...addressKeys.cities(), locale],
      queryFn: ({ signal }) => unwrap(addressRepository.cities(locale, signal)),
      ...CACHE.static,
    },
    { empty: EMPTY_CITIES },
  );
}

/* ------------------------------------------------------- the selected address */

export type SelectedPointSource = 'address' | 'city' | 'default';

export interface SelectedAddress {
  /** The chosen row, or `null` when the user has saved none (or the list is still loading). */
  address: Address | null;
  /**
   * The point every `stores/search` call needs. **Never `null`** once the city is known: it falls
   * back to the selected city's centre and then to Baku.
   */
  point: LatLng;
  /** `true` when `point` did NOT come from a saved address — hide delivery fee / ETA then. */
  isFallback: boolean;
  source: SelectedPointSource;
  /** The chosen id, i.e. `usePrefs().selectedAddressId` once it resolves against the list. */
  selectedId: number | null;
  cityId: number | null;
  isLoading: boolean;
  isError: boolean;
  error: Failure | null;
}

/**
 * The delivery address and **its coordinates** — `stores/search` (and therefore the whole market,
 * search, product and checkout flow) cannot be called without them.
 *
 * Resolution order (api/address.md `chooseDeliveryAddressRow` + the city fallback):
 *  1. the row whose id is in `usePrefs().selectedAddressId`;
 *  2. else the first row that has coordinates;
 *  3. else the first row;
 *  4. when that row has no point (or there are no rows): the selected city's centre;
 *  5. else Baku.
 *
 * Steps 4–5 set `isFallback: true`, so a caller can tell a real address from a guess.
 */
export function useSelectedAddress(): SelectedAddress {
  const selectedAddressId = usePrefs((s) => s.selectedAddressId);
  const cityId = usePrefs((s) => s.cityId);
  const list = useAddresses();
  const cities = useCities();

  const addresses = list.data ?? EMPTY_ADDRESSES;
  const city = useMemo(
    () => cities.data?.find((row) => row.id === cityId) ?? null,
    [cities.data, cityId],
  );

  return useMemo(() => {
    const address = chooseDeliveryAddress(addresses, selectedAddressId);
    if (address?.point) {
      return {
        address,
        point: address.point,
        isFallback: false,
        source: 'address' as const,
        selectedId: address.id,
        cityId,
        isLoading: list.isPending,
        isError: list.isError,
        error: list.error ?? null,
      };
    }
    const cityPoint = cityPointByName(city?.name);
    return {
      address,
      point: cityPoint ?? DEFAULT_CITY_POINT,
      isFallback: true,
      source: cityPoint ? ('city' as const) : ('default' as const),
      selectedId: address?.id ?? null,
      cityId,
      isLoading: list.isPending,
      isError: list.isError,
      error: list.error ?? null,
    };
  }, [addresses, selectedAddressId, city?.name, cityId, list.isPending, list.isError, list.error]);
}

/* ------------------------------------------------------------------ writes */

export interface SelectAddressResult {
  /** `true` when the unverified `PUT` also took on the server. The UI does not depend on it. */
  persistedOnServer: boolean;
}

/**
 * "Əsas et" — make a row the delivery address.
 *
 * **There is no verified endpoint for this.** `PATCH v1/profile/address/{id}` does not exist on
 * live (404 `Cannot PATCH …`) and is never called. What happens instead:
 *  1. `usePrefs().setSelectedAddressId(id)` — the source of truth, persisted to `localStorage`;
 *  2. one best-effort `PUT v1/profile/address/{id}` with the full row and `is_selected: true`;
 *  3. the address list is invalidated either way.
 *
 * A failing step 2 does not fail the mutation: the selection is already correct on the device.
 */
export function useSelectAddress(): UseMutationResult<SelectAddressResult, Failure, Address> {
  const queryClient = useQueryClient();
  const setSelectedAddressId = usePrefs((s) => s.setSelectedAddressId);

  return useMutation<SelectAddressResult, Failure, Address>({
    mutationFn: async (address) => {
      setSelectedAddressId(address.id);
      const persisted = await unwrap(addressRepository.trySelect(address));
      return { persistedOnServer: persisted };
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

/**
 * `POST v1/profile/address` — **unverified body** (`toAddressWriteBody`). A 2xx that carries no
 * address id is reported as a failure, never as a save.
 *
 * On success the new row becomes the selected delivery address when the caller asks for it.
 */
export function useCreateAddress(): UseMutationResult<
  Address,
  Failure,
  AddressInput & { makeSelected?: boolean }
> {
  const queryClient = useQueryClient();
  const setSelectedAddressId = usePrefs((s) => s.setSelectedAddressId);

  return useMutation<Address, Failure, AddressInput & { makeSelected?: boolean }>({
    mutationFn: (variables) => {
      const { makeSelected, ...input } = variables;
      void makeSelected; // applied in onSuccess, once the server has given the row an id
      return unwrap(addressRepository.create(input));
    },
    onSuccess: (saved, variables) => {
      if (variables.makeSelected && saved.id > 0) setSelectedAddressId(saved.id);
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

/** `PUT v1/profile/address/{id}` — unverified body, same single source as the create. */
export function useUpdateAddress(): UseMutationResult<
  Address,
  Failure,
  { id: number; input: AddressInput; makeSelected?: boolean }
> {
  const queryClient = useQueryClient();
  const setSelectedAddressId = usePrefs((s) => s.setSelectedAddressId);

  return useMutation<Address, Failure, { id: number; input: AddressInput; makeSelected?: boolean }>({
    mutationFn: ({ id, input }) => unwrap(addressRepository.update(id, input)),
    onSuccess: (_saved, variables) => {
      if (variables.makeSelected) setSelectedAddressId(variables.id);
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

/**
 * `DELETE v1/profile/address/{id}` — unverified, the method is inferred. The caller must confirm
 * destructively first (the view uses `confirmDialog`).
 */
export function useDeleteAddress(): UseMutationResult<number, Failure, number> {
  const queryClient = useQueryClient();
  const selectedAddressId = usePrefs((s) => s.selectedAddressId);
  const setSelectedAddressId = usePrefs((s) => s.setSelectedAddressId);

  return useMutation<number, Failure, number>({
    mutationFn: (id) => unwrap(addressRepository.remove(id)),
    onSuccess: (id) => {
      // A deleted row must not stay the delivery address.
      if (selectedAddressId === id) setSelectedAddressId(null);
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

/** Imperative "forget the selection" — used when a list no longer contains the selected id. */
export function useClearSelectedAddress(): () => void {
  const setSelectedAddressId = usePrefs((s) => s.setSelectedAddressId);
  return useCallback(() => setSelectedAddressId(null), [setSelectedAddressId]);
}
