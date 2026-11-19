/**
 * `?preview=` seeds (04-data-layer.md §"Preview states"). These are **visual-QA fixtures only** —
 * `useScreenQuery` hands them out instead of a request, and `PREVIEW_ENABLED` is false in
 * production, so nothing here can reach a customer.
 *
 * Supported on `/cart`: `loading` · `empty` · `error` · `offline` · `closed`.
 * The numbers are the ones the design export prints, so a screenshot matches the frame.
 */
import type { CartBundle } from './models/cart';
import type { CheckoutCalc } from './models/checkout';
import type { StoreDeliveryEstimate } from './models/delivery';

const line = (
  id: number,
  name: string,
  quantity: number,
  linePrice: number,
  unitPrice: number,
  storeId: number,
  soldByGram = false,
) => ({
  id,
  productId: id,
  storeId,
  name,
  imageUrl: null,
  quantity,
  linePrice,
  lineMrp: linePrice,
  unitPrice,
  unitMrp: unitPrice,
  stock: soldByGram ? 12_000 : 40,
  minOrderQuantity: null,
  maxOrderQuantity: null,
  soldByGram,
  hasWeight: soldByGram,
  unitSymbol: soldByGram ? 'kq' : null,
  savedForLater: false,
  notes: null,
  addedAt: null,
});

/** The cart the export draws: 6 lines over 3 stores. */
export const previewBundle = (): CartBundle => ({
  carts: [
    {
      id: 901,
      status: 'active',
      storeId: 2,
      storeName: 'Ozio Market',
      openTime: '1970-01-01T08:00:00.000Z',
      closeTime: '1970-01-01T23:00:00.000Z',
      totals: { price: 14.73, mrp: 16.4 },
      lines: [
        line(119088, 'Qırmızı alma', 2, 4.98, 2.49, 2, true),
        line(119089, 'Təzə çörək', 2, 1.6, 0.8, 2),
        line(119090, 'Pomidor', 1, 3.1, 3.1, 2, true),
      ],
      itemsMap: { '119088': 2, '119089': 2, '119090': 1 },
      createdAt: null,
      updatedAt: '2026-11-18T09:00:00.000Z',
    },
    {
      id: 902,
      status: 'active',
      storeId: 5,
      storeName: 'Çörək evi',
      openTime: '1970-01-01T07:00:00.000Z',
      closeTime: '1970-01-01T21:00:00.000Z',
      totals: { price: 5.85, mrp: 5.85 },
      lines: [line(119101, 'Kruasan', 3, 5.85, 1.95, 5)],
      itemsMap: { '119101': 3 },
      createdAt: null,
      updatedAt: '2026-11-18T08:30:00.000Z',
    },
    {
      id: 903,
      status: 'active',
      storeId: 7,
      storeName: 'Süd məhsulları',
      openTime: '1970-01-01T09:00:00.000Z',
      closeTime: '1970-01-01T20:00:00.000Z',
      totals: { price: 3.4, mrp: 3.4 },
      lines: [line(119110, 'Süd 3,2%', 2, 3.4, 1.7, 7)],
      itemsMap: { '119110': 2 },
      createdAt: null,
      updatedAt: '2026-11-18T08:00:00.000Z',
    },
  ],
  storeCount: 3,
  itemCount: 5,
  activeCartId: 901,
});

/** The priced cart. `closed` flips `is_store_closed` + `purchasing_disabled` with a server reason. */
export const previewCalc = (preview: string | null): CheckoutCalc => {
  const closed = preview === 'closed';
  return {
    id: 'preview-checkout',
    amount: closed ? null : 11.73,
    breakdown: {
      itemTotalPrice: 14.73,
      itemTotalMrp: 16.4,
      totalDiscount: 1.67,
      minimumOrderFee: 0,
      serviceFee: 0,
      packetFee: 0,
      deliveryFee: 2,
      courierTip: 0,
      bonusPayment: 5,
    },
    delivery: { isFree: false, outOfZone: false, distanceMeters: 1840, isAccurate: true },
    tipConfig: { maxAllowedTip: 10, options: [1, 2, 3] },
    isStoreClosed: closed,
    purchasingDisabled: closed,
    purchasingDisabledReasons: closed ? ['Mağaza hazırda bağlıdır.'] : [],
    earnedBonus: 0.22,
    lastPaymentMethod: 'cash',
    appliedPromoCode: null,
    appliedPromoDiscount: null,
    cartUpdated: false,
    updatedItems: [],
    expiresAt: null,
  };
};

export const previewEstimates = (): StoreDeliveryEstimate[] => [
  {
    storeId: 2,
    storeName: 'Ozio Market',
    fee: 2,
    outOfZone: false,
    isFree: false,
    minutesMin: 30,
    zoneId: 1,
    openTime: null,
    closeTime: null,
  },
];
