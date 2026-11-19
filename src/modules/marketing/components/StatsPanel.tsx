/**
 * Stats block — node `mGwhL` / `SVlHx` (layout.md §3, components.md §11).
 *
 * Desktop: section padding 0/120, a 1200×198 `block` panel at radius 40, padding
 * 56/64, four stats space-between. Value 48/800/-1 `on-block` (one in `yellow`),
 * label 16/400 `on-block2`.
 * Tablet (`ZktEG`): radius 36, padding 36, gap 28, 2×2.
 * Mobile (`Znj5i`): four 169×95 `rounded-card` `block` tiles in a 2×2 grid, with
 * the short labels from the mobile frame.
 *
 * The figures are static by design — see `content/landing.ts`. No count-up:
 * the numbers are baked, so animating them would need a client island for pure
 * decoration on the page with the tightest JS budget.
 */
import { cn } from '@/core/lib/cn';
import { Container } from '@/shared/layout/container';

import { typeStatValue } from './type';

export interface StatEntry {
  id: string;
  value: string;
  label: string;
  /** Shown below 768 instead of `label`. */
  shortLabel: string;
  highlight?: boolean;
}

export interface StatsPanelProps {
  /** Accessible name for the group. */
  label: string;
  stats: StatEntry[];
  className?: string;
}

export function StatsPanel({ label, stats, className }: StatsPanelProps) {
  return (
    <section aria-label={label} className={cn('w-full', className)}>
      <Container>
        <div
          className={cn(
            'grid grid-cols-2 gap-3',
            'md:gap-7 md:rounded-bento md:bg-block md:p-9',
            'min-[1200px]:gap-0 min-[1200px]:rounded-[40px] min-[1200px]:px-16 min-[1200px]:py-14',
            // `/` carries four figures (`mGwhL`), `/delivery` three (`Vca6I`).
            stats.length === 3 ? 'min-[1200px]:grid-cols-3' : 'min-[1200px]:grid-cols-4',
          )}
        >
          {stats.map((stat) => (
            <div
              key={stat.id}
              className={cn(
                'flex min-h-[95px] flex-col justify-center gap-1.5 rounded-card bg-block p-4',
                'md:min-h-0 md:justify-start md:rounded-none md:bg-transparent md:p-0',
              )}
            >
              <span
                className={cn(
                  'tabular-nums',
                  typeStatValue,
                  stat.highlight ? 'text-yellow' : 'text-on-block',
                )}
              >
                {stat.value}
              </span>
              <span className="text-caption text-on-block2 md:text-body">
                <span className="md:hidden">{stat.shortLabel}</span>
                <span className="hidden md:inline">{stat.label}</span>
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
