/**
 * The only thing the lottery / 10-lar / Ozio Plus hooks import.
 *
 * Decisions that live here:
 *  - `lottery_id` cannot be omitted: `details()` and `tickets()` take it as a required
 *    first argument, which is how the "HTTP 500 without the param" case is prevented
 *    rather than handled;
 *  - `active` may legitimately answer with no draw running; that is `lottery: null`, not a
 *    failure, so the screen can show "no active draw" instead of an error panel;
 *  - the ticket row shape has never been observed, so `tickets()` keeps every field
 *    optional and the view renders only what arrived;
 *  - `selectTenCart` sits behind an unverified POST, so its result says `verified: false`.
 */
import { asList, asObj, fail, int, ok, parsePage, str, type Page, type Result } from '@/core/network';

import { lotteryRemote, type PlusProductsQuery, type TicketsQuery } from './lottery.remote';
import {
  parseActiveLottery,
  parseLotteryDetails,
  parseLotteryPolicy,
  parseLotteryTicket,
  type ActiveLotterySummary,
  type LotteryDetails,
  type LotteryPolicy,
  type LotteryTicket,
} from './models/lottery';
import { parsePlusCampaign, parsePlusChain, parsePlusProduct, type PlusCampaign, type PlusChain, type PlusProduct } from './models/plus';
import { parseTenCart, type TenCart } from './models/ten-cart';

/** `POST v1/ten-carts/add` is unverified — this is deliberately not a success flag. */
export interface TenCartSelectResult {
  /** Always `false`: the endpoint has never been called, so a 2xx proves nothing. */
  verified: false;
  tenCartId: number;
  /** Whatever message the server sent, when it sent one. */
  message: string;
}

export const lotteryRepository = {
  /** `GET v1/lotteries/active` (verified). `lottery: null` = no draw running. */
  async active(signal?: AbortSignal): Promise<Result<ActiveLotterySummary>> {
    const res = await lotteryRemote.active(signal);
    if (!res.ok) return res;
    return ok(parseActiveLottery(res.value.data));
  },

  /**
   * `GET v1/lotteries/active/details?lottery_id=` (verified).
   * `lotteryId` is required by the signature because the server answers 500 without it.
   */
  async details(lotteryId: number, signal?: AbortSignal): Promise<Result<LotteryDetails | null>> {
    const res = await lotteryRemote.details(lotteryId, signal);
    if (!res.ok) return res;
    return ok(parseLotteryDetails(res.value.data));
  },

  /** `GET v1/lotteries/policy` (verified) — the raw rules HTML, sanitized at render time. */
  async policy(signal?: AbortSignal): Promise<Result<LotteryPolicy>> {
    const res = await lotteryRemote.policy(signal);
    if (!res.ok) return res;
    return ok(parseLotteryPolicy(res.value.data));
  },

  /**
   * `GET v1/lotteries/tickets?lottery_id=&limit=&offset=` (unverified rows).
   * The payload is `{total, lotteries[], logo, limit, offset}` — the rows live under
   * `lotteries`, which is why `parsePage` is pinned to that key.
   */
  async tickets(
    lotteryId: number,
    query: TicketsQuery = {},
    signal?: AbortSignal,
  ): Promise<Result<Page<LotteryTicket>>> {
    const res = await lotteryRemote.tickets(lotteryId, query, signal);
    if (!res.ok) return res;
    return ok(
      parsePage<LotteryTicket>(res.value.data, parseLotteryTicket, {
        key: 'lotteries',
        offset: query.offset ?? 0,
        limit: query.limit,
      }),
    );
  },

  /**
   * One ticket. There is no per-ticket endpoint, so the id is resolved out of the paged
   * list — a missing id is `null` (the screen's not-found state), not a failure.
   * The scan stops at `maxPages` so a deep link cannot walk an unbounded list.
   */
  async ticket(
    lotteryId: number,
    ticketId: string,
    signal?: AbortSignal,
    maxPages = 5,
  ): Promise<Result<LotteryTicket | null>> {
    const limit = 50;
    const wanted = ticketId.trim();
    for (let page = 0; page < maxPages; page += 1) {
      // Sequential on purpose: two concurrent GETs to one path answer 429 (api/README.md).
      const res = await this.tickets(lotteryId, { limit, offset: page * limit }, signal);
      if (!res.ok) return fail(res.failure);
      const found = res.value.items.find(
        (ticket) => ticket.id === wanted || ticket.code === wanted || ticket.number === wanted,
      );
      if (found) return ok(found);
      if ((page + 1) * limit >= res.value.total || res.value.items.length === 0) break;
    }
    return ok(null);
  },

  /** `GET v1/ten-carts` (verified, 5 rows). Names resolved for `locale`. */
  async tenCarts(locale = 'az', signal?: AbortSignal): Promise<Result<TenCart[]>> {
    const res = await lotteryRemote.tenCarts(signal);
    if (!res.ok) return res;
    const rows = Array.isArray(res.value.data) ? res.value.data : asList(asObj(res.value.data).data);
    return ok(rows.map((raw) => parseTenCart(raw, locale)));
  },

  /** `POST v1/ten-carts/add` — unverified; the result never claims the card was selected. */
  async selectTenCart(tenCartId: number, signal?: AbortSignal): Promise<Result<TenCartSelectResult>> {
    const res = await lotteryRemote.selectTenCart(tenCartId, signal);
    if (!res.ok) return res;
    return ok({
      verified: false,
      tenCartId,
      message: str(asObj(res.value.data).message) || res.value.message,
    });
  },

  /** `GET v1/ozio-plus/categories` (verified) — the store chains. */
  async plusChains(signal?: AbortSignal): Promise<Result<PlusChain[]>> {
    const res = await lotteryRemote.plusCategories(signal);
    if (!res.ok) return res;
    return ok(asList(asObj(res.value.data).categories).map(parsePlusChain));
  },

  /** `GET v1/ozio-plus/campaigns` (verified) — the period and its end date. */
  async plusCampaigns(signal?: AbortSignal): Promise<Result<PlusCampaign[]>> {
    const res = await lotteryRemote.plusCampaigns(signal);
    if (!res.ok) return res;
    return ok(asList(asObj(res.value.data).campaigns).map(parsePlusCampaign));
  },

  /**
   * `GET v1/ozio-plus/products` (verified), offset-paged.
   * No search and no sort are sent: the server ignores both.
   */
  async plusProducts(
    query: PlusProductsQuery = {},
    signal?: AbortSignal,
  ): Promise<Result<Page<PlusProduct>>> {
    const res = await lotteryRemote.plusProducts(query, signal);
    if (!res.ok) return res;
    const data = asObj(res.value.data);
    const items = asList(data.products).map(parsePlusProduct);
    return ok({
      items,
      total: int(data.total, items.length),
      offset: query.offset ?? 0,
      limit: query.limit ?? items.length,
    });
  },
} as const;
