/**
 * The only thing the ask_to_buy hooks import.
 *
 * The interface is written as if a real backend were already behind it: every method answers a
 * `Result<DomainModel>`, parsers never throw, and no money is computed here (the mock API sends
 * `line_total`, `items_total` and `total` the way a real one would).
 */
import { asObj, num, ok, parsePage, type Page, type Result } from '@/core/network';

import { askToBuyRemote, type ListParams } from './ask_to_buy.remote';
import {
  askRole,
  parseAskContext,
  parseAskRequest,
  type AskContext,
  type AskRequest,
  type AskRole,
} from './models/ask-request';

/** One inbox side plus the badge count the tabs need. */
export interface AskInbox extends Page<AskRequest> {
  pendingIncoming: number;
}

export interface AskToBuyRepository {
  context(locale: string, signal?: AbortSignal): Promise<Result<AskContext>>;
  setRole(role: AskRole, signal?: AbortSignal): Promise<Result<AskRole>>;
  list(params: ListParams, signal?: AbortSignal): Promise<Result<AskInbox>>;
  get(id: string, locale: string, signal?: AbortSignal): Promise<Result<AskRequest>>;
  send(parentId: string, note: string, locale: string, signal?: AbortSignal): Promise<Result<AskRequest>>;
  approve(id: string, cardId: string, locale: string, signal?: AbortSignal): Promise<Result<AskRequest>>;
  decline(id: string, locale: string, signal?: AbortSignal): Promise<Result<AskRequest>>;
  resend(id: string, locale: string, signal?: AbortSignal): Promise<Result<AskRequest>>;
}

export const askToBuyRepository: AskToBuyRepository = {
  async context(locale, signal) {
    const res = await askToBuyRemote.context(locale, signal);
    if (!res.ok) return res;
    return ok(parseAskContext(res.value.data));
  },

  async setRole(role, signal) {
    const res = await askToBuyRemote.setRole(role, signal);
    if (!res.ok) return res;
    return ok(askRole(asObj(res.value.data).role));
  },

  async list(params, signal) {
    const res = await askToBuyRemote.list(params, signal);
    if (!res.ok) return res;
    const page = parsePage<AskRequest>(res.value.data, parseAskRequest, {
      key: 'items',
      offset: params.offset ?? 0,
      limit: params.limit ?? 20,
    });
    const data = asObj(res.value.data);
    return ok({ ...page, pendingIncoming: num(data.pending_incoming) });
  },

  async get(id, locale, signal) {
    const res = await askToBuyRemote.get(id, locale, signal);
    if (!res.ok) return res;
    return ok(parseAskRequest(res.value.data));
  },

  async send(parentId, note, locale, signal) {
    const res = await askToBuyRemote.send(parentId, note.trim(), locale, signal);
    if (!res.ok) return res;
    return ok(parseAskRequest(res.value.data));
  },

  async approve(id, cardId, locale, signal) {
    const res = await askToBuyRemote.approve(id, cardId, locale, signal);
    if (!res.ok) return res;
    return ok(parseAskRequest(res.value.data));
  },

  async decline(id, locale, signal) {
    const res = await askToBuyRemote.decline(id, locale, signal);
    if (!res.ok) return res;
    return ok(parseAskRequest(res.value.data));
  },

  async resend(id, locale, signal) {
    const res = await askToBuyRemote.resend(id, locale, signal);
    if (!res.ok) return res;
    return ok(parseAskRequest(res.value.data));
  },
};
