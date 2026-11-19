import type { Metadata } from 'next';

import { LotteryView } from '@/modules/lottery';

export const metadata: Metadata = { title: 'Lotereya' };

export default function LotteryPage() {
  return <LotteryView />;
}
