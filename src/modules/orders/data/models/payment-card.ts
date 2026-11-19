/**
 * A saved card from `GET v1/profile/me/cards`.
 *
 * The endpoint is **verified** but returned `[]` for the test account, so the row shape has never
 * been seen. Card id key varies (`payment_card_id | id | card_id`), the list may sit under `data`,
 * `cards`, or be the `data` array itself (api/payment.md). Rows without an id are dropped.
 */
import { asList, asObj, bool, int, nullableStr, str } from '@/core/network';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'mir' | 'unknown';

export interface SavedCard {
  id: number;
  brand: CardBrand;
  /** Brand as the server wrote it, for the brand tile label when it is not one we know. */
  brandRaw: string | null;
  /** Last 4 digits only. Never the full PAN — this app never receives one. */
  last4: string | null;
  /** `09/28`, or null when the server sent no expiry. */
  expiry: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
  holderName: string | null;
}

const BRANDS: ReadonlyArray<[CardBrand, readonly string[]]> = [
  ['visa', ['visa']],
  ['mastercard', ['mastercard', 'master card', 'master', 'mc', 'maestro']],
  ['amex', ['amex', 'american express']],
  ['mir', ['mir']],
];

function parseBrand(raw: unknown, pan: string): CardBrand {
  const value = str(raw).trim().toLowerCase();
  for (const [brand, needles] of BRANDS) {
    if (needles.some((needle) => value === needle || value.includes(needle))) return brand;
  }
  // Fall back to the PAN's first digit (4 = Visa, 5/2 = Mastercard) when the brand is missing.
  const first = pan.replace(/\D/g, '').charAt(0);
  if (first === '4') return 'visa';
  if (first === '5' || first === '2') return 'mastercard';
  return 'unknown';
}

function parseLast4(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const digits = str(candidate).replace(/\D/g, '');
    if (digits.length >= 4) return digits.slice(-4);
  }
  return null;
}

function parseExpiry(o: Record<string, unknown>): {
  text: string | null;
  month: number | null;
  year: number | null;
} {
  const rawMonth = o.expiry_month ?? o.exp_month ?? o.month;
  const rawYear = o.expiry_year ?? o.exp_year ?? o.year;
  let month = rawMonth === undefined || rawMonth === null ? null : int(rawMonth);
  let year = rawYear === undefined || rawYear === null ? null : int(rawYear);

  if (month === null || year === null) {
    // "09/28", "09/2028", "2028-09"
    const text = str(o.expiry ?? o.expiry_date ?? o.exp_date ?? o.expire_date);
    const slash = /(\d{1,2})\s*[/.-]\s*(\d{2,4})/.exec(text);
    const iso = /(\d{4})\s*[/.-]\s*(\d{1,2})/.exec(text);
    if (slash) {
      month = int(slash[1]);
      year = int(slash[2]);
    } else if (iso) {
      year = int(iso[1]);
      month = int(iso[2]);
    }
  }

  if (month !== null && (month < 1 || month > 12)) month = null;
  if (year !== null && year < 100) year += 2000;
  if (year !== null && (year < 2000 || year > 2100)) year = null;
  if (month === null || year === null) return { text: null, month, year };

  const mm = month < 10 ? `0${month}` : String(month);
  return { text: `${mm}/${String(year).slice(-2)}`, month, year };
}

export function parseSavedCard(raw: unknown): SavedCard {
  const o = asObj(raw);
  const pan = str(o.masked_card_number ?? o.card_number ?? o.pan ?? o.number);
  const expiry = parseExpiry(o);

  return {
    id: int(o.payment_card_id ?? o.id ?? o.card_id),
    brand: parseBrand(o.card_brand ?? o.brand ?? o.card_type ?? o.scheme, pan),
    brandRaw: nullableStr(o.card_brand ?? o.brand ?? o.card_type ?? o.scheme),
    last4: parseLast4(o.last4, o.last_four, pan),
    expiry: expiry.text,
    expiryMonth: expiry.month,
    expiryYear: expiry.year,
    isDefault: bool(o.is_default ?? o.is_main ?? o.default ?? o.primary, false),
    holderName: nullableStr(o.holder_name ?? o.card_holder ?? o.name),
  };
}

/** `data` may be the array itself, or hold it under `cards` / `data`. */
export function parseSavedCards(raw: unknown): SavedCard[] {
  const source = Array.isArray(raw) ? raw : (() => {
    const o = asObj(raw);
    if (Array.isArray(o.cards)) return o.cards;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.items)) return o.items;
    return [];
  })();
  return asList(source)
    .map(parseSavedCard)
    .filter((card) => card.id > 0);
}

/** An expired card cannot be charged, so its row is rendered disabled. */
export function isCardExpired(card: SavedCard, now = new Date()): boolean {
  if (card.expiryMonth === null || card.expiryYear === null) return false;
  // Valid through the last day of the expiry month.
  const endOfMonth = new Date(card.expiryYear, card.expiryMonth, 1).getTime();
  return endOfMonth <= now.getTime();
}

export const cardLast4Mask = (last4: string | null): string =>
  last4 ? `•••• ${last4}` : '••••';
