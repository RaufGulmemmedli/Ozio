'use client';

/**
 * The status pill. The mapping is fixed by `screens/mock-family-senior.md`
 * ("Implementation notes"): pending `yellow`/`on-yellow`, approved `success-soft`/`success`,
 * declined `brand-soft`/`brand`, expired `surface2`/`ink2`. 28 high, radius 999, 13/700.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';

import type { AskStatus } from '../data/models/ask-request';

const TONE: Readonly<Record<AskStatus, string>> = {
  pending: 'bg-yellow text-on-yellow',
  approved: 'bg-success-soft text-success',
  declined: 'bg-brand-soft text-brand',
  expired: 'bg-surface2 text-ink2',
};

export interface AskStatusChipProps {
  status: AskStatus;
  className?: string;
}

export function AskStatusChip({ status, className }: AskStatusChipProps) {
  const t = useTranslations('ask_to_buy');
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center rounded-pill px-3 text-caption font-bold',
        TONE[status],
        className,
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
