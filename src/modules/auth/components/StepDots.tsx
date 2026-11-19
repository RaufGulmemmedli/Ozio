import { cn } from '@/core/lib/cn';

/**
 * The step indicator above the heading (`qeydiyyat.html` `tvreK`, `icazeler.html` `tFzpq`):
 * 28x6 bars, radius 3 (= fully rounded at that height), `brand` when reached and `line` when
 * not, then a 13/600 `ink3` label.
 */
export function StepDots({
  total,
  current,
  label,
  className,
}: {
  total: number;
  /** 1-based. */
  current: number;
  /** Already-localized, e.g. "İcazələr · 2/3". */
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('flex w-fit items-center gap-2', className)}>
      <div className="flex items-center gap-2" aria-hidden="true">
        {Array.from({ length: Math.max(total, 0) }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 w-7 rounded-pill',
              i < current ? 'bg-brand' : 'bg-line',
            )}
          />
        ))}
      </div>
      <span className="text-caption font-semibold text-ink3">{label}</span>
    </div>
  );
}
