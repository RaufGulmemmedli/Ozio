import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { CourierOfferView } from '@/modules/courier';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!FeatureFlags.courier) notFound();
  const { id } = await params;
  return <CourierOfferView id={id} />;
}
