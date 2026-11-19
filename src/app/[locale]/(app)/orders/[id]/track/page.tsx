import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { OrderTrackingView } from '@/modules/orders';

/**
 * `/orders/[id]/track` (D6) — guard `auth`, layout `app-shell`.
 *
 * No tracking endpoint exists (`/orders/{id}/tracking` and `/track` answer "Cannot GET"), so the
 * view polls `GET v2/orders/{id}`: 5 s while visible, 30 s while hidden, stopped on a terminal
 * status and on unmount.
 */
type PageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'orders' });
  return { title: t('track.title') };
}

export default async function OrderTrackPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <OrderTrackingView orderId={id} />;
}
