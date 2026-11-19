import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { NotificationSettingsView } from '@/modules/profile';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });
  return { title: t('notifications.title'), description: t('notifications.desc') };
}

/**
 * PS4 — `/settings/notifications`, guard `auth`. Client-only: there is no notification-preferences
 * endpoint, so the toggles live in this browser and the screen says so.
 */
export default async function NotificationSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NotificationSettingsView />;
}
