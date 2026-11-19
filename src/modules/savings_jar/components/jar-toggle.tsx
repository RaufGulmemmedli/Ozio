'use client';

/**
 * The round-up switch as the design paints it: on the yellow tile the track is `$block` with a
 * `$yellow` knob, off it is `$surface2` with a white knob. `<Switch>` from `@/shared/ui` is
 * brand-tinted when checked, which reads wrong on yellow — so this is the design's own control,
 * built as a real `role="switch"` button.
 */
import { cn } from '@/core/lib/cn';

export interface JarToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** `aria-label`, since the control has no visible text of its own. */
  label: string;
  /** `yellow` sits on the active tile, `plain` on a surface. */
  tone?: 'yellow' | 'plain';
}

export function JarToggle({ checked, onChange, disabled, label, tone = 'plain' }: JarToggleProps) {
  const onYellow = tone === 'yellow';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-[30px] w-[52px] shrink-0 items-center rounded-pill p-[3px] transition-colors',
        'duration-[var(--oz-dur-fast)] ease-[var(--ease-out)]',
        checked ? (onYellow ? 'bg-block' : 'bg-success') : 'bg-surface2',
        checked ? 'justify-end' : 'justify-start',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-6 rounded-pill transition-transform',
          checked && onYellow ? 'bg-yellow' : 'bg-white',
        )}
      />
    </button>
  );
}
