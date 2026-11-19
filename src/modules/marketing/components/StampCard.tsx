/**
 * Stamp card — node `O5jXWF` / `Stamp Card` (components.md §5 "Stamp card").
 *
 * `surface`, radius 32, padding 32, gap 20. Header "Sənin kartın" 20/700 + a
 * 30-high `brand-soft` pill with "7 / 10" 13/700 `brand-dark`. Then two rows of
 * five 72 px circles, space-between at gap 16: filled stamps are `brand` with a
 * 28 white check, empty ones are `surface` with a 2 px `ink3` ring, and the tenth
 * is `yellow` with a gift.
 *
 * Decorative: it is a sample card, so the circles are `aria-hidden` and the
 * progress sentence is the accessible text. No fill animation — the numbers are
 * baked, and a scroll-triggered animation would cost a client island on the
 * budget-capped marketing route.
 */
import { cn } from '@/core/lib/cn';
import { Check, Circle, Gift } from '@/shared/lucide';

import { brandText } from './type';

const TOTAL = 10;

export interface StampCardProps {
  title: string;
  progress: string;
  /** Accessible sentence, e.g. "10 möhürdən 7-si yığılıb — nümunə kart". */
  label: string;
  /** Collected stamps; 7 in every frame of the canvas. */
  filled?: number;
  /** Line under the grid, used on `/ten` (`3 alışdan sonra hədiyyən açılır`). */
  hint?: string;
  className?: string;
}

const CIRCLE = 'grid size-11 shrink-0 place-items-center rounded-pill md:size-14 min-[1200px]:size-[72px]';

export function StampCard({
  title,
  progress,
  label,
  filled = 7,
  hint,
  className,
}: StampCardProps) {
  const stamps = Array.from({ length: TOTAL }, (_, index) => index + 1);

  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-modal bg-surface p-6 md:p-8',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-h4 font-bold text-ink">{title}</p>
        <span className={cn('inline-flex h-[30px] items-center rounded-pill bg-brand-soft px-3 text-caption font-bold tabular-nums', brandText)}>
          {progress}
        </span>
      </div>

      <p className="sr-only">{label}</p>

      <div aria-hidden className="grid grid-cols-5 justify-items-center gap-3 md:gap-4">
        {stamps.map((index) => {
          if (index === TOTAL) {
            return (
              <span key={index} className={cn(CIRCLE, 'bg-yellow text-on-yellow')}>
                <Gift size={20} className="md:size-7" aria-hidden="true" />
              </span>
            );
          }
          if (index <= filled) {
            return (
              <span key={index} className={cn(CIRCLE, 'bg-brand text-white')}>
                <Check size={20} className="md:size-7" aria-hidden="true" />
              </span>
            );
          }
          return (
            <span
              key={index}
              className={cn(CIRCLE, 'bg-surface text-ink3 ring-2 ring-inset ring-ink3')}
            >
              <Circle size={18} className="md:size-6" aria-hidden="true" />
            </span>
          );
        })}
      </div>

      {hint ? <p className="m-0 text-caption text-ink2">{hint}</p> : null}
    </div>
  );
}
