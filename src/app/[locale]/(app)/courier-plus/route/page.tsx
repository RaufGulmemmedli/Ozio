/**
 * `/courier-plus/route` — declare the route you are travelling (idea module, flag `courierPlus`).
 *
 * The folder is named `route/`, which is fine: the App Router's reserved name is the **file**
 * `route.ts` / `route.js` (a Route Handler). A `page.tsx` inside a `route/` segment is an ordinary
 * page, and this folder contains no `route.ts`.
 */
import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { CourierPlusRouteView } from '@/modules/courier_plus';

export const dynamic = 'force-dynamic';

export default function CourierPlusRoutePage() {
  if (!FeatureFlags.courierPlus) notFound();
  return <CourierPlusRouteView />;
}
