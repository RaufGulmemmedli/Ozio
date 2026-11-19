/**
 * What `POST deals/{id}/join` answers.
 *
 * `total` is the source's number, not `qty × price` on the client: the dialogs render exactly what
 * the source charged (which, for group_buy, is **nothing yet** — see `data/group_buy.mock.ts`).
 */
import { asObj, bool, int, money } from '@/core/network';

import { parseGroupDeal, type GroupDeal } from './group-deal';

export interface JoinResult {
  deal: GroupDeal;
  qty: number;
  /** Line total for this member, server-computed. */
  total: number;
  /** Delivery is 0 ₼ for a group order — one shared drop at one address. */
  deliveryFee: number;
  /** `(retail − current) × qty`, server-computed. */
  savings: number;
  /** The group filled with this join: GB5a instead of GB5b. */
  completed: boolean;
}

/**
 * What `GET deals/{id}/quote?qty=` answers — the GB4 confirm dialog's breakdown.
 *
 * It exists so the dialog does not compute a discount: the line total, the shared-delivery fee
 * and the savings are all the source's numbers (BUILD-CONTRACT rule 7).
 */
export interface JoinQuote {
  qty: number;
  unitPrice: number;
  lineTotal: number;
  deliveryFee: number;
  savings: number;
  total: number;
}

export function parseJoinQuote(raw: unknown): JoinQuote {
  const q = asObj(raw);
  return {
    qty: int(q.qty, 1),
    unitPrice: money(q.unit_price),
    lineTotal: money(q.line_total),
    deliveryFee: money(q.delivery_fee),
    savings: money(q.savings),
    total: money(q.total),
  };
}

export function parseJoinResult(raw: unknown, locale = 'az'): JoinResult {
  const r = asObj(raw);
  return {
    deal: parseGroupDeal(r.deal, locale),
    qty: int(r.qty, 1),
    total: money(r.total),
    deliveryFee: money(r.delivery_fee),
    savings: money(r.savings),
    completed: bool(r.completed),
  };
}
