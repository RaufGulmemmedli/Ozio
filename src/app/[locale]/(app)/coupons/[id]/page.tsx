import type { Metadata } from 'next';

import { CouponDetailView } from '@/modules/coupons';

export const metadata: Metadata = { title: 'Kupon detalı' };

/** Full-page fallback: a direct hit (or <768) renders the detail inside the app shell. */
export default async function CouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CouponDetailView id={id} />;
}
