/**
 * Remote source for the coupons module — paths + params only, no mapping.
 *
 * Every call goes through `callEndpoint()` so the version prefix and the path come
 * from `core/api/contracts/endpoints.ts` and are never retyped here.
 */
import { callEndpoint, type RemoteResult } from '@/core/network';
import type {
  CouponsGlobalData,
  CouponsPromoApplyData,
  CouponsPromoCodesData,
} from '@/core/api/contracts/types';

export const couponsRemote = {
  /** `GET v1/coupons/global` — live: **verified**. `{data[], total}`. */
  global: (signal?: AbortSignal): RemoteResult<CouponsGlobalData> =>
    callEndpoint<CouponsGlobalData>('CouponsGlobal', { signal }),

  /** `GET v1/promo-code` — live: **verified**, but `{promoCodes: [], count}` on live. */
  promoCodes: (signal?: AbortSignal): RemoteResult<CouponsPromoCodesData> =>
    callEndpoint<CouponsPromoCodesData>('CouponsPromoCodes', { signal }),

  /**
   * `POST v1/promo-code/apply` — live: **unverified**.
   *
   * `code` is a guess, the response is an APK guess, and whether applying is stateful
   * server-side (or how a code is removed again) is unknown. The *verified* way to use a
   * code is to pass `promo_code` to `POST v2/orders/checkout`, which the cart module owns —
   * so nothing in this module treats a 2xx here as "applied".
   */
  applyPromoCode: (code: string, signal?: AbortSignal): RemoteResult<CouponsPromoApplyData> =>
    callEndpoint<CouponsPromoApplyData>('CouponsPromoApply', { body: { code }, signal }),
} as const;
