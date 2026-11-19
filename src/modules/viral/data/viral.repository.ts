/**
 * The viral repository — the only thing the hooks import.
 *
 * `remote -> parse -> Result<DomainModel>`; parsers never throw, so every failure arrives as a
 * `Failure` and `unwrap()` in the hook is the single place that throws for TanStack Query.
 *
 * These signatures are what a real-API module would expose, so replacing the mock means editing
 * `viral.remote.ts` and deleting `viral.mock.ts` — this file does not change.
 */
import { mapResult, parsePage, type Page, type Result } from '@/core/network';

import { parseAuction, type Auction } from './models/auction';
import {
  EMPTY_RECEIPT,
  parseReceiptCartResult,
  parseScannedReceipt,
  type ReceiptCartResult,
  type ScannedReceipt,
} from './models/receipt';
import { parseGiftProduct, parseWishlist, type GiftProduct, type Wishlist } from './models/wishlist';
import {
  viralRemote,
  type CreateWishlistBody,
  type ScanReceiptBody,
} from './viral.remote';

interface PagedArgs {
  offset: number;
  limit: number;
  locale: string;
}

export const viralRepository = {
  /** The gift catalogue the create form picks from. */
  products: async (args: PagedArgs, signal?: AbortSignal): Promise<Result<Page<GiftProduct>>> =>
    mapResult(await viralRemote.products(args, { signal }), (env) =>
      parsePage<GiftProduct>(env.data, (row) => parseGiftProduct(row, args.locale), {
        offset: args.offset,
        limit: args.limit,
      }),
    ),

  wishlists: async (args: PagedArgs, signal?: AbortSignal): Promise<Result<Page<Wishlist>>> =>
    mapResult(await viralRemote.wishlists(args, { signal }), (env) =>
      parsePage<Wishlist>(env.data, (row) => parseWishlist(row, args.locale), {
        offset: args.offset,
        limit: args.limit,
      }),
    ),

  wishlist: async (
    id: string,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<Wishlist>> =>
    mapResult(await viralRemote.wishlist(id, locale, { signal }), (env) =>
      parseWishlist(env.data, locale),
    ),

  createWishlist: async (
    body: CreateWishlistBody,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<Wishlist>> =>
    mapResult(await viralRemote.createWishlist(body, locale, { signal }), (env) =>
      parseWishlist(env.data, locale),
    ),

  deleteWishlist: async (id: string, signal?: AbortSignal): Promise<Result<string>> =>
    mapResult(await viralRemote.deleteWishlist(id, { signal }), () => id),

  /** Adds a share and returns the whole wishlist. **Nothing is charged.** */
  contribute: async (
    id: string,
    amount: number,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<Wishlist>> =>
    mapResult(await viralRemote.contribute(id, amount, locale, { signal }), (env) =>
      parseWishlist(env.data, locale),
    ),

  auctions: async (args: PagedArgs, signal?: AbortSignal): Promise<Result<Page<Auction>>> =>
    mapResult(await viralRemote.auctions(args, { signal }), (env) =>
      parsePage<Auction>(env.data, (row) => parseAuction(row, args.locale), {
        offset: args.offset,
        limit: args.limit,
      }),
    ),

  auction: async (id: string, locale: string, signal?: AbortSignal): Promise<Result<Auction>> =>
    mapResult(await viralRemote.auction(id, locale, { signal }), (env) =>
      parseAuction(env.data, locale),
    ),

  /**
   * Places a bid. The **server** decides whether the amount clears the live price; a stale offer
   * comes back as a 422 `Failure` with a field error on `amount`.
   */
  bid: async (
    id: string,
    amount: number,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<Auction>> =>
    mapResult(await viralRemote.bid(id, amount, locale, { signal }), (env) =>
      parseAuction(env.data, locale),
    ),

  /** Demo-only: re-arms the run behind "Yenidən oyna". */
  restartAuction: async (
    id: string,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<Auction>> =>
    mapResult(await viralRemote.restartAuction(id, locale, { signal }), (env) =>
      parseAuction(env.data, locale),
    ),

  /**
   * "Recognises" a receipt photo. `recognized: false` is a normal result (the "çek tanınmadı"
   * state), not a `Failure`.
   */
  scanReceipt: async (
    body: ScanReceiptBody,
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<ScannedReceipt>> =>
    mapResult(await viralRemote.scanReceipt(body, locale, { signal }), (env) =>
      env.data === null ? EMPTY_RECEIPT : parseScannedReceipt(env.data, locale),
    ),

  /** Returns what *would* be added to the cart. Nothing is ordered. */
  addReceiptToCart: async (
    locale: string,
    signal?: AbortSignal,
  ): Promise<Result<ReceiptCartResult>> =>
    mapResult(await viralRemote.addReceiptToCart(locale, { signal }), (env) =>
      parseReceiptCartResult(env.data),
    ),
};

export type { CreateWishlistBody, ScanReceiptBody };
