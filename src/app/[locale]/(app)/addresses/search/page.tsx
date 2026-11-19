import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AddressSearchView } from '@/modules/address/view/AddressSearchView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'address' });
  return { title: t('search.title') };
}

/** Full-page fallback for `/addresses/search`; the modal variant is the intercepted route. */
export default async function AddressSearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AddressSearchView />;
}
