'use client';

/**
 * `/card/transactions` loading state, mirroring `app-kart-emeliyyatlar.html`:
 * three summary tiles (r28, padding 24/28), the filter row of pills (40 high),
 * and the table card (r28) with a header row and 8 data rows at 67.5 each.
 *
 * Static chrome (the back link, the title, the CSV button) is real and lives in
 * the view above this skeleton, so it is not shimmered. The grid columns and
 * paddings match the loaded table, so the rows do not jump.
 */
import { useTranslations } from 'next-intl';

import { cn } from '@/core/lib/cn';
import { Bone, Shimmer } from '@/shared/skeleton';

export interface TransactionsSkeletonProps {
  rows?: number;
  className?: string;
}

export function TransactionsSkeleton({ rows = 8, className }: TransactionsSkeletonProps) {
  const t = useTranslations('loyalty_card');

  return (
    <Shimmer label={t('loading')} className={cn('flex w-full flex-col gap-8', className)}>
      <div className="flex w-full flex-col gap-4 md:flex-row">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={cn(
              'flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl px-7 py-6',
              index === 0 ? 'bg-block' : 'border border-line bg-surface',
            )}
          >
            <Bone w={120} h={14} r="xs" tone={index === 0 ? 'surface2' : 'bone'} />
            <Bone w={160} h={32} r="sm" tone={index === 0 ? 'surface2' : 'bone'} />
          </div>
        ))}
      </div>

      <div className="flex w-full flex-row flex-wrap gap-3">
        {[96, 112, 116, 88, 120].map((width) => (
          <Bone key={width} w={width} h={40} r="pill" />
        ))}
      </div>

      <div className="flex w-full flex-col rounded-xl border border-line bg-surface pt-2">
        <div className="flex w-full flex-row items-center gap-4 px-7 py-4">
          <Bone w={120} h={12} r="xs" className="flex-1" />
          <Bone w={90} h={12} r="xs" />
          <Bone w={70} h={12} r="xs" />
          <Bone w={70} h={12} r="xs" />
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex h-[67px] w-full flex-row items-center gap-4 border-t border-line px-7"
          >
            <Bone w={44} h={44} r="md" />
            <Bone w={index % 2 === 0 ? 200 : 160} h={16} r="sm" className="flex-1" />
            <Bone w={110} h={14} r="xs" />
            <Bone w={90} h={14} r="xs" />
            <Bone w={70} h={16} r="xs" />
          </div>
        ))}
      </div>
    </Shimmer>
  );
}
