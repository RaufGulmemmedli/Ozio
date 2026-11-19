'use client';

/**
 * <Checkbox> — components.md §9.
 * 24×24, radius 8, border 1.5 `ink3` + `surface` fill when off;
 * on → `brand` fill + 16px white check; indeterminate → dash.
 * Label 15/400, gap 10. Hover border `ink`.
 */

import * as RadixCheckbox from '@radix-ui/react-checkbox';
import * as React from 'react';

import { cn } from '@/core/lib/cn';
import { Check, Minus } from '@/shared/lucide';

import { useFieldControl } from './field';

export interface CheckboxProps extends Omit<RadixCheckbox.CheckboxProps, 'children'> {
  /** Rendered to the right of the box; the whole row becomes the hit target. */
  label?: React.ReactNode;
  /** Secondary line under the label (13/400 `ink2`). */
  description?: React.ReactNode;
  /** Classes for the `<label>` wrapper (the `className` prop styles the box). */
  containerClassName?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Checkbox({
  label,
  description,
  className,
  containerClassName,
  id,
  disabled,
  ref,
  ...rest
}: CheckboxProps): React.ReactElement {
  const field = useFieldControl();
  const autoId = React.useId();
  const controlId = id ?? field?.id ?? autoId;
  const isDisabled = disabled ?? field?.disabled;
  const hasText = Boolean(label) || Boolean(description);

  const box = (
    <RadixCheckbox.Root
      ref={ref}
      id={controlId}
      disabled={isDisabled}
      aria-invalid={field?.state === 'error' || undefined}
      aria-describedby={field?.describedById}
      className={cn(
        'group/oz-cb grid size-6 shrink-0 place-items-center rounded-[8px] border-[1.5px] border-ink3 bg-surface',
        'transition-[background-color,border-color,transform] duration-[var(--oz-dur-fast)] ease-[var(--oz-ease-out)]',
        'data-[state=checked]:border-brand data-[state=checked]:bg-brand',
        'data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand',
        !isDisabled && 'hover:border-ink active:scale-[.97]',
        isDisabled && cn('cursor-not-allowed', !hasText && 'opacity-40'),
        className,
      )}
      {...rest}
    >
      <RadixCheckbox.Indicator className="grid place-items-center text-on-cta">
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className="size-4 group-data-[state=indeterminate]/oz-cb:hidden"
        />
        <Minus
          aria-hidden="true"
          strokeWidth={3}
          className="hidden size-4 group-data-[state=indeterminate]/oz-cb:block"
        />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (!hasText) return box;

  return (
    <label
      htmlFor={controlId}
      className={cn(
        'flex cursor-pointer items-start gap-2.5 select-none',
        isDisabled && 'cursor-not-allowed opacity-40',
        containerClassName,
      )}
    >
      {box}
      <span className="flex min-w-0 flex-col gap-0.5 pt-px">
        {label ? <span className="text-body-sm font-normal text-ink">{label}</span> : null}
        {description ? (
          <span className="text-caption font-normal text-ink2">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
