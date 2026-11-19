/**
 * Domain model for one "Birgə al" group deal, plus its tolerant parser.
 *
 * Nothing here throws (BUILD-CONTRACT rule 6) and **nothing here computes money**: the tier
 * ladder, the current price, the discount percentages, the joined/target counts and the progress
 * ratio all arrive on the wire from the source, exactly as they would from a real
 * `GET /customer/api/v1/group-buy/deals/{id}` (BUILD-CONTRACT rule 7, and the brief's
 * "tier thresholds, prices and discounts come from the fixtures — never computed in a component").
 *
 * The only thing derived on the client is the countdown, and that is derived from `closesAt`.
 */
import { asList, asObj, bool, dateIso, int, money, num, pickTranslation, str } from '@/core/network';

/** One rung of the ladder: "5 nəfər · -20% · 15,1 ₼". `percentOff` is server-sent. */
export interface PriceTier {
  people: number;
  price: number;
  percentOff: number;
  /** The highest rung the group has already reached. */
  reached: boolean;
  /** The rung whose price everyone is paying right now (`Cari`). */
  current: boolean;
}

export interface GroupParticipant {
  name: string;
  /** First grapheme, as drawn in the 44px avatars. Server-sent so az/ru/en agree. */
  initial: string;
  isMe: boolean;
}

export interface GroupDeal {
  id: string;
  title: string;
  /** "10 kq", "96 ədəd" — the pack size, localized by the source. */
  pack: string;
  /** Maps to a glyph in `components/deal-icon.tsx`. */
  iconKey: string;
  retailPrice: number;
  tiers: PriceTier[];
  participants: GroupParticipant[];
  /** ISO 8601, true UTC. The single source for every countdown on these screens. */
  closesAt: string;
  address: string;
  sameBuilding: boolean;
  /** The signed-in user is already in this group. */
  mine: boolean;
  myQty: number;
  /** `participants.length`, server-sent. */
  joined: number;
  /** The last rung's `people`, server-sent. */
  target: number;
  complete: boolean;
  /** `target - joined`, floored at 0. */
  missing: number;
  /** 0..1, for `<Progress>`. */
  progress: number;
  /** What a member pays today. */
  currentPrice: number;
  /** What a member pays once the target is reached. */
  bestPrice: number;
  discountPercent: number;
  bestDiscountPercent: number;
  /** The window elapsed without the target being reached — decided by the source, not the client. */
  expired: boolean;
  inviteLink: string;
}

function parseTier(raw: unknown): PriceTier {
  const t = asObj(raw);
  return {
    people: int(t.people, 0),
    price: money(t.price),
    percentOff: int(t.percent_off, 0),
    reached: bool(t.reached),
    current: bool(t.current),
  };
}

function parseParticipant(raw: unknown): GroupParticipant {
  const p = asObj(raw);
  const name = str(p.name);
  return {
    name,
    initial: str(p.initial) || name.slice(0, 1).toUpperCase(),
    isMe: bool(p.is_me),
  };
}

export function parseGroupDeal(raw: unknown, locale = 'az'): GroupDeal {
  const d = asObj(raw);
  const tiers = asList(d.tiers).map(parseTier);
  const participants = asList(d.participants).map(parseParticipant);
  const target = int(d.target, tiers.length > 0 ? tiers[tiers.length - 1].people : 0);
  const joined = int(d.joined, participants.length);
  const progressRaw = num(d.progress, target > 0 ? joined / target : 0);

  return {
    id: str(d.id),
    title: pickTranslation(d.translations, locale, 'title') || str(d.title),
    pack: pickTranslation(d.translations, locale, 'pack') || str(d.pack),
    iconKey: str(d.icon_key),
    retailPrice: money(d.retail_price),
    tiers,
    participants,
    closesAt: dateIso(d.closes_at) ?? '',
    address: str(d.address),
    sameBuilding: bool(d.same_building),
    mine: bool(d.mine),
    myQty: int(d.my_qty, 0),
    joined,
    target,
    complete: bool(d.complete),
    missing: int(d.missing, Math.max(0, target - joined)),
    progress: Math.min(1, Math.max(0, progressRaw)),
    currentPrice: money(d.current_price),
    bestPrice: money(d.best_price),
    discountPercent: int(d.discount_percent, 0),
    bestDiscountPercent: int(d.best_discount_percent, 0),
    expired: bool(d.expired),
    inviteLink: str(d.invite_link),
  };
}

/** What `/group-buy` renders: the two tabs, already split by the source. */
export interface GroupBuyOverview {
  nearby: GroupDeal[];
  mine: GroupDeal[];
}

export function parseGroupBuyOverview(raw: unknown, locale = 'az'): GroupBuyOverview {
  const o = asObj(raw);
  return {
    nearby: asList(o.nearby).map((row) => parseGroupDeal(row, locale)),
    mine: asList(o.mine).map((row) => parseGroupDeal(row, locale)),
  };
}

export const EMPTY_OVERVIEW: GroupBuyOverview = { nearby: [], mine: [] };
