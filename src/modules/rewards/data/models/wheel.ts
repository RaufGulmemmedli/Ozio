/**
 * The wheel of fortune (N1).
 *
 * `mock-modules.md` §7 + `mock-contracts.ts` (`WheelSegment`, `WHEEL_RULES`, `weightedPick`).
 * The segment the wheel lands on is decided **server-side** (the MSW handler): the client posts a
 * spin, gets `index` back and only then animates. `weightedPick` lives here because the handler and
 * a future backend must agree on the rule, never because a view may call it.
 */
import { asList, asObj, int, num, str } from '@/core/network';

import { pickText, type Localized } from './localized';

export type WheelPrizeType = 'bonus' | 'coupon' | 'freeDelivery' | 'ticket' | 'nothing' | 'cashback';

/** Slice fill. The export paints brand / yellow / sky-soft / violet-soft / success-soft. */
export type WheelTone = 'brand' | 'yellow' | 'sky' | 'violet' | 'success';

export interface WheelSegment {
  id: string;
  label: string;
  type: WheelPrizeType;
  value: number;
  weight: number;
  tone: WheelTone;
}

export type WheelDayState = 'done' | 'today' | 'pending';

export interface WheelDay {
  /** 1 = Monday … 7 = Sunday, so the label key is `wheel.day.<weekday>`. */
  weekday: number;
  state: WheelDayState;
  /** Only on `today`: the streak length the brand dot shows. */
  streak: number | null;
}

export interface WheelState {
  segments: WheelSegment[];
  spinsUsed: number;
  maxSpins: number;
  /** AZN taken from the bonus balance for the 2nd spin — server data, never computed here. */
  paidSpinCost: number;
  streak: WheelDay[];
}

export interface WheelSpinResult {
  /** Index into `WheelState.segments` — the wheel animates to this slice. */
  index: number;
  segment: WheelSegment;
  spinsUsed: number;
  maxSpins: number;
  /** How many paid spins have been charged today (mock counter; nothing is really debited). */
  charged: number;
}

const TYPES: Record<string, WheelPrizeType> = {
  bonus: 'bonus',
  coupon: 'coupon',
  free_delivery: 'freeDelivery',
  freedelivery: 'freeDelivery',
  freeDelivery: 'freeDelivery',
  ticket: 'ticket',
  cashback: 'cashback',
  nothing: 'nothing',
  none: 'nothing',
};

const TONES: ReadonlySet<string> = new Set<WheelTone>(['brand', 'yellow', 'sky', 'violet', 'success']);

/** Fallback palette, in the order the export paints the 8 slices. */
const TONE_CYCLE: readonly WheelTone[] = [
  'brand',
  'yellow',
  'sky',
  'violet',
  'brand',
  'yellow',
  'success',
  'sky',
];

export function parseWheelSegment(json: unknown, index = 0, locale = 'az'): WheelSegment {
  const o = asObj(json);
  const type = TYPES[str(o.type ?? o.prize_type).trim()] ?? 'bonus';
  const rawTone = str(o.tone ?? o.color).trim();
  const weight = num(o.weight ?? o.probability, 1);
  return {
    id: str(o.id ?? o.segment_id) || `w${index + 1}`,
    label: pickText((o.label ?? o.name) as Localized, locale),
    type,
    value: num(o.value ?? o.amount ?? o.reward),
    weight: weight > 0 ? weight : 1,
    tone: TONES.has(rawTone) ? (rawTone as WheelTone) : (TONE_CYCLE[index % TONE_CYCLE.length] ?? 'brand'),
  };
}

function parseDay(json: unknown, index: number): WheelDay {
  const o = asObj(json);
  const raw = str(o.state).trim();
  const state: WheelDayState = raw === 'done' || raw === 'today' ? raw : 'pending';
  const streak = int(o.streak, 0);
  return {
    weekday: int(o.weekday, index + 1) || index + 1,
    state,
    streak: state === 'today' && streak > 0 ? streak : null,
  };
}

export function parseWheelState(json: unknown, locale = 'az'): WheelState {
  const o = asObj(json);
  const segments = asList(o.segments ?? o.wheel).map((row, i) => parseWheelSegment(row, i, locale));
  const maxSpins = int(o.max_spins ?? o.maxSpins, 2) || 2;
  return {
    segments,
    spinsUsed: Math.max(0, int(o.spins_used ?? o.spinsUsed, 0)),
    maxSpins,
    paidSpinCost: num(o.paid_spin_cost ?? o.paidSpinCost, 0),
    streak: asList(o.streak ?? o.days).map(parseDay),
  };
}

export function parseWheelSpin(json: unknown, state: WheelState, locale = 'az'): WheelSpinResult {
  const o = asObj(json);
  const byId = str(o.segment_id ?? o.segmentId);
  const indexFromId = state.segments.findIndex((s) => s.id === byId);
  const rawIndex = int(o.index, indexFromId >= 0 ? indexFromId : 0);
  const index =
    state.segments.length > 0 ? Math.min(Math.max(0, rawIndex), state.segments.length - 1) : 0;
  const fromState = state.segments[index];
  const segment = fromState ?? parseWheelSegment(o.segment, index, locale);
  return {
    index,
    segment,
    spinsUsed: Math.max(0, int(o.spins_used ?? o.spinsUsed, state.spinsUsed + 1)),
    maxSpins: int(o.max_spins ?? o.maxSpins, state.maxSpins) || state.maxSpins,
    charged: Math.max(0, int(o.charged, 0)),
  };
}

/** `true` while a spin is still allowed today. */
export const wheelCanSpin = (s: WheelState): boolean => s.spinsUsed < s.maxSpins;

/** `true` when the next spin is the paid one (the 1st of the day is free). */
export const wheelNextIsPaid = (s: WheelState): boolean => s.spinsUsed >= 1 && wheelCanSpin(s);

/** What the next spin costs: 0 for the free one. */
export const wheelNextCost = (s: WheelState): number => (wheelNextIsPaid(s) ? s.paidSpinCost : 0);

/**
 * The weighted draw from `WheelCubit` (`weight <= 0` counts as 1). The MSW handler owns it; it is
 * exported so the handler and a future server implementation share one definition.
 */
export function weightedPick(
  segments: readonly { readonly weight: number }[],
  rnd: () => number,
): number {
  if (segments.length === 0) return 0;
  const weightOf = (s: { readonly weight: number }) => (s.weight <= 0 ? 1 : s.weight);
  const total = segments.reduce((sum, s) => sum + weightOf(s), 0);
  let roll = rnd() * total;
  for (let i = 0; i < segments.length; i++) {
    roll -= weightOf(segments[i]!);
    if (roll <= 0) return i;
  }
  return segments.length - 1;
}

/**
 * Only `bonus` slices pay AZN, so only they render through `useFormat().money`. `cashback` is a
 * multiplier ("2x bonus"), `coupon` a percentage — those keep the fixture's worded label.
 */
export const wheelPrizeIsMoney = (s: WheelSegment): boolean => s.type === 'bonus' && s.value > 0;
