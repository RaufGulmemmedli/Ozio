/**
 * `/courier-plus/track/[id]` — one hand-off, stage by stage (idea module, flag `courierPlus`).
 *
 * `[id]` is the offer id the mock accepted (`o1`, `o2`, …); an unknown id resolves to the
 * `notFound` state inside the view, not to a 404 page.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { CourierPlusTrackView } from '@/modules/courier_plus';

export const dynamic = 'force-dynamic';

export default async function CourierPlusTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!FeatureFlags.courierPlus) notFound();
  const { id } = await params;
  return <CourierPlusTrackView offerId={id} />;
}
