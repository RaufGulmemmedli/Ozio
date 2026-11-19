'use client';

/**
 * `/settings/appearance` — the "Mövzu" section of `app-parametrler.html` on its own route.
 *
 * **Guest-reachable**: `useTheme()` is a client preference (`localStorage` + the `data-theme`
 * attribute resolved before first paint by `<ThemeScript>`), so nothing here touches the API.
 * Each option carries a live preview tile of what it looks like.
 */
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { useTheme } from '@/core/theme';
import { PageHeader } from '@/shared/layout';

import { ThemePicker } from '../components/theme-picker';

export function AppearanceView() {
  const t = useTranslations('settings');
  const { pref, resolved, setPref } = useTheme();

  return (
    <>
      <PageHeader
        title={t('theme.title')}
        subtitle={t('theme.desc')}
        backHref={paths.settings}
        backLabel={t('back')}
      />

      <div className="flex w-full max-w-[560px] flex-col gap-5 rounded-xl bg-surface p-5 md:p-8">
        <ThemePicker value={pref} onSelect={setPref} />
        <p className="m-0 text-caption font-normal text-ink3" aria-live="polite">
          {t('theme.current')}: {t(`theme.${resolved}`)}
        </p>
        <p className="m-0 text-caption font-normal text-ink3">{t('localOnly')}</p>
      </div>
    </>
  );
}
