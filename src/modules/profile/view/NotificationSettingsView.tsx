'use client';

/**
 * PS4 "Bildiriş ayarları" — `/settings/notifications`.
 *
 * **There is no notification-preferences endpoint** (api/screen-api-matrix.md lists this screen as
 * "none — no preferences endpoint (client-only)"), so the four toggles are local to this browser
 * and the screen says so in its own copy rather than implying a server round trip. The one real
 * control on the page is the browser's own Notification permission.
 *
 * The inbox itself (`GET /notification/api/v1/notifications`) belongs to agent M2 — this screen
 * only links to `/notifications`.
 */
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { paths } from '@/core/routes';
import { Bell, Info, TriangleAlert } from '@/shared/lucide';
import { PageHeader } from '@/shared/layout';
import { Button, Switch } from '@/shared/ui';
import { InlineNotice } from '@/shared/states';

import { SettingsRow, SettingsRowGroup } from '../components/settings-row';
import { SettingsCard, SettingsSection } from '../components/settings-section';
import {
  rehydrateNotificationPrefs,
  requestBrowserPermission,
  useBrowserPermission,
  useNotificationPrefs,
  type NotificationChannel,
} from '../hooks/use-notification-prefs';

const CHANNELS: readonly NotificationChannel[] = ['orderStatus', 'bonus', 'coupons', 'lottery'];

export function NotificationSettingsView() {
  const t = useTranslations('settings');
  const prefs = useNotificationPrefs();
  // Read straight from the browser (useSyncExternalStore), so there is no state to sync in an
  // effect and the server render ("unsupported") never mismatches the client's first paint.
  const permission = useBrowserPermission();

  useEffect(() => {
    void rehydrateNotificationPrefs();
  }, []);

  const ask = async () => {
    await requestBrowserPermission();
  };

  return (
    <>
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.desc')}
        backHref={paths.settings}
        backLabel={t('back')}
      />

      <div className="flex w-full max-w-[760px] flex-col gap-5">
        <InlineNotice tone="info" icon={Info} multiline body={t('notifications.localNotice')} />

        <SettingsCard>
          <SettingsSection
            title={t('notifications.title')}
            description={t('notifications.desc')}
          >
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
          </SettingsSection>

          <SettingsSection
            title={t('notifications.browser.title')}
            description={t('notifications.browser.desc')}
          >
            {permission === 'granted' ? (
              <InlineNotice
                tone="success"
                icon={Bell}
                multiline
                body={t('notifications.browser.granted')}
              />
            ) : permission === 'denied' ? (
              <InlineNotice
                tone="note"
                icon={TriangleAlert}
                multiline
                body={t('notifications.browser.denied')}
              />
            ) : permission === 'unsupported' ? (
              <InlineNotice
                tone="note"
                icon={TriangleAlert}
                multiline
                body={t('notifications.browser.unsupported')}
              />
            ) : (
              <Button
                variant="primary"
                onClick={() => void ask()}
                leadingIcon={<Bell size={20} aria-hidden="true" />}
                className="w-fit"
              >
                {t('notifications.browser.grant')}
              </Button>
            )}
          </SettingsSection>
        </SettingsCard>

        <SettingsRowGroup as="nav">
          {/* TODO(notifications): agent M2 owns this screen — link only, never a rebuild. */}
          <SettingsRow icon={Bell} label={t('notifications.inbox')} href={paths.notifications} />
        </SettingsRowGroup>
      </div>
    </>
  );
}
