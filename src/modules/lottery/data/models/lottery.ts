/**
 * Lottery domain models.
 *
 * What the API really sends (api/lottery.md, re-verified 2026-11-12):
 *
 *   `GET v1/lotteries/active`
 *     `{ ticketsCount, activeLottery: { id, name, uploads{object_key},
 *        lotteries_uploads[{uploads{object_key}}] } }`
 *     — and **nothing else**: no description, subtitle, status, start/end/draw date,
 *       prizes, winners or "amount to next ticket". `ticketsCount` is the number of
 *       tickets the **current user** holds, NOT tickets sold.
 *
 *   `GET v1/lotteries/active/details?lottery_id=` (the id is REQUIRED — 500 without it)
 *     `data.details = { id, name, amount, start_date, end_date, organizer, legal_address,
 *        actual_address, vat_number, phone_number, uploads{object_key},
 *        lottery_prizes[{name, quantity, lottery_prizes_uploads[{uploads{object_key}}]}] }`
 *     — `amount` is the **receipt sum in AZN that earns one ticket**. Winners are never sent.
 *
 *   `GET v1/lotteries/tickets?lottery_id=&limit=&offset=` (id REQUIRED — 500 without it)
 *     `{ total, lotteries[], logo{object_key}, limit, offset }`
 *     — the test account holds no tickets, so the row shape inside `lotteries[]` has never
 *       been observed: {@link parseLotteryTicket} is deliberately tolerant and every field
 *       is optional at the UI level.
 *
 *   `GET v1/lotteries/policy` → `{ content }`, one ~4 KB HTML string, no locale field.
 *
 * Parsers never throw.
 */
import { asList, asObj, int, money, num, str } from '@/core/network';

import { wallMoment, type WallMoment } from './wall-moment';

/* -------------------------------------------------------------- active lottery */

export interface ActiveLottery {
  id: number;
  /** The only text the `active` endpoint sends, e.g. "Noyabr çəkilişi". */
  name: string;
  /** `activeLottery.uploads.object_key` — the square logo (already a full CDN URL). */
  logoUrl: string | null;
  /** `activeLottery.lotteries_uploads[].uploads.object_key` — wide banners. */
  bannerUrls: string[];
}

export interface ActiveLotterySummary {
  /** `ticketsCount` — how many tickets **this user** holds. */
  myTickets: number;
  /** `null` when no draw is running (the live payload for that case is unobserved). */
  lottery: ActiveLottery | null;
}

/** `uploads: {object_key}` / `*_uploads: [{uploads: {object_key}}]` / a bare string. */
function uploadUrl(raw: unknown): string | null {
  if (typeof raw === 'string') return raw.trim() ? raw : null;
  const o = asObj(raw);
  const direct = str(o.object_key) || str(o.image_url) || str(o.url) || str(o.path);
  if (direct) return direct;
  const nested = asObj(o.uploads);
  const inner = str(nested.object_key) || str(nested.image_url) || str(nested.url);
  return inner ? inner : null;
}

function uploadUrls(raw: unknown): string[] {
  const out: string[] = [];
  for (const row of asList(raw)) {
    const url = uploadUrl(row);
    if (url) out.push(url);
  }
  return out;
}

export function parseActiveLottery(envelopeData: unknown): ActiveLotterySummary {
  const root = asObj(envelopeData);
  const inner =
    root.activeLottery ?? root.active_lottery ?? root.lottery ?? root.details ?? root.data;
  const o = asObj(inner);
  const id = int(o.id);

  const myTickets = num(root.ticketsCount ?? root.tickets_count ?? o.ticketsCount);

  if (id <= 0 && !str(o.name)) return { myTickets, lottery: null };

  return {
    myTickets,
    lottery: {
      id,
      name: str(o.name) || str(o.title),
      logoUrl: uploadUrl(o.uploads) ?? uploadUrl(o.image),
      bannerUrls: uploadUrls(o.lotteries_uploads ?? o.lottery_uploads),
    },
  };
}

/* -------------------------------------------------------------------- details */

export interface LotteryPrize {
  name: string;
  /** How many of this prize are drawn. Defaults to 1 when the row omits it. */
  quantity: number;
  imageUrl: string | null;
}

export interface LotteryDetails {
  id: number;
  name: string;
  /** `details.amount` — the receipt sum in AZN that earns one ticket. */
  amountPerTicket: number | null;
  startsAt: WallMoment | null;
  /** The draw moment. Baku wall-clock, read literally. */
  endsAt: WallMoment | null;
  organizer: string;
  address: string;
  phone: string;
  vatNumber: string;
  logoUrl: string | null;
  prizes: LotteryPrize[];
}

export function parseLotteryPrize(raw: unknown): LotteryPrize {
  const o = asObj(raw);
  return {
    name: str(o.name) || str(o.title),
    quantity: Math.max(int(o.quantity ?? o.count ?? o.qty, 1), 1),
    imageUrl: uploadUrl(asList(o.lottery_prizes_uploads)[0]) ?? uploadUrl(o.image),
  };
}

export function parseLotteryDetails(envelopeData: unknown): LotteryDetails | null {
  const root = asObj(envelopeData);
  const inner = root.details ?? root.data ?? root;
  const o = asObj(inner);
  const id = int(o.id);
  if (id <= 0 && !str(o.name)) return null;

  const amount = o.amount;

  return {
    id,
    name: str(o.name) || str(o.title),
    amountPerTicket: amount === undefined || amount === null ? null : money(amount),
    startsAt: wallMoment(o.start_date),
    endsAt: wallMoment(o.end_date),
    organizer: str(o.organizer),
    address: str(o.actual_address) || str(o.legal_address),
    phone: str(o.phone_number),
    vatNumber: str(o.vat_number),
    logoUrl: uploadUrl(o.uploads) ?? uploadUrl(o.image),
    prizes: asList(o.lottery_prizes ?? o.prizes).map(parseLotteryPrize),
  };
}

/* -------------------------------------------------------------------- tickets */

/** Inferred from the Flutter status map; the live strings have never been seen. */
export type LotteryTicketStatus = 'pending' | 'won' | 'lost' | 'unknown';

export interface LotteryTicket {
  /** Whatever identifies the row — used for the detail URL. */
  id: string;
  /** Printed number, e.g. "004 218 337". May be empty. */
  number: string;
  /** Machine code, e.g. "OZ-LT-004218337". May be empty. */
  code: string;
  status: LotteryTicketStatus;
  /** When the ticket was earned. */
  createdAt: WallMoment | null;
  /** The draw date carried on the row, when it carries one. */
  drawAt: WallMoment | null;
  /** Store / branch the receipt came from, when sent. */
  store: string;
  /** Receipt amount that earned the ticket, when sent. */
  amount: number | null;
  receiptNo: string;
  /** Prize name on a winning ticket, when sent. */
  prize: string;
}

const STATUSES: Record<string, LotteryTicketStatus> = {
  pending: 'pending',
  active: 'pending',
  waiting: 'pending',
  won: 'won',
  winner: 'won',
  win: 'won',
  lost: 'lost',
  lose: 'lost',
};

export function parseLotteryTicket(raw: unknown): LotteryTicket {
  const o = asObj(raw);
  const number = str(o.number) || str(o.ticket_number) || str(o.no);
  const code = str(o.code) || str(o.ticket_code);
  const amount = o.amount ?? o.receipt_amount ?? o.total;

  return {
    id: str(o.id) || code || number,
    number,
    code,
    status: STATUSES[str(o.status).toLowerCase()] ?? (str(o.status) ? 'unknown' : 'pending'),
    createdAt: wallMoment(o.created_at ?? o.createdAt ?? o.date),
    drawAt: wallMoment(o.draw_date ?? o.date),
    store: str(o.store_name) || str(o.store) || str(o.market_name) || str(o.branch_name),
    amount: amount === undefined || amount === null ? null : money(amount),
    receiptNo: str(o.receipt_number) || str(o.receipt_no) || str(o.check_number),
    prize: str(o.prize_name) || str(o.prize_title) || str(o.prize),
  };
}

/* --------------------------------------------------------------------- policy */

export interface LotteryPolicy {
  /**
   * The raw CKEditor HTML from `data.content`. **Always** render it through
   * `sanitizePolicyHtml()` — never with a bare `dangerouslySetInnerHTML`.
   */
  html: string;
}

export function parseLotteryPolicy(envelopeData: unknown): LotteryPolicy {
  const o = asObj(envelopeData);
  const html = str(o.content) || str(o.description) || str(o.text) || str(envelopeData);
  return { html: html.trim() };
}

/** `completed`-style flags that may or may not arrive; kept tolerant. */
export const isDrawDone = (details: LotteryDetails | null, now: Date = new Date()): boolean =>
  details?.endsAt ? details.endsAt.at.getTime() <= now.getTime() : false;

/** Total prize count = the sum of the quantities, which is all the API lets us say. */
export const totalPrizeCount = (prizes: readonly LotteryPrize[]): number =>
  prizes.reduce((sum, prize) => sum + prize.quantity, 0);
