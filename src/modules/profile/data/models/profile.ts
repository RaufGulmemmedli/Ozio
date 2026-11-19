/**
 * Domain model for `GET v1/profile/me` (**verified**, re-verified 2026-11-12).
 *
 * `data` has EXACTLY: `id, name, phone, bonus_cards[], birth_date, ref_code, gender,
 * is_registered, cities, active_orders`. There is **no** `display_name`, `person_name`, `email`,
 * `image_url`/avatar, tier/level, cashback or bonus-percentage field — so the UI must not pretend
 * otherwise: the avatar is an initial-letter tile and there is no loyalty level on this payload.
 *
 * Parsers never throw (BUILD-CONTRACT rule 6); every field degrades to a safe default.
 */
import { asList, asObj, bool, dateIso, int, money, nullableStr, str } from '@/core/network';

/** `bonus_cards[0]` — the Ozio loyalty card. */
export interface BonusCard {
  cardNumber: string | null;
  /** Spendable bonus balance (AZN). THIS is the balance the app shows. */
  bonus: number;
  /** Lifetime bonus earned (AZN) — the sum of `earned_bonus` over all bonus transactions. */
  total: number;
  /** Seen: `not_blocked`. */
  blockType: string | null;
  /** Seen: `active`. */
  status: string | null;
  /** Seen: `digital`. */
  type: string | null;
  isBlocked: boolean;
}

export type Gender = 'male' | 'female' | 'unspecified';

export interface Profile {
  id: number | null;
  /** Full name as ONE string — the API has no first/last split. */
  name: string | null;
  /** E.164, `+994XXXXXXXXX`. Read-only on the edit form. */
  phone: string | null;
  /** ISO date (`YYYY-MM-DD`), the date part of the ISO datetime the API sends. */
  birthDate: string | null;
  gender: Gender;
  /** The raw server value, kept so a write can echo back exactly what was read. */
  genderRaw: string | null;
  /** `null` on live — the referral module is mock and gated by the `referral` flag. */
  refCode: string | null;
  isRegistered: boolean;
  cards: BonusCard[];
  /** Row shape unobserved on live (empty on the test account) — only the count is used. */
  activeOrdersCount: number;
}

/** First grapheme of the name, for the avatar tile. Empty when there is no name. */
export function profileInitial(profile: Profile | null | undefined): string {
  const name = profile?.name?.trim();
  if (!name) return '';
  return Array.from(name)[0]?.toLocaleUpperCase('az-AZ') ?? '';
}

/** The loyalty card, or `null` when the account carries none. */
export function primaryCard(profile: Profile | null | undefined): BonusCard | null {
  return profile?.cards[0] ?? null;
}

/** `+994 50 123 45 67` from `+994501234567`; anything unexpected is returned untouched. */
export function formatPhone(phone: string | null | undefined): string {
  const raw = (phone ?? '').replace(/\s+/g, '');
  const m = /^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(raw);
  return m ? `+994 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : (phone ?? '');
}

/** `+994 50 ••• •• 67` — the sign-out dialog shows a masked number. */
export function maskPhone(phone: string | null | undefined): string {
  const raw = (phone ?? '').replace(/\s+/g, '');
  const m = /^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(raw);
  return m ? `+994 ${m[1]} ••• •• ${m[4]}` : formatPhone(phone);
}

function parseGender(raw: string | null): Gender {
  switch ((raw ?? '').trim().toLowerCase()) {
    case 'male':
    case 'm':
    case 'kişi':
      return 'male';
    case 'female':
    case 'f':
    case 'qadın':
      return 'female';
    default:
      return 'unspecified';
  }
}

function parseCard(raw: unknown): BonusCard {
  const o = asObj(raw);
  const blockType = nullableStr(o.block_type);
  return {
    cardNumber: nullableStr(o.card_number),
    bonus: money(o.bonus),
    total: money(o.total),
    blockType,
    status: nullableStr(o.status),
    type: nullableStr(o.type),
    isBlocked: blockType !== null && blockType !== 'not_blocked',
  };
}

export function parseProfile(raw: unknown): Profile {
  const o = asObj(raw);
  const genderRaw = nullableStr(o.gender);
  const birth = dateIso(o.birth_date);
  return {
    id: o.id === undefined || o.id === null ? null : int(o.id),
    name: nullableStr(o.name),
    phone: nullableStr(o.phone),
    // The API sends an ISO datetime at 00:00:00.000Z — only the date part is meaningful.
    birthDate: birth ? birth.slice(0, 10) : null,
    gender: parseGender(genderRaw),
    genderRaw,
    refCode: nullableStr(o.ref_code),
    isRegistered: bool(o.is_registered, true),
    cards: asList(o.bonus_cards).map(parseCard),
    activeOrdersCount: asList(o.active_orders).length,
  };
}

/** Splits the single `name` into the two fields the edit form draws. */
export function splitName(name: string | null | undefined): { firstName: string; lastName: string } {
  const parts = str(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

/** Joins the two form fields back into the one `name` the API stores. */
export const joinName = (firstName: string, lastName: string): string =>
  [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
