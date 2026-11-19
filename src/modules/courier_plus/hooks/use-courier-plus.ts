'use client';

/**
 * Every read and write of the `courier_plus` demo backend, as TanStack hooks.
 *
 * All reads go through `useScreenQuery`, so `?preview=loading|empty|error|offline` works on every
 * data screen without touching the network. All writes invalidate exactly what changed.
 */
import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { unwrap, type Failure, type Page } from '@/core/network';
import { CACHE, scoped, useScreenQuery } from '@/core/query';

import { courierPlusKeys } from '../courier_plus.query-keys';
import { courierPlusRepository, type RegisterHubInput, type SaveRouteInput } from '../data/courier_plus.repository';
import type {
  CpDelivery,
  CpEarnings,
  CpHubDashboard,
  CpHubProfile,
  CpNearbyHub,
  CpOverview,
  CpParcelOffer,
  CpRoute,
} from '../data/models/courier-plus';

const EMPTY_OFFERS: Page<CpParcelOffer> = { items: [], total: 0, offset: 0, limit: 20 };
const EMPTY_HUBS: CpNearbyHub[] = [];

const EMPTY_OVERVIEW: CpOverview = {
  balance: 0,
  today: 0,
  month: 0,
  deliveries: 0,
  routeActive: false,
  hubRegistered: false,
  activeDeliveryId: null,
  nearbyHubCount: 0,
  hubCommission: 0,
};

const EMPTY_EARNINGS: CpEarnings = {
  balance: 0,
  today: 0,
  month: 0,
  deliveries: 0,
  history: [],
};

/* ------------------------------------------------------------------ reads */

/** The landing screen's single query. */
export function useCourierPlusOverview(): UseQueryResult<CpOverview, Failure> {
  return useScreenQuery<CpOverview>(
    {
      queryKey: courierPlusKeys.overview,
      queryFn: ({ signal }) => unwrap(courierPlusRepository.overview({ signal })),
      ...CACHE.profile,
    },
    { empty: EMPTY_OVERVIEW },
  );
}

/** The declared route — read by the route form, the matches header and the landing card. */
export function useCourierPlusRoute(): UseQueryResult<CpRoute, Failure> {
  return useScreenQuery<CpRoute>({
    queryKey: courierPlusKeys.route,
    queryFn: ({ signal }) => unwrap(courierPlusRepository.route({ signal })),
    ...CACHE.profile,
  });
}

/** The parcels the server matched against the route. */
export function useCourierPlusMatches(): UseQueryResult<Page<CpParcelOffer>, Failure> {
  const locale = useLocale();
  return useScreenQuery<Page<CpParcelOffer>>(
    {
      queryKey: scoped(courierPlusKeys.matches, locale),
      queryFn: ({ signal }) => unwrap(courierPlusRepository.matches({ locale, signal })),
      ...CACHE.orders,
    },
    { empty: EMPTY_OFFERS },
  );
}

export function useCourierPlusDelivery(offerId: string): UseQueryResult<CpDelivery, Failure> {
  const locale = useLocale();
  return useScreenQuery<CpDelivery>({
    queryKey: scoped(courierPlusKeys.delivery(offerId), locale),
    queryFn: ({ signal }) => unwrap(courierPlusRepository.delivery(offerId, { locale, signal })),
    enabled: offerId.length > 0,
    ...CACHE.tracking,
  });
}

export function useCourierPlusEarnings(): UseQueryResult<CpEarnings, Failure> {
  const locale = useLocale();
  return useScreenQuery<CpEarnings>(
    {
      queryKey: scoped(courierPlusKeys.earnings, locale),
      queryFn: ({ signal }) => unwrap(courierPlusRepository.earnings({ locale, signal })),
      ...CACHE.profile,
    },
    { empty: EMPTY_EARNINGS },
  );
}

/** `null` while the user is not a hub — a state, not an error. */
export function useCourierPlusHubProfile(): UseQueryResult<CpHubProfile | null, Failure> {
  return useScreenQuery<CpHubProfile | null>({
    queryKey: courierPlusKeys.hubProfile,
    queryFn: ({ signal }) => unwrap(courierPlusRepository.hubProfile({ signal })),
    ...CACHE.profile,
  });
}

/**
 * The hub panel. A `notFound` failure here means "not registered yet", which the view renders as
 * the gate; `retry: false` keeps that from being retried three times first.
 */
export function useCourierPlusHubDashboard(): UseQueryResult<CpHubDashboard, Failure> {
  return useScreenQuery<CpHubDashboard>({
    queryKey: courierPlusKeys.hubDashboard,
    queryFn: ({ signal }) => unwrap(courierPlusRepository.hubDashboard({ signal })),
    retry: false,
    ...CACHE.profile,
  });
}

export function useCourierPlusNearbyHubs(enabled = true): UseQueryResult<CpNearbyHub[], Failure> {
  const locale = useLocale();
  return useScreenQuery<CpNearbyHub[]>(
    {
      queryKey: scoped(courierPlusKeys.nearbyHubs, locale),
      queryFn: ({ signal }) => unwrap(courierPlusRepository.nearbyHubs({ locale, signal })),
      enabled,
      ...CACHE.catalog,
    },
    { empty: EMPTY_HUBS },
  );
}

/* ------------------------------------------------------------------ writes */

/** Declares (or re-declares) the route. Saving always switches courier mode on. */
export function useSaveCourierPlusRoute() {
  const client = useQueryClient();
  return useMutation<CpRoute, Failure, SaveRouteInput>({
    mutationFn: async (input) => unwrap(courierPlusRepository.saveRoute(input)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courierPlusKeys.route });
      void client.invalidateQueries({ queryKey: courierPlusKeys.matches });
      void client.invalidateQueries({ queryKey: courierPlusKeys.overview });
    },
  });
}

/** Takes an offer. A `notFound` failure means it was taken by someone else. */
export function useAcceptCourierPlusOffer() {
  const client = useQueryClient();
  const locale = useLocale();
  return useMutation<CpDelivery, Failure, string>({
    mutationFn: async (offerId) => unwrap(courierPlusRepository.accept(offerId, { locale })),
    onSuccess: (delivery) => {
      void client.invalidateQueries({ queryKey: courierPlusKeys.matches });
      void client.invalidateQueries({ queryKey: courierPlusKeys.overview });
      void client.invalidateQueries({ queryKey: courierPlusKeys.delivery(delivery.offer.id) });
    },
    onError: () => {
      // The board is stale either way — refresh it so the taken row disappears.
      void client.invalidateQueries({ queryKey: courierPlusKeys.matches });
    },
  });
}

/** One step forward in a hand-off. The last step credits the balance, server-side. */
export function useAdvanceCourierPlusDelivery(offerId: string) {
  const client = useQueryClient();
  const locale = useLocale();
  return useMutation<CpDelivery, Failure, void>({
    mutationFn: async () => unwrap(courierPlusRepository.advance(offerId, { locale })),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courierPlusKeys.delivery(offerId) });
      void client.invalidateQueries({ queryKey: courierPlusKeys.overview });
      void client.invalidateQueries({ queryKey: courierPlusKeys.earnings });
    },
  });
}

export function useRegisterCourierPlusHub() {
  const client = useQueryClient();
  return useMutation<CpHubProfile, Failure, RegisterHubInput>({
    mutationFn: async (input) => unwrap(courierPlusRepository.registerHub(input)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courierPlusKeys.hubProfile });
      void client.invalidateQueries({ queryKey: courierPlusKeys.hubDashboard });
      void client.invalidateQueries({ queryKey: courierPlusKeys.overview });
    },
  });
}

/**
 * Checks a hand-over code against the server. The code is passed straight through and is never
 * logged, stored or put in a query key.
 */
export function useCourierPlusHandOver() {
  const client = useQueryClient();
  const mutation = useMutation<void, Failure, string>({
    mutationFn: async (code) => unwrap(courierPlusRepository.handOver(code)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courierPlusKeys.hubDashboard });
      void client.invalidateQueries({ queryKey: courierPlusKeys.overview });
    },
  });

  const submit = useCallback(
    (code: string) => mutation.mutateAsync(code).then(() => true).catch(() => false),
    [mutation],
  );

  return { submit, isPending: mutation.isPending, failure: mutation.error, reset: mutation.reset };
}
