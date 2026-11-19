'use client';

/**
 * One label/value row, shared by the summary card and the result receipt
 * (`topup-card.html` → `Row Artırma məbləği`, `topup-success.html` → `Receipt`).
 *
 * Measured: `justify-between`, label 15/500 `ink2`, value 15/600 `ink`. The emphasised variant
 * ("Kartdan çıxılacaq" / "Yeni balans") is label 16/700 and value 18/800 — 24/800 on the result
 * screen, hence the `valueClassName` escape hatch.
 *
 * Rendered as a `<div>` pair inside a `<dl>`, which is what both call sites wrap it in.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export interface TopupSummaryRowProps {
  label: ReactNode;
  value: ReactNode;
  /** The row above the CTA: bigger, bolder. */
  emphasis?: boolean;
  /** `success` paints the value green — "Pulsuz" (`#12A150` in the export). */
  tone?: 'default' | 'success';
  valueClassName?: string;
  className?: string;
}

export function TopupSummaryRow({
  label,
  value,
  emphasis = false,
  tone = 'default',
  valueClassName,
  className,
}: TopupSummaryRowProps) {
  return (
    <div className={cn('flex w-full flex-row items-center justify-between gap-4', className)}>
      <dt className={cn(emphasis ? 'text-body font-bold text-ink' : 'text-body-sm font-medium text-ink2')}>
        {label}
      </dt>
      <dd
        className={cn(
          'text-end tabular-nums',
          emphasis ? 'text-body-l font-extrabold text-ink' : 'text-body-sm font-semibold text-ink',
          tone === 'success' && 'text-success',
          valueClassName,
        )}
      >
        {value}
      </dd>
    </div>
  );
}
