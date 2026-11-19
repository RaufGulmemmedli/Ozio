/**
 * "Ozio 10-lar" — `GET v1/ten-carts` (verified 2026-11-12, 5 rows).
 *
 * The rows are **stamp cards, not priced bundles**:
 *   `{ id, steps, current_step, is_selected, completed, start_date, end_date,
 *      ten_cart_translations[{locale, name}], ten_carts_uploads[{uploads{object_key}}] }`
 *
 * There is **no price, no store, no product list and no "free" flag**, `current_step` is
 * absent on unselected cards, several cards can be `is_selected` at once, and the
 * translations are az-only on live. `steps` was 9 for a 10-stamp card, so the grid is
 * `steps + 1` circles with the last one being the gift slot.
 */
import { asList, asObj, bool, int, pickTranslation, str } from '@/core/network';

import { wallMoment, type WallMoment } from './wall-moment';

/** Fallback when `steps` is missing: the programme is "9 alırsan, 1 qazanırsan". */
const DEFAULT_SLOTS = 10;

export interface TenCart {
  id: number;
  /** From `ten_cart_translations`, resolved for the active locale. */
  name: string;
  imageUrl: string | null;
  /** Server `steps` — the number of **earned** stamps a full card holds (9 on live). */
  steps: number;
  /** Circles in the grid: `steps + 1`, the last one being the gift. */
  slots: number;
  /** `current_step`; 0 when the card is not selected (the field is then absent). */
  currentStep: number;
  isSelected: boolean;
  completed: boolean;
  startsAt: WallMoment | null;
  endsAt: WallMoment | null;
}

function imageUrl(raw: unknown): string | null {
  for (const row of asList(raw)) {
    const uploads = asObj(asObj(row).uploads);
    const url = str(uploads.object_key) || str(uploads.url);
    if (url) return url;
  }
  return null;
}

export function parseTenCart(raw: unknown, locale = 'az'): TenCart {
  const o = asObj(raw);
  const steps = int(o.steps);
  const slots = steps > 0 ? steps + 1 : DEFAULT_SLOTS;

  return {
    id: int(o.id),
    name: pickTranslation(o.ten_cart_translations, locale) || str(o.name),
    imageUrl: imageUrl(o.ten_carts_uploads),
    steps: steps > 0 ? steps : DEFAULT_SLOTS - 1,
    slots,
    // Clamped so a server value above the grid size cannot overflow the row.
    currentStep: Math.min(Math.max(int(o.current_step), 0), slots),
    isSelected: bool(o.is_selected),
    completed: bool(o.completed),
    startsAt: wallMoment(o.start_date),
    endsAt: wallMoment(o.end_date),
  };
}

/** Stamps still needed before the gift slot. */
export const stampsLeft = (card: TenCart): number => Math.max(card.steps - card.currentStep, 0);

/** The card the screen opens on: the selected one with the most progress, else the first. */
export function pickActiveCard(cards: readonly TenCart[]): TenCart | null {
  if (cards.length === 0) return null;
  const selected = cards.filter((card) => card.isSelected);
  const pool = selected.length > 0 ? selected : cards;
  return pool.reduce((best, card) => (card.currentStep > best.currentStep ? card : best), pool[0]);
}
