import type { Metadata } from 'next';

import { PrizesView } from '@/modules/lottery';

export const metadata: Metadata = { title: 'Hədiyyələr' };

/** Guest-visible (docs/ROUTES.md). */
export default function LotteryPrizesPage() {
  return <PrizesView />;
}
