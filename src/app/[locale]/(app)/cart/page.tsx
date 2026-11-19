import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { CartView } from '@/modules/cart';

/**
 * `/cart` — guard `auth` (the edge sends a guest to `/login?next=/cart`); layout `app-shell`, which
 * owns `<main>`. The promo (`?sheet=promo`) and delivery-time (`?sheet=time`) sheets are states of
 * this page, handled inside `<CartView>`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  return { title: t('title') };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CartView />;
}
