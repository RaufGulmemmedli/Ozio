import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SettingsView } from '@/modules/profile';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });
  return { title: t('title'), description: t('subtitle') };
}

/**
 * PS2 — `/settings`, guard `auth`.
 *
 * In-app navigation is intercepted by `(app)/@modal/(.)settings` (modal from 768 up, bottom sheet
 * below); this full page is what a direct hit, a reload or a new tab renders.
 */
export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SettingsView />;
}
