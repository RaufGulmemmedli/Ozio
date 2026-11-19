/**
 * The 24-high dashed strip with two 28px notch cut-outs, measured from
 * `app-lotereya-bilet.html` (`Perforation` → `Dash Line` 8x2 dashes at gap 8,
 * `Notch Left` / `Notch Right` at left/right -14, top -2).
 *
 * Decorative → `aria-hidden`.
 *
 * TODO(core): `@/modules/coupons` carries the same strip; a shared `<Perforation>` in
 * `@/shared/ui` would remove the duplicate (modules may not import each other's internals).
 */
import { cn } from '@/core/lib/cn';

const DASHES = 44;

export function TicketPerforation({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative flex h-6 w-full shrink-0 items-center bg-surface px-6', className)}
    >
      <div className="flex flex-1 flex-row items-center justify-center gap-2">
        {Array.from({ length: DASHES }, (_, i) => (
          <span key={i} className="h-0.5 w-2 shrink-0 bg-line" />
        ))}
      </div>
      <span className="absolute -left-[14px] top-[-2px] size-7 rounded-pill border border-line bg-bg" />
      <span className="absolute -right-[14px] top-[-2px] size-7 rounded-pill border border-line bg-bg" />
    </div>
  );
}
