/**
 * `/viral` — V1 "Kəşf et" hub.
 *
 * Guard `auth` + flag `viral`. The edge middleware redirects to `/home` when the flag is off
 * (`flagRoutePatterns`); `assertViralEnabled()` is the defence-in-depth `notFound()` the contract
 * asks every mock page for.
 *
 * `force-dynamic` because mock-module pages are client-only and never prerendered
 * (08-feature-flags-mocks.md).
 */
import { assertViralEnabled, ViralHubView } from '@/modules/viral';

export const dynamic = 'force-dynamic';

export default function ViralPage() {
  assertViralEnabled();
  return <ViralHubView />;
}
