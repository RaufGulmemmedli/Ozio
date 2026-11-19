import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FavoritesView } from '@/modules/search';

/**
 * `/favorites` — guard `auth` (the middleware sends a guest to `/login?next=/favorites`),
 * app-shell. Screen AX8.
 *
 * The favourites **list** endpoint is dead on live (`GET v1/stores/favorites` → 404), so the view
 * renders the documented "not available" state; see `favorites-view.tsx` for the swap.
 */
type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });
  return { title: t('favorites.meta.title') };
}

export default async function FavoritesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FavoritesView />;
}
