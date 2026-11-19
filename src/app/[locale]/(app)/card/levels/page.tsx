import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FeatureFlags } from '@/core/config';
import { LevelsView } from '@/modules/loyalty_card';

/**
 * `/card/levels` — guard `auth` **+ flag `loyaltyTiers`**, layout `app-shell`.
 *
 * The middleware already redirects to `/home` when the flag is off; the
 * `notFound()` below is the defence in depth 08-feature-flags-mocks.md asks
 * every flagged page for.
 *
 * Every byte of data on this screen is an MSW fixture: `GET v1/profile/me`
 * sends no tier, level, cashback percentage or bonus-expiry information.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'loyalty_card' });
  return { title: t('levels.title'), description: t('levels.subtitle') };
}

export default async function CardLevelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!FeatureFlags.loyaltyTiers) notFound();

  const { locale } = await params;
  setRequestLocale(locale);
  return <LevelsView />;
}
