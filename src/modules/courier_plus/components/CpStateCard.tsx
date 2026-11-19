/**
 * `State Card` (`Avqyz` / `A8uhf`): the white card the empty / error / gate blocks sit in —
 * radius 28, 56px padding, centred content. `<EmptyState>` / `<ErrorState>` go inside it so the
 * copy, icon tile and CTA all come from `@/shared/states`.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export function CpStateCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center rounded-xl bg-surface px-6 py-12 md:p-14',
        className,
      )}
    >
      {children}
    </div>
  );
}
