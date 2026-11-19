'use client';

/**
 * Courier data hooks. Every screen reads through these; none of them touches `fetch` or `api()`.
 *
 * `useCourierMe` is the one the whole module hangs off: it carries the application status, the
 * shift, the summary tiles and the active delivery. While the application is `pending` it polls
 * every second, which is how the ~4 s auto-approval becomes visible on `/courier/apply/status`
 * **without a page reload**.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unwrap, type Failure } from '@/core/network';
import { CACHE, useScreenQuery } from '@/core/query';

import { courierKeys } from '../courier.query-keys';
import { courierRepository } from '../data/courier.repository';
import type {
  CourierApplication,
  CourierEarnings,
  CourierMe,
  CourierOrder,
  CourierStatus,
} from '../data/models/courier';

/** How fast the status screen notices the 4 s approval. */
export const COURIER_REVIEW_POLL_MS = 1000;
/** Offers refresh every ~15 s in the mock (screen spec). */
export const COURIER_OFFERS_POLL_MS = 15_000;

/**
 * What `?preview=empty` shows: an **approved courier on shift with an empty board**, i.e. the drawn
 * "Yaxınlıqda sifariş yoxdur" state (`ShJUa`). The "not a courier" gate (`tR9sg`) needs no preview
 * flag — it is the state a fresh demo account starts in.
 */
const EMPTY_ME: CourierMe = {
  status: 'active',
  application: null,
  shift: { online: true, openMinutes: 192 },
  earnings: {
    today: 0,
    week: 0,
    month: 0,
    balance: 0,
    deliveriesToday: 0,
    deliveriesTotal: 0,
    rating: 0,
    acceptanceRate: 0,
    nextPayout: null,
    days: [],
  },
  activeOrder: null,
};

export function useCourierMe() {
  return useScreenQuery<CourierMe>(
    {
      queryKey: courierKeys.me(),
      queryFn: ({ signal }) => unwrap(courierRepository.me(signal)),
      // Pending = a review in flight; keep reading so the approval shows up on its own.
      refetchInterval: (query) =>
        query.state.data?.status === 'pending' ? COURIER_REVIEW_POLL_MS : false,
      ...CACHE.profile,
    },
    { empty: EMPTY_ME },
  );
}

export function useCourierOffers(enabled: boolean) {
  return useScreenQuery<CourierOrder[]>(
    {
      queryKey: courierKeys.offers(),
      queryFn: ({ signal }) => unwrap(courierRepository.offers(signal)),
      enabled,
      refetchInterval: enabled ? COURIER_OFFERS_POLL_MS : false,
      ...CACHE.orders,
    },
    { empty: [] },
  );
}

export function useCourierOrder(id: string) {
  return useScreenQuery<CourierOrder>({
    queryKey: courierKeys.order(id),
    queryFn: ({ signal }) => unwrap(courierRepository.order(id, signal)),
    enabled: id !== '',
    ...CACHE.tracking,
  });
}

export function useCourierHistory() {
  return useScreenQuery<CourierOrder[]>(
    {
      queryKey: courierKeys.history(),
      queryFn: ({ signal }) => unwrap(courierRepository.history(signal)),
      ...CACHE.orders,
    },
    { empty: [] },
  );
}

export function useCourierEarnings() {
  return useScreenQuery<CourierEarnings>({
    queryKey: courierKeys.earnings(),
    queryFn: ({ signal }) => unwrap(courierRepository.earnings(signal)),
    ...CACHE.profile,
  });
}

/* ------------------------------------------------------------------ mutations */

/** Invalidate everything that `me` feeds, plus the offer board. */
function useCourierInvalidate() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: courierKeys.me() });
    void client.invalidateQueries({ queryKey: courierKeys.offers() });
    void client.invalidateQueries({ queryKey: courierKeys.earnings() });
    void client.invalidateQueries({ queryKey: courierKeys.history() });
  };
}

export function useSubmitCourierApplication() {
  const invalidate = useCourierInvalidate();
  return useMutation<CourierStatus, Failure, CourierApplication>({
    mutationFn: (application) => unwrap(courierRepository.submitApplication(application)),
    onSuccess: invalidate,
  });
}

export function useCourierShiftToggle() {
  const client = useQueryClient();
  return useMutation<CourierMe, Failure, boolean>({
    mutationFn: (online) => unwrap(courierRepository.setOnline(online)),
    onSuccess: (me) => {
      client.setQueryData(courierKeys.me(), me);
      void client.invalidateQueries({ queryKey: courierKeys.offers() });
    },
  });
}

export function useAcceptCourierOrder() {
  const client = useQueryClient();
  const invalidate = useCourierInvalidate();
  return useMutation<CourierOrder, Failure, string>({
    mutationFn: (id) => unwrap(courierRepository.accept(id)),
    onSuccess: (order) => {
      client.setQueryData(courierKeys.order(order.id), order);
      invalidate();
    },
  });
}

export function useDeclineCourierOrder() {
  const invalidate = useCourierInvalidate();
  return useMutation<void, Failure, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => unwrap(courierRepository.decline(id, reason)),
    onSuccess: invalidate,
  });
}

export function useAdvanceCourierOrder() {
  const client = useQueryClient();
  const invalidate = useCourierInvalidate();
  return useMutation<CourierOrder, Failure, string>({
    mutationFn: (id) => unwrap(courierRepository.advance(id)),
    onSuccess: (order) => {
      client.setQueryData(courierKeys.order(order.id), order);
      invalidate();
    },
  });
}

export function useCancelCourierOrder() {
  const invalidate = useCourierInvalidate();
  return useMutation<void, Failure, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => unwrap(courierRepository.cancel(id, reason)),
    onSuccess: invalidate,
  });
}
