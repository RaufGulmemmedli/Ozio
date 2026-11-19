/**
 * "Kuryerin çantası" — what the courier already carries, buyable while they are on the way.
 *
 * Money and the discount percentage are server (mock) values: nothing here is computed from a
 * component, and the mini cart's totals come from `BagQuote` rather than from a sum in the view
 * (BUILD-CONTRACT rule 7).
 */
import { asList, asObj, int, money, str } from '@/core/network';

import { parseLocalized, type LocalizedText } from './localized';

/** `battery|chocolate|coffee|cable|water|gum` (mock-contracts.ts `BagItemKind`). */
export const BAG_ITEM_KINDS = ['battery', 'chocolate', 'coffee', 'cable', 'water', 'gum'] as const;
export type BagItemKind = (typeof BAG_ITEM_KINDS)[number];

const isKind = (v: string): v is BagItemKind =>
  (BAG_ITEM_KINDS as readonly string[]).includes(v);

export interface BagItem {
  id: string;
  kind: BagItemKind;
  /** Catalogue text, per locale — data, not UI copy. */
  name: LocalizedText;
  price: number;
  oldPrice: number;
  /** Units left in the bag; the stepper is capped by this. */
  stock: number;
  /** Server-sent, never derived in the view. */
  discountPct: number;
}

/** One line of the shopper's selection, sent to `bag/quote` and `bag/confirm`. */
export interface BagDraftLine {
  id: string;
  quantity: number;
}

export interface BagQuoteLine {
  id: string;
  quantity: number;
  /** price × quantity, as the server returns it. */
  amount: number;
}

export interface BagQuote {
  itemCount: number;
  lines: BagQuoteLine[];
  delivery: number;
  saving: number;
  total: number;
}

export interface BagReceipt {
  reference: string;
  itemCount: number;
  total: number;
  /** The demo charges nothing — the success screen must say so. */
  simulated: boolean;
}

export function parseBagItem(raw: unknown): BagItem {
  const row = asObj(raw);
  const kindRaw = str(row.kind);
  return {
    id: str(row.id),
    kind: isKind(kindRaw) ? kindRaw : 'battery',
    name: parseLocalized(row.name),
    price: money(row.price),
    oldPrice: money(row.old_price ?? row.oldPrice),
    stock: int(row.stock),
    discountPct: int(row.discount_pct ?? row.discountPct),
  };
}

export const parseBagItems = (raw: unknown): BagItem[] => asList(raw).map(parseBagItem);

export function parseBagQuote(raw: unknown): BagQuote {
  const row = asObj(raw);
  return {
    itemCount: int(row.item_count ?? row.itemCount),
    lines: asList(row.lines).map((line) => {
      const l = asObj(line);
      return {
        id: str(l.id),
        quantity: int(l.quantity),
        amount: money(l.amount),
      };
    }),
    delivery: money(row.delivery),
    saving: money(row.saving),
    total: money(row.total),
  };
}

export const EMPTY_BAG_QUOTE: BagQuote = {
  itemCount: 0,
  lines: [],
  delivery: 0,
  saving: 0,
  total: 0,
};

export function parseBagReceipt(raw: unknown): BagReceipt {
  const row = asObj(raw);
  return {
    reference: str(row.reference),
    itemCount: int(row.item_count ?? row.itemCount),
    total: money(row.total),
    // Absent would mean a real charge, which this module can never do.
    simulated: row.simulated === undefined ? true : row.simulated === true,
  };
}
