/**
 * MSW handlers for the viral module. **Everything here is mocked** — swagger has no `/viral/*`
 * operation (`api/mock-modules.md` §18 lists the PROPOSED REST shape these handlers imitate).
 *
 *   GET    /api/mock/viral/products?locale=                 the gift catalogue
 *   GET    /api/mock/viral/wishlists?locale=                offset/limit page of wishlists
 *   POST   /api/mock/viral/wishlists                        create (product + date required)
 *   GET    /api/mock/viral/wishlists/{id}?locale=           one wishlist, with contributions
 *   DELETE /api/mock/viral/wishlists/{id}                   remove one
 *   POST   /api/mock/viral/wishlists/{id}/contributions     add a share; **nothing is charged**
 *   GET    /api/mock/viral/auctions?locale=                 live price + stock per auction
 *   GET    /api/mock/viral/auctions/{id}?locale=            + the bid log and `ends_at`
 *   POST   /api/mock/viral/auctions/{id}/bid                **validated here**, 422 when too low
 *   POST   /api/mock/viral/auctions/{id}/restart            re-arms the run ("Yenidən oyna")
 *   POST   /api/mock/viral/receipts/scan                    multipart; returns the sample receipt
 *   POST   /api/mock/viral/receipts/add-to-cart             returns the count; adds nothing
 *
 * Four rules this file exists to keep:
 *
 * 1. **Every clock is the server's.** An auction stores a `startedAt` instant once; its price,
 *    stock, `ends_at` and `next_drop_at` are all derived from that instant and the handler's own
 *    "now" on every read. Nothing is a duration captured at mount, so a reload, a remount or a
 *    second tab all agree, and the demo survives a refresh.
 * 2. **Bid validation lives here.** A bid below the live price is answered with a 422 carrying a
 *    field error, which the form displays. The client never decides whether a bid is valid — if a
 *    tab's ticker lagged behind a drop, its stale offer is simply rejected.
 * 3. **All arithmetic lives here.** Prices, raised totals, progress percentages, line totals and
 *    savings are computed in the handler and carried by the response.
 * 4. **Nothing is bought or charged.** A contribution and a bid both write a demo row with
 *    `simulated: true`; no real cart, order or payment is touched, and the real host is
 *    unreachable from `remote.mock('viral')` by construction.
 *
 * Demo state persists to `localStorage` under `ozio.mock.viral`.
 *
 * The scan handler receives a **downscaled** image from the browser and never looks at the pixels;
 * MSW answers inside the page's own service worker, so the photo never leaves the device.
 */
import { http } from 'msw';

import {
  delay,
  flagged,
  mockError,
  mockId,
  mockJson,
  mockPage,
  mockPath,
  mockValidationError,
  registerMockHandlers,
} from '@/core/mocks';
import { createMockDb } from '@/core/mocks/db';
import { asObj, int, num, str } from '@/core/network';

import { VIRAL_MOCK_MODULE } from '../viral.flags';
import {
  AUCTION_SEED,
  BIDDER_NAMES,
  GIFT_PRODUCT_SEED,
  MIN_RECOGNIZABLE_WIDTH,
  OCCASIONS,
  RECEIPT_DISCOUNT_PERCENT,
  RECEIPT_ITEM_SEED,
  RECEIPT_STORE,
  SECONDS_PER_DROP,
  SECONDS_PER_STOCK_UNIT,
  SELF_CONTRIBUTOR,
  SHARE_LINK_BASE,
  VIRAL_DELAY_MS,
  VIRAL_SCAN_DELAY_MS,
  WISHLIST_SEED,
  type OccasionKey,
  type Translations,
} from './viral.fixtures';

/* ------------------------------------------------------------------ demo state */

interface StoredContribution {
  id: string;
  /** A seeded contributor's plain name; `null` for the user's own (which is translated). */
  name: string | null;
  mine: boolean;
  amount: number;
  at: string;
}

interface StoredWishlist {
  id: string;
  productId: string;
  /** Set for a wishlist the user created, whose product is a free-form pick from the catalogue. */
  occasion: OccasionKey;
  targetDate: string;
  /** Translated for the seeds; a single string for a user-written message. */
  message: Translations | string;
  contributions: StoredContribution[];
}

interface StoredBid {
  id: string;
  name: string | null;
  mine: boolean;
  amount: number;
  at: string;
}

interface StoredAuction {
  id: string;
  /** The instant the run began. Everything about this auction is derived from it. */
  startedAt: number;
  bids: StoredBid[];
}

interface ViralDb {
  wishlists: StoredWishlist[];
  auctions: StoredAuction[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const seed = (): ViralDb => {
  const now = Date.now();
  return {
    wishlists: WISHLIST_SEED.map((w) => ({
      id: w.id,
      productId: w.productId,
      occasion: w.occasion,
      targetDate: new Date(now + w.inDays * DAY_MS).toISOString(),
      message: w.message,
      contributions: w.contributions.map(([name, amount, hoursAgo], index) => ({
        id: `${w.id}-x${index + 1}`,
        name,
        mine: false,
        amount,
        at: new Date(now - hoursAgo * HOUR_MS).toISOString(),
      })),
    })),
    auctions: AUCTION_SEED.map((a) => ({
      id: a.id,
      // The head start is what makes `a3` nearly over, so the ended state is reachable quickly.
      startedAt: now - a.headStartSec * 1000,
      bids: [],
    })),
  };
};

const db = createMockDb<ViralDb>(VIRAL_MOCK_MODULE, seed);

/* ------------------------------------------------------------------ arithmetic */

const round2 = (v: number): number => Math.round(v * 100) / 100;

const rows = (t: Translations) => t.map((row) => ({ ...row }));

const oneString = (text: string): Translations => [
  { locale: 'az', name: text },
  { locale: 'ru', name: text },
  { locale: 'en', name: text },
];

const messageRows = (message: Translations | string) =>
  typeof message === 'string' ? oneString(message) : rows(message);

/* ------------------------------------------------------------------- products */

const productSeedFor = (id: string) =>
  GIFT_PRODUCT_SEED.find((p) => p.id === id) ?? GIFT_PRODUCT_SEED[0]!;

const productResponse = (id: string) => {
  const product = productSeedFor(id);
  return {
    id: product.id,
    name_translations: rows(product.name),
    price: product.price,
    icon: product.icon,
  };
};

/* ------------------------------------------------------------------ wishlists */

const wishlistResponse = (list: StoredWishlist, now: Date) => {
  const product = productSeedFor(list.productId);
  const raised = round2(list.contributions.reduce((sum, c) => sum + c.amount, 0));
  const target = product.price;
  const progress = target <= 0 ? 0 : Math.min(100, Math.round((raised / target) * 100));
  const targetMs = Date.parse(list.targetDate);
  const daysLeft = Number.isFinite(targetMs)
    ? Math.max(0, Math.ceil((targetMs - now.getTime()) / DAY_MS))
    : 0;

  return {
    id: list.id,
    product: productResponse(list.productId),
    occasion: list.occasion,
    target_date: list.targetDate,
    days_left: daysLeft,
    message_translations: messageRows(list.message),
    contributions: list.contributions.map((c) => ({
      id: c.id,
      // The user's own share is a translated label; everyone else has a real name.
      name: c.mine ? '' : (c.name ?? ''),
      name_translations: c.mine ? rows(SELF_CONTRIBUTOR) : [],
      amount: c.amount,
      at: c.at,
      is_mine: c.mine,
      simulated: true,
    })),
    contributor_count: list.contributions.length,
    raised,
    target,
    progress_percent: progress,
    completed: raised >= target,
    share_link: `${SHARE_LINK_BASE}/${list.id}`,
  };
};

/* ------------------------------------------------------------------- auctions */

/**
 * The whole auction, derived from `startedAt` and the handler's own clock.
 *
 * - price falls by `step` every `SECONDS_PER_DROP` and stops at `floorPrice`;
 * - one unit of stock leaves every `SECONDS_PER_STOCK_UNIT`, plus one per real bid — the same
 *   "stock drains as the price falls" story the design tells, but deterministic, so a reload does
 *   not teleport the counter;
 * - the run ends when the floor is reached **or** the stock is gone, whichever comes first.
 */
function auctionState(stored: StoredAuction, now: Date) {
  const config = AUCTION_SEED.find((a) => a.id === stored.id) ?? AUCTION_SEED[0]!;
  const elapsedSec = Math.max(0, Math.floor((now.getTime() - stored.startedAt) / 1000));

  const drops = Math.floor(elapsedSec / SECONDS_PER_DROP);
  const dropsToFloor = Math.ceil((config.startPrice - config.floorPrice) / config.step);
  const currentPrice = Math.max(config.floorPrice, config.startPrice - drops * config.step);

  const syntheticSold = Math.floor(elapsedSec / SECONDS_PER_STOCK_UNIT);
  const soldToBids = stored.bids.length;
  const stockLeft = Math.max(0, config.totalStock - syntheticSold - soldToBids);

  const endsAtMs = stored.startedAt + dropsToFloor * SECONDS_PER_DROP * 1000;
  const stockOutMs =
    config.totalStock > 0
      ? stored.startedAt + (config.totalStock - soldToBids) * SECONDS_PER_STOCK_UNIT * 1000
      : stored.startedAt;
  const finishMs = Math.min(endsAtMs, stockOutMs);

  const ended = now.getTime() >= finishMs || stockLeft === 0 || currentPrice <= config.floorPrice;
  const nextDropMs = stored.startedAt + (drops + 1) * SECONDS_PER_DROP * 1000;

  return {
    config,
    elapsedSec,
    currentPrice: round2(currentPrice),
    stockLeft,
    ended,
    finishMs,
    nextDropMs: ended ? null : nextDropMs,
  };
}

/**
 * The synthetic bid log: one bid per sold unit, at the price that was live when it sold. It is a
 * pure function of elapsed time, so the log a user sees after a reload is the same log.
 */
function syntheticBids(stored: StoredAuction, now: Date) {
  const { config, elapsedSec } = auctionState(stored, now);
  const sold = Math.min(
    Math.floor(elapsedSec / SECONDS_PER_STOCK_UNIT),
    config.totalStock,
  );
  // Only the tail is interesting — the log is a live feed, not an archive.
  const from = Math.max(0, sold - 12);
  const out: StoredBid[] = [];
  for (let i = sold; i > from; i -= 1) {
    const atSec = i * SECONDS_PER_STOCK_UNIT;
    const priceThen = Math.max(
      config.floorPrice,
      config.startPrice - Math.floor(atSec / SECONDS_PER_DROP) * config.step,
    );
    out.push({
      id: `${stored.id}-s${i}`,
      name: BIDDER_NAMES[i % BIDDER_NAMES.length] ?? 'Ozio',
      mine: false,
      amount: round2(priceThen),
      at: new Date(stored.startedAt + atSec * 1000).toISOString(),
    });
  }
  return out;
}

const bidRow = (bid: StoredBid) => ({
  id: bid.id,
  name: bid.mine ? '' : (bid.name ?? ''),
  name_translations: bid.mine ? rows(SELF_CONTRIBUTOR) : [],
  amount: bid.amount,
  at: bid.at,
  is_mine: bid.mine,
  simulated: true,
});

function auctionResponse(stored: StoredAuction, now: Date, withBids: boolean) {
  const state = auctionState(stored, now);
  const { config } = state;

  const bids = withBids
    ? [...stored.bids, ...syntheticBids(stored, now)]
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
        .slice(0, 15)
        .map(bidRow)
    : [];

  return {
    id: stored.id,
    title_translations: rows(config.title),
    icon: config.icon,
    start_price: config.startPrice,
    floor_price: config.floorPrice,
    current_price: state.currentPrice,
    step: config.step,
    seconds_per_drop: SECONDS_PER_DROP,
    total_stock: config.totalStock,
    stock_left: state.stockLeft,
    status: state.ended ? 'ended' : 'live',
    ends_at: new Date(state.finishMs).toISOString(),
    next_drop_at: state.nextDropMs === null ? null : new Date(state.nextDropMs).toISOString(),
    bids,
  };
}

/* -------------------------------------------------------------------- receipt */

const receiptResponse = () => {
  const items = RECEIPT_ITEM_SEED.map((item, index) => ({
    id: `r${index + 1}`,
    name_translations: rows(item.name),
    qty: item.qty,
    store_price: item.storePrice,
    ozio_price: item.ozioPrice,
    line_store_total: round2(item.storePrice * item.qty),
    line_ozio_total: round2(item.ozioPrice * item.qty),
  }));

  const storeTotal = round2(items.reduce((sum, i) => sum + i.line_store_total, 0));
  const ozioTotal = round2(items.reduce((sum, i) => sum + i.line_ozio_total, 0));

  return {
    recognized: true,
    store_name_translations: rows(RECEIPT_STORE),
    date_label_translations: [
      { locale: 'az', name: 'Dünən' },
      { locale: 'ru', name: 'Вчера' },
      { locale: 'en', name: 'Yesterday' },
    ],
    items,
    item_count: items.length,
    store_total: storeTotal,
    ozio_total: ozioTotal,
    saving: round2(storeTotal - ozioTotal),
    discount_percent: RECEIPT_DISCOUNT_PERCENT,
  };
};

const unrecognizedResponse = () => ({
  recognized: false,
  store_name_translations: [],
  date_label_translations: [],
  items: [],
  item_count: 0,
  store_total: 0,
  ozio_total: 0,
  saving: 0,
  discount_percent: 0,
});

/* ------------------------------------------------------------------ handlers */

export const viralHandlers = [
  /** The five gift products the create form picks from. */
  http.get(mockPath(VIRAL_MOCK_MODULE, 'products'), async ({ request }) => {
    await delay(VIRAL_DELAY_MS);
    const list = GIFT_PRODUCT_SEED.map((p) => productResponse(p.id));
    return mockJson(mockPage(list, request.url));
  }),

  /** The user's wishlists, paged the way every real list endpoint is. */
  http.get(mockPath(VIRAL_MOCK_MODULE, 'wishlists'), async ({ request }) => {
    await delay(VIRAL_DELAY_MS);
    const now = new Date();
    const list = db.get().wishlists.map((w) => wishlistResponse(w, now));
    return mockJson(mockPage(list, request.url));
  }),

  /**
   * Creating a wishlist. `product_id` and `target_date` are required (V3's "Required: product +
   * date"), and a missing one comes back as a 422 the form maps onto the field.
   */
  http.post(mockPath(VIRAL_MOCK_MODULE, 'wishlists'), async ({ request }) => {
    const body = asObj(await request.json().catch(() => null));
    const productId = str(body.product_id);
    const targetDate = str(body.target_date).trim();
    const occasionRaw = str(body.occasion).toLowerCase();
    const message = str(body.message).trim();

    const issues = [
      ...(GIFT_PRODUCT_SEED.some((p) => p.id === productId)
        ? []
        : [{ path: 'product_id', message: 'Pick a gift' }]),
      ...(targetDate && Number.isFinite(Date.parse(targetDate))
        ? []
        : [{ path: 'target_date', message: 'A target date is required' }]),
    ];
    if (issues.length > 0) return mockValidationError(issues);

    await delay(VIRAL_DELAY_MS);

    const occasion: OccasionKey = (OCCASIONS as readonly string[]).includes(occasionRaw)
      ? (occasionRaw as OccasionKey)
      : 'birthday';

    const created: StoredWishlist = {
      // `mockId` rather than `c<len+1>`: mock-modules.md §18 warns the Flutter scheme collides
      // after a delete, so the web generates unique ids.
      id: mockId('c'),
      productId,
      occasion,
      targetDate: new Date(Date.parse(targetDate)).toISOString(),
      message,
      contributions: [],
    };

    db.set((prev) => ({ ...prev, wishlists: [created, ...prev.wishlists] }));
    return mockJson(wishlistResponse(created, new Date()));
  }),

  /** One wishlist. 404 for an unknown id, so the detail screen renders its not-found state. */
  http.get(mockPath(VIRAL_MOCK_MODULE, 'wishlists/:id'), async ({ params }) => {
    const id = str(params.id);
    const found = db.get().wishlists.find((w) => w.id === id);
    if (!found) return mockError(404, 'Wishlist not found');
    await delay(VIRAL_DELAY_MS);
    return mockJson(wishlistResponse(found, new Date()));
  }),

  http.delete(mockPath(VIRAL_MOCK_MODULE, 'wishlists/:id'), async ({ params }) => {
    const id = str(params.id);
    if (!db.get().wishlists.some((w) => w.id === id)) {
      return mockError(404, 'Wishlist not found');
    }
    await delay(400);
    db.set((prev) => ({ ...prev, wishlists: prev.wishlists.filter((w) => w.id !== id) }));
    return mockJson({ deleted: true, id });
  }),

  /**
   * Adding a share. **Nothing is charged** — the row is stored with `simulated: true` and the
   * screen says so. A non-positive or absurd amount is a 422, so the dialog's amount field shows
   * the server's message rather than guessing a limit.
   */
  http.post(
    mockPath(VIRAL_MOCK_MODULE, 'wishlists/:id/contributions'),
    async ({ params, request }) => {
      const id = str(params.id);
      const body = asObj(await request.json().catch(() => null));
      const amount = round2(num(body.amount));

      const list = db.get().wishlists.find((w) => w.id === id);
      if (!list) return mockError(404, 'Wishlist not found');

      if (!(amount > 0)) {
        return mockValidationError([
          { path: 'amount', message: 'The amount must be greater than zero' },
        ]);
      }
      const target = productSeedFor(list.productId).price;
      if (amount > target) {
        return mockValidationError([
          { path: 'amount', message: `The amount cannot exceed the target of ${target}` },
        ]);
      }

      await delay(VIRAL_DELAY_MS);

      const contribution: StoredContribution = {
        id: mockId('x'),
        name: null,
        mine: true,
        amount,
        at: new Date().toISOString(),
      };

      const next = db.set((prev) => ({
        ...prev,
        wishlists: prev.wishlists.map((w) =>
          w.id === id
            ? // New contributions are prepended (mock-modules.md §18).
              { ...w, contributions: [contribution, ...w.contributions] }
            : w,
        ),
      }));

      const updated = next.wishlists.find((w) => w.id === id)!;
      return mockJson(wishlistResponse(updated, new Date()));
    },
  ),

  /** The auction list: live price and stock per row, no bid log (the cards do not show one). */
  http.get(mockPath(VIRAL_MOCK_MODULE, 'auctions'), async ({ request }) => {
    await delay(VIRAL_DELAY_MS);
    const now = new Date();
    const list = db.get().auctions.map((a) => auctionResponse(a, now, false));
    return mockJson(mockPage(list, request.url));
  }),

  /** One auction, with the bid log and the two instants the screen counts down to. */
  http.get(mockPath(VIRAL_MOCK_MODULE, 'auctions/:id'), async ({ params }) => {
    const id = str(params.id);
    const found = db.get().auctions.find((a) => a.id === id);
    if (!found) return mockError(404, 'Auction not found');
    await delay(300);
    return mockJson(auctionResponse(found, new Date(), true));
  }),

  /**
   * **The bid.** This is where validation belongs.
   *
   * The client sends the amount it is looking at. The handler compares it with the price that is
   * live *now*:
   *
   *  - below the live price → 422 `{ path: 'amount' }`, which the bid form renders. This is the
   *    stale-ticker case: the price dropped, the tab had not caught up, and the offer is refused
   *    rather than silently accepted at the wrong number.
   *  - the run is over, or the stock is gone → 422 as well, so the dialog explains it and the
   *    screen then refetches into the ended state.
   *  - already bid → 422; one unit per person in the demo.
   *
   * On success the bid is stored (which also takes a unit of stock) and the **whole auction** is
   * returned, so the client's next render is server state, not an optimistic guess.
   */
  http.post(mockPath(VIRAL_MOCK_MODULE, 'auctions/:id/bid'), async ({ params, request }) => {
    const id = str(params.id);
    const body = asObj(await request.json().catch(() => null));
    const amount = round2(num(body.amount));

    const stored = db.get().auctions.find((a) => a.id === id);
    if (!stored) return mockError(404, 'Auction not found');

    const now = new Date();
    const state = auctionState(stored, now);

    if (state.ended) {
      return mockValidationError([
        { path: 'amount', message: 'This auction has already ended' },
      ]);
    }
    if (state.stockLeft <= 0) {
      return mockValidationError([{ path: 'amount', message: 'This auction is sold out' }]);
    }
    if (stored.bids.some((bid) => bid.mine)) {
      return mockValidationError([
        { path: 'amount', message: 'You have already bought one unit in this auction' },
      ]);
    }
    if (!(amount > 0)) {
      return mockValidationError([
        { path: 'amount', message: 'The amount must be greater than zero' },
      ]);
    }
    // The core rule: a bid below the current price is rejected.
    if (amount < state.currentPrice) {
      return mockValidationError([
        {
          path: 'amount',
          message: `The price is now ${state.currentPrice}; bid at least that much`,
        },
      ]);
    }

    await delay(700);

    const bid: StoredBid = {
      id: mockId('bid'),
      name: null,
      mine: true,
      // The *server's* price is what is charged, not the number the client sent.
      amount: state.currentPrice,
      at: new Date().toISOString(),
    };

    const next = db.set((prev) => ({
      ...prev,
      auctions: prev.auctions.map((a) => (a.id === id ? { ...a, bids: [bid, ...a.bids] } : a)),
    }));

    const updated = next.auctions.find((a) => a.id === id)!;
    return mockJson(auctionResponse(updated, new Date(), true));
  }),

  /**
   * "Yenidən oyna" from the `Qaçırdın` state: re-arms the run from the start price. Only the demo
   * has this — a real auction does not restart — which is why it is a separate operation rather
   * than a side effect of a read.
   */
  http.post(mockPath(VIRAL_MOCK_MODULE, 'auctions/:id/restart'), async ({ params }) => {
    const id = str(params.id);
    if (!db.get().auctions.some((a) => a.id === id)) {
      return mockError(404, 'Auction not found');
    }
    await delay(400);
    const next = db.set((prev) => ({
      ...prev,
      auctions: prev.auctions.map((a) =>
        a.id === id ? { id: a.id, startedAt: Date.now(), bids: [] } : a,
      ),
    }));
    const updated = next.auctions.find((a) => a.id === id)!;
    return mockJson(auctionResponse(updated, new Date(), true));
  }),

  /**
   * The receipt "recognition".
   *
   * The browser sends a **downscaled** image as multipart, together with its dimensions. The
   * handler never reads the pixels — there is no OCR behind this — and MSW answers inside the
   * page's own service worker, so the photo never leaves the device.
   *
   * Documented demo hook: a width under `MIN_RECOGNIZABLE_WIDTH` answers `recognized: false`, so
   * the "çek tanınmadı" state is reachable deliberately.
   */
  http.post(mockPath(VIRAL_MOCK_MODULE, 'receipts/scan'), async ({ request }) => {
    let width = 0;
    try {
      const form = await request.formData();
      width = int(form.get('width'), 0);
    } catch {
      // No form body (or a browser without FormData in the worker) — treat it as a plain scan.
    }

    await delay(VIRAL_SCAN_DELAY_MS);
    return mockJson(
      width > 0 && width < MIN_RECOGNIZABLE_WIDTH ? unrecognizedResponse() : receiptResponse(),
    );
  }),

  /** "Səbətə at". **Nothing is added** — the answer says what would be, and is marked simulated. */
  http.post(mockPath(VIRAL_MOCK_MODULE, 'receipts/add-to-cart'), async () => {
    await delay(VIRAL_DELAY_MS);
    const receipt = receiptResponse();
    return mockJson({
      item_count: receipt.items.reduce((sum, i) => sum + i.qty, 0),
      total: receipt.ozio_total,
      simulated: true,
    });
  }),
];

registerMockHandlers(VIRAL_MOCK_MODULE, flagged(viralHandlers, VIRAL_MOCK_MODULE));
