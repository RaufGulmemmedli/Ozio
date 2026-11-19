import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AddressPickView } from '@/modules/address/view/AddressPickView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'address' });
  return { title: t('picker.title') };
}

/** UN5 on the map, with UN7 "Zonadan kənar" as a state of the same screen. */
export default async function AddressPickPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AddressPickView />;
}
