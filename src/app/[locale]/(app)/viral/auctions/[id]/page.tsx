/** `/viral/auctions/[id]` — V6 "Canlı oyun". Guard `auth` + flag `viral`. */
import { assertViralEnabled, AuctionLiveView } from '@/modules/viral';

export const dynamic = 'force-dynamic';

export default async function ViralAuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertViralEnabled();
  const { id } = await params;
  return <AuctionLiveView id={id} />;
}
