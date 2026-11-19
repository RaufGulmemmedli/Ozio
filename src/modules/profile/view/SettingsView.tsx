'use client';

/**
 * `/settings` as a full page — the fallback when the route is hit directly (a reload, a deep link,
 * a new tab), since the intercepted `@modal/(.)settings` slot only exists for in-app navigation.
 */
import { useTranslations } from 'next-intl';

import { PageHeader } from '@/shared/layout';

import { SettingsContent } from './SettingsContent';

export function SettingsView() {
  const t = useTranslations('settings');

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <SettingsContent variant="page" />
    </>
  );
}
