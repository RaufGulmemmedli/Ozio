/**
 * Tier / level models — **MSW-backed only**.
 *
 * `GET v1/profile/me` sends no tier, level, cashback percentage or expiry data
 * (api/profile.md, re-verified 2026-11-12), and there is no `loyalty/tiers`
 * operation anywhere in the API. Everything in this file is parsed from the
 * fixtures in `../loyalty_card.mock.ts`, served under
 * `/api/mock/loyalty_card/…` and gated by `FeatureFlags.loyaltyTiers`.
 *
 * The parsers are written against the *proposed* server shape
 * (`api/mock-modules.md` §10 "PROPOSED: GET /customer/api/v1/loyalty/tiers"),
 * with the same tolerant key aliases the Flutter `LoyaltyTier.fromJson` uses,
 * so switching to a real endpoint is a change in the remote source only.
 */
import { asList, asObj, bool, dateIso, int, money, num, pickTranslation, str } from '@/core/network';

export type TierIconKey = 'plus' | 'star' | 'trophy' | 'crown';
export type TierAccent = 'neutral' | 'sky' | 'yellow' | 'violet';

export interface LoyaltyTier {
  id: string;
  /** Already resolved for the active locale. */
  name: string;
  /** Cashback percentage (1, 2, 3, 5 …). */
  cashbackPercent: number;
  /** Yearly spend threshold in AZN at which the tier is reached. 0 for the base tier. */
  threshold: number;
  /** Already resolved for the active locale. */
  perks: string[];
  iconKey: TierIconKey;
  accent: TierAccent;
  isCurrent: boolean;
  isNext: boolean;
}

export interface TierLadder {
  tiers: LoyaltyTier[];
  currentTierId: string;
  /** `null` when the customer is already on the top tier. */
  nextTierId: string | null;
  /** Spend inside the rolling window, in AZN. */
  spend: number;
  /** The next tier's threshold, or the current one's when on top. */
  target: number;
  /** `target - spend`, floored at 0 — a server figure, not a price calculation. */
  remaining: number;
  /** 0–100, rounded. */
  progressPercent: number;
  /** How long the spend window is (12 months in the design). */
  windowMonths: number;
}

export interface ExpiringBatch {
  id: string;
  amount: number;
  /** ISO instant the batch burns at. */
  expiresAt: string | null;
  daysLeft: number;
  /** Validity window the batch was earned under, for the progress track. */
  windowDays: number;
  /** `<= 3` danger, `<= 16` warning, otherwise neutral (app-loyalty.md §9). */
  tone: 'danger' | 'warning' | 'neutral';
}

export interface ExpiringBonus {
  /** Total amount that will burn, in AZN, as the fixture sent it. */
  totalAmount: number;
  batches: ExpiringBatch[];
  /** The batch that burns first, or `null` when nothing is expiring. */
  soonest: ExpiringBatch | null;
  /** How long an earned bonus stays valid (30 days in the design). */
  validityDays: number;
  /** Bonus price of one lottery ticket, for the "how to spend" row. */
  lotteryTicketPrice: number;
}

const ICON_KEYS: ReadonlySet<string> = new Set<TierIconKey>(['plus', 'star', 'trophy', 'crown']);
const ACCENTS: ReadonlySet<string> = new Set<TierAccent>(['neutral', 'sky', 'yellow', 'violet']);

function pick(source: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function parseTier(raw: unknown, locale: string): LoyaltyTier {
  const json = asObj(raw);
  const translated = pickTranslation(
    pick(json, ['name_translations', 'nameTranslations']),
    locale,
  );
  const iconKey = str(pick(json, ['icon', 'icon_key']));
  const accent = str(pick(json, ['accent']));

  return {
    id: str(pick(json, ['id', 'slug', 'code'])).trim(),
    name:
      translated ||
      str(pick(json, ['name', 'title', 'level_name', 'tier_name'])).trim(),
    cashbackPercent: num(
      pick(json, ['cashback_percentage', 'bonus_percentage', 'cashback', 'percentage']),
    ),
    threshold: money(
      pick(json, ['threshold', 'min_amount', 'min_spend', 'amount', 'required_amount']),
    ),
    perks: asList(pick(json, ['perks', 'benefits', 'features']))
      .map((perk) => {
        // A perk is either a plain string or a translation list.
        if (typeof perk === 'string') return perk.trim();
        const resolved = pickTranslation(perk, locale);
        return resolved || str(asObj(perk).name).trim();
      })
      .filter((perk) => perk.length > 0),
    iconKey: ICON_KEYS.has(iconKey) ? (iconKey as TierIconKey) : 'star',
    accent: ACCENTS.has(accent) ? (accent as TierAccent) : 'neutral',
    isCurrent: false,
    isNext: false,
  };
}

export const EMPTY_LADDER: TierLadder = {
  tiers: [],
  currentTierId: '',
  nextTierId: null,
  spend: 0,
  target: 0,
  remaining: 0,
  progressPercent: 0,
  windowMonths: 12,
};

export function parseTierLadder(raw: unknown, locale = 'az'): TierLadder {
  const json = asObj(raw);
  const tiers = asList(pick(json, ['tiers', 'levels', 'tier_list']))
    .map((row) => parseTier(row, locale))
    .filter((tier) => tier.id.length > 0)
    .sort((a, b) => a.threshold - b.threshold);

  if (tiers.length === 0) return EMPTY_LADDER;

  const spend = money(pick(json, ['spend', 'spend_this_window', 'spend_this_month']));
  const declaredCurrent = str(pick(json, ['current_tier', 'currentTier', 'current_tier_id'])).trim();

  // The declared current tier wins; otherwise the highest tier the spend reaches.
  let currentIndex = tiers.findIndex((tier) => tier.id === declaredCurrent);
  if (currentIndex < 0) {
    currentIndex = 0;
    for (let i = 0; i < tiers.length; i += 1) {
      if (spend >= tiers[i].threshold) currentIndex = i;
    }
  }
  const nextIndex = currentIndex + 1 < tiers.length ? currentIndex + 1 : -1;

  for (let i = 0; i < tiers.length; i += 1) {
    tiers[i] = { ...tiers[i], isCurrent: i === currentIndex, isNext: i === nextIndex };
  }

  const target = nextIndex >= 0 ? tiers[nextIndex].threshold : tiers[currentIndex].threshold;
  const remaining = Math.max(0, Math.round((target - spend) * 100) / 100);
  const progressPercent =
    target > 0 ? Math.max(0, Math.min(100, Math.round((spend / target) * 100))) : 100;

  return {
    tiers,
    currentTierId: tiers[currentIndex].id,
    nextTierId: nextIndex >= 0 ? tiers[nextIndex].id : null,
    spend,
    target,
    remaining,
    progressPercent,
    windowMonths: int(pick(json, ['window_months', 'windowMonths']), 12) || 12,
  };
}

const DAY_MS = 86_400_000;

function parseBatch(raw: unknown, validityDays: number, now: number): ExpiringBatch {
  const json = asObj(raw);
  const expiresAt = dateIso(pick(json, ['expires_at', 'expiresAt', 'burn_at']));
  const declaredDays = pick(json, ['days_left', 'daysLeft']);
  const daysLeft =
    declaredDays !== undefined
      ? Math.max(0, int(declaredDays))
      : expiresAt
        ? Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / DAY_MS))
        : 0;
  const windowDays = int(pick(json, ['window_days', 'windowDays']), validityDays) || validityDays;

  return {
    id: str(pick(json, ['id'])).trim(),
    amount: money(pick(json, ['amount', 'bonus', 'value'])),
    expiresAt,
    daysLeft,
    windowDays,
    tone: daysLeft <= 3 ? 'danger' : daysLeft <= 16 ? 'warning' : 'neutral',
  };
}

export const EMPTY_EXPIRING: ExpiringBonus = {
  totalAmount: 0,
  batches: [],
  soonest: null,
  validityDays: 30,
  lotteryTicketPrice: 0,
};

export function parseExpiringBonus(raw: unknown, now: number = Date.now()): ExpiringBonus {
  const json = asObj(raw);
  const validityDays = int(pick(json, ['validity_days', 'validityDays']), 30) || 30;
  const batches = asList(pick(json, ['batches', 'items', 'data']))
    .map((row) => parseBatch(row, validityDays, now))
    .filter((batch) => batch.id.length > 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    totalAmount: money(pick(json, ['total_amount', 'total', 'amount'])),
    batches,
    soonest: batches[0] ?? null,
    validityDays,
    lotteryTicketPrice: money(pick(json, ['lottery_ticket_price', 'lotteryTicketPrice'])),
  };
}

/** The fixture may say "there is nothing expiring"; the views need that to be explicit. */
export const hasExpiring = (value: ExpiringBonus | null | undefined): boolean =>
  Boolean(value && value.batches.length > 0);

/** `is_demo` on the mock payload, so a screen can assert it is showing fixtures. */
export const parseIsDemo = (raw: unknown): boolean => bool(asObj(raw).is_demo, true);
