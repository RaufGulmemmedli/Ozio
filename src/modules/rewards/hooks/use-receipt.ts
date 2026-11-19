'use client';

/**
 * N5 — the digital receipt, the one screen in this module that reads the **real** API.
 *
 * It does not fetch anything of its own: `useOrder` from `@/modules/orders` owns
 * `GET /customer/api/v2/orders/{id}`, so the order detail, the tracker and this page share one
 * request, one cache entry (`orderKeys.detail(id)`) and one tolerant parser. That also keeps the
 * gateway's "never two concurrent calls on one path" rule satisfied for free.
 *
 * The order-detail success shape is `live: 'unverified'`, so `receiptFromOrder` treats every field
 * as optional and `receiptIsEmpty` decides when there is nothing worth printing.
 *
 * `?preview=loading|empty|error` works because `useOrder` is built on `useScreenQuery` and takes a
 * seed; the empty seed below is what `?preview=empty` renders.
 */
import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import type { Failure } from '@/core/network';
import { useOrder, type OrderDetail } from '@/modules/orders';

import { receiptFromOrder, type Receipt } from '../data/models/receipt';

/** An order detail with nothing in it — what `?preview=empty` shows. */
const EMPTY_ORDER: OrderDetail = {
  id: 0,
  status: 'unknown',
  statusRaw: '',
  storeId: null,
  storeName: null,
  createdAt: null,
  deliveredAt: null,
  cancelledAt: null,
  cancelingReason: null,
  etaMinutes: null,
  items: [],
  thumbnails: [],
  history: [],
  totals: {
    itemsTotal: null,
    itemsMrp: null,
    discount: null,
    deliveryFee: null,
    serviceFee: null,
    packetFee: null,
    minimumOrderFee: null,
    tip: null,
    bonusPayment: null,
    payable: null,
    bonusEarned: null,
  },
  payment: {
    method: null,
    status: null,
    maskedCardNumber: null,
    cardBrand: null,
    failureReason: null,
  },
  delivery: {
    address: null,
    personName: null,
    phone: null,
    time: null,
    timeMinMinutes: null,
    timeMaxMinutes: null,
    isFree: false,
    outOfZone: false,
  },
  courier: {
    name: null,
    phone: null,
    rating: null,
    distanceMeters: null,
    latitude: null,
    longitude: null,
  },
  rating: null,
  courierRating: null,
};

export interface UseReceiptResult {
  /** The shared order query — drives the loading / error / retry states. */
  order: UseQueryResult<OrderDetail, Failure>;
  /** The receipt built from it, or `null` while there is no detail. */
  receipt: Receipt | null;
}

export function useReceipt(orderId: string): UseReceiptResult {
  const order = useOrder(orderId, { empty: EMPTY_ORDER });
  const detail = order.data;
  const receipt = useMemo(() => (detail ? receiptFromOrder(detail) : null), [detail]);
  return { order, receipt };
}
