/**
 * Remote source for the viral module.
 *
 * Every call goes through `remote.mock('viral')`, which builds `/api/mock/viral/<path>` in
 * `core/network/api-client.ts` → `buildUrl`. There is no code path from here to
 * `api.ozio10.az`.
 *
 * The method list mirrors the PROPOSED REST shape in `api/mock-modules.md` §18 one for one:
 *
 * | here | the future endpoint |
 * | --- | --- |
 * | `products()` | `GET /customer/api/v1/viral/products` |
 * | `wishlists()` / `createWishlist()` | `GET｜POST /customer/api/v1/viral/campaigns` |
 * | `wishlist()` / `deleteWishlist()` | `GET｜DELETE /customer/api/v1/viral/campaigns/{id}` |
 * | `contribute()` | `POST /customer/api/v1/viral/campaigns/{id}/contributions` |
 * | `auctions()` / `auction()` | `GET /customer/api/v1/viral/auctions[/{id}]` (server price + SSE) |
 * | `bid()` | `POST /customer/api/v1/viral/auctions/{id}/buy` |
 * | `scanReceipt()` | `POST /customer/api/v1/viral/receipts/scan` (multipart image) |
 * | `addReceiptToCart()` | `POST /customer/api/v1/viral/receipts/{id}/add-to-cart` |
 *
 * `restartAuction()` is the one operation with no real counterpart — a real auction does not
 * restart — and it is marked as demo-only so the swap is obvious.
 *
 * `POST v1/file/upload` is deliberately **not** used by `scanReceipt`: `api/README.md` is explicit
 * that it is a plain file store, not a recognition endpoint. The receipt photo stays in the page.
 */
import { remote, type RemoteCallOptions, type RemoteResult } from '@/core/network';

import { VIRAL_MOCK_MODULE } from '../viral.flags';

const mock = remote.mock(VIRAL_MOCK_MODULE);

export interface CreateWishlistBody {
  product_id: string;
  occasion: string;
  /** ISO date, `yyyy-mm-dd` is fine. */
  target_date: string;
  message: string;
}

/** What the browser hands the scan endpoint: the downscaled bitmap plus its dimensions. */
export interface ScanReceiptBody {
  blob: Blob;
  width: number;
  height: number;
}

const paged = (args: { offset: number; limit: number; locale: string }) => ({ ...args });

export const viralRemote = {
  /** `GET viral/products?locale=` — the five gift products. */
  products: (
    args: { offset: number; limit: number; locale: string },
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> => mock.get<unknown>('products', paged(args), opts),

  /** `GET viral/wishlists?offset=&limit=&locale=`. */
  wishlists: (
    args: { offset: number; limit: number; locale: string },
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> => mock.get<unknown>('wishlists', paged(args), opts),

  /** `GET viral/wishlists/{id}?locale=` — 404 for an unknown id. */
  wishlist: (id: string, locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.get<unknown>(`wishlists/${encodeURIComponent(id)}`, { locale }, opts),

  /** `POST viral/wishlists` — 422 without a product or a date. */
  createWishlist: (
    body: CreateWishlistBody,
    locale: string,
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> => mock.post<unknown>('wishlists', body, { ...opts, query: { locale } }),

  /** `DELETE viral/wishlists/{id}`. */
  deleteWishlist: (id: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.del<unknown>(`wishlists/${encodeURIComponent(id)}`, undefined, opts),

  /**
   * `POST viral/wishlists/{id}/contributions` — **nothing is charged**; the mock stores a
   * `simulated: true` row and answers with the whole wishlist.
   */
  contribute: (
    id: string,
    amount: number,
    locale: string,
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> =>
    mock.post<unknown>(
      `wishlists/${encodeURIComponent(id)}/contributions`,
      { amount },
      { ...opts, query: { locale } },
    ),

  /** `GET viral/auctions?offset=&limit=&locale=` — live price and stock per row. */
  auctions: (
    args: { offset: number; limit: number; locale: string },
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> => mock.get<unknown>('auctions', paged(args), opts),

  /** `GET viral/auctions/{id}?locale=` — + the bid log, `ends_at` and `next_drop_at`. */
  auction: (id: string, locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.get<unknown>(`auctions/${encodeURIComponent(id)}`, { locale }, opts),

  /**
   * `POST viral/auctions/{id}/bid` — the amount is **validated by the server** against the live
   * price; a stale (too low) offer comes back as a 422 with a field error.
   */
  bid: (
    id: string,
    amount: number,
    locale: string,
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> =>
    mock.post<unknown>(
      `auctions/${encodeURIComponent(id)}/bid`,
      { amount },
      { ...opts, query: { locale } },
    ),

  /** `POST viral/auctions/{id}/restart` — **demo only**; a real auction has no such operation. */
  restartAuction: (id: string, locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.post<unknown>(
      `auctions/${encodeURIComponent(id)}/restart`,
      undefined,
      { ...opts, query: { locale } },
    ),

  /**
   * `POST viral/receipts/scan` — multipart, the shape a real recognition endpoint would take.
   *
   * The blob handed in here is already downscaled by the caller, and the request is answered by
   * MSW inside the page's own service worker, so the image never leaves the browser.
   */
  scanReceipt: (
    body: ScanReceiptBody,
    locale: string,
    opts?: RemoteCallOptions,
  ): RemoteResult<unknown> => {
    const form = new FormData();
    form.append('image', body.blob, 'receipt.jpg');
    form.append('width', String(body.width));
    form.append('height', String(body.height));
    return mock.post<unknown>('receipts/scan', form, { ...opts, query: { locale } });
  },

  /** `POST viral/receipts/add-to-cart` — answers with the count; adds nothing. */
  addReceiptToCart: (locale: string, opts?: RemoteCallOptions): RemoteResult<unknown> =>
    mock.post<unknown>('receipts/add-to-cart', undefined, { ...opts, query: { locale } }),
};
