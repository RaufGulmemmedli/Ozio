import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { ParcelListView } from '@/modules/parcel';

/** Mock module: nothing here is cacheable and the demo state lives in the browser. */
export const dynamic = 'force-dynamic';

export default function ParcelPage() {
  if (!FeatureFlags.parcel) notFound();
  return <ParcelListView />;
}
