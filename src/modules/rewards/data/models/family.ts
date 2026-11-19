/**
 * Family card (N3). `mock-modules.md` §7.
 *
 * The pool, the per-member contributions and the limits are all server values — the view only
 * renders them (BUILD-CONTRACT rule 7).
 */
import { asList, asObj, bool, money, nullableNum, nullableStr, str } from '@/core/network';

import { pickText, type Localized } from './localized';

export type FamilyRole = 'admin' | 'member';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  owner: boolean;
  /** AZN this member contributed to the pool this month. */
  contributed: number;
  monthlyLimit: number | null;
  phone: string | null;
}

export interface FamilyCardSettings {
  spendAlerts: boolean;
  childLimit: boolean;
  sharedBonus: boolean;
}

export interface FamilyCard {
  /** Barcode number printed on the dark card. */
  cardNumber: string;
  /** The pooled bonus the server reports for this month. */
  pool: number;
  members: FamilyMember[];
  settings: FamilyCardSettings;
}

export const familyInitial = (name: string): string =>
  (name.trim().charAt(0) || '?').toLocaleUpperCase('az-AZ');

export function parseFamilyMember(json: unknown, locale = 'az'): FamilyMember {
  const o = asObj(json);
  const owner = bool(o.owner ?? o.is_owner);
  const rawRole = str(o.role ?? o.relation).trim().toLowerCase();
  const role: FamilyRole = owner || rawRole === 'admin' ? 'admin' : 'member';
  return {
    id: str(o.id ?? o.member_id),
    name: pickText((o.name ?? o.full_name) as Localized, locale),
    role,
    owner,
    contributed: money(o.contributed ?? o.bonus ?? o.contribution),
    monthlyLimit: nullableNum(o.monthlyLimit ?? o.monthly_limit ?? o.spend_limit),
    phone: nullableStr(o.phone ?? o.phone_number),
  };
}

function parseSettings(json: unknown): FamilyCardSettings {
  const o = asObj(json);
  return {
    spendAlerts: bool(o.spendAlerts ?? o.spend_alerts, true),
    childLimit: bool(o.childLimit ?? o.child_limit, true),
    sharedBonus: bool(o.sharedBonus ?? o.shared_bonus, false),
  };
}

export function parseFamilyCard(json: unknown, locale = 'az'): FamilyCard {
  const o = asObj(json);
  return {
    cardNumber: str(o.cardNumber ?? o.card_number ?? o.barcode),
    pool: money(o.pool ?? o.total ?? o.pool_bonus),
    members: asList(o.members).map((row) => parseFamilyMember(row, locale)),
    settings: parseSettings(o.settings),
  };
}

export const familyIsEmpty = (card: FamilyCard): boolean => card.members.length === 0;
