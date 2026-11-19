import { getTranslations } from 'next-intl/server';

import { HomeSkeleton } from '@/modules/home';

/** Route-level fallback for `/home`: the mirror skeleton, not a spinner (BUILD-CONTRACT rule 3). */
export default async function HomeLoading() {
  const t = await getTranslations('home');
  return <HomeSkeleton label={t('loading')} />;
}
