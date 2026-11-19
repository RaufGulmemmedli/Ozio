/**
 * Remote source for the lottery / 10-lar / Ozio Plus endpoints.
 *
 * | operation | path | live |
 * | --- | --- | --- |
 * | `LotteryActive`          | `GET v1/lotteries/active`          | verified |
 * | `LotteryActiveDetails`   | `GET v1/lotteries/active/details`  | verified — `lottery_id` REQUIRED |
 * | `LotteryPolicy`          | `GET v1/lotteries/policy`          | verified |
 * | `LotteryTickets`         | `GET v1/lotteries/tickets`         | unverified — `lottery_id` REQUIRED |
 * | `PartnersTenCarts`       | `GET v1/ten-carts`                 | verified |
 * | `PartnersTenCartsAdd`    | `POST v1/ten-carts/add`            | unverified |
 * | `PartnersPlusCategories` | `GET v1/ozio-plus/categories`      | verified |
 * | `PartnersPlusCampaigns`  | `GET v1/ozio-plus/campaigns`       | verified |
 * | `PartnersPlusProducts`   | `GET v1/ozio-plus/products`        | verified |
 *
 * **`lottery_id` is structurally impossible to omit**: the two operations that answer
 * HTTP 500 without it take a required `lotteryId: number` as their first positional
 * argument, so there is no call shape that leaves it out. That is why neither this file
 * nor the repository has any handling for that 500.
 */
import { callEndpoint, type RemoteResult } from '@/core/network';
import type {
  LotteryActiveData,
  LotteryPolicyData,
  PartnersPlusCampaignsData,
  PartnersPlusCategoriesData,
  PartnersPlusProductsData,
  PartnersTenCartsData,
} from '@/core/api/contracts/types';

/** `limit` is capped at 50 server-side for `ozio-plus/products`. */
export const PLUS_MAX_LIMIT = 50;
/** `lotteries/tickets` defaults to 10. */
export const TICKETS_DEFAULT_LIMIT = 10;

export interface TicketsQuery {
  limit?: number;
  offset?: number;
}

export interface PlusProductsQuery {
  /** Chain id from `ozio-plus/categories`. Needed for `price_info` to be filled. */
  categoryId?: number;
  limit?: number;
  offset?: number;
}

export const lotteryRemote = {
  /** The active draw + this user's ticket count. */
  active: (signal?: AbortSignal): RemoteResult<LotteryActiveData> =>
    callEndpoint<LotteryActiveData>('LotteryActive', { signal }),

  /** `lottery_id` is required — hence the positional, non-optional parameter. */
  details: (lotteryId: number, signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint<unknown>('LotteryActiveDetails', { query: { lottery_id: lotteryId }, signal }),

  /** One ~4 KB HTML string in `data.content`. No locale parameter exists. */
  policy: (signal?: AbortSignal): RemoteResult<LotteryPolicyData> =>
    callEndpoint<LotteryPolicyData>('LotteryPolicy', { signal }),

  /** `lottery_id` is required; `limit` / `offset` page the list. */
  tickets: (
    lotteryId: number,
    query: TicketsQuery = {},
    signal?: AbortSignal,
  ): RemoteResult<unknown> =>
    callEndpoint<unknown>('LotteryTickets', {
      query: {
        lottery_id: lotteryId,
        limit: query.limit ?? TICKETS_DEFAULT_LIMIT,
        offset: query.offset ?? 0,
      },
      signal,
    }),

  /** 10-lar stamp cards. */
  tenCarts: (signal?: AbortSignal): RemoteResult<PartnersTenCartsData> =>
    callEndpoint<PartnersTenCartsData>('PartnersTenCarts', { signal }),

  /**
   * `POST v1/ten-carts/add` — **unverified**. The body key (`ten_cart_id`), whether it
   * selects or toggles, whether several cards may be selected and the response are all
   * unknown, so the caller must not claim success.
   */
  selectTenCart: (tenCartId: number, signal?: AbortSignal): RemoteResult<unknown> =>
    callEndpoint<unknown>('PartnersTenCartsAdd', { body: { ten_cart_id: tenCartId }, signal }),

  plusCategories: (signal?: AbortSignal): RemoteResult<PartnersPlusCategoriesData> =>
    callEndpoint<PartnersPlusCategoriesData>('PartnersPlusCategories', { signal }),

  plusCampaigns: (signal?: AbortSignal): RemoteResult<PartnersPlusCampaignsData> =>
    callEndpoint<PartnersPlusCampaignsData>('PartnersPlusCampaigns', { signal }),

  /**
   * Only `category_id`, `limit` and `offset` are sent: every other parameter the swagger
   * lists is ignored by the server, and sending one would suggest it works.
   */
  plusProducts: (
    query: PlusProductsQuery = {},
    signal?: AbortSignal,
  ): RemoteResult<PartnersPlusProductsData> =>
    callEndpoint<PartnersPlusProductsData>('PartnersPlusProducts', {
      query: {
        ...(query.categoryId ? { category_id: query.categoryId } : {}),
        limit: Math.min(query.limit ?? 20, PLUS_MAX_LIMIT),
        offset: query.offset ?? 0,
      },
      signal,
    }),
} as const;
