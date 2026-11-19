import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { IntroView, OnboardingFallback } from '@/modules/onboarding';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'onboarding' });
  return { title: t('meta.intro.title'), robots: { index: false, follow: false } };
}

/** `/onboarding?step=1..3` — the step is read from the query string by the view. */
export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <IntroView />
    </Suspense>
  );
}
