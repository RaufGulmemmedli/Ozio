/**
 * The small-card grids the inner marketing pages share:
 *
 *  · `/cashback` campaign strip `I8aWr` — a big `value` ("10%", "2x") over a
 *    title, a line of text and a period chip
 *  · `/ten` monthly gifts `ebKD1`     — an icon, a title and a line of text
 *  · `/delivery` category tiles `l69lqE` — an icon, a name and a count
 *
 * All three are flat `surface` cards at radius 28 with 24 padding, 3 across at
 * 1200, 2 at 768 and 1 below — which is how the export draws each of them.
 */
import { cn } from '@/core/lib/cn';
import { Link } from '@/core/i18n/navigation';
import type { LucideIcon } from '@/shared/lucide';

import { brandText } from './type';

export interface TileEntry {
  id: string;
  title: string;
  text?: string;
  /** Large figure in `brand` — the campaign cards. */
  value?: string;
  /** Chip in the bottom-right — a campaign period. */
  badge?: string;
  icon?: LucideIcon;
  href?: string;
}

export interface TileGridProps {
  items: TileEntry[];
  /** Columns at ≥1200. 2 at 768 for every variant. */
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLS: Record<2 | 3 | 4, string> = {
  2: 'min-[1200px]:grid-cols-2',
  3: 'min-[1200px]:grid-cols-3',
  4: 'min-[1200px]:grid-cols-4',
};

function TileBody({ item }: { item: TileEntry }) {
  const Icon = item.icon;

  return (
    <>
      {item.value ? (
        <span className="text-h2 font-extrabold leading-none tracking-[-0.02em] text-brand">
          {item.value}
        </span>
      ) : null}

      {Icon ? (
        <span
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-[16px] bg-brand-soft',
            brandText,
          )}
        >
          <Icon size={24} aria-hidden="true" />
        </span>
      ) : null}

      <span className="flex flex-col gap-1.5">
        <span className="text-h4 font-bold text-ink">{item.title}</span>
        {item.text ? <span className="text-body-sm leading-6 text-ink2">{item.text}</span> : null}
      </span>

      {item.badge ? (
        <span className="inline-flex h-7 w-fit items-center rounded-pill bg-surface2 px-3 text-caption font-semibold text-ink2">
          {item.badge}
        </span>
      ) : null}
    </>
  );
}

export function TileGrid({ items, columns = 3, className }: TileGridProps) {
  return (
    <ul
      className={cn(
        'm-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 min-[1200px]:gap-5',
        COLS[columns],
        className,
      )}
    >
      {items.map((item) => {
        const shell =
          'flex h-full flex-col items-start gap-4 rounded-xl bg-surface p-6 ' +
          'transition-transform duration-[var(--oz-dur-base)] ease-[var(--oz-ease-out)]';

        return (
          <li key={item.id} className="flex">
            {item.href ? (
              <Link
                href={item.href}
                prefetch={false}
                className={cn(shell, 'w-full hover:-translate-y-1 active:scale-[.99]')}
              >
                <TileBody item={item} />
              </Link>
            ) : (
              <div className={cn(shell, 'w-full')}>
                <TileBody item={item} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
