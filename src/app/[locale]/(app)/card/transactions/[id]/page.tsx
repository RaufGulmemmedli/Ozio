import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { TransactionDetailView } from '@/modules/loyalty_card';

/**
 * `/card/transactions/[id]` — the **full-page fallback**. A click from inside
 * the app is intercepted by `(app)/@modal/(.)card/transactions/[id]`; a direct
 * hit, a reload or a shared link lands here.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'loyalty_card' });
  return { title: t('detail.title') };
}

export default async function CardTransactionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <TransactionDetailView id={decodeURIComponent(id)} />;
}
