import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SEARCH_QUERY_PARAM, SearchView } from '@/modules/search';

/**
 * `/search` and `/search?q=…` — guard `guest`, app-shell. AX1 (landing), AX2 (results) and AX3
 * (not found) are states of this one route, driven by `?q=`.
 */
type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });
  return { title: t('meta.title') };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const raw = query[SEARCH_QUERY_PARAM];
  const initialQuery = (Array.isArray(raw) ? raw[0] : raw) ?? '';

  return <SearchView initialQuery={initialQuery} />;
}
