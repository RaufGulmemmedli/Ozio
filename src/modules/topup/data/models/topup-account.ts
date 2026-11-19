/**
 * `TopupAccount` — the **REAL** part of this module: the Ozio bonus balance and the card number.
 *
 * Source: `GET v1/profile/me` (`live: 'verified'`, re-checked 2026-11-12) → `data.bonus_cards[]`.
 * `bonus` is the spendable balance shown in the app; `total` is lifetime earned. Both arrive as
 * **decimal strings**, so they go through `money()` (api/README.md "Money arrives as strings").
 *
 * Never throws: a missing `bonus_cards` means "no Ozio card" (`hasCard: false`), which is the
 * documented "Ozio kartı tapılmadı" state on `/topup/cashier`.
 */
import { asList, asObj, money, str } from '@/core/network';

export interface TopupAccount {
  /** Spendable bonus balance in AZN. */
  balance: number;
  /** Digits only, as the API sends them (11 digits on the live test account). */
  cardNumber: string;
  /** The profile's single `name` field — printed under the barcode. */
  holderName: string;
  /** False when the profile carries no bonus card at all. */
  hasCard: boolean;
}

export const EMPTY_TOPUP_ACCOUNT: TopupAccount = {
  balance: 0,
  cardNumber: '',
  holderName: '',
  hasCard: false,
};

/**
 * Groups the digits by four for display: `"48217730115 6"` → `"4821 7730 1156"`.
 * Mirrors Flutter's `TopupAccount.displayNumber` (api/mock-modules.md §5).
 */
export const topupDisplayNumber = (cardNumber: string): string =>
  cardNumber.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');

/** `GET v1/profile/me` → `TopupAccount`. */
export function parseTopupAccount(data: unknown): TopupAccount {
  const root = asObj(data);
  const card = asObj(asList(root.bonus_cards)[0]);
  const cardNumber = str(card.card_number).replace(/\s+/g, '');

  return {
    // `bonus` is the spendable balance; some older payloads only carry `total`.
    balance: money(card.bonus ?? card.total ?? card.total_bonus),
    cardNumber,
    holderName: str(root.name),
    hasCard: cardNumber.length > 0,
  };
}
