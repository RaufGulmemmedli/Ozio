'use client';

/**
 * The dark balance block on `/topup` (`topup-method.html` → node `Balance`).
 *
 * Measured: `block` fill, radius 28, padding 28, gap 14, 380 wide on desktop and full width below
 * `lg`. Label 14/500 at 70% opacity, amount 44/800, then the card chip — a `#FFFFFF1F` pill,
 * radius 999, padding 8/14, gap 8, label 13/600.
 *
 * Both numbers here are **real** (`GET v1/profile/me`), and the amount is rendered through
 * `useFormat().money`, never assembled from a number and a glyph.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { CreditCard } from '@/shared/lucide';

import { topupDisplayNumber, type TopupAccount } from '../data/models/topup-account';

export interface TopupBalanceCardProps {
  account: TopupAccount;
  className?: string;
}

export function TopupBalanceCard({ account, className }: TopupBalanceCardProps) {
  const t = useTranslations('topup');
  const { money } = useFormat();

  return (
    <section
      aria-label={t('balance.label')}
      className={cn(
        'flex w-full shrink-0 flex-col items-start gap-[14px] rounded-xl bg-block p-7',
        'lg:w-[380px]',
        className,
      )}
    >
      <p className="text-label font-medium text-on-block opacity-70">{t('balance.label')}</p>
      <p className="text-h1-app font-extrabold text-on-block tabular-nums md:text-[44px]">
        {money(account.balance)}
      </p>

      {account.hasCard ? (
        <p className="flex w-fit flex-row items-center gap-2 rounded-pill bg-on-block/[0.12] px-[14px] py-2 text-caption font-semibold text-on-block">
          <CreditCard aria-hidden="true" size={16} className="shrink-0" />
          <span className="tabular-nums">
            {t('balance.card', { number: topupDisplayNumber(account.cardNumber) })}
          </span>
        </p>
      ) : (
        <p className="flex w-fit flex-row items-center gap-2 rounded-pill bg-on-block/[0.12] px-[14px] py-2 text-caption font-semibold text-on-block2">
          <CreditCard aria-hidden="true" size={16} className="shrink-0" />
          {t('balance.noCard')}
        </p>
      )}
    </section>
  );
}
