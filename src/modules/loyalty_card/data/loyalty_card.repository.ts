/**
 * The only thing the hooks import. Envelope -> domain model, always a `Result`,
 * never a throw.
 *
 * Two rules from api/loyalty.md live here:
 *
 * 1. `source_type` is required, and `offline` / `online` are the **same path** —
 *    the gateway answers 429 for two concurrent calls to one path. The `all`
 *    filter therefore awaits `offline` and only then asks for `online`,
 *    exactly as the Flutter app does.
 * 2. `GET v1/wallet/google` has no envelope, so its body goes through
 *    `parseBare` and the url is never logged.
 */
import {
  Failure,
  asObj,
  fail,
  mapResult,
  ok,
  parseBare,
  parsePage,
  str,
  type Page,
  type Result,
} from '@/core/network';

import type { BonusSourceFilter } from '../loyalty_card.query-keys';
import { loyaltyCardRemote, BONUS_TX_LIMIT_MAX } from './loyalty_card.remote';
import {
  parseBonusTransaction,
  sortByDateDesc,
  type BonusTransaction,
} from './models/bonus-transaction';
import { parseOzioCard, type OzioCardModel } from './models/card';
import {
  parseExpiringBonus,
  parseTierLadder,
  type ExpiringBonus,
  type TierLadder,
} from './models/tier';

export interface BonusTransactionsArgs {
  source: BonusSourceFilter;
  limit?: number;
  offset?: number;
}

export const loyaltyCardRepository = {
  /** `GET v1/profile/me` -> the card, the balance and the number. */
  async card(signal?: AbortSignal): Promise<Result<OzioCardModel>> {
    const res = await loyaltyCardRemote.profile(signal);
    return mapResult(res, (env) => parseOzioCard(env.data));
  },

  /**
   * One page of `GET v2/bonus/transactions`.
   *
   * `source: 'all'` is two **sequential** calls to the same path (never
   * parallel: 429), merged newest-first. Paging across two sources cannot be
   * exact — each source is asked for the same window and `total` is their sum —
   * which is why the single-source filters exist and why the detail lookup
   * walks pages per source.
   */
  async transactions(
    args: BonusTransactionsArgs,
    signal?: AbortSignal,
  ): Promise<Result<Page<BonusTransaction>>> {
    const limit = Math.min(args.limit ?? 20, BONUS_TX_LIMIT_MAX);
    const offset = args.offset ?? 0;

    if (args.source !== 'all') {
      const res = await loyaltyCardRemote.transactions(
        { source_type: args.source, limit, offset },
        signal,
      );
      return mapResult(res, (env) => {
        const page = parsePage<BonusTransaction>(env.data, parseBonusTransaction, {
          key: 'data',
          limit,
          offset,
        });
        return { ...page, items: sortByDateDesc(page.items) };
      });
    }

    const offlineRes = await loyaltyCardRemote.transactions(
      { source_type: 'offline', limit, offset },
      signal,
    );
    if (!offlineRes.ok) return fail(offlineRes.failure);

    // Sequential on purpose: same path, so a parallel call is a 429.
    const onlineRes = await loyaltyCardRemote.transactions(
      { source_type: 'online', limit, offset },
      signal,
    );
    if (!onlineRes.ok) return fail(onlineRes.failure);

    const offlinePage = parsePage<BonusTransaction>(offlineRes.value.data, parseBonusTransaction, {
      key: 'data',
      limit,
      offset,
    });
    const onlinePage = parsePage<BonusTransaction>(onlineRes.value.data, parseBonusTransaction, {
      key: 'data',
      limit,
      offset,
    });

    return ok({
      items: sortByDateDesc([...offlinePage.items, ...onlinePage.items]).slice(0, limit),
      total: offlinePage.total + onlinePage.total,
      limit,
      offset,
    });
  },

  /**
   * There is no by-id operation, so the row is found by walking the list
   * (api/profile.md §9). `offline` first, then `online` — one at a time.
   */
  async findTransaction(
    id: string,
    signal?: AbortSignal,
    maxPages = 4,
  ): Promise<Result<BonusTransaction | null>> {
    const wanted = id.trim();
    if (!wanted) return ok(null);

    for (const source of ['offline', 'online'] as const) {
      for (let page = 0; page < maxPages; page += 1) {
        const res = await loyaltyCardRemote.transactions(
          { source_type: source, limit: BONUS_TX_LIMIT_MAX, offset: page * BONUS_TX_LIMIT_MAX },
          signal,
        );
        if (!res.ok) return fail(res.failure);

        const parsed = parsePage<BonusTransaction>(res.value.data, parseBonusTransaction, {
          key: 'data',
          limit: BONUS_TX_LIMIT_MAX,
          offset: page * BONUS_TX_LIMIT_MAX,
        });
        const hit = parsed.items.find((row) => row.id === wanted || row.sourceId === wanted);
        if (hit) return ok(hit);

        const seen = (page + 1) * BONUS_TX_LIMIT_MAX;
        if (parsed.items.length === 0 || seen >= parsed.total) break;
      }
    }
    return ok(null);
  },

  /**
   * The "Save to Google Wallet" link. Bare `{ url }`, no envelope.
   * The url carries a signed JWT — it is returned to the caller to open
   * externally and is **never logged**.
   */
  async googleWalletUrl(signal?: AbortSignal): Promise<Result<string>> {
    const res = await loyaltyCardRemote.googleWallet(signal);
    if (!res.ok) return fail(res.failure);

    const bare = parseBare<{ url?: string }>(res.value.data);
    const url = str(asObj(bare.data).url).trim();
    if (!url) return fail(new Failure('parse', 'wallet/google answered without a url'));
    if (!/^https:\/\//i.test(url)) {
      return fail(new Failure('parse', 'wallet/google answered a non-https url'));
    }
    return ok(url);
  },

  /** MSW fixture — the API sends no tier data (see `models/tier.ts`). */
  async tierLadder(locale: string, signal?: AbortSignal): Promise<Result<TierLadder>> {
    const res = await loyaltyCardRemote.tiers(signal);
    return mapResult(res, (env) => parseTierLadder(env.data, locale));
  },

  /** MSW fixture — the API sends no bonus-expiry data. */
  async expiringBonus(signal?: AbortSignal): Promise<Result<ExpiringBonus>> {
    const res = await loyaltyCardRemote.expiringBonus(signal);
    return mapResult(res, (env) => parseExpiringBonus(env.data));
  },
} as const;
