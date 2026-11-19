import type { Metadata } from 'next';

import { DiscountsView } from '@/modules/lottery';

export const metadata: Metadata = { title: 'Endirimlər' };

/** Guest-visible; `?category=` selects the store chain. */
export default async function DiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <DiscountsView category={category} />;
}
