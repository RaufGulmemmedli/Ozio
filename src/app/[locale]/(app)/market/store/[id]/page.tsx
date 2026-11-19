import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { StoreView } from '@/modules/store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'store' });
  return { title: t('store.metaTitle') };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const storeId = Number(id);
  // `GET v1/stores/{id}` answers 404 for anything that is not a store id; a non-numeric segment
  // never reaches it.
  if (!Number.isInteger(storeId) || storeId <= 0) notFound();

  return <StoreView storeId={storeId} />;
}
