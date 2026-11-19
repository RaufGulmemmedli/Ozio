/**
 * Eyebrow chip — node `kFYqM` (components.md §11): height 36, padding 0/16, pill
 * `yellow`, sparkles 16 + 14/700 `on-yellow`.
 */
import { cn } from '@/core/lib/cn';
import { Sparkles } from '@/shared/lucide';

export interface EyebrowChipProps {
  children: string;
  className?: string;
}

export function EyebrowChip({ children, className }: EyebrowChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-pill bg-yellow px-4',
        'text-label font-bold text-on-yellow',
        className,
      )}
    >
      <Sparkles size={16} aria-hidden="true" />
      {children}
    </span>
  );
}
