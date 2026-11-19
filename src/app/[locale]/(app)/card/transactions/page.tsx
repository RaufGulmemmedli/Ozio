import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { TransactionsView } from '@/modules/loyalty_card';

/** `/card/transactions` — guard `auth`, layout `app-shell`. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'loyalty_card' });
  return { title: t('transactions.title') };
}

export default async function CardTransactionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TransactionsView />;
}
