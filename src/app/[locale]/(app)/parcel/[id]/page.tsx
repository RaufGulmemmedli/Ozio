import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { ParcelTrackView } from '@/modules/parcel';

export const dynamic = 'force-dynamic';

export default async function ParcelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!FeatureFlags.parcel) notFound();
  const { id } = await params;
  return <ParcelTrackView id={id} />;
}
