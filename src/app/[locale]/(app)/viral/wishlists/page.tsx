/** `/viral/wishlists` — V2 "Mənim kampaniyalarım". Guard `auth` + flag `viral`. */
import { assertViralEnabled, WishlistsView } from '@/modules/viral';

export const dynamic = 'force-dynamic';

export default function ViralWishlistsPage() {
  assertViralEnabled();
  return <WishlistsView />;
}
