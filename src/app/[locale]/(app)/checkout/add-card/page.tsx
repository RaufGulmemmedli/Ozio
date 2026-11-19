import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AddCardView } from '@/modules/orders';

/**
 * `/checkout/add-card` (OD2) — the full page a direct hit lands on. From inside the app the
 * intercepted `@modal/(.)checkout/add-card` route shows the same view in a modal.
 *
 * The screen never collects card data: `POST v1/payment/save-card` hands the card entry to the
 * bank's own page (see `<AddCardView>`).
 */
type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'payment' });
  return { title: t('newCard.title') };
}

export default async function AddCardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AddCardView />;
}
