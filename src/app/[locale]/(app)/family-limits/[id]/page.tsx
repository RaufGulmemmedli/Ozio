/**
 * `/family-limits/[id]` — one family member (mock module, flag `familyLimits`).
 */
import { FamilyLimitMemberView, assertFamilyLimitsEnabled } from '@/modules/family_limits';

export const dynamic = 'force-dynamic';

export default async function FamilyLimitMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertFamilyLimitsEnabled();
  const { id } = await params;
  return <FamilyLimitMemberView id={id} />;
}
