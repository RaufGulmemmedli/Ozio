import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CardOfflineView } from '@/modules/loyalty_card';

/**
 * `/card/offline` — guard `auth`, layout `full` per ROUTES.md.
 *
 * `(app)/layout.tsx` wraps every child in `<AppShell>` and is owned by another
 * agent, so the view renders as a centred, chrome-free column inside the shell.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'loyalty_card' });
  return { title: t('offline.title'), description: t('offline.subtitle') };
}

export default async function CardOfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CardOfflineView />;
}
