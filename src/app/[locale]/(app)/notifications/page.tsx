import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { NotificationsView } from '@/modules/home';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * `/notifications` — guard `auth`; a drawer over the page from 768 up, a plain page below
 * (the view decides, so a direct hit always has content behind the drawer).
 */
export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NotificationsView />;
}
