import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LanguageView } from '@/modules/profile';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });
  return { title: t('language.dialogTitle'), description: t('language.dialogSub') };
}

/**
 * PS2 — `/settings/language`, guard **guest**: `routeGuards` lists
 * `^/settings/(language|appearance)$` in the guest set, before the `/settings` auth rule, and
 * nothing on the screen calls a bearer endpoint.
 */
export default async function LanguagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LanguageView />;
}
