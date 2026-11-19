/**
 * `/school` — SC1 "Təhsil mərkəzi · Hub".
 *
 * Guard `auth` + flag `school`. The edge middleware redirects to `/home` when the flag is off
 * (`flagRoutePatterns`); `assertSchoolEnabled()` is the defence-in-depth `notFound()` the contract
 * asks every mock page for.
 *
 * `force-dynamic` because mock-module pages are client-only and never prerendered
 * (08-feature-flags-mocks.md).
 */
import { assertSchoolEnabled, SchoolHubView } from '@/modules/school';

export const dynamic = 'force-dynamic';

export default function SchoolPage() {
  assertSchoolEnabled();
  return <SchoolHubView />;
}
