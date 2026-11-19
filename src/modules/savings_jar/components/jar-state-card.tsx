'use client';

/**
 * The `State Card` panel from `savings-jar-empty.html` / `savings-jar-error.html`: `surface`,
 * r36, centred, ~520 high. `<EmptyState>` / `<ErrorState>` draw the block inside it.
 */
import type { ReactNode } from 'react';

import { cn } from '@/core/lib/cn';

export function JarStateCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
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
