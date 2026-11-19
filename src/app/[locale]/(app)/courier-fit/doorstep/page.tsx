import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FeatureFlags } from '@/core/config';
import { DoorstepView } from '@/modules/courier_shop';

/**
 * Mock module (`courier_shop`): guard `auth` at the edge via `routeGuards`, plus the flag check
 * below as defence in depth. Client-only and never cached — the MSW worker lives in the browser,
 * so there is nothing for the server to render from
 * (08-feature-flags-mocks.md: `export const dynamic = 'force-dynamic'`).
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courier_shop' });
  return { title: t('doorstep.title'), robots: { index: false, follow: false } };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!FeatureFlags.courierShop) notFound();
  return <DoorstepView />;
}
