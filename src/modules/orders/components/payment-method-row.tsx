'use client';

/**
 * One selectable payment row from `app-payment-method.html` (`mPoYa` / `A3L1D` / `YTAKc` / `kMOXd`):
 * 84 high, r20, padding-inline 22, gap 16; a 60×40 r10 brand/icon tile, the title 17/700 over a
 * 14/400 `ink2` sub-line, and the 26px radio on the right. The selected row is filled `brand-soft`.
 *
 * An expired card is rendered disabled (MM/YY in the past cannot be charged) with its reason as the
 * sub-line, per the validation note in screens/app-orders.md §1.
 */
import type { ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/core/lib/cn';
import { Radio } from '@/shared/ui';

export interface PaymentMethodRowProps {
  value: string;
  selected: boolean;
  disabled?: boolean;
  /** The 60×40 tile: a brand wordmark or an icon. */
  tile: ReactNode;
  title: string;
  subtitle?: string | null;
  /** Rendered after the radio (a delete button, say). */
  trailing?: ReactNode;
  className?: string;
}

export function PaymentMethodRow({
  value,
  selected,
  disabled = false,
  tile,
  title,
  subtitle,
  trailing,
  className,
}: PaymentMethodRowProps) {
  const id = useId();

  return (
    <div
      className={cn(
        'flex w-full items-center gap-4 rounded-lg border px-[22px] py-5 md:min-h-[84px] md:py-0',
        selected ? 'border-transparent bg-brand-soft' : 'border-line bg-surface',
        disabled ? 'opacity-50' : 'hover:border-ink3',
        className,
      )}
    >
      <label
        htmlFor={id}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-4 select-none',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <span aria-hidden="true" className="shrink-0">
          {tile}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate text-[17px] font-bold text-ink">{title}</span>
          {subtitle ? <span className="truncate text-label text-ink2">{subtitle}</span> : null}
        </span>
      </label>
      <Radio id={id} value={value} disabled={disabled} className="size-[26px]" />
      {trailing}
    </div>
  );
}

/** The 60×40 r10 tile: a coloured card wordmark (VISA / MC) or a neutral icon tile. */
export function MethodTile({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'visa' | 'mastercard' | 'neutral';
}) {
  return (
    <span
      className={cn(
        'flex h-10 w-[60px] items-center justify-center rounded-sm text-caption font-extrabold tracking-[0.04em]',
        tone === 'visa' && 'bg-sky text-white',
        tone === 'mastercard' && 'bg-brand text-white',
        tone === 'neutral' && 'bg-surface2 text-ink',
      )}
    >
      {children}
    </span>
  );
}
