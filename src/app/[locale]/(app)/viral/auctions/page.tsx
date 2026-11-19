/** `/viral/auctions` — V5 "Qiymət düşmə siyahısı". Guard `auth` + flag `viral`. */
import { assertViralEnabled, AuctionsView } from '@/modules/viral';

export const dynamic = 'force-dynamic';

export default function ViralAuctionsPage() {
  assertViralEnabled();
  return <AuctionsView />;
}
