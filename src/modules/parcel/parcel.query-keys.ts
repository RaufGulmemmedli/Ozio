/**
 * Query keys for the parcel module.
 *
 * First element is always `'parcel'`, so creating or cancelling a shipment can drop the whole
 * module with one `invalidateQueries({ queryKey: parcelKeys.all })`.
 */
import { moduleKeys } from '@/core/query';

import type { ParcelDraft } from './data/models/parcel';

/** The quote key is the priced part of the draft — nothing else changes the price. */
export const quoteKeyOf = (draft: ParcelDraft): string =>
  [
    draft.pickup.address.trim(),
    draft.dropoff.address.trim(),
    draft.spec.lengthCm,
    draft.spec.widthCm,
    draft.spec.heightCm,
    draft.spec.weightKg,
    draft.spec.fragile ? 'f' : '-',
  ].join('|');

export const parcelKeys = {
  ...moduleKeys('parcel'),
  /** `GET parcels/rules` — presets, limits, saved addresses and cards. */
  rules: () => ['parcel', 'rules'] as const,
  /** `POST parcels/quote` — keyed by the priced fields of the draft. */
  quote: (draft: ParcelDraft) => ['parcel', 'quote', quoteKeyOf(draft)] as const,
  /** `GET parcels` — newest first, filtered client-side by the chips. */
  list: () => ['parcel', 'list'] as const,
  /** `GET parcels/{id}` — polled while the shipment is in flight. */
  detail: (id: string) => ['parcel', 'detail', id] as const,
} as const;
