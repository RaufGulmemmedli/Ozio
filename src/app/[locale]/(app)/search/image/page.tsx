import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FeatureFlags } from '@/core/config';
import { ImageSearchView } from '@/modules/image_search';

/**
 * `/search/image` — guard `auth` **+ flag `imageSearch`**, layout `app-shell`.
 *
 * The middleware already redirects to `/home` when the flag is off; the `notFound()` below is the
 * defence in depth 08-feature-flags-mocks.md asks every flagged page for.
 *
 * Only the **recognition** step is a mock (MSW, `/api/mock/image_search/recognize`). The products
 * the screen lists come from the real catalog, so this page is never fully fixture data. The
 * captured photo stays in the browser: nothing is uploaded, and `POST v1/file/upload` — a plain
 * upload, not a recogniser — is never called.
 *
 * `/search` itself belongs to the search module; this route is only the photo screen it links to.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'image_search' });
  return { title: t('meta.title'), description: t('subtitle') };
}

export default async function ImageSearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!FeatureFlags.imageSearch) notFound();

  const { locale } = await params;
  setRequestLocale(locale);
  return <ImageSearchView />;
}
