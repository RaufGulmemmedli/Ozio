import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { MissionsView } from '@/modules/rewards';

/**
 * Mock screen: client-only, no SEO value, and its data comes from MSW in the browser — so it is
 * never prerendered.
 */
export const dynamic = 'force-dynamic';

/** Guard `auth` (edge, via `routeGuards`) + flag `rewards`; the `notFound()` is defence in depth. */
export default function Page() {
  if (!FeatureFlags.rewards) notFound();
  return <MissionsView />;
}
