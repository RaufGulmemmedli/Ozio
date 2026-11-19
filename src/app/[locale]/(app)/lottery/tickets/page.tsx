import type { Metadata } from 'next';

import { TicketsView } from '@/modules/lottery';

export const metadata: Metadata = { title: 'Biletlərim' };

export default function LotteryTicketsPage() {
  return <TicketsView />;
}
