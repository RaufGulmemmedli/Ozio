import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { ParcelNewView } from '@/modules/parcel';

export const dynamic = 'force-dynamic';

export default function ParcelNewPage() {
  if (!FeatureFlags.parcel) notFound();
  return <ParcelNewView />;
}
