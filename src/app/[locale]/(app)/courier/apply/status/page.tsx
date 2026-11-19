import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { CourierApplyStatusView } from '@/modules/courier';

export const dynamic = 'force-dynamic';

export default function Page() {
  if (!FeatureFlags.courier) notFound();
  return <CourierApplyStatusView />;
}
