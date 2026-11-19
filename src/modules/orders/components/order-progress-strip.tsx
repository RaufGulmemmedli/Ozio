'use client';

/**
 * The 4-segment progress strip + its labels, from `app-orders.html` (`tL62U` / `U2OavZ`):
 * 4 bars, height 6, gap 6, pill; lit = `yellow` on the dark card and `brand` on the light one,
 * unlit = `white/18` on dark, `surface2` on light. Labels 12/500, 12/700 on the current step.
 *
 * One `<li>` per step (bar + label stacked) so the strip is a real step list, with
 * `aria-current="step"` on the step the order is at.
 */
import { useTranslations } from 'next-intl';
import { cn } from '@/core/lib/cn';
import type { OrderStepView } from '../data/orders.repository';

export interface OrderProgressStripProps {
  steps: readonly OrderStepView[];
  onBlock?: boolean;
  className?: string;
}

export function OrderProgressStrip({ steps, onBlock = false, className }: OrderProgressStripProps) {
  const t = useTranslations('orders');

  return (
    <ol className={cn('flex w-full items-start gap-1.5', className)} aria-label={t('steps.label')}>
      {steps.map((step, index) => (
        <li
          key={step.key}
          aria-current={step.current ? 'step' : undefined}
          className="flex min-w-0 flex-1 flex-col gap-2.5"
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-1.5 w-full rounded-pill',
              step.state === 'todo'
                ? onBlock
                  ? 'bg-white/18'
                  : 'bg-surface2'
                : onBlock
                  ? 'bg-yellow'
                  : 'bg-brand',
            )}
          />
          <span
            className={cn(
              'truncate text-micro',
              // The last label sits flush right, as in the export.
              index === steps.length - 1 && 'text-right',
              step.state === 'todo'
                ? onBlock
                  ? 'font-medium text-white/50'
                  : 'font-medium text-ink3'
                : onBlock
                  ? 'font-bold text-white'
                  : 'font-bold text-ink',
            )}
          >
            {t(`steps.${step.key}`)}
          </span>
        </li>
      ))}
    </ol>
  );
}
