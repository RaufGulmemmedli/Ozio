/**
 * The only thing the group_buy hooks import.
 *
 * It implements the `GroupBuyRepository` surface from
 * `src/core/api/contracts/mock-contracts.ts` §15 (`overview`, `deal`, `products`, `create`,
 * `join`) over `data/group_buy.remote.ts`, and it is deliberately indistinguishable from a
 * real-API repository: envelope in, domain model out, `Result` either way, parsers that never
 * throw. The mock lives one layer below (`group_buy.mock.ts`); deleting it and repointing
 * `group_buy.remote.ts` at the real host is the whole migration.
 */
import { ok, type Result } from '@/core/network';

import {
  EMPTY_CATALOG,
  parseGroupBuyCatalog,
  type GroupBuyCatalog,
} from './models/group-product';
import {
  EMPTY_OVERVIEW,
  parseGroupBuyOverview,
  parseGroupDeal,
  type GroupBuyOverview,
  type GroupDeal,
} from './models/group-deal';
import {
  parseJoinQuote,
  parseJoinResult,
  type JoinQuote,
  type JoinResult,
} from './models/join-result';
import { groupBuyRemote } from './group_buy.remote';

export interface CreateGroupDealInput {
  productId: string;
  target: number;
  /** Deadline in hours — the source stamps `closes_at` from it. */
  hours: number;
  qty: number;
}

export const groupBuyRepository = {
  /** `GET deals` — the two tabs of `/group-buy`, already split by the source. */
  async overview(locale: string, signal?: AbortSignal): Promise<Result<GroupBuyOverview>> {
    const res = await groupBuyRemote.overview(locale, signal);
    if (!res.ok) return res;
    return ok(parseGroupBuyOverview(res.value.data, locale));
  },

  /** `GET deals/{id}` — one deal. A 404 stays a failure so the screen shows its error panel. */
  async deal(id: string, locale: string, signal?: AbortSignal): Promise<Result<GroupDeal>> {
    const res = await groupBuyRemote.deal(id, locale, signal);
    if (!res.ok) return res;
    return ok(parseGroupDeal(res.value.data, locale));
  },

  /** `GET deals/{id}/quote?qty=` — the GB4 confirm breakdown, so the dialog computes nothing. */
  async quote(
    id: string,
    qty: number,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<JoinQuote>> {
    const res = await groupBuyRemote.quote(id, qty, locale, signal);
    if (!res.ok) return res;
    return ok(parseJoinQuote(res.value.data));
  },

  /** `GET products` — the catalog, targets, deadlines and delivery address for the create form. */
  async catalog(locale: string, signal?: AbortSignal): Promise<Result<GroupBuyCatalog>> {
    const res = await groupBuyRemote.products(locale, signal);
    if (!res.ok) return res;
    return ok(parseGroupBuyCatalog(res.value.data, locale));
  },

  /** `POST deals` — opens a group and returns it, so the caller can route to its detail page. */
  async create(
    input: CreateGroupDealInput,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<GroupDeal>> {
    const res = await groupBuyRemote.create(
      { product_id: input.productId, target: input.target, hours: input.hours, qty: input.qty },
      locale,
      signal,
    );
    if (!res.ok) return res;
    return ok(parseGroupDeal(res.value.data, locale));
  },

  /**
   * `POST deals/{id}/join` — demo state only: nothing is charged and no cart row is written.
   * A 409 (`Qrupun vaxtı bitdi`) is returned as the failure it is, so the view refetches.
   */
  async join(
    id: string,
    qty: number,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<JoinResult>> {
    const res = await groupBuyRemote.join(id, qty, locale, signal);
    if (!res.ok) return res;
    return ok(parseJoinResult(res.value.data, locale));
  },
} as const;

export { EMPTY_CATALOG, EMPTY_OVERVIEW };
