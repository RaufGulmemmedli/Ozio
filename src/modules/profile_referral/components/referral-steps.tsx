'use client';

/**
 * The three step cards on `/invite` (`referral.html` → `Steps`).
 *
 * Measured: a row of three equal `surface` cards, radius 24, padding 24, gap 14 inside / 16
 * between; each has a 48 disc — `brand-soft` for the first two, `yellow` for the reward step — and
 * 16/700/21 copy. They stack below `md`.
 *
 * The reward figure comes from the mock programme (`rewardPerInvite`) and is rendered through
 * `useFormat().money`; it is never typed into the copy.
 */
import { useTranslations } from 'next-intl';

import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Gift, Share2, Users } from '@/shared/lucide';

export interface ReferralStepsProps {
  rewardPerInvite: number;
  className?: string;
}

export function ReferralSteps({ rewardPerInvite, className }: ReferralStepsProps) {
  const t = useTranslations('referral');
  const { money } = useFormat();

  const steps = [
    // The export draws lucide `send` / `user-plus`; neither is in @/shared/lucide, so the nearest
    // exported glyphs stand in (see this module's README note in index.ts).
    { key: 'one', icon: Share2, text: t('steps.one'), tone: 'brand' as const },
    { key: 'two', icon: Users, text: t('steps.two'), tone: 'brand' as const },
    {
      key: 'three',
      icon: Gift,
      text: t('steps.three', { reward: money(rewardPerInvite) }),
      tone: 'yellow' as const,
    },
  ];

  return (
    <ol className={cn('flex w-full flex-col gap-4 md:flex-row', className)}>
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <li
            key={step.key}
            className="flex min-w-0 flex-1 flex-col items-start gap-[14px] rounded-card bg-surface p-6"
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-pill',
                step.tone === 'yellow' ? 'bg-yellow text-on-yellow' : 'bg-brand-soft text-brand',
              )}
            >
              <Icon size={22} />
            </span>
            <span className="text-body font-bold leading-[21px] text-ink">{step.text}</span>
          </li>
        );
      })}
    </ol>
  );
}
