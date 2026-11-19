import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { SavingsJarView } from '@/modules/savings_jar';

/** Mock screen: client-only, MSW-backed, nothing to index. */
export const dynamic = 'force-dynamic';

/** Guard `auth` (edge) + flag `savingsJar`; the `notFound()` is defence in depth. */
export default function Page() {
  if (!FeatureFlags.savingsJar) notFound();
  return <SavingsJarView />;
}
