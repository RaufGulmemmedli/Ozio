import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { GroupDealDetailView } from '@/modules/group_buy';

/** Mock module: nothing here is cacheable and the demo state lives in the browser. */
export const dynamic = 'force-dynamic';

export default async function GroupBuyDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!FeatureFlags.groupBuy) notFound();
  const { id } = await params;
  return <GroupDealDetailView id={id} />;
}
