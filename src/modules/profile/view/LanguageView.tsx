'use client';

/**
 * PS2 "App · Dil seç" — `/settings/language` (`app-dil-sec.html`, frame `gBMzc`).
 *
 * **Guest-reachable**: nothing on this screen calls a bearer endpoint. Picking a language applies
 * instantly (no confirm) — it writes the `NEXT_LOCALE` cookie, navigates with next-intl's
 * locale-aware router and drops the previous locale's cached queries (`useLocaleSwitch`).
 */
import { useTranslations } from 'next-intl';

import { localeLabels } from '@/core/i18n/routing';
import { paths } from '@/core/routes';
import { PageHeader } from '@/shared/layout';

import { LanguagePicker } from '../components/language-picker';
import { useLocaleSwitch } from '../hooks/use-locale-switch';

export function LanguageView() {
  const t = useTranslations('settings');
  const { locale, pending, select } = useLocaleSwitch();

  return (
    <>
      <PageHeader
        title={t('language.dialogTitle')}
        subtitle={t('language.dialogSub')}
        backHref={paths.settings}
        backLabel={t('back')}
      />

      <div className="flex w-full max-w-[560px] flex-col gap-5 rounded-xl bg-surface p-5 md:p-8">
        <LanguagePicker value={locale} onSelect={select} disabled={pending} />
        <p className="m-0 text-caption font-normal text-ink3" aria-live="polite">
          {t('language.current')}: {localeLabels[locale]}
        </p>
      </div>
    </>
  );
}
