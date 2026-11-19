import type { Metadata } from 'next';

import { CouponsView } from '@/modules/coupons';

export const metadata: Metadata = { title: 'Kuponlar' };

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope } = await searchParams;
  return <CouponsView scope={scope} />;
}
