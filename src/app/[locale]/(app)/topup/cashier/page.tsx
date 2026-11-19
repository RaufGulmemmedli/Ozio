import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { assertTopupEnabled, TopupCashierView } from '@/modules/topup';

/** `/topup/cashier` — guard `auth` + flag `topup`. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'topup' });
  return { title: t('cashier.title'), robots: { index: false, follow: false } };
}

export default async function TopupCashierPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  assertTopupEnabled();
  return <TopupCashierView />;
}
