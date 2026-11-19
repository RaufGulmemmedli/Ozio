import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { HistoryView } from '@/modules/profile';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'profile' });
  return { title: t('history.title'), description: t('history.subtitle') };
}

/** L8 "Tarixçə və çeklər" — `/history`, guard `auth`. */
export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HistoryView />;
}
