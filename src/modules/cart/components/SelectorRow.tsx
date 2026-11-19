'use client';

/**
 * The summary card's selector row (`app-core/app-cart.html` nodes `spA3N` / `FxStd` / `Mg5M1`):
 * `bg` fill, radius 16, padding 14, gap 14 — a 40px `surface` tile with a 20px glyph, a 12/600
 * `ink3` label over a 15/600 `ink` value, and an 18px `chevron-right`.
 *
 * Renders as a `<button>` (or a `<Link>` when `href` is given) because every one of them opens
 * something: the address picker, the delivery-time sheet, the payment sheet.
 */
import type { ReactNode } from 'react';

import { Link } from '@/core/i18n';
import { cn } from '@/core/lib/cn';
import { ChevronRight, type LucideIcon } from '@/shared/lucide';

export interface SelectorRowProps {
  icon: LucideIcon;
  /** 12/600 `ink3` caption. */
  label: ReactNode;
  /** 15/600 `ink` value, or a skeleton bone while it loads. */
  value: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  /** Drawn in `brand` when something needs attention (no address yet). */
  tone?: 'default' | 'attention';
  className?: string;
}

export function SelectorRow({
  icon: Icon,
  label,
  value,
  onClick,
  href,
  disabled = false,
  tone = 'default',
  className,
}: SelectorRowProps) {
  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface',
          tone === 'attention' ? 'text-brand' : 'text-ink',
        )}
      >
        <Icon size={20} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
        <span className="text-micro font-semibold text-ink3">{label}</span>
        <span
          className={cn(
            'w-full truncate text-body-sm font-semibold',
            tone === 'attention' ? 'text-brand' : 'text-ink',
          )}
        >
          {value}
        </span>
      </span>

      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink3" />
    </>
  );

  const shell = cn(
    'flex w-full flex-row items-center gap-[14px] rounded-[16px] bg-bg p-[14px] text-left',
    'transition-colors duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
    'hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-60',
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={shell}>
      {body}
    </button>
  );
}
