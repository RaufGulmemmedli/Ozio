import type { Metadata } from 'next';

import { ResultsView } from '@/modules/lottery';

export const metadata: Metadata = { title: 'Tiraj nəticələri' };

/** Guest-visible (docs/ROUTES.md). */
export default function LotteryResultsPage() {
  return <ResultsView />;
}
