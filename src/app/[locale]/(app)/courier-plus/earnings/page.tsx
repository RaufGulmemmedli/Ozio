/**
 * `/courier-plus/earnings` — balance and recent hand-offs (idea module, flag `courierPlus`).
 *
 * Every amount is a mock fixture; nothing is ever paid out, which the demo banner and the inline
 * note on the screen both state.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { CourierPlusEarningsView } from '@/modules/courier_plus';

export const dynamic = 'force-dynamic';

export default function CourierPlusEarningsPage() {
  if (!FeatureFlags.courierPlus) notFound();
  return <CourierPlusEarningsView />;
}
