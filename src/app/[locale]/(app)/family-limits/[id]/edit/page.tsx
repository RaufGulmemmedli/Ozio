/**
 * `/family-limits/[id]/edit` — the limit editor.
 *
 * The editor is drawn as a **right drawer over the member page** (`limits-editor-drawer.html`),
 * not as a screen of its own, so this route is the direct-hit fallback: it renders the member page
 * with the drawer already open (`editing`). Closing the drawer leaves the reader on the member
 * page, which is where the in-app path would have left them.
 */
import { FamilyLimitMemberView, assertFamilyLimitsEnabled } from '@/modules/family_limits';

export const dynamic = 'force-dynamic';

export default async function FamilyLimitEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertFamilyLimitsEnabled();
  const { id } = await params;
  return <FamilyLimitMemberView id={id} editing />;
}
