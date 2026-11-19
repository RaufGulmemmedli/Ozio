'use client';

/**
 * The 3-step tracker on a request detail (`ask-detail-parent-pending.html` → `Tracker`):
 * Göndərildi → Baxılır → Nəticə. A reached step is a 32 `cta` disc with a 16px check and a
 * 14/700 `ink` label; an unreached one is a `surface2` disc with its number and an `ink3` label.
 * The connecting rules are 2px, `ink` when the next step is reached and `line` otherwise.
 *
 * Rendered as an ordered list with `aria-current="step"` on the step in progress, so the state is
 * not colour-only.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Check } from '@/shared/lucide';

import type { AskStatus } from '../data/models/ask-request';
import { trackerStep } from '../data/models/ask-request';

const STEPS = ['sent', 'review', 'result'] as const;

export interface AskTrackerProps {
  status: AskStatus;
  className?: string;
}

export function AskTracker({ status, className }: AskTrackerProps) {
  const t = useTranslations('ask_to_buy');
  const reached = trackerStep(status);

  return (
    <ol
      aria-label={t('tracker.label')}
      className={cn('flex w-full flex-row flex-wrap items-center gap-3', className)}
    >
      {STEPS.map((step, index) => {
        const done = index <= reached;
        const current = index === reached;
        return (
          <li
            key={step}
            aria-current={current ? 'step' : undefined}
            className="flex min-w-0 flex-1 flex-row items-center gap-3"
          >
            <span className="flex shrink-0 flex-row items-center gap-[10px]">
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-pill text-label font-bold',
                  done ? 'bg-cta text-on-cta' : 'bg-surface2 text-ink3',
                )}
              >
                {done ? <Check size={16} aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-label',
                  done ? 'font-bold text-ink' : 'font-medium text-ink3',
                )}
              >
                {t(`tracker.${step}`)}
                <span className="sr-only">
                  {' '}
                  {done ? t('tracker.done') : t('tracker.pending')}
                </span>
              </span>
            </span>

            {index < STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  'hidden h-0.5 min-w-6 flex-1 sm:block',
                  index < reached ? 'bg-ink' : 'bg-line',
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
