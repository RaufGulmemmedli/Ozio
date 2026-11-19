import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CategoryView } from '@/modules/store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'store' });
  return { title: t('category.metaTitle') };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ store?: string | string[] }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) notFound();

  // Products and categories are always per store (`?store=` keeps a shared link on the same one).
  const { store } = await searchParams;
  const raw = Array.isArray(store) ? store[0] : store;
  const storeId = raw !== undefined && Number.isInteger(Number(raw)) ? Number(raw) : null;

  return <CategoryView categoryId={categoryId} storeId={storeId} />;
}
