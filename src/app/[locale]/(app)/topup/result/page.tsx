import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { assertTopupEnabled, TopupResultView } from '@/modules/topup';

/**
 * `/topup/result?ref=<reference>` — guard `auth` + flag `topup`.
 *
 * Success and failure are the same route, told apart by the stored outcome the reference points at
 * (`topup-success.html` / `topup-failed.html`). `<Suspense>` is required because the view reads
 * `useSearchParams()`.
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

export default async function TopupResultPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  assertTopupEnabled();
  return (
    <Suspense fallback={null}>
      <TopupResultView />
    </Suspense>
  );
}
