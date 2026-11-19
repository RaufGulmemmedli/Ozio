'use client';

/**
 * `/permission/notifications` — step 2/3 of the first run, the Bildirişlər half of `icazeler.html`.
 *
 * It is an **explainer** around `Notification.requestPermission()`. There is no web-push endpoint
 * in the API, so nothing is registered server-side; granting only unlocks the browser permission.
 * Continuing is always possible, in every state.
 */
import { useTranslations } from 'next-intl';

import { useRouter } from '@/core/i18n';
import { Bell } from '@/shared/lucide';

import { PermissionCard } from '../components/PermissionCard';
import { PermissionScreen } from '../components/PermissionScreen';
import { useNotificationPermission } from '../hooks/use-browser-permission';
import { useOnboardingFlow } from '../hooks/use-onboarding-flow';

export function NotificationsPermissionView() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const permission = useNotificationPermission();
  const { afterNotifications, final } = useOnboardingFlow();

  return (
    <PermissionScreen
      step={2}
      title={t('permission.title')}
      subtitle={t('permission.subtitle')}
      continueLabel={t('permission.continue')}
      onContinue={() => router.replace(afterNotifications())}
      onSkip={() => router.replace(final())}
    >
      <PermissionCard
        icon={Bell}
        tone="violet"
        title={t('permission.notifications.title')}
        body={t('permission.notifications.body')}
        state={permission.state}
        pending={permission.pending}
        grantLabel={t('permission.grant')}
        grantedLabel={t('permission.granted')}
        deniedHint={t('permission.denied')}
        onGrant={() => void permission.request()}
      />
    </PermissionScreen>
  );
}
