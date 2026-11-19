'use client';

/**
 * The 340-wide "Necə işləyir?" side card (`ask-inbox.html` → `How it works`): title 20/700 then
 * three steps, each a 36 `cta` numbered disc beside a 15/700 title and a 14/400 `ink2` line.
 *
 * It is static chrome: it stays real in the loading, empty and error states of the inbox, which is
 * exactly what `ask-inbox-skeleton.html` draws (only its bones are shimmered there).
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';

const STEPS = [1, 2, 3] as const;

export interface HowItWorksCardProps {
  className?: string;
}

export function HowItWorksCard({ className }: HowItWorksCardProps) {
  const t = useTranslations('ask_to_buy');

  return (
    <section
      aria-labelledby="ask-how-it-works"
      className={cn(
        'flex w-full shrink-0 flex-col items-start gap-4 rounded-xl bg-surface p-7 lg:w-[340px]',
        className,
      )}
    >
      <h2 id="ask-how-it-works" className="text-h4 font-bold text-ink">
        {t('how.title')}
      </h2>

      <ol className="flex w-full flex-col gap-4">
        {STEPS.map((step) => (
          <li key={step} className="flex flex-row items-start gap-[14px]">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-cta text-label font-bold text-on-cta"
            >
              {step}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-body-sm font-bold text-ink">{t(`how.step${step}.title`)}</span>
              <span className="text-label text-ink2">{t(`how.step${step}.body`)}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
