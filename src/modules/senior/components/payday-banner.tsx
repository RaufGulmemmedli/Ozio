'use client';

/**
 * The payday banner (`senior-pension.html` → `Payday Banner`): a `brand` block at radius 36 and
 * padding 32 — a calendar glyph beside "Pensiya günü · 25 Noyabr" (16/600), then the countdown at
 * 56/800 with the pension figure (14/400 label over 28/800) on the right.
 *
 * In Sadə rejim the countdown grows with the chosen scale (`seniorDisplayClass`), which is the one
 * size on these screens that is not a type token.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { useFormat } from '@/core/i18n';
import { Calendar } from '@/shared/lucide';

import { seniorDisplayClass, seniorOnBrandClass } from './senior-screen';

export interface PaydayBannerProps {
  /** ISO date of the next payday. */
  payday: string;
  daysUntilPayday: number;
  pension: number;
  className?: string;
}

export function PaydayBanner({ payday, daysUntilPayday, pension, className }: PaydayBannerProps) {
  const t = useTranslations('senior');
  const { money, date, number } = useFormat();

  return (
    <section
      aria-labelledby="senior-payday"
      className={cn(
        'flex w-full flex-col items-start gap-[10px] rounded-bento bg-brand p-8 text-white',
        // In Sadə rejim the fill moves to `brand-dark` so the 16/600 and 14/400 lines on it clear
        // AA (5.6:1) instead of only the large-text threshold — see `senior.module.css`.
        seniorOnBrandClass,
        className,
      )}
    >
      <p className="flex w-full flex-row items-center gap-[10px] text-body font-semibold">
        <Calendar aria-hidden="true" size={24} className="shrink-0" />
        {t('pension.payday', { date: date(payday, 'long') })}
      </p>

      <div className="flex w-full flex-row flex-wrap items-end justify-between gap-4">
        <h2
          id="senior-payday"
          className={cn('font-extrabold tracking-[-2px]', seniorDisplayClass)}
        >
          {t('pension.countdown', { days: number(daysUntilPayday) })}
        </h2>

        <div className="flex flex-col items-start gap-0.5">
          <span className="text-label">{t('pension.amountLabel')}</span>
          <span className="text-h3 font-extrabold">{money(pension)}</span>
        </div>
      </div>
    </section>
  );
}
