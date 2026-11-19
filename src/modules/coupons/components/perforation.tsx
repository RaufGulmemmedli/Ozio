/**
 * The ticket perforation — a dashed rail with two semicircle cut-outs notching the
 * card edge, measured from `app-kuponlar.html` / `app-kupon-detali.html`:
 *
 *   vertical   (coupon card)   column 20 wide, 9 dashes 2x7 at gap 6,
 *                              28px notch circles at top -14 / bottom -14, left -4
 *   horizontal (detail / ticket) row 24 high, padding-inline 24, dashes 8x2 at gap 8,
 *                              28px notch circles at left -14 / right -14
 *
 * The cut-outs are `bg`-coloured circles with a 1px `line` outline; the card's
 * `overflow-hidden` clips them to half circles. Purely decorative → `aria-hidden`.
 */
import { cn } from '@/core/lib/cn';

const VERTICAL_DASHES = 9;
const HORIZONTAL_DASHES = 44;

/** The 28px circle that bites into the card edge. */
function Notch({ className }: { className?: string }) {
  return (
    <span
      className={cn('absolute size-7 rounded-pill border border-line bg-bg', className)}
    />
  );
}

export function PerforationVertical({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative flex w-5 shrink-0 flex-col items-center justify-center gap-1.5', className)}
    >
      {Array.from({ length: VERTICAL_DASHES }, (_, i) => (
        <span key={i} className="h-[7px] w-0.5 shrink-0 bg-line" />
      ))}
      <Notch className="-top-[14px] -left-1" />
      <Notch className="-bottom-[14px] -left-1" />
    </div>
  );
}

export function PerforationHorizontal({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative flex h-6 w-full shrink-0 items-center bg-surface px-6', className)}
    >
      <div className="flex flex-1 flex-row items-center justify-center gap-2">
        {Array.from({ length: HORIZONTAL_DASHES }, (_, i) => (
          <span key={i} className="h-0.5 w-2 shrink-0 bg-line" />
        ))}
      </div>
      <Notch className="-left-[14px] top-[-2px]" />
      <Notch className="-right-[14px] top-[-2px]" />
    </div>
  );
}
