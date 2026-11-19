/**
 * The live price-drop auction.
 *
 * **Everything that moves is a server value.** The price, the stock, the bid log, `endsAt` and
 * `nextDropAt` all arrive from the mock, which derives them from its own clock and its own stored
 * `startedAt`. The client:
 *
 *  - never starts a timer at mount to decide a price;
 *  - never decides whether a bid is high enough (the handler answers 422);
 *  - counts down to `nextDropAt` / `endsAt` and **refetches** when one elapses, so the ended state
 *    is the server's verdict rather than a guess.
 */
import { asList, asObj, bool, dateIso, int, money, pickTranslation, str } from '@/core/network';

export const AUCTION_STATUSES = ['live', 'ended'] as const;
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];

export interface AuctionBid {
  id: string;
  /** The bidder's display name; `isMine` marks the user's own. */
  name: string;
  amount: number;
  at: string | null;
  isMine: boolean;
}

export interface Auction {
  id: string;
  /** Localized, e.g. 'Televizor 55" 4K'. */
  title: string;
  icon: string;
  startPrice: number;
  floorPrice: number;
  /** The live price as of the instant the server answered. */
  currentPrice: number;
  /** AZN the price falls by on each drop. */
  step: number;
  /** Seconds between drops — the subtitle copy reads it instead of hardcoding 5. */
  secondsPerDrop: number;
  totalStock: number;
  stockLeft: number;
  status: AuctionStatus;
  /** When the run ends (the floor price is reached). ISO, from the mock. */
  endsAt: string | null;
  /** When the price next falls. ISO, from the mock. `null` once ended. */
  nextDropAt: string | null;
  /** Newest first, including the user's own if there is one. */
  bids: AuctionBid[];
  /** The user's winning bid, when they have one. */
  myBid: AuctionBid | null;
}

const asStatus = (v: unknown): AuctionStatus => {
  const s = str(v).toLowerCase();
  return (AUCTION_STATUSES as readonly string[]).includes(s) ? (s as AuctionStatus) : 'live';
};

export function parseAuctionBid(raw: unknown): AuctionBid {
  const row = asObj(raw);
  return {
    id: str(row.id),
    name: str(row.name),
    amount: money(row.amount),
    at: dateIso(row.at),
    isMine: bool(row.is_mine),
  };
}

export function parseAuction(raw: unknown, locale = 'az'): Auction {
  const row = asObj(raw);
  const bids = asList(row.bids).map(parseAuctionBid);
  return {
    id: str(row.id),
    title: pickTranslation(row.title_translations, locale),
    icon: str(row.icon),
    startPrice: money(row.start_price),
    floorPrice: money(row.floor_price),
    currentPrice: money(row.current_price),
    step: money(row.step),
    secondsPerDrop: int(row.seconds_per_drop, 5),
    totalStock: int(row.total_stock),
    stockLeft: int(row.stock_left),
    status: asStatus(row.status),
    endsAt: dateIso(row.ends_at),
    nextDropAt: dateIso(row.next_drop_at),
    bids,
    myBid: bids.find((bid) => bid.isMine) ?? null,
  };
}

/**
 * What the user sees after the run is over. `live` while it runs, `bought` when they have a
 * winning bid, `missed` when it ended without one — the three states the export draws
 * ("Canlı" / "Aldın!" / "Qaçırdın").
 *
 * This is a *projection* of server fields, not a decision: both `status` and `myBid` come from the
 * mock.
 */
export type AuctionOutcome = 'live' | 'bought' | 'missed';

export const auctionOutcome = (auction: Auction): AuctionOutcome => {
  if (auction.myBid) return 'bought';
  return auction.status === 'ended' || auction.stockLeft === 0 ? 'missed' : 'live';
};

/** 0…100 of the stock still available, for the drawn progress bar. */
export const stockPercent = (auction: Auction): number =>
  auction.totalStock <= 0
    ? 0
    : Math.min(100, Math.max(0, Math.round((auction.stockLeft / auction.totalStock) * 100)));

/**
 * The threshold for the drawn "Tez bitir" pill.
 *
 * Taken from the export rather than guessed: V6 shows the pill at **63 / 100 left**, so the design
 * treats "a third already gone" as going fast — which fits the screen's own warning that the stock
 * drains as the price falls.
 */
export const STOCK_LOW_PERCENT = 65;
