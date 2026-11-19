/**
 * The only thing the hooks import. Remote envelope -> domain model, and **nothing here throws**:
 * every parser is tolerant and a failure stays a `Failure` inside the `Result`.
 *
 * Section granularity is deliberate: `/home` calls one repository method per region so a single
 * failing endpoint degrades one card instead of the page.
 */
import {
  Failure,
  flatMapResult,
  mapResult,
  parsePage,
  type ApiEnvelope,
  type Page,
  type Result,
} from '@/core/network';

import { homeRemote, type PageArgs } from './home.remote';
import {
  bestTenProgress,
  campaignInMonth,
  highlightRows,
  isRenderableCampaign,
  isRenderableHighlight,
  isRenderableNotification,
  isRenderableProduct,
  isRenderableSlide,
  parseCoupon,
  parseDeliveryPoint,
  parseHighlight,
  parseHomeProduct,
  parseHomeSlide,
  parsePlusCampaign,
  parsePlusProduct,
  parseTenProgress,
  parseNotification,
  parseUnreadCount,
  type Coupon,
  type Highlight,
  type HomeDeliveryPoint,
  type HomeProduct,
  type HomeSlide,
  type NotificationItem,
  type PlusCampaign,
  type TenProgress,
} from './models';

/** `envelope -> envelope.data -> model`. */
function fromData<T>(result: Result<ApiEnvelope<unknown>>, parse: (data: unknown) => T): Result<T> {
  return mapResult(result, (env) => parse(env.data));
}

export interface TenSummary {
  best: TenProgress | null;
  cards: TenProgress[];
}

export interface CouponSummary {
  /** Global coupons as the server sent them (the view filters out used / expired ones). */
  items: Coupon[];
  /** The server's `total`, which is what the "Aktiv kuponlar" tile shows. */
  total: number;
}

export const homeRepository = {
  /* ------------------------------------------------------------------ home */

  /** Empty on live — that is the normal state, not an error. */
  sliders: async (signal?: AbortSignal): Promise<Result<HomeSlide[]>> =>
    fromData(await homeRemote.sliders(signal), (data) => {
      const rows = Array.isArray(data) ? data : parsePage(data, (r) => r).items;
      return rows.map(parseHomeSlide).filter(isRenderableSlide);
    }),

  /**
   * lat/lng for the store rail: the selected `GET v1/profile/address` row, else the city default.
   * A failing address list is not fatal — the fallback point keeps the rail alive.
   */
  deliveryPoint: async (signal?: AbortSignal): Promise<Result<HomeDeliveryPoint>> =>
    fromData(await homeRemote.addresses(signal), parseDeliveryPoint),

  /**
   * "Sənin üçün": `highlights` names the groups, `highlights/products/{id}` fills the first one.
   * Both are **empty on live**, so an empty array is expected and renders the empty variant.
   * The two calls are sequenced (one feeds the other), never fired together.
   */
  featuredProducts: async (locale = 'az', signal?: AbortSignal): Promise<Result<HomeProduct[]>> => {
    const groupsResult = await homeRemote.highlights(signal);
    if (!groupsResult.ok) return groupsResult;

    const groups = highlightRows(groupsResult.value.data)
      .map(parseHighlight)
      .filter(isRenderableHighlight);
    if (groups.length === 0) return { ok: true, value: [] };

    const productsResult = await homeRemote.highlightProducts(groups[0].id, signal);
    if (!productsResult.ok) return productsResult;

    return {
      ok: true,
      value: parsePage(productsResult.value.data, (r) => parseHomeProduct(r, locale), {
        key: 'products',
      }).items.filter(isRenderableProduct),
    };
  },

  highlights: async (signal?: AbortSignal): Promise<Result<Highlight[]>> =>
    fromData(await homeRemote.highlights(signal), (data) =>
      highlightRows(data).map(parseHighlight).filter(isRenderableHighlight),
    ),

  coupons: async (signal?: AbortSignal): Promise<Result<CouponSummary>> =>
    fromData(await homeRemote.coupons(signal), (data) => {
      const page = parsePage(data, parseCoupon);
      const items = page.items.filter((c) => c.id !== '');
      return { items, total: page.total || items.length };
    }),

  tenCarts: async (locale = 'az', signal?: AbortSignal): Promise<Result<TenSummary>> =>
    fromData(await homeRemote.tenCarts(signal), (data) => {
      const cards = parsePage(data, (r) => parseTenProgress(r, locale)).items.filter((c) => c.id > 0);
      return { best: bestTenProgress(cards), cards };
    }),

  /* ---------------------------------------------------------------- offers */

  campaigns: async (signal?: AbortSignal): Promise<Result<PlusCampaign[]>> =>
    fromData(await homeRemote.campaigns(signal), (data) =>
      parsePage(data, (r) => parsePlusCampaign(r), { key: 'campaigns' }).items.filter(
        isRenderableCampaign,
      ),
    ),

  /** One page of the discount catalogue; `page` / `search` / `sort` are ignored by the server. */
  plusProducts: async (
    args: { categoryId?: number | null } & PageArgs = {},
  ): Promise<Result<Page<HomeProduct>>> =>
    fromData(await homeRemote.plusProducts(args), (data) => {
      const page = parsePage(data, parsePlusProduct, {
        key: 'products',
        offset: args.offset ?? 0,
        limit: args.limit ?? 20,
      });
      return { ...page, items: page.items.filter(isRenderableProduct) };
    }),

  /** Client-side month filter for the design's month tabs (no server param exists). */
  campaignsInMonth: (campaigns: readonly PlusCampaign[], year: number, month: number): PlusCampaign[] =>
    campaigns.filter((c) => campaignInMonth(c, year, month)),

  /* --------------------------------------------------------- notifications */

  notifications: async ({ offset = 0, limit = 10, signal }: PageArgs = {}): Promise<
    Result<Page<NotificationItem>>
  > =>
    fromData(await homeRemote.notifications({ offset, limit, signal }), (data) => {
      const page = parsePage(data, parseNotification, { offset, limit });
      return { ...page, items: page.items.filter(isRenderableNotification) };
    }),

  unreadCount: async (signal?: AbortSignal): Promise<Result<number>> =>
    fromData(await homeRemote.unreadCount(signal), parseUnreadCount),

  /**
   * UNVERIFIED endpoint (`POST …/notifications/read`, body `{ids}` is a guess). The call is only
   * reported as a success when the envelope actually says so — never on a bare 2xx.
   */
  markRead: async (ids: readonly number[], signal?: AbortSignal): Promise<Result<number[]>> => {
    if (ids.length === 0) return { ok: true, value: [] };
    const result = await homeRemote.markRead(ids, signal);
    return flatMapResult(result, (env) =>
      env.success
        ? { ok: true, value: [...ids] }
        : {
            ok: false,
            failure: new Failure('server', env.message || 'notifications/read did not confirm'),
          },
    );
  },

  /** UNVERIFIED endpoint (`DELETE …/notifications`). Same no-optimism rule as `markRead`. */
  clearAll: async (signal?: AbortSignal): Promise<Result<true>> => {
    const result = await homeRemote.clearAll(signal);
    return flatMapResult(result, (env) =>
      env.success
        ? { ok: true, value: true as const }
        : {
            ok: false,
            failure: new Failure('server', env.message || 'DELETE notifications did not confirm'),
          },
    );
  },
} as const;
