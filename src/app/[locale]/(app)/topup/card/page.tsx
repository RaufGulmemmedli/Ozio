import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { assertTopupEnabled, TopupCardView } from '@/modules/topup';

/** `/topup/card` — guard `auth` + flag `topup`. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'topup' });
  return { title: t('card.title'), robots: { index: false, follow: false } };
}

export default async function TopupCardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  assertTopupEnabled();
  return <TopupCardView />;
}
