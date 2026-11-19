import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PaymentMethodView } from '@/modules/orders';

/**
 * `/checkout/payment` (OD1) — guard `auth`, layout `app-shell`. The 380 summary is rendered as the
 * page's own right column (the shell's `rightPanel` prop lives on `(app)/layout.tsx`, which is
 * shared by every screen), so it sits beside the methods from 1200 up and stacks below that.
 */
type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'payment' });
  return { title: t('title') };
}

export default async function CheckoutPaymentPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaymentMethodView />;
}
