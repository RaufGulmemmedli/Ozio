/** `/viral/wishlists/new` — V3 "Kampaniya yarat". Guard `auth` + flag `viral`. */
import { assertViralEnabled, WishlistNewView } from '@/modules/viral';

export const dynamic = 'force-dynamic';

export default function ViralWishlistNewPage() {
  assertViralEnabled();
  return <WishlistNewView />;
}
