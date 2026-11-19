'use client';

/**
 * The point `GET v1/stores/search` is asked about. `lat` + `lng` are REQUIRED (400 without), and
 * the response means "stores serving this point" — a point outside every zone returns `total: 0`.
 *
 * TODO(core): there is no shared "selected delivery point" source yet. The address module owns
 * `GET v1/profile/address` (which carries `lat`/`lng` per row) and `@/core/session`'s prefs store
 * only keeps `selectedAddressId` / `cityId`. Until a shared selector exists this falls back to the
 * Baku city centre so `/market` works for guests; swap the body for the shared hook when it lands.
 */
import { useMemo } from 'react';

import type { DeliveryPoint } from '../data/store.repository';

/** Baku city centre (Fountains Square) — a geographic constant, not a design value. */
export const BAKU_CENTRE: DeliveryPoint = { lat: 40.4093, lng: 49.8671 };

export interface DeliveryPointState {
  point: DeliveryPoint;
  /** `false` while the point is only the city-centre fallback (no saved address was used). */
  fromAddress: boolean;
}

export function useDeliveryPoint(): DeliveryPointState {
  return useMemo(() => ({ point: BAKU_CENTRE, fromAddress: false }), []);
}
