'use client';

/**
 * `/permission/location` — step 3/3 of the first run, the Məkan half of `icazeler.html`.
 *
 * An explainer around `navigator.geolocation`. The coordinates are not sent anywhere from here:
 * `stores/search` needs lat+lng, and that call belongs to the store module. Granting only unlocks
 * the browser permission. Guard is `guest`, so a visitor who never signed in can still pass
 * through, and continuing is always possible.
 */
import { useTranslations } from 'next-intl';

import { useRouter } from '@/core/i18n';
import { MapPin } from '@/shared/lucide';

import { PermissionCard } from '../components/PermissionCard';
import { PermissionScreen } from '../components/PermissionScreen';
import { useLocationPermission } from '../hooks/use-browser-permission';
import { useOnboardingFlow } from '../hooks/use-onboarding-flow';

export function LocationPermissionView() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const permission = useLocationPermission();
  const { afterLocation, final } = useOnboardingFlow();

  return (
    <PermissionScreen
      step={2}
      title={t('permission.title')}
      subtitle={t('permission.subtitle')}
      continueLabel={t('permission.continue')}
      onContinue={() => router.replace(afterLocation())}
      onSkip={() => router.replace(final())}
    >
      <PermissionCard
        icon={MapPin}
        tone="sky"
        title={t('permission.location.title')}
        body={t('permission.location.body')}
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
