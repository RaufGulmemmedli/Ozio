import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { HelpView } from '@/modules/profile';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'profile' });
  return { title: t('help.title'), description: t('help.subtitle') };
}

/**
 * PS7 / P3 — `/help`, guard **guest**. Its only read is `GET v1/privacy-policies`, whose
 * `auth` is `none`, so the page works with no session at all.
 */
export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HelpView />;
}
