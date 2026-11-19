/**
 * The shareable gift wishlist — the design's "kampaniya".
 *
 * `raised`, `target`, `progressPercent`, `completed` and `contributorCount` are all **server
 * numbers**. The mock computes them and the parser reads them; no view sums contributions.
 */
import { asList, asObj, bool, dateIso, int, money, pickTranslation, str } from '@/core/network';

export const OCCASIONS = ['birthday', 'wedding', 'graduation'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export interface GiftProduct {
  id: string;
  /** Localized, e.g. 'Velosiped Trek 26"'. */
  name: string;
  price: number;
  /** Icon slug the thumbnail uses when there is no catalogue image. */
  icon: string;
}

export interface Contribution {
  id: string;
  /** Localized for the user's own contributions ("Mən"), raw for the others. */
  name: string;
  amount: number;
  /** ISO instant, rendered with `useFormat().relative`. */
  at: string | null;
}

export interface Wishlist {
  id: string;
  product: GiftProduct;
  occasion: Occasion;
  /** ISO date of the birthday / wedding / graduation. */
  targetDate: string | null;
  /** Days left, from the mock — not computed from `targetDate` in a component. */
  daysLeft: number;
  /** Localized for the seeds, the user's own text for a created one. */
  message: string;
  contributions: Contribution[];
  contributorCount: number;
  raised: number;
  /** `product.price`, echoed by the mock so the view never reaches for it. */
  target: number;
  /** 0…100, from the mock. */
  progressPercent: number;
  completed: boolean;
  /** `https://ozio10.az/g/<id>`. */
  shareLink: string;
}

const asOccasion = (v: unknown): Occasion => {
  const s = str(v).toLowerCase();
  return (OCCASIONS as readonly string[]).includes(s) ? (s as Occasion) : 'birthday';
};

export function parseGiftProduct(raw: unknown, locale = 'az'): GiftProduct {
  const row = asObj(raw);
  return {
    id: str(row.id),
    name: pickTranslation(row.name_translations, locale),
    price: money(row.price),
    icon: str(row.icon),
  };
}

export function parseContribution(raw: unknown, locale = 'az'): Contribution {
  const row = asObj(raw);
  return {
    id: str(row.id),
    // Seeded contributors send a plain `name`; "Mən" is translated, so both are supported.
    name: pickTranslation(row.name_translations, locale) || str(row.name),
    amount: money(row.amount),
    at: dateIso(row.at),
  };
}

export function parseWishlist(raw: unknown, locale = 'az'): Wishlist {
  const row = asObj(raw);
  return {
    id: str(row.id),
    product: parseGiftProduct(row.product, locale),
    occasion: asOccasion(row.occasion),
    targetDate: dateIso(row.target_date),
    daysLeft: int(row.days_left),
    message: pickTranslation(row.message_translations, locale) || str(row.message),
    contributions: asList(row.contributions).map((c) => parseContribution(c, locale)),
    contributorCount: int(row.contributor_count),
    raised: money(row.raised),
    target: money(row.target),
    progressPercent: Math.min(100, Math.max(0, int(row.progress_percent))),
    completed: bool(row.completed),
    shareLink: str(row.share_link),
  };
}

/**
 * A deterministic avatar tint per contributor. The export draws brand / sky / violet for Leyla,
 * Rəşad and Nigar; `yellow` extends the cycle, and the four names are exactly `<Avatar>`'s tones.
 */
export const CONTRIBUTOR_TONES = ['brand', 'sky', 'violet', 'yellow'] as const;
export type ContributorTone = (typeof CONTRIBUTOR_TONES)[number];

export const contributorTone = (index: number): ContributorTone =>
  CONTRIBUTOR_TONES[index % CONTRIBUTOR_TONES.length] as ContributorTone;
