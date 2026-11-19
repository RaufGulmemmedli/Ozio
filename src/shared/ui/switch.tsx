'use client';

/**
 * <Switch> — components.md §9 ("Toggle").
 * 52×30, radius 15, padding 3; on → `brand` with the knob right, off → `surface2`
 * with the knob left; knob = 24px white circle, slide 160ms.
 */

import * as RadixSwitch from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/core/lib/cn';

import { useFieldControl } from './field';

export interface SwitchProps extends Omit<RadixSwitch.SwitchProps, 'children'> {
  /** Rendered to the right of the track; the whole row becomes the hit target. */
  label?: React.ReactNode;
  description?: React.ReactNode;
  containerClassName?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Switch({
  label,
  description,
  className,
  containerClassName,
  id,
  disabled,
  ref,
  ...rest
}: SwitchProps): React.ReactElement {
  const field = useFieldControl();
  const autoId = React.useId();
  const controlId = id ?? field?.id ?? autoId;
  const isDisabled = disabled ?? field?.disabled;
  const hasText = Boolean(label) || Boolean(description);

  const track = (
    <RadixSwitch.Root
      ref={ref}
      id={controlId}
      disabled={isDisabled}
      aria-describedby={field?.describedById}
      className={cn(
        'relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-[15px] bg-surface2 p-[3px]',
        'transition-colors duration-[160ms] ease-[var(--oz-ease-out)]',
        'data-[state=checked]:bg-brand',
        isDisabled && cn('cursor-not-allowed', !hasText && 'opacity-40'),
        !isDisabled && 'cursor-pointer',
        className,
      )}
      {...rest}
    >
      <RadixSwitch.Thumb
        className={cn(
          'block size-6 rounded-pill bg-white',
          'transition-transform duration-[160ms] ease-[var(--oz-ease-out)]',
          'translate-x-0 data-[state=checked]:translate-x-[22px]',
        )}
      />
    </RadixSwitch.Root>
  );

  if (!hasText) return track;

  return (
    <label
      htmlFor={controlId}
      className={cn(
        'flex cursor-pointer items-center justify-between gap-4 select-none',
        isDisabled && 'cursor-not-allowed opacity-40',
        containerClassName,
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        {label ? <span className="text-body-sm font-medium text-ink">{label}</span> : null}
        {description ? (
          <span className="text-caption font-normal text-ink2">{description}</span>
        ) : null}
      </span>
      {track}
    </label>
  );
}
