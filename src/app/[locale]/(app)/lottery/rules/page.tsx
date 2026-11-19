import type { Metadata } from 'next';

import { RulesView } from '@/modules/lottery';

export const metadata: Metadata = { title: 'Lotereya qaydaları' };

/** Guest-visible (docs/ROUTES.md); the policy endpoint needs a token, so the view gates it. */
export default function LotteryRulesPage() {
  return <RulesView />;
}
