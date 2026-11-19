'use client';

/**
 * The checkout selection: everything the customer picks on the cart screen that changes the price.
 *
 * Every field here is an input to `POST v2/orders/checkout`, so **any** change triggers one
 * (serialised) recalculation — that is the whole point of keeping them in one store.
 *
 * `deliveryTime` is the exception: it has **no backend** (see `data/models/delivery-time.ts`) and is
 * deliberately *not* sent to checkout, so changing it does not recalculate anything.
 */
import { create } from 'zustand';

import { ASAP, type DeliveryTimeChoice } from '../data/models/delivery-time';
import type { PaymentMethod } from '../data/models/checkout';

export interface CartSelectionState {
  /** The cart being priced (`cart_id`). `null` → follow the bundle's most recent non-empty cart. */
  activeCartId: number | null;
  paymentMethod: PaymentMethod;
  paymentCardId: number | null;
  useBonus: boolean;
  promoCode: string | null;
  /** `tip_config.options[].value`, or `null` for no tip. */
  courierTip: number | null;
  /** Client-side only — never part of the checkout body. */
  deliveryTime: DeliveryTimeChoice;
  /** Address override; `null` = the app-wide "selected address" rule decides. */
  addressId: number | null;

  setActiveCart: (cartId: number | null) => void;
  setPaymentMethod: (method: PaymentMethod, cardId?: number | null) => void;
  setUseBonus: (use: boolean) => void;
  setPromoCode: (code: string | null) => void;
  setCourierTip: (tip: number | null) => void;
  setDeliveryTime: (choice: DeliveryTimeChoice) => void;
  setAddressId: (id: number | null) => void;
  reset: () => void;
}

const INITIAL = {
  activeCartId: null,
  paymentMethod: 'cash' as PaymentMethod,
  paymentCardId: null,
  useBonus: false,
  promoCode: null,
  courierTip: null,
  deliveryTime: ASAP,
  addressId: null,
};

export const useCartSelection = create<CartSelectionState>((set) => ({
  ...INITIAL,
  setActiveCart: (activeCartId) => set({ activeCartId }),
  setPaymentMethod: (paymentMethod, paymentCardId) =>
    set((state) => ({
      paymentMethod,
      paymentCardId: paymentCardId === undefined ? state.paymentCardId : paymentCardId,
    })),
  setUseBonus: (useBonus) => set({ useBonus }),
  setPromoCode: (promoCode) => set({ promoCode: promoCode && promoCode.length > 0 ? promoCode : null }),
  setCourierTip: (courierTip) => set({ courierTip }),
  setDeliveryTime: (deliveryTime) => set({ deliveryTime }),
  setAddressId: (addressId) => set({ addressId }),
  reset: () => set({ ...INITIAL }),
}));
