import type { Metadata } from 'next';

import { TicketDetailView } from '@/modules/lottery';

export const metadata: Metadata = { title: 'Bilet' };

export default async function LotteryTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDetailView id={id} />;
}
