import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { OrderFailedView } from '@/modules/orders';

/**
 * `/orders/failed?order=ID` (OD6) — guard `auth`, layout `app-shell`.
 *
 * The decline reason comes from the order's (unverified) payment fields; when the server sends no
 * wording the generic sentence is shown rather than an invented bank message.
 */
type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'payment' });
  return { title: t('failed.title') };
}

const firstValue = (value: string | string[] | undefined): string | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
};

export default async function OrderFailedPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;

  return <OrderFailedView orderId={firstValue(query.order)} />;
}
