/**
 * The routes this module owns (docs/ROUTES.md "Idea modules").
 *
 * The design frames are named after the feature's older wording ("kampaniya" = campaign); the URL
 * table in `architecture/02-routing.md` is authoritative, so V2/V3/V4 live under
 * `/viral/wishlists*`. See `view/WishlistsView.tsx` for the frame → route map.
 */
export interface ViralRoute {
  id:
    | 'viral'
    | 'viralWishlists'
    | 'viralWishlistNew'
    | 'viralWishlist'
    | 'viralAuctions'
    | 'viralAuction'
    | 'viralReceiptScan';
  path: string;
  guard: 'auth';
  flag: 'viral';
  layout: 'app-shell';
}

export const viralRoutes: readonly ViralRoute[] = [
  { id: 'viral', path: '/viral', guard: 'auth', flag: 'viral', layout: 'app-shell' },
  {
    id: 'viralWishlists',
    path: '/viral/wishlists',
    guard: 'auth',
    flag: 'viral',
    layout: 'app-shell',
  },
  {
    id: 'viralWishlistNew',
    path: '/viral/wishlists/new',
    guard: 'auth',
    flag: 'viral',
    layout: 'app-shell',
  },
  {
    id: 'viralWishlist',
    path: '/viral/wishlists/[id]',
    guard: 'auth',
    flag: 'viral',
    layout: 'app-shell',
  },
  {
    id: 'viralAuctions',
    path: '/viral/auctions',
    guard: 'auth',
    flag: 'viral',
    layout: 'app-shell',
  },
  {
    id: 'viralAuction',
    path: '/viral/auctions/[id]',
    guard: 'auth',
    flag: 'viral',
    layout: 'app-shell',
  },
  {
    id: 'viralReceiptScan',
    path: '/viral/receipt-scan',
    guard: 'auth',
    flag: 'viral',
    layout: 'app-shell',
  },
] as const;
