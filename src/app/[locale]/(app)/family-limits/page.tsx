/**
 * `/family-limits` — "Üzv limitləri" (mock module, flag `familyLimits`).
 *
 * Guard `auth` + the flag: the middleware redirects to `/home` when the flag is off and
 * `assertFamilyLimitsEnabled()` is the defence-in-depth `notFound()`.
 */
import { FamilyLimitsView, assertFamilyLimitsEnabled } from '@/modules/family_limits';

export const dynamic = 'force-dynamic';

export default function FamilyLimitsPage() {
  assertFamilyLimitsEnabled();
  return <FamilyLimitsView />;
}
