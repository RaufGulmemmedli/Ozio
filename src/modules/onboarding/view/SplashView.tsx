'use client';

/**
 * `/splash` — the bootstrap screen (`yuklenme-lottie.html`, node `pTwuM`).
 *
 * `<LottieLoader>` plays `public/lottie/ozio_logo.json`: frames **0-186** (scooter in, then the
 * logo holds while the session restores) and **186-248** on `ready`, after which the route moves
 * on. Under `prefers-reduced-motion` the component shows a still frame and calls back at once.
 *
 * The caption is "Yüklənir…". The "Motion Spec" / file-size panel in the export is a design
 * annotation and is deliberately **not** rendered (BUILD-CONTRACT "Using the design export HTML").
 *
 * Minimum display time `SPLASH_MIN_MS` (1.2 s) keeps a warm boot from flashing.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/core/i18n';
import { useSession } from '@/core/session';
import { LottieLoader } from '@/shared/brand';

import { SPLASH_MIN_MS } from '../onboarding.constants';
import { useOnboardingFlow } from '../hooks/use-onboarding-flow';

export function SplashView() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const status = useSession((s) => s.status);
  const { bootstrap } = useOnboardingFlow();

  const [minElapsed, setMinElapsed] = useState(false);
  const [left, setLeft] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  // The session store answers `guest` even when it is offline, so this always settles.
  const ready = minElapsed && status !== 'unknown';

  const leave = () => {
    if (left) return;
    setLeft(true);
    router.replace(bootstrap());
  };

  // Safety net: if the exit callback never fires (engine failed to load), leave anyway.
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(leave, 1_500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <main
      id="main"
      className="oz-splash-surface flex min-h-dvh w-full flex-1 flex-col items-center justify-center gap-8 px-5"
    >
      {/* The page has no visible title; the heading keeps the document outline valid. */}
      <h1 className="sr-only">{t('splash.loading')}</h1>
      {/* No width override: `<LottieLoader>` carries the responsive size ladder, so this route
          and `<BootSplash>` stay the same size at every breakpoint. */}
      <LottieLoader ready={ready} onExitDone={leave} label={t('splash.loading')} />
      <p aria-hidden="true" className="text-body font-medium text-white/70">
        {t('splash.loading')}
      </p>
    </main>
  );
}
