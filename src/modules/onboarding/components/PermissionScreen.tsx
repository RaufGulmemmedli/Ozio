'use client';

/**
 * The shared chrome of the two permission steps (`icazeler.html` `qGoI6`): step dots
 * "İcazələr · 2/3", the 40/800 heading, the card, a primary pill 60 "Davam et" and the 15/600
 * `ink2` skip link "İndi yox, sonra ayarlayaram".
 *
 * `layout: modal` for these routes means a centred panel: the `(onboarding)` group layout is
 * full-bleed, so the panel is built here rather than by editing a layout this module does not own.
 */
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui';

export function PermissionScreen({
  step,
  title,
  subtitle,
  children,
  onContinue,
  onSkip,
  continueLabel,
}: {
  /** 1-based position inside the 3-step first run. */
  step: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  onContinue: () => void;
  onSkip: () => void;
  continueLabel: string;
}) {
  const t = useTranslations('onboarding');

  return (
    <main
      id="main"
      className="flex min-h-dvh w-full flex-1 items-center justify-center px-5 py-10"
    >
      <div className="flex w-full max-w-[460px] flex-col gap-6 rounded-modal bg-bg md:bg-surface md:p-8 md:shadow-modal">
        <div className="flex w-fit items-center gap-2">
          <span className="flex items-center gap-2" aria-hidden="true">
            {[1, 2, 3].map((index) => (
              <span
                key={index}
                className={`h-1.5 w-7 rounded-pill ${index <= step ? 'bg-brand' : 'bg-line'}`}
              />
            ))}
          </span>
          <span className="text-caption font-semibold text-ink3">
            {t('permission.step', { step, total: 3 })}
          </span>
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <h1 className="text-h2 font-extrabold leading-tight tracking-[-1px] text-ink md:text-[40px]">
            {title}
          </h1>
          <p className="w-full text-body font-normal leading-[22px] text-ink2">{subtitle}</p>
        </div>

        {children}

        <Button type="button" size="3xl" fullWidth onClick={onContinue}>
          {continueLabel}
        </Button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-sm text-center text-body-sm font-semibold text-ink2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {t('permission.skip')}
        </button>
      </div>
    </main>
  );
}
