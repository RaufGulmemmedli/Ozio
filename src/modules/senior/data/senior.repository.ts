/**
 * The only thing the senior hooks import.
 *
 * Written as if a real backend were already behind it: `Result<DomainModel>` out, parsers that
 * never throw, no money arithmetic.
 */
import { ok, type Result } from '@/core/network';

import { seniorRemote } from './senior.remote';
import { parseHelpBoard, type HelpBoard, type HelpKind, type HelpStatus } from './models/help-request';
import { parsePensionPlan, type PensionPlan } from './models/pension-plan';

export interface SeniorRepository {
  plan(locale: string, signal?: AbortSignal): Promise<Result<PensionPlan>>;
  setAutoRepeat(value: boolean, locale: string, signal?: AbortSignal): Promise<Result<PensionPlan>>;
  /** Demo only: marks the basket ordered and returns the plan with its order number. */
  orderBasket(locale: string, signal?: AbortSignal): Promise<Result<PensionPlan>>;
  board(locale: string, signal?: AbortSignal): Promise<Result<HelpBoard>>;
  create(kind: HelpKind, note: string, locale: string, signal?: AbortSignal): Promise<Result<HelpBoard>>;
  setStatus(id: string, status: HelpStatus, locale: string, signal?: AbortSignal): Promise<Result<HelpBoard>>;
}

export const seniorRepository: SeniorRepository = {
  async plan(locale, signal) {
    const res = await seniorRemote.plan(locale, signal);
    if (!res.ok) return res;
    return ok(parsePensionPlan(res.value.data));
  },

  async setAutoRepeat(value, locale, signal) {
    const res = await seniorRemote.setAutoRepeat(value, locale, signal);
    if (!res.ok) return res;
    return ok(parsePensionPlan(res.value.data));
  },

  async orderBasket(locale, signal) {
    const res = await seniorRemote.order(locale, signal);
    if (!res.ok) return res;
    return ok(parsePensionPlan(res.value.data));
  },

  async board(locale, signal) {
    const res = await seniorRemote.board(locale, signal);
    if (!res.ok) return res;
    return ok(parseHelpBoard(res.value.data));
  },

  async create(kind, note, locale, signal) {
    const res = await seniorRemote.create(kind, note.trim(), locale, signal);
    if (!res.ok) return res;
    return ok(parseHelpBoard(res.value.data));
  },

  async setStatus(id, status, locale, signal) {
    const res = await seniorRemote.setStatus(id, status, locale, signal);
    if (!res.ok) return res;
    return ok(parseHelpBoard(res.value.data));
  },
};
