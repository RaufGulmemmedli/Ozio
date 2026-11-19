'use client';

/**
 * The `State Card` from the export: a `surface` panel, r36, 520 high, centred — icon disc 104 with
 * a 48 glyph, 26/800 title, 15/400 body (max 420) and an optional dark pill button.
 *
 * `<EmptyState>` / `<ErrorState>` from `@/shared/states` draw the inner block (including
 * `role="status"` / `role="alert"`); this only supplies the panel the design wraps them in, so the
 * two never disagree about spacing.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export function StateCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center rounded-bento bg-surface px-5 py-14',
        'min-h-[420px] lg:min-h-[520px]',
        className,
      )}
    >
      {children}
    </div>
  );
}
