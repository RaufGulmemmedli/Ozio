'use client';

import { cn } from '@/core/lib/cn';
import { Sparkles } from '@/shared/lucide';

/** `AI Tag` node: `violet-soft` pill, 5/12 padding, `sparkles` 14, 13/800 `violet`. */
export function AiTag({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 flex-row items-center gap-1.5 rounded-pill bg-violet-soft px-3 py-[5px]',
        'text-caption font-extrabold text-violet',
        className,
      )}
    >
      <Sparkles aria-hidden="true" size={14} className="shrink-0" />
      {label}
    </span>
  );
}
