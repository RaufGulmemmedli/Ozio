import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FeatureFlags } from '@/core/config';
import { SupportView } from '@/modules/support';

/**
 * `/support` — guard `auth` **+ flag `supportChat`**, layout `app-shell`.
 *
 * The middleware already redirects to `/home` when the flag is off; the `notFound()` below is the
 * defence in depth 08-feature-flags-mocks.md asks every flagged page for. With the flag off the
 * entry point (`<SupportEntry>`) shows the documented fallback instead: `/help` plus the contact
 * number, so support is still reachable.
 *
 * There is no chat endpoint in the real API, so every message on this screen comes from the
 * scripted MSW agent under `/api/mock/support/…`, and the screen says so with `<DemoBanner>`.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'support' });
  return { title: t('meta.title'), description: t('subtitle') };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!FeatureFlags.supportChat) notFound();

  const { locale } = await params;
  setRequestLocale(locale);
  return <SupportView />;
}
