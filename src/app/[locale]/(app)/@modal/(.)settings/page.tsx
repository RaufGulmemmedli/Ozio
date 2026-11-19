import { setRequestLocale } from 'next-intl/server';

import { SettingsOverlay } from '@/modules/profile';

/**
 * Intercepted `/settings` — the modal (≥768) / sheet (<768) over whatever page the user came from.
 * A direct hit never reaches this slot: `@modal/default.tsx` renders `null` and
 * `(app)/settings/page.tsx` takes over.
 */
export default async function SettingsModal({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SettingsOverlay />;
}
