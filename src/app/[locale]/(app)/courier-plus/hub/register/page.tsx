/**
 * `/courier-plus/hub/register` — apply to become a neighbourhood pick-up point
 * (idea module, flag `courierPlus`).
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { CourierPlusHubRegisterView } from '@/modules/courier_plus';

export const dynamic = 'force-dynamic';

export default function CourierPlusHubRegisterPage() {
  if (!FeatureFlags.courierPlus) notFound();
  return <CourierPlusHubRegisterView />;
}
