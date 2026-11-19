/**
 * `/viral/wishlists/[id]` — V4 "Kampaniya detalı". Guard `auth` + flag `viral`.
 *
 * `params` is a promise in this Next version, so the page is async and hands the id to the view.
 */
import { assertViralEnabled, WishlistDetailView } from '@/modules/viral';

export const dynamic = 'force-dynamic';

export default async function ViralWishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertViralEnabled();
  const { id } = await params;
  return <WishlistDetailView id={id} />;
}
