'use client';

/**
 * Parcel data hooks. Every screen reads through these; none of them touches `fetch` or `api()`.
 *
 * `useScreenQuery` gives `?preview=loading|empty|error` on each data screen for free.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery } from '@/core/query';

import {
  matchesParcelFilter,
  parcelIsActive,
  type Parcel,
  type ParcelDraft,
  type ParcelFilter,
  type ParcelQuote,
  type ParcelRules,
} from '../data/models/parcel';
import { parcelRepository } from '../data/parcel.repository';
import { parcelKeys, quoteKeyOf } from '../parcel.query-keys';

/** How often the tracking screen re-reads a shipment in flight (spec: ~10 s). */
export const PARCEL_POLL_MS = 10_000;

export function useParcelRules() {
  return useScreenQuery<ParcelRules>({
    queryKey: parcelKeys.rules(),
    queryFn: ({ signal }) => unwrap(parcelRepository.rules(signal)),
    ...CACHE.static,
  });
}

export function useParcels(filter: ParcelFilter = 'all') {
  const query = useScreenQuery<Parcel[]>(
    {
      queryKey: parcelKeys.list(),
      queryFn: ({ signal }) => unwrap(parcelRepository.list(signal)),
      ...CACHE.orders,
    },
    { empty: [] },
  );

  const all = query.data;
  const visible = useMemo(
    () => (all ?? []).filter((p) => matchesParcelFilter(p, filter)),
    [all, filter],
  );
  const counts = useMemo(
    () => ({
      all: all?.length ?? 0,
      active: (all ?? []).filter(parcelIsActive).length,
      delivered: (all ?? []).filter((p) => p.status === 'delivered').length,
      cancelled: (all ?? []).filter((p) => p.status === 'cancelled').length,
    }),
    [all],
  );

  return { ...query, visible, counts };
}

export function useParcelDetail(id: string) {
  return useScreenQuery<Parcel>({
    queryKey: parcelKeys.detail(id),
    queryFn: ({ signal }) => unwrap(parcelRepository.byId(id, signal)),
    enabled: id !== '',
    // A shipment in flight moves on its own, so keep reading while the tab is open.
    refetchInterval: (query) => {
      const row = query.state.data;
      return row && parcelIsActive(row) ? PARCEL_POLL_MS : false;
    },
    ...CACHE.tracking,
  });
}

/**
 * The live quote. Priced by the mock, keyed by the priced fields of the draft, and switched off
 * until both addresses are filled so an empty form does not fire a request.
 */
export function useParcelQuote(draft: ParcelDraft) {
  const ready = draft.pickup.address.trim() !== '' && draft.dropoff.address.trim() !== '';
  const key = quoteKeyOf(draft);

  const query = useScreenQuery<ParcelQuote>({
    queryKey: parcelKeys.quote(draft),
    queryFn: ({ signal }) => unwrap(parcelRepository.quote(draft, signal)),
    enabled: ready,
    retry: false,
    staleTime: 30_000,
    gcTime: 60_000,
  });

  return { ...query, ready, key };
}

export function useCreateParcel() {
  const client = useQueryClient();
  return useMutation<Parcel, Failure, { draft: ParcelDraft; quote: ParcelQuote }>({
    mutationFn: ({ draft, quote }) => unwrap(parcelRepository.create(draft, quote)),
    onSuccess: (row) => {
      client.setQueryData(parcelKeys.detail(row.id), row);
      void client.invalidateQueries({ queryKey: parcelKeys.list() });
    },
  });
}

export function useCancelParcel() {
  const client = useQueryClient();
  return useMutation<Parcel, Failure, string>({
    mutationFn: (id) => unwrap(parcelRepository.cancel(id)),
    onSuccess: (row) => {
      client.setQueryData(parcelKeys.detail(row.id), row);
      void client.invalidateQueries({ queryKey: parcelKeys.list() });
    },
  });
}
