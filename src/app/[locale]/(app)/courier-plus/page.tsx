/**
 * `/courier-plus` — Yolüstü kuryer hub (idea module, flag `courierPlus`).
 *
 * Guard `auth` + the flag: the middleware redirects `/courier-plus/*` to `/home` when the flag is
 * off, and the `notFound()` below is the defence-in-depth check (08-feature-flags-mocks.md).
 * Mock-module pages are client-only and never SEO-indexed, hence `force-dynamic`.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { CourierPlusHomeView } from '@/modules/courier_plus';

export const dynamic = 'force-dynamic';

export default function CourierPlusPage() {
  if (!FeatureFlags.courierPlus) notFound();
  return <CourierPlusHomeView />;
}
