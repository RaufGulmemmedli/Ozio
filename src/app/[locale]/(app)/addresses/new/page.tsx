import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AddressFormView } from '@/modules/address/view/AddressFormView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'address' });
  return { title: t('new') };
}

/**
 * Full-page fallback for `/addresses/new`. The modal variant is the intercepted route
 * `(app)/@modal/(.)addresses/new`; a direct hit (or a reload) lands here.
 */
export default async function AddressNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AddressFormView />;
}
