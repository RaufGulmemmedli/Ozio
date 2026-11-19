'use client';

/**
 * The delivery point the checkout calculation needs — **owned by agent M9**.
 *
 * `@/modules/address` is the only source: `useSelectedAddress()` applies the app-wide
 * `chooseDeliveryAddressRow` rule and always hands back a `point`, falling back to the selected
 * city's centre and flagging that with `isFallback`. Nothing about addresses is re-implemented
 * here; this file only narrows that result to the four fields the cart passes to
 * `POST v2/orders/checkout` (`address_id`, `latitude`, `longitude`, plus the line to print).
 *
 * `address_id` is sent **only** for a real saved address. Without it the server answers 200 with
 * `purchasing_disabled: true` + `address_incomplete`, which is exactly the state the summary shows.
 */
import { useMemo } from 'react';

import { useSelectedAddress } from '@/modules/address';

import type { DeliveryAddress } from '../data/models/delivery';
import { useCartSelection } from './use-cart-selection';

export interface DeliveryAddressState {
  /** The address the order would go to; `null` when the customer has saved none. */
  address: DeliveryAddress | null;
  /** The point for `orders/checkout` / `stores/search`. `null` only while the city is unknown. */
  point: { lat: number; lng: number } | null;
  /** True when `point` is a city-centre guess rather than a saved address. */
  isFallback: boolean;
  isPending: boolean;
  isError: boolean;
}

export function useDeliveryAddress(): DeliveryAddressState {
  const selected = useSelectedAddress();
  const overrideId = useCartSelection((state) => state.addressId);

  return useMemo(() => {
    const row = selected.address;
    // The cart's own override wins when the customer picked a different address for this order.
    const useOverride = overrideId !== null && row !== null && row.id !== overrideId;

    const address: DeliveryAddress | null = row
      ? {
          id: useOverride ? overrideId : row.id,
          line: row.line,
          kind: row.kind,
          latitude: row.point?.lat ?? null,
          longitude: row.point?.lng ?? null,
          isSelected: true,
        }
      : null;

    return {
      address,
      point: selected.point ? { lat: selected.point.lat, lng: selected.point.lng } : null,
      isFallback: selected.isFallback,
      isPending: selected.isLoading,
      isError: selected.isError,
    };
  }, [selected, overrideId]);
}
