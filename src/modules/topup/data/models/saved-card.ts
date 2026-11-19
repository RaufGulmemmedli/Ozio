/**
 * `SavedCard` — the other **REAL** read: `GET v1/profile/me/cards`.
 *
 * `live: 'verified'` but it returned **`[]`** on the live test account (checked 2026-11-12), so
 * **the row shape has never been observed** — `SavedCardsResponse` in `contracts/types.ts` is an
 * APK-era guess. Therefore this parser:
 *
 * - accepts every id key the APK hints at (`payment_card_id` | `id` | `card_id`);
 * - derives `last4` from any of `masked_card_number` | `card_number` | `last4` | `pan`, taking the
 *   last four digits of whatever it finds (so `"**** **** **** 0092"`, `"410000......0092"` and
 *   `"0092"` all work);
 * - treats a row it cannot identify as **unusable** rather than guessing (`id: 0`), and
 *   `parseSavedCards` drops those;
 * - never throws.
 *
 * Because the list is empty today, `topup-card-no-cards.html` is the **normal** state of
 * `/topup/card`, not an edge case. Adding a card is `POST v1/payment/save-card`
 * (`live: 'unverified'`, a hand-off to the bank's own page) — this module only **links** to
 * `/checkout/add-card`; it never collects a card number, an expiry or a CVV.
 */
import { asList, asObj, bool, int, str } from '@/core/network';

export interface SavedCard {
  /** `payment_card_id` on the wire. 0 means "could not identify" and the row is dropped. */
  id: number;
  /** "Visa", "Mastercard", … or `''` when the row carries no brand. */
  brand: string;
  /** The last four digits, or `''` when nothing resembling a PAN was present. */
  last4: string;
  /** `MM/YY`, or `''`. */
  expiry: string;
  expired: boolean;
  /** The server's own "use this one by default" marker, when it sends one. */
  preselected: boolean;
}

/** `"Visa •••• 0092"`, the label drawn in `topup-card.html`. Falls back gracefully. */
export function savedCardLabel(card: SavedCard): string {
  const brand = card.brand || 'Card';
  return card.last4 ? `${brand} •••• ${card.last4}` : brand;
}

const digitsOf = (v: unknown): string => str(v).replace(/\D+/g, '');

function readLast4(row: Record<string, unknown>): string {
  for (const key of ['last4', 'last_four', 'masked_card_number', 'card_number', 'pan']) {
    const digits = digitsOf(row[key]);
    if (digits.length >= 4) return digits.slice(-4);
  }
  return '';
}

/**
 * `expires_at` has never been seen either. Accepts `MM/YY`, `MM/YYYY`, `YYYY-MM`, `YYYY-MM-DD…`
 * and returns the `MM/YY` the design prints ("Etibarlıdır: 09/28").
 */
function readExpiry(row: Record<string, unknown>): { expiry: string; expired: boolean } {
  const raw = str(row.expires_at ?? row.expiry ?? row.expiry_date ?? row.exp).trim();
  if (!raw) return { expiry: '', expired: bool(row.is_expired ?? row.expired) };

  let year = 0;
  let month = 0;

  const slash = /^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/.exec(raw);
  const iso = /^(\d{4})-(\d{1,2})/.exec(raw);
  if (slash) {
    month = Number(slash[1]);
    const y = Number(slash[2]);
    year = y < 100 ? 2000 + y : y;
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
  }

  if (month < 1 || month > 12 || year < 2000) {
    // Unparseable: show it verbatim and trust the server's flag for expiry.
    return { expiry: raw, expired: bool(row.is_expired ?? row.expired) };
  }

  const expiry = `${String(month).padStart(2, '0')}/${String(year % 100).padStart(2, '0')}`;
  // A card is valid through the last day of its expiry month.
  const endOfMonth = Date.UTC(year, month, 1) - 1;
  const expired = bool(row.is_expired ?? row.expired) || endOfMonth < Date.now();
  return { expiry, expired };
}

export function parseSavedCard(json: unknown): SavedCard {
  const row = asObj(json);
  const { expiry, expired } = readExpiry(row);
  return {
    id: int(row.payment_card_id ?? row.id ?? row.card_id),
    brand: str(row.card_brand ?? row.brand ?? row.scheme ?? row.type),
    last4: readLast4(row),
    expiry,
    expired,
    preselected: bool(row.is_selected ?? row.is_default ?? row.preselected),
  };
}

/**
 * `GET v1/profile/me/cards` → `SavedCard[]`.
 *
 * Accepts a bare list, `{ data: [...] }` and `{ cards: [...] }` because the row shape is
 * unobserved; rows without a usable id are dropped rather than guessed at. Usable cards come
 * first, so the radio list offers a selectable card before an expired one.
 */
export function parseSavedCards(data: unknown): SavedCard[] {
  const root = asObj(data);
  const rows = Array.isArray(data) ? data : asList(root.data ?? root.cards ?? root.items);
  const cards = rows.map(parseSavedCard).filter((card) => card.id > 0);
  return [...cards].sort((a, b) => Number(a.expired) - Number(b.expired));
}

/** The first card the amount form may charge, or `null` when there is none. */
export const firstPayableCard = (cards: readonly SavedCard[]): SavedCard | null =>
  cards.find((card) => !card.expired && card.preselected) ??
  cards.find((card) => !card.expired) ??
  null;
