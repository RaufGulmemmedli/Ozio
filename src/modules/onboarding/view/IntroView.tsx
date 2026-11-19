'use client';

/**
 * `/onboarding?step=1..3` — the 3-step intro (Kart · Lotereya · Çatdırılma).
 *
 * The canvas has **no dedicated frame** for this route: the three steps and their copy come from
 * the tour rows of `xosh-geldin.html` (`osPCQ`), rebuilt here as one slide per step in the same
 * visual language (44px number tile, 17/800 title, 14/400 body). The step lives in the URL, so a
 * link can point straight at a slide and Back works between them.
 *
 * "Seen" is persisted through `usePrefs().onboardingSeen`, which is what `/splash` checks.
 */
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { useRouter } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { paths } from '@/core/routes';
import { usePrefs } from '@/core/session';
import { CreditCard, Trophy, Truck, type LucideIcon } from '@/shared/lucide';
import { OzioLogo } from '@/shared/brand';
import { Button } from '@/shared/ui';

import { INTRO_SLIDES, parseStep, type IntroSlide } from '../onboarding.constants';
import { useOnboardingFlow } from '../hooks/use-onboarding-flow';

const ICONS: Record<IntroSlide, LucideIcon> = {
  card: CreditCard,
  lottery: Trophy,
  delivery: Truck,
};

export function IntroView() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const search = useSearchParams();
  const { next } = useOnboardingFlow();
  const setOnboardingSeen = usePrefs((s) => s.setOnboardingSeen);

  const step = parseStep(search.get('step'));
  const slide = INTRO_SLIDES[step - 1] ?? INTRO_SLIDES[0];
  const Icon = ICONS[slide];
  const isLast = step === INTRO_SLIDES.length;

  const finish = () => {
    setOnboardingSeen(true);
    router.replace(next ? paths.loginNext(next) : paths.login);
  };

  const advance = () => {
    if (isLast) {
      finish();
      return;
    }
    const nextStep = (step + 1) as 2 | 3;
    router.push(paths.onboardingStep(nextStep));
  };

  return (
    <main
      id="main"
      className="flex min-h-dvh w-full flex-1 flex-col items-center justify-between gap-10 bg-bg px-5 py-8 md:py-16"
    >
      <div className="flex w-full max-w-[460px] items-center justify-between">
        <OzioLogo size="s" tone="brand" />
        <button
          type="button"
          onClick={finish}
          className="rounded-sm text-body-sm font-semibold text-ink2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {t('intro.skip')}
        </button>
      </div>

      <section className="flex w-full max-w-[460px] flex-1 flex-col justify-center gap-6">
        <span className="flex size-16 items-center justify-center rounded-pill bg-brand">
          <Icon aria-hidden="true" className="size-7 text-on-cta" />
        </span>
        <h1 className="text-h2 font-extrabold leading-tight tracking-[-1px] text-ink md:text-[40px]">
          {t(`intro.${slide}.title`)}
        </h1>
        <p className="text-body-l font-normal leading-relaxed text-ink2">
          {t(`intro.${slide}.body`)}
        </p>
      </section>

      <div className="flex w-full max-w-[460px] flex-col gap-6">
        <div
          className="flex items-center justify-center gap-2"
          role="group"
          aria-label={t('intro.progress', { step, total: INTRO_SLIDES.length })}
        >
          {INTRO_SLIDES.map((key, index) => (
            <span
              key={key}
              aria-hidden="true"
              className={cn(
                'h-1.5 rounded-pill transition-[width,background-color] duration-[var(--oz-dur-base)]',
                index === step - 1 ? 'w-7 bg-brand' : 'w-1.5 bg-line',
              )}
            />
          ))}
        </div>

        <Button type="button" size="3xl" fullWidth onClick={advance}>
          {isLast ? t('intro.start') : t('intro.next')}
        </Button>
      </div>
    </main>
  );
}
