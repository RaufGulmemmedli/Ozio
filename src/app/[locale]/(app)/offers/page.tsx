import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { OffersView } from '@/modules/home';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** `/offers` (L3 Kampaniyalar) — guard `guest`, layout `app-shell`. */
export default async function OffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OffersView />;
}
