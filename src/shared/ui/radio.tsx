'use client';

/**
 * <RadioGroup> / <Radio> — components.md §9.
 * 24px circle, border 1.5 `ink3` when off; on → 2px `brand` border + 12px `brand` dot.
 * Label 15/400, gap 10.
 */

import * as RadixRadioGroup from '@radix-ui/react-radio-group';
import * as React from 'react';

import { cn } from '@/core/lib/cn';

import { useFieldControl } from './field';

export interface RadioGroupProps extends RadixRadioGroup.RadioGroupProps {
  ref?: React.Ref<HTMLDivElement>;
}

export function RadioGroup({
  className,
  disabled,
  ref,
  ...rest
}: RadioGroupProps): React.ReactElement {
  const field = useFieldControl();
  return (
    <RadixRadioGroup.Root
      ref={ref}
      disabled={disabled ?? field?.disabled}
      aria-invalid={field?.state === 'error' || undefined}
      aria-describedby={field?.describedById}
      className={cn('flex flex-col gap-3', className)}
      {...rest}
    />
  );
}

export interface RadioProps extends Omit<RadixRadioGroup.RadioGroupItemProps, 'children'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  containerClassName?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Radio({
  label,
  description,
  className,
  containerClassName,
  id,
  disabled,
  value,
  ref,
  ...rest
}: RadioProps): React.ReactElement {
  const autoId = React.useId();
  const controlId = id ?? `${autoId}-${value}`;
  const hasText = Boolean(label) || Boolean(description);

  const dot = (
    <RadixRadioGroup.Item
      ref={ref}
      id={controlId}
      value={value}
      disabled={disabled}
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-pill border-[1.5px] border-ink3 bg-surface',
        'transition-[border-color,transform] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
        'data-[state=checked]:border-2 data-[state=checked]:border-brand',
        !disabled && 'hover:border-ink active:scale-[.97]',
        disabled && cn('cursor-not-allowed', !hasText && 'opacity-40'),
        className,
      )}
      {...rest}
    >
      <RadixRadioGroup.Indicator className="block size-3 rounded-pill bg-brand" />
    </RadixRadioGroup.Item>
  );

  if (!hasText) return dot;

  return (
    <label
      htmlFor={controlId}
      className={cn(
        'flex cursor-pointer items-start gap-2.5 select-none',
        disabled && 'cursor-not-allowed opacity-40',
        containerClassName,
      )}
    >
      {dot}
      <span className="flex min-w-0 flex-col gap-0.5 pt-px">
        {label ? <span className="text-body-sm font-normal text-ink">{label}</span> : null}
        {description ? (
          <span className="text-caption font-normal text-ink2">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
