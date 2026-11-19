import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { HomeView } from '@/modules/home';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** `/home` — guard `guest` (routeGuards), layout `app-shell` (the group layout owns `<main>`). */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeView />;
}
