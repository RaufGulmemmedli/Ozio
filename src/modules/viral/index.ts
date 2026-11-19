/**
 * `@/modules/viral` — the module's **only** public surface.
 *
 * Other modules import from here and never reach into `view/`, `hooks/` or `data/`.
 *
 * What is exported, and why:
 *  - `<ViralLiveAuctionTile>` — the **home strip** the screen spec asks for ("Home strip and Profil
 *    row are the other entry points"). It reads this module's own auction hook, renders nothing
 *    when no auction is live, and hides itself when the flag is off.
 *  - `<ViralProfileEntry>` — the Profil row, same gating.
 *  - the seven route views, for the thin `page.tsx` files under `src/app/[locale]/(app)/viral/`.
 *  - the hooks and domain types, so another screen can show a wishlist's progress or a live price
 *    without a second repository.
 *  - the flag helpers and the route table.
 *
 * The MSW handlers are deliberately **not** re-exported: `src/core/mocks/modules.ts` imports
 * `data/viral.mock.ts` by path, and importing it here would pull `msw` into every bundle that
 * touches this barrel.
 */

/* ----------------------------------------------------------------- entry points */
export { ViralLiveAuctionTile, ViralProfileEntry } from './components/viral-entry';

/* ----------------------------------------------------------------------- screens */
export { ViralHubView } from './view/ViralHubView';
export { WishlistsView } from './view/WishlistsView';
export { WishlistNewView } from './view/WishlistNewView';
export { WishlistDetailView, type WishlistDetailViewProps } from './view/WishlistDetailView';
export { AuctionsView } from './view/AuctionsView';
export { AuctionLiveView, type AuctionLiveViewProps } from './view/AuctionLiveView';
export { ReceiptScanView } from './view/ReceiptScanView';

export { ViralHubSkeleton } from './view/ViralHubSkeleton';
export { WishlistsSkeleton } from './view/WishlistsSkeleton';
export { WishlistNewSkeleton } from './view/WishlistNewSkeleton';
export { WishlistDetailSkeleton } from './view/WishlistDetailSkeleton';
export { AuctionsSkeleton } from './view/AuctionsSkeleton';
export { AuctionLiveSkeleton } from './view/AuctionLiveSkeleton';
export { ReceiptScanSkeleton } from './view/ReceiptScanSkeleton';

/* ------------------------------------------------------------------------- hooks */
export {
  useContribute,
  useCreateWishlist,
  useDeleteWishlist,
  useGiftProducts,
  useWishlist,
  useWishlists,
} from './hooks/use-wishlists';
export {
  useAuction,
  useAuctionClock,
  useAuctions,
  useBid,
  useRestartAuction,
  type AuctionClock,
} from './hooks/use-auctions';
export {
  downscaleImage,
  MAX_EDGE,
  useAddReceiptToCart,
  useReceiptScan,
  type DownscaledImage,
  type UseReceiptScan,
} from './hooks/use-receipt-scan';
export { useDeadline, formatCountdown, type Deadline } from './hooks/use-deadline';

/* ------------------------------------------------------------------------ models */
export {
  auctionOutcome,
  stockPercent,
  STOCK_LOW_PERCENT,
  type Auction,
  type AuctionBid,
  type AuctionOutcome,
  type AuctionStatus,
} from './data/models/auction';
export {
  contributorTone,
  OCCASIONS,
  type Contribution,
  type GiftProduct,
  type Occasion,
  type Wishlist,
} from './data/models/wishlist';
export type {
  ReceiptCartResult,
  ReceiptItem,
  ScannedReceipt,
} from './data/models/receipt';

/* -------------------------------------------------------------- flags and routes */
export { assertViralEnabled, viralEnabled, VIRAL_FLAG, VIRAL_MOCK_MODULE } from './viral.flags';
export { viralRoutes, type ViralRoute } from './viral.routes';
export { viralKeys } from './viral.query-keys';
