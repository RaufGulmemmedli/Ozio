import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthPageFallback, LoginView } from '@/modules/auth';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('meta.login.title'), robots: { index: false, follow: false } };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // `?next=` is read with useSearchParams, which needs a boundary while the shell streams.
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <LoginView />
    </Suspense>
  );
}
