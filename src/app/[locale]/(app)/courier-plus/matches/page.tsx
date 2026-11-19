/**
 * `/courier-plus/matches` — the parcels the server matched against the declared route
 * (idea module, flag `courierPlus`). `?preview=loading|empty|error` renders the drawn states.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { CourierPlusMatchesView } from '@/modules/courier_plus';

export const dynamic = 'force-dynamic';

export default function CourierPlusMatchesPage() {
  if (!FeatureFlags.courierPlus) notFound();
  return <CourierPlusMatchesView />;
}
