/**
 * "Qonşu nəvə" — a neighbour runs an errand for an older neighbour and earns a bonus.
 *
 * Shapes follow `mock-contracts.ts` §13c and `api/mock-modules.md` §13c. Parsers never throw.
 * The bonus figure is fixture money from the API; the UI only formats it.
 */
import { asList, asObj, bool, money, num, str } from '@/core/network';

export type HelpKind = 'medicine' | 'groceries' | 'trash';

/** Tile order in the "Yeni sorğu" dialog, straight from the export. */
export const HELP_KINDS: readonly HelpKind[] = ['medicine', 'groceries', 'trash'];

/** UI chips: Gözləyir / Yoldadır / Tamamlandı. */
export type HelpStatus = 'open' | 'accepted' | 'completed';

export interface HelpRequest {
  id: string;
  kind: HelpKind;
  /** Who needs help — "Mən" on the person's own rows. */
  requester: string;
  note: string;
  /** Who took it on, once someone did. */
  helper: string | null;
  distanceKm: number;
  /** Shown as "+2 ₼ bonus" on a nearby row. */
  bonus: number;
  status: HelpStatus;
  /** `true` → the row belongs in the "Kömək istə" tab. */
  mine: boolean;
}

/** One list response: both sides of the board plus the earned-bonus block. */
export interface HelpBoard {
  /** The person's own requests ("Kömək istə"). */
  mine: HelpRequest[];
  /** Nearby requests from others ("Köməyə get"). */
  nearby: HelpRequest[];
  /** Total bonus already earned by helping — the `success-soft` block on the help tab. */
  earnedBonus: number;
  /** Who the last earned bonus came from, for the block's one-liner. */
  earnedFrom: string | null;
}

export const helpKind = (raw: unknown): HelpKind => {
  const value = str(raw).toLowerCase();
  return (HELP_KINDS as readonly string[]).includes(value) ? (value as HelpKind) : 'groceries';
};

const STATUSES: readonly HelpStatus[] = ['open', 'accepted', 'completed'];

export const helpStatus = (raw: unknown): HelpStatus => {
  const value = str(raw).toLowerCase();
  return (STATUSES as readonly string[]).includes(value) ? (value as HelpStatus) : 'open';
};

export function parseHelpRequest(raw: unknown): HelpRequest {
  const o = asObj(raw);
  const helper = str(o.helper);
  return {
    id: str(o.id),
    kind: helpKind(o.kind),
    requester: str(o.requester),
    note: str(o.note),
    helper: helper.length > 0 ? helper : null,
    distanceKm: num(o.distance_km ?? o.distanceKm),
    bonus: money(o.bonus),
    status: helpStatus(o.status),
    mine: bool(o.mine),
  };
}

export function parseHelpBoard(raw: unknown): HelpBoard {
  const o = asObj(raw);
  const earnedFrom = str(o.earned_from ?? o.earnedFrom);
  return {
    mine: asList(o.mine).map(parseHelpRequest),
    nearby: asList(o.nearby).map(parseHelpRequest),
    earnedBonus: money(o.earned_bonus ?? o.earnedBonus),
    earnedFrom: earnedFrom.length > 0 ? earnedFrom : null,
  };
}

/** A nearby request can be picked up while it is still open. */
export const canAccept = (request: HelpRequest): boolean => !request.mine && request.status === 'open';

/** The helper marks their own accepted errand done, which credits the bonus. */
export const canComplete = (request: HelpRequest): boolean =>
  !request.mine && request.status === 'accepted';

/** `350 m` under a kilometre, `1,1 km` above it. Distance is not money, so this may be derived. */
export function formatDistance(
  km: number,
  format: { number: (v: number, o?: Intl.NumberFormatOptions) => string },
  units: { m: string; km: string },
): string {
  if (km < 1) {
    return `${format.number(Math.round(km * 1000))} ${units.m}`;
  }
  return `${format.number(km, { maximumFractionDigits: 1 })} ${units.km}`;
}
