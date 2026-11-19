import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { GroupBuyHomeView } from '@/modules/group_buy';

/** Mock module: nothing here is cacheable and the demo state lives in the browser. */
export const dynamic = 'force-dynamic';

export default function GroupBuyPage() {
  if (!FeatureFlags.groupBuy) notFound();
  return <GroupBuyHomeView />;
}
