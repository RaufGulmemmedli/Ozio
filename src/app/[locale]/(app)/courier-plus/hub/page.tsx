/**
 * `/courier-plus/hub` — the neighbour-hub panel (idea module, flag `courierPlus`).
 *
 * Before registration the view renders the gate state with a CTA to `/courier-plus/hub/register`,
 * which is a state, not an error.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { CourierPlusHubView } from '@/modules/courier_plus';

export const dynamic = 'force-dynamic';

export default function CourierPlusHubPage() {
  if (!FeatureFlags.courierPlus) notFound();
  return <CourierPlusHubView />;
}
