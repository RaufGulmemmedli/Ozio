/**
 * The Ozio loyalty card, parsed from `GET v1/profile/me` (api/profile.md,
 * verified and re-verified 2026-11-12).
 *
 * `data` has exactly `id, name, phone, bonus_cards[], birth_date, ref_code,
 * gender, is_registered, cities, active_orders`. There is **no** tier, level,
 * cashback percentage, `bonus_percent`, email or image — so this model carries
 * none of those, and the tier UI runs on MSW fixtures (see `tier.ts`).
 *
 * `bonus_cards[0].bonus` is the spendable balance shown on the card;
 * `bonus_cards[0].total` is the lifetime bonus earned.
 *
 * Nothing here throws (04-data-layer.md): a missing field becomes a safe empty
 * value and `hasCard` says whether there is a card at all.
 */
import { asList, asObj, int, money, str } from '@/core/network';

export interface OzioCardModel {
  /** `profile/me.id` — also the per-user key of the offline cache. */
  profileId: number | null;
  /** Full name as one string; the API has no first/last split. */
  holderName: string;
  /** Digits only, exactly as the server sent them (11 digits on the live account). */
  cardNumber: string;
  /** `2026 4821 7730 1145` — the number grouped in fours, for the selectable text. */
  formattedNumber: string;
  /** `•••• 4821` — what the brand face shows. */
  maskedNumber: string;
  last4: string;
  /** Spendable bonus balance in AZN, exactly as sent. Never computed. */
  balance: number;
  /** Lifetime bonus earned in AZN, exactly as sent. */
  lifetimeEarned: number;
  /** Seen live: `not_blocked`. */
  blockType: string;
  /** Seen live: `active`. */
  status: string;
  /** Seen live: `digital`. */
  type: string;
  isBlocked: boolean;
  /** `false` when `bonus_cards` is empty and no number could be synthesized. */
  hasCard: boolean;
}

/** First non-null of `keys` — the Flutter `pick()` helper. */
function pick(source: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

/** Digits only, so a formatted or spaced number from a cache still parses. */
const digitsOf = (value: unknown): string => str(value).replace(/\D+/g, '');

/** `20264821` -> `2026 4821`. */
export function groupCardNumber(digits: string): string {
  if (!digits) return '';
  return digits.replace(/(.{4})(?=.)/g, '$1 ');
}

export function maskCardNumber(digits: string): string {
  if (!digits) return '';
  const tail = digits.slice(-4);
  return `•••• ${tail}`;
}

export const EMPTY_CARD: OzioCardModel = {
  profileId: null,
  holderName: '',
  cardNumber: '',
  formattedNumber: '',
  maskedNumber: '',
  last4: '',
  balance: 0,
  lifetimeEarned: 0,
  blockType: '',
  status: '',
  type: '',
  isBlocked: false,
  hasCard: false,
};

/**
 * `profile/me` -> `OzioCardModel`.
 *
 * Mirrors the Flutter fallbacks: the card list may be `bonus_cards`,
 * `bonusCards` or `cards`; the number may be `card_number`, `cardNumber` or
 * `number`; the balance may be `bonus`, `total_bonus`, `totalBonus` or
 * `balance`. When no card row exists at all, Flutter synthesizes one from the
 * profile-level fields and falls back to a formatted user id for the number —
 * so a signed-in account always has something to show the cashier.
 */
export function parseOzioCard(raw: unknown): OzioCardModel {
  const profile = asObj(raw);
  const rows = asList(pick(profile, ['bonus_cards', 'bonusCards', 'cards'])).map(asObj);
  const row = rows[0] ?? {};

  const profileId = profile.id === undefined || profile.id === null ? null : int(profile.id);

  let digits = digitsOf(pick(row, ['card_number', 'cardNumber', 'number']));
  let synthesized = false;
  if (!digits) {
    digits = digitsOf(pick(profile, ['card_number', 'cardNumber']));
  }
  if (!digits && profileId !== null && profileId > 0) {
    // Flutter's last resort: a zero-padded user id, so the barcode still encodes
    // something the till can look the account up by.
    digits = String(profileId).padStart(11, '0');
    synthesized = true;
  }

  const balanceSource = pick(row, ['bonus', 'total_bonus', 'totalBonus', 'balance']);
  const balance = money(
    balanceSource !== undefined ? balanceSource : pick(profile, ['bonus', 'total_bonus', 'balance']),
  );
  const lifetimeSource = pick(row, ['total', 'total_bonus_earned', 'totalBonusEarned']);
  const lifetimeEarned = money(
    lifetimeSource !== undefined
      ? lifetimeSource
      : pick(profile, ['total_bonus_earned', 'totalBonusEarned']),
  );

  const blockType = str(pick(row, ['block_type', 'blockType'])).trim();
  const status = str(pick(row, ['status'])).trim();

  return {
    profileId,
    holderName: str(pick(profile, ['name', 'display_name', 'displayName', 'person_name'])).trim(),
    cardNumber: digits,
    formattedNumber: groupCardNumber(digits),
    maskedNumber: maskCardNumber(digits),
    last4: digits.slice(-4),
    balance,
    lifetimeEarned,
    blockType,
    status,
    type: str(pick(row, ['type'])).trim(),
    // `not_blocked` is the only value seen live; anything else that is not empty
    // and not "not_blocked" is treated as a block, and `status` may say so too.
    isBlocked:
      (blockType !== '' && blockType !== 'not_blocked') ||
      status.toLowerCase() === 'blocked' ||
      status.toLowerCase() === 'inactive',
    hasCard: digits !== '' && (rows.length > 0 || synthesized),
  };
}
