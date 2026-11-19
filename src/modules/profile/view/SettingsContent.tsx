'use client';

/**
 * PS2 "App · Parametrlər" body (`app-parametrler.html`, frame `xRTxH`), shared by the full page
 * and the intercepted modal/sheet.
 *
 * Everything on this screen is a **client preference** — there is no settings endpoint anywhere in
 * the API:
 *  - Dil   → `NEXT_LOCALE` cookie + next-intl navigation (`useLocaleSwitch`).
 *  - Mövzu → `useTheme()` from `@/core/theme`.
 *  - Bildirişlər → local toggles (no preferences endpoint exists; see use-notification-prefs.ts).
 *  - Təhlükəsizlik → the export draws "Biometrik giriş", "Giriş kodu (PIN)" and "Aktiv cihazlar".
 *    None of the three has an endpoint, and the web has neither Face ID nor an app PIN, so the
 *    section states that instead of drawing dead controls.
 *  - Təhlükəli zona → `/account/delete`.
 */
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { appVersion } from '@/core/config';
import { localeLabels, type AppLocale } from '@/core/i18n/routing';
import { Link } from '@/core/i18n/navigation';
import { paths } from '@/core/routes';
import { useTheme } from '@/core/theme';
import { Bell, Info, LogOut, Trash2, TriangleAlert } from '@/shared/lucide';
import { Button, SegmentedControl, Switch } from '@/shared/ui';
import { InlineNotice } from '@/shared/states';

import { LanguagePicker } from '../components/language-picker';
import { SettingsCard, SettingsSection } from '../components/settings-section';
import { SettingsRow, SettingsRowGroup } from '../components/settings-row';
import { ThemePicker } from '../components/theme-picker';
import { useLocaleSwitch } from '../hooks/use-locale-switch';
import {
  rehydrateNotificationPrefs,
  useNotificationPrefs,
  type NotificationChannel,
} from '../hooks/use-notification-prefs';
import { useProfile } from '../hooks/use-profile';
import { useSignOut } from '../hooks/use-sign-out';

const CHANNELS: readonly NotificationChannel[] = ['orderStatus', 'bonus', 'coupons', 'lottery'];

export interface SettingsContentProps {
  /** `compact` is the sheet / modal variant: one column, language as cards, no side column. */
  variant?: 'page' | 'compact';
}

export function SettingsContent({ variant = 'page' }: SettingsContentProps) {
  const t = useTranslations('settings');
  const tProfile = useTranslations('profile');
  const { pref: themePref, setPref } = useTheme();
  const { locale, pending, select } = useLocaleSwitch();
  const prefs = useNotificationPrefs();
  const profile = useProfile();
  const { signOut, busy } = useSignOut(profile.data?.phone);
  const compact = variant === 'compact';

  useEffect(() => {
    void rehydrateNotificationPrefs();
  }, []);

  const languageControl = compact ? (
    <LanguagePicker value={locale} onSelect={select} disabled={pending} />
  ) : (
    <SegmentedControl
      value={locale}
      onValueChange={(next) => select(next as AppLocale)}
      label={t('language.groupLabel')}
      fullWidth
      options={[
        { value: 'az', label: localeLabels.az },
        { value: 'ru', label: localeLabels.ru },
        { value: 'en', label: localeLabels.en },
      ]}
    />
  );

  const main = (
    <SettingsCard>
      <SettingsSection title={t('language.title')} description={t('language.desc')}>
        {languageControl}
        <p className="m-0 text-caption font-normal text-ink3">{t('localOnly')}</p>
      </SettingsSection>

      <SettingsSection title={t('theme.title')} description={t('theme.desc')}>
        <ThemePicker value={themePref} onSelect={setPref} />
      </SettingsSection>

      <SettingsSection title={t('notifications.title')} description={t('notifications.desc')}>
        <InlineNotice tone="info" icon={Info} multiline body={t('notifications.localNotice')} />
        <div className="flex w-full flex-col gap-1">
          {CHANNELS.map((channel) => (
            <Switch
              key={channel}
              checked={prefs[channel]}
              onCheckedChange={(next) => prefs.toggle(channel, next)}
              label={t(`notifications.${channel}`)}
              description={t(`notifications.${channel}Sub`)}
              containerClassName="w-full py-1.5"
            />
          ))}
        </div>
        <SettingsRowGroup className="mt-1 bg-bg">
          <SettingsRow
            icon={Bell}
            label={t('notifications.inbox')}
            href={paths.notifications}
          />
        </SettingsRowGroup>
      </SettingsSection>

      <SettingsSection title={t('security.title')} description={t('security.desc')}>
        <InlineNotice tone="info" icon={Info} multiline body={t('security.webNotice')} />
      </SettingsSection>
    </SettingsCard>
  );

  const side = (
    <div className="flex w-full flex-col gap-5 lg:w-[340px] lg:shrink-0">
      <section className="flex flex-col gap-3.5 rounded-xl bg-bg p-6 md:p-7">
        <div className="flex items-center gap-2.5">
          <TriangleAlert size={22} aria-hidden="true" className="shrink-0 text-brand" />
          <h2 className="m-0 text-[18px] font-extrabold text-brand">{t('danger.title')}</h2>
        </div>
        <p className="m-0 text-label font-normal leading-[1.5] text-ink2">{t('danger.text')}</p>
        <Button
          as="a"
          href={paths.accountDelete}
          variant="brand"
          fullWidth
          leadingIcon={<Trash2 size={18} aria-hidden="true" />}
        >
          {t('danger.delete')}
        </Button>
      </section>

      <section className="flex flex-col gap-1.5 rounded-xl bg-surface p-6 md:p-7">
        <div className="flex items-center gap-2">
          <Info size={18} aria-hidden="true" className="shrink-0 text-ink3" />
          <h2 className="m-0 text-body font-extrabold text-ink">{t('about.title')}</h2>
        </div>
        <p className="m-0 text-caption font-normal text-ink2">
          {t('about.version', { version: appVersion })}
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          <Link href={paths.terms} className="text-caption font-semibold text-brand underline">
            {t('about.terms')}
          </Link>
          <Link href={paths.privacy} className="text-caption font-semibold text-brand underline">
            {t('about.privacy')}
          </Link>
        </div>
      </section>

      <Button
        variant="soft"
        size="2xl"
        fullWidth
        loading={busy}
        onClick={() => void signOut()}
        leadingIcon={<LogOut size={20} aria-hidden="true" />}
      >
        {tProfile('signOut')}
      </Button>
    </div>
  );

  if (compact) {
    return (
      <div className="flex w-full flex-col gap-5">
        {main}
        {side}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-6">
      {main}
      {side}
    </div>
  );
}
