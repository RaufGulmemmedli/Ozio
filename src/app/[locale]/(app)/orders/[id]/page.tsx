import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { OrderDetailView } from '@/modules/orders';

/**
 * `/orders/[id]` (OD9) — guard `auth`, layout `app-shell`.
 * The rating UI is a **modal on this page**, not a route. A 404 from `GET v2/orders/{id}` redirects
 * to `/orders` with a toast (the only verified behaviour of that endpoint).
 */
type PageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'orders' });
  return { title: t('detail.title') };
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <OrderDetailView orderId={id} />;
}
