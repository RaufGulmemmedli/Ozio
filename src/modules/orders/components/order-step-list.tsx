'use client';

/**
 * The vertical stepper with timestamps.
 *
 * Tracking (`app-order-tracking.html` `MVncQ`): 28px dot + a 3px connector, `brand-soft` dot for a
 * done step, `brand` for the current one, `surface2` for a todo step; label 15/700 `ink`
 * (15/500 `ink3` when todo) with the time 13/400 `ink3` on the right.
 * Detail (`app-order-detail.html` `vXt1O`): the same shape with an `ink` dot and a `line` connector.
 *
 * `<ol>` + `aria-current="step"`, per the a11y note in screens/app-core.md §5. When the connection
 * drops the stepper is frozen (`frozen`) and says so, instead of pretending to advance.
 */
import { useTranslations } from 'next-intl';
import { useFormat } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { Check, Package } from '@/shared/lucide';
import type { OrderStepView } from '../data/orders.repository';

export interface OrderStepListProps {
  steps: readonly OrderStepView[];
  /** `tracking` = brand dots (live), `history` = ink dots (a finished order's timeline). */
  variant?: 'tracking' | 'history';
  /** Connection lost: the list is dimmed and announced as frozen. */
  frozen?: boolean;
  className?: string;
}

export function OrderStepList({
  steps,
  variant = 'tracking',
  frozen = false,
  className,
}: OrderStepListProps) {
  const t = useTranslations('orders');
  const f = useFormat();
  const live = variant === 'tracking';

  return (
    <ol
      className={cn('flex w-full flex-col', frozen && 'opacity-60', className)}
      aria-label={t('steps.label')}
      aria-busy={frozen || undefined}
    >
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const done = step.state === 'done';
        const current = step.state === 'current';

        return (
          <li
            key={step.key}
            aria-current={step.current ? 'step' : undefined}
            className="flex w-full items-start gap-4"
          >
            <span className="flex shrink-0 flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-7 items-center justify-center rounded-pill',
                  done
                    ? live
                      ? 'bg-brand-soft text-brand'
                      : 'bg-ink text-on-cta'
                    : current
                      ? live
                        ? 'bg-brand text-white'
                        : 'bg-ink text-on-cta'
                      : 'bg-surface2 text-ink3',
                )}
              >
                {done || current ? <Check size={15} /> : <Package size={14} />}
              </span>
              {!last ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'w-[3px] flex-1 shrink-0',
                    done || current ? (live ? 'bg-brand' : 'bg-ink') : 'bg-line',
                  )}
                  style={{ minHeight: 28 }}
                />
              ) : null}
            </span>

            <span
              className={cn(
                'flex min-w-0 flex-1 items-baseline justify-between gap-3',
                !last && 'pb-4',
              )}
            >
              <span
                className={cn(
                  'truncate text-body-sm',
                  done || current ? 'font-bold text-ink' : 'font-medium text-ink3',
                )}
              >
                {t(`steps.${step.key}`)}
              </span>
              {step.at ? (
                <span className="shrink-0 text-caption text-ink3">{f.date(step.at, 'time')}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
