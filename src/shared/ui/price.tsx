'use client';

/**
 * <Price> — money, rendered with tabular numerals.
 *
 * The string ALWAYS comes from `useFormat().money` (`@/core/i18n/format`), which
 * owns the locale, the comma decimal and the `₼` sign. Never format money inline.
 *
 * Sizes map to the type roles in typography.md §1 ("price"):
 *   sm 15/700 · row 18/700 (cart row) · card 20/700 (product card, default)
 *   total 28/800 (cart total) · page 40/800 (product page) · balance 44/800 (Ozio Card)
 */

import * as React from 'react';

import { useFormat } from '@/core/i18n/format';
import { cn } from '@/core/lib/cn';

export type PriceSize = 'sm' | 'row' | 'card' | 'total' | 'page' | 'balance';
export type PriceTone =
  | 'ink'
  | 'ink2'
  | 'ink3'
  | 'brand'
  | 'success'
  | 'on-cta'
  | 'on-block'
  | 'white'
  | 'inherit';

const SIZES: Record<PriceSize, string> = {
  sm: 'text-body-sm font-bold',
  row: 'text-[18px] font-bold',
  card: 'text-h4 font-bold',
  total: 'text-[28px] font-extrabold tracking-[-0.02em]',
  page: 'text-[40px] font-extrabold tracking-[-0.025em]',
  balance: 'text-[44px] font-extrabold tracking-[-0.025em]',
};

const TONES: Record<PriceTone, string> = {
  ink: 'text-ink',
  ink2: 'text-ink2',
  ink3: 'text-ink3',
  brand: 'text-brand',
  success: 'text-success',
  'on-cta': 'text-on-cta',
  'on-block': 'text-on-block',
  white: 'text-white',
  inherit: '',
};

export interface PriceProps extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Amount in manat. Server data — never computed here. */
  value: number;
  size?: PriceSize;
  tone?: PriceTone;
  /** Old price: `line-through text-ink3`, one step down in weight. */
  strike?: boolean;
  ref?: React.Ref<HTMLSpanElement>;
}

export function Price({
  value,
  size = 'card',
  tone = 'ink',
  strike = false,
  className,
  ref,
  ...rest
}: PriceProps): React.ReactElement {
  const { money } = useFormat();

  return (
    <span
      ref={ref}
      className={cn(
        'whitespace-nowrap tabular-nums',
        SIZES[size],
        strike ? 'text-ink3 line-through' : TONES[tone],
        className,
      )}
      {...rest}
    >
      {money(value)}
    </span>
  );
}
