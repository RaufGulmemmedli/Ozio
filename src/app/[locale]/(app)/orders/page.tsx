import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { OrdersView } from '@/modules/orders';

/**
 * `/orders` (OD7, empty OD8) — guard `auth`, layout `app-shell`.
 * The Aktiv / Keçmiş split is client-side (the API cannot filter by status), see `<OrdersView>`.
 */
type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'orders' });
  return { title: t('title') };
}

export default async function OrdersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OrdersView />;
}
