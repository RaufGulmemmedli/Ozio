/**
 * `?preview=` seeds for the store screens (04-data-layer.md §"Preview states").
 *
 * **Visual-QA fixtures only**: `useScreenQuery` hands them out instead of a request and
 * `PREVIEW_ENABLED` is false in production, so nothing here can reach a customer. The numbers are
 * the ones `app-store.html` / `app-store-closed.html` print, so a screenshot matches the frame.
 *
 * Supported: `/market` → `loading` · `empty` · `error` · `offline` · `closed`;
 * `/market/store/[id]` and `/market/category/[id]` → the same five. `closed` needs no fixture:
 * it keeps the real store and only forces the closed state, which is how AX7 behaves on live.
 */
import type { StoreDetail } from './models/store';

const hours = (open: string, close: string) => {
  const [oh = '0', om = '0'] = open.split(':');
  const [ch = '0', cm = '0'] = close.split(':');
  return {
    open,
    close,
    openMinutes: Number(oh) * 60 + Number(om),
    closeMinutes: Number(ch) * 60 + Number(cm),
    allDay: false,
  };
};

/** The store the export draws: "Ozio Market", 09:00–23:00, 25–35 dəq, 1,50 ₼ delivery, 4,8. */
export function previewStoreDetail(): StoreDetail {
  return {
    id: 1,
    name: 'Ozio Market',
    address: 'Bakı, Nərimanov',
    logoUrl: null,
    rating: 4.8,
    storeCategoryId: 1,
    storeCategoryName: 'Market',
    moduleType: 'market',
    isWholesale: false,
    hasPacket: true,
    hours: hours('09:00', '23:00'),
    deliveryTimeMin: 25,
    deliveryTimeMax: 35,
    preparationTime: 10,
    deliveryFee: 1.5,
    isDeliveryFree: false,
    distanceKm: 1.2,
    bonusPercentage: 1.5,
    currencyCode: 'AZN',
    deliversHere: true,
    isFavorite: false,
    holidays: [],
    brandNames: [],
  };
}
