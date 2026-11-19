import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { assertReferralEnabled, InviteView } from '@/modules/profile_referral';

/** `/invite` — guard `auth` + flag `referral`. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'referral' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function InvitePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  assertReferralEnabled();
  return <InviteView />;
}
