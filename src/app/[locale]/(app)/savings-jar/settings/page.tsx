import { notFound } from 'next/navigation';

import { FeatureFlags } from '@/core/config';
import { SavingsJarSettingsView } from '@/modules/savings_jar';

/** Mock screen: client-only, MSW-backed, nothing to index. */
export const dynamic = 'force-dynamic';

export default function Page() {
  if (!FeatureFlags.savingsJar) notFound();
  return <SavingsJarSettingsView />;
}
