'use client';

/**
 * The "Info" card rows from `app-order-detail.html` (`nP0DF`) and `app-order-accepted.html`
 * (`NXfch`): a 44px `surface2` circle icon, a 13/400 `ink2` label and a 15/600 `ink` value.
 *
 * A row whose value is missing is not rendered — the detail shape is unverified, and an empty
 * "Kuryer —" line is worse than no line.
 */
import type { ReactNode } from 'react';
import { cn } from '@/core/lib/cn';
import type { LucideIcon } from '@/shared/lucide';
import { Card } from '@/shared/ui';

export interface InfoRow {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string | null;
}

export interface InfoRowsProps {
  rows: readonly InfoRow[];
  children?: ReactNode;
  className?: string;
}

export function InfoRows({ rows, children, className }: InfoRowsProps) {
  const visible = rows.filter((row) => !!row.value);
  if (visible.length === 0 && !children) return null;

  return (
    <Card tone="surface" radius="xl" className={cn('flex w-full flex-col gap-5 p-7', className)}>
      {visible.map((row) => (
        <div key={row.id} className="flex w-full items-center gap-[14px]">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-surface2 text-ink"
          >
            <row.icon size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-caption text-ink2">{row.label}</span>
            <span className="text-body-sm font-semibold text-ink">{row.value}</span>
          </span>
        </div>
      ))}
      {children}
    </Card>
  );
}
