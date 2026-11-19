import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { PriceLocksView } from '@/modules/price_lock';

/** Mock module: nothing here is cacheable and the demo state lives in the browser. */
export const dynamic = 'force-dynamic';

export default function PriceLocksPage() {
  if (!FeatureFlags.priceLock) notFound();
  return <PriceLocksView />;
}
