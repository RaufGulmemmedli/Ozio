'use client';

/**
 * The 5-star input from `app-order-rating.html` (`kLFEX` / `hfS24`): 36px stars, gap 10.
 *
 * A `role="radiogroup"` of five radios, so arrow keys move between stars and the current value is
 * announced — the a11y contract in screens/app-orders.md §10.
 */
import { useTranslations } from 'next-intl';
import { cn } from '@/core/lib/cn';
import { Star } from '@/shared/lucide';

export interface StarRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  /** Accessible name of the group, already localized. */
  label: string;
  disabled?: boolean;
  size?: number;
  className?: string;
}

const STARS = [1, 2, 3, 4, 5] as const;

export function StarRating({
  value,
  onChange,
  label,
  disabled = false,
  size = 36,
  className,
}: StarRatingProps) {
  const t = useTranslations('orders');

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex items-center gap-2.5', className)}
    >
      {STARS.map((star) => {
        const active = value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={t('rating.stars', { count: star })}
            disabled={disabled}
            // Only the selected star (or the first, when nothing is selected) is tabbable.
            tabIndex={value === star || (value === null && star === 1) ? 0 : -1}
            onClick={() => onChange(star)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                onChange(Math.min(5, (value ?? 0) + 1));
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                onChange(Math.max(1, (value ?? 1) - 1));
              }
            }}
            className={cn(
              'grid place-items-center rounded-sm transition-transform duration-[var(--oz-dur-fast)]',
              !disabled && 'hover:scale-105 active:scale-95',
              disabled && 'cursor-not-allowed opacity-50',
              active ? 'text-yellow' : 'text-line',
            )}
            style={{ width: size, height: size }}
          >
            <Star size={size} fill="currentColor" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
