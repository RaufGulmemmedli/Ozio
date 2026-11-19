import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { ReceiptView } from '@/modules/rewards';

/**
 * N5 digital receipt. Unlike the rest of the rewards module this screen reads the **real** API
 * (`GET v2/orders/{id}`) — but it still carries the `rewards` flag per `docs/ROUTES.md`, and it is
 * a client-rendered, print-oriented page with nothing to index.
 */
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!FeatureFlags.rewards) notFound();
  const { id } = await params;
  return <ReceiptView orderId={id} />;
}
