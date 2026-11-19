import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { assertTopupEnabled, TopupMethodView } from '@/modules/topup';

/**
 * `/topup` — guard `auth` (the edge, via `routeGuards`) + flag `topup`.
 *
 * Mock-module pages are client-only and never cached: the MSW worker lives in the browser, so
 * there is nothing for the server to render from (08-feature-flags-mocks.md: "For SSR-rendered
 * parts of mock pages: none — `export const dynamic = 'force-dynamic'`").
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'topup' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function TopupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  assertTopupEnabled();
  return <TopupMethodView />;
}
