/**
 * The top-up repository — the only thing the hooks import.
 *
 * `remote -> parse -> Result<DomainModel>`; parsers never throw, so every failure arrives as a
 * `Failure` and `unwrap()` (in the hook) is the single place that turns one into a thrown error for
 * TanStack Query.
 */
import { mapResult, type Result } from '@/core/network';

import {
  EMPTY_CASHIER_INFO,
  parseCashierInfo,
  type CashierInfo,
} from './models/cashier';
import { parseSavedCards, type SavedCard } from './models/saved-card';
import {
  EMPTY_TOPUP_ACCOUNT,
  parseTopupAccount,
  type TopupAccount,
} from './models/topup-account';
import {
  EMPTY_TOPUP_LIMITS,
  parseTopupLimits,
  type TopupLimits,
} from './models/topup-limits';
import { parseTopupOutcome, type TopupOutcome } from './models/topup-outcome';
import { parseTopupQuote, type TopupQuote } from './models/topup-quote';
import { topupRemote, type TopupPayBody } from './topup.remote';

export const topupRepository = {
  /** REAL — `GET v1/profile/me`. */
  account: async (signal?: AbortSignal): Promise<Result<TopupAccount>> =>
    mapResult(await topupRemote.account({ signal }), (env) =>
      env.data === null ? EMPTY_TOPUP_ACCOUNT : parseTopupAccount(env.data),
    ),

  /** REAL — `GET v1/profile/me/cards`. `[]` is the normal answer today. */
  savedCards: async (signal?: AbortSignal): Promise<Result<SavedCard[]>> =>
    mapResult(await topupRemote.savedCards({ signal }), (env) => parseSavedCards(env.data)),

  /** MOCK — the limits the amount form validates against. */
  limits: async (signal?: AbortSignal): Promise<Result<TopupLimits>> =>
    mapResult(await topupRemote.limits({ signal }), (env) =>
      env.data === null ? EMPTY_TOPUP_LIMITS : parseTopupLimits(env.data),
    ),

  /** MOCK — the summary numbers. */
  quote: async (
    args: { amount: number; balance: number },
    signal?: AbortSignal,
  ): Promise<Result<TopupQuote>> =>
    mapResult(await topupRemote.quote(args, { signal }), (env) => parseTopupQuote(env.data)),

  /**
   * MOCK — the simulated payment. Resolves `ok` for **both** a success and a decline, because a
   * decline is a business outcome, not a transport failure; only a network/server/validation
   * problem comes back as `Failure`.
   */
  pay: async (body: TopupPayBody, signal?: AbortSignal): Promise<Result<TopupOutcome>> =>
    mapResult(await topupRemote.pay(body, { signal }), (env) => parseTopupOutcome(env.data)),

  /** MOCK — re-reads a stored outcome by reference (a reload of `/topup/result`). */
  receipt: async (reference: string, signal?: AbortSignal): Promise<Result<TopupOutcome>> =>
    mapResult(await topupRemote.receipt(reference, { signal }), (env) =>
      parseTopupOutcome(env.data),
    ),

  /** MOCK — the cashier steps and nearby markets for a locale. */
  cashier: async (locale: string, signal?: AbortSignal): Promise<Result<CashierInfo>> =>
    mapResult(await topupRemote.cashier(locale, { signal }), (env) =>
      env.data === null ? EMPTY_CASHIER_INFO : parseCashierInfo(env.data),
    ),
};
