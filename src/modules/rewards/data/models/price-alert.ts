/**
 * Price alerts (N6) + the compact notification feed the screen previews.
 * `mock-modules.md` §7.
 */
import { asList, asObj, bool, money, nullableNum, nullableStr, str } from '@/core/network';

import { pickText, type Localized } from './localized';

export interface PriceAlert {
  id: string;
  productName: string;
  imageUrl: string | null;
  /** One emoji the export paints inside the 72px tile when there is no image. */
  emoji: string;
  storeName: string;
  currentPrice: number;
  /** The price when tracking started — shown struck through when it dropped. */
  trackedPrice: number;
  targetPrice: number | null;
  active: boolean;
}

export type FeedKind = 'priceDrop' | 'lottery' | 'bonus' | 'order' | 'birthday';
export type FeedPeriod = 'today' | 'week';

export interface FeedNotification {
  id: string;
  kind: FeedKind;
  title: string;
  body: string;
  /** Server string, rendered literally ("10:05", "Dünən", "B.e") — never re-formatted. */
  time: string;
  unread: boolean;
  period: FeedPeriod;
}

export interface PriceAlertsBoard {
  alerts: PriceAlert[];
  feed: FeedNotification[];
}

const KINDS: Record<string, FeedKind> = {
  price_drop: 'priceDrop',
  priceDrop: 'priceDrop',
  discount: 'priceDrop',
  lottery: 'lottery',
  ticket: 'lottery',
  order: 'order',
  birthday: 'birthday',
  bonus: 'bonus',
};

export function parsePriceAlert(json: unknown, locale = 'az'): PriceAlert {
  const o = asObj(json);
  return {
    id: str(o.id ?? o.alert_id),
    productName: pickText((o.productName ?? o.product_name) as Localized, locale),
    imageUrl: nullableStr(o.imageUrl ?? o.image_url),
    emoji: str(o.emoji),
    storeName: pickText((o.storeName ?? o.store_name) as Localized, locale),
    currentPrice: money(o.currentPrice ?? o.current_price),
    trackedPrice: money(o.trackedPrice ?? o.tracked_price),
    targetPrice: nullableNum(o.targetPrice ?? o.target_price),
    active: bool(o.active ?? o.is_active, true),
  };
}

export function parseFeedNotification(json: unknown, locale = 'az'): FeedNotification {
  const o = asObj(json);
  const raw = str(o.kind ?? o.type).trim();
  const read = o.is_read ?? o.read;
  return {
    id: str(o.id),
    kind: KINDS[raw] ?? 'bonus',
    title: pickText((o.title ?? o.name) as Localized, locale),
    body: pickText((o.body ?? o.text) as Localized, locale),
    time: pickText(o.time as Localized, locale),
    unread: read === undefined ? bool(o.unread, true) : !bool(read),
    period: str(o.period).trim() === 'week' ? 'week' : 'today',
  };
}

export function parsePriceAlertsBoard(json: unknown, locale = 'az'): PriceAlertsBoard {
  const o = asObj(json);
  return {
    alerts: asList(o.alerts ?? o.items).map((row) => parsePriceAlert(row, locale)),
    feed: asList(o.feed ?? o.notifications).map((row) => parseFeedNotification(row, locale)),
  };
}

export const alertDelta = (a: PriceAlert): number => money(a.currentPrice - a.trackedPrice);

export const alertDropped = (a: PriceAlert): boolean => alertDelta(a) < 0;

export const alertTargetHit = (a: PriceAlert): boolean =>
  a.targetPrice !== null && a.currentPrice <= a.targetPrice;

/** Signed change in percent; 0 when the tracked price is unusable. */
export const alertPercentChange = (a: PriceAlert): number =>
  a.trackedPrice <= 0 ? 0 : (alertDelta(a) / a.trackedPrice) * 100;

export const feedByPeriod = (
  rows: readonly FeedNotification[],
  period: FeedPeriod,
): FeedNotification[] => rows.filter((r) => r.period === period);
